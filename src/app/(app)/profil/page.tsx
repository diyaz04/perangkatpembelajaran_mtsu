import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { Mail, School, Award, Hash } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Profil Saya",
};

export const dynamic = "force-dynamic";

export default async function ProfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? ((await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()) as {
        data: Profile | null;
      })
    : { data: null };

  const nama = profile?.nama_lengkap ?? user?.email?.split("@")[0] ?? "Guru";
  const roleLabelMap = {
    admin: "Administrator",
    kepala: "Kepala Madrasah",
    waka_kurikulum: "Waka Kurikulum",
    guru: "Guru Mata Pelajaran",
  };
  const roleLabel = profile ? roleLabelMap[profile.role] : "Guru Mata Pelajaran";

  return (
    <div className="flex-1 p-6 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Profil Guru</h1>
        <p className="text-sm text-slate-500 mt-1">
          Informasi identitas guru penyusun perangkat ajar di MTs KH A Wahab Muhsin
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-slate-900">
                  {nama}
                  {profile?.gelar ? `, ${profile.gelar}` : ""}
                </CardTitle>
                <CardDescription className="text-slate-500">
                  {roleLabel}
                </CardDescription>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Fase D (MTs)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Mail className="h-4 w-4 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Email Akun</p>
                  <p className="font-medium text-slate-900">{user?.email ?? "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <School className="h-4 w-4 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Madrasah</p>
                  <p className="font-medium text-slate-900">
                    MTs KH A Wahab Muhsin
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Hash className="h-4 w-4 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">NIP</p>
                  <p className="font-medium text-slate-900">
                    {profile?.nip || "Belum diisi"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Award className="h-4 w-4 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Peran Sistem</p>
                  <p className="font-medium text-slate-900">
                    {roleLabel}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
