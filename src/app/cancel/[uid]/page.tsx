import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { CancelBookingForm } from "@/components/booking/cancel-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Calendar, Clock, User } from "lucide-react";
import type { Metadata } from "next";

interface CancelPageProps {
  params: Promise<{ uid: string }>;
}

interface BookingMetadata {
  event_types: { title: string } | null;
  users: { id: string; name: string | null } | null;
}

export async function generateMetadata({ params }: CancelPageProps): Promise<Metadata> {
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
    return { title: { absolute: "Cancel Booking" } };
  }

  // Get page settings for the user's configured title
  const { data: pageSettingsData } = await supabase
    .from("page_settings")
    .select("page_title")
    .eq("user_id", booking.users.id)
    .single();

  const pageSettings = pageSettingsData as { page_title: string | null } | null;

  const siteTitle = pageSettings?.page_title || booking.users.name || "Cancel";
  const eventTitle = booking.event_types?.title || "Meeting";

  return {
    title: {
      absolute: `Cancel ${eventTitle} | ${siteTitle}`,
    },
  };
}

interface BookingWithRelations {
  id: string;
  uid: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  event_types: { title: string; length: number; location_type: string | null } | null;
  attendees: Array<{ name: string; email: string; timezone: string }>;
  users: { name: string | null; email: string };
}

export default async function CancelPage({ params }: CancelPageProps) {
  const { uid } = await params;
  const supabase = await createServiceClient();

  // Get booking with related data
  const { data: bookingData } = await supabase
    .from("bookings")
    .select(`
      *,
      event_types (title, length, location_type),
      attendees (name, email, timezone),
      users!bookings_user_id_fkey (name, email)
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
                Already Cancelled
              </h2>
              <p className="text-gray-600">
                This booking has already been cancelled.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const attendee = booking.attendees?.[0];
  const timezone = attendee?.timezone || "America/New_York";
  const startTime = toZonedTime(new Date(booking.start_time), timezone);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Cancel Booking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Booking details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-gray-900">
                {booking.event_types?.title}
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{format(startTime, "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{format(startTime, "h:mm a")} ({timezone})</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{booking.users?.name || "Host"}</span>
                </div>
              </div>
            </div>

            <CancelBookingForm bookingUid={uid} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
