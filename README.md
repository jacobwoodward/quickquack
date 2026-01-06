# Cal-Lite

A lightweight, single-user scheduling application built with Next.js 15, Supabase, and Google Calendar integration.

## Features

- **Event Types**: Create different meeting types (30 min, 1 hour, etc.) with custom settings
- **Availability Management**: Set your weekly working hours and date-specific overrides
- **Google Calendar Integration**:
  - Check for conflicts across multiple calendars
  - Auto-create events with Google Meet links
  - Two-way sync with your calendar
- **Public Booking Pages**: Shareable links for each event type
- **Guest Self-Service**: Attendees can reschedule or cancel their bookings
- **Email Notifications**: Confirmation, reschedule, and cancellation emails

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with Google OAuth
- **Calendar**: Google Calendar API
- **Email**: Resend
- **Date/Time**: date-fns, date-fns-tz

## Getting Started

### 1. Prerequisites

- Node.js 18+
- A Supabase account
- A Google Cloud Console project with Calendar API enabled
- A Resend account (for email notifications)

### 2. Clone and Install

```bash
cd cal-lite
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project
2. Go to the SQL Editor and run the migration in `supabase/migrations/00001_initial_schema.sql`
3. Go to Project Settings > API to get your URL and keys

### 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable the Google Calendar API
4. Go to Credentials > Create Credentials > OAuth Client ID
5. Add authorized redirect URI: `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
6. Copy the Client ID and Secret

### 5. Configure Supabase Auth

1. In Supabase Dashboard, go to Authentication > Providers
2. Enable Google provider
3. Add your Google Client ID and Secret
4. Add authorized redirect URLs

### 6. Configure Environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth & Calendar
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=Cal-Lite <bookings@yourdomain.com>
```

### 7. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
cal-lite/
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Login page
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── event-types/   # Event type management
│   │   │   ├── availability/  # Schedule settings
│   │   │   └── settings/      # Profile & calendar settings
│   │   ├── book/[username]/   # Public booking pages
│   │   ├── reschedule/[uid]/  # Guest reschedule
│   │   ├── cancel/[uid]/      # Guest cancel
│   │   ├── auth/callback/     # OAuth callback
│   │   └── api/               # API routes
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── event-types/       # Event type components
│   │   ├── booking/           # Booking flow components
│   │   └── availability/      # Availability editor
│   └── lib/
│       ├── supabase/          # Supabase clients
│       ├── google/            # Google Calendar service
│       ├── availability/      # Slot calculation
│       ├── email/             # Email notifications
│       └── types/             # TypeScript types
└── supabase/
    └── migrations/            # SQL migrations
```

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

Make sure to update:
- `NEXT_PUBLIC_APP_URL` to your production URL
- Google OAuth authorized redirect URIs

## License

MIT
