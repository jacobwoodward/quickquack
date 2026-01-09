import { format } from "date-fns";

interface ICSEventParams {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  organizer?: {
    name: string;
    email: string;
  };
  attendee?: {
    name: string;
    email: string;
  };
  uid: string;
}

/**
 * Format a date to ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss'Z'");
}

/**
 * Escape special characters for ICS format
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Fold long lines according to ICS spec (max 75 chars per line)
 */
function foldLine(line: string): string {
  const maxLength = 75;
  if (line.length <= maxLength) {
    return line;
  }

  const result: string[] = [];
  let remaining = line;

  while (remaining.length > maxLength) {
    result.push(remaining.substring(0, maxLength));
    remaining = " " + remaining.substring(maxLength);
  }
  result.push(remaining);

  return result.join("\r\n");
}

/**
 * Generate an ICS calendar file content for a booking
 */
export function generateICS(params: ICSEventParams): string {
  const {
    title,
    description,
    startTime,
    endTime,
    location,
    organizer,
    attendee,
    uid,
  } = params;

  const now = new Date();
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Booking System//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(startTime)}`,
    `DTEND:${formatICSDate(endTime)}`,
    `SUMMARY:${escapeICS(title)}`,
  ];

  if (description) {
    lines.push(`DESCRIPTION:${escapeICS(description)}`);
  }

  if (location) {
    lines.push(`LOCATION:${escapeICS(location)}`);
  }

  if (organizer) {
    lines.push(`ORGANIZER;CN=${escapeICS(organizer.name)}:mailto:${organizer.email}`);
  }

  if (attendee) {
    lines.push(
      `ATTENDEE;PARTSTAT=ACCEPTED;CN=${escapeICS(attendee.name)}:mailto:${attendee.email}`
    );
  }

  lines.push("STATUS:CONFIRMED");
  lines.push("SEQUENCE:0");
  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  // Fold long lines and join with CRLF
  return lines.map(foldLine).join("\r\n");
}

/**
 * Generate a Google Calendar add event URL
 */
export function generateGoogleCalendarUrl(params: ICSEventParams): string {
  const { title, description, startTime, endTime, location } = params;

  const formatGoogleDate = (date: Date) => format(date, "yyyyMMdd'T'HHmmss'Z'");

  const baseUrl = "https://calendar.google.com/calendar/render";
  const searchParams = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatGoogleDate(startTime)}/${formatGoogleDate(endTime)}`,
  });

  if (description) {
    searchParams.set("details", description);
  }

  if (location) {
    searchParams.set("location", location);
  }

  return `${baseUrl}?${searchParams.toString()}`;
}

/**
 * Generate an Outlook.com add event URL
 */
export function generateOutlookUrl(params: ICSEventParams): string {
  const { title, description, startTime, endTime, location } = params;

  const baseUrl = "https://outlook.live.com/calendar/0/action/compose";
  const searchParams = new URLSearchParams({
    rru: "addevent",
    subject: title,
    startdt: startTime.toISOString(),
    enddt: endTime.toISOString(),
  });

  if (description) {
    searchParams.set("body", description);
  }

  if (location) {
    searchParams.set("location", location);
  }

  return `${baseUrl}?${searchParams.toString()}`;
}

/**
 * Generate a Yahoo Calendar add event URL
 */
export function generateYahooCalendarUrl(params: ICSEventParams): string {
  const { title, description, startTime, endTime, location } = params;

  const formatYahooDate = (date: Date) => format(date, "yyyyMMdd'T'HHmmss'Z'");

  // Calculate duration in HHMM format
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const duration = `${String(durationHours).padStart(2, "0")}${String(durationMinutes).padStart(2, "0")}`;

  const baseUrl = "https://calendar.yahoo.com/";
  const searchParams = new URLSearchParams({
    v: "60",
    title: title,
    st: formatYahooDate(startTime),
    dur: duration,
  });

  if (description) {
    searchParams.set("desc", description);
  }

  if (location) {
    searchParams.set("in_loc", location);
  }

  return `${baseUrl}?${searchParams.toString()}`;
}

/**
 * Generate all calendar URLs for a booking
 */
export function generateCalendarLinks(params: ICSEventParams): {
  google: string;
  outlook: string;
  yahoo: string;
  icsContent: string;
} {
  return {
    google: generateGoogleCalendarUrl(params),
    outlook: generateOutlookUrl(params),
    yahoo: generateYahooCalendarUrl(params),
    icsContent: generateICS(params),
  };
}
