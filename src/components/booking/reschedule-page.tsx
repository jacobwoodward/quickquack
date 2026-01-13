"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Globe, ChevronLeft, ChevronRight, Check, ArrowRight } from "lucide-react";
import type { Booking, EventType, Schedule, Availability, Attendee } from "@/lib/types/database";

interface ReschedulePageProps {
  booking: Booking;
  eventType: EventType;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar_url: string | null;
    timezone: string;
  };
  schedule: (Schedule & { availability: Availability[] }) | null;
  attendee?: Attendee;
}

const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function ReschedulePage({
  booking,
  eventType,
  user,
  schedule,
  attendee: _attendee,
}: ReschedulePageProps) {
  const [step, setStep] = useState<"date" | "time" | "confirmed">("date");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const originalStartTime = toZonedTime(new Date(booking.start_time), TIMEZONE);

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();

    const days: Array<{ date: Date; isCurrentMonth: boolean; isAvailable: boolean }> = [];

    for (let i = startPadding - 1; i >= 0; i--) {
      const date = addDays(firstDay, -i - 1);
      days.push({ date, isCurrentMonth: false, isAvailable: false });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const dayOfWeek = date.getDay();
      const isInFuture = date >= startOfDay(new Date());
      const hasAvailability = schedule?.availability?.some(
        (a) => a.day_of_week === dayOfWeek
      );
      days.push({
        date,
        isCurrentMonth: true,
        isAvailable: isInFuture && !!hasAvailability,
      });
    }

    const remainingDays = 42 - days.length;
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
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${booking.uid}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: format(selectedDate, "yyyy-MM-dd"),
          time: selectedTime,
          timezone: TIMEZONE,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reschedule booking");
      }

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
            {/* Left sidebar */}
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
                    Reschedule: {eventType.title}
                  </h1>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{eventType.length} minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>{TIMEZONE}</span>
                  </div>
                </div>

                {/* Original booking */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Original time:</p>
                  <p className="text-sm font-medium text-gray-600 line-through">
                    {format(originalStartTime, "EEEE, MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-gray-600 line-through">
                    {format(originalStartTime, "h:mm a")}
                  </p>
                </div>

                {/* New time selection */}
                {selectedDate && selectedTime && (
                  <div className="pt-4">
                    <div className="flex items-center gap-2 text-green-600 mb-1">
                      <ArrowRight className="w-4 h-4" />
                      <span className="text-sm font-medium">New time:</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-gray-600">{selectedTime}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="md:w-2/3 p-6">
              {step === "date" && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Select a New Date</h2>

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
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setStep("date")}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {format(selectedDate, "EEEE, MMMM d")}
                    </h2>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  {isLoadingSlots ? (
                    <div className="text-center py-8 text-gray-500">
                      Loading available times...
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <>
                      <div className="grid grid-cols-3 gap-2 mb-6">
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

                      {selectedTime && (
                        <Button
                          onClick={handleReschedule}
                          disabled={isSubmitting}
                          className="w-full"
                        >
                          {isSubmitting ? "Rescheduling..." : "Confirm Reschedule"}
                        </Button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No available times for this date
                    </div>
                  )}
                </div>
              )}

              {step === "confirmed" && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Rescheduled!
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Your meeting has been rescheduled. An updated calendar invitation
                    has been sent.
                  </p>

                  {selectedDate && selectedTime && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="font-medium text-gray-900">{eventType.title}</p>
                      <p className="text-sm text-gray-600">
                        {format(selectedDate, "EEEE, MMMM d, yyyy")} at {selectedTime}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
