import { requireAdmin, json } from "../../../_shared/auth.js";
import { clean, intOrNull, isMissingTable, logProductivityActivity, missingMigrationResponse, readJson } from "../_productivity.js";
import { crmStage, findOrCreateCompany, isValidEmail, normalizeEmail, upsertContactDetails } from "./_shared.js";

function contactBase(body) {
  const email = normalizeEmail(body.email);
  return {
    name: clean(body.name, 300) || email,
    email,
    phone: clean(body.phone, 100),
    organization: clean(body.organization || body.company, 300),
    role: clean(body.role || body.title, 200),
    notes: clean(body.notes, 5000),
    source: clean(body.source, 200),
    status: clean(body.contact_status, 100) || "active",
    client_id: intOrNull(body.client_id),
    lead_id: intOrNull(body.lead_id),
  };
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const url = new URL(request.url);
  const q = clean(url.searchParams.get("q"), 200);
  const stage = clean(url.searchParams.get("stage"), 80);
  const companyId = intOrNull(url.searchParams.get("company_id"));
  const staleDays = intOrNull(url.searchParams.get("stale_days"));
  const where = [];
  const params = [];

  if (q) {
    where.push(`lower(
      COALESCE(c.name, '') || ' ' || COALESCE(c.email, '') || ' ' ||
      COALESCE(c.phone, '') || ' ' || COALESCE(c.organization, '') || ' ' ||
      COALESCE(d.tags, '') || ' ' || COALESCE(co.name, '')
    ) LIKE ?`);
    params.push(`%${q.toLowerCase()}%`);
  }
  if (stage && stage !== "all") {
    where.push("COALESCE(d.lifecycle_stage, 'new') = ?");
    params.push(crmStage(stage));
  }
  if (companyId) {
    where.push("d.company_id = ?");
    params.push(companyId);
  }
  if (staleDays) {
    where.push("(d.last_contacted_at IS NULL OR date(d.last_contacted_at) <= date('now', ?))");
    params.push(`-${staleDays} days`);
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT c.id, c.client_id, c.lead_id, c.name, c.email, c.phone, c.organization, c.role,
              c.notes, c.source, c.status AS contact_status, c.created_at, c.updated_at,
              d.company_id, d.title, d.tags, d.lifecycle_stage, d.lead_status, d.owner,
              d.last_contacted_at, d.next_follow_up_date, d.follow_up_notes, d.source AS crm_source,
              co.name AS company_name, co.website AS company_website, co.industry AS company_industry,
              co.location AS company_location,
              (SELECT COUNT(*) FROM crm_activities a WHERE a.contact_id = c.id) AS activity_count,
              CAST(julianday('now') - julianday(COALESCE(d.last_contacted_at, c.updated_at, c.created_at)) AS INTEGER) AS days_since_contact
       FROM contacts c
       LEFT JOIN crm_contact_details d ON d.contact_id = c.id
       LEFT JOIN crm_companies co ON co.id = d.company_id
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY
         CASE WHEN d.next_follow_up_date IS NULL OR d.next_follow_up_date = '' THEN 1 ELSE 0 END,
         date(d.next_follow_up_date) ASC,
         c.updated_at DESC
       LIMIT 500`
    ).bind(...params).all();

    return json({ contacts: results });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const body = await readJson(request);
  const contact = contactBase(body);
  if (!contact.email || !isValidEmail(contact.email)) return json({ error: "valid email required" }, 400);

  try {
    const companyId = await findOrCreateCompany(env, body.company || body.organization, {
      website: body.company_website,
      industry: body.company_industry,
      location: body.company_location,
      source: body.source,
    });
    const { meta } = await env.DB.prepare(
      `INSERT INTO contacts (client_id, lead_id, name, email, phone, organization, role, notes, source, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      contact.client_id, contact.lead_id, contact.name, contact.email, contact.phone,
      contact.organization, contact.role, contact.notes, contact.source, contact.status
    ).run();

    await upsertContactDetails(env, meta.last_row_id, body, companyId);
    await logProductivityActivity(env, request, "crm_contact_created", `${contact.name} <${contact.email}>`);
    return json({ id: meta.last_row_id }, 201);
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
