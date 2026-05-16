import { requireAdmin, json } from "../../../../_shared/auth.js";
import {
  MILESTONE_STATUSES,
  clean,
  idFromRequest,
  intOrNull,
  isMissingTable,
  logProductivityActivity,
  missingMigrationResponse,
  readJson,
  updateRow,
  valueIn,
} from "../../_productivity.js";

const FIELDS = {
  title: value => clean(value, 200),
  description: value => clean(value, 3000),
  due_date: value => clean(value, 80),
  completed_at: value => clean(value, 80),
  status: value => valueIn(value, MILESTONE_STATUSES, "not_started"),
  sort_order: value => intOrNull(value) || 0,
};

export async function onRequestGet({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const projectId = idFromRequest(request, params);
  if (!projectId) return json({ error: "project id required" }, 400);

  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM project_milestones WHERE project_id = ? ORDER BY sort_order ASC, date(due_date) ASC, created_at ASC"
    ).bind(projectId).all();
    return json({ milestones: results });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}

export async function onRequestPost({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const projectId = idFromRequest(request, params);
  if (!projectId) return json({ error: "project id required" }, 400);
  const body = await readJson(request);
  const title = clean(body.title, 200);
  if (!title) return json({ error: "title required" }, 400);

  try {
    const status = valueIn(body.status, MILESTONE_STATUSES, "not_started");
    const completedAt = status === "completed" ? new Date().toISOString() : clean(body.completed_at, 80);
    const { meta } = await env.DB.prepare(
      `INSERT INTO project_milestones
       (project_id, title, description, due_date, completed_at, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      projectId, title, clean(body.description, 3000), clean(body.due_date, 80),
      completedAt, status, intOrNull(body.sort_order) || 0
    ).run();
    await logProductivityActivity(env, request, "milestone_created", title);
    return json({ id: meta.last_row_id, project_id: projectId }, 201);
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}

export async function onRequestPut({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const projectId = idFromRequest(request, params);
  if (!projectId) return json({ error: "project id required" }, 400);
  const body = await readJson(request);
  const id = intOrNull(body.id);
  if (!id) return json({ error: "milestone id required" }, 400);
  if (body.status === "completed" && !body.completed_at) body.completed_at = new Date().toISOString();

  try {
    const result = await updateRow(env, "project_milestones", id, body, FIELDS);
    if (result.error) return json({ error: result.error }, 400);
    await env.DB.prepare("UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(projectId).run();
    const eventType = body.status === "completed" ? "milestone_completed" : "milestone_updated";
    await logProductivityActivity(env, request, eventType, body.title || `Milestone #${id}`);
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
  const projectId = idFromRequest(request, params);
  const milestoneId = intOrNull(new URL(request.url).searchParams.get("milestone_id"));
  if (!projectId || !milestoneId) return json({ error: "project id and milestone_id required" }, 400);

  try {
    const milestone = await env.DB.prepare("SELECT title FROM project_milestones WHERE id = ? AND project_id = ?")
      .bind(milestoneId, projectId).first();
    await env.DB.prepare("DELETE FROM project_milestones WHERE id = ? AND project_id = ?").bind(milestoneId, projectId).run();
    await env.DB.prepare("UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(projectId).run();
    await logProductivityActivity(env, request, "milestone_deleted", milestone?.title || `Milestone #${milestoneId}`);
    return json({ deleted: milestoneId });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
