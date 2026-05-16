import { requireAdmin, json } from "../../_shared/auth.js";
import {
  PROJECT_STATUSES,
  PROJECT_TYPES,
  TASK_PRIORITIES,
  clampInt,
  clean,
  intOrNull,
  isMissingTable,
  logProductivityActivity,
  missingMigrationResponse,
  readJson,
  valueIn,
} from "./_productivity.js";

function projectPayload(body) {
  return {
    name: clean(body.name, 250),
    description: clean(body.description, 4000),
    client_id: intOrNull(body.client_id),
    lead_id: intOrNull(body.lead_id),
    project_type: valueIn(body.project_type, PROJECT_TYPES, "other"),
    status: valueIn(body.status, PROJECT_STATUSES, "planning"),
    priority: valueIn(body.priority, TASK_PRIORITIES, "medium"),
    start_date: clean(body.start_date, 80),
    target_end_date: clean(body.target_end_date, 80),
    actual_end_date: clean(body.actual_end_date, 80),
    progress_percent: clampInt(body.progress_percent, 0, 100, 0),
    owner: clean(body.owner, 200),
    budget: intOrNull(body.budget),
    notes: clean(body.notes, 5000),
  };
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const url = new URL(request.url);
  const includeArchived = url.searchParams.get("include_archived") === "1";
  try {
    const { results } = await env.DB.prepare(
      `SELECT p.*, c.name AS client_name, c.company AS client_company, l.name AS lead_name,
              (SELECT COUNT(*) FROM project_milestones m WHERE m.project_id = p.id AND m.status != 'completed') AS open_milestones,
              (SELECT MAX(created_at) FROM project_updates u WHERE u.project_id = p.id) AS last_update_at
       FROM projects p
       LEFT JOIN clients c ON c.id = p.client_id
       LEFT JOIN leads l ON l.id = p.lead_id
       ${includeArchived ? "" : "WHERE p.status != 'archived'"}
       ORDER BY
         CASE p.status WHEN 'blocked' THEN 0 WHEN 'waiting_on_client' THEN 1 WHEN 'active' THEN 2 WHEN 'planning' THEN 3 ELSE 4 END,
         COALESCE(p.target_end_date, '9999-12-31') ASC,
         p.created_at DESC
       LIMIT 250`
    ).all();
    return json({ projects: results });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const body = projectPayload(await readJson(request));
  if (!body.name) return json({ error: "name required" }, 400);

  try {
    const { meta } = await env.DB.prepare(
      `INSERT INTO projects
       (name, description, client_id, lead_id, project_type, status, priority, start_date,
        target_end_date, actual_end_date, progress_percent, owner, budget, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.name, body.description, body.client_id, body.lead_id, body.project_type,
      body.status, body.priority, body.start_date, body.target_end_date, body.actual_end_date,
      body.progress_percent, body.owner, body.budget, body.notes
    ).run();

    await logProductivityActivity(env, request, "project_created", body.name);
    return json({ id: meta.last_row_id, ...body }, 201);
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
