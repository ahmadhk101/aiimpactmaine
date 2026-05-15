// functions/library/index.js
// GET /library  — public-ish landing for the resource library.
// If Cloudflare Access is in front of /library, only authenticated clients see it.
// We rely on Access to gate; this function just renders the resource list.

import { escapeHtml, formatSize, clientEmail } from "../_shared/auth.js";

export async function onRequest({ request, env }) {
  const { results: resources } = await env.DB.prepare(
    "SELECT id, title, description, filename, size_bytes, category FROM library_resources ORDER BY category, uploaded_at DESC"
  ).all();

  const email = clientEmail(request);

  // Group by category
  const grouped = {};
  for (const r of resources) {
    const cat = r.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(r);
  }
  const catOrder = ["recording", "template", "guide", "reference", "other"];
  const catLabels = {
    recording: "Session Recordings",
    template: "Templates",
    guide: "Guides",
    reference: "References",
    other: "Other",
  };

  const sectionsHtml = catOrder
    .filter(c => grouped[c])
    .map(c => `
      <section class="cat">
        <h2>${catLabels[c]}</h2>
        <div class="grid">
          ${grouped[c].map(r => `
            <a class="card" href="/api/library/download?id=${r.id}">
              <div class="card-title">${escapeHtml(r.title)}</div>
              ${r.description ? `<div class="card-desc">${escapeHtml(r.description)}</div>` : ""}
              <div class="card-meta">${escapeHtml(r.filename)} · ${formatSize(r.size_bytes)}</div>
            </a>
          `).join("")}
        </div>
      </section>`).join("");

  return new Response(`<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Resource Library — AI Impact Maine</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  :root { --navy:#0a2540; --teal:#2a9d8f; --sand:#f4ede4; --line:#e5e0d6; --muted:#6b7280; }
  *{box-sizing:border-box}
  body{margin:0;font-family:'DM Sans',system-ui,sans-serif;background:var(--sand);color:#1a1a1a}
  header{background:var(--navy);color:var(--sand);padding:2rem 1.5rem}
  .header-inner{max-width:1100px;margin:0 auto;display:flex;justify-content:space-between;align-items:baseline}
  .brand{font-family:'Cormorant Garamond',serif;font-size:1.5rem;margin:0}
  .brand small{display:block;font-family:'DM Sans',sans-serif;font-size:0.7rem;letter-spacing:0.15em;text-transform:uppercase;opacity:0.6}
  .user{font-size:0.85rem;opacity:0.7}
  main{max-width:1100px;margin:2rem auto;padding:0 1.5rem}
  h2{font-family:'Cormorant Garamond',serif;color:var(--navy);font-size:1.6rem;margin:2rem 0 1rem;letter-spacing:0.01em}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem}
  .card{background:white;border-radius:4px;padding:1.5rem;text-decoration:none;color:inherit;box-shadow:0 2px 8px rgba(10,37,64,0.05);transition:transform 0.15s,box-shadow 0.15s;border-top:3px solid var(--teal);display:block}
  .card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(10,37,64,0.1)}
  .card-title{font-family:'Cormorant Garamond',serif;font-size:1.25rem;color:var(--navy);margin-bottom:0.5rem;font-weight:600}
  .card-desc{font-size:0.9rem;color:#444;margin-bottom:0.75rem;line-height:1.5}
  .card-meta{font-size:0.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em}
  .empty{padding:3rem;text-align:center;color:var(--muted);font-style:italic;background:white;border-radius:4px}
  footer{text-align:center;color:var(--muted);font-size:0.85rem;margin-top:3rem;padding-bottom:2rem}
</style>
</head><body>
<header><div class="header-inner">
  <h1 class="brand">AI Impact Maine<small>Resource Library</small></h1>
  ${email ? `<div class="user">${escapeHtml(email)}</div>` : ""}
</div></header>
<main>
  ${sectionsHtml || `<div class="empty">No resources have been added to the library yet.</div>`}
  <footer>Questions? Email hello@aiimpactmaine.com</footer>
</main>
</body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
