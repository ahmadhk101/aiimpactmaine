import { requireAdmin, json } from "../../../../_shared/auth.js";
import { clean, idFromRequest, intOrNull, isMissingTable, logProductivityActivity, missingMigrationResponse, readJson } from "../../_productivity.js";
import { cents, crmStage } from "../_shared.js";

export async function onRequestPut({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const id = idFromRequest(request, params);
  if (!id) return json({ error: "id required" }, 400);

  const body = await readJson(request);
  const fields = {
    contact_id: value => intOrNull(value),
    company_id: value => intOrNull(value),
    lead_id: value => intOrNull(value),
    name: value => clean(value, 300),
    stage: value => crmStage(value),
    amount_cents: value => cents(value),
    expected_close_date: value => clean(value, 80),
    owner: value => clean(value, 200),
    notes: value => clean(value, 5000),
  };
  const updates = [];
  const values = [];
  for (const [field, transform] of Object.entries(fields)) {
    if (field in body) {
      updates.push(`${field} = ?`);
      values.push(transform(body[field]));
    }
  }
  if (!updates.length) return json({ error: "no fields to update" }, 400);

  try {
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    await env.DB.prepare(`UPDATE crm_deals SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
    await logProductivityActivity(env, request, "crm_deal_updated", body.name || `Deal #${id}`);
    return json({ id, updated: true });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
