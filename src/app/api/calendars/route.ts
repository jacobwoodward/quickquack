import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGoogleCalendarService } from "@/lib/google/calendar";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const calendarService = await getGoogleCalendarService(user.id);

    if (!calendarService) {
      return NextResponse.json(
        { error: "No calendar connected" },
        { status: 400 }
      );
    }

    const calendarList = await calendarService.getCalendarList();

    const calendars = calendarList.map((cal) => ({
      id: cal.id,
      summary: cal.summary,
      primary: cal.primary || false,
    }));

    return NextResponse.json({ calendars });
  } catch (error) {
    console.error("Failed to fetch calendars:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendars" },
      { status: 500 }
    );
  }
}
