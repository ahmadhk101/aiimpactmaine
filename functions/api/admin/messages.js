// functions/api/admin/messages.js
// POST /api/admin/messages   { engagement_id, body }   — admin sends message
// PATCH /api/admin/messages  { ids: [..] }             — mark client messages as read

import { requireAdmin, json, logActivity } from "../../_shared/auth.js";

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const { engagement_id, body } = await request.json().catch(() => ({}));
  if (!engagement_id || !body) return json({ error: "engagement_id and body required" }, 400);

  const { meta } = await env.DB.prepare(
    "INSERT INTO messages (engagement_id, sender, body) VALUES (?, 'admin', ?)"
  ).bind(engagement_id, body).run();

  await logActivity(env, { engagement_id, event_type: "message_sent", detail: "admin -> client", request });
  return json({ id: meta.last_row_id }, 201);
}

export async function onRequestPatch({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const { ids } = await request.json().catch(() => ({}));
  if (!Array.isArray(ids) || !ids.length) return json({ error: "ids array required" }, 400);

  const placeholders = ids.map(() => "?").join(",");
  await env.DB.prepare(
    `UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE id IN (${placeholders}) AND sender = 'client'`
  ).bind(...ids).run();

  return json({ marked: ids.length });
}

