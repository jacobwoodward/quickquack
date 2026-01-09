import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";

// Shared cookie options for persistent sessions (1 year)
const cookieOptions = {
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables. " +
      "Visit /setup for configuration help."
    );
  }

  return { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey };
}

export async function createClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...cookieOptions, ...options })
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

export async function createServiceClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getSupabaseConfig();
  const cookieStore = await cookies();

  if (!supabaseServiceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY environment variable. " +
      "This is required for admin operations. Visit /setup for configuration help."
    );
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...cookieOptions, ...options })
            );
          } catch {
            // Ignored
          }
        },
      },
    }
  );
}
