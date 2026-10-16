import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { PenggunaClient, type PenggunaRow } from "./pengguna-client";
import type { UserRole } from "@/types/database";

export const metadata = {
  title: "Manajemen Pengguna & Guru",
};

export const dynamic = "force-dynamic";

export default async function KelolaPenggunaPage() {
  // 1. Guard server-side: hanya role 'admin' yang dapat membuka halaman ini
  const session = await requireRole(["admin"]);

  // 2. Ambil data profil & auth users melalui admin client
  const adminClient = createAdminClient();

  const [profilesRes, usersRes] = await Promise.all([
    adminClient.from("profiles").select("*").order("created_at", { ascending: false }),
    adminClient.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const authUsersMap = new Map<string, string>();
  if (usersRes.data?.users) {
    for (const u of usersRes.data.users) {
      if (u.email) {
        authUsersMap.set(u.id, u.email);
      }
    }
  }

  const users: PenggunaRow[] = (profilesRes.data || []).map((p) => ({
    id: p.id,
    nama_lengkap: p.nama_lengkap,
    nip: p.nip,
    gelar: p.gelar,
    email: authUsersMap.get(p.id) || "-",
    role: p.role as UserRole,
    aktif: p.aktif,
    created_at: p.created_at,
  }));

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Manajemen Pengguna & Guru"
        description="Pendaftaran akun guru dan staf, pengaturan hak akses, reset kata sandi, dan status keaktifan"
        badge={
          <Badge className="bg-purple-50 text-purple-700 border-purple-200">
            Khusus Admin
          </Badge>
        }
      />

      <PenggunaClient initialUsers={users} currentUserId={session.user.id} />
    </div>
  );
}
