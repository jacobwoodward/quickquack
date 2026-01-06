import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PublicPage } from "@/components/public/public-page";
import type { User, EventType, PageSettings, Link, SocialProfile } from "@/lib/types/database";

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = await params;
  const supabase = await createServiceClient();

  // Find user by username first, then by ID
  let { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  // If not found by username, try by ID
  if (!userData) {
    const { data: userById } = await supabase
      .from("users")
      .select("*")
      .eq("id", username)
      .single();
    userData = userById;
  }

  const user = userData as User | null;

  if (!user) {
    notFound();
  }

  // Get page settings
  const { data: pageSettingsData } = await supabase
    .from("page_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const pageSettings = pageSettingsData as PageSettings | null;

  // Get all visible links for this user
  const { data: linksData } = await supabase
    .from("links")
    .select("*, event_types(*)")
    .eq("user_id", user.id)
    .eq("is_visible", true)
    .order("position", { ascending: true });

  const links = (linksData || []) as (Link & { event_types: EventType | null })[];

  // Get all public (non-hidden) event types for fallback
  const { data: eventTypesData } = await supabase
    .from("event_types")
    .select("*")
    .eq("user_id", user.id)
    .eq("hidden", false)
    .order("position", { ascending: true });

  const eventTypes = (eventTypesData as EventType[]) || [];

  // Get social profiles
  const { data: socialProfilesData } = await supabase
    .from("social_profiles")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_visible", true)
    .order("position", { ascending: true });

  const socialProfiles = (socialProfilesData as SocialProfile[]) || [];

  return (
    <PublicPage
      user={user}
      pageSettings={pageSettings}
      links={links}
      eventTypes={eventTypes}
      socialProfiles={socialProfiles}
    />
  );
}
