import {
  addMinutes,
  startOfDay,
  endOfDay,
  setHours,
  setMinutes,
  isAfter,
  isBefore,
  areIntervalsOverlapping,
  format,
  addDays,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import type { Availability, EventType, Booking, TimeFormat } from "@/lib/types/database";

interface TimeSlot {
  start: Date;
  end: Date;
}

interface GetAvailableSlotsParams {
  date: Date;
  eventType: EventType;
  availability: Availability[];
  existingBookings: Booking[];
  busyTimes: Array<{ start: Date; end: Date }>;
  timezone: string;
  userTimezone: string;
  timeFormat?: TimeFormat;
}

/**
 * Parse time string (HH:MM) to hours and minutes
 */
function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(":").map(Number);
  return { hours, minutes };
}

/**
 * Convert availability slots to actual date-time ranges for a specific date
 */
function getAvailabilityForDate(
  date: Date,
  availability: Availability[],
  userTimezone: string
): TimeSlot[] {
  const dayOfWeek = date.getDay();

  // Get availability for this day of week
  const dayAvailability = availability.filter(
    (a) => a.day_of_week === dayOfWeek
  );

  if (dayAvailability.length === 0) {
    return [];
  }

  const slots: TimeSlot[] = [];

  for (const avail of dayAvailability) {
    const startTime = parseTime(avail.start_time);
    const endTime = parseTime(avail.end_time);

    // Create date in user's timezone
    let start = startOfDay(date);
    start = setHours(start, startTime.hours);
    start = setMinutes(start, startTime.minutes);

    let end = startOfDay(date);
    end = setHours(end, endTime.hours);
    end = setMinutes(end, endTime.minutes);

    // Convert from user timezone to UTC
    const startUtc = fromZonedTime(start, userTimezone);
    const endUtc = fromZonedTime(end, userTimezone);

    slots.push({ start: startUtc, end: endUtc });
  }

  return slots;
}

/**
 * Check if a slot overlaps with any busy times
 */
function isSlotAvailable(
  slot: TimeSlot,
  busyTimes: Array<{ start: Date; end: Date }>,
  existingBookings: Booking[],
  bufferBefore: number,
  bufferAfter: number
): boolean {
  // Add buffers to the slot
  const slotWithBuffer = {
    start: addMinutes(slot.start, -bufferBefore),
    end: addMinutes(slot.end, bufferAfter),
  };

  // Check against busy times from calendar
  for (const busy of busyTimes) {
    if (
      areIntervalsOverlapping(
        { start: slotWithBuffer.start, end: slotWithBuffer.end },
        { start: busy.start, end: busy.end }
      )
    ) {
      return false;
    }
  }

  // Check against existing bookings
  for (const booking of existingBookings) {
    if (booking.status === "CANCELLED") continue;

    const bookingStart = new Date(booking.start_time);
    const bookingEnd = new Date(booking.end_time);

    if (
      areIntervalsOverlapping(
        { start: slotWithBuffer.start, end: slotWithBuffer.end },
        { start: bookingStart, end: bookingEnd }
      )
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Generate available time slots for a specific date
 */
export function getAvailableSlots(params: GetAvailableSlotsParams): string[] {
  const {
    date,
    eventType,
    availability,
    existingBookings,
    busyTimes,
    timezone,
    userTimezone,
    timeFormat = "12h",
  } = params;

  const now = new Date();
  const minimumNotice = addMinutes(now, eventType.minimum_notice);

  // Get availability windows for this date
  const availabilitySlots = getAvailabilityForDate(
    date,
    availability,
    userTimezone
  );

  if (availabilitySlots.length === 0) {
    return [];
  }

  const availableSlotData: Array<{ time: number; formatted: string }> = [];
  const slotDuration = eventType.length;

  // Generate slots for each availability window
  for (const availWindow of availabilitySlots) {
    let currentSlotStart = availWindow.start;

    while (
      addMinutes(currentSlotStart, slotDuration) <= availWindow.end
    ) {
      const slotEnd = addMinutes(currentSlotStart, slotDuration);

      // Check minimum notice
      if (isAfter(currentSlotStart, minimumNotice)) {
        // Check if slot is available
        if (
          isSlotAvailable(
            { start: currentSlotStart, end: slotEnd },
            busyTimes,
            existingBookings,
            eventType.buffer_time_before,
            eventType.buffer_time_after
          )
        ) {
          // Convert to guest timezone for display
          const slotInGuestTz = toZonedTime(currentSlotStart, timezone);
          const formatString = timeFormat === "12h" ? "h:mm a" : "HH:mm";
          availableSlotData.push({
            time: currentSlotStart.getTime(),
            formatted: format(slotInGuestTz, formatString),
          });
        }
      }

      // Move to next slot (typically 15-minute increments)
      currentSlotStart = addMinutes(currentSlotStart, 15);
    }
  }

  // Sort by timestamp and deduplicate by formatted time
  availableSlotData.sort((a, b) => a.time - b.time);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const slot of availableSlotData) {
    if (!seen.has(slot.formatted)) {
      seen.add(slot.formatted);
      result.push(slot.formatted);
    }
  }
  return result;
}

/**
 * Get dates with availability for a date range
 */
export function getAvailableDates(params: {
  startDate: Date;
  endDate: Date;
  availability: Availability[];
  userTimezone: string;
}): Date[] {
  const { startDate, endDate, availability, userTimezone: _userTimezone } = params;
  const availableDates: Date[] = [];

  let currentDate = startDate;
  while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
    const dayOfWeek = currentDate.getDay();
    const hasAvailability = availability.some(
      (a) => a.day_of_week === dayOfWeek
    );

    if (hasAvailability) {
      availableDates.push(new Date(currentDate));
    }

    currentDate = addDays(currentDate, 1);
  }

  return availableDates;
}

/**
 * Check booking limits
 */
export function checkBookingLimits(params: {
  date: Date;
  eventType: EventType;
  existingBookings: Booking[];
}): { allowed: boolean; reason?: string } {
  const { date, eventType, existingBookings } = params;

  const activeBookings = existingBookings.filter(
    (b) => b.status !== "CANCELLED"
  );

  // Check daily limit
  if (eventType.booking_limits_per_day) {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const bookingsToday = activeBookings.filter((b) => {
      const bookingDate = new Date(b.start_time);
      return bookingDate >= dayStart && bookingDate <= dayEnd;
    });

    if (bookingsToday.length >= eventType.booking_limits_per_day) {
      return { allowed: false, reason: "Daily booking limit reached" };
    }
  }

  // Check weekly limit
  if (eventType.booking_limits_per_week) {
    // Get start and end of week (Sunday to Saturday)
    const dayOfWeek = date.getDay();
    const weekStart = addDays(startOfDay(date), -dayOfWeek);
    const weekEnd = addDays(endOfDay(date), 6 - dayOfWeek);

    const bookingsThisWeek = activeBookings.filter((b) => {
      const bookingDate = new Date(b.start_time);
      return bookingDate >= weekStart && bookingDate <= weekEnd;
    });

    if (bookingsThisWeek.length >= eventType.booking_limits_per_week) {
      return { allowed: false, reason: "Weekly booking limit reached" };
    }
  }

  return { allowed: true };
}
