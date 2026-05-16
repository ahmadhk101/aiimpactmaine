// functions/api/admin/engagement-surveys.js
// GET  /api/admin/engagement-surveys?engagement_id=N    — list surveys for an engagement
// POST /api/admin/engagement-surveys                    — assign template to engagement
//      { engagement_id, template_id?, title, description?, questions?, visibility, repeatable }
//      If template_id given without questions, copies template's questions.
//      Otherwise uses provided questions for full customization.
// PUT  /api/admin/engagement-surveys                    — update assigned survey
//      { id, title?, description?, questions?, visibility?, repeatable? }
// DELETE /api/admin/engagement-surveys?id=N             — remove

import { requireAdmin, json } from "../../_shared/auth.js";

const VALID_VIS = new Set(["pre", "active", "post", "all"]);

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const url = new URL(request.url);
  const engagementId = url.searchParams.get("engagement_id");
  if (!engagementId) return json({ error: "engagement_id required" }, 400);

  const { results } = await env.DB.prepare(
    `SELECT es.*, st.name AS template_name,
       (SELECT COUNT(*) FROM surveys s WHERE s.survey_id = es.id) AS response_count
     FROM engagement_surveys es
     LEFT JOIN survey_templates st ON st.id = es.template_id
     WHERE es.engagement_id = ?
     ORDER BY es.created_at ASC`
  ).bind(engagementId).all();

  const surveys = results.map(r => ({ ...r, questions: JSON.parse(r.questions) }));
  return json({ surveys });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const body = await request.json().catch(() => ({}));
  const { engagement_id, template_id, title, description, visibility, repeatable } = body;
  let { questions } = body;

  if (!engagement_id || !title) return json({ error: "engagement_id and title required" }, 400);
  if (visibility && !VALID_VIS.has(visibility)) return json({ error: "invalid visibility" }, 400);

  // If template_id given and no questions override, copy questions from template
  if (template_id && !questions) {
    const t = await env.DB.prepare("SELECT questions FROM survey_templates WHERE id = ?").bind(template_id).first();
    if (!t) return json({ error: "template not found" }, 404);
    questions = JSON.parse(t.questions);
  }
  if (!Array.isArray(questions) || !questions.length) {
    return json({ error: "questions[] required (either via template_id or directly)" }, 400);
  }

  const { meta } = await env.DB.prepare(
    "INSERT INTO engagement_surveys (engagement_id, template_id, title, description, questions, visibility, repeatable) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    engagement_id,
    template_id || null,
    title,
    description || null,
    JSON.stringify(questions),
    visibility || "all",
    repeatable ? 1 : 0
  ).run();

  return json({ id: meta.last_row_id, title }, 201);
}

export async function onRequestPut({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const body = await request.json().catch(() => ({}));
  const { id } = body;
  if (!id) return json({ error: "id required" }, 400);

  const ALLOWED = ["title", "description", "visibility", "repeatable"];
  const updates = [];
  const params = [];
  for (const k of ALLOWED) {
    if (k in body) {
      if (k === "visibility" && !VALID_VIS.has(body[k])) return json({ error: "invalid visibility" }, 400);
      updates.push(`${k} = ?`);
      params.push(k === "repeatable" ? (body[k] ? 1 : 0) : body[k]);
    }
  }
  if (body.questions !== undefined) {
    if (!Array.isArray(body.questions) || !body.questions.length) return json({ error: "questions[] cannot be empty" }, 400);
    updates.push("questions = ?");
    params.push(JSON.stringify(body.questions));
  }
  if (!updates.length) return json({ error: "no fields to update" }, 400);
  params.push(id);

  await env.DB.prepare(`UPDATE engagement_surveys SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...params).run();
  return json({ id, updated: updates.length });
}

export async function onRequestDelete({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "id required" }, 400);

  await env.DB.prepare("DELETE FROM engagement_surveys WHERE id = ?").bind(id).run();
  return json({ deleted: id });
}

