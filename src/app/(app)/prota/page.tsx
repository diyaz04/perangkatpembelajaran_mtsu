import Link from "next/link";
import { getProtaPenugasanListAction } from "./actions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import {
  Calendar,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  GraduationCap,
  Scale,
} from "lucide-react";

export const metadata = {
  title: "Program Tahunan (Prota) | SIM Perangkat Pembelajaran KBC",
  description: "Analisis Minggu Efektif dan Distribusi Alokasi Waktu Program Tahunan Kurikulum Berbasis Cinta",
};

export default async function ProtaPage() {
  const result = await getProtaPenugasanListAction();
  const penugasanList = result.success ? result.data : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "disetujui":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Disetujui
          </Badge>
        );
      case "diajukan":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Diajukan
          </Badge>
        );
      case "revisi":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Revisi
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200">
            Draf
          </Badge>
        );
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Program Tahunan (Prota)"
        description="Analisis alokasi minggu efektif madrasah (KMA 1503/2025) dan distribusi alokasi waktu tahunan terintegrasi Kurikulum Berbasis Cinta"
        actions={
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 gap-1.5 py-1 px-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Terhubung Kalender & ATP
          </Badge>
        }
      />

      {penugasanList.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Belum Ada Penugasan Mengajar Aktif"
          description={
            result.error ||
            "Anda belum memiliki penugasan mengajar di tahun ajaran aktif, atau admin madrasah belum mengatur penugasan guru."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {penugasanList.map((item) => {
            // Evaluasi status kesesuaian JP
            const isOverallocated = item.total_jp_terdistribusi > item.total_jp_efektif;
            const sisaJp = item.total_jp_efektif - item.total_jp_terdistribusi;
            const rasioSisa = item.total_jp_efektif > 0 ? sisaJp / item.total_jp_efektif : 0;
            const isUnderallocated = rasioSisa > 0.2;

            return (
              <Card
                key={item.id}
                className="flex flex-col border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white"
              >
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 font-semibold text-xs">
                      Kelas {item.tingkat_kelas} ({item.rombel})
                    </Badge>
                    {getStatusBadge(item.status)}
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900 mt-2 line-clamp-1">
                    {item.mapel.nama}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.guru.nama_lengkap}</span>
                    {item.guru.nip && <span className="text-slate-400">({item.guru.nip})</span>}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 py-4 space-y-4">
                  {/* Grid Metrik Ringkasan JP */}
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                        JP Efektif Setahun
                      </span>
                      <span className="text-xl font-bold text-slate-800 mt-1 block">
                        {item.total_jp_efektif} <span className="text-xs font-normal text-slate-500">JP</span>
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        ({item.mapel.jp_per_minggu} JP/minggu)
                      </span>
                    </div>

                    <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                      <span className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider block">
                        JP Terdistribusi
                      </span>
                      <span className="text-xl font-bold text-emerald-900 mt-1 block">
                        {item.total_jp_terdistribusi} <span className="text-xs font-normal text-emerald-700">JP</span>
                      </span>
                      <span className="text-[11px] text-emerald-600 mt-0.5 block">
                        {item.jumlah_item} TP terpetakan
                      </span>
                    </div>
                  </div>

                  {/* Breakdown Semester 1 & Semester 2 */}
                  <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Semester 1 (Ganjil):</span>
                      <span className="font-semibold text-slate-800">
                        {item.jp_terpakai_smt1} / {item.jp_efektif_smt1} JP
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          item.jp_terpakai_smt1 > item.jp_efektif_smt1
                            ? "bg-rose-500"
                            : "bg-emerald-600"
                        }`}
                        style={{
                          width: `${
                            item.jp_efektif_smt1 > 0
                              ? Math.min(100, (item.jp_terpakai_smt1 / item.jp_efektif_smt1) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-600 font-medium">Semester 2 (Genap):</span>
                      <span className="font-semibold text-slate-800">
                        {item.jp_terpakai_smt2} / {item.jp_efektif_smt2} JP
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          item.jp_terpakai_smt2 > item.jp_efektif_smt2
                            ? "bg-rose-500"
                            : "bg-emerald-600"
                        }`}
                        style={{
                          width: `${
                            item.jp_efektif_smt2 > 0
                              ? Math.min(100, (item.jp_terpakai_smt2 / item.jp_efektif_smt2) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Indikator Status Keseimbangan */}
                  {item.total_jp_terdistribusi === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Belum ada distribusi TP. Klik Buka Prota untuk sinkronkan dari ATP.</span>
                    </div>
                  ) : isOverallocated ? (
                    <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>Alokasi melebihi JP Efektif! Sesuaikan kembali alokasi JP.</span>
                    </div>
                  ) : isUnderallocated ? (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      <Scale className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Masih tersisa {sisaJp} JP (&gt;20%). Sisihkan untuk asesmen sumatif/cadangan.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>Alokasi waktu seimbang dan sesuai minggu efektif.</span>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/prota/${item.id}/preview`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "text-slate-600 hover:text-slate-900 border-slate-200",
                    })}
                  >
                    <Eye className="w-4 h-4 mr-1.5 text-slate-500" />
                    Pratinjau
                  </Link>

                  <Link
                    href={`/prota/${item.id}`}
                    className={buttonVariants({
                      variant: "default",
                      size: "sm",
                      className: "bg-emerald-600 hover:bg-emerald-700 text-white font-medium",
                    })}
                  >
                    <span>Buka Prota</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
