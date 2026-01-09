import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { linkId } = await request.json();

    if (!linkId) {
      return NextResponse.json({ error: "Link ID required" }, { status: 400 });
    }

    const supabase = await createServiceClient();
    const headersList = await headers();

    // Get request metadata
    const referrer = headersList.get("referer") || null;
    const userAgent = headersList.get("user-agent") || null;

    // Insert click record (trigger will update click_count on links table)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("link_clicks").insert({
      link_id: linkId,
      referrer,
      user_agent: userAgent,
    });

    if (error) {
      console.error("Error tracking click:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking click:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
