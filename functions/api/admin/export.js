import { requireAdmin } from "../../_shared/auth.js";

function csvField(value) {
  if (value === null || value === undefined) return "";
  const s = String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvResponse(type, rows) {
  const today = new Date().toISOString().slice(0, 10);
  const body = rows.map(row => row.map(csvField).join(",")).join("\r\n") + "\r\n";
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aiimpactmaine-${type}-${today}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

async function exportClients(env) {
  const { results } = await env.DB.prepare(
    `SELECT c.id AS client_id, c.name AS client_name, c.company AS client_company,
            c.email AS client_email, c.phone AS client_phone, c.notes AS client_notes,
            c.created_at AS client_created_at,
            (SELECT COUNT(*) FROM engagements e WHERE e.client_id = c.id) AS engagement_count,
            COALESCE((SELECT SUM(invoice_amount_cents) FROM engagements e WHERE e.client_id = c.id), 0) AS total_invoiced_cents,
            COALESCE((SELECT SUM(invoice_amount_cents) FROM engagements e WHERE e.client_id = c.id AND e.invoice_status = 'paid'), 0) AS total_paid_cents,
            e.id AS engagement_id, e.title AS engagement_title, e.description AS engagement_description,
            e.stage, e.invoice_number, e.invoice_date, e.invoice_amount_cents, e.invoice_status,
            e.payment_method, e.payment_link, e.payment_reference, e.invoice_notes,
            e.created_at AS engagement_created_at
     FROM clients c
     LEFT JOIN engagements e ON e.client_id = c.id
     ORDER BY c.created_at DESC, e.created_at DESC`
  ).all();

  const rows = [[
    "client_id", "client_name", "client_company", "client_email", "client_phone", "client_notes",
    "client_created_at", "engagement_count", "total_invoiced_cents", "total_paid_cents",
    "engagement_id", "engagement_title", "engagement_description", "stage",
    "invoice_number", "invoice_date", "invoice_amount_cents", "invoice_status",
    "payment_method", "payment_link", "payment_reference", "invoice_notes", "engagement_created_at",
  ]];

  for (const r of results) {
    rows.push([
      r.client_id, r.client_name, r.client_company, r.client_email, r.client_phone, r.client_notes,
      r.client_created_at,
      r.engagement_count, r.total_invoiced_cents, r.total_paid_cents,
      r.engagement_id, r.engagement_title, r.engagement_description, r.stage,
      r.invoice_number, r.invoice_date, r.invoice_amount_cents, r.invoice_status,
      r.payment_method, r.payment_link, r.payment_reference, r.invoice_notes, r.engagement_created_at,
    ]);
  }
  return csvResponse("clients", rows);
}

async function exportEngagements(env) {
  const { results } = await env.DB.prepare(
    `SELECT e.id AS engagement_id, c.name AS client_name, c.company AS client_company, c.email AS client_email,
            e.title, e.description, e.stage, e.invoice_number, e.invoice_date, e.invoice_amount_cents,
            e.invoice_status, e.payment_method, e.payment_link, e.payment_reference,
            e.invoice_notes, e.contract_signed_at, e.created_at
     FROM engagements e
     JOIN clients c ON c.id = e.client_id
     ORDER BY e.created_at DESC`
  ).all();

  const rows = [[
    "engagement_id", "client_name", "client_company", "client_email", "title", "description", "stage",
    "invoice_number", "invoice_date", "invoice_amount_cents", "invoice_status",
    "payment_method", "payment_link", "payment_reference", "invoice_notes", "contract_signed_at", "created_at",
  ]];

  for (const r of results) {
    rows.push([
      r.engagement_id, r.client_name, r.client_company, r.client_email, r.title, r.description, r.stage,
      r.invoice_number, r.invoice_date, r.invoice_amount_cents, r.invoice_status,
      r.payment_method, r.payment_link, r.payment_reference, r.invoice_notes, r.contract_signed_at, r.created_at,
    ]);
  }
  return csvResponse("engagements", rows);
}

export async function onRequestGet({ request, env }) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;

  const url = new URL(request.url);
  const type = (url.searchParams.get("type") || "").toLowerCase();
  if (type === "clients") return exportClients(env);
  if (type === "engagements") return exportEngagements(env);

  return new Response(JSON.stringify({ error: "type must be clients or engagements" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}
