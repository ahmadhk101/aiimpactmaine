import { requireAdmin, json } from "../../_shared/auth.js";
import {
  EVENT_STATUSES,
  EVENT_TYPES,
  clean,
  intOrNull,
  isMissingTable,
  logProductivityActivity,
  missingMigrationResponse,
  readJson,
  valueIn,
} from "./_productivity.js";

function eventPayload(body) {
  return {
    title: clean(body.title, 200),
    description: clean(body.description, 4000),
    event_type: valueIn(body.event_type, EVENT_TYPES, "consultation"),
    client_id: intOrNull(body.client_id),
    start_time: clean(body.start_time, 80),
    end_time: clean(body.end_time, 80),
    location: clean(body.location, 300),
    meeting_link: clean(body.meeting_link, 500),
    status: valueIn(body.status, EVENT_STATUSES, "scheduled"),
  };
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const url = new URL(request.url);
  const limit = Math.min(Number.parseInt(url.searchParams.get("limit") || "100", 10), 250);
  try {
    const { results } = await env.DB.prepare(
      `SELECT ce.*, c.name AS client_name, c.company AS client_company
       FROM calendar_events ce
       LEFT JOIN clients c ON c.id = ce.client_id
       ORDER BY datetime(ce.start_time) ASC
       LIMIT ?`
    ).bind(limit).all();
    return json({ events: results });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const body = eventPayload(await readJson(request));
  if (!body.title || !body.start_time) return json({ error: "title and start_time required" }, 400);

  try {
    const { meta } = await env.DB.prepare(
      `INSERT INTO calendar_events
       (title, description, event_type, client_id, start_time, end_time, location, meeting_link, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.title, body.description, body.event_type, body.client_id, body.start_time,
      body.end_time, body.location, body.meeting_link, body.status
    ).run();

    await logProductivityActivity(env, request, "calendar_event_created", body.title);
    return json({ id: meta.last_row_id, ...body }, 201);
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
