import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAppUrl } from "@/lib/config";
import { validateRedirectUrl } from "@/lib/utils/redirect";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = validateRedirectUrl(searchParams.get("redirectTo"));
  const appUrl = getAppUrl();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get the session to store Google tokens
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.provider_token && session?.provider_refresh_token) {
        // Store Google Calendar credentials
        const { data: user } = await supabase.auth.getUser();

        if (user?.user) {
          // Check if credentials already exist
          const { data: existingCredData } = await supabase
            .from("credentials")
            .select("id")
            .eq("user_id", user.user.id)
            .eq("type", "google_calendar")
            .single();

          const existingCred = existingCredData as { id: string } | null;

          if (existingCred) {
            // Update existing credentials
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any)
              .from("credentials")
              .update({
                key: {
                  access_token: session.provider_token,
                  refresh_token: session.provider_refresh_token,
                  expiry_date: session.expires_at ? session.expires_at * 1000 : null,
                },
              })
              .eq("id", existingCred.id);
          } else {
            // Insert new credentials
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase as any).from("credentials").insert({
              user_id: user.user.id,
              type: "google_calendar",
              key: {
                access_token: session.provider_token,
                refresh_token: session.provider_refresh_token,
                expiry_date: session.expires_at ? session.expires_at * 1000 : null,
              },
            });
          }
        }
      }

      return NextResponse.redirect(`${appUrl}${redirectTo}`);
    }
  }

  // Return error page
  return NextResponse.redirect(`${appUrl}/login?error=auth_failed`);
}
