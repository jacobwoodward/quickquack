# QuickQuack

**Linktree + Calendly = QuickQuack**

A free, open-source link-in-bio and scheduling app you can host yourself. Stop paying $204/year for two separate subscriptions.

[![Watch the QuickQuack Demo](https://img.youtube.com/vi/AyrHdHsGf5M/maxresdefault.jpg)](https://www.youtube.com/watch?v=AyrHdHsGf5M)

---

## Table of Contents

- [What is QuickQuack?](#what-is-quickquack)
- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Requirements](#requirements)
- [Setup Guide](#setup-guide)
  - [Step 1: Fork and Clone](#step-1-fork-and-clone)
  - [Step 2: Set Up Supabase](#step-2-set-up-supabase-database)
  - [Step 3: Set Up Google OAuth](#step-3-set-up-google-oauth-sign-in--calendar)
  - [Step 4: Deploy to Vercel](#step-4-deploy-to-vercel)
  - [Step 5: First Login](#step-5-first-login)
- [Post-Setup Configuration](#post-setup-configuration)
- [Optional Features](#optional-features)
  - [Email Notifications](#email-notifications-resend)
  - [Paid Bookings](#paid-bookings-stripe)
  - [Automated Reminders](#automated-reminders-vercel-cron)
- [Environment Variables Reference](#environment-variables-reference)
- [Custom Domain Setup](#custom-domain-setup)
- [Development Guide](#development-guide)
- [Database Schema](#database-schema)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Updating](#updating)
- [License](#license)

---

## What is QuickQuack?

QuickQuack combines a **link-in-bio page** (like Linktree) with **appointment scheduling** (like Calendly) into one self-hosted app. Your visitors can see all your links AND book time with you—from a single page you control.

### Why Self-Host?

| Benefit | Details |
|---------|---------|
| **Zero monthly fees** | No subscriptions, no per-booking limits, free forever |
| **Own your data** | Visitor analytics, bookings, and links stay in your database |
| **No vendor lock-in** | Export everything, switch anytime |
| **Privacy-focused** | No tracking scripts, no selling your data |
| **Custom domain** | Use your own URL instead of someone else's subdomain |
| **Fully customizable** | Change anything in the code |

---

## Features

### Link-in-Bio

- **Customizable themes** - Multiple design options with colors, gradients, and images
- **Social media links** - Connect 15+ platforms (Instagram, TikTok, YouTube, LinkedIn, etc.)
- **Click analytics** - See which links get the most engagement
- **Custom branding** - Your domain, your colors, no "Powered by" badges
- **Drag-and-drop ordering** - Arrange links however you want
- **Multiple link types** - URLs, headings, dividers, email, phone, music embeds

### Scheduling

- **Google Calendar sync** - Automatically shows your real availability
- **Google Meet integration** - Auto-generates meeting links for video calls
- **Multiple event types** - Different meeting durations and purposes
- **Buffer times** - Add breaks before and after meetings
- **Booking windows** - Control how far ahead people can book
- **Minimum notice** - Prevent last-minute bookings
- **Daily/weekly limits** - Cap how many meetings you take
- **Guest rescheduling** - Let guests reschedule without contacting you
- **Guest cancellation** - Let guests cancel with one click

### Payments (Optional)

- **Stripe integration** - Accept payments for consultations
- **Automatic refunds** - Handle cancellations gracefully
- **Payment tracking** - View payment history in dashboard

### Notifications (Optional)

- **Email confirmations** - Automatic booking confirmations
- **Reminder emails** - Configurable reminders before meetings
- **ICS attachments** - Calendar files in all emails

---

## Architecture Overview

QuickQuack is built on these services:

```
┌─────────────────────────────────────────────────────────────┐
│                         Vercel                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Next.js Application                     │    │
│  │  • Dashboard (authenticated pages)                   │    │
│  │  • Public booking pages                              │    │
│  │  • API routes                                        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│     Supabase     │ │  Google Cloud    │ │     Stripe       │
│  • PostgreSQL DB │ │  • Calendar API  │ │  • Payments      │
│  • Auth (OAuth)  │ │  • Meet links    │ │  • Webhooks      │
│  • Row-level     │ │  • Busy times    │ │                  │
│    security      │ │                  │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │      Resend      │
                    │  • Confirmation  │
                    │    emails        │
                    │  • Reminders     │
                    └──────────────────┘
```

**Data Flow:**
1. User authenticates via Google OAuth (handled by Supabase)
2. App stores user data, links, event types, and bookings in Supabase PostgreSQL
3. When checking availability, app fetches busy times from Google Calendar
4. When booking is created, app creates Google Calendar event with Meet link
5. If payment required, guest is redirected to Stripe Checkout
6. Confirmation emails sent via Resend (if configured)

---

## Requirements

Before starting, you'll need free accounts on:

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Supabase](https://supabase.com) | Database & authentication | 500MB database, 50K monthly active users |
| [Google Cloud](https://console.cloud.google.com) | Calendar integration & OAuth | Free for personal use |
| [Vercel](https://vercel.com) | Hosting | 100GB bandwidth/month |
| [Resend](https://resend.com) | Email notifications | 3,000 emails/month |
| [Stripe](https://stripe.com) *(optional)* | Payment processing | No monthly fees (2.9% + 30¢ per transaction) |

**Technical Requirements:**
- Node.js 18+ installed locally
- Git installed
- A code editor (VS Code recommended)
- Basic command line familiarity

---

## Setup Guide

### Step 1: Fork and Clone

1. Click the **Fork** button at the top of this repository
2. Clone your forked repository:
   ```bash
   git clone https://github.com/jacobwoodward/quickquack.git
   cd quickquack
   npm install
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

### Step 2: Set Up Supabase (Database)

#### Create Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** and fill in:
   - **Name**: QuickQuack (or whatever you prefer)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose the closest to your users
3. Wait for your project to be created (~2 minutes)

#### Run Database Migrations

4. In your Supabase dashboard, click **SQL Editor** in the sidebar
5. Open the file `supabase/migrations/00001_initial_schema.sql` from this repository
6. Copy the entire contents and paste into the SQL Editor
7. Click **Run** to execute
8. Repeat for each migration file in order:
   - `00002_add_payments.sql`
   - `00003_email_templates.sql`

> **Important**: Run migrations in numerical order. Each builds on the previous one.

#### Get Your API Keys

9. Click **Settings** (gear icon) → **API**
10. Copy these values to your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Security Note**: The service role key bypasses Row Level Security. Never expose it in client-side code.

### Step 3: Set Up Google OAuth (Sign In & Calendar)

#### Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. Name it "QuickQuack" and click **Create**
4. Wait for creation, then select your new project

#### Enable Required APIs

5. Go to **APIs & Services** → **Library**
6. Search for and enable:
   - **Google Calendar API** (required)

#### Configure OAuth Consent Screen

7. Go to **APIs & Services** → **OAuth consent screen**
8. Choose **External** and click **Create**
9. Fill in required fields:
   - **App name**: QuickQuack
   - **User support email**: Your email
   - **Developer contact**: Your email
10. Click **Save and Continue**
11. On **Scopes** page, click **Add or Remove Scopes**
12. Add these scopes:
    - `https://www.googleapis.com/auth/calendar.readonly`
    - `https://www.googleapis.com/auth/calendar.events`
13. Click **Save and Continue** through remaining screens

#### Create OAuth Credentials

14. Go to **APIs & Services** → **Credentials**
15. Click **+ Create Credentials** → **OAuth client ID**
16. Choose **Web application**
17. Name: "QuickQuack Web"
18. Under **Authorized redirect URIs**, add:
    ```
    https://YOUR_PROJECT.supabase.co/auth/v1/callback
    ```
    Replace `YOUR_PROJECT` with your Supabase project reference (found in your Supabase URL)
19. Click **Create**
20. Copy the **Client ID** and **Client Secret**

Add to your `.env.local`:
```bash
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

#### Enable Google in Supabase

21. In Supabase, go to **Authentication** → **Providers**
22. Find **Google** and toggle it on
23. Paste your **Client ID** and **Client Secret**
24. Under **Authorized Client IDs**, add your Client ID again
25. Click **Save**

### Step 4: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New** → **Project**
3. Find your forked quickquack repository and click **Import**
4. Expand **Environment Variables** and add all variables from your `.env.local`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret |
| `NEXT_PUBLIC_APP_URL` | Leave blank for now (you'll update after deploy) |

5. Click **Deploy**

#### After Deployment

6. Copy your deployment URL (e.g., `https://quickquack-abc123.vercel.app`)
7. Update environment variables in Vercel:
   - Set `NEXT_PUBLIC_APP_URL` to your deployment URL
8. Add another redirect URI to Google Cloud Console:
   - Go to **Credentials** → Your OAuth client
   - Add URI: `https://YOUR-APP.vercel.app/auth/callback`
9. Redeploy for changes to take effect (Settings → Deployments → Redeploy)

### Step 5: First Login

1. Visit your deployed app
2. Click **Sign in with Google**
3. Select your Google account
4. Authorize calendar access when prompted
5. Complete your profile setup:
   - Choose a username (this becomes your public URL)
   - Add your name and bio
   - Configure your availability
   - Create your first event type

---

## Post-Setup Configuration

After your first login, configure these settings:

### 1. Set Your Availability

Go to **Dashboard** → **Availability**:
- Toggle which days you're available
- Set your working hours for each day
- Times are in YOUR timezone

### 2. Create Event Types

Go to **Dashboard** → **Event Types**:
- Click **Create Event Type**
- Set duration (15, 30, 60 minutes, etc.)
- Add description and location
- Configure buffer times if needed
- Set booking limits if desired

### 3. Add Your Links

Go to **Dashboard** → **Links**:
- Add URLs, social profiles, or embed your event types
- Drag to reorder
- Toggle visibility on/off

### 4. Customize Appearance

Go to **Dashboard** → **Appearance**:
- Choose a theme
- Customize colors
- Add background image or gradient
- Set button styles

### 5. Connect Calendar

Go to **Dashboard** → **Settings**:
- Select which calendars to check for conflicts
- Choose where new events are created

---

## Optional Features

### Email Notifications (Resend)

Send booking confirmations and reminders via email.

**Setup:**

1. Create a free account at [resend.com](https://resend.com)
2. Go to **API Keys** and create a new key
3. Add to Vercel environment variables:

```bash
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=QuickQuack <bookings@yourdomain.com>
```

**Domain Verification (for custom "from" address):**

By default, you can only send from `onboarding@resend.dev`. To use your own domain:

1. In Resend, go to **Domains** → **Add Domain**
2. Add the DNS records they provide
3. Wait for verification (can take up to 24 hours)
4. Update `EMAIL_FROM` to use your verified domain

### Paid Bookings (Stripe)

Accept payments for consultations.

**Setup:**

1. Create a [Stripe](https://stripe.com) account
2. Complete business verification
3. Get your API keys from **Developers** → **API keys**
4. Create a webhook:
   - Go to **Developers** → **Webhooks**
   - Click **Add endpoint**
   - URL: `https://your-app.vercel.app/api/stripe/webhook`
   - Events to send: `checkout.session.completed`, `payment_intent.succeeded`
5. Add to Vercel:

```bash
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

**Testing Payments:**

Use Stripe's test mode first:
- Test card: `4242 4242 4242 4242`
- Any future expiry and any CVC

### Automated Reminders (Vercel Cron)

Send reminder emails before meetings.

**Setup:**

1. The cron job is pre-configured in `vercel.json`
2. Generate a secret: `openssl rand -base64 32`
3. Add to Vercel:

```bash
CRON_SECRET=your-generated-secret
```

**How it works:**
- Runs daily at 8 AM UTC
- Sends reminders for meetings within the next 24 hours
- Requires Resend to be configured

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret!) | `eyJhbGciOi...` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-xxxxx` |
| `NEXT_PUBLIC_APP_URL` | Your deployed app URL | `https://myapp.vercel.app` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API key for emails | None (emails disabled) |
| `EMAIL_FROM` | Email sender address | None |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments | None (payments disabled) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | None |
| `CRON_SECRET` | Secret for cron job authentication | None (cron disabled) |

---

## Custom Domain Setup

### Vercel Domain Configuration

1. In Vercel, go to your project → **Settings** → **Domains**
2. Click **Add**
3. Enter your domain (e.g., `links.yourdomain.com`)
4. Add the DNS records Vercel provides:
   - For apex domain: Add A record pointing to `76.76.21.21`
   - For subdomain: Add CNAME record pointing to `cname.vercel-dns.com`
5. Wait for SSL certificate provisioning (automatic)

### Update Application Settings

6. Update `NEXT_PUBLIC_APP_URL` in Vercel to your custom domain
7. Add new callback URL to Google OAuth:
   - Google Cloud Console → Credentials → Your OAuth client
   - Add: `https://yourdomain.com/auth/callback`
8. Redeploy your application

---

## Development Guide

### Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint and TypeScript checks |

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/             # Login page
│   ├── (dashboard)/        # Authenticated dashboard pages
│   ├── [slug]/             # Public profile page
│   ├── book/[username]/    # Public booking pages
│   └── api/                # API routes
├── components/             # React components
│   ├── ui/                 # Reusable UI primitives
│   ├── booking/            # Booking flow components
│   ├── dashboard/          # Dashboard components
│   └── links/              # Link-in-bio components
└── lib/                    # Utilities and libraries
    ├── supabase/           # Database clients
    ├── google/             # Calendar integration
    ├── stripe/             # Payment integration
    └── types/              # TypeScript definitions
```

### Adding New Features

**New Link Type:**
1. Add type to `LinkType` enum in `src/lib/types/database.ts`
2. Add form handling in `src/components/links/link-editor.tsx`
3. Add rendering in `src/components/public/link-card.tsx`
4. Run migration to update database enum

**New Event Type Field:**
1. Add column to `event_types` table (migration)
2. Update `EventType` interface in `src/lib/types/database.ts`
3. Add form field in `src/components/event-types/event-type-form.tsx`
4. Update booking page if relevant

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User profiles (extends Supabase auth.users) |
| `schedules` | Named availability templates |
| `availability` | Time slots within schedules |
| `event_types` | Meeting types with settings |
| `bookings` | Scheduled meetings |
| `attendees` | Guest information |
| `credentials` | OAuth tokens (encrypted) |
| `selected_calendars` | Calendars to check for conflicts |
| `destination_calendars` | Where to create events |
| `payments` | Stripe payment records |

### Link-in-Bio Tables

| Table | Purpose |
|-------|---------|
| `page_settings` | Theme and appearance settings |
| `links` | User's links and widgets |
| `social_profiles` | Social media profiles |
| `link_clicks` | Analytics data |

### Accessing Raw Data

You can query your database directly in Supabase:

1. Go to Supabase Dashboard → **Table Editor**
2. Browse and edit data directly
3. Or use **SQL Editor** for complex queries

**Export your data:**
```sql
-- Export all bookings
SELECT * FROM bookings WHERE user_id = 'your-user-id';

-- Export link analytics
SELECT * FROM link_clicks;
```

---

## Security Considerations

### Row-Level Security (RLS)

All tables have RLS policies ensuring users can only access their own data. The policies are defined in the migration files.

### OAuth Tokens

Google OAuth tokens are stored encrypted in the `credentials` table. Tokens are refreshed automatically when expired.

### Booking Security

Booking cancellation and rescheduling use unique IDs (UUIDs) that are:
- Cryptographically random (96-bit)
- Unguessable without the link
- Sent only to the guest's email

### Environment Variables

- Never commit `.env.local` to version control
- Use Vercel's encrypted environment variables
- Rotate secrets if exposed

### Input Validation

All user inputs are validated using Zod schemas. The application escapes HTML in user-provided content to prevent XSS attacks.

---

## Troubleshooting

### Setup Issues

#### "Google OAuth is not configured"
- Verify Google provider is enabled in Supabase Authentication
- Check Client ID and Secret are copied correctly (no extra spaces)
- Ensure redirect URIs include your Supabase callback URL

#### "Authentication failed" or "Access denied"
- Make sure Calendar API is enabled in Google Cloud Console
- Check that OAuth consent screen is configured
- If app is in testing mode, add yourself as a test user

#### "Unable to connect calendar"
After logging in, if calendar connection fails:
- Log out completely
- Clear browser cache
- Log in again and re-authorize

### Runtime Issues

#### Calendar events not being created
1. Go to Settings → Calendar Integration
2. Make sure you've selected a destination calendar
3. Verify the selected calendar allows event creation
4. Re-authenticate if tokens might be expired

#### Availability slots not showing
1. Check your availability schedule is configured
2. Verify the event type has a schedule selected
3. Check minimum notice period isn't blocking slots
4. Ensure booking limits haven't been reached

#### Emails not sending
1. Verify `RESEND_API_KEY` is set correctly
2. Check `EMAIL_FROM` uses a verified domain (or use `onboarding@resend.dev`)
3. Check Resend dashboard for failed sends

#### Payments not working
1. Confirm `STRIPE_SECRET_KEY` is correct
2. Verify webhook is configured with correct URL
3. Check webhook secret matches `STRIPE_WEBHOOK_SECRET`
4. Test with Stripe test mode first

### Configuration Checker

Visit `/setup` on your deployed app to see which services are configured correctly. This page shows:
- Database connection status
- Google OAuth configuration
- Email service status
- Payment service status

---

## FAQ

### General Questions

**Q: Can I use this without Google Calendar?**
A: Currently, Google Calendar is required for authentication and scheduling. Other calendar providers may be added in the future.

**Q: Can multiple users share one instance?**
A: Yes! Each user gets their own login, data, and public page. The database supports multiple users.

**Q: Is there a limit on bookings?**
A: No artificial limits. You're only limited by your Supabase free tier (500MB database).

**Q: Can I use this for a team?**
A: Currently designed for individual users. Team features aren't built in.

### Technical Questions

**Q: Can I run this on something other than Vercel?**
A: Yes, but you'll need to:
- Set up your own Node.js hosting
- Configure environment variables
- Set up cron jobs manually for reminders
- Handle SSL certificates

**Q: How do I backup my data?**
A: Use Supabase's backup features or export data via SQL queries. See [Database Schema](#database-schema) for export examples.

**Q: Can I change the database schema?**
A: Yes, create new migration files in `supabase/migrations/`. Run them in Supabase SQL Editor.

**Q: Why are there `as any` TypeScript casts in the code?**
A: This is a known limitation of Supabase's TypeScript client where `.insert()`, `.update()`, and `.delete()` operations resolve to `never` type. The casts are safe and documented.

### Common Issues

**Q: Why does my availability show wrong times?**
A: Timezone handling. Your availability is set in your timezone. Guests see times in their detected timezone. Ensure your browser timezone is correct.

**Q: Why can't guests book certain slots?**
A: Several reasons:
- Slot conflicts with your calendar events
- Minimum notice period hasn't passed
- Booking limit reached for that day/week
- Buffer times overlapping with other bookings

**Q: How do I change my username/public URL?**
A: Go to Settings → Profile → Update your username. Note: This changes your public URL and may break existing shared links.

---

## Updating

To get the latest features and bug fixes:

### If You Forked the Repository

1. Add the original as upstream:
   ```bash
   git remote add upstream https://github.com/jacobwoodward/quickquack.git
   ```
2. Fetch and merge updates:
   ```bash
   git fetch upstream
   git merge upstream/main
   ```
3. Resolve any conflicts
4. Push to your fork:
   ```bash
   git push origin main
   ```
5. Vercel will automatically redeploy

### Database Migrations

If new migrations are added:
1. Check the `supabase/migrations/` folder for new files
2. Run new migrations in Supabase SQL Editor in order
3. Migrations are numbered—only run ones newer than what you have

---

## License

MIT License

Copyright (c) 2025 Jacob Woodward

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
