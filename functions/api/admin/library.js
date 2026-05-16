// functions/api/admin/library.js
// GET    /api/admin/library                 — list all library resources
// POST   /api/admin/library  (multipart)    — upload { title, description, category, file }
// DELETE /api/admin/library?id=N            — remove resource (and from R2)

import { requireAdmin, json } from "../../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const { results } = await env.DB.prepare(
    "SELECT id, title, description, filename, size_bytes, category, uploaded_at FROM library_resources ORDER BY uploaded_at DESC"
  ).all();
  return json({ resources: results });
}

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const form = await request.formData();
  const title = form.get("title");
  const description = form.get("description") || "";
  const category = form.get("category") || "reference";
  const file = form.get("file");

  if (!title || !file || typeof file === "string") {
    return json({ error: "title and file required" }, 400);
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `library/${crypto.randomUUID()}-${safeName}`;
  await env.DOCS.put(key, file.stream(), {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });

  const { meta } = await env.DB.prepare(
    "INSERT INTO library_resources (title, description, filename, r2_key, size_bytes, category) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(title, description, file.name, key, file.size, category).run();

  return json({ id: meta.last_row_id, title }, 201);
}

export async function onRequestDelete({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return json({ error: "id required" }, 400);

  const row = await env.DB.prepare("SELECT r2_key FROM library_resources WHERE id = ?").bind(id).first();
  if (!row) return json({ error: "not found" }, 404);

  await env.DOCS.delete(row.r2_key).catch(() => {});
  await env.DB.prepare("DELETE FROM library_resources WHERE id = ?").bind(id).run();
  return json({ deleted: id });
}

