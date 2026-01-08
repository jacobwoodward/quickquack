# Codebase Concerns

**Analysis Date:** 2026-01-08

## Tech Debt

**eslint-disable for type casting:**
- Issue: Multiple `eslint-disable-next-line @typescript-eslint/no-explicit-any` comments to bypass Supabase type issues
- Files: `src/app/api/bookings/route.ts` (lines 82, 110, 159, 170), `src/lib/google/calendar.ts` (line 38)
- Why: Supabase client type inference issues with insert/update operations
- Impact: Loss of type safety on database operations
- Fix approach: Investigate Supabase type generation, use proper generic typing

**Inline HTML email templates:**
- Issue: Email HTML is hardcoded as template literals in `src/lib/email/notifications.ts`
- Files: `src/lib/email/notifications.ts` (700+ lines)
- Why: Quick implementation without template engine
- Impact: Difficult to maintain/update email designs, no preview capability
- Fix approach: Extract to React Email templates or separate HTML files

## Known Bugs

**No known bugs documented**

The codebase appears relatively clean. If bugs are discovered, document them here with:
- Symptoms
- Trigger/reproduction steps
- Workaround
- Root cause

## Security Considerations

**Service role key exposure risk:**
- Risk: `createServiceClient()` uses service role key which bypasses RLS
- Files: `src/lib/supabase/server.ts`, `src/app/api/bookings/route.ts`
- Current mitigation: Only used in API routes, not exposed to client
- Recommendations: Audit all usages, ensure no user-controllable data in queries

**Webhook signature validation:**
- Risk: Stripe webhook signature validation is implemented
- Files: `src/app/api/stripe/webhook/route.ts`
- Current mitigation: Uses `STRIPE_WEBHOOK_SECRET` for validation
- Status: ✓ Properly implemented

**Cron endpoint protection:**
- Risk: Cron endpoint could be called by anyone
- Files: `src/app/api/cron/reminders/route.ts`
- Current mitigation: `CRON_SECRET` header check
- Status: ✓ Properly implemented

## Performance Bottlenecks

**No significant bottlenecks detected**

Potential areas to monitor:
- Slot calculation for users with many bookings
- Calendar API calls (rate limited by Google)
- Large number of reminder emails in single cron run

## Fragile Areas

**Booking creation flow:**
- Files: `src/app/api/bookings/route.ts`
- Why fragile: Multiple external service calls (DB, Google Calendar, Email) in sequence
- Common failures: Google API errors, email sending failures
- Safe modification: Errors are caught and logged, don't block booking
- Test coverage: No tests

**Stripe webhook handling:**
- Files: `src/app/api/stripe/webhook/route.ts`
- Why fragile: Must correctly parse Stripe events and create bookings
- Common failures: Missing metadata, timing issues
- Safe modification: Test with Stripe CLI before deploying
- Test coverage: No tests

## Scaling Limits

**Vercel Hobby Plan:**
- Current capacity: 10s function timeout, limited bandwidth
- Limit: ~100 concurrent users (estimated)
- Symptoms at limit: 504 timeouts, 429 rate limits
- Scaling path: Upgrade to Vercel Pro

**Supabase Free Tier:**
- Current capacity: 500MB database, limited API requests
- Limit: ~5000 users estimated
- Symptoms at limit: 429 rate limits, storage limits
- Scaling path: Upgrade to Supabase Pro

## Dependencies at Risk

**No critical dependency risks detected**

All major dependencies are actively maintained:
- Next.js 16 - Current
- React 19 - Current
- Supabase SDK - Current
- Stripe SDK - Current

## Missing Critical Features

**Test suite:**
- Problem: No automated tests
- Current workaround: Manual testing
- Blocks: Confident refactoring, regression prevention
- Implementation complexity: Medium (need to set up Vitest, write tests)

**Rate limiting:**
- Problem: No rate limiting on public API endpoints
- Current workaround: None
- Blocks: Protection against abuse
- Implementation complexity: Low (add middleware or use Vercel's rate limiting)

## Test Coverage Gaps

**All code untested:**
- What's not tested: Everything - no test framework configured
- Risk: Regressions go unnoticed, refactoring is risky
- Priority: High
- Difficulty to test: Medium - need to set up test infrastructure first

**Priority test targets:**
1. `src/lib/availability/slots.ts` - Pure logic, easy to test
2. `src/app/api/bookings/route.ts` - Critical path
3. `src/lib/stripe/checkout.ts` - Payment handling
4. `src/lib/google/calendar.ts` - External service integration

## Documentation Gaps

**No API documentation:**
- Problem: API endpoints not documented
- Impact: Difficult for future development
- Recommendation: Add JSDoc comments or OpenAPI spec

**Missing .env.example:**
- Problem: No example environment file for new developers
- Files: Root directory
- Impact: Onboarding difficulty
- Fix: Create `.env.example` with all required variables (no values)

---

*Concerns audit: 2026-01-08*
*Update as issues are fixed or new ones discovered*
