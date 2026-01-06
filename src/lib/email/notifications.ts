import { Resend } from "resend";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// Only initialize Resend if API key is present
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface BookingEmailParams {
  to: string;
  guestName: string;
  hostName: string;
  eventTitle: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  location?: string;
  bookingUid: string;
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function formatTimeInTimezone(date: Date, timezone: string): string {
  const zonedDate = toZonedTime(date, timezone);
  return format(zonedDate, "EEEE, MMMM d, yyyy 'at' h:mm a");
}

export async function sendBookingConfirmation(params: BookingEmailParams) {
  if (!resend) {
    console.log("Resend not configured, skipping email notification");
    return;
  }

  const {
    to,
    guestName,
    hostName,
    eventTitle,
    startTime,
    endTime,
    timezone,
    location,
    bookingUid,
  } = params;

  const formattedTime = formatTimeInTimezone(startTime, timezone);
  const rescheduleUrl = `${appUrl}/reschedule/${bookingUid}`;
  const cancelUrl = `${appUrl}/cancel/${bookingUid}`;

  const emailFrom = process.env.EMAIL_FROM || "Cal-Lite <bookings@cal-lite.app>";

  try {
    await resend.emails.send({
      from: emailFrom,
      to,
      subject: `Confirmed: ${eventTitle} with ${hostName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8fafc; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h1 style="color: #1a1a1a; font-size: 24px; margin: 0 0 8px 0;">Meeting Confirmed</h1>
              <p style="color: #666; margin: 0;">Your meeting has been scheduled!</p>
            </div>

            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 16px 0;">${eventTitle}</h2>

              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">When</p>
                <p style="color: #1a1a1a; font-size: 16px; margin: 4px 0 0 0;">${formattedTime}</p>
                <p style="color: #666; font-size: 14px; margin: 4px 0 0 0;">${timezone}</p>
              </div>

              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">Who</p>
                <p style="color: #1a1a1a; font-size: 16px; margin: 4px 0 0 0;">${hostName}</p>
              </div>

              ${location ? `
              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">Where</p>
                <p style="color: #1a1a1a; font-size: 16px; margin: 4px 0 0 0;">
                  ${location.startsWith("http") ? `<a href="${location}" style="color: #2563eb;">${location}</a>` : location}
                </p>
              </div>
              ` : ""}
            </div>

            <div style="text-align: center;">
              <a href="${rescheduleUrl}" style="display: inline-block; color: #2563eb; text-decoration: none; margin-right: 16px;">Reschedule</a>
              <a href="${cancelUrl}" style="display: inline-block; color: #dc2626; text-decoration: none;">Cancel</a>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 32px;">
              Powered by Cal-Lite
            </p>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    throw error;
  }
}

export async function sendBookingCancellation(params: Omit<BookingEmailParams, "location">) {
  if (!resend) {
    console.log("Resend not configured, skipping email notification");
    return;
  }

  const {
    to,
    guestName,
    hostName,
    eventTitle,
    startTime,
    timezone,
  } = params;

  const formattedTime = formatTimeInTimezone(startTime, timezone);
  const emailFrom = process.env.EMAIL_FROM || "Cal-Lite <bookings@cal-lite.app>";

  try {
    await resend.emails.send({
      from: emailFrom,
      to,
      subject: `Cancelled: ${eventTitle} with ${hostName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #fef2f2; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h1 style="color: #dc2626; font-size: 24px; margin: 0 0 8px 0;">Meeting Cancelled</h1>
              <p style="color: #666; margin: 0;">Your meeting has been cancelled.</p>
            </div>

            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 16px 0; text-decoration: line-through;">${eventTitle}</h2>

              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">When</p>
                <p style="color: #999; font-size: 16px; margin: 4px 0 0 0; text-decoration: line-through;">${formattedTime}</p>
              </div>

              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">Who</p>
                <p style="color: #999; font-size: 16px; margin: 4px 0 0 0;">${hostName}</p>
              </div>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 32px;">
              Powered by Cal-Lite
            </p>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send cancellation email:", error);
    throw error;
  }
}

export async function sendBookingRescheduled(params: BookingEmailParams & { newStartTime: Date }) {
  if (!resend) {
    console.log("Resend not configured, skipping email notification");
    return;
  }

  const {
    to,
    guestName,
    hostName,
    eventTitle,
    startTime,
    newStartTime,
    timezone,
    location,
    bookingUid,
  } = params;

  const oldTime = formatTimeInTimezone(startTime, timezone);
  const newTime = formatTimeInTimezone(newStartTime, timezone);
  const rescheduleUrl = `${appUrl}/reschedule/${bookingUid}`;
  const cancelUrl = `${appUrl}/cancel/${bookingUid}`;
  const emailFrom = process.env.EMAIL_FROM || "Cal-Lite <bookings@cal-lite.app>";

  try {
    await resend.emails.send({
      from: emailFrom,
      to,
      subject: `Rescheduled: ${eventTitle} with ${hostName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #fef3c7; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h1 style="color: #d97706; font-size: 24px; margin: 0 0 8px 0;">Meeting Rescheduled</h1>
              <p style="color: #666; margin: 0;">Your meeting has been moved to a new time.</p>
            </div>

            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 16px 0;">${eventTitle}</h2>

              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">Previous time</p>
                <p style="color: #999; font-size: 16px; margin: 4px 0 0 0; text-decoration: line-through;">${oldTime}</p>
              </div>

              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">New time</p>
                <p style="color: #1a1a1a; font-size: 16px; margin: 4px 0 0 0; font-weight: 600;">${newTime}</p>
                <p style="color: #666; font-size: 14px; margin: 4px 0 0 0;">${timezone}</p>
              </div>

              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">Who</p>
                <p style="color: #1a1a1a; font-size: 16px; margin: 4px 0 0 0;">${hostName}</p>
              </div>

              ${location ? `
              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">Where</p>
                <p style="color: #1a1a1a; font-size: 16px; margin: 4px 0 0 0;">
                  ${location.startsWith("http") ? `<a href="${location}" style="color: #2563eb;">${location}</a>` : location}
                </p>
              </div>
              ` : ""}
            </div>

            <div style="text-align: center;">
              <a href="${rescheduleUrl}" style="display: inline-block; color: #2563eb; text-decoration: none; margin-right: 16px;">Reschedule again</a>
              <a href="${cancelUrl}" style="display: inline-block; color: #dc2626; text-decoration: none;">Cancel</a>
            </div>

            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 32px;">
              Powered by Cal-Lite
            </p>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send rescheduled email:", error);
    throw error;
  }
}
