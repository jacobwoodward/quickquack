"use client";

import { format } from "date-fns";
import { Calendar, Download } from "lucide-react";

interface CalendarLinksProps {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
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
 * Generate an ICS calendar file content
 */
function generateICSContent(params: CalendarLinksProps): string {
  const { title, description, startTime, endTime, location, uid } = params;

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

  lines.push("STATUS:CONFIRMED");
  lines.push("SEQUENCE:0");
  lines.push("END:VEVENT");
  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}

/**
 * Generate a Google Calendar add event URL
 */
function getGoogleCalendarUrl(params: CalendarLinksProps): string {
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
function getOutlookUrl(params: CalendarLinksProps): string {
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
function getYahooCalendarUrl(params: CalendarLinksProps): string {
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

export function CalendarLinks({
  title,
  description,
  startTime,
  endTime,
  location,
  uid,
}: CalendarLinksProps) {
  const googleUrl = getGoogleCalendarUrl({
    title,
    description,
    startTime,
    endTime,
    location,
    uid,
  });
  const outlookUrl = getOutlookUrl({
    title,
    description,
    startTime,
    endTime,
    location,
    uid,
  });
  const yahooUrl = getYahooCalendarUrl({
    title,
    description,
    startTime,
    endTime,
    location,
    uid,
  });

  const handleDownloadICS = () => {
    const icsContent = generateICSContent({
      title,
      description,
      startTime,
      endTime,
      location,
      uid,
    });

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "invite.ics";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">Add to calendar</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Google Calendar
        </a>
        <a
          href={outlookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Outlook
        </a>
        <a
          href={yahooUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Yahoo
        </a>
        <button
          onClick={handleDownloadICS}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download .ics
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        The .ics file works with Apple Calendar, Outlook desktop, and other calendar apps.
      </p>
    </div>
  );
}
