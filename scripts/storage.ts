// The attachments bucket for command-line scripts (lib/uploads/storage.ts is server-only, for the app).
import { createClient } from "@supabase/supabase-js";

export function attachmentsBucket() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client.storage.from(process.env.SUPABASE_BUCKET || "attachments");
}
