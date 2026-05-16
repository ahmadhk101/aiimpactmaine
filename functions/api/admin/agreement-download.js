import { requireAdmin } from "../../_shared/auth.js";

function safeDownloadName(filename) {
  return String(filename || "agreement").replace(/"/g, "");
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return new Response("id required", { status: 400 });
  }

  const row = await env.DB.prepare("SELECT filename, r2_key FROM agreements WHERE id = ?")
    .bind(id)
    .first();
  if (!row || !row.r2_key) {
    return new Response("not found", { status: 404 });
  }

  const object = await env.DOCS.get(row.r2_key);
  if (!object) {
    return new Response("file missing", { status: 404 });
  }

  return new Response(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeDownloadName(row.filename)}"`,
    },
  });
}
