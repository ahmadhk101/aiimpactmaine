import { requireAdmin, json } from "../../../_shared/auth.js";
import {
  FOLLOW_UP_STATUSES,
  clean,
  idFromRequest,
  intOrNull,
  isMissingTable,
  logProductivityActivity,
  missingMigrationResponse,
  readJson,
  updateRow,
  valueIn,
} from "../_productivity.js";

const FIELDS = {
  lead_id: value => intOrNull(value),
  client_id: value => intOrNull(value),
  contact_id: value => intOrNull(value),
  title: value => clean(value, 200),
  notes: value => clean(value, 4000),
  due_date: value => clean(value, 80),
  status: value => valueIn(value, FOLLOW_UP_STATUSES, "open"),
  completed_at: value => clean(value, 80),
};

export async function onRequestGet({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const id = idFromRequest(request, params);
  if (!id) return json({ error: "id required" }, 400);

  try {
    const followUp = await env.DB.prepare(
      `SELECT f.*, l.name AS lead_name, l.email AS lead_email, c.name AS client_name
       FROM follow_ups f
       LEFT JOIN leads l ON l.id = f.lead_id
       LEFT JOIN clients c ON c.id = f.client_id
       WHERE f.id = ?`
    ).bind(id).first();
    if (!followUp) return json({ error: "not found" }, 404);
    return json({ follow_up: followUp });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}

export async function onRequestPut({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const id = idFromRequest(request, params);
  if (!id) return json({ error: "id required" }, 400);
  const body = await readJson(request);
  if (body.status === "completed" && !body.completed_at) body.completed_at = new Date().toISOString();

  try {
    const result = await updateRow(env, "follow_ups", id, body, FIELDS);
    if (result.error) return json({ error: result.error }, 400);
    const eventType = body.status === "completed" ? "follow_up_completed" : "follow_up_updated";
    await logProductivityActivity(env, request, eventType, body.title || `Follow-up #${id}`);
    return json({ id, ...result });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}

export const onRequestPatch = onRequestPut;

export async function onRequestDelete({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const id = idFromRequest(request, params);
  if (!id) return json({ error: "id required" }, 400);

  try {
    const followUp = await env.DB.prepare("SELECT title FROM follow_ups WHERE id = ?").bind(id).first();
    await env.DB.prepare("DELETE FROM follow_ups WHERE id = ?").bind(id).run();
    await logProductivityActivity(env, request, "follow_up_deleted", followUp?.title || `Follow-up #${id}`);
    return json({ deleted: id });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
