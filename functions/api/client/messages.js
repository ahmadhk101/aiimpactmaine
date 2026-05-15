// functions/api/client/messages.js
// GET  /api/client/messages?slug=...   — fetch all messages for this engagement
// POST /api/client/messages            — { slug, body } client sends message

import { json, logActivity } from "../../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return json({ error: "slug required" }, 400);

  const eng = await env.DB.prepare("SELECT id FROM engagements WHERE slug = ?").bind(slug).first();
  if (!eng) return json({ error: "not found" }, 404);

  const { results } = await env.DB.prepare(
    "SELECT id, sender, body, read_at, created_at FROM messages WHERE engagement_id = ? ORDER BY created_at ASC"
  ).bind(eng.id).all();

  // Mark admin->client messages as read
  await env.DB.prepare(
    "UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE engagement_id = ? AND sender = 'admin' AND read_at IS NULL"
  ).bind(eng.id).run();

  return json({ messages: results });
}

export async function onRequestPost({ request, env }) {
  const { slug, body } = await request.json().catch(() => ({}));
  if (!slug || !body) return json({ error: "slug and body required" }, 400);
  if (body.length > 5000) return json({ error: "message too long" }, 400);

  const eng = await env.DB.prepare("SELECT id FROM engagements WHERE slug = ?").bind(slug).first();
  if (!eng) return json({ error: "not found" }, 404);

  const { meta } = await env.DB.prepare(
    "INSERT INTO messages (engagement_id, sender, body) VALUES (?, 'client', ?)"
  ).bind(eng.id, body).run();

  await logActivity(env, { engagement_id: eng.id, event_type: "message_sent", detail: "client -> admin", request });
  return json({ id: meta.last_row_id }, 201);
}
