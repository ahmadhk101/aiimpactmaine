// functions/_shared/email-templates.js
//
// Branded HTML email templates for AI Impact Maine.
//
// Design constraints (from email deliverability research):
//   - Hybrid table layout (compatible with Outlook, Gmail, iOS Mail)
//   - All CSS inlined; <style> block is only for media queries / dark mode
//   - Web-safe fonts with fallbacks (Georgia, Arial)
//   - Under 102KB total (Gmail clip threshold) — these are well under 20KB
//   - Multipart MIME: always send HTML + plain text together
//   - No external images (logo rendered as text styling to avoid loading issues)
//   - Single clear CTA button (table-based, not CSS-only, for Outlook)
//   - Mobile-responsive via @media query
//
// Public API:
//   renderEmail(template, ctx) -> { subject, text, html }

const FROM_NAME = "Ahmad Khan";
const FROM_EMAIL = "ahmad@aiimpactmaine.com";
const BRAND_NAME = "AI Impact Maine";

// Brand colors — must match the site
const C = {
  navy: "#0a2540",
  teal: "#2a9d8f",
  sand: "#f4ede4",
  ink: "#1a1a1a",
  muted: "#6b7280",
  line: "#e5e0d6",
  white: "#ffffff",
};

export function renderEmail(template, ctx) {
  const portalUrl = `${ctx.origin}/c/${ctx.engagement.slug}`;
  const clientFirst = (ctx.client.name || "").split(" ")[0] || "there";

  switch (template) {
    case "portal_invite":
      return wrap({
        subject: `Welcome to ${BRAND_NAME} — ${ctx.engagement.title}`,
        preheader: `Your client portal for ${ctx.engagement.title} is ready.`,
        greeting: `Hi ${clientFirst},`,
        intro: `Thanks for engaging ${BRAND_NAME} for <strong>${esc(ctx.engagement.title)}</strong>. I've set up a dedicated client portal for you with everything you'll need throughout our engagement.`,
        ctaLabel: "Open your portal",
        ctaUrl: portalUrl,
        bullets: [
          "Review and acknowledge the engagement agreement",
          "Complete the brief pre-engagement questionnaire so I can tailor the work",
          "Materials I prepare will appear there as we go",
        ],
        outro: "Let me know if you have any questions.",
      });

    case "materials_ready":
      return wrap({
        subject: `Materials ready — ${ctx.engagement.title}`,
        preheader: "New training materials are available on your portal.",
        greeting: `Hi ${clientFirst},`,
        intro: `New materials are available on your portal for <strong>${esc(ctx.engagement.title)}</strong>.`,
        ctaLabel: "View materials",
        ctaUrl: portalUrl,
        outro: "They'll remain accessible for the duration of our engagement.",
      });

    case "survey_reminder":
      return wrap({
        subject: `Quick feedback request — ${ctx.engagement.title}`,
        preheader: "Two-minute feedback survey for our recent engagement.",
        greeting: `Hi ${clientFirst},`,
        intro: `When you have a moment, would you mind completing the brief feedback survey on your portal? Your input directly shapes how I improve future engagements.`,
        ctaLabel: "Share feedback",
        ctaUrl: portalUrl,
        outro: "It takes about two minutes.",
      });

    case "invoice_reminder":
      return wrap({
        subject: `Invoice — ${ctx.engagement.title}`,
        preheader: `Invoice for ${ctx.engagement.title} is available on your portal.`,
        greeting: `Hi ${clientFirst},`,
        intro: `Just a friendly note that the invoice for <strong>${esc(ctx.engagement.title)}</strong> is available on your portal. Payment details are listed there.`,
        ctaLabel: "View invoice",
        ctaUrl: portalUrl,
        outro: "Let me know if you have any questions.",
      });

    case "custom":
      // For custom subject/body, render the body inside the brand frame.
      // The body comes through as preformatted text wrapped in <p>.
      return wrap({
        subject: ctx.subject || "",
        preheader: ctx.preheader || "",
        greeting: `Hi ${clientFirst},`,
        intro: (ctx.body || "").split(/\n\n+/).map(p => `<p style="margin:0 0 16px;">${esc(p).replace(/\n/g, "<br>")}</p>`).join(""),
        ctaLabel: ctx.ctaLabel || "View your portal",
        ctaUrl: ctx.ctaUrl || portalUrl,
        outro: "",
        introIsHtml: true,
      });

    default:
      return { subject: "", text: "", html: "" };
  }
}

