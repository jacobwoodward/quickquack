"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfDay, isBefore, isAfter } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Globe, ChevronLeft, ChevronRight, Check, Video, MapPin, Phone, Link as LinkIcon, CreditCard, Tag } from "lucide-react";
import type { User, EventType, Schedule, Availability } from "@/lib/types/database";

// Extended EventType with payment fields - using Omit to override the types
type EventTypeWithPayment = Omit<EventType, 'is_paid' | 'price_cents' | 'promo_code' | 'refund_window_hours'> & {
  is_paid: boolean;
  price_cents: number | null;
  promo_code: string | null;
  refund_window_hours: number;
};

interface BookingPageProps {
  user: User;
  eventType: EventTypeWithPayment;
  schedule: (Schedule & { availability: Availability[] }) | null;
}

const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

function getLocationIcon(type: string) {
  switch (type) {
    case "google_meet":
      return <Video className="w-4 h-4" />;
    case "in_person":
      return <MapPin className="w-4 h-4" />;
    case "phone":
      return <Phone className="w-4 h-4" />;
    case "link":
      return <LinkIcon className="w-4 h-4" />;
    default:
      return <Video className="w-4 h-4" />;
  }
}

function getLocationLabel(type: string) {
  switch (type) {
    case "google_meet":
      return "Google Meet";
    case "in_person":
      return "In-person";
    case "phone":
      return "Phone call";
    case "link":
      return "Video call";
    default:
      return type;
  }
}

