import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Calendar, Clock, User, Video } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Get upcoming bookings
  const { data: upcomingBookings } = await supabase
    .from("bookings")
    .select(`
      *,
      event_types (title, length),
      attendees (name, email, timezone)
    `)
    .eq("user_id", user.id)
    .eq("status", "ACCEPTED")
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(5);

  // Get past bookings
  const { data: pastBookings } = await supabase
    .from("bookings")
    .select(`
      *,
      event_types (title, length),
      attendees (name, email, timezone)
    `)
    .eq("user_id", user.id)
    .lt("start_time", new Date().toISOString())
    .order("start_time", { ascending: false })
    .limit(5);

  // Get stats
  const { count: totalBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "ACCEPTED");

  const { count: eventTypeCount } = await supabase
    .from("event_types")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">Manage your bookings and schedule</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Upcoming</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {upcomingBookings?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalBookings || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Event Types</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {eventTypeCount || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingBookings && upcomingBookings.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {(upcomingBookings as BookingWithRelations[]).map((booking) => (
                <BookingItem key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No upcoming bookings</p>
              <p className="text-sm text-gray-400 mt-1">
                Share your booking link to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {pastBookings && pastBookings.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {(pastBookings as BookingWithRelations[]).map((booking) => (
                <BookingItem key={booking.id} booking={booking} isPast />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No past bookings</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface BookingWithRelations {
  id: string;
  uid: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  location_type: string;
  location_value: string | null;
  event_types: { title: string; length: number } | null;
  attendees: Array<{ name: string; email: string; timezone: string }>;
}

interface BookingItemProps {
  booking: BookingWithRelations;
  isPast?: boolean;
}

function BookingItem({ booking, isPast }: BookingItemProps) {
  const startTime = new Date(booking.start_time);
  const attendee = booking.attendees?.[0];

  return (
    <div className={`py-4 ${isPast ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-gray-900">{booking.title}</h4>
            <Badge variant={booking.status === "ACCEPTED" ? "success" : "default"}>
              {booking.status}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(startTime, "MMM d, yyyy")}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {format(startTime, "h:mm a")}
            </span>
            {attendee && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {attendee.name}
              </span>
            )}
          </div>
        </div>
        {booking.location_value && !isPast && (
          <a
            href={booking.location_value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Join meeting
          </a>
        )}
      </div>
    </div>
  );
}
