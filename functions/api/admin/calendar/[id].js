import { requireAdmin, json } from "../../../_shared/auth.js";
import {
  EVENT_STATUSES,
  EVENT_TYPES,
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
  event_type: value => valueIn(value, EVENT_TYPES, "consultation"),
  client_id: value => intOrNull(value),
  start_time: value => clean(value, 80),
  end_time: value => clean(value, 80),
  location: value => clean(value, 300),
  meeting_link: value => clean(value, 500),
  status: value => valueIn(value, EVENT_STATUSES, "scheduled"),
};

export async function onRequestGet({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const id = idFromRequest(request, params);
  if (!id) return json({ error: "id required" }, 400);

  try {
    const event = await env.DB.prepare(
      `SELECT ce.*, c.name AS client_name, c.company AS client_company
       FROM calendar_events ce
       LEFT JOIN clients c ON c.id = ce.client_id
       WHERE ce.id = ?`
    ).bind(id).first();
    if (!event) return json({ error: "not found" }, 404);
    return json({ event });
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
    const result = await updateRow(env, "calendar_events", id, body, FIELDS);
    if (result.error) return json({ error: result.error }, 400);
    await logProductivityActivity(env, request, "calendar_event_updated", body.title || `Event #${id}`);
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
    const event = await env.DB.prepare("SELECT title FROM calendar_events WHERE id = ?").bind(id).first();
    await env.DB.prepare("DELETE FROM calendar_events WHERE id = ?").bind(id).run();
    await logProductivityActivity(env, request, "calendar_event_deleted", event?.title || `Event #${id}`);
    return json({ deleted: id });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
