import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getGoogleCalendarService } from "@/lib/google/calendar";
import { parseISO, setHours, setMinutes, addMinutes } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { sendBookingConfirmation, sendHostNotification } from "@/lib/email/notifications";
import { parseTimeString } from "@/lib/utils/date";
import type { EventType, User, Booking } from "@/lib/types/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventTypeId, date, time, timezone, name, email, notes } = body;

    if (!eventTypeId || !date || !time || !name || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();

    // Get event type
    const { data: eventTypeData, error: eventTypeError } = await supabase
      .from("event_types")
      .select("*")
      .eq("id", eventTypeId)
      .single();

    const eventType = eventTypeData as EventType | null;

    if (eventTypeError || !eventType) {
      return NextResponse.json(
        { error: "Event type not found" },
        { status: 404 }
      );
    }

    // Get user
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", eventType.user_id)
      .single();

    const user = userData as User | null;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse the booking time (supports both 12h and 24h formats)
    const { hours, minutes } = parseTimeString(time);
    let startTime = parseISO(date);
    startTime = setHours(startTime, hours);
    startTime = setMinutes(startTime, minutes);

    // Convert from guest timezone to UTC
    const startTimeUtc = fromZonedTime(startTime, timezone);
    const endTimeUtc = addMinutes(startTimeUtc, eventType.length);

    // Create the booking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bookingData, error: bookingError } = await (supabase as any)
      .from("bookings")
      .insert({
        user_id: eventType.user_id,
        event_type_id: eventTypeId,
        title: `${eventType.title} with ${name}`,
        description: notes || null,
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
      console.error("Booking error:", bookingError);
      return NextResponse.json(
        { error: "Failed to create booking" },
        { status: 500 }
      );
    }

    // Create attendee record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("attendees").insert({
      booking_id: booking.id,
      email,
      name,
      timezone,
    });

    // Create Google Calendar event if using Google Meet
    let meetingUrl: string | undefined;

    try {
      const calendarService = await getGoogleCalendarService(eventType.user_id);

      if (calendarService) {
        // Get destination calendar
        const { data: destCalendar } = await supabase
          .from("destination_calendars")
          .select("external_id")
          .eq("user_id", eventType.user_id)
          .single();

        const calendarId = (destCalendar as { external_id: string } | null)?.external_id || "primary";

        const result = await calendarService.createEvent({
          calendarId,
          summary: booking.title,
          description: notes || "",
          startTime: startTimeUtc,
          endTime: endTimeUtc,
          attendees: [
            { email: user.email, name: user.name || undefined },
            { email, name },
          ],
          createMeet: eventType.location_type === "google_meet",
        });

        meetingUrl = result.meetingUrl;

        // Store booking reference
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

          // Update booking with meeting URL
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
      // Continue without calendar event
    }

    // Send confirmation email to guest
    try {
      console.log("Sending confirmation email to guest:", email);
      await sendBookingConfirmation({
        to: email,
        guestName: name,
        hostName: user.name || user.email,
        hostEmail: user.email,
        eventTitle: eventType.title,
        startTime: startTimeUtc,
        endTime: endTimeUtc,
        timezone,
        location: meetingUrl || eventType.location_value || undefined,
        bookingUid: booking.uid,
        description: notes || undefined,
      });
      console.log("Confirmation email sent successfully to:", email);
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
      // Continue without email
    }

    // Send notification email to host
    try {
      console.log("Sending notification email to host:", user.email);
      await sendHostNotification({
        to: user.email,
        hostName: user.name || user.email,
        guestName: name,
        guestEmail: email,
        eventTitle: eventType.title,
        startTime: startTimeUtc,
        endTime: endTimeUtc,
        timezone,
        location: meetingUrl || eventType.location_value || undefined,
        notes: notes || undefined,
      });
      console.log("Host notification email sent successfully to:", user.email);
    } catch (error) {
      console.error("Failed to send host notification:", error);
      // Continue without email
    }

    return NextResponse.json({
      uid: booking.uid,
      meetingUrl,
    });
  } catch (error) {
    console.error("Booking API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
