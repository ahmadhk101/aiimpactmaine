import { requireAdmin, json } from "../../_shared/auth.js";
import {
  FOLLOW_UP_STATUSES,
  clean,
  intOrNull,
  isMissingTable,
  logProductivityActivity,
  missingMigrationResponse,
  readJson,
  valueIn,
} from "./_productivity.js";

function followUpPayload(body) {
  return {
    lead_id: intOrNull(body.lead_id),
    client_id: intOrNull(body.client_id),
    contact_id: intOrNull(body.contact_id),
    title: clean(body.title, 200),
    notes: clean(body.notes, 4000),
    due_date: clean(body.due_date, 80),
    status: valueIn(body.status, FOLLOW_UP_STATUSES, "open"),
  };
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const leadId = intOrNull(url.searchParams.get("lead_id"));
  const where = [];
  const params = [];
  if (status) { where.push("f.status = ?"); params.push(status); }
  if (leadId) { where.push("f.lead_id = ?"); params.push(leadId); }

  try {
    const { results } = await env.DB.prepare(
      `SELECT f.*, l.name AS lead_name, l.email AS lead_email, c.name AS client_name
       FROM follow_ups f
       LEFT JOIN leads l ON l.id = f.lead_id
       LEFT JOIN clients c ON c.id = f.client_id
       ${where.length ? "WHERE " + where.join(" AND ") : ""}
       ORDER BY date(f.due_date) ASC, f.created_at DESC
       LIMIT 250`
    ).bind(...params).all();
    return json({ follow_ups: results });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const body = followUpPayload(await readJson(request));
  if (!body.title || !body.due_date) return json({ error: "title and due_date required" }, 400);

  try {
    const { meta } = await env.DB.prepare(
      `INSERT INTO follow_ups
       (lead_id, client_id, contact_id, title, notes, due_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.lead_id, body.client_id, body.contact_id, body.title, body.notes,
      body.due_date, body.status
    ).run();

    await logProductivityActivity(env, request, "follow_up_created", body.title);
    return json({ id: meta.last_row_id, ...body }, 201);
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
