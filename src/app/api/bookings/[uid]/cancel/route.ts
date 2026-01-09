import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getGoogleCalendarService } from "@/lib/google/calendar";
import { sendBookingCancellation } from "@/lib/email/notifications";
import { isEligibleForRefund, processRefund } from "@/lib/stripe";

interface RouteParams {
  params: Promise<{ uid: string }>;
}

interface BookingWithRelations {
  id: string;
  uid: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  payment_id: string | null;
  event_types: { title: string; refund_window_hours: number } | null;
  attendees: Array<{ name: string; email: string; timezone: string }>;
  users: { name: string | null; email: string };
  booking_references: Array<{ credential_id: string; external_id: string; type: string }>;
}

interface PaymentRecord {
  id: string;
  stripe_payment_intent_id: string | null;
  amount_cents: number;
  status: string;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { uid } = await params;
    const body = await request.json();
    const { reason } = body;

    const supabase = await createServiceClient();

    // Get booking with related data
    const { data, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        event_types (title, refund_window_hours),
        attendees (name, email, timezone),
        users!bookings_user_id_fkey (name, email),
        booking_references (credential_id, external_id, type)
      `)
      .eq("uid", uid)
      .single();

    const booking = data as BookingWithRelations | null;

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Booking is already cancelled" },
        { status: 400 }
      );
    }

    // Handle refund if there's a payment
    let refundProcessed = false;
    let refundId: string | undefined;

    if (booking.payment_id) {
      const { data: paymentData } = await supabase
        .from("payments")
        .select("id, stripe_payment_intent_id, amount_cents, status")
        .eq("id", booking.payment_id)
        .single();

      const payment = paymentData as PaymentRecord | null;

      if (payment && payment.status === "completed" && payment.stripe_payment_intent_id) {
        const refundWindowHours = booking.event_types?.refund_window_hours || 24;
        const bookingStartTime = new Date(booking.start_time);

        if (isEligibleForRefund(bookingStartTime, refundWindowHours)) {
          // Process refund
          const refundResult = await processRefund(payment.stripe_payment_intent_id);

          if (refundResult.success) {
            refundProcessed = true;
            refundId = refundResult.refundId;

            // Update payment record
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from("payments")
              .update({
                status: "refunded",
                refund_id: refundId,
                refund_amount_cents: payment.amount_cents,
              })
              .eq("id", payment.id);
          } else {
            console.error("Failed to process refund:", refundResult.error);
          }
        }
      }
    }

    // Update booking status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("bookings")
      .update({
        status: "CANCELLED",
        cancellation_reason: reason || null,
      })
      .eq("id", booking.id);

    if (updateError) {
      throw updateError;
    }

    // Delete Google Calendar event
    const bookingRef = booking.booking_references?.[0];
    if (bookingRef && bookingRef.type === "google_calendar") {
      try {
        const calendarService = await getGoogleCalendarService(booking.user_id);
        if (calendarService) {
          const { data: destCalendar } = await supabase
            .from("destination_calendars")
            .select("external_id")
            .eq("user_id", booking.user_id)
            .single();

          const calendarId = (destCalendar as { external_id: string } | null)?.external_id || "primary";
          await calendarService.deleteEvent(calendarId, bookingRef.external_id);
        }
      } catch (error) {
        console.error("Failed to delete calendar event:", error);
        // Continue without deleting calendar event
      }
    }

    // Send cancellation email
    const attendee = booking.attendees?.[0];
    const user = booking.users;

    if (attendee) {
      try {
        await sendBookingCancellation({
          to: attendee.email,
          guestName: attendee.name,
          hostName: user?.name || user?.email || "Host",
          eventTitle: booking.event_types?.title || booking.title,
          startTime: new Date(booking.start_time),
          endTime: new Date(booking.end_time),
          timezone: attendee.timezone,
          bookingUid: booking.uid,
        });
      } catch (error) {
        console.error("Failed to send cancellation email:", error);
      }
    }

    return NextResponse.json({
      success: true,
      refundProcessed,
      refundId,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
