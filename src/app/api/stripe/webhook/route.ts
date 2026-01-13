import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripeClient, getWebhookSecret } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { getGoogleCalendarService } from "@/lib/google/calendar";
import { sendBookingConfirmation, sendHostNotification } from "@/lib/email/notifications";
import { parseISO, setHours, setMinutes, addMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { parseTimeString } from "@/lib/utils/date";
import type { EventType, User, Booking } from "@/lib/types/database";

// Disable body parsing - Stripe needs raw body for signature verification
export const runtime = "nodejs";

/**
 * Create a booking after successful payment
 */
async function createBookingFromPayment(
  session: Stripe.Checkout.Session
): Promise<void> {
  const supabase = await createServiceClient();

  const metadata = session.metadata || {};
  const {
    event_type_id,
    guest_email,
    guest_name,
    guest_timezone,
    booking_start_time,
    booking_notes,
  } = metadata;

  if (!event_type_id || !guest_email || !guest_name || !guest_timezone || !booking_start_time) {
    throw new Error("Missing required metadata in checkout session");
  }

  // Get event type
  const { data: eventTypeData, error: eventTypeError } = await supabase
    .from("event_types")
    .select("*")
    .eq("id", event_type_id)
    .single();

  const eventType = eventTypeData as EventType | null;

  if (eventTypeError || !eventType) {
    throw new Error("Event type not found");
  }

  // Get user
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", eventType.user_id)
    .single();

  const user = userData as User | null;

  if (!user) {
    throw new Error("User not found");
  }

  // Parse booking time from metadata
  // Format: "YYYY-MM-DDThh:mm" or "YYYY-MM-DDTh:mm a"
  const [datePart, timePart] = booking_start_time.split("T");
  const { hours, minutes } = parseTimeString(timePart);

  let startTime = parseISO(datePart);
  startTime = setHours(startTime, hours);
  startTime = setMinutes(startTime, minutes);

  // Convert from guest timezone to UTC
  const startTimeUtc = fromZonedTime(startTime, guest_timezone);
  const endTimeUtc = addMinutes(startTimeUtc, eventType.length);

  // Create the booking
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bookingData, error: bookingError } = await (supabase as any)
    .from("bookings")
    .insert({
      user_id: eventType.user_id,
      event_type_id: event_type_id,
      title: `${eventType.title} with ${guest_name}`,
      description: booking_notes || null,
      start_time: startTimeUtc.toISOString(),
      end_time: endTimeUtc.toISOString(),
      status: "ACCEPTED",
      location_type: eventType.location_type,
      location_value: eventType.location_value,
    })
    .select()
    .single();

  const booking = bookingData as Booking | null;

  if (bookingError || !booking) {
    throw new Error("Failed to create booking");
  }

  // Create attendee record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("attendees").insert({
    booking_id: booking.id,
    email: guest_email,
    name: guest_name,
    timezone: guest_timezone,
  });

  // Update payment record with booking ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("payments")
    .update({
      booking_id: booking.id,
      status: "completed",
      stripe_payment_intent_id: session.payment_intent as string,
    })
    .eq("stripe_checkout_session_id", session.id);

  // Update booking with payment ID
  const { data: paymentData } = await supabase
    .from("payments")
    .select("id")
    .eq("stripe_checkout_session_id", session.id)
    .single();

  if (paymentData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("bookings")
      .update({ payment_id: (paymentData as { id: string }).id })
      .eq("id", booking.id);
  }

  // Create Google Calendar event if using Google Meet
  let meetingUrl: string | undefined;

  try {
    const calendarService = await getGoogleCalendarService(eventType.user_id);

    if (calendarService) {
      const { data: destCalendar } = await supabase
        .from("destination_calendars")
        .select("external_id")
        .eq("user_id", eventType.user_id)
        .single();

      const calendarId =
        (destCalendar as { external_id: string } | null)?.external_id || "primary";

      const result = await calendarService.createEvent({
        calendarId,
        summary: booking.title,
        description: booking_notes || "",
        startTime: startTimeUtc,
        endTime: endTimeUtc,
        attendees: [
          { email: user.email, name: user.name || undefined },
          { email: guest_email, name: guest_name },
        ],
        createMeet: eventType.location_type === "google_meet",
      });

      meetingUrl = result.meetingUrl;

      const { data: credential } = await supabase
        .from("credentials")
        .select("id")
        .eq("user_id", eventType.user_id)
        .eq("type", "google_calendar")
        .single();

      const credentialData = credential as { id: string } | null;
      if (credentialData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("booking_references").insert({
          booking_id: booking.id,
          credential_id: credentialData.id,
          type: "google_calendar",
          external_id: result.eventId,
          meeting_url: meetingUrl,
        });

        if (meetingUrl) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("bookings")
            .update({ location_value: meetingUrl })
            .eq("id", booking.id);
        }
      }
    }
  } catch (error) {
    console.error("Failed to create calendar event:", error);
  }

  // Send confirmation email to guest
  try {
    console.log("Sending confirmation email to guest:", guest_email);
    await sendBookingConfirmation({
      to: guest_email,
      guestName: guest_name,
      hostName: user.name || user.email,
      hostEmail: user.email,
      eventTitle: eventType.title,
      startTime: startTimeUtc,
      endTime: endTimeUtc,
      timezone: guest_timezone,
      location: meetingUrl || eventType.location_value || undefined,
      bookingUid: booking.uid,
      priceCents: session.amount_total || undefined,
      description: booking_notes || undefined,
    });
    console.log("Confirmation email sent successfully to:", guest_email);
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
  }

  // Send notification email to host
  try {
    console.log("Sending notification email to host:", user.email);
    await sendHostNotification({
      to: user.email,
      hostName: user.name || user.email,
      guestName: guest_name,
      guestEmail: guest_email,
      eventTitle: eventType.title,
      startTime: startTimeUtc,
      endTime: endTimeUtc,
      timezone: guest_timezone,
      location: meetingUrl || eventType.location_value || undefined,
      notes: booking_notes || undefined,
      priceCents: session.amount_total || undefined,
    });
    console.log("Host notification email sent successfully to:", user.email);
  } catch (error) {
    console.error("Failed to send host notification:", error);
  }
}

export async function POST(request: NextRequest) {
  const stripe = getStripeClient();
  const webhookSecret = getWebhookSecret();

  if (!stripe || !webhookSecret) {
    console.error("Stripe webhook: Missing configuration");
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 400 }
    );
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status === "paid") {
        try {
          await createBookingFromPayment(session);
          console.log("Booking created from payment:", session.id);
        } catch (error) {
          console.error("Failed to create booking from payment:", error);
          // Return 500 so Stripe retries
          return NextResponse.json(
            { error: "Failed to process payment" },
            { status: 500 }
          );
        }
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const supabase = await createServiceClient();

      // Mark payment as failed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("payments")
        .update({ status: "failed" })
        .eq("stripe_checkout_session_id", session.id);

      console.log("Checkout session expired:", session.id);
      break;
    }

    default:
      // Ignore other events
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
