import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LinksManager } from "@/components/links/links-manager";
import type { User, EventType, PageSettings, LinkWithEventType } from "@/lib/types/database";

export default async function LinksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profileData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as User | null;

  if (!profile) {
    redirect("/login");
  }

  // Get user's links ordered by position
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: linksData } = await (supabase as any)
    .from("links")
    .select("*, event_types(*)")
    .eq("user_id", user.id)
    .order("position", { ascending: true });

  const links = (linksData || []) as LinkWithEventType[];

  // Get user's event types for the link editor
  const { data: eventTypesData } = await supabase
    .from("event_types")
    .select("*")
    .eq("user_id", user.id)
    .eq("hidden", false)
    .order("title", { ascending: true });

  const eventTypes = (eventTypesData || []) as EventType[];

  // Get page settings (will be created automatically if doesn't exist via trigger)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pageSettingsData } = await (supabase as any)
    .from("page_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const pageSettings = pageSettingsData as PageSettings | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Page</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the links on your public profile page
          </p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          View my page
        </a>
      </div>

      {eventTypes.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            You need to create at least one event type in{" "}
            <Link href="/event-types" className="font-medium underline">
              Event Types
            </Link>{" "}
            before visitors can book with you.
          </p>
        </div>
      )}

      <LinksManager
        userId={user.id}
        initialLinks={links || []}
        eventTypes={eventTypes || []}
        pageSettings={pageSettings}
        username={profile.username}
        displayName={profile.name}
        avatarUrl={profile.avatar_url}
      />
    </div>
  );
}