export function BookingPage({ user, eventType, schedule }: BookingPageProps) {
  const [step, setStep] = useState<"date" | "time" | "form" | "confirmed">("date");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_bookingUid, setBookingUid] = useState<string | null>(null);
  const [_meetingUrl, setMeetingUrl] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Payment helpers
  const isPaidEvent = eventType.is_paid && eventType.price_cents && eventType.price_cents > 0;
  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  // Calculate booking window boundaries
  const today = startOfDay(new Date());
  const maxBookingDate = eventType.booking_window_days
    ? addDays(today, eventType.booking_window_days)
    : null;

  // Check if a date is within the booking window
  const isDateWithinBookingWindow = (date: Date) => {
    const dateStart = startOfDay(date);
    if (isBefore(dateStart, today)) return false;
    if (maxBookingDate && isAfter(dateStart, maxBookingDate)) return false;
    return true;
  };

  // Find next/previous available date
  const findNextAvailableDate = (fromDate: Date, direction: 1 | -1): Date | null => {
    let current = addDays(fromDate, direction);
    const maxIterations = 365; // Prevent infinite loop
    let iterations = 0;

    while (iterations < maxIterations) {
      const dayOfWeek = current.getDay();
      const hasAvailability = schedule?.availability?.some(
        (a) => a.day_of_week === dayOfWeek
      );

      if (hasAvailability && isDateWithinBookingWindow(current)) {
        return current;
      }

      current = addDays(current, direction);
      iterations++;

      // Stop if we've gone past the booking window
      if (maxBookingDate && direction === 1 && isAfter(current, maxBookingDate)) {
        return null;
      }
      // Stop if we've gone before today
      if (direction === -1 && isBefore(current, today)) {
        return null;
      }
    }
    return null;
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();

    const days: Array<{ date: Date; isCurrentMonth: boolean; isAvailable: boolean }> = [];

    // Add padding for previous month
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = addDays(firstDay, -i - 1);
      days.push({ date, isCurrentMonth: false, isAvailable: false });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const dayOfWeek = date.getDay();
      const hasAvailability = schedule?.availability?.some(
        (a) => a.day_of_week === dayOfWeek
      );
      const withinWindow = isDateWithinBookingWindow(date);
      days.push({
        date,
        isCurrentMonth: true,
        isAvailable: withinWindow && !!hasAvailability,
      });
    }

    // Add padding for next month
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const date = addDays(lastDay, i);
      days.push({ date, isCurrentMonth: false, isAvailable: false });
    }

    return days;
  };

  // Fetch available slots when date is selected
  useEffect(() => {
    if (!selectedDate) return;

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const response = await fetch(
          `/api/slots?eventTypeId=${eventType.id}&date=${format(selectedDate, "yyyy-MM-dd")}&timezone=${TIMEZONE}`
        );
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      } catch (err) {
        console.error("Failed to fetch slots:", err);
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDate, eventType.id]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setStep("time");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // If this is a paid event, first check promo code or create checkout
      if (isPaidEvent) {
        const checkoutResponse = await fetch("/api/stripe/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventTypeId: eventType.id,
            date: format(selectedDate, "yyyy-MM-dd"),
            time: selectedTime,
            timezone: TIMEZONE,
            name,
            email,
            notes,
            promoCode: promoCode.trim() || undefined,
          }),
        });

        const checkoutData = await checkoutResponse.json();

        if (!checkoutResponse.ok) {
          throw new Error(checkoutData.error || "Failed to initiate payment");
        }

        // If promo code was valid, proceed with free booking
        if (checkoutData.freeBooking) {
          // Fall through to create free booking below
        } else if (checkoutData.checkoutUrl) {
          // Redirect to Stripe Checkout
          window.location.href = checkoutData.checkoutUrl;
          return;
        }
      }

      // Free booking (no payment required, or valid promo code)
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventTypeId: eventType.id,
          date: format(selectedDate, "yyyy-MM-dd"),
          time: selectedTime,
          timezone: TIMEZONE,
          name,
          email,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      setBookingUid(data.uid);
      setMeetingUrl(data.meetingUrl);
      setStep("confirmed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="overflow-hidden">
          <div className="md:flex">
            {/* Left sidebar - Event info */}
            <div className="md:w-1/3 p-6 bg-gray-50 border-r border-gray-200">
              <div className="space-y-4">
                {user.avatar_url && (
                  <img
                    src={user.avatar_url}
                    alt={user.name || ""}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <p className="text-sm text-gray-500">{user.name}</p>
                  <h1 className="text-xl font-bold text-gray-900">
                    {eventType.title}
                  </h1>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{eventType.length} minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getLocationIcon(eventType.location_type)}
                    <span>{getLocationLabel(eventType.location_type)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>{TIMEZONE}</span>
                  </div>
                  {isPaidEvent && eventType.price_cents && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>{formatPrice(eventType.price_cents)}</span>
                    </div>
                  )}
                </div>

                {eventType.description && (
                  <p className="text-sm text-gray-500 pt-4 border-t border-gray-200">
                    {eventType.description}
                  </p>
                )}

                {selectedDate && selectedTime && step !== "date" && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-gray-600">{selectedTime}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right side - Calendar/Form */}
            <div className="md:w-2/3 p-6">
              {step === "date" && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a Date</h2>

                  {/* Calendar header */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() =>
                        setCurrentMonth(
                          new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                        )
                      }
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-900"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-medium text-gray-900">
                      {format(currentMonth, "MMMM yyyy")}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentMonth(
                          new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                        )
                      }
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-900"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-medium text-gray-500 py-2"
                      >
                        {day}
                      </div>
                    ))}
                    {calendarDays.map((day, index) => (
                      <button
                        key={index}
                        onClick={() => day.isAvailable && handleDateSelect(day.date)}
                        disabled={!day.isAvailable}
                        className={`
                          aspect-square p-2 text-sm rounded-lg transition-colors
                          ${!day.isCurrentMonth ? "text-gray-300" : ""}
                          ${day.isAvailable
                            ? "hover:bg-blue-100 text-gray-900 font-medium cursor-pointer"
                            : "text-gray-400 cursor-not-allowed"
                          }
                          ${
                            selectedDate &&
                            format(day.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : ""
                          }
                        `}
                      >
                        {format(day.date, "d")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === "time" && selectedDate && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setStep("date")}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Back to calendar"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {format(selectedDate, "EEEE, MMMM d")}
                      </h2>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const prevDate = findNextAvailableDate(selectedDate, -1);
                          if (prevDate) {
                            setSelectedDate(prevDate);
                            setSelectedTime(null);
                          }
                        }}
                        disabled={!findNextAvailableDate(selectedDate, -1)}
                        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Previous available date"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          const nextDate = findNextAvailableDate(selectedDate, 1);
                          if (nextDate) {
                            setSelectedDate(nextDate);
                            setSelectedTime(null);
                          }
                        }}
                        disabled={!findNextAvailableDate(selectedDate, 1)}
                        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Next available date"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {isLoadingSlots ? (
                    <div className="text-center py-8 text-gray-500">
                      Loading available times...
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {availableSlots.map((time) => (
                        <button
                          key={time}
                          onClick={() => handleTimeSelect(time)}
                          className={`
                            py-3 px-4 text-sm font-medium rounded-lg border transition-colors
                            ${
                              selectedTime === time
                                ? "bg-blue-600 text-white border-blue-600"
                                : "border-gray-300 text-gray-900 hover:border-blue-500 hover:bg-blue-50"
                            }
                          `}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No available times for this date
                    </div>
                  )}
                </div>
              )}

              {step === "form" && selectedDate && selectedTime && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setStep("time")}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-semibold text-gray-900">Enter your details</h2>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        {error}
                      </div>
                    )}

                    <Input
                      label="Your name"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />

                    <Input
                      label="Email address"
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />

                    <Textarea
                      label="Additional notes (optional)"
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Please share anything that will help prepare for our meeting."
                    />

                    {isPaidEvent && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <label
                            htmlFor="promoCode"
                            className="text-sm font-medium text-gray-700"
                          >
                            Promo code (optional)
                          </label>
                        </div>
                        <input
                          type="text"
                          id="promoCode"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="Enter code for free booking"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    )}

                    {isPaidEvent && eventType.price_cents && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Total</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {formatPrice(eventType.price_cents)}
                        </span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting
                        ? "Processing..."
                        : isPaidEvent
                        ? "Continue to Payment"
                        : "Schedule Meeting"}
                    </Button>
                  </form>
                </div>
              )}

              {step === "confirmed" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    You&apos;re scheduled!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    A calendar invitation has been sent to your email address.
                  </p>

                  {selectedDate && selectedTime && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <p className="font-medium text-gray-900">
                        {eventType.title}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(selectedDate, "EEEE, MMMM d, yyyy")} at {selectedTime}
                      </p>
                      <p className="text-sm text-gray-600">
                        {eventType.length} minutes
                      </p>
                    </div>
                  )}

                  <p className="text-sm text-gray-500">
                    Check your email for meeting details and calendar invite.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
