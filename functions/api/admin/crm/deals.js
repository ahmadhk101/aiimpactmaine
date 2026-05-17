import { requireAdmin, json } from "../../../_shared/auth.js";
import { clean, intOrNull, isMissingTable, logProductivityActivity, missingMigrationResponse, readJson } from "../_productivity.js";
import { cents, crmStage } from "./_shared.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const stage = clean(new URL(request.url).searchParams.get("stage"), 80);
  const where = stage && stage !== "all" ? "WHERE d.stage = ?" : "";
  const params = where ? [crmStage(stage)] : [];

  try {
    const { results } = await env.DB.prepare(
      `SELECT d.*, c.name AS contact_name, c.email AS contact_email, co.name AS company_name
       FROM crm_deals d
       LEFT JOIN contacts c ON c.id = d.contact_id
       LEFT JOIN crm_companies co ON co.id = d.company_id
       ${where}
       ORDER BY d.updated_at DESC
       LIMIT 250`
    ).bind(...params).all();
    return json({ deals: results });
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
    const { meta } = await env.DB.prepare(
      `INSERT INTO crm_deals
       (contact_id, company_id, lead_id, name, stage, amount_cents, expected_close_date, owner, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      intOrNull(body.contact_id),
      intOrNull(body.company_id),
      intOrNull(body.lead_id),
      name,
      crmStage(body.stage),
      cents(body.amount || body.amount_dollars || body.amount_cents),
      clean(body.expected_close_date, 80),
      clean(body.owner, 200),
      clean(body.notes, 5000)
    ).run();
    await logProductivityActivity(env, request, "crm_deal_created", name);
    return json({ id: meta.last_row_id }, 201);
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
