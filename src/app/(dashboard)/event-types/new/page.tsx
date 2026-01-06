import { EventTypeForm } from "@/components/event-types/form";

export default function NewEventTypePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Event Type</h1>
        <p className="mt-1 text-gray-600">
          Set up a new event type for people to book
        </p>
      </div>
      <EventTypeForm />
    </div>
  );
}
