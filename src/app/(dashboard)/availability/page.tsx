import { createClient } from "@/lib/supabase/server";
import { AvailabilityEditor } from "@/components/availability/editor";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function AvailabilityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user's default schedule with availability
  const { data: schedule } = await supabase
    .from("schedules")
    .select(`
      *,
      availability (*)
    `)
    .eq("user_id", user.id)
    .eq("is_default", true)
    .single();

  // Get user's timezone
  const { data: profile } = await supabase
    .from("users")
    .select("timezone")
    .eq("id", user.id)
    .single();

  const userTimezone = (profile as { timezone: string } | null)?.timezone || "America/New_York";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
        <p className="mt-1 text-gray-600">
          Set when you&apos;re available for meetings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Hours</CardTitle>
          <CardDescription>
            Configure your regular weekly availability. Times are in your local timezone ({userTimezone}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilityEditor
            schedule={schedule}
            userId={user.id}
            timezone={userTimezone}
          />
        </CardContent>
      </Card>
    </div>
  );
}
