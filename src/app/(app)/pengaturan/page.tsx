import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PengaturanClient } from "./pengaturan-client";

export const metadata = {
  title: "Pengaturan Akun & Profil",
};

export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  const session = await requireAuth();

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Pengaturan Akun & Profil"
        description="Kelola informasi identitas guru, kata sandi, dan periksa hak akses sistem"
      />

      <PengaturanClient profile={session.profile} userEmail={session.user.email || "-"} />

      {/* Referensi Dasar Regulasi Kurikulum */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-slate-900">Dasar Regulasi Kurikulum</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Landasan yuridis penyusunan perangkat pembelajaran di MTs KH A Wahab Muhsin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-slate-900 text-xs sm:text-sm">KMA 1503 Tahun 2025</span>
              <Badge variant="outline" className="text-[10px] border-slate-200">Regulasi Utama</Badge>
            </div>
            <p className="text-xs text-slate-600">
              Pedoman Kurikulum pada Madrasah dan Capaian Pembelajaran Fase D MTs.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-slate-900 text-xs sm:text-sm">Panduan Pembelajaran & Asesmen Kemenag (Nov 2025)</span>
              <Badge variant="outline" className="text-[10px] border-slate-200">Asesmen</Badge>
            </div>
            <p className="text-xs text-slate-600">
              Prinsip asesmen awal, proses, dan akhir (assessment as, for, and of learning).
            </p>
          </div>

          <div className="p-3 rounded-lg border border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-slate-900 text-xs sm:text-sm">Kepdirjen Pendis 6077/2025 & KMA 512/2026</span>
              <Badge variant="outline" className="text-[10px] border-slate-200">KBC & Pembelajaran Mendalam</Badge>
            </div>
            <p className="text-xs text-slate-600">
              Petunjuk Teknis Pembelajaran Mendalam dan Integrasi Kurikulum Berbasis Cinta (KBC).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
