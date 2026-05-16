import { json, randomToken, sendEmail, sha256 } from "../../_shared/auth.js";

const NEUTRAL_MESSAGE = "If that email matches a client account, we'll send a secure login link.";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function renderMagicLinkEmail({ clientName, link }) {
  const subject = "Your AI Impact Maine client portal link";
  const text = `Hello${clientName ? ` ${clientName}` : ""},\n\nUse this secure link to access your AI Impact Maine client dashboard:\n\n${link}\n\nThis link expires in 15 minutes and can only be used once.\n\nIf you did not request this, you can ignore this email.`;
  const html = `<!doctype html><html><body style="margin:0;background:#f7f5f2;font-family:Arial,sans-serif;color:#1a2744;">
    <div style="max-width:620px;margin:0 auto;padding:32px 20px;">
      <div style="background:#ffffff;border:1px solid #d4dde6;border-radius:8px;padding:28px;">
        <h1 style="margin:0 0 12px;font-family:Georgia,serif;color:#1a2744;">AI Impact Maine</h1>
        <p style="font-size:16px;line-height:1.6;color:#3d4a5c;">Hello${clientName ? ` ${clientName}` : ""},</p>
        <p style="font-size:16px;line-height:1.6;color:#3d4a5c;">Use the secure button below to access your client dashboard.</p>
        <p style="margin:28px 0;"><a href="${link}" style="background:#3d7f8a;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:4px;font-weight:700;display:inline-block;">Open client dashboard</a></p>
        <p style="font-size:14px;line-height:1.6;color:#6b7a8d;">This link expires in 15 minutes and can only be used once. If you did not request this, you can ignore this email.</p>
      </div>
    </div>
  </body></html>`;
  return { subject, text, html };
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  const email = normalizeEmail(body.email);
  const ip = request.headers.get("CF-Connecting-IP") || "";

  if (!email || !email.includes("@")) return json({ message: NEUTRAL_MESSAGE });

  const now = new Date();
  const since = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM portal_magic_links WHERE requested_ip = ? AND created_at > ?"
  ).bind(ip, since).first();

  if ((recent?.count || 0) >= 5) return json({ message: NEUTRAL_MESSAGE });

  const client = await env.DB.prepare(
    "SELECT id, name, email FROM clients WHERE lower(trim(email)) = ? LIMIT 1"
  ).bind(email).first();

  if (client) {
    const token = randomToken(32);
    const tokenHash = await sha256(token);
    const emailHash = await sha256(email);
    const createdAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
    const url = new URL(request.url);
    const link = `${url.origin}/client-dashboard?token=${encodeURIComponent(token)}`;

    await env.DB.prepare(
      "INSERT INTO portal_magic_links (client_id, email_hash, token_hash, requested_ip, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(client.id, emailHash, tokenHash, ip, expiresAt, createdAt).run();

    const emailBody = renderMagicLinkEmail({ clientName: client.name, link });
    await sendEmail(env, {
      to: client.email,
      subject: emailBody.subject,
      text: emailBody.text,
      html: emailBody.html,
    });
  }

  return json({ message: NEUTRAL_MESSAGE });
}
