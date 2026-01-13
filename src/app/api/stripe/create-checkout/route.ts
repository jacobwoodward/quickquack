import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import type { EventType, User } from "@/lib/types/database";

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      eventTypeId,
      date,
      time,
      timezone,
      name,
      email,
      notes,
      promoCode,
    } = body;

    if (!eventTypeId || !date || !time || !name || !email || !timezone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Get event type with payment info
    const { data: eventTypeData, error: eventTypeError } = await supabase
      .from("event_types")
      .select("*")
      .eq("id", eventTypeId)
      .single();

    const eventType = eventTypeData as (EventType & {
      is_paid?: boolean;
      price_cents?: number;
      promo_code?: string;
    }) | null;

    if (eventTypeError || !eventType) {
      return NextResponse.json(
        { error: "Event type not found" },
        { status: 404 }
      );
    }

    // Check if this is a paid event type
    if (!eventType.is_paid || !eventType.price_cents) {
      return NextResponse.json(
        { error: "This event type is not paid" },
        { status: 400 }
      );
    }

    // Check promo code - if valid, redirect to free booking flow
    if (promoCode && eventType.promo_code) {
      if (promoCode.trim().toLowerCase() === eventType.promo_code.trim().toLowerCase()) {
        return NextResponse.json({
          freeBooking: true,
          message: "Valid promo code - proceed with free booking",
        });
      }
    }

    // Get user/host info
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", eventType.user_id)
      .single();

    const user = userData as User | null;

    if (!user) {
      return NextResponse.json({ error: "Host not found" }, { status: 404 });
    }

    // Construct the booking start time ISO string
    // This will be stored in checkout session metadata for later use
    const bookingStartTime = `${date}T${time}`;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create checkout session
    const { sessionId, url } = await createCheckoutSession({
      eventTypeId,
      eventTitle: eventType.title,
      priceCents: eventType.price_cents,
      hostName: user.name || user.email,
      guestEmail: email,
      guestName: name,
      guestTimezone: timezone,
      bookingStartTime,
      bookingNotes: notes,
      successUrl: `${appUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/book/${eventType.slug}?cancelled=true`,
    });

    // Create pending payment record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("payments").insert({
      stripe_checkout_session_id: sessionId,
      amount_cents: eventType.price_cents,
      status: "pending",
      event_type_id: eventTypeId,
      guest_email: email,
      guest_name: name,
      guest_timezone: timezone,
      booking_start_time: bookingStartTime,
      booking_notes: notes || null,
    });

    return NextResponse.json({
      checkoutUrl: url,
      sessionId,
    });
  } catch (error) {
    console.error("Create checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
