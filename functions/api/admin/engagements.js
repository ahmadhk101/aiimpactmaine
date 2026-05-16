// functions/api/admin/engagements.js
// GET  /api/admin/engagements          — list (with client info, payment status, activity counts)
// GET  /api/admin/engagements?id=N     — full detail for one engagement
// POST /api/admin/engagements          — create { client_id, title, description, contract_text, invoice_amount_cents, cal_link }
// PUT  /api/admin/engagements          — update { id, ...fields }

import { requireAdmin, json, makeSlug, logActivity } from "../../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    const eng = await env.DB.prepare(
      `SELECT e.*, c.name AS client_name, c.company AS client_company, c.email AS client_email, c.phone AS client_phone
       FROM engagements e JOIN clients c ON c.id = e.client_id WHERE e.id = ?`
    ).bind(id).first();
    if (!eng) return json({ error: "not found" }, 404);

    const { results: docs } = await env.DB.prepare(
      "SELECT id, filename, size_bytes, visibility, uploaded_at FROM documents WHERE engagement_id = ? ORDER BY uploaded_at DESC"
    ).bind(id).all();

    const { results: invoiceAttachments } = await env.DB.prepare(
      "SELECT id, filename, size_bytes, label, uploaded_at FROM invoice_attachments WHERE engagement_id = ? ORDER BY uploaded_at DESC"
    ).bind(id).all();

    const { results: activity } = await env.DB.prepare(
      "SELECT event_type, detail, ip_address, created_at FROM activity_log WHERE engagement_id = ? ORDER BY created_at DESC LIMIT 50"
    ).bind(id).all();

    const { results: surveys } = await env.DB.prepare(
      "SELECT id, type, responses, submitted_at FROM surveys WHERE engagement_id = ? ORDER BY submitted_at DESC"
    ).bind(id).all();

    const { results: messages } = await env.DB.prepare(
      "SELECT id, sender, body, read_at, created_at FROM messages WHERE engagement_id = ? ORDER BY created_at ASC"
    ).bind(id).all();

    return json({
      engagement: eng,
      documents: docs,
      invoice_attachments: invoiceAttachments,
      activity,
      surveys: surveys.map(s => ({ ...s, responses: JSON.parse(s.responses) })),
      messages,
    });
  }

  // List view with rollup stats
  const { results } = await env.DB.prepare(
    `SELECT e.id, e.slug, e.title, e.stage, e.invoice_status, e.invoice_amount_cents,
            e.contract_signed_at, e.created_at,
            c.name AS client_name, c.company AS client_company, c.email AS client_email,
            (SELECT COUNT(*) FROM messages m WHERE m.engagement_id = e.id AND m.sender = 'client' AND m.read_at IS NULL) AS unread_messages,
            (SELECT MAX(created_at) FROM activity_log a WHERE a.engagement_id = e.id) AS last_activity
     FROM engagements e
     JOIN clients c ON c.id = e.client_id
     ORDER BY e.created_at DESC`
  ).all();
  return json({ engagements: results });
}

export async function onRequestPost({ request, env }) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;

  const body = await request.json().catch(() => ({}));
  const { client_id, title, description, contract_text, invoice_amount_cents, cal_link } = body;
  if (!client_id || !title) return json({ error: "client_id and title required" }, 400);

  const slug = makeSlug(title);
  const { meta } = await env.DB.prepare(
    `INSERT INTO engagements
     (client_id, slug, title, description, contract_text, invoice_amount_cents, cal_link)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    client_id, slug, title,
    description || null, contract_text || null,
    invoice_amount_cents || null, cal_link || null
  ).run();

  await logActivity(env, {
    engagement_id: meta.last_row_id,
    event_type: "engagement_created",
    detail: title,
    request,
  });

  return json({ id: meta.last_row_id, slug, title }, 201);
}

export async function onRequestPut({ request, env }) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;

  const body = await request.json().catch(() => ({}));
  const { id } = body;
  if (!id) return json({ error: "id required" }, 400);

  const { results: columns } = await env.DB.prepare("SELECT name FROM pragma_table_info('engagements')").all();
  const existingColumns = new Set(columns.map(c => c.name));

  // Only allow specific fields to be updated
  const ALLOWED = ["title", "description", "stage", "contract_text",
    "invoice_amount_cents", "invoice_status", "invoice_notes", "cal_link",
    "invoice_number", "invoice_date", "payment_link", "payment_method", "payment_reference"];
  const updates = [];
  const params = [];
  const skipped = [];
  for (const k of ALLOWED) {
    if (k in body) {
      if (!existingColumns.has(k)) {
        skipped.push(k);
        continue;
      }
      updates.push(`${k} = ?`);
      params.push(body[k]);
    }
  }
  if (!updates.length) return json({ error: "no fields to update" }, 400);

  // Set paid_at when status flips to paid
  if (body.invoice_status === "paid") {
    updates.push("invoice_paid_at = CURRENT_TIMESTAMP");
  }

  params.push(id);
  try {
    await env.DB.prepare(`UPDATE engagements SET ${updates.join(", ")} WHERE id = ?`)
      .bind(...params).run();
  } catch (err) {
    return json({ error: "save failed", detail: String(err?.message || err) }, 500);
  }

  if (body.stage) {
    await logActivity(env, { engagement_id: id, event_type: "stage_changed", detail: body.stage, request });
  }
  if (body.invoice_status === "paid") {
    await logActivity(env, { engagement_id: id, event_type: "invoice_paid", detail: body.invoice_notes || "", request });
  }

  return json({ id, updated: updates.length, skipped });
}
