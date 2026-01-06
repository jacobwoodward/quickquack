import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xeneiphimncmnuozfavw.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlbmVpcGhpbW5jbW51b3pmYXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDkyMzQsImV4cCI6MjA4MzI4NTIzNH0.xfFmWqDp0QxnydQw1SYYghBOR3eCg6fzOilf9EuNCC4";

export function createClient() {
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
}
