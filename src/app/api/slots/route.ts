import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getGoogleCalendarService } from "@/lib/google/calendar";
import { getAvailableSlots } from "@/lib/availability/slots";
import { parseISO, startOfDay, endOfDay, addDays } from "date-fns";
import type { EventType, Schedule, Availability, Booking, User, TimeFormat } from "@/lib/types/database";

interface ScheduleWithAvailability extends Schedule {
  availability: Availability[];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const eventTypeId = searchParams.get("eventTypeId");
  const dateStr = searchParams.get("date");
  const timezone = searchParams.get("timezone") || "America/New_York";
  const timeFormatParam = searchParams.get("timeFormat") as TimeFormat | null;

  if (!eventTypeId || !dateStr) {
    return NextResponse.json(
      { error: "Missing eventTypeId or date" },
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

  // Get user's time format preference
  const { data: userData } = await supabase
    .from("users")
    .select("time_format")
    .eq("id", eventType.user_id)
    .single();

  const user = userData as Pick<User, "time_format"> | null;
  const timeFormat: TimeFormat = timeFormatParam || user?.time_format || "12h";

  // Get user's schedule with availability
  const { data: scheduleData } = await supabase
    .from("schedules")
    .select(`
      *,
      availability (*)
    `)
    .eq("user_id", eventType.user_id)
    .eq("is_default", true)
    .single();

  const schedule = scheduleData as ScheduleWithAvailability | null;

  if (!schedule || !schedule.availability) {
    return NextResponse.json({ slots: [] });
  }

  // Get existing bookings for this event type on this date
  const date = parseISO(dateStr);
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const { data: existingBookingsData } = await supabase
    .from("bookings")
    .select("*")
    .eq("event_type_id", eventTypeId)
    .gte("start_time", dayStart.toISOString())
    .lte("start_time", dayEnd.toISOString())
    .neq("status", "CANCELLED");

  const existingBookings = (existingBookingsData as Booking[] | null) || [];

  // Get busy times from Google Calendar
  let busyTimes: Array<{ start: Date; end: Date }> = [];

  try {
    const calendarService = await getGoogleCalendarService(eventType.user_id);
    if (calendarService) {
      // Get selected calendars
      const { data: selectedCalendars } = await supabase
        .from("selected_calendars")
        .select("external_id")
        .eq("user_id", eventType.user_id);

      const calendarIds = (selectedCalendars as Array<{ external_id: string }> | null)?.map((c) => c.external_id) || [];

      // If no calendars selected, use primary
      if (calendarIds.length === 0) {
        calendarIds.push("primary");
      }

      busyTimes = await calendarService.getBusyTimes(
        calendarIds,
        dayStart,
        addDays(dayEnd, 1)
      );
    }
  } catch (error) {
    console.error("Failed to get busy times:", error);
    // Continue without busy times
  }

  // Calculate available slots
  const slots = getAvailableSlots({
    date,
    eventType,
    availability: schedule.availability,
    existingBookings,
    busyTimes,
    timezone,
    userTimezone: schedule.timezone,
    timeFormat,
  });

  return NextResponse.json({ slots, timeFormat });
}
