// functions/_shared/auth.js
//
// Auth, helpers, and email sending.

import { renderEmail as renderEmailTemplate } from "./email-templates.js";

// ---------- Admin auth ----------
const ADMIN_SESSION_COOKIE = "aima_admin_session";
const PORTAL_SESSION_COOKIE = "aima_portal_session";
const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;
const PORTAL_SESSION_TTL_SECONDS = 2 * 60 * 60;

function base64url(bytes) {
  let binary = "";
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return base64url(new Uint8Array(hash));
}

export function randomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

export function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const parts = cookie.split(";").map(part => part.trim());
  const match = parts.find(part => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

function secureCookie(name, value, maxAgeSeconds) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=Lax`;
}

export function expiredCookie(name) {
  return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

export function verifyBasicAdmin(request, env) {
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  let decoded;
  try { decoded = atob(header.slice(6)); } catch { return false; }
  const [, pass] = decoded.split(":");
  return Boolean(env.ADMIN_PASSWORD && pass === env.ADMIN_PASSWORD);
}

async function adminSignature(env, expiresAt, nonce) {
  return sha256(`${expiresAt}.${nonce}.${env.ADMIN_PASSWORD || ""}`);
}

export async function createAdminSessionCookie(env) {
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_SECONDS * 1000;
  const nonce = randomToken(18);
  const sig = await adminSignature(env, expiresAt, nonce);
  return secureCookie(ADMIN_SESSION_COOKIE, `${expiresAt}.${nonce}.${sig}`, ADMIN_SESSION_TTL_SECONDS);
}

export async function verifyAdminSession(request, env) {
  const raw = getCookie(request, ADMIN_SESSION_COOKIE);
  if (!raw || !env.ADMIN_PASSWORD) return false;
  const [expiresAt, nonce, sig] = raw.split(".");
  if (!expiresAt || !nonce || !sig || Number(expiresAt) <= Date.now()) return false;
  const expected = await adminSignature(env, expiresAt, nonce);
  return expected === sig;
}

export async function requireAdmin(request, env) {
  if (await verifyAdminSession(request, env)) return null;
  if (verifyBasicAdmin(request, env)) return null;
  return adminUnauthorized();
}

export function adminUnauthorized() {
  return new Response("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="AI Impact Maine Admin"' },
  });
}

export function clientEmail(request) {
  return request.headers.get("CF-Access-Authenticated-User-Email") || null;
}

// ---------- Client portal sessions ----------
export async function createPortalSession(env, request, clientId) {
  const token = randomToken(32);
  const tokenHash = await sha256(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PORTAL_SESSION_TTL_SECONDS * 1000).toISOString();
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const ua = request.headers.get("User-Agent") || "";

  await env.DB.prepare(
    `INSERT INTO portal_sessions
     (client_id, session_hash, requested_ip, user_agent, expires_at, created_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(clientId, tokenHash, ip, ua, expiresAt, now.toISOString(), now.toISOString()).run();

  return {
    token,
    cookie: secureCookie(PORTAL_SESSION_COOKIE, token, PORTAL_SESSION_TTL_SECONDS),
    expiresAt,
  };
}

export async function getPortalSession(request, env) {
  const token = getCookie(request, PORTAL_SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  const session = await env.DB.prepare(
    `SELECT id, client_id, expires_at
     FROM portal_sessions
     WHERE session_hash = ? AND revoked_at IS NULL AND expires_at > ?
     LIMIT 1`
  ).bind(tokenHash, now).first();
  if (!session) return null;

  env.DB.prepare("UPDATE portal_sessions SET last_seen_at = ? WHERE id = ?")
    .bind(now, session.id)
    .run()
    .catch(() => {});

  return session;
}

export async function getPortalSessionForSlug(request, env, slug) {
  const session = await getPortalSession(request, env);
  if (!session) return null;
  const engagement = await env.DB.prepare(
    "SELECT id, client_id FROM engagements WHERE slug = ? LIMIT 1"
  ).bind(slug).first();
  if (!engagement || engagement.client_id !== session.client_id) return null;
  return { session, engagement };
}

export async function requirePortalSessionForSlug(request, env, slug, options = {}) {
  const auth = await getPortalSessionForSlug(request, env, slug);
  if (auth) return auth;
  if (options.json) return json({ error: "portal session required" }, 401);
  const url = new URL(request.url);
  const next = encodeURIComponent(url.pathname + url.search);
  return Response.redirect(`${url.origin}/client-portal?next=${next}`, 302);
}

export function requireSameOrigin(request) {
  if (request.method === "GET" || request.method === "HEAD") return null;
  const origin = request.headers.get("Origin");
  if (!origin) return null;
  const url = new URL(request.url);
  if (origin !== url.origin) return json({ error: "invalid origin" }, 403);
  return null;
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
