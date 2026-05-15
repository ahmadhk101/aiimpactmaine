// functions/_shared/auth.js
//
// Auth, helpers, and email sending.

import { renderEmail as renderEmailTemplate } from "./email-templates.js";

// ---------- Admin auth ----------
export function requireAdmin(request, env) {
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Basic ")) return unauthorized();
  let decoded;
  try { decoded = atob(header.slice(6)); } catch { return unauthorized(); }
  const [, pass] = decoded.split(":");
  if (!env.ADMIN_PASSWORD || pass !== env.ADMIN_PASSWORD) return unauthorized();
  return null;
}

function unauthorized() {
  return new Response("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="AI Impact Maine Admin"' },
  });
}

export function clientEmail(request) {
  return request.headers.get("CF-Access-Authenticated-User-Email") || null;
}

// ---------- Helpers ----------
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function makeSlug(title) {
  const base = String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = crypto.randomUUID().split("-")[0];
  return `${base}-${suffix}`;
}

export function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function formatMoney(cents) {
  if (cents == null) return "";
  return "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------- Activity log ----------
export async function logActivity(env, { engagement_id, event_type, detail, request }) {
  try {
    const ip = request?.headers.get("CF-Connecting-IP") || "";
    const ua = request?.headers.get("User-Agent") || "";
    await env.DB.prepare(
      "INSERT INTO activity_log (engagement_id, event_type, detail, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)"
    ).bind(engagement_id || null, event_type, detail || null, ip, ua).run();
  } catch (e) { /* fire and forget */ }
}

// ---------- Email config ----------
export const FROM_EMAIL = "ahmad@aiimpactmaine.com";
export const FROM_NAME = "Ahmad Khan";
export const REPLY_TO = "ahmad@aiimpactmaine.com";

// Re-export the template renderer so callers don't need to know about email-templates.js
export const renderEmail = renderEmailTemplate;

// ---------- Send email via Resend ----------
// Sends as multipart MIME: both HTML and plain-text. Email clients pick the best.
export async function sendEmail(env, { to, subject, text, html, replyTo }) {
  if (!env.RESEND_API_KEY) {
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  const payload = {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: [to],
    subject,
    text,                              // plain text fallback (deliverability + accessibility)
    reply_to: replyTo || REPLY_TO,
  };
  if (html) payload.html = html;       // HTML version (rendered when supported)

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { sent: false, error: `Resend ${res.status}: ${errText}` };
    }
    const data = await res.json();
    return { sent: true, id: data.id };
  } catch (e) {
    return { sent: false, error: String(e) };
  }
}
