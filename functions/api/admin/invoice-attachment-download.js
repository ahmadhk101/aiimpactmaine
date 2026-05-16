import { requireAdmin } from "../../_shared/auth.js";

function downloadName(filename) {
  return String(filename || "invoice-attachment").replace(/"/g, "");
}

export async function onRequestGet({ request, env }) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return new Response("Bad request", { status: 400 });

  const row = await env.DB.prepare(
    "SELECT filename, r2_key FROM invoice_attachments WHERE id = ?"
  ).bind(id).first();
  if (!row) return new Response("Not found", { status: 404 });

  const obj = await env.DOCS.get(row.r2_key);
  if (!obj) return new Response("File missing", { status: 404 });

  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${downloadName(row.filename)}"`,
    },
  });
}
