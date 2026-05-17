import { requireAdmin, json } from "../../../../_shared/auth.js";
import { clean, idFromRequest, isMissingTable, logProductivityActivity, missingMigrationResponse, readJson } from "../../_productivity.js";

export async function onRequestPut({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const id = idFromRequest(request, params);
  if (!id) return json({ error: "id required" }, 400);

  const body = await readJson(request);
  const fields = {
    name: value => clean(value, 300),
    website: value => clean(value, 500),
    industry: value => clean(value, 200),
    location: value => clean(value, 300),
    notes: value => clean(value, 3000),
    source: value => clean(value, 200),
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
    await env.DB.prepare(`UPDATE crm_companies SET ${updates.join(", ")} WHERE id = ?`).bind(...values).run();
    await logProductivityActivity(env, request, "crm_company_updated", body.name || `Company #${id}`);
    return json({ id, updated: true });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