// ---------- Brand-wrapped HTML email ----------
function wrap({ subject, preheader, greeting, intro, ctaLabel, ctaUrl, bullets, outro, introIsHtml }) {
  // Plain text version (mirror of HTML content)
  const lines = [
    greeting,
    "",
    stripHtml(intro),
    "",
  ];
  if (bullets) {
    bullets.forEach(b => lines.push("  • " + b));
    lines.push("");
  }
  lines.push(`${ctaLabel}: ${ctaUrl}`);
  lines.push("");
  if (outro) {
    lines.push(outro);
    lines.push("");
  }
  lines.push("Best,");
  lines.push(FROM_NAME);
  lines.push(BRAND_NAME);
  lines.push(FROM_EMAIL);
  lines.push("");
  lines.push("—");
  lines.push(`${BRAND_NAME} · Portland, Maine`);
  lines.push(`Khan Brothers LLC · aiimpactmaine.com`);
  const text = lines.join("\n");

  // HTML version
  const bulletsHtml = bullets ? `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 24px;">
      ${bullets.map(b => `
        <tr>
          <td valign="top" width="20" style="padding:4px 8px 4px 0;color:${C.teal};font-size:18px;line-height:1.4;">●</td>
          <td valign="top" style="padding:4px 0;font-size:15px;line-height:1.6;color:${C.ink};">${esc(b)}</td>
        </tr>
      `).join("")}
    </table>` : "";

  const introHtml = introIsHtml ? intro : `<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:${C.ink};">${intro}</p>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(subject)}</title>
<style>
  /* Mobile + dark mode tweaks. Most clients ignore <style>; safe overrides only. */
  @media only screen and (max-width: 480px) {
    .container { width: 100% !important; padding: 0 16px !important; }
    .content { padding: 24px !important; }
    .cta-btn { display: block !important; width: 100% !important; box-sizing: border-box !important; }
    h1 { font-size: 24px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .body-bg { background: #1a1a1a !important; }
    .card { background: #2a3038 !important; }
    .text { color: #f0f0f0 !important; }
    .muted { color: #a0a0a0 !important; }
  }
</style>
</head>
<body class="body-bg" style="margin:0;padding:0;background:${C.sand};font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- preheader (hidden, shown in inbox preview) -->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;overflow:hidden;opacity:0;color:transparent;">
    ${esc(preheader || "")}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.sand};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" class="container" style="width:560px;max-width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 24px;text-align:center;">
              <div style="font-family:Georgia,'Times New Roman',serif;color:${C.navy};font-size:24px;font-weight:600;letter-spacing:0.5px;">
                ${BRAND_NAME}
              </div>
              <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.muted};margin-top:4px;">
                Client Communication
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="card" style="background:${C.white};border-radius:4px;box-shadow:0 4px 24px rgba(10,37,64,0.08);overflow:hidden;">
              <!-- Teal accent bar -->
              <div style="height:4px;background:${C.teal};line-height:4px;font-size:0;">&nbsp;</div>

              <!-- Content -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="content" style="padding:40px;">

                    <p class="text" style="margin:0 0 24px;font-size:17px;line-height:1.5;color:${C.ink};font-family:Georgia,'Times New Roman',serif;">
                      ${esc(greeting)}
                    </p>

                    <div class="text">${introHtml}</div>

                    ${bulletsHtml}

                    <!-- CTA button (bulletproof, table-based) -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 32px;">
                      <tr>
                        <td align="center" bgcolor="${C.teal}" style="background:${C.teal};border-radius:3px;">
                          <a class="cta-btn" href="${esc(ctaUrl)}" style="display:inline-block;padding:14px 32px;font-family:'Helvetica Neue',Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;mso-padding-alt:0;text-underline-color:${C.teal};">
                            ${esc(ctaLabel)} →
                          </a>
                        </td>
                      </tr>
                    </table>

                    ${outro ? `<p class="text" style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${C.ink};">${esc(outro)}</p>` : ""}

                    <!-- Signature -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid ${C.line};margin-top:8px;padding-top:24px;">
                      <tr>
                        <td style="padding-top:24px;">
                          <div class="text" style="font-size:15px;line-height:1.5;color:${C.ink};">Best,</div>
                          <div class="text" style="font-size:15px;line-height:1.5;color:${C.ink};font-weight:600;margin-top:4px;">${FROM_NAME}</div>
                          <div class="muted" style="font-size:13px;line-height:1.5;color:${C.muted};">
                            ${BRAND_NAME}<br>
                            <a href="mailto:${FROM_EMAIL}" style="color:${C.teal};text-decoration:none;">${FROM_EMAIL}</a>
                          </div>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 16px;text-align:center;font-size:11px;line-height:1.6;color:${C.muted};font-family:'Helvetica Neue',Arial,sans-serif;">
              ${BRAND_NAME} &middot; Portland, Maine<br>
              Khan Brothers LLC &middot; <a href="https://aiimpactmaine.com" style="color:${C.muted};text-decoration:underline;">aiimpactmaine.com</a><br>
              <span style="opacity:0.6;">This is a transactional email related to your engagement. If you received this in error, please reply to let me know.</span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

// ---------- Utilities ----------
function esc(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function stripHtml(s) {
  return String(s || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
