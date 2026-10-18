# Gopesh & Prachi Wedding RSVP — Cloudflare

This project converts the Flask prototype into static HTML + a Cloudflare Worker API + Cloudflare D1.

## Includes
- Wedding RSVP form with Dec 4 and Dec 5 attendance
- Family / better-half / solo party options and guest limits
- International phone numbers; Indian 10-digit numbers are stored with `91`
- Duplicate submissions update the existing record using the normalized phone number
- Private admin dashboard, totals, share-link generator and CSV export

## Deploy (one-time setup)

Prerequisites: Node.js/npm and a Cloudflare account.

1. Install Wrangler: `npm install -g wrangler`
2. Log in: `npx wrangler login`
3. Create D1 database: `npx wrangler d1 create gopesh-prachi-rsvp`
4. Copy the returned database ID into `wrangler.toml`, replacing `REPLACE_WITH_DATABASE_ID`.
5. Create tables: `npx wrangler d1 execute gopesh-prachi-rsvp --remote --file=schema.sql`
6. Set a strong admin password as a Worker secret: `npx wrangler secret put RSVP_ADMIN_PASSWORD`
7. Deploy: `npx wrangler deploy`

Cloudflare's free allowance can be sufficient for a small wedding RSVP site, but quotas and product terms can change. Check the current Cloudflare Workers and D1 pricing pages before relying on the free tier.

## Important security notes
- Do not put the admin password in HTML, JavaScript, or `wrangler.toml`.
- The admin password is checked by the Worker on every admin API request. Use a long unique password and only access the dashboard over HTTPS.
- Keep the Cloudflare account secured with two-factor authentication.
- This starter does not include rate limiting, CAPTCHA, or an invite-token system. A share link is sender-tagged, not a private one-person token; it can be forwarded.
- The companion-link suggestions table is created for schema compatibility, but this starter does not yet generate/display matching companion suggestions.
- Test with a few dummy submissions and verify CSV export before sharing publicly.
