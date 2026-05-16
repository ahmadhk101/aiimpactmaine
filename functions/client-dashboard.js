import { escapeHtml, formatMoney } from "./_shared/auth.js";

function base64url(bytes) {
  let binary = "";
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return base64url(new Uint8Array(hash));
}

function pageShell({ title, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} | AI Impact Maine</title>
<meta name="robots" content="noindex,nofollow">
<link rel="icon" href="/assets/logo-icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/shared.css">
<style>
  .client-dash-wrap { min-height: 72vh; padding: 140px 6% 80px; background: var(--off-white); }
  .client-dash-inner { max-width: 980px; margin: 0 auto; }
  .client-dash-kicker { color: var(--teal); font-size: 0.78rem; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; margin-bottom: 0.8rem; }
  .client-dash-title { font-family: 'Cormorant Garamond', serif; color: var(--navy); font-size: clamp(2.3rem, 5vw, 4rem); margin: 0 0 0.6rem; }
  .client-dash-lede { color: var(--text-body); line-height: 1.7; max-width: 680px; margin-bottom: 2rem; }
  .engagement-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; }
  .engagement-card { background: white; border: 1px solid var(--border); border-radius: 10px; padding: 1.4rem; box-shadow: 0 8px 26px rgba(26,39,68,0.08); }
  .engagement-card h2 { font-family: 'Cormorant Garamond', serif; color: var(--navy); font-size: 1.45rem; margin: 0 0 0.75rem; }
  .engagement-meta { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
  .engagement-pill { display: inline-flex; align-items: center; border: 1px solid var(--border); border-radius: 999px; color: var(--text-body); font-size: 0.78rem; padding: 0.28rem 0.65rem; text-transform: capitalize; }
  .empty-panel { background: white; border: 1px solid var(--border); border-radius: 10px; padding: 1.5rem; color: var(--text-body); }
</style>
</head>
<body>
<nav id="navbar">
  <div class="nav-inner">
    <a href="/" class="nav-logo"><img src="/assets/logo.svg" alt="AI Impact Maine logo" width="205" height="72"></a>
    <ul class="nav-links">
      <li><a href="/conference.html" class="nav-conf">Conference</a></li>
      <li><a href="/services.html">Services</a></li>
      <li><a href="/services-payment-portal.html">Pricing</a></li>
      <li><a href="/funding.html">Funding</a></li>
      <li><a href="/assessment.html">Free Assessment</a></li>
      <li><a href="/resources/">Resources</a></li>
      <li><a href="/faq.html">FAQ</a></li>
      <li><a href="/about.html">About</a></li>
      <li><a href="/client-portal" class="nav-active">Client Portal</a></li>
      <li><a href="/contact.html" class="nav-cta">Book a Call</a></li>
    </ul>
    <button class="nav-hamburger" id="hamburger" aria-label="Menu" type="button" aria-controls="mobileMenu" aria-expanded="false"><span></span><span></span><span></span></button>
  </div>
</nav>
<div class="mobile-menu" id="mobileMenu" aria-hidden="true"><ul><li><a href="/services.html">Services</a></li><li><a href="/services-payment-portal.html">Pricing</a></li><li><a href="/resources/">Resources</a></li><li><a href="/client-portal">Client Portal</a></li><li><a href="/contact.html">Book a Call</a></li></ul></div>
${body}
<footer><div class="footer-inner"><div class="footer-bottom"><p>&copy; 2026 AI Impact Maine &middot; All rights reserved</p><div class="footer-contact"><a class="footer-phone" href="tel:2074058604">207-405-8604</a><div class="footer-location"><span>30 Danforth Street, Portland, Maine 04101</span></div></div></div></div></footer>
<script src="/shared.js"></script>
</body>
</html>`;
}

function invalidPage() {
  return pageShell({
    title: "Client Portal",
    body: `<main class="client-dash-wrap"><div class="client-dash-inner"><div class="client-dash-kicker">Client Portal</div><h1 class="client-dash-title">This link is no longer valid.</h1><p class="client-dash-lede">Secure login links expire after 15 minutes and can only be used once.</p><a class="btn-primary" href="/client-portal">Request a new link</a></div></main>`,
  });
}

function dashboardPage(client, engagements) {
  const cards = engagements.length ? engagements.map(e => `
    <article class="engagement-card">
      <h2>${escapeHtml(e.title)}</h2>
      <div class="engagement-meta">
        <span class="engagement-pill">${escapeHtml(e.stage || "pre")}</span>
        <span class="engagement-pill">Invoice: ${escapeHtml(e.invoice_status || "unpaid")}</span>
        ${e.invoice_amount_cents ? `<span class="engagement-pill">${formatMoney(e.invoice_amount_cents)}</span>` : ""}
      </div>
      <a class="btn-primary" href="/c/${encodeURIComponent(e.slug)}">Open portal</a>
    </article>`).join("") : `<div class="empty-panel">No engagements are currently connected to this email.</div>`;

  return pageShell({
    title: "Client Dashboard",
    body: `<main class="client-dash-wrap"><div class="client-dash-inner"><div class="client-dash-kicker">Client Dashboard</div><h1 class="client-dash-title">Welcome, ${escapeHtml(client.name)}</h1><p class="client-dash-lede">Choose an engagement below to view materials, invoices, messages, surveys, and next steps.</p><div class="engagement-grid">${cards}</div></div></main>`,
  });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return new Response(invalidPage(), { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const tokenHash = await sha256(token);
  const now = new Date().toISOString();
  const link = await env.DB.prepare(
    `SELECT p.id, p.client_id, c.name, c.email
     FROM portal_magic_links p
     JOIN clients c ON c.id = p.client_id
     WHERE p.token_hash = ? AND p.used_at IS NULL AND p.expires_at > ?
     LIMIT 1`
  ).bind(tokenHash, now).first();

  if (!link) {
    return new Response(invalidPage(), { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  await env.DB.prepare("UPDATE portal_magic_links SET used_at = ? WHERE id = ?")
    .bind(now, link.id)
    .run();

  const { results } = await env.DB.prepare(
    "SELECT id, slug, title, stage, invoice_status, invoice_amount_cents, created_at FROM engagements WHERE client_id = ? ORDER BY created_at DESC"
  ).bind(link.client_id).all();

  return new Response(dashboardPage(link, results), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
