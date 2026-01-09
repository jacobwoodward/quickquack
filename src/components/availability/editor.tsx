"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import type { Schedule, Availability } from "@/lib/types/database";

interface AvailabilityEditorProps {
  schedule: (Schedule & { availability: Availability[] }) | null;
  userId: string;
  timezone: string;
}

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const TIME_OPTIONS = generateTimeOptions();

function generateTimeOptions() {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      const label = formatTime(time);
      options.push({ value: time, label });
    }
  }
  return options;
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

interface DayAvailability {
  enabled: boolean;
  slots: Array<{ start: string; end: string }>;
}

type WeeklyAvailability = Record<number, DayAvailability>;

function initializeAvailability(
  existingAvailability: Availability[] | undefined
): WeeklyAvailability {
  const weekly: WeeklyAvailability = {};

  DAYS.forEach((day) => {
    weekly[day.value] = { enabled: false, slots: [] };
  });

  if (existingAvailability) {
    existingAvailability.forEach((slot) => {
      if (slot.day_of_week !== null) {
        if (!weekly[slot.day_of_week].enabled) {
          weekly[slot.day_of_week].enabled = true;
          weekly[slot.day_of_week].slots = [];
        }
        weekly[slot.day_of_week].slots.push({
          start: slot.start_time.slice(0, 5),
          end: slot.end_time.slice(0, 5),
        });
      }
    });
  }

  return weekly;
}

export function AvailabilityEditor({
  schedule,
  userId,
  timezone,
}: AvailabilityEditorProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [availability, setAvailability] = useState<WeeklyAvailability>(() =>
    initializeAvailability(schedule?.availability)
  );

  const toggleDay = (dayValue: number) => {
    setAvailability((prev) => ({
      ...prev,
      [dayValue]: {
        enabled: !prev[dayValue].enabled,
        slots: prev[dayValue].enabled
          ? []
          : [{ start: "09:00", end: "17:00" }],
      },
    }));
  };

  const addSlot = (dayValue: number) => {
    setAvailability((prev) => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        slots: [...prev[dayValue].slots, { start: "09:00", end: "17:00" }],
      },
    }));
  };

  const removeSlot = (dayValue: number, slotIndex: number) => {
    setAvailability((prev) => {
      const newSlots = prev[dayValue].slots.filter((_, i) => i !== slotIndex);
      return {
        ...prev,
        [dayValue]: {
          enabled: newSlots.length > 0,
          slots: newSlots,
        },
      };
    });
  };

  const updateSlot = (
    dayValue: number,
    slotIndex: number,
    field: "start" | "end",
    value: string
  ) => {
    setAvailability((prev) => ({
      ...prev,
      [dayValue]: {
        ...prev[dayValue],
        slots: prev[dayValue].slots.map((slot, i) =>
          i === slotIndex ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    const supabase = createClient();

    try {
      let scheduleId = schedule?.id;

      // Create schedule if it doesn't exist
      if (!scheduleId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newSchedule, error: scheduleError } = await (supabase as any)
          .from("schedules")
          .insert({
            user_id: userId,
            name: "Working Hours",
            timezone,
            is_default: true,
          })
          .select()
          .single();

        if (scheduleError) throw scheduleError;
        scheduleId = (newSchedule as { id: string }).id;
      }

      // Delete existing availability for this schedule
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("availability")
        .delete()
        .eq("schedule_id", scheduleId);

      // Insert new availability
      const availabilityRecords: Array<{
        schedule_id: string;
        day_of_week: number;
        start_time: string;
        end_time: string;
      }> = [];

      Object.entries(availability).forEach(([day, dayData]) => {
        if (dayData.enabled && dayData.slots.length > 0) {
          dayData.slots.forEach((slot) => {
            availabilityRecords.push({
              schedule_id: scheduleId!,
              day_of_week: parseInt(day),
              start_time: slot.start,
              end_time: slot.end,
            });
          });
        }
      });

      if (availabilityRecords.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: availError } = await (supabase as any)
          .from("availability")
          .insert(availabilityRecords);

        if (availError) throw availError;
      }

      router.refresh();
    } catch (error) {
      console.error("Error saving availability:", error);
      alert("Failed to save availability");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {DAYS.map((day) => (
          <div
            key={day.value}
            className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0"
          >
            <div className="w-32 flex items-center gap-3">
              <input
                type="checkbox"
                checked={availability[day.value].enabled}
                onChange={() => toggleDay(day.value)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span
                className={`text-sm font-medium ${
                  availability[day.value].enabled
                    ? "text-gray-900"
                    : "text-gray-400"
                }`}
              >
                {day.label}
              </span>
            </div>

            <div className="flex-1 space-y-2">
              {availability[day.value].enabled ? (
                <>
                  {availability[day.value].slots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex items-center gap-2">
                      <select
                        value={slot.start}
                        onChange={(e) =>
                          updateSlot(day.value, slotIndex, "start", e.target.value)
                        }
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {TIME_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <span className="text-gray-400">-</span>
                      <select
                        value={slot.end}
                        onChange={(e) =>
                          updateSlot(day.value, slotIndex, "end", e.target.value)
                        }
                        className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {TIME_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeSlot(day.value, slotIndex)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addSlot(day.value)}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="w-4 h-4" />
                    Add time slot
                  </button>
                </>
              ) : (
                <span className="text-sm text-gray-400">Unavailable</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
