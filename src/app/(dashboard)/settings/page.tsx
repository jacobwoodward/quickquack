import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/settings/profile-form";
import { CalendarSettings } from "@/components/settings/calendar-settings";
import { Check, X } from "lucide-react";
import type { Credential, SelectedCalendar, DestinationCalendar } from "@/lib/types/database";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get calendar credentials
  const { data: credentials } = await supabase
    .from("credentials")
    .select("*")
    .eq("user_id", user.id)
    .eq("type", "google_calendar");

  const hasCalendarConnected = !!(credentials && credentials.length > 0);

  // Get selected calendars
  const { data: selectedCalendars } = await supabase
    .from("selected_calendars")
    .select("*")
    .eq("user_id", user.id);

  // Get destination calendar
  const { data: destinationCalendar } = await supabase
    .from("destination_calendars")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">Manage your profile and calendar integrations</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Your public profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            profile={profile || {
              id: user.id,
              email: user.email!,
              name: null,
              username: null,
              avatar_url: null,
              timezone: "America/New_York",
              time_format: "12h",
              created_at: "",
              updated_at: "",
            }}
          />
        </CardContent>
      </Card>

      {/* Calendar Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Google Calendar</CardTitle>
              <CardDescription>
                Connect your calendar to check for conflicts and create events
              </CardDescription>
            </div>
            {hasCalendarConnected ? (
              <Badge variant="success" className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="default" className="flex items-center gap-1">
                <X className="w-3 h-3" />
                Not connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <CalendarSettings
            userId={user.id}
            isConnected={hasCalendarConnected}
            credentialId={(credentials as Credential[] | null)?.[0]?.id}
            selectedCalendarIds={(selectedCalendars as SelectedCalendar[] | null)?.map((c) => c.external_id) || []}
            destinationCalendarId={(destinationCalendar as DestinationCalendar | null)?.external_id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
