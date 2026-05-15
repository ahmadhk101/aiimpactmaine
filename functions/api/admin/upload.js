// functions/api/admin/upload.js
// POST /api/admin/upload   (multipart/form-data)
//   fields: engagement_id, visibility (pre|active|post|all), file
// Streams the file directly to R2, then records metadata in D1.

import { requireAdmin, json } from "../../_shared/auth.js";

export async function onRequestPost({ request, env }) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;

  const form = await request.formData();
  const engagementId = form.get("engagement_id");
  const visibility = form.get("visibility") || "all";
  const file = form.get("file");

  if (!engagementId || !file || typeof file === "string") {
    return json({ error: "engagement_id and file required" }, 400);
  }

  // Verify engagement exists and get its slug for organizing R2 keys
  const eng = await env.DB.prepare("SELECT slug FROM engagements WHERE id = ?")
    .bind(engagementId)
    .first();
  if (!eng) return json({ error: "engagement not found" }, 404);

  // R2 key: docs/<slug>/<uuid>-<filename>
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `docs/${eng.slug}/${crypto.randomUUID()}-${safeName}`;

  await env.DOCS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });

  const { meta } = await env.DB.prepare(
    "INSERT INTO documents (engagement_id, filename, r2_key, size_bytes, visibility) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(engagementId, file.name, key, file.size, visibility)
    .run();

  return json({ id: meta.last_row_id, filename: file.name, r2_key: key }, 201);
}
