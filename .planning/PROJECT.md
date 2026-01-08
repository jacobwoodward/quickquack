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

### Active

<!-- Current scope. Building toward these. -->

- [ ] Fix production auth redirect (currently redirects to localhost after Google OAuth)
- [ ] Fix post-login navigation (should redirect to dashboard, not landing page)
- [ ] Architectural review for code quality and patterns
- [ ] Security audit (OWASP, auth flows, data exposure)
- [ ] Comprehensive README for open source release
- [ ] Self-hosting documentation and setup guide

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- New features — focus on stabilizing existing functionality first
- UI/design changes — keep current look, prioritize function over form
- Database schema changes — preserve existing data and structure unless bug fix requires it
- Additional calendar providers — stick with Google Calendar for v1

## Context

**Current State:**
- Production deployment on Vercel with Supabase backend
- Live users with existing data that must be protected
- Codebase recently rebranded to QuickQuack
- Marketing site at quickquack domain (to be confirmed)

**Known Issues:**
- Auth redirect bug: After successful Google OAuth, app redirects to localhost instead of production URL
- Navigation bug: After login, user lands on landing page instead of dashboard — unclear how to access admin panel

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
| Fix bugs before open source release | Can't release broken software | — Pending |
| Security audit before public release | Protect users and reputation | — Pending |
| Keep current tech stack | Stability over novelty, existing data | ✓ Good |

---
*Last updated: 2026-01-08 after initialization*
