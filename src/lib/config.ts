/**
 * Environment configuration validation and access
 *
 * This module provides type-safe access to environment variables
 * and validates that required configuration is present.
 */

export interface AppConfig {
  // Required - Supabase
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string | null;
  };

  // Required - Google OAuth
  google: {
    clientId: string | null;
    clientSecret: string | null;
  };

  // Required - App URL
  appUrl: string;

  // Required - Email (Resend)
  email: {
    resendApiKey: string | null;
    fromAddress: string;
  };

  // Optional - Stripe
  stripe: {
    secretKey: string | null;
    webhookSecret: string | null;
  };

  // Optional - Cron
  cronSecret: string | null;
}

export interface ConfigStatus {
  service: string;
  configured: boolean;
  required: boolean;
  description: string;
  helpUrl?: string;
  missingVars?: string[];
}

/**
 * Get the current configuration status for all services
 */
export function getConfigStatus(): ConfigStatus[] {
  return [
    {
      service: "Supabase",
      configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      required: true,
      description: "Database and authentication",
      helpUrl: "https://supabase.com/docs/guides/getting-started",
      missingVars: [
        !process.env.NEXT_PUBLIC_SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL",
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        !process.env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
      ].filter(Boolean) as string[],
    },
    {
      service: "Google OAuth",
      configured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      required: true,
      description: "Sign in with Google and Calendar integration",
      helpUrl: "https://console.cloud.google.com/apis/credentials",
      missingVars: [
        !process.env.GOOGLE_CLIENT_ID && "GOOGLE_CLIENT_ID",
        !process.env.GOOGLE_CLIENT_SECRET && "GOOGLE_CLIENT_SECRET",
      ].filter(Boolean) as string[],
    },
    {
      service: "App URL",
      configured: Boolean(process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")),
      required: true,
      description: "Your app's public URL (for email links)",
      missingVars: !process.env.NEXT_PUBLIC_APP_URL
        ? ["NEXT_PUBLIC_APP_URL"]
        : process.env.NEXT_PUBLIC_APP_URL.includes("localhost")
          ? ["NEXT_PUBLIC_APP_URL (currently set to localhost)"]
          : [],
    },
    {
      service: "Resend Email",
      configured: Boolean(process.env.RESEND_API_KEY),
      required: true,
      description: "Email notifications and booking confirmations with calendar invites",
      helpUrl: "https://resend.com/docs/introduction",
      missingVars: [
        !process.env.RESEND_API_KEY && "RESEND_API_KEY",
      ].filter(Boolean) as string[],
    },
    {
      service: "Stripe Payments",
      configured: Boolean(process.env.STRIPE_SECRET_KEY),
      required: false,
      description: "Accept payments for bookings",
      helpUrl: "https://stripe.com/docs/keys",
      missingVars: [
        !process.env.STRIPE_SECRET_KEY && "STRIPE_SECRET_KEY",
        !process.env.STRIPE_WEBHOOK_SECRET && "STRIPE_WEBHOOK_SECRET",
      ].filter(Boolean) as string[],
    },
    {
      service: "Cron Security",
      configured: Boolean(process.env.CRON_SECRET),
      required: false,
      description: "Secure automated reminder emails",
      missingVars: [
        !process.env.CRON_SECRET && "CRON_SECRET",
      ].filter(Boolean) as string[],
    },
  ];
}

/**
 * Check if all required services are configured
 */
export function isFullyConfigured(): boolean {
  const status = getConfigStatus();
  return status.filter(s => s.required).every(s => s.configured);
}

/**
 * Check if Supabase is configured (minimum requirement to run)
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Check if Google OAuth is configured
 */
export function isGoogleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  );
}

/**
 * Check if Stripe is configured
 */
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(key && key.startsWith("sk_"));
}

/**
 * Check if Resend email is configured
 */
export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Get the app URL, with fallback to localhost for development
 */
export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * Get email from address
 */
export function getEmailFromAddress(): string {
  return process.env.EMAIL_FROM || "QuickQuack <noreply@example.com>";
}
