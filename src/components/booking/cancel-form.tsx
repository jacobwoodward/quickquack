"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CancelBookingFormProps {
  bookingUid: string;
}

export function CancelBookingForm({ bookingUid }: CancelBookingFormProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${bookingUid}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel booking");
      }

      setIsCancelled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCancelled) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Booking Cancelled
        </h3>
        <p className="text-gray-600">
          Your booking has been cancelled. A confirmation email has been sent.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Textarea
        label="Reason for cancellation (optional)"
        id="reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Let the host know why you're cancelling..."
      />

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
          disabled={isLoading}
        >
          Go Back
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleCancel}
          className="flex-1"
          disabled={isLoading}
        >
          {isLoading ? "Cancelling..." : "Cancel Booking"}
        </Button>
      </div>
    </div>
  );
}
