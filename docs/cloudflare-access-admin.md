# Cloudflare Access Admin Protection

Protect admin routes with Cloudflare Zero Trust Access before traffic reaches Pages Functions.

Recommended Access apps:

- `aiimpactmaine.com/admin*`
- `aiimpactmaine.com/api/admin/*`

Recommended policy:

- Allow only owner/admin email addresses.
- Require MFA through the identity provider.
- Keep the existing `ADMIN_PASSWORD` Basic Auth as a fallback layer.
- Keep admin cookies short-lived and `HttpOnly`, `Secure`, `SameSite=Lax`.

Operational notes:

- Review Cloudflare Access login events monthly.
- Rotate `ADMIN_PASSWORD` if an admin device is lost or an assistant/vendor no longer needs access.
- Do not expose `/api/admin/*` through public test pages.

