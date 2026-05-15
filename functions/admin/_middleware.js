// functions/admin/_middleware.js
// Protects everything under /admin/ with Basic auth (same password as API).
// Without this, the admin/index.html static file would be public.

export async function onRequest({ request, env, next }) {
  const header = request.headers.get("Authorization") || "";
  if (header.startsWith("Basic ")) {
    try {
      const [, pass] = atob(header.slice(6)).split(":");
      if (env.ADMIN_PASSWORD && pass === env.ADMIN_PASSWORD) return next();
    } catch {}
  }
  return new Response("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="AI Impact Maine Admin"' },
  });
}
