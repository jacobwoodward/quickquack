import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppearanceSettings } from "@/components/links/appearance-settings";
import { SocialLinksSettings } from "@/components/settings/social-links-settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { User, PageSettings, Link, SocialProfile } from "@/lib/types/database";

export default async function AppearancePage() {
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

  // Get page settings (will be created automatically if doesn't exist via trigger)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pageSettingsData } = await (supabase as any)
    .from("page_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  let pageSettings = pageSettingsData as PageSettings | null;

  // If no page settings exist, create default ones
  if (!pageSettings) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newSettingsData } = await (supabase as any)
      .from("page_settings")
      .insert({
        user_id: user.id,
      })
      .select()
      .single();
    pageSettings = newSettingsData as PageSettings | null;
  }

  // Get user's links for preview
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: linksData } = await (supabase as any)
    .from("links")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_visible", true)
    .order("position", { ascending: true })
    .limit(5);

  const links = (linksData || []) as Link[];

  // Get social profiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: socialProfilesData } = await (supabase as any)
    .from("social_profiles")
    .select("*")
    .eq("user_id", user.id)
    .order("position", { ascending: true });

  const socialProfiles = (socialProfilesData || []) as SocialProfile[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appearance</h1>
          <p className="mt-1 text-sm text-gray-500">
            Customize the look and feel of your public page
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

      {/* Social Links Section */}
      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
          <CardDescription>
            Add your social media profiles to display on your page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SocialLinksSettings
            userId={user.id}
            initialProfiles={socialProfiles}
          />
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <AppearanceSettings
        userId={user.id}
        initialSettings={pageSettings!}
        user={{
          name: profile.name,
          avatarUrl: profile.avatar_url,
          username: profile.username,
        }}
        links={links}
        socialProfiles={socialProfiles}
      />
    </div>
  );
}
