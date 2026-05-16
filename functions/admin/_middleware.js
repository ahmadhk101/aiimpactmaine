// functions/admin/_middleware.js
// Protects everything under /admin/ with Basic auth (same password as API).
// Without this, the admin/index.html static file would be public.
// Cloudflare Access with MFA should also be configured in front of /admin/*
// for production. Basic Auth remains as a fallback layer.

import {
  adminUnauthorized,
  createAdminSessionCookie,
  verifyAdminSession,
  verifyBasicAdmin,
} from "../_shared/auth.js";

export async function onRequest({ request, env, next }) {
  if (await verifyAdminSession(request, env)) {
    return next();
  }

  if (verifyBasicAdmin(request, env)) {
    const response = await next();
    response.headers.append("Set-Cookie", await createAdminSessionCookie(env));
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  return adminUnauthorized();
}
