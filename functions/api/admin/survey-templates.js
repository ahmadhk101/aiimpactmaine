// functions/api/admin/survey-templates.js
// GET  /api/admin/survey-templates              — list all templates
// GET  /api/admin/survey-templates?id=N         — get one template
// POST /api/admin/survey-templates              — create { name, description, questions }
// PUT  /api/admin/survey-templates              — update { id, name?, description?, questions? }
// DELETE /api/admin/survey-templates?id=N       — delete (only if not is_system)

import { requireAdmin, json } from "../../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    const t = await env.DB.prepare("SELECT * FROM survey_templates WHERE id = ?").bind(id).first();
    if (!t) return json({ error: "not found" }, 404);
    return json({ template: { ...t, questions: JSON.parse(t.questions) } });
  }

  const { results } = await env.DB.prepare(
    "SELECT id, name, description, is_system, created_at, updated_at FROM survey_templates ORDER BY is_system DESC, name ASC"
  ).all();
  return json({ templates: results });
}

export async function onRequestPost({ request, env }) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;

  const { name, description, questions } = await request.json().catch(() => ({}));
  if (!name || !Array.isArray(questions) || !questions.length) {
    return json({ error: "name and questions[] required" }, 400);
  }

  const validation = validateQuestions(questions);
  if (validation) return json({ error: validation }, 400);

  const { meta } = await env.DB.prepare(
    "INSERT INTO survey_templates (name, description, questions) VALUES (?, ?, ?)"
  ).bind(name, description || null, JSON.stringify(questions)).run();

  return json({ id: meta.last_row_id, name }, 201);
}

export async function onRequestPut({ request, env }) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;

  const { id, name, description, questions } = await request.json().catch(() => ({}));
  if (!id) return json({ error: "id required" }, 400);

  const updates = [];
  const params = [];
  if (name !== undefined) { updates.push("name = ?"); params.push(name); }
  if (description !== undefined) { updates.push("description = ?"); params.push(description); }
  if (questions !== undefined) {
    const validation = validateQuestions(questions);
    if (validation) return json({ error: validation }, 400);
    updates.push("questions = ?");
    params.push(JSON.stringify(questions));
  }
  if (!updates.length) return json({ error: "no fields to update" }, 400);
  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  await env.DB.prepare(`UPDATE survey_templates SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...params).run();
  return json({ id, updated: updates.length });
}

export async function onRequestDelete({ request, env }) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "id required" }, 400);

  const t = await env.DB.prepare("SELECT is_system FROM survey_templates WHERE id = ?").bind(id).first();
  if (!t) return json({ error: "not found" }, 404);
  if (t.is_system) return json({ error: "cannot delete system templates" }, 403);

  await env.DB.prepare("DELETE FROM survey_templates WHERE id = ?").bind(id).run();
  return json({ deleted: id });
}

// Validate question structure
function validateQuestions(qs) {
  const VALID_TYPES = new Set(["text", "longtext", "single", "multi", "rating", "yesno"]);
  const ids = new Set();
  for (const q of qs) {
    if (!q.id || !q.type || !q.label) return "Each question needs id, type, and label";
    if (!VALID_TYPES.has(q.type)) return `Invalid question type: ${q.type}`;
    if (ids.has(q.id)) return `Duplicate question id: ${q.id}`;
    if (!/^[a-z0-9_]+$/i.test(q.id)) return `Question id "${q.id}" must be alphanumeric/underscore only`;
    ids.add(q.id);
    if ((q.type === "single" || q.type === "multi") && (!Array.isArray(q.options) || !q.options.length)) {
      return `Question "${q.id}" needs options[]`;
    }
  }
  return null;
}
