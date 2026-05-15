// functions/api/admin/surveys.js
// GET /api/admin/surveys?engagement_id=N

import { requireAdmin, json } from "../../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;

  const url = new URL(request.url);
  const engagementId = url.searchParams.get("engagement_id");
  if (!engagementId) return json({ error: "engagement_id required" }, 400);

  const { results } = await env.DB.prepare(
    "SELECT id, type, responses, submitted_at FROM surveys WHERE engagement_id = ? ORDER BY submitted_at DESC"
  )
    .bind(engagementId)
    .all();

  // Parse JSON responses for convenience
  const surveys = results.map((r) => ({
    ...r,
    responses: JSON.parse(r.responses),
  }));
  return json({ surveys });
}
