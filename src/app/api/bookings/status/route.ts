import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

interface PaymentWithBooking {
  id: string;
  status: string;
  booking_id: string | null;
  bookings: {
    id: string;
    uid: string;
    title: string;
    start_time: string;
    end_time: string;
    location_value: string | null;
    event_types: { title: string } | null;
  } | null;
}

/**
 * Check booking status by Stripe checkout session ID
 * Used by the success page to verify a booking was actually created
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing session_id parameter" },
      { status: 400 }
    );
  }

  const supabase = await createServiceClient();

  // Find the payment record for this checkout session
  const { data, error: paymentError } = await supabase
    .from("payments")
    .select(`
      id,
      status,
      booking_id,
      bookings (
        id,
        uid,
        title,
        start_time,
        end_time,
        location_value,
        event_types (title)
      )
    `)
    .eq("stripe_checkout_session_id", sessionId)
    .single();

  const payment = data as PaymentWithBooking | null;

  if (paymentError || !payment) {
    return NextResponse.json({
      status: "not_found",
      message: "Payment record not found",
    });
  }

  // Check if booking was created
  if (payment.status === "completed" && payment.booking_id) {
    const booking = payment.bookings;

    return NextResponse.json({
      status: "confirmed",
      booking: booking ? {
        uid: booking.uid,
        title: booking.title,
        startTime: booking.start_time,
        endTime: booking.end_time,
        location: booking.location_value,
        eventType: booking.event_types?.title,
      } : null,
    });
  }

  // Payment exists but booking not yet created (webhook pending)
  if (payment.status === "pending") {
    return NextResponse.json({
      status: "pending",
      message: "Payment received, booking being created...",
    });
  }

  // Payment failed
  if (payment.status === "failed") {
    return NextResponse.json({
      status: "failed",
      message: "Payment failed or expired",
    });
  }

  return NextResponse.json({
    status: "unknown",
    message: "Unknown payment status",
  });
}
