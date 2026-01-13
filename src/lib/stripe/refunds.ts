import { getStripeClient } from './client';

export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

/**
 * Check if a booking is eligible for a refund based on time window
 */
export function isEligibleForRefund(
  bookingStartTime: Date,
  refundWindowHours: number
): boolean {
  const now = new Date();
  const hoursUntilBooking = (bookingStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilBooking >= refundWindowHours;
}

/**
 * Process a refund for a payment
 */
export async function processRefund(
  paymentIntentId: string,
  amountCents?: number // Optional: partial refund amount. If not provided, full refund.
): Promise<RefundResult> {
  const stripe = getStripeClient();

  if (!stripe) {
    return {
      success: false,
      error: 'Stripe is not configured',
    };
  }

  try {
    const refundParams: {
      payment_intent: string;
      amount?: number;
    } = {
      payment_intent: paymentIntentId,
    };

    // Only add amount for partial refunds
    if (amountCents !== undefined) {
      refundParams.amount = amountCents;
    }

    const refund = await stripe.refunds.create(refundParams);

    return {
      success: true,
      refundId: refund.id,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Get refund status
 */
export async function getRefundStatus(
  refundId: string
): Promise<'pending' | 'succeeded' | 'failed' | 'canceled' | null> {
  const stripe = getStripeClient();

  if (!stripe) {
    return null;
  }

  try {
    const refund = await stripe.refunds.retrieve(refundId);
    return refund.status as 'pending' | 'succeeded' | 'failed' | 'canceled';
  } catch {
    return null;
  }
}
