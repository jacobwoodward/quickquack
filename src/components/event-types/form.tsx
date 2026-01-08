"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { DollarSign, Info } from "lucide-react";
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

const refundWindowOptions = [
  { value: "0", label: "No refunds" },
  { value: "1", label: "1 hour before" },
  { value: "2", label: "2 hours before" },
  { value: "4", label: "4 hours before" },
  { value: "12", label: "12 hours before" },
  { value: "24", label: "24 hours before" },
  { value: "48", label: "48 hours before" },
  { value: "72", label: "72 hours before" },
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

  // Payment fields
  const [isPaid, setIsPaid] = useState(eventType?.is_paid || false);
  const [priceInDollars, setPriceInDollars] = useState(
    eventType?.price_cents ? String(eventType.price_cents / 100) : ""
  );
  const [refundWindowHours, setRefundWindowHours] = useState(
    String(eventType?.refund_window_hours || 24)
  );
  const [promoCode, setPromoCode] = useState(eventType?.promo_code || "");
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null);

  // Check if Stripe is configured
  useEffect(() => {
    async function checkStripe() {
      try {
        const res = await fetch("/api/stripe/status");
        const data = await res.json();
        setStripeConfigured(data.configured);
      } catch {
        setStripeConfigured(false);
      }
    }
    checkStripe();
  }, []);

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

    // Convert price from dollars to cents
    const priceCents = isPaid && priceInDollars
      ? Math.round(parseFloat(priceInDollars) * 100)
      : null;

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
      is_paid: isPaid,
      price_cents: priceCents,
      refund_window_hours: parseInt(refundWindowHours),
      promo_code: promoCode || null,
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

          {/* Payment Section */}
          {stripeConfigured !== null && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900">Payment Settings</h3>
              </div>

              {!stripeConfigured ? (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900">
                      Stripe not configured
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      To accept payments, add your Stripe API keys to your environment
                      variables. Visit the{" "}
                      <Link href="/payments" className="underline font-medium">
                        Payments page
                      </Link>{" "}
                      for setup instructions.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPaid"
                      checked={isPaid}
                      onChange={(e) => setIsPaid(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">
                      Require payment for this event type
                    </label>
                  </div>

                  {isPaid && (
                    <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                      <div>
                        <label
                          htmlFor="price"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Price (USD)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            $
                          </span>
                          <input
                            type="number"
                            id="price"
                            value={priceInDollars}
                            onChange={(e) => setPriceInDollars(e.target.value)}
                            placeholder="0.00"
                            min="0.50"
                            step="0.01"
                            required={isPaid}
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Minimum $0.50 (Stripe requirement)
                        </p>
                      </div>

                      <Select
                        label="Refund window"
                        id="refundWindowHours"
                        value={refundWindowHours}
                        onChange={(e) => setRefundWindowHours(e.target.value)}
                        options={refundWindowOptions}
                      />
                      <p className="text-xs text-gray-500 -mt-3">
                        Guests can get a full refund if they cancel before this time
                      </p>

                      <div>
                        <label
                          htmlFor="promoCode"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Promo code (optional)
                        </label>
                        <input
                          type="text"
                          id="promoCode"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="FREEMEETING"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Guests who enter this code can book for free
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
