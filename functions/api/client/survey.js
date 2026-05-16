// functions/api/client/survey.js
// POST /api/client/survey   { slug, survey_id, responses: {...} }
//
// Validates that the survey belongs to the engagement at the current stage,
// enforces one-submission rule if repeatable=0, then saves the response.

import { json, logActivity, requirePortalSessionForSlug, requireSameOrigin } from "../../_shared/auth.js";

export async function onRequestPost({ request, env }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const { slug, survey_id, responses } = await request.json().catch(() => ({}));
  if (!slug || !survey_id || !responses || typeof responses !== "object") {
    return json({ error: "slug, survey_id, responses required" }, 400);
  }

  const portalAuth = await requirePortalSessionForSlug(request, env, slug, { json: true });
  if (portalAuth instanceof Response) return portalAuth;

  // Verify slug + survey association, get stage to check visibility
  const row = await env.DB.prepare(
    `SELECT e.id AS engagement_id, e.stage,
            es.id AS survey_id, es.title, es.visibility, es.repeatable
     FROM engagements e
     JOIN engagement_surveys es ON es.engagement_id = e.id
     WHERE e.slug = ? AND e.client_id = ? AND es.id = ?`
  ).bind(slug, portalAuth.session.client_id, survey_id).first();

  if (!row) return json({ error: "survey not found for this engagement" }, 404);

  // Visibility check
  if (row.visibility !== "all" && row.visibility !== row.stage) {
    return json({ error: "survey not available at current stage" }, 403);
  }

  // Repeatable check — if not repeatable, ensure no prior submission
  if (!row.repeatable) {
    const existing = await env.DB.prepare(
      "SELECT id FROM surveys WHERE survey_id = ?"
    ).bind(survey_id).first();
    if (existing) return json({ error: "already submitted" }, 409);
  }

  // Save response. Keep legacy 'type' field populated for backward compat:
  //   - if survey visibility is 'pre'/'post', set type to that
  //   - else set type to 'custom'
  const legacyType = (row.visibility === "pre" || row.visibility === "post") ? row.visibility : "custom";

  await env.DB.prepare(
    "INSERT INTO surveys (engagement_id, type, survey_id, responses) VALUES (?, ?, ?, ?)"
  ).bind(row.engagement_id, legacyType, survey_id, JSON.stringify(responses)).run();

  await logActivity(env, {
    engagement_id: row.engagement_id,
    event_type: "survey_submitted",
    detail: row.title,
    request,
  });

  return json({ ok: true });
}
