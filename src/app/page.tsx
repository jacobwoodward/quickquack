import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video, Zap } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to dashboard if logged in
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Cal-Lite</span>
            </div>
            <Link href="/login">
              <Button variant="primary">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight">
              Simple scheduling
              <br />
              <span className="text-blue-600">made lightweight</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
              A fast, focused scheduling tool. Connect your Google Calendar,
              create event types, and let people book meetings with you.
            </p>
            <div className="mt-10">
              <Link href="/login">
                <Button size="lg" className="text-lg px-8 py-4">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>

          {/* Features */}
          <div className="mt-24 grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Set Your Availability
              </h3>
              <p className="text-gray-600">
                Define your working hours and let Cal-Lite show only the times you&apos;re free.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Video className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Auto Google Meet
              </h3>
              <p className="text-gray-600">
                Automatically create Google Meet links for every booking. No setup required.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Lightning Fast
              </h3>
              <p className="text-gray-600">
                Built for speed. No bloat, no unnecessary features. Just scheduling that works.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-24">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              How it works
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: "1", title: "Sign in with Google", desc: "Connect your Google account to sync your calendar" },
                { step: "2", title: "Create event types", desc: "Set up different meeting types with custom durations" },
                { step: "3", title: "Share your link", desc: "Send your booking page to anyone who needs to meet" },
                { step: "4", title: "Get booked", desc: "Meetings appear on your calendar automatically" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-sm">
            <p>Cal-Lite - A lightweight scheduling tool</p>
            <p className="mt-2">Built with Next.js, Supabase, and Google Calendar</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
