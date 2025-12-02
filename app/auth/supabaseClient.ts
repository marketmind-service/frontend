import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dtmvefjanoeiduxxhxga.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0bXZlZmphbm9laWR1eHhoeGdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2MjkyMjYsImV4cCI6MjA4MDIwNTIyNn0.STwF1wJxdwjKKf5J3lDUzcevJ9dMynlGGi9FbNI1y-c";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
