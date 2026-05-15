// functions/api/client/survey.js
// POST /api/client/survey   { slug, type: 'pre'|'post', responses: {...} }

export async function onRequestPost({ request, env }) {
  const { slug, type, responses } = await request.json().catch(() => ({}));
  if (!slug || !type || !responses) {
    return json({ error: "slug, type, responses required" }, 400);
  }
  if (type !== "pre" && type !== "post") {
    return json({ error: "invalid type" }, 400);
  }

  const eng = await env.DB.prepare("SELECT id FROM engagements WHERE slug = ?")
    .bind(slug)
    .first();
  if (!eng) return json({ error: "not found" }, 404);

  // One survey per type per engagement
  const existing = await env.DB.prepare(
    "SELECT id FROM surveys WHERE engagement_id = ? AND type = ?"
  )
    .bind(eng.id, type)
    .first();
  if (existing) return json({ error: "already submitted" }, 409);

  await env.DB.prepare(
    "INSERT INTO surveys (engagement_id, type, responses) VALUES (?, ?, ?)"
  )
    .bind(eng.id, type, JSON.stringify(responses))
    .run();

  return json({ ok: true });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
