// functions/api/admin/clients.js
// GET  /api/admin/clients         — list all clients
// POST /api/admin/clients         — create a client { name, company, email, phone, notes }

import { requireAdmin, json } from "../../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  const auth = requireAdmin(request, env);
  if (auth) return auth;

  const { results } = await env.DB.prepare(
    "SELECT id, name, company, email, phone, created_at FROM clients ORDER BY created_at DESC"
  ).all();
  return json({ clients: results });
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
