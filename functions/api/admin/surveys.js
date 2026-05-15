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
    `SELECT s.id, s.type, s.responses, s.submitted_at, s.survey_id,
            es.title AS survey_title, es.questions AS survey_questions
     FROM surveys s
     LEFT JOIN engagement_surveys es ON es.id = s.survey_id
     WHERE s.engagement_id = ?
     ORDER BY s.submitted_at DESC`
  )
    .bind(engagementId)
    .all();

  // Parse JSON responses + questions for convenience
  const surveys = results.map((r) => ({
    ...r,
    responses: JSON.parse(r.responses),
    survey_questions: r.survey_questions ? JSON.parse(r.survey_questions) : null,
  }));
  return json({ surveys });
}
