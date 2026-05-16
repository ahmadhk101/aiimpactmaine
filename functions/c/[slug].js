// functions/c/[slug].js
// GET /c/<slug>  — full-featured client portal.
// Includes: stage timeline, contract sign, invoice, Cal.com booking, docs, surveys, messaging, library link.

import { escapeHtml, formatSize, formatMoney, logActivity, requirePortalSessionForSlug } from "../_shared/auth.js";

export async function onRequest({ params, env, request }) {
  const slug = params.slug;

  const portalAuth = await requirePortalSessionForSlug(request, env, slug);
  if (portalAuth instanceof Response) return portalAuth;

  const eng = await env.DB.prepare(
    `SELECT e.*, c.name AS client_name, c.company AS client_company, c.email AS client_email
     FROM engagements e JOIN clients c ON c.id = e.client_id
     WHERE e.slug = ? AND e.client_id = ?`
  ).bind(slug, portalAuth.session.client_id).first();

  if (!eng) {
    return new Response(renderNotFound(), { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  // Log portal view
  await logActivity(env, { engagement_id: eng.id, event_type: "portal_view", request });

  // Documents visible at current stage
  const { results: docs } = await env.DB.prepare(
    "SELECT id, filename, size_bytes FROM documents WHERE engagement_id = ? AND (visibility = 'all' OR visibility = ?) ORDER BY uploaded_at DESC"
  ).bind(eng.id, eng.stage).all();

  // Survey state — fetch all surveys assigned to this engagement, visible at current stage,
  // along with response counts to know which one-time surveys have been submitted
  const { results: surveysRaw } = await env.DB.prepare(
    `SELECT es.id, es.title, es.description, es.questions, es.visibility, es.repeatable,
            (SELECT COUNT(*) FROM surveys s WHERE s.survey_id = es.id) AS response_count
     FROM engagement_surveys es
     WHERE es.engagement_id = ? AND (es.visibility = 'all' OR es.visibility = ?)
     ORDER BY es.created_at ASC`
  ).bind(eng.id, eng.stage).all();
  const surveys = surveysRaw.map(s => ({ ...s, questions: JSON.parse(s.questions) }));

  // Unread admin messages count
  const unread = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM messages WHERE engagement_id = ? AND sender = 'admin' AND read_at IS NULL"
  ).bind(eng.id).first();

  return new Response(renderPortal(eng, docs, surveys, unread?.n || 0), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function renderPortal(eng, docs, surveys, unreadCount) {
  const stages = [
    { key: "pre", label: "Intake" },
    { key: "active", label: "In Progress" },
    { key: "post", label: "Wrap-up" },
    { key: "complete", label: "Complete" },
  ];
  const currentIdx = stages.findIndex(s => s.key === eng.stage);
  const stageMessage = {
    pre: "Review the engagement details below and complete the pre-engagement steps.",
    active: "Your training materials are available below. Reach out anytime with questions.",
    post: "Thank you for completing the engagement. Please share your feedback to help us improve.",
    complete: "This engagement is complete. Materials remain available for your reference.",
  }[eng.stage];

  // ====== Timeline ======
  const timeline = `
    <div class="timeline">
      ${stages.map((s, i) => `
        <div class="step ${i < currentIdx ? "done" : ""} ${i === currentIdx ? "current" : ""}">
          <div class="dot">${i < currentIdx ? "✓" : i + 1}</div>
          <div class="step-label">${s.label}</div>
        </div>
        ${i < stages.length - 1 ? `<div class="connector ${i < currentIdx ? "done" : ""}"></div>` : ""}
      `).join("")}
    </div>`;

  // ====== Contract section ======
  const contractHtml = eng.contract_text ? renderContractSection(eng) : "";

  // ====== Engagement details ======
  const detailsHtml = eng.description ? renderEngagementDetails(eng) : "";

  // ====== Invoice section ======
  const hasInvoice = eng.invoice_amount_cents || eng.invoice_number || eng.invoice_date || eng.invoice_notes || eng.payment_link;
  const invoiceHtml = hasInvoice ? renderInvoiceSection(eng) : "";

  // ====== Cal.com booking ======
  const calHtml = eng.cal_link && (eng.stage === "pre" || eng.stage === "active") ? `
    <section class="card">
      <h2>Schedule a session</h2>
      <p>Book time directly on Ahmad's calendar for this engagement.</p>
      <a class="btn-primary" href="${escapeHtml(eng.cal_link)}" target="_blank" rel="noopener">Find a time</a>
    </section>` : "";

  // ====== Documents ======
  const docsHtml = `
    <section class="card">
      <h2>Materials</h2>
      ${docs.length ? `
        <ul class="doc-list">
          ${docs.map(d => `
            <li class="doc-item">
              <span class="doc-name">${escapeHtml(d.filename)}</span>
              <span class="doc-size">${formatSize(d.size_bytes)}</span>
              <a class="doc-link" href="/api/client/download?slug=${eng.slug}&doc=${d.id}">Download</a>
            </li>
          `).join("")}
        </ul>` : `<p class="empty-note">No materials available at this stage yet.</p>`}
    </section>`;

  // ====== Surveys (dynamic — from engagement_surveys table) ======
  const surveysHtml = surveys.map(s => {
    const submitted = s.response_count > 0;
    if (submitted && !s.repeatable) {
      return `<section class="card"><h2>${escapeHtml(s.title)}</h2>${s.description ? `<p>${escapeHtml(s.description)}</p>` : ""}<p style="color:var(--teal);">✓ Submitted — thank you.</p></section>`;
    }
    return renderDynamicSurvey(s, submitted);
  }).join("");

  // ====== Messaging ======
  const messagingHtml = `
    <section class="card" id="messagesCard">
      <h2>Messages ${unreadCount ? `<span class="badge">${unreadCount} new</span>` : ""}</h2>
      <div id="messages" class="messages">Loading…</div>
      <textarea id="msgInput" placeholder="Type a message to Ahmad…" rows="2"></textarea>
      <button class="btn-primary" id="msgSend">Send message</button>
    </section>`;

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${escapeHtml(eng.title)} — AI Impact Maine</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  :root { --navy:#0a2540; --teal:#2a9d8f; --sand:#f4ede4; --ink:#1a1a1a; --muted:#6b7280; --line:#e5e0d6; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:'DM Sans',system-ui,sans-serif; background:var(--sand); color:var(--ink); line-height:1.6; }
  .header { background:var(--navy); color:var(--sand); padding:2rem 1.5rem; }
  .header-inner { max-width:900px; margin:0 auto; display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:1rem; }
  .brand { font-family:'Cormorant Garamond',serif; font-size:1.5rem; margin:0; }
  .brand small { display:block; font-family:'DM Sans',sans-serif; font-size:0.7rem; letter-spacing:0.15em; text-transform:uppercase; opacity:0.6; }
  .lib-link { color:var(--sand); text-decoration:none; font-size:0.85rem; opacity:0.8; border:1px solid rgba(244,237,228,0.3); padding:0.35rem 0.85rem; border-radius:2px; }
  .lib-link:hover { opacity:1; border-color:var(--sand); }
  main { max-width:900px; margin:-2rem auto 4rem; padding:0 1.5rem; }
  .hero { background:white; border-radius:4px; padding:2.5rem; box-shadow:0 8px 32px rgba(10,37,64,0.08); margin-bottom:2rem; }
  h1 { font-family:'Cormorant Garamond',serif; font-weight:600; font-size:2.25rem; margin:0 0 0.5rem; color:var(--navy); line-height:1.15; }
  .client-line { color:var(--muted); margin:0 0 1.5rem; }
  .stage-message { font-size:1.05rem; border-left:3px solid var(--teal); padding-left:1rem; margin:1.5rem 0 0; }

  /* Timeline */
  .timeline { display:flex; align-items:center; margin:1.5rem 0; }
  .step { display:flex; flex-direction:column; align-items:center; gap:0.4rem; min-width:60px; }
  .dot { width:32px; height:32px; border-radius:50%; background:var(--sand); color:var(--muted); display:flex; align-items:center; justify-content:center; font-weight:600; font-size:0.85rem; border:2px solid var(--line); }
  .step.done .dot { background:var(--teal); color:white; border-color:var(--teal); }
  .step.current .dot { background:var(--navy); color:white; border-color:var(--navy); box-shadow:0 0 0 4px rgba(10,37,64,0.15); }
  .step-label { font-size:0.75rem; letter-spacing:0.05em; color:var(--muted); text-transform:uppercase; }
  .step.current .step-label, .step.done .step-label { color:var(--navy); font-weight:500; }
  .connector { flex:1; height:2px; background:var(--line); margin:0 0.25rem; margin-bottom:1.5rem; }
  .connector.done { background:var(--teal); }

  .card { background:white; border-radius:4px; padding:2rem 2.5rem; margin-bottom:1.5rem; box-shadow:0 4px 16px rgba(10,37,64,0.05); }
  .card h2 { font-family:'Cormorant Garamond',serif; font-size:1.5rem; margin:0 0 1rem; color:var(--navy); }
  .badge { background:var(--teal); color:white; font-size:0.7rem; padding:0.15rem 0.55rem; border-radius:10px; margin-left:0.5rem; vertical-align:middle; }
  .description-text { color:var(--muted); white-space:pre-wrap; margin:0; }

  .doc-list { list-style:none; padding:0; margin:0; }
  .doc-item { display:grid; grid-template-columns:1fr auto auto; gap:1rem; align-items:center; padding:0.85rem 0; border-bottom:1px solid var(--line); }
  .doc-item:last-child { border-bottom:none; }
  .doc-name { font-weight:500; }
  .doc-size { color:var(--muted); font-size:0.85rem; }
  .doc-link { background:var(--navy); color:var(--sand); text-decoration:none; padding:0.5rem 1rem; border-radius:2px; font-size:0.9rem; }
  .doc-link:hover { background:var(--teal); }
  .empty-note { color:var(--muted); font-style:italic; }

  label { display:block; font-weight:500; margin:1rem 0 0.35rem; }
  textarea, input[type=text], input[type=email], select { width:100%; padding:0.65rem; border:1px solid var(--line); border-radius:2px; font-family:inherit; font-size:1rem; background:var(--sand); }
  textarea { min-height:80px; resize:vertical; }
  .rating { display:flex; gap:0.5rem; flex-wrap:wrap; }
  .rating label { margin:0; cursor:pointer; padding:0.5rem 0.85rem; border:1px solid var(--line); border-radius:2px; background:var(--sand); }
  .rating input { display:none; }
  .rating input:checked + span { font-weight:700; color:var(--teal); }

  .btn-primary { display:inline-block; margin-top:1rem; background:var(--teal); color:white; border:none; padding:0.85rem 2rem; font-size:1rem; font-weight:500; border-radius:2px; cursor:pointer; text-decoration:none; }
  .btn-primary:hover { background:var(--navy); }
  .btn-primary:disabled { opacity:0.5; cursor:not-allowed; }

  /* Contract */
  .contract-box { background:var(--sand); border:1px solid var(--line); border-radius:2px; padding:1.5rem; max-height:320px; overflow-y:auto; font-size:0.9rem; white-space:pre-wrap; margin-bottom:1rem; }
  .signed { background:#e8f5f1; border:1px solid var(--teal); padding:1rem; border-radius:2px; font-size:0.9rem; }
  .signed strong { color:var(--teal); }

  /* Invoice */
  .invoice-amount { font-family:'Cormorant Garamond',serif; font-size:2.5rem; color:var(--navy); font-weight:600; margin:0.5rem 0; }
  .invoice-status { display:inline-block; padding:0.3rem 0.85rem; border-radius:2px; font-size:0.8rem; letter-spacing:0.08em; text-transform:uppercase; font-weight:500; }
  .invoice-status.unpaid { background:#fff4e6; color:#b87100; border:1px solid #f0c987; }
  .invoice-status.paid { background:#e8f5f1; color:var(--teal); border:1px solid var(--teal); }
  .invoice-status.waived { background:var(--sand); color:var(--muted); border:1px solid var(--line); }
  .invoice-notes { color:var(--muted); font-size:0.9rem; margin-top:0.75rem; }
  .invoice-meta { color:var(--muted); font-size:0.9rem; margin-top:0.4rem; }
  .pay-invoice-btn { display:inline-block; margin-top:1rem; background:var(--teal); color:white; padding:0.95rem 2rem; border-radius:2px; font-size:1.05rem; font-weight:600; text-decoration:none; }
  .pay-invoice-btn:hover { background:var(--navy); color:white; }

  /* Messages */
  .messages { max-height:300px; overflow-y:auto; margin-bottom:1rem; padding:0.5rem; background:var(--sand); border-radius:2px; }
  .msg { padding:0.75rem 1rem; border-radius:6px; margin-bottom:0.5rem; max-width:80%; font-size:0.95rem; }
  .msg.admin { background:white; border:1px solid var(--line); }
  .msg.client { background:var(--navy); color:var(--sand); margin-left:auto; }
  .msg-time { font-size:0.7rem; opacity:0.6; margin-top:0.25rem; }

  .footer { text-align:center; color:var(--muted); font-size:0.85rem; margin-top:3rem; }
</style>
</head>
<body>
<header class="header">
  <div class="header-inner">
    <div>
      <div class="brand">AI Impact Maine<small>Client Portal</small></div>
    </div>
    <a class="lib-link" href="/resources/">Resource Library →</a>
  </div>
</header>
<main>
  <section class="hero">
    <h1>${escapeHtml(eng.title)}</h1>
    <p class="client-line">Prepared for ${escapeHtml(eng.client_name)}${eng.client_company ? ` · ${escapeHtml(eng.client_company)}` : ""}</p>
    ${timeline}
    <p class="stage-message">${stageMessage}</p>
  </section>

  ${detailsHtml}
  ${contractHtml}
  ${invoiceHtml}
  ${calHtml}
  ${docsHtml}
  ${surveysHtml}
  ${messagingHtml}

  <div class="footer">Questions? Email <a href="mailto:hello@aiimpactmaine.com">hello@aiimpactmaine.com</a></div>
</main>

<script>
const SLUG = ${JSON.stringify(eng.slug)};

// ===== Survey submit (handles multiple forms, checkbox arrays, survey_id) =====
document.querySelectorAll('form.survey').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const responses = {};
    for (const [k, v] of fd.entries()) {
      // Checkbox arrays use name="key[]"
      if (k.endsWith('[]')) {
        const cleanKey = k.slice(0, -2);
        if (!responses[cleanKey]) responses[cleanKey] = [];
        responses[cleanKey].push(v);
      } else {
        responses[k] = v;
      }
    }
    const surveyId = parseInt(form.dataset.surveyId, 10);
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    const res = await fetch('/api/client/survey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, survey_id: surveyId, responses }),
    });
    btn.disabled = false;
    if (res.ok) {
      // Reload to refresh state (handles both one-time and repeatable nicely)
      location.reload();
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || 'Sorry, something went wrong.');
    }
  });
});

// ===== Contract sign =====
const contractForm = document.querySelector('form.contract-sign');
if (contractForm) {
  contractForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(contractForm);
    const res = await fetch('/api/client/sign-contract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, signed_name: fd.get('signed_name') }),
    });
    if (res.ok) location.reload();
    else { const e = await res.json().catch(()=>({})); alert(e.error || 'Could not record signature'); }
  });
}

