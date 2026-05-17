import { requireAdmin, json } from "../../../_shared/auth.js";
import { clean, intOrNull, isMissingTable, logProductivityActivity, missingMigrationResponse, readJson } from "../_productivity.js";
import { crmActivityType } from "./_shared.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const url = new URL(request.url);
  const contactId = intOrNull(url.searchParams.get("contact_id"));
  const companyId = intOrNull(url.searchParams.get("company_id"));
  const leadId = intOrNull(url.searchParams.get("lead_id"));
  const where = [];
  const params = [];
  if (contactId) { where.push("a.contact_id = ?"); params.push(contactId); }
  if (companyId) { where.push("a.company_id = ?"); params.push(companyId); }
  if (leadId) { where.push("a.lead_id = ?"); params.push(leadId); }

  try {
    const { results } = await env.DB.prepare(
      `SELECT a.*, c.name AS contact_name, c.email AS contact_email, co.name AS company_name, l.name AS lead_name
       FROM crm_activities a
       LEFT JOIN contacts c ON c.id = a.contact_id
       LEFT JOIN crm_companies co ON co.id = a.company_id
       LEFT JOIN leads l ON l.id = a.lead_id
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY datetime(a.activity_date) DESC, a.created_at DESC
       LIMIT 250`
    ).bind(...params).all();
    return json({ activities: results });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const body = await readJson(request);
  const contactId = intOrNull(body.contact_id);
  const companyId = intOrNull(body.company_id);
  const leadId = intOrNull(body.lead_id);
  const type = crmActivityType(body.activity_type);
  const subject = clean(body.subject, 300);
  const notes = clean(body.notes, 5000);
  const activityDate = clean(body.activity_date, 80) || new Date().toISOString();
  if (!contactId && !companyId && !leadId) return json({ error: "contact_id, company_id, or lead_id required" }, 400);
  if (!subject && !notes) return json({ error: "subject or notes required" }, 400);

  try {
    const { meta } = await env.DB.prepare(
      `INSERT INTO crm_activities
       (contact_id, company_id, lead_id, activity_type, subject, notes, activity_date, outcome, next_follow_up_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      contactId,
      companyId,
      leadId,
      type,
      subject,
      notes,
      activityDate,
      clean(body.outcome, 500),
      clean(body.next_follow_up_date, 80)
    ).run();

    if (contactId) {
      const shouldUpdateLast = ["email", "call", "meeting", "proposal"].includes(type);
      await env.DB.prepare(
        `INSERT INTO crm_contact_details (contact_id, company_id, last_contacted_at, next_follow_up_date, follow_up_notes)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(contact_id) DO UPDATE SET
           company_id = COALESCE(excluded.company_id, company_id),
           last_contacted_at = CASE WHEN ? THEN excluded.last_contacted_at ELSE last_contacted_at END,
           next_follow_up_date = COALESCE(excluded.next_follow_up_date, next_follow_up_date),
           follow_up_notes = COALESCE(excluded.follow_up_notes, follow_up_notes),
           updated_at = CURRENT_TIMESTAMP`
      ).bind(
        contactId,
        companyId,
        activityDate,
        clean(body.next_follow_up_date, 80),
        notes,
        shouldUpdateLast ? 1 : 0
      ).run();
    }

    await logProductivityActivity(env, request, "crm_activity_created", subject || type);
    return json({ id: meta.last_row_id }, 201);
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
