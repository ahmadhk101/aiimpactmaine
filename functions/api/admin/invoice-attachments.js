import { requireAdmin, json, logActivity } from "../../_shared/auth.js";

function safeFilename(name) {
  return String(name || "invoice-attachment").replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const url = new URL(request.url);
  const engagementId = url.searchParams.get("engagement_id");
  if (!engagementId) return json({ error: "engagement_id required" }, 400);

  const { results } = await env.DB.prepare(
    "SELECT id, filename, size_bytes, label, uploaded_at FROM invoice_attachments WHERE engagement_id = ? ORDER BY uploaded_at DESC"
  ).bind(engagementId).all();
  return json({ attachments: results });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const form = await request.formData();
  const engagementId = form.get("engagement_id");
  const label = form.get("label") || null;
  const file = form.get("file");

  if (!engagementId || !file || typeof file === "string") {
    return json({ error: "engagement_id and file required" }, 400);
  }

  const eng = await env.DB.prepare("SELECT id, slug FROM engagements WHERE id = ?")
    .bind(engagementId)
    .first();
  if (!eng) return json({ error: "engagement not found" }, 404);

  const key = `invoices/${eng.slug}/${crypto.randomUUID()}-${safeFilename(file.name)}`;
  await env.DOCS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });

  const { meta } = await env.DB.prepare(
    "INSERT INTO invoice_attachments (engagement_id, filename, r2_key, size_bytes, label) VALUES (?, ?, ?, ?, ?)"
  ).bind(engagementId, file.name, key, file.size, label).run();

  await logActivity(env, {
    engagement_id: engagementId,
    event_type: "invoice_attachment_uploaded",
    detail: file.name,
    request,
  });

  return json({ id: meta.last_row_id, filename: file.name, label }, 201);
}

export async function onRequestDelete({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "id required" }, 400);

  const row = await env.DB.prepare(
    "SELECT id, engagement_id, filename, r2_key FROM invoice_attachments WHERE id = ?"
  ).bind(id).first();
  if (!row) return json({ error: "not found" }, 404);

  await env.DOCS.delete(row.r2_key).catch(() => {});
  await env.DB.prepare("DELETE FROM invoice_attachments WHERE id = ?").bind(id).run();

  await logActivity(env, {
    engagement_id: row.engagement_id,
    event_type: "invoice_attachment_deleted",
    detail: row.filename,
    request,
  });

  return json({ deleted: id });
}

