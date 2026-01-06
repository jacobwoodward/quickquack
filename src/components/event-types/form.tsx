"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { EventType, LocationType } from "@/lib/types/database";

interface EventTypeFormProps {
  eventType?: EventType;
}

const durationOptions = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "60 minutes" },
  { value: "90", label: "90 minutes" },
  { value: "120", label: "2 hours" },
];

const locationOptions = [
  { value: "google_meet", label: "Google Meet (auto-generated)" },
  { value: "link", label: "Custom video link" },
  { value: "phone", label: "Phone call" },
  { value: "in_person", label: "In-person meeting" },
];

const bufferOptions = [
  { value: "0", label: "No buffer" },
  { value: "5", label: "5 minutes" },
  { value: "10", label: "10 minutes" },
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
];

const noticeOptions = [
  { value: "0", label: "No minimum notice" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
  { value: "240", label: "4 hours" },
  { value: "1440", label: "1 day" },
  { value: "2880", label: "2 days" },
];

const bookingWindowOptions = [
  { value: "", label: "No limit" },
  { value: "7", label: "1 week" },
  { value: "14", label: "2 weeks" },
  { value: "30", label: "1 month" },
  { value: "60", label: "2 months" },
  { value: "90", label: "3 months" },
  { value: "180", label: "6 months" },
  { value: "365", label: "1 year" },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function EventTypeForm({ eventType }: EventTypeFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(eventType?.title || "");
  const [slug, setSlug] = useState(eventType?.slug || "");
  const [description, setDescription] = useState(eventType?.description || "");
  const [length, setLength] = useState(String(eventType?.length || 30));
  const [locationType, setLocationType] = useState<LocationType>(
    eventType?.location_type || "google_meet"
  );
  const [locationValue, setLocationValue] = useState(
    eventType?.location_value || ""
  );
  const [bufferBefore, setBufferBefore] = useState(
    String(eventType?.buffer_time_before || 0)
  );
  const [bufferAfter, setBufferAfter] = useState(
    String(eventType?.buffer_time_after || 0)
  );
  const [minimumNotice, setMinimumNotice] = useState(
    String(eventType?.minimum_notice || 60)
  );
  const [bookingWindowDays, setBookingWindowDays] = useState(
    eventType?.booking_window_days ? String(eventType.booking_window_days) : ""
  );
  const [hidden, setHidden] = useState(eventType?.hidden || false);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!eventType) {
      setSlug(slugify(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setIsLoading(false);
      return;
    }

    const data = {
      user_id: user.id,
      title,
      slug,
      description: description || null,
      length: parseInt(length),
      location_type: locationType,
      location_value: locationValue || null,
      buffer_time_before: parseInt(bufferBefore),
      buffer_time_after: parseInt(bufferAfter),
      minimum_notice: parseInt(minimumNotice),
      booking_window_days: bookingWindowDays ? parseInt(bookingWindowDays) : null,
      hidden,
    };

    if (eventType) {
      // Update existing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("event_types")
        .update(data)
        .eq("id", eventType.id);

      if (updateError) {
        setError(updateError.message);
        setIsLoading(false);
        return;
      }
    } else {
      // Create new
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabase as any)
        .from("event_types")
        .insert(data);

      if (insertError) {
        if (insertError.code === "23505") {
          setError("An event type with this slug already exists");
        } else {
          setError(insertError.message);
        }
        setIsLoading(false);
        return;
      }
    }

    router.push("/event-types");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-6 pt-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Input
            label="Title"
            id="title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="30 Minute Meeting"
            required
          />

          <Input
            label="URL Slug"
            id="slug"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="30-minute-meeting"
            required
          />

          <Textarea
            label="Description"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A quick 30 minute call to discuss your needs..."
          />

          <Select
            label="Duration"
            id="length"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            options={durationOptions}
          />

          <div className="space-y-4">
            <Select
              label="Location"
              id="locationType"
              value={locationType}
              onChange={(e) => setLocationType(e.target.value as LocationType)}
              options={locationOptions}
            />

            {(locationType === "link" ||
              locationType === "phone" ||
              locationType === "in_person") && (
              <Input
                label={
                  locationType === "link"
                    ? "Meeting URL"
                    : locationType === "phone"
                    ? "Phone Number"
                    : "Address"
                }
                id="locationValue"
                value={locationValue}
                onChange={(e) => setLocationValue(e.target.value)}
                placeholder={
                  locationType === "link"
                    ? "https://zoom.us/j/..."
                    : locationType === "phone"
                    ? "+1 (555) 123-4567"
                    : "123 Main St, City, State"
                }
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Buffer before"
              id="bufferBefore"
              value={bufferBefore}
              onChange={(e) => setBufferBefore(e.target.value)}
              options={bufferOptions}
            />

            <Select
              label="Buffer after"
              id="bufferAfter"
              value={bufferAfter}
              onChange={(e) => setBufferAfter(e.target.value)}
              options={bufferOptions}
            />
          </div>

          <Select
            label="Minimum notice"
            id="minimumNotice"
            value={minimumNotice}
            onChange={(e) => setMinimumNotice(e.target.value)}
            options={noticeOptions}
          />

          <Select
            label="Booking window"
            id="bookingWindowDays"
            value={bookingWindowDays}
            onChange={(e) => setBookingWindowDays(e.target.value)}
            options={bookingWindowOptions}
          />
          <p className="text-sm text-gray-500 -mt-4">
            How far in advance can people book this event?
          </p>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hidden"
              checked={hidden}
              onChange={(e) => setHidden(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="hidden" className="text-sm text-gray-700">
              Hide this event type (won&apos;t appear on your public page)
            </label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : eventType
              ? "Save Changes"
              : "Create Event Type"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
