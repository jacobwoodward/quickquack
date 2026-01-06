import { createClient } from "@/lib/supabase/server";
import { EventTypeForm } from "@/components/event-types/form";
import { notFound } from "next/navigation";

interface EditEventTypePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventTypePage({ params }: EditEventTypePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: eventType } = await supabase
    .from("event_types")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!eventType) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Event Type</h1>
        <p className="mt-1 text-gray-600">
          Update your event type settings
        </p>
      </div>
      <EventTypeForm eventType={eventType} />
    </div>
  );
}
