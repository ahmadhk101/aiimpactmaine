import { requireAdmin, json } from "../../../../_shared/auth.js";
import {
  clampInt,
  clean,
  idFromRequest,
  isMissingTable,
  logProductivityActivity,
  missingMigrationResponse,
  readJson,
} from "../../_productivity.js";

export async function onRequestGet({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const projectId = idFromRequest(request, params);
  if (!projectId) return json({ error: "project id required" }, 400);

  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM project_updates WHERE project_id = ? ORDER BY created_at DESC LIMIT 100"
    ).bind(projectId).all();
    return json({ updates: results });
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
  const updateText = clean(body.update_text, 5000);
  if (!updateText) return json({ error: "update_text required" }, 400);

  try {
    const project = await env.DB.prepare("SELECT status, progress_percent FROM projects WHERE id = ?").bind(projectId).first();
    if (!project) return json({ error: "project not found" }, 404);

    const statusSnapshot = clean(body.status_snapshot, 100) || project.status;
    const progressSnapshot = body.progress_snapshot == null
      ? project.progress_percent
      : clampInt(body.progress_snapshot, 0, 100, project.progress_percent || 0);

    const { meta } = await env.DB.prepare(
      `INSERT INTO project_updates
       (project_id, update_text, status_snapshot, progress_snapshot, next_step)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      projectId, updateText, statusSnapshot, progressSnapshot, clean(body.next_step, 2000)
    ).run();
    await env.DB.prepare("UPDATE projects SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(projectId).run();
    await logProductivityActivity(env, request, "project_update_added", updateText.slice(0, 200));
    return json({ id: meta.last_row_id, project_id: projectId }, 201);
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
