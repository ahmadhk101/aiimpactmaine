import { requireAdmin, json } from "../../_shared/auth.js";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  clean,
  intOrNull,
  isMissingTable,
  logProductivityActivity,
  missingMigrationResponse,
  readJson,
  valueIn,
} from "./_productivity.js";

function taskPayload(body) {
  return {
    title: clean(body.title, 200),
    description: clean(body.description, 4000),
    status: valueIn(body.status, TASK_STATUSES, "open"),
    priority: valueIn(body.priority, TASK_PRIORITIES, "medium"),
    due_date: clean(body.due_date, 80),
    client_id: intOrNull(body.client_id),
    related_lead_id: intOrNull(body.related_lead_id),
    assigned_to: clean(body.assigned_to, 200),
  };
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const where = status ? "WHERE t.status = ?" : "";
  const params = status ? [status] : [];
  try {
    const { results } = await env.DB.prepare(
      `SELECT t.*, c.name AS client_name, l.name AS lead_name, l.email AS lead_email
       FROM tasks t
       LEFT JOIN clients c ON c.id = t.client_id
       LEFT JOIN leads l ON l.id = t.related_lead_id
       ${where}
       ORDER BY
         CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         COALESCE(t.due_date, '9999-12-31') ASC,
         t.created_at DESC
       LIMIT 250`
    ).bind(...params).all();
    return json({ tasks: results });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const body = taskPayload(await readJson(request));
  if (!body.title) return json({ error: "title required" }, 400);

  try {
    const { meta } = await env.DB.prepare(
      `INSERT INTO tasks
       (title, description, status, priority, due_date, client_id, related_lead_id, assigned_to)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.title, body.description, body.status, body.priority, body.due_date,
      body.client_id, body.related_lead_id, body.assigned_to
    ).run();

    await logProductivityActivity(env, request, "task_created", body.title);
    return json({ id: meta.last_row_id, ...body }, 201);
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
