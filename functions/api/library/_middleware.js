// functions/api/library/_middleware.js
// Same gating model as /library — Cloudflare Access in front when ready.
export async function onRequest({ next }) {
  return next();
}
