import { json, sendEmail } from "../_shared/auth.js";

const FIELD_NAMES = [
  "source", "form_type", "firstName", "lastName", "name", "email", "phone",
  "organization", "role", "sector", "interest", "involvement", "message",
  "package", "resource", "resource_slug", "resource_url", "page_url",
];

async function parseLeadRequest(request) {
  const type = request.headers.get("Content-Type") || "";
  if (type.includes("application/json")) {
    return request.json().catch(() => ({}));
  }
  const form = await request.formData().catch(() => null);
  if (!form) return {};
  const data = {};
  for (const field of FIELD_NAMES) {
    const value = form.get(field);
    if (value !== null && typeof value !== "object") data[field] = value;
  }
  return data;
}

function clean(value, max = 2000) {
  return String(value || "").trim().slice(0, max);
}

function leadSummary(lead) {
  return [
    `Source: ${lead.source || "Website"}`,
    `Name: ${lead.name || [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Not provided"}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone || "Not provided"}`,
    `Organization: ${lead.organization || "Not provided"}`,
    `Interest: ${lead.interest || lead.package || lead.resource || "Not provided"}`,
    `Role: ${lead.role || "Not provided"}`,
    `Sector: ${lead.sector || "Not provided"}`,
    `Involvement: ${lead.involvement || "Not provided"}`,
    "",
    lead.message || "No message provided.",
    "",
    `Page: ${lead.page_url || "Not provided"}`,
  ].join("\n");
}

export async function onRequestPost({ request, env }) {
  const raw = await parseLeadRequest(request);
  const lead = {};
  for (const field of FIELD_NAMES) lead[field] = clean(raw[field], field === "message" ? 5000 : 500);
  lead.email = clean(lead.email, 320).toLowerCase();
  lead.name = lead.name || [lead.firstName, lead.lastName].filter(Boolean).join(" ");
  lead.source = lead.source || lead.form_type || "Website";
  lead.page_url = lead.page_url || request.headers.get("Referer") || "";

  if (!lead.email || !lead.email.includes("@")) {
    return json({ error: "valid email required" }, 400);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "";
  const ua = request.headers.get("User-Agent") || "";
  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM leads WHERE ip_address = ? AND created_at > ?"
  ).bind(ip, since).first().catch(() => ({ count: 0 }));
  if ((recent?.count || 0) >= 10) return json({ ok: true });

  const { meta } = await env.DB.prepare(
    `INSERT INTO leads
     (source, form_type, first_name, last_name, name, email, phone, organization,
      role, sector, interest, involvement, message, package_name, resource_url,
      page_url, status, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`
  ).bind(
    lead.source, lead.form_type || null, lead.firstName || null, lead.lastName || null,
    lead.name || null, lead.email, lead.phone || null, lead.organization || null,
    lead.role || null, lead.sector || null, lead.interest || null, lead.involvement || null,
    lead.message || null, lead.package || null, lead.resource_url || lead.resource || null,
    lead.page_url || null, ip, ua
  ).run();

  const notifyTo = env.LEAD_NOTIFY_EMAIL || "ahmad@aiimpactmaine.com";
  await sendEmail(env, {
    to: notifyTo,
    subject: `New AI Impact Maine lead: ${lead.source}`,
    text: leadSummary(lead),
    html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;line-height:1.5;">${leadSummary(lead)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`,
  });

  return json({ ok: true, id: meta.last_row_id }, 201);
}
