/**
 * Server Supabase client (service role). Keep this key secret.
 */
import { createClient } from "@supabase/supabase-js";

export const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
