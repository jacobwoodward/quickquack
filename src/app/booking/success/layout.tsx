import { createServiceClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createServiceClient();

  // Get the single user
  const { data: userDataRaw } = await supabase
    .from("users")
    .select("id, name")
    .limit(1)
    .single();

  const userData = userDataRaw as { id: string; name: string | null } | null;

  if (!userData) {
    return { title: { absolute: "Booking Confirmed" } };
  }

  // Get page settings for the user's configured title
  const { data: pageSettingsData } = await supabase
    .from("page_settings")
    .select("page_title")
    .eq("user_id", userData.id)
    .single();

  const pageSettings = pageSettingsData as { page_title: string | null } | null;

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
