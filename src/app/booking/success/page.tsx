"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle, Calendar, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface BookingInfo {
  uid: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string | null;
  eventType: string | null;
}

type BookingStatus = "loading" | "pending" | "confirmed" | "failed" | "timeout";

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<BookingStatus>("loading");
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [pollCount, setPollCount] = useState(0);

  const MAX_POLLS = 20; // 20 polls * 1.5 seconds = 30 seconds max wait
  const POLL_INTERVAL = 1500;

  const checkBookingStatus = useCallback(async () => {
    if (!sessionId) {
      setStatus("failed");
      return;
    }

    try {
      const response = await fetch(`/api/bookings/status?session_id=${sessionId}`);
      const data = await response.json();

      if (data.status === "confirmed") {
        setStatus("confirmed");
        setBooking(data.booking);
        return true; // Stop polling
      } else if (data.status === "failed") {
        setStatus("failed");
        return true; // Stop polling
      } else if (data.status === "pending" || data.status === "not_found") {
        // Keep polling - webhook might not have fired yet
        return false;
      }
    } catch (error) {
      console.error("Failed to check booking status:", error);
    }
    return false;
  }, [sessionId]);

  useEffect(() => {
    // Handle missing sessionId case - use a microtask to avoid synchronous setState warning
    if (!sessionId) {
      const timer = setTimeout(() => setStatus("failed"), 0);
      return () => clearTimeout(timer);
    }

    let timeoutId: NodeJS.Timeout;
    let isMounted = true;

    const poll = async () => {
      const shouldStop = await checkBookingStatus();

      if (!isMounted) return;

      if (!shouldStop && pollCount < MAX_POLLS) {
        setPollCount((prev) => prev + 1);
        timeoutId = setTimeout(poll, POLL_INTERVAL);
      } else if (!shouldStop && pollCount >= MAX_POLLS) {
        // Timed out waiting for webhook
        setStatus("timeout");
      }
    };

    poll();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [sessionId, pollCount, checkBookingStatus]);

  if (status === "loading" || status === "pending") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">
            Confirming your booking...
          </h1>
          <p className="text-gray-600 mt-2">
            Please wait while we finalize your reservation.
          </p>
          <p className="text-sm text-gray-400 mt-4">
            This usually takes just a few seconds.
          </p>
        </div>
      </div>
    );
  }

  if (status === "timeout") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Taking Longer Than Expected
            </h1>
            <p className="text-gray-600 mb-6">
              Your payment was successful, but we&apos;re still processing your booking.
              You should receive a confirmation email shortly.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              If you don&apos;t receive an email within a few minutes, please contact support.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Return home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something Went Wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t confirm your booking. If you were charged, please contact support for assistance.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Return home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // status === "confirmed"
  const startTime = booking?.startTime ? new Date(booking.startTime) : null;
  const endTime = booking?.endTime ? new Date(booking.endTime) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-gray-600 mb-6">
            Your meeting has been scheduled successfully.
          </p>

          {booking && startTime && (
            <div className="space-y-3 text-left bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900">
                {booking.eventType || booking.title}
              </h3>

              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{format(startTime, "EEEE, MMMM d, yyyy")}</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>
                  {format(startTime, "h:mm a")}
                  {endTime && ` - ${format(endTime, "h:mm a")}`}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2 text-sm text-gray-500">
            <p>A confirmation email has been sent with all the details.</p>
            <p>You can reschedule or cancel using the links in your email.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900">Loading...</h1>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BookingSuccessContent />
    </Suspense>
  );
}
