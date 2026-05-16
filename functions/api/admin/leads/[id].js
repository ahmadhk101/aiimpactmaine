import { requireAdmin, json } from "../../../_shared/auth.js";
import {
  LEAD_STATUSES,
  clean,
  idFromRequest,
  isMissingTable,
  logProductivityActivity,
  readJson,
  updateRow,
  valueIn,
} from "../_productivity.js";

const FIELDS = {
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

export async function onRequestGet({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const id = idFromRequest(request, params);
  if (!id) return json({ error: "id required" }, 400);

  const lead = await env.DB.prepare("SELECT * FROM leads WHERE id = ?").bind(id).first();
  if (!lead) return json({ error: "not found" }, 404);
  let followUps = [];
  try {
    ({ results: followUps } = await env.DB.prepare(
      "SELECT * FROM follow_ups WHERE lead_id = ? ORDER BY date(due_date) ASC, created_at DESC"
    ).bind(id).all());
  } catch (err) {
    if (!isMissingTable(err)) throw err;
  }
  return json({ lead, follow_ups: followUps });
}

export async function onRequestPut({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const id = idFromRequest(request, params);
  if (!id) return json({ error: "id required" }, 400);

  const body = await readJson(request);
  const result = await updateRow(env, "leads", id, body, FIELDS);
  if (result.error) return json({ error: result.error }, 400);
  await logProductivityActivity(env, request, "lead_updated", body.status || body.name || `Lead #${id}`);
  return json({ id, ...result });
}

export const onRequestPatch = onRequestPut;
