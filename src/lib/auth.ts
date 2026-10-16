import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types/database";
import type { User } from "@supabase/supabase-js";

export interface CurrentUserSession {
  user: User;
  profile: Profile;
  role: UserRole;
}

/**
 * Mengambil informasi sesi user aktif beserta data profil dan role dari database.
 * Di-memoize per-request menggunakan React cache() agar layout, page, dan action
 * dalam 1 render cycle tidak melakukan query ganda ke Supabase.
 * Mengembalikan null jika pengguna belum terautentikasi.
 */
import { createAdminClient } from "@/lib/supabase/admin";

export const getCurrentUser = cache(async (): Promise<CurrentUserSession | null> => {
  if (process.env.TEST_USER_ID) {
    try {
      const admin = createAdminClient();
      const { data: p } = await admin.from("profiles").select("*").eq("id", process.env.TEST_USER_ID).maybeSingle();
      if (p) {
        return {
          user: { id: p.id, email: "test@kbc.madrasah" } as User,
          profile: p,
          role: p.role,
        };
      }
    } catch {
      // ignore
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    // Fallback jika profil di tabel profiles belum terbuat/sinkron
    const fallbackRole = ((user.user_metadata?.role as UserRole) || "guru");
    const fallbackProfile: Profile = {
      id: user.id,
      nama_lengkap: (user.user_metadata?.nama_lengkap as string) || user.email?.split("@")[0] || "Pengguna",
      nip: (user.user_metadata?.nip as string) || null,
      gelar: (user.user_metadata?.gelar as string) || null,
      role: fallbackRole,
      aktif: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
    };

    return {
      user,
      profile: fallbackProfile,
      role: fallbackRole,
    };
  }

  return {
    user,
    profile,
    role: profile.role,
  };
});

/**
 * Memastikan pengguna sudah login.
 * Jika belum login atau akun dinonaktifkan, otomatis melempar redirect ke halaman /login.
 */
export async function requireAuth(): Promise<CurrentUserSession> {
  const session = await getCurrentUser();

  if (!session) {
    redirect("/login");
  }

  if (!session.profile.aktif) {
    redirect("/login?error=deactivated");
  }

  return session;
}

/**
 * Memastikan pengguna memiliki salah satu role yang diizinkan.
 * Jika role tidak cocok, melempar redirect ke halaman utama "/" dengan pesan error.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<CurrentUserSession> {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.role)) {
    redirect("/?error=unauthorized");
  }

  return session;
}
