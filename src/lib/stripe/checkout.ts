import Stripe from 'stripe';
import { getStripeClient } from './client';

export interface CreateCheckoutParams {
  eventTypeId: string;
  eventTitle: string;
  priceCents: number;
  hostName: string;
  guestEmail: string;
  guestName: string;
  guestTimezone: string;
  bookingStartTime: string; // ISO string
  bookingNotes?: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResult {
  sessionId: string;
  url: string;
}

/**
 * Create a Stripe Checkout session for a paid booking.
 * Uses inline price_data so no Stripe product/price setup is required.
 */
export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<CheckoutResult> {
  const stripe = getStripeClient();

  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const {
    eventTypeId,
    eventTitle,
    priceCents,
    hostName,
    guestEmail,
    guestName,
    guestTimezone,
    bookingStartTime,
    bookingNotes,
    successUrl,
    cancelUrl,
  } = params;

  // Create checkout session with inline price (no product setup needed)
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: guestEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: priceCents,
          product_data: {
            name: eventTitle,
            description: `Meeting with ${hostName}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      event_type_id: eventTypeId,
      guest_email: guestEmail,
      guest_name: guestName,
      guest_timezone: guestTimezone,
      booking_start_time: bookingStartTime,
      booking_notes: bookingNotes || '',
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    // Expire after 30 minutes to prevent stale bookings
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
  });

  if (!session.url) {
    throw new Error('Failed to create checkout session URL');
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Retrieve a checkout session by ID
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session | null> {
  const stripe = getStripeClient();

  if (!stripe) {
    return null;
  }

  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return null;
  }
}
