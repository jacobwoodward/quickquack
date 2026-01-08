# Coding Conventions

**Analysis Date:** 2026-01-08

## Naming Patterns

**Files:**
- `kebab-case.ts` for utility modules (e.g., `notifications.ts`, `calendar.ts`)
- `kebab-case.tsx` for React components (e.g., `page.tsx`, `layout.tsx`)
- `route.ts` for API route handlers (Next.js convention)
- No test files detected (no `.test.ts` or `.spec.ts` pattern)

**Functions:**
- camelCase for all functions (e.g., `createCheckoutSession`, `sendBookingConfirmation`)
- `get*` prefix for data fetching (e.g., `getGoogleCalendarService`, `getAppUrl`)
- `create*` prefix for factory functions (e.g., `createClient`, `createServiceClient`)
- `send*` prefix for email functions (e.g., `sendBookingConfirmation`)
- `is*` prefix for boolean checks (e.g., `isStripeConfigured`, `isFullyConfigured`)

**Variables:**
- camelCase for variables (e.g., `eventType`, `startTime`)
- UPPER_SNAKE_CASE for constants (e.g., `appUrl` defined as const)
- No underscore prefix for private members

**Types:**
- PascalCase for interfaces and types (e.g., `BookingEmailParams`, `CreateCheckoutParams`)
- No `I` prefix for interfaces
- Type aliases for database row types (e.g., `type User = Database["public"]["Tables"]["users"]["Row"]`)

## Code Style

**Formatting:**
- 2 space indentation (inferred from code samples)
- Double quotes for strings in JSX
- Double quotes for imports
- Semicolons required (used consistently)
- Trailing commas in multi-line objects/arrays

**Linting:**
- ESLint 9 with `eslint-config-next`
- Run: `npm run lint`
- TypeScript strict mode enabled (`tsconfig.json`)

## Import Organization

**Order:**
1. External packages (react, next, date-fns, etc.)
2. Internal modules (`@/lib/`, `@/components/`)
3. Type imports (`import type { ... }`)

**Grouping:**
- Blank line between groups
- Type imports typically at end or with related value imports

**Path Aliases:**
- `@/` maps to `src/` (configured in `tsconfig.json`)
- Used consistently throughout codebase

## Error Handling

**Patterns:**
- Try/catch at API route level
- Log errors before throwing or returning error response
- External service failures don't block main operation (graceful degradation)

**API Error Format:**
```typescript
return NextResponse.json(
  { error: "Error message" },
  { status: 400 }  // or 404, 500
);
```

**Service Error Pattern:**
```typescript
try {
  // operation
} catch (error) {
  console.error("Failed to X:", error);
  throw error;  // or continue gracefully
}
```

## Logging

**Framework:**
- `console.log` for info
- `console.error` for errors
- No structured logging library

**Patterns:**
- Log operation context: `console.error("Booking API error:", error)`
- Log when skipping operations: `console.log("Resend not configured, skipping email notification")`

## Comments

**When to Comment:**
- JSDoc for exported functions with complex parameters
- Inline comments for non-obvious logic
- eslint-disable comments when bypassing type safety

**JSDoc Style:**
```typescript
/**
 * Create a Stripe Checkout session for a paid booking.
 * Uses inline price_data so no Stripe product/price setup is required.
 */
export async function createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult>
```

**TODO Comments:**
- Not detected in codebase (clean codebase)

## Function Design

**Size:**
- Functions kept reasonably sized
- Complex operations broken into helper functions

**Parameters:**
- Object parameters for functions with multiple args (e.g., `CreateCheckoutParams`)
- Destructure in function body
- Optional properties for optional parameters

**Return Values:**
- Explicit return types on exported functions
- Use `Promise<T>` for async functions
- Return `null` for "not found" cases

## Module Design

**Exports:**
- Named exports preferred
- Default exports only for Next.js pages (convention)
- Export functions and types from same file

**Organization:**
- One service per file (e.g., `calendar.ts`, `checkout.ts`)
- Types co-located with implementation or in `types/` directory
- No barrel files (index.ts re-exports)

## React Patterns

**Server Components (default):**
```typescript
// No 'use client' directive
export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('table').select('*')
  return <Component data={data} />
}
```

**Client Components:**
```typescript
'use client'

import { useState } from 'react'

export function InteractiveComponent() {
  const [state, setState] = useState(initialValue)
  // ...
}
```

**API Routes:**
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // validate, process
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Message" }, { status: 500 })
  }
}
```

---

*Convention analysis: 2026-01-08*
*Update when patterns change*
