import { requireAdmin, json } from "../../_shared/auth.js";
import { clean, idFromRequest, isMissingTable, missingMigrationResponse, readJson } from "./_productivity.js";

const TYPES = new Set(["proposal", "invoice", "speaker", "compliance_quick_card", "other"]);
const STATUSES = new Set(["active", "draft", "archived"]);

function normalizeContent(value) {
  if (value == null || value === "") return { error: "content required" };
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return { content: JSON.stringify(parsed) };
    } catch {
      return { error: "content_json must be valid JSON" };
    }
  }
  try {
    return { content: JSON.stringify(value) };
  } catch {
    return { error: "content_json must be valid JSON" };
  }
}

function templatePayload(body) {
  const type = TYPES.has(body.template_type) ? body.template_type : "other";
  const status = STATUSES.has(body.status) ? body.status : "active";
  const normalized = normalizeContent(body.content_json ?? body.content);
  return {
    template_type: type,
    name: clean(body.name, 250),
    description: clean(body.description, 2000),
    content_json: normalized.content,
    content_error: normalized.error,
    source_filename: clean(body.source_filename, 500),
    status,
  };
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const url = new URL(request.url);
  const id = idFromRequest(request);
  const type = url.searchParams.get("type");

  try {
    if (id) {
      const row = await env.DB.prepare("SELECT * FROM business_templates WHERE id = ?").bind(id).first();
      if (!row) return json({ error: "not found" }, 404);
      return json({ template: { ...row, content: JSON.parse(row.content_json) } });
    }

    const where = type ? "WHERE template_type = ?" : "";
    const params = type ? [type] : [];
    const { results } = await env.DB.prepare(
      `SELECT id, template_type, name, description, source_filename, status, created_at, updated_at
       FROM business_templates
       ${where}
       ORDER BY template_type, name`
    ).bind(...params).all();
    return json({ templates: results });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const body = templatePayload(await readJson(request));
  if (!body.name) return json({ error: "name required" }, 400);
  if (body.content_error) return json({ error: body.content_error }, 400);

  try {
    const existing = await env.DB.prepare(
      "SELECT id FROM business_templates WHERE template_type = ? AND name = ? LIMIT 1"
    ).bind(body.template_type, body.name).first();

    if (existing) {
      await env.DB.prepare(
        `UPDATE business_templates
         SET description = ?, content_json = ?, source_filename = ?, status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).bind(body.description, body.content_json, body.source_filename, body.status, existing.id).run();
      return json({ id: existing.id, updated: true });
    }

    const { meta } = await env.DB.prepare(
      `INSERT INTO business_templates
       (template_type, name, description, content_json, source_filename, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      body.template_type, body.name, body.description, body.content_json,
      body.source_filename, body.status
    ).run();
    return json({ id: meta.last_row_id }, 201);
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}

export async function onRequestPut({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const raw = await readJson(request);
  const id = idFromRequest(request, { id: raw.id });
  if (!id) return json({ error: "id required" }, 400);

  const updates = [];
  const params = [];
  if ("template_type" in raw) {
    updates.push("template_type = ?");
    params.push(TYPES.has(raw.template_type) ? raw.template_type : "other");
  }
  if ("name" in raw) {
    const name = clean(raw.name, 250);
    if (!name) return json({ error: "name required" }, 400);
    updates.push("name = ?");
    params.push(name);
  }
  if ("description" in raw) {
    updates.push("description = ?");
    params.push(clean(raw.description, 2000));
  }
  if ("content_json" in raw || "content" in raw) {
    const normalized = normalizeContent(raw.content_json ?? raw.content);
    if (normalized.error) return json({ error: normalized.error }, 400);
    updates.push("content_json = ?");
    params.push(normalized.content);
  }
  if ("source_filename" in raw) {
    updates.push("source_filename = ?");
    params.push(clean(raw.source_filename, 500));
  }
  if ("status" in raw) {
    updates.push("status = ?");
    params.push(STATUSES.has(raw.status) ? raw.status : "active");
  }
  if (!updates.length) return json({ error: "no fields to update" }, 400);
  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  try {
    await env.DB.prepare(`UPDATE business_templates SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...params).run();
    return json({ id, updated: updates.length - 1 });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}

export async function onRequestDelete({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const id = idFromRequest(request);
  if (!id) return json({ error: "id required" }, 400);

  try {
    await env.DB.prepare("UPDATE business_templates SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(id).run();
    return json({ archived: id });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
