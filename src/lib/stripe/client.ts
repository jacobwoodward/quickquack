import Stripe from 'stripe';

// Initialize Stripe client (server-side only)
// Returns null if Stripe is not configured
export function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey || !secretKey.startsWith('sk_')) {
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  });
}

// Check if Stripe is configured
export function isStripeConfigured(): boolean {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  return !!secretKey && secretKey.startsWith('sk_');
}

// Get webhook secret
export function getWebhookSecret(): string | null {
  return process.env.STRIPE_WEBHOOK_SECRET || null;
}
