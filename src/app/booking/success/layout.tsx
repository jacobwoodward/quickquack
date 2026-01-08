import { createServiceClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createServiceClient();

  // Get the single user
  const { data: userData } = await supabase
    .from("users")
    .select("id, name")
    .limit(1)
    .single();

  if (!userData) {
    return { title: { absolute: "Booking Confirmed" } };
  }

  // Get page settings for the user's configured title
  const { data: pageSettings } = await supabase
    .from("page_settings")
    .select("page_title")
    .eq("user_id", userData.id)
    .single();

  const siteTitle = pageSettings?.page_title || userData.name || "Booking";

  return {
    title: {
      absolute: `Booking Confirmed | ${siteTitle}`,
    },
  };
}

export default function BookingSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
