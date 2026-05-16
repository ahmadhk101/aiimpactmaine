import { requireAdmin, json } from "../../../_shared/auth.js";
import {
  PROJECT_STATUSES,
  PROJECT_TYPES,
  TASK_PRIORITIES,
  clampInt,
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
  name: value => clean(value, 250),
  description: value => clean(value, 4000),
  client_id: value => intOrNull(value),
  lead_id: value => intOrNull(value),
  project_type: value => valueIn(value, PROJECT_TYPES, "other"),
  status: value => valueIn(value, PROJECT_STATUSES, "planning"),
  priority: value => valueIn(value, TASK_PRIORITIES, "medium"),
  start_date: value => clean(value, 80),
  target_end_date: value => clean(value, 80),
  actual_end_date: value => clean(value, 80),
  progress_percent: value => clampInt(value, 0, 100, 0),
  owner: value => clean(value, 200),
  budget: value => intOrNull(value),
  notes: value => clean(value, 5000),
  archived_at: value => clean(value, 80),
};

export async function onRequestGet({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const id = idFromRequest(request, params);
  if (!id) return json({ error: "id required" }, 400);

  try {
    const project = await env.DB.prepare(
      `SELECT p.*, c.name AS client_name, c.company AS client_company, l.name AS lead_name
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       LEFT JOIN leads l ON l.id = p.lead_id
       WHERE p.id = ?`
    ).bind(id).first();
    if (!project) return json({ error: "not found" }, 404);

    const { results: milestones } = await env.DB.prepare(
      "SELECT * FROM project_milestones WHERE project_id = ? ORDER BY sort_order ASC, date(due_date) ASC, created_at ASC"
    ).bind(id).all();
    const { results: updates } = await env.DB.prepare(
      "SELECT * FROM project_updates WHERE project_id = ? ORDER BY created_at DESC LIMIT 100"
    ).bind(id).all();
    return json({ project, milestones, updates });
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
  if (body.status === "archived" && !body.archived_at) body.archived_at = new Date().toISOString();
  if (body.status === "completed" && !body.actual_end_date) body.actual_end_date = new Date().toISOString().slice(0, 10);

  try {
    const result = await updateRow(env, "projects", id, body, FIELDS);
    if (result.error) return json({ error: result.error }, 400);
    const eventType = body.status === "completed" ? "project_completed" : "project_updated";
    await logProductivityActivity(env, request, eventType, body.name || `Project #${id}`);
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
    const project = await env.DB.prepare("SELECT name FROM projects WHERE id = ?").bind(id).first();
    await env.DB.prepare(
      "UPDATE projects SET status = 'archived', archived_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(id).run();
    await logProductivityActivity(env, request, "project_archived", project?.name || `Project #${id}`);
    return json({ archived: id });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
