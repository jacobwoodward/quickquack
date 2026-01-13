import { Resend } from "resend";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import {
  generateICS,
  generateGoogleCalendarUrl,
  generateOutlookUrl,
  generateYahooCalendarUrl,
} from "@/lib/calendar/ics";
import { escapeHtml } from "@/lib/utils/html";

// Only initialize Resend if API key is present
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface BookingEmailParams {
  to: string;
  guestName: string;
  hostName: string;
  hostEmail?: string;
  eventTitle: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  location?: string;
  bookingUid: string;
  priceCents?: number;
  description?: string;
}

interface EmailTemplate {
  subject?: string;
  greeting?: string;
  body_text?: string;
  footer_text?: string;
  is_enabled?: boolean;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function formatTimeInTimezone(date: Date, timezone: string): string {
  const zonedDate = toZonedTime(date, timezone);
  return format(zonedDate, "EEEE, MMMM d, yyyy 'at' h:mm a");
}

/**
 * Generate calendar links HTML section
 */
function generateCalendarLinksHtml(params: {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  hostName: string;
  hostEmail?: string;
  guestName: string;
  guestEmail: string;
  uid: string;
}): string {
  const icsParams = {
    title: params.title,
    description: params.description,
    startTime: params.startTime,
    endTime: params.endTime,
    location: params.location,
    organizer: params.hostEmail
      ? { name: params.hostName, email: params.hostEmail }
      : undefined,
    attendee: { name: params.guestName, email: params.guestEmail },
    uid: params.uid,
  };

  const googleUrl = generateGoogleCalendarUrl(icsParams);
  const outlookUrl = generateOutlookUrl(icsParams);
  const yahooUrl = generateYahooCalendarUrl(icsParams);

  return `
    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
      <p style="color: #666; font-size: 14px; margin: 0 0 8px 0;">Add to Calendar</p>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <a href="${googleUrl}" target="_blank" style="display: inline-block; padding: 8px 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; color: #333; text-decoration: none; font-size: 14px;">Google</a>
        <a href="${outlookUrl}" target="_blank" style="display: inline-block; padding: 8px 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; color: #333; text-decoration: none; font-size: 14px;">Outlook</a>
        <a href="${yahooUrl}" target="_blank" style="display: inline-block; padding: 8px 16px; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; color: #333; text-decoration: none; font-size: 14px;">Yahoo</a>
      </div>
      <p style="color: #999; font-size: 12px; margin: 8px 0 0 0;">Or download the attached .ics file to add to any calendar app.</p>
    </div>
  `;
}

/**
 * Generate ICS attachment for emails
 */
function generateICSAttachment(params: {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  hostName: string;
  hostEmail?: string;
  guestName: string;
  guestEmail: string;
  uid: string;
}): { filename: string; content: string } {
  const icsContent = generateICS({
    title: params.title,
    description: params.description,
    startTime: params.startTime,
    endTime: params.endTime,
    location: params.location,
    organizer: params.hostEmail
      ? { name: params.hostName, email: params.hostEmail }
      : undefined,
    attendee: { name: params.guestName, email: params.guestEmail },
    uid: params.uid,
  });

  return {
    filename: "invite.ics",
    content: Buffer.from(icsContent).toString("base64"),
  };
}

export async function sendBookingConfirmation(
  params: BookingEmailParams,
  template?: EmailTemplate
) {
  if (!resend) {
    console.warn("[EMAIL] Resend not configured (RESEND_API_KEY not set), skipping guest confirmation email to:", params.to);
    return;
  }

  // Check if template is disabled
  if (template && template.is_enabled === false) {
    console.log("[EMAIL] Confirmation email template is disabled, skipping");
    return;
  }

  const emailFrom = process.env.FROM_EMAIL || "QuickQuack <noreply@example.com>";
  console.log("[EMAIL] Preparing to send booking confirmation to:", params.to, "from:", emailFrom);

  const {
    to,
    guestName,
    hostName,
    hostEmail,
    eventTitle,
    startTime,
    endTime,
    timezone,
    location,
    bookingUid,
    priceCents,
    description,
  } = params;

  const formattedTime = formatTimeInTimezone(startTime, timezone);
  const rescheduleUrl = `${appUrl}/reschedule/${bookingUid}`;
  const cancelUrl = `${appUrl}/cancel/${bookingUid}`;
  const isPaid = priceCents && priceCents > 0;

  // Use template values if provided, otherwise use defaults
  const subject = template?.subject
    ? template.subject
        .replace("{{eventTitle}}", eventTitle)
        .replace("{{hostName}}", hostName)
        .replace("{{guestName}}", guestName)
    : `Confirmed: ${eventTitle} with ${hostName}`;

  const greeting = template?.greeting
    ? template.greeting.replace("{{guestName}}", guestName)
    : "Your meeting has been scheduled!";

  const footerText = template?.footer_text || "";

  // Generate calendar links and ICS attachment
  const calendarLinksHtml = generateCalendarLinksHtml({
    title: eventTitle,
    description,
    startTime,
    endTime,
    location,
    hostName,
    hostEmail,
    guestName,
    guestEmail: to,
    uid: bookingUid,
  });

  const icsAttachment = generateICSAttachment({
    title: eventTitle,
    description,
    startTime,
    endTime,
    location,
    hostName,
    hostEmail,
    guestName,
    guestEmail: to,
    uid: bookingUid,
  });

  try {
    await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      attachments: [
        {
          filename: icsAttachment.filename,
          content: icsAttachment.content,
        },
      ],
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
              <p style="color: #666; margin: 0;">${greeting}</p>
            </div>

            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 16px 0;">${escapeHtml(eventTitle)}</h2>

              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">When</p>
                <p style="color: #1a1a1a; font-size: 16px; margin: 4px 0 0 0;">${formattedTime}</p>
                <p style="color: #666; font-size: 14px; margin: 4px 0 0 0;">${timezone}</p>
              </div>

              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">Who</p>
                <p style="color: #1a1a1a; font-size: 16px; margin: 4px 0 0 0;">${escapeHtml(hostName)}</p>
              </div>

              ${location ? `
              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">Where</p>
                <p style="color: #1a1a1a; font-size: 16px; margin: 4px 0 0 0;">
                  ${location.startsWith("http") ? `<a href="${escapeHtml(location)}" style="color: #2563eb;">${escapeHtml(location)}</a>` : escapeHtml(location)}
                </p>
              </div>
              ` : ""}

              ${isPaid ? `
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <p style="color: #666; font-size: 14px; margin: 0;">Payment</p>
                <p style="color: #16a34a; font-size: 16px; margin: 4px 0 0 0; font-weight: 600;">${formatPrice(priceCents)} paid</p>
              </div>
              ` : ""}

              ${calendarLinksHtml}
            </div>

            <div style="text-align: center;">
              <a href="${rescheduleUrl}" style="display: inline-block; color: #2563eb; text-decoration: none; margin-right: 16px;">Reschedule</a>
              <a href="${cancelUrl}" style="display: inline-block; color: #dc2626; text-decoration: none;">Cancel</a>
            </div>

            ${footerText ? `
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 32px;">
              ${footerText}
            </p>
            ` : ""}
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    throw error;
  }
}

interface CancellationEmailParams extends Omit<BookingEmailParams, "location"> {
  refunded?: boolean;
  refundAmount?: number;
}

export async function sendBookingCancellation(
  params: CancellationEmailParams,
  template?: EmailTemplate
) {
  if (!resend) {
    console.warn("[EMAIL] Resend not configured (RESEND_API_KEY not set), skipping cancellation email to:", params.to);
    return;
  }

  // Check if template is disabled
  if (template && template.is_enabled === false) {
    console.log("[EMAIL] Cancellation email template is disabled, skipping");
    return;
  }

  console.log("[EMAIL] Preparing to send cancellation email to:", params.to);

  const {
    to,
    guestName,
    hostName,
    eventTitle,
    startTime,
    timezone,
    priceCents,
    refunded,
    refundAmount,
  } = params;

  const formattedTime = formatTimeInTimezone(startTime, timezone);
  const emailFrom = process.env.FROM_EMAIL || "QuickQuack <noreply@example.com>";
  const wasRefunded = refunded && refundAmount && refundAmount > 0;

  // Use template values if provided
  const subject = template?.subject
    ? template.subject
        .replace("{{eventTitle}}", eventTitle)
        .replace("{{hostName}}", hostName)
        .replace("{{guestName}}", guestName)
    : `Cancelled: ${eventTitle} with ${hostName}`;

  const greeting = template?.greeting
    ? template.greeting.replace("{{guestName}}", guestName)
    : "Your meeting has been cancelled.";

  const footerText = template?.footer_text || "";

  try {
    await resend.emails.send({
      from: emailFrom,
      to,
      subject,
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
              <p style="color: #666; margin: 0;">${greeting}</p>
            </div>

            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 16px 0; text-decoration: line-through;">${escapeHtml(eventTitle)}</h2>

              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">When</p>
                <p style="color: #999; font-size: 16px; margin: 4px 0 0 0; text-decoration: line-through;">${formattedTime}</p>
              </div>

              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">Who</p>
                <p style="color: #999; font-size: 16px; margin: 4px 0 0 0;">${escapeHtml(hostName)}</p>
              </div>

              ${wasRefunded ? `
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <p style="color: #666; font-size: 14px; margin: 0;">Refund</p>
                <p style="color: #16a34a; font-size: 16px; margin: 4px 0 0 0; font-weight: 600;">${formatPrice(refundAmount)} refunded</p>
                <p style="color: #666; font-size: 12px; margin: 4px 0 0 0;">The refund will appear on your statement within 5-10 business days.</p>
              </div>
              ` : priceCents && priceCents > 0 ? `
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <p style="color: #666; font-size: 14px; margin: 0;">Payment</p>
                <p style="color: #999; font-size: 16px; margin: 4px 0 0 0;">${formatPrice(priceCents)} - No refund (outside refund window)</p>
              </div>
              ` : ""}
            </div>

            ${footerText ? `
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 32px;">
              ${footerText}
            </p>
            ` : ""}
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send cancellation email:", error);
    throw error;
  }
}

export async function sendBookingRescheduled(
  params: BookingEmailParams & { newStartTime: Date; newEndTime: Date },
  template?: EmailTemplate
) {
  if (!resend) {
    console.warn("[EMAIL] Resend not configured (RESEND_API_KEY not set), skipping rescheduled email to:", params.to);
    return;
  }

  // Check if template is disabled
  if (template && template.is_enabled === false) {
    console.log("[EMAIL] Rescheduled email template is disabled, skipping");
    return;
  }

  console.log("[EMAIL] Preparing to send rescheduled email to:", params.to);

  const {
    to,
    guestName,
    hostName,
    hostEmail,
    eventTitle,
    startTime,
    newStartTime,
    newEndTime,
    timezone,
    location,
    bookingUid,
    description,
  } = params;

  const oldTime = formatTimeInTimezone(startTime, timezone);
  const newTime = formatTimeInTimezone(newStartTime, timezone);
  const rescheduleUrl = `${appUrl}/reschedule/${bookingUid}`;
  const cancelUrl = `${appUrl}/cancel/${bookingUid}`;
  const emailFrom = process.env.FROM_EMAIL || "QuickQuack <noreply@example.com>";

  // Use template values if provided
  const subject = template?.subject
    ? template.subject
        .replace("{{eventTitle}}", eventTitle)
        .replace("{{hostName}}", hostName)
        .replace("{{guestName}}", guestName)
    : `Rescheduled: ${eventTitle} with ${hostName}`;

  const greeting = template?.greeting
    ? template.greeting.replace("{{guestName}}", guestName)
    : "Your meeting has been moved to a new time.";

  const footerText = template?.footer_text || "";

  // Generate calendar links and ICS attachment with NEW times
  const calendarLinksHtml = generateCalendarLinksHtml({
    title: eventTitle,
    description,
    startTime: newStartTime,
    endTime: newEndTime,
    location,
    hostName,
    hostEmail,
    guestName,
    guestEmail: to,
    uid: bookingUid,
  });

  const icsAttachment = generateICSAttachment({
    title: eventTitle,
    description,
    startTime: newStartTime,
    endTime: newEndTime,
    location,
    hostName,
    hostEmail,
    guestName,
    guestEmail: to,
    uid: bookingUid,
  });

  try {
    await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      attachments: [
        {
          filename: icsAttachment.filename,
          content: icsAttachment.content,
        },
      ],
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
              <p style="color: #666; margin: 0;">${greeting}</p>
            </div>

            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 16px 0;">${escapeHtml(eventTitle)}</h2>

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
                <p style="color: #1a1a1a; font-size: 16px; margin: 4px 0 0 0;">${escapeHtml(hostName)}</p>
              </div>

              ${location ? `
              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">Where</p>
                <p style="color: #1a1a1a; font-size: 16px; margin: 4px 0 0 0;">
                  ${location.startsWith("http") ? `<a href="${escapeHtml(location)}" style="color: #2563eb;">${escapeHtml(location)}</a>` : escapeHtml(location)}
                </p>
              </div>
              ` : ""}

              ${calendarLinksHtml}
            </div>

            <div style="text-align: center;">
              <a href="${rescheduleUrl}" style="display: inline-block; color: #2563eb; text-decoration: none; margin-right: 16px;">Reschedule again</a>
              <a href="${cancelUrl}" style="display: inline-block; color: #dc2626; text-decoration: none;">Cancel</a>
            </div>

            ${footerText ? `
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 32px;">
              ${footerText}
            </p>
            ` : ""}
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send rescheduled email:", error);
    throw error;
  }
}

/**
 * Send a reminder email before a booking
 */
export async function sendBookingReminder(
  params: BookingEmailParams,
  template?: EmailTemplate
) {
  if (!resend) {
    console.warn("[EMAIL] Resend not configured (RESEND_API_KEY not set), skipping reminder email to:", params.to);
    return;
  }

  // Check if template is disabled
  if (template && template.is_enabled === false) {
    console.log("[EMAIL] Reminder email template is disabled, skipping");
    return;
  }

  console.log("[EMAIL] Preparing to send reminder email to:", params.to);

  const {
    to,
    guestName,
    hostName,
    hostEmail,
    eventTitle,
    startTime,
    endTime,
    timezone,
    location,
    bookingUid,
    description,
  } = params;

  const formattedTime = formatTimeInTimezone(startTime, timezone);
  const rescheduleUrl = `${appUrl}/reschedule/${bookingUid}`;
  const cancelUrl = `${appUrl}/cancel/${bookingUid}`;

  const emailFrom = process.env.FROM_EMAIL || "QuickQuack <noreply@example.com>";

  // Use template values if provided
  const subject = template?.subject
    ? template.subject
        .replace("{{eventTitle}}", eventTitle)
        .replace("{{hostName}}", hostName)
        .replace("{{guestName}}", guestName)
    : `Reminder: ${eventTitle} with ${hostName} - Starting Soon`;

  const greeting = template?.greeting
    ? template.greeting.replace("{{guestName}}", guestName)
    : "Your meeting is starting soon!";

  const bodyText = template?.body_text
    ? template.body_text.replace("{{guestName}}", guestName)
    : "";

  const footerText = template?.footer_text || "";

  // Generate calendar links and ICS attachment
  const calendarLinksHtml = generateCalendarLinksHtml({
    title: eventTitle,
    description,
    startTime,
    endTime,
    location,
    hostName,
    hostEmail,
    guestName,
    guestEmail: to,
    uid: bookingUid,
  });

  const icsAttachment = generateICSAttachment({
    title: eventTitle,
    description,
    startTime,
    endTime,
    location,
    hostName,
    hostEmail,
    guestName,
    guestEmail: to,
    uid: bookingUid,
  });

  try {
    await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      attachments: [
        {
          filename: icsAttachment.filename,
          content: icsAttachment.content,
        },
      ],
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #dbeafe; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h1 style="color: #1d4ed8; font-size: 24px; margin: 0 0 8px 0;">Meeting Reminder</h1>
              <p style="color: #666; margin: 0;">${greeting}</p>
            </div>

            ${bodyText ? `
            <div style="margin-bottom: 24px;">
              <p style="color: #333; font-size: 16px; margin: 0;">${bodyText}</p>
            </div>
            ` : ""}

            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 16px 0;">${escapeHtml(eventTitle)}</h2>

              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">When</p>
                <p style="color: #1a1a1a; font-size: 16px; margin: 4px 0 0 0;">${formattedTime}</p>
                <p style="color: #666; font-size: 14px; margin: 4px 0 0 0;">${timezone}</p>
              </div>

              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">Who</p>
                <p style="color: #1a1a1a; font-size: 16px; margin: 4px 0 0 0;">${escapeHtml(hostName)}</p>
              </div>

              ${location ? `
              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">Where</p>
                <p style="color: #1a1a1a; font-size: 16px; margin: 4px 0 0 0;">
                  ${location.startsWith("http") ? `<a href="${escapeHtml(location)}" style="color: #2563eb;">${escapeHtml(location)}</a>` : escapeHtml(location)}
                </p>
              </div>
              ` : ""}

              ${calendarLinksHtml}
            </div>

            <div style="text-align: center;">
              <a href="${rescheduleUrl}" style="display: inline-block; color: #2563eb; text-decoration: none; margin-right: 16px;">Reschedule</a>
              <a href="${cancelUrl}" style="display: inline-block; color: #dc2626; text-decoration: none;">Cancel</a>
            </div>

            ${footerText ? `
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 32px;">
              ${footerText}
            </p>
            ` : ""}
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send reminder email:", error);
    throw error;
  }
}

interface HostNotificationParams {
  to: string;
  hostName: string;
  guestName: string;
  guestEmail: string;
  eventTitle: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  location?: string;
  notes?: string;
  priceCents?: number;
}

/**
 * Send notification to host when a new booking is made
 */
export async function sendHostNotification(
  params: HostNotificationParams,
  template?: EmailTemplate
) {
  if (!resend) {
    console.warn("[EMAIL] Resend not configured (RESEND_API_KEY not set), skipping host notification email to:", params.to);
    return;
  }

  // Check if template is disabled
  if (template && template.is_enabled === false) {
    console.log("[EMAIL] Host notification email template is disabled, skipping");
    return;
  }

  console.log("[EMAIL] Preparing to send host notification to:", params.to);

  const {
    to,
    hostName,
    guestName,
    guestEmail,
    eventTitle,
    startTime,
    endTime,
    timezone,
    location,
    notes,
    priceCents,
  } = params;

  const formattedTime = formatTimeInTimezone(startTime, timezone);
  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  const emailFrom = process.env.FROM_EMAIL || "QuickQuack <noreply@example.com>";
  const isPaid = priceCents && priceCents > 0;

  // Use template values if provided
  const subject = template?.subject
    ? template.subject
        .replace("{{eventTitle}}", eventTitle)
        .replace("{{hostName}}", hostName)
        .replace("{{guestName}}", guestName)
    : `New Booking: ${eventTitle} with ${guestName}`;

  const greeting = template?.greeting
    ? template.greeting.replace("{{guestName}}", guestName)
    : `You have a new booking!`;

  const footerText = template?.footer_text || "";

  try {
    await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #ecfdf5; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h1 style="color: #059669; font-size: 24px; margin: 0 0 8px 0;">New Booking</h1>
              <p style="color: #666; margin: 0;">${greeting}</p>
            </div>

            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
              <h2 style="color: #1a1a1a; font-size: 18px; margin: 0 0 16px 0;">${escapeHtml(eventTitle)}</h2>

              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">Guest</p>
                <p style="color: #1a1a1a; font-size: 16px; margin: 4px 0 0 0;">${escapeHtml(guestName)}</p>
                <p style="color: #666; font-size: 14px; margin: 4px 0 0 0;">
                  <a href="mailto:${encodeURIComponent(guestEmail)}" style="color: #2563eb;">${escapeHtml(guestEmail)}</a>
                </p>
              </div>

              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">When</p>
                <p style="color: #1a1a1a; font-size: 16px; margin: 4px 0 0 0;">${formattedTime}</p>
                <p style="color: #666; font-size: 14px; margin: 4px 0 0 0;">${timezone} (${duration} minutes)</p>
              </div>

              ${location ? `
              <div style="margin-bottom: 12px;">
                <p style="color: #666; font-size: 14px; margin: 0;">Where</p>
                <p style="color: #1a1a1a; font-size: 16px; margin: 4px 0 0 0;">
                  ${location.startsWith("http") ? `<a href="${escapeHtml(location)}" style="color: #2563eb;">${escapeHtml(location)}</a>` : escapeHtml(location)}
                </p>
              </div>
              ` : ""}

              ${notes ? `
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <p style="color: #666; font-size: 14px; margin: 0;">Message from guest</p>
                <div style="background: #f9fafb; border-radius: 6px; padding: 12px; margin-top: 8px;">
                  <p style="color: #1a1a1a; font-size: 14px; margin: 0; white-space: pre-wrap;">${escapeHtml(notes)}</p>
                </div>
              </div>
              ` : ""}

              ${isPaid ? `
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <p style="color: #666; font-size: 14px; margin: 0;">Payment</p>
                <p style="color: #16a34a; font-size: 16px; margin: 4px 0 0 0; font-weight: 600;">${formatPrice(priceCents)} received</p>
              </div>
              ` : ""}
            </div>

            <p style="color: #666; font-size: 14px; text-align: center;">
              This meeting has been added to your calendar.
            </p>

            ${footerText ? `
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 32px;">
              ${footerText}
            </p>
            ` : ""}
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Failed to send host notification email:", error);
    throw error;
  }
}