// ===== Messages =====
async function loadMessages() {
  const r = await fetch('/api/client/messages?slug=' + encodeURIComponent(SLUG));
  if (!r.ok) return;
  const data = await r.json();
  const box = document.getElementById('messages');
  if (!data.messages.length) {
    box.innerHTML = '<div class="empty-note" style="padding:1rem;">No messages yet. Send one to start a conversation.</div>';
    return;
  }
  box.innerHTML = data.messages.map(m => \`
    <div class="msg \${m.sender}">
      \${escape(m.body)}
      <div class="msg-time">\${new Date(m.created_at + 'Z').toLocaleString()}</div>
    </div>\`).join('');
  box.scrollTop = box.scrollHeight;
}
document.getElementById('msgSend')?.addEventListener('click', async () => {
  const input = document.getElementById('msgInput');
  const body = input.value.trim();
  if (!body) return;
  const btn = document.getElementById('msgSend');
  btn.disabled = true;
  await fetch('/api/client/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: SLUG, body }),
  });
  input.value = '';
  await loadMessages();
  btn.disabled = false;
});
loadMessages();
function escape(s){return String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
</script>
</body></html>`;
}

function renderEngagementDetails(eng) {
  return `
    <section class="card">
      <h2>Engagement details</h2>
      <p class="description-text">${escapeHtml(eng.description)}</p>
    </section>`;
}

function renderContractSection(eng) {
  if (eng.contract_signed_at) {
    return `
    <section class="card">
      <h2>Engagement agreement</h2>
      <div class="signed">
        ✓ <strong>Signed</strong> by ${escapeHtml(eng.contract_signed_name)} on ${new Date(eng.contract_signed_at + "Z").toLocaleString()}
      </div>
    </section>`;
  }
  return `
    <section class="card">
      <h2>Engagement agreement</h2>
      <p>Please review the agreement below and acknowledge by typing your full name.</p>
      <div class="contract-box">${escapeHtml(eng.contract_text)}</div>
      <form class="contract-sign">
        <label>Type your full legal name to acknowledge this agreement</label>
        <input type="text" name="signed_name" required minlength="2" placeholder="Full name">
        <button class="btn-primary" type="submit">I acknowledge this agreement</button>
      </form>
    </section>`;
}

function renderInvoiceSection(eng) {
  const status = eng.invoice_status || "unpaid";
  const hasPayLink = eng.payment_link && /^https?:\/\//i.test(eng.payment_link);
  const methodLabels = { stripe: "Stripe", check: "Check", ach: "ACH", wire: "Wire", other: "Other" };
  const paymentInfo = status === "paid" && (eng.payment_method || eng.payment_reference)
    ? `<div class="invoice-notes">Payment received${eng.payment_method ? ` via ${escapeHtml(methodLabels[eng.payment_method] || eng.payment_method)}` : ""}${eng.payment_reference ? ` - ref: ${escapeHtml(eng.payment_reference)}` : ""}</div>`
    : "";

  return `
    <section class="card">
      <h2>Invoice</h2>
      ${eng.invoice_number ? `<div class="invoice-meta">Invoice #${escapeHtml(eng.invoice_number)}</div>` : ""}
      ${eng.invoice_date ? `<div class="invoice-meta">Invoice date: ${escapeHtml(eng.invoice_date)}</div>` : ""}
      ${eng.invoice_amount_cents ? `<div class="invoice-amount">${formatMoney(eng.invoice_amount_cents)}</div>` : ""}
      <span class="invoice-status ${status}">${status}</span>
      ${eng.invoice_paid_at ? `<div class="invoice-notes">Paid on ${new Date(eng.invoice_paid_at + "Z").toLocaleDateString()}</div>` : ""}
      ${paymentInfo}
      ${eng.invoice_notes ? `<div class="invoice-notes">${escapeHtml(eng.invoice_notes)}</div>` : ""}
      ${status === "unpaid" && hasPayLink ? `<a class="pay-invoice-btn" href="${escapeHtml(eng.payment_link)}" target="_blank" rel="noopener">Pay invoice</a>` : ""}
      ${status === "unpaid" && !hasPayLink ? `<p class="invoice-notes">Payment instructions will be provided separately. Email <a href="mailto:hello@aiimpactmaine.com">hello@aiimpactmaine.com</a> with any questions.</p>` : ""}
    </section>`;
}

function renderDynamicSurvey(s, submittedBefore) {
  const fieldsHtml = s.questions.map(q => renderQuestion(q)).join("");
  const buttonLabel = submittedBefore ? "Submit another response" : "Submit";
  const repeatNote = s.repeatable && submittedBefore
    ? `<p style="color:var(--muted);font-size:0.85rem;">You've submitted ${s.response_count} response${s.response_count === 1 ? "" : "s"} to this survey. You can submit again.</p>`
    : "";
  return `
    <section class="card">
      <h2>${escapeHtml(s.title)}</h2>
      ${s.description ? `<p>${escapeHtml(s.description)}</p>` : ""}
      ${repeatNote}
      <form class="survey" data-survey-id="${s.id}">
        ${fieldsHtml}
        <button class="btn-primary" type="submit">${buttonLabel}</button>
      </form>
    </section>`;
}

function renderQuestion(q) {
  const req = q.required ? "required" : "";
  const reqMark = q.required ? ' <span style="color:var(--danger);">*</span>' : "";
  switch (q.type) {
    case "text":
      return `<label>${escapeHtml(q.label)}${reqMark}</label><input type="text" name="${escapeHtml(q.id)}" ${req}>`;
    case "longtext":
      return `<label>${escapeHtml(q.label)}${reqMark}</label><textarea name="${escapeHtml(q.id)}" ${req}></textarea>`;
    case "single":
      return `<label>${escapeHtml(q.label)}${reqMark}</label>
        <select name="${escapeHtml(q.id)}" ${req}>
          <option value="">Select…</option>
          ${(q.options || []).map(o => `<option>${escapeHtml(o)}</option>`).join("")}
        </select>`;
    case "multi":
      return `<label>${escapeHtml(q.label)}${reqMark}</label>
        <div class="multi-choices">
          ${(q.options || []).map((o, i) => `
            <label style="display:flex;align-items:center;gap:0.5rem;font-weight:normal;margin:0.25rem 0;">
              <input type="checkbox" name="${escapeHtml(q.id)}[]" value="${escapeHtml(o)}" style="width:auto;">
              <span>${escapeHtml(o)}</span>
            </label>`).join("")}
        </div>`;
    case "rating":
      return `<label>${escapeHtml(q.label)} (1–5)${reqMark}</label>
        <div class="rating">
          ${[1,2,3,4,5].map(n => `<label><input type="radio" name="${escapeHtml(q.id)}" value="${n}" ${req}><span>${n}</span></label>`).join("")}
        </div>`;
    case "yesno":
      return `<label>${escapeHtml(q.label)}${reqMark}</label>
        <div class="rating">
          <label><input type="radio" name="${escapeHtml(q.id)}" value="Yes" ${req}><span>Yes</span></label>
          <label><input type="radio" name="${escapeHtml(q.id)}" value="No" ${req}><span>No</span></label>
        </div>`;
    default:
      return "";
  }
}

function renderNotFound() {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Not found</title>
  <style>body{font-family:system-ui;max-width:500px;margin:6rem auto;padding:0 1.5rem;color:#0a2540;text-align:center}</style>
  </head><body><h1>This link is not valid</h1><p>If you believe this is in error, please contact hello@aiimpactmaine.com.</p></body></html>`;
}
