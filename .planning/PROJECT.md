# QuickQuack

## What This Is

QuickQuack is a free, open-source, self-hosted scheduling application — an alternative to Calendly and Cal.com. Users share booking links, guests pick available times, and the system automatically creates calendar events with Google Meet integration.

## Core Value

**The app must work end-to-end: login, create event types, share links, accept bookings.** Everything else is secondary to this core scheduling flow functioning correctly.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Event type creation with custom durations, locations, buffer times — existing
- ✓ Weekly availability schedules with customizable time slots — existing
- ✓ Google Calendar integration for conflict detection and event creation — existing
- ✓ Public booking pages for guests to schedule meetings — existing
- ✓ Paid bookings via Stripe integration — existing
- ✓ Email notifications (confirmations, reminders, updates) via Resend — existing
- ✓ Link-in-bio public profile page with social links and booking widgets — existing
- ✓ Guest self-service rescheduling and cancellation — existing
- ✓ Supabase Auth with Google OAuth — existing
- ✓ Production auth redirect fix (OAuth callback uses canonical URL) — v1.0
- ✓ Post-login navigation (authenticated users → dashboard) — v1.0
- ✓ Architecture review (extracted utilities, added UI primitives) — v1.0
- ✓ Security audit (fixed open redirect, XSS, cron bypass, added headers) — v1.0
- ✓ Open source documentation (.env.example, CONTRIBUTING.md, MIT LICENSE) — v1.0

### Active

<!-- Current scope. Building toward these. -->

(Ready for new milestone — all v1.0 requirements validated)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- New features — focus on stabilizing existing functionality first
- UI/design changes — keep current look, prioritize function over form
- Database schema changes — preserve existing data and structure unless bug fix requires it
- Additional calendar providers — stick with Google Calendar for v1
- IDOR fix for cancel/reschedule — deferred, requires booking token system
- Zod input validation — deferred, significant refactor across all API routes
- Rate limiting — deferred, infrastructure requirement
- CSRF protection — deferred, complex implementation

## Context

**Current State (v1.0 shipped 2026-01-08):**
- Production deployment on Vercel with Supabase backend
- Live users with existing data protected by RLS policies
- Open source under MIT LICENSE
- 15,164 lines of TypeScript across 40+ files

**v1.0 Accomplishments:**
- Fixed OAuth redirect and post-login navigation
- Security hardened (open redirect, XSS, cron bypass fixed)
- Added security headers (X-Frame-Options, X-Content-Type-Options)
- Extracted shared utilities, added UI primitives (Checkbox, Alert)
- Created .env.example, CONTRIBUTING.md for contributors

**Known Technical Debt:**
- 58+ `as any` Supabase casts (TypeScript limitation, eslint-disabled)
- IDOR in cancel/reschedule (requires booking token system)
- No Zod input validation (significant refactor)
- No rate limiting (infrastructure requirement)

**Technical Environment:**
- Next.js 16 with App Router, React 19, TypeScript strict mode
- Supabase for PostgreSQL, Auth, and RLS
- External services: Google Calendar API, Stripe, Resend
- No test framework currently configured

## Constraints

- **Tech Stack**: Must remain on Next.js/Supabase/Vercel — no platform migrations
- **Timeline**: Time pressure to ship fixes and open source release
- **Data Safety**: Existing users with live bookings — no breaking changes to data
- **Backwards Compatibility**: API contracts and database schema must remain stable

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fix bugs before open source release | Can't release broken software | ✓ Good |
| Security audit before public release | Protect users and reputation | ✓ Good |
| Keep current tech stack | Stability over novelty, existing data | ✓ Good |
| Use canonical URL for OAuth redirect | Fixes localhost redirect bug | ✓ Good |
| Redirect authenticated users from / to /dashboard | Fixes post-login navigation | ✓ Good |
| Use redirect URL allowlist | Prevents open redirect attacks | ✓ Good |
| Remove dangerouslySetInnerHTML for CSS | Prevents XSS via custom CSS | ✓ Good |
| Fail-closed cron endpoint | Security over availability if misconfigured | ✓ Good |
| MIT LICENSE for open source | Permissive, community-friendly | ✓ Good |
| Defer IDOR fix | Requires significant token system work | ⚠️ Revisit |
| Defer Zod validation | Significant refactor, not blocking | ⚠️ Revisit |
| Document `as any` casts as tech debt | Supabase limitation, not fixable now | ⚠️ Revisit |

---
*Last updated: 2026-01-08 after v1.0 milestone*
