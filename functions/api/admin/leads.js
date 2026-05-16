import { requireAdmin, json } from "../../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const { results } = await env.DB.prepare(
    `SELECT id, source, name, email, phone, organization, interest, message,
            package_name, resource_url, page_url, status, created_at
     FROM leads
     ORDER BY created_at DESC
     LIMIT 250`
  ).all();

  return json({ leads: results });
}

export async function onRequestPatch({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const { id, status } = await request.json().catch(() => ({}));
  if (!id || !status) return json({ error: "id and status required" }, 400);
  if (!["new", "contacted", "qualified", "closed", "spam"].includes(status)) {
    return json({ error: "invalid status" }, 400);
  }

  await env.DB.prepare("UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(status, id)
    .run();

  return json({ id, status });
}
