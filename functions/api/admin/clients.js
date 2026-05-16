// functions/api/admin/clients.js
// GET  /api/admin/clients         — list all clients
// POST /api/admin/clients         — create a client { name, company, email, phone, notes }

import { requireAdmin, json } from "../../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;

  const { results } = await env.DB.prepare(
    "SELECT id, name, company, email, phone, notes, created_at FROM clients ORDER BY created_at DESC"
  ).all();

  const { results: columns } = await env.DB.prepare("SELECT name FROM pragma_table_info('engagements')").all();
  const existingColumns = new Set(columns.map(c => c.name));
  const optional = (name) => existingColumns.has(name) ? `e.${name}` : `NULL AS ${name}`;

  const { results: engagements } = await env.DB.prepare(
    `SELECT e.id, e.client_id, e.slug, e.title, e.stage, e.created_at,
            ${optional("description")},
            ${optional("invoice_number")},
            ${optional("invoice_date")},
            ${optional("invoice_amount_cents")},
            ${optional("invoice_status")},
            ${optional("payment_method")},
            ${optional("payment_link")},
            ${optional("payment_reference")},
            ${optional("invoice_notes")}
     FROM engagements e
     ORDER BY e.created_at DESC`
  ).all();

  const byClient = new Map(results.map(c => [c.id, { ...c, engagements: [] }]));
  for (const engagement of engagements) {
    byClient.get(engagement.client_id)?.engagements.push(engagement);
  }

  return json({ clients: Array.from(byClient.values()) });
}

export async function onRequestPost({ request, env }) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;

  const body = await request.json().catch(() => ({}));
  const { name, company, email, phone, notes } = body;
  if (!name || !email) return json({ error: "name and email required" }, 400);

  const { meta } = await env.DB.prepare(
    "INSERT INTO clients (name, company, email, phone, notes) VALUES (?, ?, ?, ?, ?)"
  )
    .bind(name, company || null, email, phone || null, notes || null)
    .run();

  return json({ id: meta.last_row_id, name, email }, 201);
}

export async function onRequestPut({ request, env }) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;

  const body = await request.json().catch(() => ({}));
  const { id } = body;
  if (!id) return json({ error: "id required" }, 400);

  const allowed = ["name", "company", "email", "phone", "notes"];
  const updates = [];
  const params = [];
  for (const field of allowed) {
    if (field in body) {
      updates.push(`${field} = ?`);
      params.push(body[field]);
    }
  }
  if (!updates.length) return json({ error: "no fields to update" }, 400);

  params.push(id);
  await env.DB.prepare(`UPDATE clients SET ${updates.join(", ")} WHERE id = ?`)
    .bind(...params)
    .run();

  return json({ id, updated: updates.length });
}
