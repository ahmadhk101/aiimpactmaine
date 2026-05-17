import { requireAdmin, json } from "../../../_shared/auth.js";
import { clean, isMissingTable, logProductivityActivity, missingMigrationResponse, readJson } from "../_productivity.js";
import { findOrCreateCompany } from "./_shared.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const q = clean(new URL(request.url).searchParams.get("q"), 200);
  const params = [];
  const where = q ? "WHERE lower(co.name || ' ' || COALESCE(co.industry, '') || ' ' || COALESCE(co.location, '')) LIKE ?" : "";
  if (q) params.push(`%${q.toLowerCase()}%`);

  try {
    const { results } = await env.DB.prepare(
      `SELECT co.*,
              COUNT(d.contact_id) AS contact_count,
              MAX(d.last_contacted_at) AS last_contacted_at,
              MIN(CASE WHEN d.next_follow_up_date IS NOT NULL AND d.next_follow_up_date != '' THEN d.next_follow_up_date END) AS next_follow_up_date
       FROM crm_companies co
       LEFT JOIN crm_contact_details d ON d.company_id = co.id
       ${where}
       GROUP BY co.id
       ORDER BY co.updated_at DESC, co.name ASC
       LIMIT 300`
    ).bind(...params).all();
    return json({ companies: results });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const body = await readJson(request);
  const name = clean(body.name, 300);
  if (!name) return json({ error: "name required" }, 400);

  try {
    const id = await findOrCreateCompany(env, name, body);
    await env.DB.prepare(
      `UPDATE crm_companies
       SET website = COALESCE(?, website),
           industry = COALESCE(?, industry),
           location = COALESCE(?, location),
           notes = COALESCE(?, notes),
           source = COALESCE(?, source),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(
      clean(body.website, 500),
      clean(body.industry, 200),
      clean(body.location, 300),
      clean(body.notes, 3000),
      clean(body.source, 200),
      id
    ).run();
    await logProductivityActivity(env, request, "crm_company_saved", name);
    return json({ id }, 201);
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
