// functions/library/_middleware.js
// Library access:
//   - Production: Cloudflare Access (configured in dashboard) gates /library/* and
//     /api/library/* with Google or email-OTP login. No code changes needed —
//     Access intercepts requests before they reach this function.
//   - If you haven't enabled Access yet, this middleware lets all traffic through.
//     Set up Access at: Zero Trust → Access → Applications → Add app → Self-hosted
//     Domain: aiimpactmaine.com, path: /library, /api/library/*
//     Policy: allow emails or domains you trust.

export async function onRequest({ next }) {
  return next();
}
