# Plan 01-01 Summary: Fix localhost redirect after OAuth

## Status: COMPLETED

## What Was Done

**Task 1: Update auth callback to use canonical app URL**
- Modified `src/app/auth/callback/route.ts` to import and use `getAppUrl()` from `@/lib/config`
- Changed both success and error redirects to use `appUrl` instead of `origin` from request URL
- This ensures production redirects work correctly regardless of how the OAuth flow constructs the callback URL

## Changes Made

**File: `src/app/auth/callback/route.ts`**
- Added import: `import { getAppUrl } from "@/lib/config";`
- Removed `origin` from URL destructuring
- Added `const appUrl = getAppUrl();` at start of function
- Changed success redirect from `${origin}${redirectTo}` to `${appUrl}${redirectTo}`
- Changed error redirect from `${origin}/login?error=auth_failed` to `${appUrl}/login?error=auth_failed`

## Verification

- TypeScript compiles without errors
- Human verification confirmed: User tested production OAuth flow and confirmed redirect works correctly

## Additional Configuration Required

During testing, discovered that Supabase Auth redirect URLs needed to include the full callback path:
- Added `https://www.jacobwoodward.dev/auth/callback` to Supabase Auth URL Configuration

## Commit

`9ffeee8` - fix(01-01): use canonical app URL for auth redirects

## Completion Date

2026-01-08
