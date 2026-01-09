import { google, calendar_v3 } from "googleapis";
import { createServiceClient } from "@/lib/supabase/server";
import type { Credential } from "@/lib/types/database";

interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expiry_date: number | null;
}

export class GoogleCalendarService {
  private calendar: calendar_v3.Calendar;
  private credentialId: string;

  constructor(calendar: calendar_v3.Calendar, credentialId: string) {
    this.calendar = calendar;
    this.credentialId = credentialId;
  }

  static async fromCredential(credential: Credential): Promise<GoogleCalendarService> {
    const tokens = credential.key as unknown as GoogleTokens;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
    });

    // Handle token refresh
    oauth2Client.on("tokens", async (newTokens) => {
      const supabase = await createServiceClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("credentials")
        .update({
          key: {
            ...tokens,
            access_token: newTokens.access_token || tokens.access_token,
            expiry_date: newTokens.expiry_date || tokens.expiry_date,
          },
        })
        .eq("id", credential.id);
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    return new GoogleCalendarService(calendar, credential.id);
  }

  /**
   * Get list of calendars for the user
   */
  async getCalendarList(): Promise<calendar_v3.Schema$CalendarListEntry[]> {
    const response = await this.calendar.calendarList.list();
    return response.data.items || [];
  }

  /**
   * Get busy times for specified calendars within a date range
   */
  async getBusyTimes(
    calendarIds: string[],
    timeMin: Date,
    timeMax: Date
  ): Promise<Array<{ start: Date; end: Date }>> {
    if (calendarIds.length === 0) {
      return [];
    }

    const response = await this.calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: calendarIds.map((id) => ({ id })),
      },
    });

    const busyTimes: Array<{ start: Date; end: Date }> = [];

    if (response.data.calendars) {
      Object.values(response.data.calendars).forEach((calendar) => {
        if (calendar.busy) {
          calendar.busy.forEach((busy) => {
            if (busy.start && busy.end) {
              busyTimes.push({
                start: new Date(busy.start),
                end: new Date(busy.end),
              });
            }
          });
        }
      });
    }

    return busyTimes;
  }

  /**
   * Create a calendar event with optional Google Meet
   */
  async createEvent(params: {
    calendarId: string;
    summary: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendees: Array<{ email: string; name?: string }>;
    createMeet?: boolean;
  }): Promise<{
    eventId: string;
    meetingUrl?: string;
    htmlLink?: string;
  }> {
    const eventData: calendar_v3.Schema$Event = {
      summary: params.summary,
      description: params.description,
      start: {
        dateTime: params.startTime.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: params.endTime.toISOString(),
        timeZone: "UTC",
      },
      attendees: params.attendees.map((a) => ({
        email: a.email,
        displayName: a.name,
      })),
    };

    // Add Google Meet if requested
    if (params.createMeet) {
      eventData.conferenceData = {
        createRequest: {
          requestId: `quickquack-${Date.now()}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      };
    }

    const response = await this.calendar.events.insert({
      calendarId: params.calendarId,
      requestBody: eventData,
      conferenceDataVersion: params.createMeet ? 1 : 0,
      sendUpdates: "all",
    });

    const event = response.data;
    const meetingUrl = event.conferenceData?.entryPoints?.find(
      (e) => e.entryPointType === "video"
    )?.uri;

    return {
      eventId: event.id!,
      meetingUrl: meetingUrl || undefined,
      htmlLink: event.htmlLink || undefined,
    };
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(params: {
    calendarId: string;
    eventId: string;
    summary?: string;
    description?: string;
    startTime?: Date;
    endTime?: Date;
    attendees?: Array<{ email: string; name?: string }>;
  }): Promise<void> {
    const updates: calendar_v3.Schema$Event = {};

    if (params.summary) updates.summary = params.summary;
    if (params.description) updates.description = params.description;
    if (params.startTime) {
      updates.start = {
        dateTime: params.startTime.toISOString(),
        timeZone: "UTC",
      };
    }
    if (params.endTime) {
      updates.end = {
        dateTime: params.endTime.toISOString(),
        timeZone: "UTC",
      };
    }
    if (params.attendees) {
      updates.attendees = params.attendees.map((a) => ({
        email: a.email,
        displayName: a.name,
      }));
    }

    await this.calendar.events.patch({
      calendarId: params.calendarId,
      eventId: params.eventId,
      requestBody: updates,
      sendUpdates: "all",
    });
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    await this.calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: "all",
    });
  }
}

/**
 * Get Google Calendar service for a user
 */
export async function getGoogleCalendarService(
  userId: string
): Promise<GoogleCalendarService | null> {
  const supabase = await createServiceClient();

  const { data: credential } = await supabase
    .from("credentials")
    .select("*")
    .eq("user_id", userId)
    .eq("type", "google_calendar")
    .single();

  if (!credential) {
    return null;
  }

  return GoogleCalendarService.fromCredential(credential);
}
