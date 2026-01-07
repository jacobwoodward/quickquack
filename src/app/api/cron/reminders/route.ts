import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendBookingReminder } from "@/lib/email/notifications";
import { addHours } from "date-fns";

// This endpoint is called by Vercel Cron
// Runs every 15 minutes to send reminder emails for bookings starting in ~1 hour

interface Attendee {
  id: string;
  booking_id: string;
  email: string;
  name: string;
  timezone: string | null;
}

interface EventTypeRecord {
  id: string;
  title: string;
  description: string | null;
}

interface UserRecord {
  id: string;
  email: string;
  name: string | null;
}

interface BookingWithRelations {
  id: string;
  uid: string;
  user_id: string;
  start_time: string;
  end_time: string;
  location_value: string | null;
  description: string | null;
  status: string;
  reminder_status: string;
  attendees: Attendee[];
  event_types: EventTypeRecord;
  users: UserRecord;
}

interface EmailTemplateRecord {
  id: string;
  is_enabled: boolean;
  subject: string | null;
  greeting: string | null;
  body_text: string | null;
  footer_text: string | null;
}

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  try {
    const now = new Date();
    // Look for bookings starting in 45-75 minutes (to account for 15-min cron intervals)
    const windowStart = addHours(now, 0.75); // 45 minutes from now
    const windowEnd = addHours(now, 1.25); // 75 minutes from now

    // Find bookings that need reminders
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bookingsData, error: bookingsError } = await (supabase as any)
      .from("bookings")
      .select(`
        *,
        attendees (*),
        event_types (*),
        users (*)
      `)
      .eq("status", "ACCEPTED")
      .eq("reminder_status", "pending")
      .gte("start_time", windowStart.toISOString())
      .lte("start_time", windowEnd.toISOString());

    const bookings = bookingsData as BookingWithRelations[] | null;

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      return NextResponse.json(
        { error: "Failed to fetch bookings" },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No reminders to send",
        processed: 0,
      });
    }

    const results = {
      sent: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const booking of bookings) {
      try {
        // Get attendee info
        const attendee = booking.attendees?.[0];
        if (!attendee) {
          // Mark as skipped - no attendee
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("bookings")
            .update({ reminder_status: "skipped" })
            .eq("id", booking.id);
          results.skipped++;
          continue;
        }

        const user = booking.users;
        const eventType = booking.event_types;

        if (!user || !eventType) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("bookings")
            .update({ reminder_status: "skipped" })
            .eq("id", booking.id);
          results.skipped++;
          continue;
        }

        // Get reminder template for this user
        const { data: templateData } = await supabase
          .from("email_templates")
          .select("*")
          .eq("user_id", user.id)
          .eq("template_type", "reminder")
          .single();

        const template = templateData as EmailTemplateRecord | null;

        // Check if reminder is disabled
        if (template && template.is_enabled === false) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("bookings")
            .update({ reminder_status: "skipped" })
            .eq("id", booking.id);
          results.skipped++;
          continue;
        }

        // Send reminder email - transform template to expected format
        const emailTemplate = template ? {
          subject: template.subject || undefined,
          greeting: template.greeting || undefined,
          body_text: template.body_text || undefined,
          footer_text: template.footer_text || undefined,
          is_enabled: template.is_enabled,
        } : undefined;

        await sendBookingReminder(
          {
            to: attendee.email,
            guestName: attendee.name,
            hostName: user.name || user.email,
            hostEmail: user.email,
            eventTitle: eventType.title,
            startTime: new Date(booking.start_time),
            endTime: new Date(booking.end_time),
            timezone: attendee.timezone || "UTC",
            location: booking.location_value || undefined,
            bookingUid: booking.uid,
            description: booking.description || undefined,
          },
          emailTemplate
        );

        // Mark as sent
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("bookings")
          .update({ reminder_status: "sent" })
          .eq("id", booking.id);

        results.sent++;
      } catch (error) {
        console.error(`Failed to send reminder for booking ${booking.id}:`, error);
        results.failed++;
        results.errors.push(
          `Booking ${booking.id}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${bookings.length} bookings`,
      ...results,
    });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
