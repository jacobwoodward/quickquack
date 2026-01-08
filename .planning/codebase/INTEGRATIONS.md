# External Integrations

**Analysis Date:** 2026-01-08

## APIs & External Services

**Payment Processing:**
- Stripe - Paid booking checkout and refunds
  - SDK/Client: `stripe` npm package v20.1.1
  - Auth: API key in `STRIPE_SECRET_KEY` env var
  - Client: `src/lib/stripe/client.ts`
  - Endpoints used: Checkout sessions, refunds
  - Files: `src/lib/stripe/checkout.ts`, `src/app/api/stripe/`

**Email/SMS:**
- Resend - Transactional emails (confirmations, reminders, cancellations)
  - SDK/Client: `resend` npm package v6.6.0
  - Auth: API key in `RESEND_API_KEY` env var
  - From address: `EMAIL_FROM` env var (default: "QuickQuack <noreply@example.com>")
  - Files: `src/lib/email/notifications.ts`

**Calendar:**
- Google Calendar API - Calendar sync, event creation, busy time fetching
  - SDK/Client: `googleapis` npm package v169.0.0
  - Auth: OAuth2 via `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - Files: `src/lib/google/calendar.ts`
  - Features: Create/update/delete events, Google Meet generation, free/busy queries

## Data Storage

**Databases:**
- PostgreSQL on Supabase - Primary data store
  - Connection: via `NEXT_PUBLIC_SUPABASE_URL` env var
  - Client: `@supabase/supabase-js` v2.89.0, `@supabase/ssr` v0.8.0
  - Files: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`
  - Migrations: `supabase/migrations/*.sql`
  - Type definitions: `src/lib/types/database.ts`

**File Storage:**
- Not explicitly implemented (Supabase Storage available but not used for core features)

**Caching:**
- None configured - Database queries per request

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Email/password + OAuth
  - Implementation: `@supabase/ssr` for server-side session management
  - Token storage: httpOnly cookies
  - Session management: Supabase handles JWT refresh
  - Files: `src/lib/supabase/server.ts`

**OAuth Integrations:**
- Google OAuth - Used for Google Calendar access (not sign-in)
  - Credentials: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - Scopes: Calendar read/write
  - Token storage: `credentials` table in database
  - Files: `src/lib/google/calendar.ts`

## Monitoring & Observability

**Error Tracking:**
- None configured - Uses console.error only

**Analytics:**
- Link click tracking - Custom implementation
  - Files: `src/app/api/track-click/route.ts`
  - Storage: `link_clicks` table in database

**Logs:**
- Vercel logs - stdout/stderr only
- Console logging in code

## CI/CD & Deployment

**Hosting:**
- Vercel - Next.js app hosting (inferred from cron configuration)
  - Deployment: Automatic on git push (configured in Vercel dashboard)
  - Environment vars: Configured in Vercel dashboard

**CI Pipeline:**
- Not detected - No GitHub Actions or similar

## Environment Configuration

**Development:**
- Required env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `NEXT_PUBLIC_APP_URL`
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
- Optional env vars:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `RESEND_API_KEY`
  - `EMAIL_FROM`
  - `CRON_SECRET`
- Secrets location: `.env.local` (gitignored)
- Configuration status: Viewable at `/setup` route

**Staging:**
- Not explicitly configured (single environment assumed)

**Production:**
- Secrets management: Vercel environment variables
- Configuration validation: `src/lib/config.ts` provides status checks

## Webhooks & Callbacks

**Incoming:**

- Stripe - `/api/stripe/webhook`
  - Files: `src/app/api/stripe/webhook/route.ts`
  - Verification: Stripe signature validation via `STRIPE_WEBHOOK_SECRET`
  - Events: `checkout.session.completed` (creates booking on payment success)

- Cron - `/api/cron/reminders`
  - Files: `src/app/api/cron/reminders/route.ts`
  - Verification: `CRON_SECRET` header check
  - Schedule: Daily at 8am ET (Vercel Cron)
  - Purpose: Send booking reminder emails

**Outgoing:**
- None configured

## Service Dependencies Summary

| Service | Required | Purpose | Fallback Behavior |
|---------|----------|---------|-------------------|
| Supabase | Yes | Database, Auth | App won't start |
| Google Calendar | Yes* | Calendar sync | Booking created without calendar event |
| Stripe | No | Payments | Paid bookings disabled |
| Resend | No | Emails | Bookings work, no notifications |

*Google Calendar is required for Google Meet location type

---

*Integration audit: 2026-01-08*
*Update when adding/removing external services*
