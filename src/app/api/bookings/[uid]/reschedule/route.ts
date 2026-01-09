import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getGoogleCalendarService } from "@/lib/google/calendar";
import { sendBookingRescheduled } from "@/lib/email/notifications";
import { parseISO, setHours, setMinutes, addMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

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
  location_value: string | null;
  rescheduled_from_uid: string | null;
  event_types: { title: string; length: number } | null;
  attendees: Array<{ name: string; email: string; timezone: string }>;
  users: { name: string | null; email: string };
  booking_references: Array<{ id: string; credential_id: string; external_id: string; type: string; meeting_url: string | null }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { uid } = await params;
    const body = await request.json();
    const { date, time, timezone } = body;

    if (!date || !time || !timezone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Get booking with related data
    const { data, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        event_types (title, length),
        attendees (name, email, timezone),
        users!bookings_user_id_fkey (name, email),
        booking_references (id, credential_id, external_id, type, meeting_url)
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
        { error: "Cannot reschedule a cancelled booking" },
        { status: 400 }
      );
    }

    // Parse the new booking time
    const [hours, minutes] = time.split(":").map(Number);
    let newStartTime = parseISO(date);
    newStartTime = setHours(newStartTime, hours);
    newStartTime = setMinutes(newStartTime, minutes);

    // Convert from guest timezone to UTC
    const newStartTimeUtc = fromZonedTime(newStartTime, timezone);
    const eventLength = booking.event_types?.length || 30;
    const newEndTimeUtc = addMinutes(newStartTimeUtc, eventLength);

    const originalStartTime = new Date(booking.start_time);
    const originalEndTime = new Date(booking.end_time);

    // Update the booking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("bookings")
      .update({
        start_time: newStartTimeUtc.toISOString(),
        end_time: newEndTimeUtc.toISOString(),
        rescheduled_from_uid: booking.rescheduled_from_uid || booking.uid,
      })
      .eq("id", booking.id);

    if (updateError) {
      throw updateError;
    }

    // Update Google Calendar event
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

          await calendarService.updateEvent({
            calendarId,
            eventId: bookingRef.external_id,
            startTime: newStartTimeUtc,
            endTime: newEndTimeUtc,
          });
        }
      } catch (error) {
        console.error("Failed to update calendar event:", error);
        // Continue without updating calendar event
      }
    }

    // Send rescheduled email
    const attendee = booking.attendees?.[0];
    const user = booking.users;

    if (attendee) {
      try {
        await sendBookingRescheduled({
          to: attendee.email,
          guestName: attendee.name,
          hostName: user?.name || user?.email || "Host",
          eventTitle: booking.event_types?.title || booking.title,
          startTime: originalStartTime,
          endTime: originalEndTime,
          newStartTime: newStartTimeUtc,
          newEndTime: newEndTimeUtc,
          timezone: attendee.timezone,
          location: bookingRef?.meeting_url || booking.location_value || undefined,
          bookingUid: booking.uid,
        });
      } catch (error) {
        console.error("Failed to send rescheduled email:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reschedule booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
