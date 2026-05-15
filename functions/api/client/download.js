// functions/api/client/download.js
// GET /api/client/download?slug=<engagement-slug>&doc=<doc-id>
// Validates that the doc belongs to the engagement and is visible at current stage,
// logs the access, then streams from R2.

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  const docId = url.searchParams.get("doc");
  if (!slug || !docId) return new Response("Bad request", { status: 400 });

  const row = await env.DB.prepare(
    `SELECT d.id, d.filename, d.r2_key, d.visibility, e.stage
     FROM documents d
     JOIN engagements e ON e.id = d.engagement_id
     WHERE d.id = ? AND e.slug = ?`
  )
    .bind(docId, slug)
    .first();

  if (!row) return new Response("Not found", { status: 404 });
  if (row.visibility !== "all" && row.visibility !== row.stage) {
    return new Response("Not available at this stage", { status: 403 });
  }

  const obj = await env.DOCS.get(row.r2_key);
  if (!obj) return new Response("File missing", { status: 404 });

  // Log access (don't await — fire and forget so download isn't slowed)
  const ip = request.headers.get("CF-Connecting-IP") || "";
  env.DB.prepare("INSERT INTO document_access_log (document_id, ip_address) VALUES (?, ?)")
    .bind(row.id, ip)
    .run()
    .catch(() => {});

  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${row.filename.replace(/"/g, "")}"`,
    },
  });
}
