# Architecture

**Analysis Date:** 2026-01-08

## Pattern Overview

**Overall:** Full-Stack Monolith with Next.js App Router

**Key Characteristics:**
- Server-side rendering with React Server Components
- API routes for backend logic
- Database-per-request pattern via Supabase
- External service integrations (Google Calendar, Stripe, Resend)

## Layers

**Presentation Layer:**
- Purpose: Render UI and handle user interactions
- Contains: React components, pages, layouts
- Location: `src/app/`, `src/components/`
- Depends on: Library layer for data fetching and business logic
- Used by: Browser clients

**API Layer:**
- Purpose: Handle HTTP requests and orchestrate business logic
- Contains: Next.js API route handlers
- Location: `src/app/api/`
- Depends on: Library layer, external services
- Used by: Client-side fetch calls, external webhooks

**Library Layer:**
- Purpose: Business logic, data access, external service clients
- Contains: Service classes, utilities, type definitions
- Location: `src/lib/`
- Depends on: Supabase, external APIs
- Used by: API routes, Server Components

**Database Layer:**
- Purpose: Data persistence and querying
- Contains: PostgreSQL via Supabase
- Location: `supabase/migrations/` (schema), Supabase cloud (data)
- Depends on: Nothing (foundation layer)
- Used by: Library layer via Supabase client

## Data Flow

**Booking Creation Flow:**

1. Guest submits booking form (client component)
2. POST request to `/api/bookings` (`src/app/api/bookings/route.ts`)
3. API route validates input and fetches event type from Supabase
4. Creates booking record in database
5. Creates Google Calendar event via `GoogleCalendarService` (`src/lib/google/calendar.ts`)
6. Sends confirmation email via Resend (`src/lib/email/notifications.ts`)
7. Returns booking UID to client
8. Client redirects to success page

**Paid Booking Flow:**

1. Guest selects paid event type
2. POST to `/api/stripe/create-checkout` creates Stripe checkout session
3. Guest redirected to Stripe checkout
4. On success, Stripe webhook (`/api/stripe/webhook`) receives event
5. Webhook creates booking and triggers confirmation flow

**State Management:**
- Server-side: Supabase database (persistent)
- Client-side: React state (ephemeral)
- Authentication: Supabase Auth with httpOnly cookies

## Key Abstractions

**Supabase Clients:**
- Purpose: Database access with type safety
- Examples: `createClient()` for user context, `createServiceClient()` for admin operations
- Location: `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts`
- Pattern: Factory functions returning typed Supabase client

**GoogleCalendarService:**
- Purpose: Google Calendar API operations
- Examples: `getBusyTimes()`, `createEvent()`, `deleteEvent()`
- Location: `src/lib/google/calendar.ts`
- Pattern: Class with static factory method `fromCredential()`

**Email Notifications:**
- Purpose: Send transactional emails
- Examples: `sendBookingConfirmation()`, `sendBookingCancellation()`, `sendBookingReminder()`
- Location: `src/lib/email/notifications.ts`
- Pattern: Exported async functions

**Checkout Service:**
- Purpose: Stripe payment integration
- Examples: `createCheckoutSession()`, `getCheckoutSession()`
- Location: `src/lib/stripe/checkout.ts`
- Pattern: Exported async functions

## Entry Points

**Web Application:**
- Location: `src/app/layout.tsx` (root layout)
- Triggers: Browser navigation
- Responsibilities: Render pages, manage auth state

**API Routes:**
- Location: `src/app/api/*/route.ts`
- Triggers: HTTP requests (client, webhooks, cron)
- Responsibilities: Validate input, execute business logic, return responses

**Cron Jobs:**
- Location: `src/app/api/cron/reminders/route.ts`
- Triggers: Vercel Cron (daily at 8am ET)
- Responsibilities: Send booking reminders

## Error Handling

**Strategy:** Try/catch at API route level, log errors, return appropriate HTTP status

**Patterns:**
- API routes wrap logic in try/catch, return `NextResponse.json()` with status codes
- Service functions throw errors, caught by callers
- External service failures logged but don't block booking creation
- Validation errors return 400, not found returns 404, server errors return 500

## Cross-Cutting Concerns

**Logging:**
- `console.log` / `console.error` for debugging
- No structured logging framework

**Validation:**
- Manual validation in API routes
- Zod schemas for complex validation (not consistently used)
- Supabase types provide compile-time safety

**Authentication:**
- Supabase Auth via `@supabase/ssr`
- Session stored in httpOnly cookies
- Server components access auth via `createClient()`

**Authorization:**
- Row-Level Security (RLS) in Supabase
- Service role client bypasses RLS for admin operations

---

*Architecture analysis: 2026-01-08*
*Update when major patterns change*
