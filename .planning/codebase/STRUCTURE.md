# Codebase Structure

**Analysis Date:** 2026-01-08

## Directory Layout

```
quickquack/
├── .claude/                # Claude Code configuration
│   ├── agents/             # Custom agent definitions
│   ├── commands/           # Slash command definitions
│   └── get-shit-done/      # GSD planning system
├── .planning/              # Project planning documents
│   └── codebase/           # This codebase analysis
├── public/                 # Static assets
├── src/                    # Application source code
│   ├── app/                # Next.js App Router
│   ├── components/         # React components
│   └── lib/                # Utilities and services
├── supabase/               # Database configuration
│   └── migrations/         # SQL migration files
├── package.json            # Project manifest
├── tsconfig.json           # TypeScript configuration
└── next.config.ts          # Next.js configuration
```

## Directory Purposes

**src/app/**
- Purpose: Next.js App Router pages and API routes
- Contains: Page components, layouts, route handlers
- Key files: `layout.tsx` (root), `page.tsx` (home)
- Subdirectories:
  - `(auth)/` - Auth routes (login)
  - `(dashboard)/` - Protected dashboard routes
  - `api/` - API route handlers
  - `book/[username]/` - Public booking pages
  - `[slug]/` - Public profile pages (link-in-bio)
  - `cancel/`, `reschedule/` - Booking management

**src/components/**
- Purpose: Reusable React components
- Contains: UI components organized by feature
- Key files: Various component files
- Subdirectories:
  - `availability/` - Schedule editor components
  - `booking/` - Booking flow components
  - `dashboard/` - Dashboard navigation
  - `emails/` - Email template forms
  - `event-types/` - Event type forms
  - `links/` - Link-in-bio components
  - `public/` - Public page components
  - `settings/` - Settings forms
  - `ui/` - Reusable UI primitives

**src/lib/**
- Purpose: Business logic, utilities, service clients
- Contains: Non-React code (services, helpers, types)
- Key files: `config.ts` (environment config)
- Subdirectories:
  - `availability/` - Slot calculation logic
  - `calendar/` - ICS file generation
  - `email/` - Email notification service
  - `google/` - Google Calendar API client
  - `stripe/` - Stripe payment integration
  - `supabase/` - Supabase client factories
  - `types/` - TypeScript type definitions

**supabase/migrations/**
- Purpose: Database schema migrations
- Contains: Numbered SQL migration files
- Key files: `00001_initial_schema.sql`, `00002_add_payments.sql`
- Subdirectories: None

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` - Root layout, auth provider
- `src/app/page.tsx` - Home page (redirects to dashboard or login)
- `src/app/api/*/route.ts` - API route handlers

**Configuration:**
- `package.json` - Dependencies, scripts
- `tsconfig.json` - TypeScript config with `@/` path alias
- `next.config.ts` - Next.js config, environment variables
- `src/lib/config.ts` - Runtime configuration validation

**Core Logic:**
- `src/lib/supabase/server.ts` - Server Supabase client
- `src/lib/supabase/client.ts` - Browser Supabase client
- `src/lib/google/calendar.ts` - Google Calendar service
- `src/lib/stripe/checkout.ts` - Stripe checkout
- `src/lib/email/notifications.ts` - Email sending
- `src/lib/availability/slots.ts` - Available slot calculation

**Database:**
- `src/lib/types/database.ts` - Database type definitions
- `supabase/migrations/*.sql` - Schema migrations

**Testing:**
- Not detected - No test files found

## Naming Conventions

**Files:**
- `kebab-case.ts` / `kebab-case.tsx` for most files
- `[param]` for dynamic route segments
- `route.ts` for API routes (Next.js convention)
- `page.tsx` for page components (Next.js convention)
- `layout.tsx` for layouts (Next.js convention)

**Directories:**
- `kebab-case` for feature directories
- `(group)` for route groups (Next.js convention)
- `[param]` for dynamic segments

**Special Patterns:**
- `*.tsx` for React components
- `*.ts` for non-React code
- `*_*.sql` for numbered migrations

## Where to Add New Code

**New Feature:**
- Primary code: `src/components/{feature}/`, `src/lib/{feature}/`
- Pages: `src/app/{route}/page.tsx`
- API: `src/app/api/{endpoint}/route.ts`
- Types: `src/lib/types/`

**New Component:**
- Implementation: `src/components/{category}/ComponentName.tsx`
- UI primitives: `src/components/ui/`

**New API Route:**
- Definition: `src/app/api/{endpoint}/route.ts`
- Handler: Same file (export GET, POST, etc.)

**New Service/Utility:**
- Implementation: `src/lib/{service}/`
- Types: `src/lib/types/database.ts` or new file

**Database Changes:**
- Migration: `supabase/migrations/XXXXX_description.sql`
- Types: Update `src/lib/types/database.ts`

## Special Directories

**.claude/**
- Purpose: Claude Code AI assistant configuration
- Source: Custom configuration
- Committed: Yes

**.planning/**
- Purpose: Project planning and codebase documentation
- Source: Generated by GSD system
- Committed: Yes

**.next/**
- Purpose: Next.js build output
- Source: Auto-generated by `npm run build`
- Committed: No (in .gitignore)

**node_modules/**
- Purpose: npm dependencies
- Source: `npm install`
- Committed: No (in .gitignore)

---

*Structure analysis: 2026-01-08*
*Update when directory structure changes*
