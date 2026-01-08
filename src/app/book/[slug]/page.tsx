import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BookingPage } from "@/components/booking/booking-page";
import type { User, EventType, Schedule, Availability } from "@/lib/types/database";
import type { Metadata } from "next";

interface BookingPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServiceClient();

  // Get the single user
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .limit(1)
    .single();

  if (!userData) {
    return { title: { absolute: "Book" } };
  }

  // Get page settings for the user's configured title
  const { data: pageSettings } = await supabase
    .from("page_settings")
    .select("page_title")
    .eq("user_id", userData.id)
    .single();

  // Get event type for the title
  const { data: eventType } = await supabase
    .from("event_types")
    .select("title")
    .eq("user_id", userData.id)
    .eq("slug", slug)
    .single();

  const siteTitle = pageSettings?.page_title || userData.name || "Book";
  const eventTitle = eventType?.title || "Book";

  return {
    title: {
      absolute: `${eventTitle} | ${siteTitle}`,
    },
  };
}

interface ScheduleWithAvailability extends Schedule {
  availability: Availability[];
}

/**
 * Get the single user for this self-hosted instance.
 */
async function getSingleUser() {
  const supabase = await createServiceClient();

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .limit(1)
    .single();

  return userData as User | null;
}

export default async function PublicBookingPage({ params }: BookingPageProps) {
  const { slug } = await params;
  const supabase = await createServiceClient();

  // Single-user app: get the first (and only) user
  const user = await getSingleUser();

  if (!user) {
    notFound();
  }

  // Find event type by slug
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
