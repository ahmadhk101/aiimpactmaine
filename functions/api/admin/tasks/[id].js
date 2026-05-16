import { requireAdmin, json } from "../../../_shared/auth.js";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
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
  title: value => clean(value, 200),
  description: value => clean(value, 4000),
  status: value => valueIn(value, TASK_STATUSES, "open"),
  priority: value => valueIn(value, TASK_PRIORITIES, "medium"),
  due_date: value => clean(value, 80),
  client_id: value => intOrNull(value),
  related_lead_id: value => intOrNull(value),
  assigned_to: value => clean(value, 200),
};

export async function onRequestGet({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const id = idFromRequest(request, params);
  if (!id) return json({ error: "id required" }, 400);

  try {
    const task = await env.DB.prepare(
      `SELECT t.*, c.name AS client_name, l.name AS lead_name, l.email AS lead_email
       FROM tasks t
       LEFT JOIN clients c ON c.id = t.client_id
       LEFT JOIN leads l ON l.id = t.related_lead_id
       WHERE t.id = ?`
    ).bind(id).first();
    if (!task) return json({ error: "not found" }, 404);
    return json({ task });
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

  try {
    const result = await updateRow(env, "tasks", id, body, FIELDS);
    if (result.error) return json({ error: result.error }, 400);
    const eventType = body.status === "completed" ? "task_completed" : "task_updated";
    await logProductivityActivity(env, request, eventType, body.title || `Task #${id}`);
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
    const task = await env.DB.prepare("SELECT title FROM tasks WHERE id = ?").bind(id).first();
    await env.DB.prepare("DELETE FROM tasks WHERE id = ?").bind(id).run();
    await logProductivityActivity(env, request, "task_deleted", task?.title || `Task #${id}`);
    return json({ deleted: id });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
