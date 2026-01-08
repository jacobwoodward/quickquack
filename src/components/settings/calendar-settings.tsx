"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, RefreshCw } from "lucide-react";

interface CalendarSettingsProps {
  userId: string;
  isConnected: boolean;
  credentialId?: string;
  selectedCalendarIds: string[];
  destinationCalendarId?: string;
}

interface CalendarInfo {
  id: string;
  summary: string;
  primary?: boolean;
}

export function CalendarSettings({
  userId,
  isConnected,
  credentialId,
  selectedCalendarIds,
  destinationCalendarId,
}: CalendarSettingsProps) {
  const router = useRouter();
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedCalendarIds);
  const [destinationId, setDestinationId] = useState<string>(
    destinationCalendarId || "primary"
  );
  const [isSaving, setIsSaving] = useState(false);
  const hasAutoSaved = useRef(false);
  const isFirstConnection = selectedCalendarIds.length === 0 && !destinationCalendarId;

  // Fetch calendars when connected
  useEffect(() => {
    if (!isConnected || !credentialId) return;

    let isMounted = true;

    const fetchCalendars = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/calendars");
        const data = await response.json();

        if (!isMounted) return;

        if (data.calendars) {
          setCalendars(data.calendars);

          // Auto-save primary calendar if this is a fresh connection
          if (isFirstConnection && !hasAutoSaved.current) {
            const primaryCalendar = data.calendars.find((c: CalendarInfo) => c.primary);
            if (primaryCalendar) {
              hasAutoSaved.current = true;
              // Update local state to match what we're saving
              setSelectedIds([primaryCalendar.id]);
              setDestinationId(primaryCalendar.id);
              // Auto-save to database (fire and forget)
              autoSaveDefaults(primaryCalendar.id);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch calendars:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchCalendars();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, credentialId]);

  // Auto-save function (called imperatively, not in an effect)
  const autoSaveDefaults = async (primaryCalendarId: string) => {
    if (!credentialId) return;

    const supabase = createClient();

    try {
      // Save selected calendar (for conflict checking)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("selected_calendars").insert({
        user_id: userId,
        credential_id: credentialId,
        external_id: primaryCalendarId,
      });

      // Save destination calendar (where new events are created)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("destination_calendars").insert({
        user_id: userId,
        credential_id: credentialId,
        external_id: primaryCalendarId,
      });

      console.log("Auto-saved default calendar settings");
    } catch (error) {
      console.error("Failed to auto-save calendar settings:", error);
    }
  };

  const handleConnect = () => {
    // Redirect to Google OAuth
    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=/settings`,
        scopes:
          "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect your Google Calendar?")) {
      return;
    }

    const supabase = createClient();
    if (credentialId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("credentials").delete().eq("id", credentialId);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("selected_calendars").delete().eq("user_id", userId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("destination_calendars").delete().eq("user_id", userId);

    router.refresh();
  };

  const handleSave = async () => {
    setIsSaving(true);
    const supabase = createClient();

    try {
      // Update selected calendars
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("selected_calendars").delete().eq("user_id", userId);

      if (selectedIds.length > 0 && credentialId) {
        const records = selectedIds.map((externalId) => ({
          user_id: userId,
          credential_id: credentialId,
          external_id: externalId,
        }));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("selected_calendars").insert(records);
      }

      // Update destination calendar
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("destination_calendars").delete().eq("user_id", userId);

      if (destinationId && credentialId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from("destination_calendars").insert({
          user_id: userId,
          credential_id: credentialId,
          external_id: destinationId,
        });
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to save calendar settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCalendar = (calendarId: string) => {
    setSelectedIds((prev) =>
      prev.includes(calendarId)
        ? prev.filter((id) => id !== calendarId)
        : [...prev, calendarId]
    );
  };

  if (!isConnected) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-gray-600 mb-4">
          Connect your Google Calendar to automatically check for conflicts and create events.
        </p>
        <Button onClick={handleConnect}>
          Connect Google Calendar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Calendars to check for conflicts */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Check for conflicts
            </h4>
            <p className="text-sm text-gray-500 mb-3">
              Select which calendars to check when showing available times
            </p>
            <div className="space-y-2">
              {calendars.map((calendar) => (
                <label
                  key={calendar.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(calendar.id)}
                    onChange={() => toggleCalendar(calendar.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">{calendar.summary}</span>
                  {calendar.primary && (
                    <span className="text-xs text-gray-500">(Primary)</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Destination calendar */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Add new events to
            </h4>
            <p className="text-sm text-gray-500 mb-3">
              Where should new bookings be added?
            </p>
            <select
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
            >
              {calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.summary} {calendar.primary ? "(Primary)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={handleDisconnect}>
              Disconnect
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
