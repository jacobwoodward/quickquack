import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BookingPage } from "@/components/booking/booking-page";
import type { User, EventType, Schedule, Availability } from "@/lib/types/database";

// Single-user app - this is the default username
const DEFAULT_USERNAME = "jacobwoodward";

interface BookingPageProps {
  params: Promise<{ slug: string }>;
}

interface ScheduleWithAvailability extends Schedule {
  availability: Availability[];
}

export default async function PublicBookingPage({ params }: BookingPageProps) {
  const { slug } = await params;
  const supabase = await createServiceClient();

  // Find user by username (single-user app)
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("username", DEFAULT_USERNAME)
    .single();

  const user = userData as User | null;

  if (!user) {
    notFound();
  }

  // Find event type
  const { data: eventTypeData } = await supabase
    .from("event_types")
    .select("*")
    .eq("user_id", user.id)
    .eq("slug", slug)
    .eq("hidden", false)
    .single();

  const eventType = eventTypeData as EventType | null;

  if (!eventType) {
    notFound();
  }

  // Get user's default schedule with availability
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
    <BookingPage
      user={user}
      eventType={eventType}
      schedule={schedule}
    />
  );
}
