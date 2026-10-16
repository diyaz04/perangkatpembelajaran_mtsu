import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Supabase Admin Client menggunakan SUPABASE_SERVICE_ROLE_KEY.
 * PENTING: Hanya boleh dijalankan di sisi server (Server Actions / Route Handlers).
 * Jangan pernah mengekspos client ini ke sisi browser/klien!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Konfigurasi Supabase Admin belum lengkap: pastikan NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY telah diatur di environment variable."
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
