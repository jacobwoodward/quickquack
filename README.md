# QuickQuack

A free, open-source scheduling app you can host yourself. Let people book time on your calendar without the monthly fees.

## What is QuickQuack?

QuickQuack is a self-hosted alternative to Calendly and Cal.com. It connects to your Google Calendar to:

- **Show your availability** - Automatically detect busy times from your calendar
- **Let people book meetings** - Share a link and let guests pick a time that works
- **Create calendar events** - Automatically add meetings to your calendar with Google Meet links
- **Send notifications** - Email confirmations, reminders, and updates

### Why Self-Host?

- **Free forever** - No subscription fees, no per-booking limits
- **Own your data** - Your calendar data stays in your own database
- **Customize everything** - Change colors, wording, or even the code
- **Privacy-focused** - No tracking, no selling your data

## Quick Start

You'll need accounts on these free services:
- [Supabase](https://supabase.com) - Database & authentication (free tier)
- [Google Cloud](https://console.cloud.google.com) - Calendar integration (free)
- [Vercel](https://vercel.com) - Hosting (free tier)

### Video Tutorial

[Coming Soon] - A step-by-step video walkthrough of the setup process.

---

## Setup Guide

### Step 1: Fork and Clone

1. Click the **Fork** button at the top of this repository
2. Clone your forked repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/quickquack.git
   cd quickquack
   npm install
   ```
3. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

### Step 2: Set Up Supabase (Database)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project** and fill in the details
3. Wait for your project to be created (takes about 2 minutes)

**Run the database migrations:**

4. In your Supabase dashboard, click **SQL Editor** in the sidebar
5. Open the file `supabase/migrations/00001_initial_schema.sql` from this repository
6. Copy the entire contents and paste into the SQL Editor
7. Click **Run** to execute
8. Repeat for:
   - `00002_add_payments.sql`
   - `00003_email_templates.sql`

**Get your API keys:**

9. Click **Settings** (gear icon) → **API**
10. Copy these values (you'll need them later):
    - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
    - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 3: Set Up Google OAuth (Sign In & Calendar)

**Create a Google Cloud Project:**

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. Name it "QuickQuack" and click **Create**

**Enable the Calendar API:**

4. Make sure your new project is selected
5. Go to **APIs & Services** → **Library**
6. Search for "Google Calendar API" and click it
7. Click **Enable**

**Create OAuth Credentials:**

8. Go to **APIs & Services** → **Credentials**
9. Click **+ Create Credentials** → **OAuth client ID**
10. If prompted to configure consent screen:
    - Choose **External** and click **Create**
    - Fill in App name: "QuickQuack"
    - Add your email as support email and developer contact
    - Click **Save and Continue** through the remaining screens
11. Back in Credentials, click **+ Create Credentials** → **OAuth client ID**
12. Choose **Web application**
13. Name: "QuickQuack Web"
14. Under **Authorized redirect URIs**, click **+ Add URI** and enter:
    ```
    https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
    ```
    (Replace YOUR_SUPABASE_PROJECT with your actual Supabase project ID from the URL)
15. Click **Create**
16. Copy the **Client ID** and **Client Secret** (you'll need these next)

**Enable Google in Supabase:**

17. Back in Supabase, go to **Authentication** → **Providers**
18. Find **Google** and toggle it on
19. Paste your **Client ID** and **Client Secret**
20. Click **Save**

### Step 4: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New** → **Project**
3. Find your forked quickquack repository and click **Import**
4. Before deploying, expand **Environment Variables** and add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth Client Secret |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (e.g., `https://quickquack.vercel.app`) |

5. Click **Deploy**

**After deployment:**

6. Copy your deployment URL (e.g., `https://quickquack-abc123.vercel.app`)
7. Go back to Google Cloud Console → **Credentials** → Your OAuth client
8. Add another redirect URI:
   ```
   https://YOUR_VERCEL_URL.vercel.app/auth/callback
   ```
9. Update `NEXT_PUBLIC_APP_URL` in Vercel to match your URL

### Step 5: First Login

1. Visit your deployed app
2. Click **Sign in with Google**
3. Authorize access to your calendar
4. You're in! Start creating event types.

---

## Optional Features

### Email Notifications (Resend)

Send booking confirmations and reminders via email:

1. Create a free account at [resend.com](https://resend.com)
2. Go to **API Keys** and create a new key
3. Add to Vercel environment variables:
   - `RESEND_API_KEY` - Your Resend API key
   - `EMAIL_FROM` - e.g., `QuickQuack <bookings@yourdomain.com>`

For sending from your own domain, you'll need to verify it in Resend.

### Paid Bookings (Stripe)

Accept payments for consultations:

1. Create a [Stripe](https://stripe.com) account
2. Get your secret key from **Developers** → **API keys**
3. Create a webhook endpoint pointing to `https://your-app.com/api/stripe/webhook`
4. Add to Vercel:
   - `STRIPE_SECRET_KEY` - Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` - Your webhook signing secret

### Automated Reminders (Vercel Cron)

Send reminder emails before meetings:

1. The cron job is already configured in `vercel.json`
2. Add a security secret:
   - Generate one: `openssl rand -base64 32`
   - Add `CRON_SECRET` to your Vercel environment variables

---

## Troubleshooting

### "Google OAuth is not configured"
- Make sure you've enabled the Google provider in Supabase
- Check that your Client ID and Secret are correct
- Verify your redirect URIs include your Supabase callback URL

### "Authentication failed"
- Make sure the Calendar API is enabled in Google Cloud Console
- Check that you've approved the consent screen

### Calendar events not being created
- Re-authenticate: Log out and log back in to refresh your Google tokens
- Check that you've selected calendars in Settings

### Visit `/setup`
Your app has a built-in configuration checker. Visit `/setup` to see which services are configured correctly.

---

## Custom Domain

1. In Vercel, go to your project → **Settings** → **Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to your new domain
5. Add the new callback URL to Google OAuth credentials:
   ```
   https://your-domain.com/auth/callback
   ```

---

## Updating

To get the latest features:

1. Sync your fork with the original repository
2. Vercel will automatically redeploy

---

## Support

- **Issues**: [GitHub Issues](https://github.com/jacobwoodward/jacobwoodward-dev/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jacobwoodward/jacobwoodward-dev/discussions)

---

## License

MIT License - Use it however you want, just don't blame us if something breaks.
