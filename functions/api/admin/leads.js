import { requireAdmin, json } from "../../_shared/auth.js";
import { LEAD_STATUSES, clean, idFromRequest, isMissingTable, logProductivityActivity, readJson, updateRow, valueIn } from "./_productivity.js";

const LEAD_FIELDS = {
  source: value => clean(value, 200),
  name: value => clean(value, 300),
  email: value => clean(value, 320),
  phone: value => clean(value, 100),
  organization: value => clean(value, 300),
  role: value => clean(value, 200),
  sector: value => clean(value, 200),
  interest: value => clean(value, 500),
  message: value => clean(value, 5000),
  status: value => valueIn(value, LEAD_STATUSES, "new"),
};

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  let results;
  try {
    ({ results } = await env.DB.prepare(
      `SELECT l.id, l.source, l.name, l.email, l.phone, l.organization, l.interest, l.message,
              l.package_name, l.resource_url, l.page_url, l.status, l.created_at, l.updated_at,
              (SELECT due_date FROM follow_ups f WHERE f.lead_id = l.id AND f.status = 'open' ORDER BY date(f.due_date) ASC LIMIT 1) AS next_follow_up_date,
              (SELECT notes FROM follow_ups f WHERE f.lead_id = l.id AND f.status = 'open' ORDER BY date(f.due_date) ASC LIMIT 1) AS next_follow_up_notes
       FROM leads l
       ORDER BY l.created_at DESC
       LIMIT 250`
    ).all());
  } catch (err) {
    if (!isMissingTable(err)) throw err;
    ({ results } = await env.DB.prepare(
      `SELECT id, source, name, email, phone, organization, interest, message,
              package_name, resource_url, page_url, status, created_at, updated_at
       FROM leads
       ORDER BY created_at DESC
       LIMIT 250`
    ).all());
  }

  return json({ leads: results });
}

export async function onRequestPatch({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const { id, status } = await readJson(request);
  if (!id || !status) return json({ error: "id and status required" }, 400);
  if (!LEAD_STATUSES.includes(status)) {
    return json({ error: "invalid status" }, 400);
  }

  await env.DB.prepare("UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(status, id)
    .run();

  await logProductivityActivity(env, request, "lead_updated", `Lead #${id}: ${status}`);
  return json({ id, status });
}

export async function onRequestPut({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const body = await readJson(request);
  const id = idFromRequest(request, { id: body.id });
  if (!id) return json({ error: "id required" }, 400);

  const result = await updateRow(env, "leads", id, body, LEAD_FIELDS);
  if (result.error) return json({ error: result.error }, 400);
  await logProductivityActivity(env, request, "lead_updated", body.status || body.name || `Lead #${id}`);
  return json({ id, ...result });
}
