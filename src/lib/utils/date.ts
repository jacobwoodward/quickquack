import { parse } from "date-fns";

/**
 * Parse time string in either 12h (h:mm a) or 24h (HH:mm) format
 */
export function parseTimeString(time: string): { hours: number; minutes: number } {
  // Check if it's 12-hour format (contains AM/PM)
  const is12Hour = /am|pm/i.test(time);

  if (is12Hour) {
    // Parse 12-hour format like "1:30 PM" or "12:00 AM"
    const parsed = parse(time, "h:mm a", new Date());
    return { hours: parsed.getHours(), minutes: parsed.getMinutes() };
  } else {
    // Parse 24-hour format like "13:30"
    const [hours, minutes] = time.split(":").map(Number);
    return { hours, minutes };
  }
}
