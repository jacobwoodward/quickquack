import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ReschedulePage } from "@/components/booking/reschedule-page";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import type { Booking, EventType, Schedule, Availability } from "@/lib/types/database";
import type { Metadata } from "next";

interface ReschedulePageProps {
  params: Promise<{ uid: string }>;
}

interface BookingMetadata {
  event_types: { title: string } | null;
  users: { id: string; name: string | null } | null;
}

export async function generateMetadata({ params }: ReschedulePageProps): Promise<Metadata> {
  const { uid } = await params;
  const supabase = await createServiceClient();

  // Get booking with user info
  const { data: bookingRaw } = await supabase
    .from("bookings")
    .select(`
      event_types (title),
      users!bookings_user_id_fkey (id, name)
    `)
    .eq("uid", uid)
    .single();

  const booking = bookingRaw as BookingMetadata | null;

  if (!booking?.users) {
    return { title: { absolute: "Reschedule" } };
  }

  // Get page settings for the user's configured title
  const { data: pageSettingsData } = await supabase
    .from("page_settings")
    .select("page_title")
    .eq("user_id", booking.users.id)
    .single();

  const pageSettings = pageSettingsData as { page_title: string | null } | null;

  const siteTitle = pageSettings?.page_title || booking.users.name || "Reschedule";
  const eventTitle = booking.event_types?.title || "Meeting";

  return {
    title: {
      absolute: `Reschedule ${eventTitle} | ${siteTitle}`,
    },
  };
}

interface BookingWithRelations extends Booking {
  event_types: EventType | null;
  attendees: Array<{ id: string; booking_id: string; email: string; name: string; timezone: string; created_at: string }>;
  users: {
    id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
    timezone: string;
  };
}

interface ScheduleWithAvailability extends Schedule {
  availability: Availability[];
}

export default async function Reschedule({ params }: ReschedulePageProps) {
  const { uid } = await params;
  const supabase = await createServiceClient();

  // Get booking with related data
  const { data: bookingData } = await supabase
    .from("bookings")
    .select(`
      *,
      event_types (*),
      attendees (name, email, timezone),
      users!bookings_user_id_fkey (id, name, email, avatar_url, timezone)
    `)
    .eq("uid", uid)
    .single();

  const booking = bookingData as BookingWithRelations | null;

  if (!booking) {
    notFound();
  }

  // Check if already cancelled
  if (booking.status === "CANCELLED") {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Booking Cancelled
              </h2>
              <p className="text-gray-600">
                This booking has been cancelled and cannot be rescheduled.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const user = booking.users;

  // Get user's schedule with availability
  const { data: scheduleData } = await supabase
    .from("schedules")
    .select(`
      *,
      availability (*)
    `)
    .eq("user_id", user.id)
    .eq("is_default", true)
    .single();

  const schedule = scheduleData as ScheduleWithAvailability | null;

  return (
    <ReschedulePage
      booking={booking}
      eventType={booking.event_types!}
      user={user}
      schedule={schedule}
      attendee={booking.attendees?.[0]}
    />
  );
}
