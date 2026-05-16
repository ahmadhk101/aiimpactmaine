import { requireAdmin, json } from "../../_shared/auth.js";
import { clean, idFromRequest, intOrNull, isMissingTable, missingMigrationResponse, readJson } from "./_productivity.js";

const AGREEMENT_TYPES = new Set(["MSA", "NDA", "SOW", "other"]);
const STATUSES = new Set(["draft", "review", "sent", "signed", "active", "expired", "archived"]);
const SIGNED_STATES = new Set(["unsigned", "sent", "signed", "not_required"]);

function safeFilename(name) {
  return String(name || "agreement").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function normalizeField(value, max = 1000) {
  return clean(value, max);
}

async function parseAgreementRequest(request, env) {
  const type = request.headers.get("Content-Type") || "";
  if (!type.includes("multipart/form-data")) {
    const body = await readJson(request);
    return {
      fields: body,
      fileMeta: {},
    };
  }

  const form = await request.formData();
  const fields = {};
  for (const key of [
    "agreement_type", "client_id", "engagement_id", "title", "status", "signed_state",
    "effective_date", "file_reference", "notes",
  ]) {
    const value = form.get(key);
    if (value !== null && typeof value !== "object") fields[key] = value;
  }

  const file = form.get("file");
  if (!file || typeof file === "string") return { fields, fileMeta: {} };

  const base = fields.engagement_id || fields.client_id || "general";
  const key = `agreements/${base}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
  await env.DOCS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });
  return {
    fields,
    fileMeta: {
      filename: file.name,
      r2_key: key,
      size_bytes: file.size || null,
    },
  };
}

function agreementPayload(fields, fileMeta = {}) {
  return {
    agreement_type: AGREEMENT_TYPES.has(fields.agreement_type) ? fields.agreement_type : "other",
    client_id: intOrNull(fields.client_id),
    engagement_id: intOrNull(fields.engagement_id),
    title: normalizeField(fields.title, 250),
    status: STATUSES.has(fields.status) ? fields.status : "draft",
    signed_state: SIGNED_STATES.has(fields.signed_state) ? fields.signed_state : "unsigned",
    effective_date: normalizeField(fields.effective_date, 80),
    filename: fileMeta.filename || normalizeField(fields.filename, 500),
    r2_key: fileMeta.r2_key || normalizeField(fields.r2_key, 1000),
    size_bytes: fileMeta.size_bytes || intOrNull(fields.size_bytes),
    file_reference: normalizeField(fields.file_reference, 1000),
    notes: normalizeField(fields.notes, 5000),
  };
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const id = idFromRequest(request);
  try {
    if (id) {
      const agreement = await env.DB.prepare(
        `SELECT a.*, c.name AS client_name, e.title AS engagement_title
         FROM agreements a
         LEFT JOIN clients c ON c.id = a.client_id
         LEFT JOIN engagements e ON e.id = a.engagement_id
         WHERE a.id = ?`
      ).bind(id).first();
      if (!agreement) return json({ error: "not found" }, 404);
      return json({ agreement });
    }

    const { results } = await env.DB.prepare(
      `SELECT a.*, c.name AS client_name, e.title AS engagement_title
       FROM agreements a
       LEFT JOIN clients c ON c.id = a.client_id
       LEFT JOIN engagements e ON e.id = a.engagement_id
       WHERE a.status != 'archived'
       ORDER BY a.updated_at DESC, a.created_at DESC
       LIMIT 250`
    ).all();
    return json({ agreements: results });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  try {
    const parsed = await parseAgreementRequest(request, env);
    const body = agreementPayload(parsed.fields, parsed.fileMeta);
    if (!body.title) return json({ error: "title required" }, 400);

    const { meta } = await env.DB.prepare(
      `INSERT INTO agreements
       (agreement_type, client_id, engagement_id, title, status, signed_state, effective_date,
        filename, r2_key, size_bytes, file_reference, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.agreement_type, body.client_id, body.engagement_id, body.title, body.status,
      body.signed_state, body.effective_date, body.filename, body.r2_key, body.size_bytes,
      body.file_reference, body.notes
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

  const fields = {
    agreement_type: value => AGREEMENT_TYPES.has(value) ? value : "other",
    client_id: value => intOrNull(value),
    engagement_id: value => intOrNull(value),
    title: value => normalizeField(value, 250),
    status: value => STATUSES.has(value) ? value : "draft",
    signed_state: value => SIGNED_STATES.has(value) ? value : "unsigned",
    effective_date: value => normalizeField(value, 80),
    file_reference: value => normalizeField(value, 1000),
    notes: value => normalizeField(value, 5000),
  };

  const updates = [];
  const params = [];
  for (const [field, transform] of Object.entries(fields)) {
    if (field in raw) {
      updates.push(`${field} = ?`);
      params.push(transform(raw[field]));
    }
  }
  if (!updates.length) return json({ error: "no fields to update" }, 400);
  updates.push("updated_at = CURRENT_TIMESTAMP");
  params.push(id);

  try {
    await env.DB.prepare(`UPDATE agreements SET ${updates.join(", ")} WHERE id = ?`)
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
    await env.DB.prepare("UPDATE agreements SET status = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(id).run();
    return json({ archived: id });
  } catch (err) {
    if (isMissingTable(err)) return missingMigrationResponse();
    throw err;
  }
}
