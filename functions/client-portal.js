function renderPage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Client Portal | AI Impact Maine</title>
<meta name="robots" content="noindex,nofollow">
<link rel="icon" href="/assets/logo-icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/shared.css">
<style>
  .portal-login-hero { min-height: 72vh; padding: 150px 6% 80px; background: linear-gradient(135deg, var(--navy) 0%, #243558 100%); display: flex; align-items: center; justify-content: center; }
  .portal-login-card { width: 100%; max-width: 560px; background: rgba(255,255,255,0.96); border: 1px solid rgba(255,255,255,0.25); border-radius: 12px; padding: 2.5rem; box-shadow: 0 24px 70px rgba(0,0,0,0.22); }
  .portal-login-card h1 { font-family: 'Cormorant Garamond', serif; color: var(--navy); font-size: clamp(2.2rem, 5vw, 3.4rem); margin: 0 0 0.75rem; }
  .portal-login-card p { color: var(--text-body); line-height: 1.7; margin-bottom: 1.5rem; }
  .portal-login-card label { display: block; color: var(--navy); font-size: 0.78rem; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700; margin-bottom: 0.45rem; }
  .portal-login-card input { width: 100%; border: 1px solid var(--border); background: var(--off-white); border-radius: 4px; padding: 0.9rem 1rem; font: inherit; color: var(--navy); }
  .portal-login-card button { width: 100%; margin-top: 1rem; }
  .portal-result { margin-top: 1rem; color: var(--teal); font-weight: 600; min-height: 1.4rem; }
  @media(max-width:600px){ .portal-login-hero { padding: 120px 5% 60px; } .portal-login-card { padding: 1.6rem; } }
</style>
</head>
<body>
<nav id="navbar">
  <div class="nav-inner">
    <a href="/" class="nav-logo"><img src="/assets/logo.svg" alt="AI Impact Maine logo" width="205" height="72"></a>
    <ul class="nav-links">
      <li><a href="/conference" class="nav-conf">Conference</a></li>
      <li><a href="/services">Services</a></li>
      <li><a href="/services-payment-portal">Pricing</a></li>
      <li><a href="/funding">Funding</a></li>
      <li><a href="/assessment">Free Assessment</a></li>
      <li><a href="/resources/">Resources</a></li>
      <li><a href="/faq">FAQ</a></li>
      <li><a href="/about">About</a></li>
      <li><a href="/client-portal" class="nav-active">Client Portal</a></li>
      <li><a href="/contact" class="nav-cta">Book a Call</a></li>
    </ul>
    <button class="nav-hamburger" id="hamburger" aria-label="Menu" type="button" aria-controls="mobileMenu" aria-expanded="false"><span></span><span></span><span></span></button>
  </div>
</nav>
<div class="mobile-menu" id="mobileMenu" aria-hidden="true">
  <ul>
    <li><a href="/conference">Conference</a></li>
    <li><a href="/services">Services</a></li>
    <li><a href="/services-payment-portal">Pricing</a></li>
    <li><a href="/funding">Funding</a></li>
    <li><a href="/assessment">Free Assessment</a></li>
    <li><a href="/resources/">Resources</a></li>
    <li><a href="/faq">FAQ</a></li>
    <li><a href="/about">About</a></li>
    <li><a href="/client-portal">Client Portal</a></li>
    <li><a href="/contact">Book a Call</a></li>
  </ul>
</div>
<main>
  <section class="portal-login-hero">
    <form class="portal-login-card" id="portalLoginForm">
      <h1>Client Portal</h1>
      <p>Enter your client email and we will send a secure login link to your inbox.</p>
      <label for="portalEmail">Email address</label>
      <input id="portalEmail" name="email" type="email" autocomplete="email" required>
      <button class="btn-primary" type="submit">Send secure login link</button>
      <div class="portal-result" id="portalResult" role="status"></div>
    </form>
  </section>
</main>
<footer><div class="footer-inner"><div class="footer-bottom"><p>&copy; 2026 AI Impact Maine &middot; All rights reserved</p><div class="footer-contact"><a class="footer-phone" href="tel:2074058604">207-405-8604</a><div class="footer-location"><span>30 Danforth Street, Portland, Maine 04101</span></div></div></div></div></footer>
<script src="/shared.js"></script>
<script>
document.getElementById('portalLoginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  const result = document.getElementById('portalResult');
  btn.disabled = true;
  result.textContent = '';
  try {
    const res = await fetch('/api/portal/request-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: document.getElementById('portalEmail').value })
    });
    const data = await res.json().catch(function(){ return {}; });
    result.textContent = data.message || "If that email matches a client account, we'll send a secure login link.";
  } catch (err) {
    result.textContent = "If that email matches a client account, we'll send a secure login link.";
  }
  btn.disabled = false;
});
</script>
</body>
</html>`;
}

export async function onRequestGet() {
  return new Response(renderPage(), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
