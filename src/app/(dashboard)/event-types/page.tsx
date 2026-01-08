import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, Clock, ExternalLink, EyeOff } from "lucide-react";
import { EventTypeActions } from "@/components/event-types/actions";
import { CopyLinkButton } from "@/components/event-types/copy-link-button";
import type { EventType } from "@/lib/types/database";

export default async function EventTypesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: eventTypes } = await supabase
    .from("event_types")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Types</h1>
          <p className="mt-1 text-gray-600">
            Create events for people to book on your calendar
          </p>
        </div>
        <Link href="/event-types/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Event Type
          </Button>
        </Link>
      </div>

      {eventTypes && eventTypes.length > 0 ? (
        <div className="grid gap-4">
          {(eventTypes as EventType[]).map((eventType) => (
            <Card key={eventType.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {eventType.title}
                      </h3>
                      {eventType.hidden && (
                        <Badge variant="warning">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Hidden
                        </Badge>
                      )}
                    </div>
                    {eventType.description && (
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {eventType.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {eventType.length} min
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                        /book/{eventType.slug}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/book/${eventType.slug}`}
                      target="_blank"
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                      title="Preview"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <CopyLinkButton link={`${baseUrl}/book/${eventType.slug}`} />
                    <EventTypeActions eventTypeId={eventType.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                No event types yet
              </h3>
              <p className="mt-1 text-gray-500">
                Create your first event type to start accepting bookings
              </p>
              <Link href="/event-types/new">
                <Button className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Event Type
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
