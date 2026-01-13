import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PublicPage } from "@/components/public/public-page";
import type { Metadata } from "next";
import type { User, EventType, PageSettings, Link, SocialProfile } from "@/lib/types/database";

/**
 * Get the single user for this self-hosted instance.
 * In a single-user app, we just get the first (and only) user.
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

export async function generateMetadata(): Promise<Metadata> {
  const user = await getSingleUser();

  if (!user) {
    return { title: { absolute: "Welcome" } };
  }

  const supabase = await createServiceClient();

  // Get page settings
  const { data: pageSettingsData } = await supabase
    .from("page_settings")
    .select("page_title, bio")
    .eq("user_id", user.id)
    .single();

  const pageSettings = pageSettingsData as { page_title: string | null; bio: string | null } | null;

  const title = pageSettings?.page_title || user.name || user.email;
  const description = pageSettings?.bio || `Book time with ${user.name || "me"}`;

  return {
    title: {
      absolute: title, // Don't append " | QuickQuack" to the public page title
    },
    description,
  };
}

export default async function Home() {
  const supabase = await createServiceClient();

  // Single-user app: get the first (and only) user
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .limit(1)
    .single();

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
      baseUrl="/book"
    />
  );
}
