# Testing Patterns

**Analysis Date:** 2026-01-08

## Test Framework

**Runner:**
- Not configured - No test framework detected in `package.json`

**Assertion Library:**
- Not configured

**Run Commands:**
```bash
# No test commands available
npm run lint    # Only linting is configured
```

## Test File Organization

**Location:**
- No test files detected in codebase

**Naming:**
- No established pattern (no tests exist)

**Structure:**
- N/A

## Test Structure

**Suite Organization:**
- N/A - No tests implemented

## Mocking

**Framework:**
- N/A

## Fixtures and Factories

**Test Data:**
- N/A

## Coverage

**Requirements:**
- No coverage requirements (no tests)

**Configuration:**
- N/A

## Test Types

**Unit Tests:**
- Not implemented

**Integration Tests:**
- Not implemented

**E2E Tests:**
- Not implemented

## Recommended Test Setup

Based on the codebase patterns, a recommended testing setup would be:

**Framework Recommendation:**
- Vitest (fast, TypeScript-native, Vite-compatible)
- React Testing Library for component tests
- MSW (Mock Service Worker) for API mocking

**Priority Areas to Test:**
1. `src/lib/availability/slots.ts` - Slot calculation logic (pure functions)
2. `src/lib/stripe/checkout.ts` - Payment flow
3. `src/app/api/bookings/route.ts` - Booking creation API
4. `src/lib/google/calendar.ts` - Calendar service (mock Google API)

**Suggested Test Structure:**
```
src/
  lib/
    availability/
      slots.ts
      slots.test.ts       # Co-located unit tests
    stripe/
      checkout.ts
      checkout.test.ts
  app/
    api/
      bookings/
        route.ts
        route.test.ts     # API integration tests
```

**Installation (if implementing):**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom msw
```

---

*Testing analysis: 2026-01-08*
*Update when test patterns are established*
