// functions/api/admin/email.js
// POST /api/admin/email   { engagement_id, template, subject?, body?, send_now?, preview_only?, test_to? }
//
// Modes:
//   preview_only: true  → renders subject/text/html and returns; nothing saved, nothing sent
//   send_now: true      → sends via Resend, logs to email_log as 'sent' or 'failed'
//   (neither)           → composes & logs as 'drafted', returns mailto/Gmail links for manual send
//
// test_to                → optional override recipient (send to yourself first). Still logs.

import { requireAdmin, json, renderEmail, sendEmail, logActivity, FROM_EMAIL } from "../../_shared/auth.js";

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth) return auth;

  const body = await request.json().catch(() => ({}));
  const {
    engagement_id, template,
    subject: customSubject, body: customBody,
    send_now, preview_only, test_to,
  } = body;
  if (!engagement_id) return json({ error: "engagement_id required" }, 400);

  const eng = await env.DB.prepare(
    `SELECT e.id, e.slug, e.title, c.name AS client_name, c.email AS client_email
     FROM engagements e JOIN clients c ON c.id = e.client_id WHERE e.id = ?`
  ).bind(engagement_id).first();
  if (!eng) return json({ error: "not found" }, 404);

  // Compose using the template engine (returns subject, text, html)
  const url = new URL(request.url);
  const rendered = renderEmail(template || "custom", {
    origin: url.origin,
    engagement: eng,
    client: { name: eng.client_name },
    subject: customSubject,
    body: customBody,
  });

  let subject = rendered.subject;
  let text = rendered.text;
  let html = rendered.html;

  // For custom template, customSubject must always win
  if (template === "custom") {
    if (customSubject) subject = customSubject;
    if (!subject || !customBody) return json({ error: "Custom template requires subject and body" }, 400);
  }

  if (!subject || !text) return json({ error: "Could not render email" }, 500);

  // Preview-only: just return the rendered email, don't log or send
  if (preview_only) {
    return json({ status: "preview", from: FROM_EMAIL, recipient: eng.client_email, subject, text, html });
  }

  // Send or draft
  const recipient = test_to || eng.client_email;
  let status = "drafted";
  let sendResult = null;
  if (send_now) {
    sendResult = await sendEmail(env, { to: recipient, subject, text, html });
    status = sendResult.sent ? "sent" : "failed";
  }

  // Log (recipient logged is the actual recipient, even if test)
  await env.DB.prepare(
    "INSERT INTO email_log (engagement_id, recipient, subject, body, status, template) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(
    engagement_id, recipient, subject, text, status,
    (template || "custom") + (test_to ? " (test)" : "")
  ).run();

  await logActivity(env, {
    engagement_id,
    event_type: send_now
      ? (sendResult?.sent ? (test_to ? "email_test_sent" : "email_sent") : "email_failed")
      : "email_drafted",
    detail: subject + (test_to ? ` → test:${test_to}` : ""),
    request,
  });

  // Fallback mailto/Gmail links — use plain text for body since mailto can't carry HTML
  const mailto = `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  const gmailCompose = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}&authuser=${encodeURIComponent("ahmadhk101@gmail.com")}`;

  return json({
    status,
    from: FROM_EMAIL,
    recipient,
    subject,
    text,
    html,
    mailto,
    gmailCompose,
    sendResult,
  }, 201);
}

