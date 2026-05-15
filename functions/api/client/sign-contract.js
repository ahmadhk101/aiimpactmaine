// functions/api/client/sign-contract.js
// POST /api/client/sign-contract  { slug, signed_name }
// Records a typed-name acknowledgment with IP + timestamp.

import { json, logActivity } from "../../_shared/auth.js";

export async function onRequestPost({ request, env }) {
  const { slug, signed_name } = await request.json().catch(() => ({}));
  if (!slug || !signed_name || signed_name.length < 2) {
    return json({ error: "slug and signed_name required" }, 400);
  }

  const eng = await env.DB.prepare("SELECT id, contract_text, contract_signed_at FROM engagements WHERE slug = ?")
    .bind(slug).first();
  if (!eng) return json({ error: "not found" }, 404);
  if (!eng.contract_text) return json({ error: "no contract on this engagement" }, 400);
  if (eng.contract_signed_at) return json({ error: "already signed" }, 409);

  const ip = request.headers.get("CF-Connecting-IP") || "";
  await env.DB.prepare(
    "UPDATE engagements SET contract_signed_at = CURRENT_TIMESTAMP, contract_signed_ip = ?, contract_signed_name = ? WHERE id = ?"
  ).bind(ip, signed_name, eng.id).run();

  await logActivity(env, {
    engagement_id: eng.id,
    event_type: "contract_signed",
    detail: signed_name,
    request,
  });

  return json({ ok: true });
}
