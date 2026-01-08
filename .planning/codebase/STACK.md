# Technology Stack

**Analysis Date:** 2026-01-08

## Languages

**Primary:**
- TypeScript 5.x - All application code (`tsconfig.json`, `package.json`)

**Secondary:**
- JavaScript - Configuration files (config.js, etc.)
- SQL - Database migrations (`supabase/migrations/*.sql`)

## Runtime

**Environment:**
- Node.js 20.x (inferred from Next.js 16 requirements)
- Browser runtime (React 19 client components)

**Package Manager:**
- npm (inferred from package-lock.json pattern)
- Lockfile: package-lock.json

## Frameworks

**Core:**
- Next.js 16.1.1 - Full-stack React framework (`package.json`, `next.config.ts`)
- React 19.2.3 - UI framework (`package.json`)
- Tailwind CSS 4 - Styling (`@tailwindcss/postcss` in `package.json`)

**Testing:**
- Not detected - No test framework configured

**Build/Dev:**
- TypeScript 5.x - Type checking and compilation (`tsconfig.json`)
- ESLint 9 - Linting (`eslint-config-next` in `package.json`)
- PostCSS - CSS processing (`@tailwindcss/postcss`)

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.89.0 - Database client and auth (`src/lib/supabase/`)
- `@supabase/ssr` 0.8.0 - Server-side Supabase client
- `googleapis` 169.0.0 - Google Calendar API (`src/lib/google/calendar.ts`)
- `stripe` 20.1.1 - Payment processing (`src/lib/stripe/`)
- `resend` 6.6.0 - Email sending (`src/lib/email/notifications.ts`)

**Infrastructure:**
- `zod` 4.3.5 - Schema validation
- `date-fns` 4.1.0 + `date-fns-tz` 3.2.0 - Date manipulation
- `nanoid` 5.1.6 - Unique ID generation
- `uuid` 13.0.0 - UUID generation

**UI:**
- `framer-motion` 12.24.7 - Animations
- `@dnd-kit/core` 6.3.1 - Drag and drop functionality
- `lucide-react` 0.562.0 - Icons
- `react-colorful` 5.6.1 - Color picker

## Configuration

**Environment:**
- `.env` files for environment variables
- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Optional: `STRIPE_SECRET_KEY`, `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- Configuration validation in `src/lib/config.ts`

**Build:**
- `tsconfig.json` - TypeScript config with strict mode
- `next.config.ts` - Next.js configuration
- `@/` path alias maps to `./src/*`

## Platform Requirements

**Development:**
- Any platform with Node.js 20+
- No Docker required (uses Supabase cloud)

**Production:**
- Vercel - Primary deployment target (Next.js hosting)
- Supabase - PostgreSQL database (cloud hosted)
- Stripe - Payment processing (external service)
- Resend - Email delivery (external service)
- Google Cloud - Calendar API (external service)

---

*Stack analysis: 2026-01-08*
*Update after major dependency changes*
