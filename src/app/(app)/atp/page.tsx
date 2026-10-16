import Link from "next/link";
import { getPenugasanListAction } from "./actions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import {
  BookOpen,
  ArrowRight,
  FileCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Layers,
  Sparkles,
  GraduationCap,
  FileText,
  Calendar,
} from "lucide-react";

export const metadata = {
  title: "Analisis CP & ATP | SIM Perangkat Pembelajaran KBC",
  description: "Modul Analisis CP, Perumusan TP, dan Penyusunan Alur Tujuan Pembelajaran Berbasis Cinta",
};

export default async function AtpPage() {
  const result = await getPenugasanListAction();
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
          <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200 flex items-center gap-1">
            <FileCheck className="w-3.5 h-3.5" />
            Draf
          </Badge>
        );
    }
  };

  const getKelompokBadge = (kelompok: string) => {
    switch (kelompok) {
      case "PAI":
        return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200">PAI</Badge>;
      case "Bahasa Arab":
        return <Badge variant="secondary" className="bg-teal-50 text-teal-700 border border-teal-200">Bahasa Arab</Badge>;
      case "muatan_lokal":
        return <Badge variant="secondary" className="bg-purple-50 text-purple-700 border border-purple-200">Muatan Lokal</Badge>;
      default:
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border border-slate-200">Umum</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <PageHeader
        title="Analisis CP & Alur Tujuan Pembelajaran (ATP)"
        description="Petakan Capaian Pembelajaran Fase D ke Dimensi Profil Lulusan & Panca Cinta, rumuskan Tujuan Pembelajaran, dan susun alur pembelajaran terstruktur."
      />

      {/* Banner Panduan Singkat */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h2 className="font-semibold text-lg text-white">Alur Perangkat Ajar Kurikulum Berbasis Cinta (KBC)</h2>
            </div>
            <p className="text-emerald-100 text-sm max-w-3xl">
              Pilih kartu penugasan kelas Anda di bawah untuk memulai wizard 3 langkah: 
              <span className="font-medium text-white"> (1) Analisis Elemen CP</span> → 
              <span className="font-medium text-white"> (2) Rumuskan TP SOLO/Bloom</span> → 
              <span className="font-medium text-white"> (3) Susun & Urutkan ATP</span>.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-emerald-800/80 px-3 py-1.5 rounded-lg border border-emerald-700 text-emerald-100 shrink-0">
            <GraduationCap className="w-4 h-4 text-emerald-300" />
            <span>Fase D (Tingkat MTs)</span>
          </div>
        </div>
      </div>

      {/* Pesan Error jika ada */}
      {!result.success && result.error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          {result.error}
        </div>
      )}

      {/* Daftar Penugasan */}
      {penugasanList.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Belum Ada Penugasan Guru Aktif"
          description="Anda belum memiliki penugasan mata pelajaran di tahun ajaran aktif. Silakan hubungi admin atau waka kurikulum untuk menambahkan penugasan kelas Anda."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {penugasanList.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col justify-between hover:shadow-md transition-shadow border-slate-200 bg-white"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {getKelompokBadge(item.mapel.kelompok)}
                    <Badge variant="outline" className="font-semibold bg-blue-50 text-blue-700 border-blue-200">
                      Kelas {item.tingkat_kelas === 7 ? "VII" : item.tingkat_kelas === 8 ? "VIII" : "IX"}
                    </Badge>
                    <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200">
                      Rombel {item.rombel}
                    </Badge>
                  </div>
                  <div>{getStatusBadge(item.atp_status)}</div>
                </div>

                <CardTitle className="text-xl text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {item.mapel.nama}
                </CardTitle>
                <CardDescription className="text-slate-500 text-xs">
                  Kode: <span className="font-mono font-medium text-slate-700">{item.mapel.kode}</span> • Alokasi mingguan:{" "}
                  <span className="font-semibold text-slate-700">{item.mapel.jp_per_minggu} JP</span> / minggu
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 py-2">
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Guru Pengampu:</span>
                    <span className="font-medium text-slate-800 text-right">{item.guru.nama_lengkap}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Tahun Ajaran:</span>
                    <span className="font-medium text-slate-800">{item.tahun_ajaran.nama}</span>
                  </div>
                </div>

                {/* Ringkasan Analisis Minggu Efektif & Target JP Kalender */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Target JP Kalender</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                      {item.target_jp} JP / Tahun
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center justify-between">
                    <span>
                      {item.total_minggu_efektif} Mgg Efektif × {item.mapel.jp_per_minggu} JP/mgg
                    </span>
                    {item.total_jp === item.target_jp ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Tepat Sesuai
                      </span>
                    ) : item.total_jp < item.target_jp ? (
                      <span className="text-amber-700 font-semibold">
                        Kurang {item.target_jp - item.total_jp} JP
                      </span>
                    ) : (
                      <span className="text-rose-700 font-semibold">
                        Lebih {item.total_jp - item.target_jp} JP
                      </span>
                    )}
                  </div>

                  {/* Progress Bar Keterisian JP */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-600 font-medium">Distribusi JP pada TP:</span>
                      <span className="font-bold text-slate-800">
                        {item.total_jp} / {item.target_jp} JP (
                        {item.target_jp > 0
                          ? Math.round((item.total_jp / item.target_jp) * 100)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          item.total_jp > item.target_jp
                            ? "bg-rose-500"
                            : item.total_jp === item.target_jp
                            ? "bg-emerald-600"
                            : "bg-blue-600"
                        }`}
                        style={{
                          width: `${
                            item.target_jp > 0
                              ? Math.min(100, Math.round((item.total_jp / item.target_jp) * 100))
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Rincian Target & Keterisian Semester 1 & 2 */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 text-[11px]">
                    <div className="bg-white p-1.5 rounded border border-slate-200/80">
                      <div className="text-slate-500 flex justify-between font-medium">
                        <span>Smt 1 (Ganjil):</span>
                        <span className="font-bold text-slate-800">
                          {item.terisi_jp_smt1} / {item.target_jp_smt1} JP
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Target: {item.minggu_efektif_smt1} mgg efektif
                      </span>
                    </div>

                    <div className="bg-white p-1.5 rounded border border-slate-200/80">
                      <div className="text-slate-500 flex justify-between font-medium">
                        <span>Smt 2 (Genap):</span>
                        <span className="font-bold text-slate-800">
                          {item.terisi_jp_smt2} / {item.target_jp_smt2} JP
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Target: {item.minggu_efektif_smt2} mgg efektif
                      </span>
                    </div>
                  </div>
                </div>

                {/* Indikator Progres Elemen & TP */}
                <div className="grid grid-cols-2 gap-2 text-center pt-0.5">
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
                    <div className="text-xs text-slate-500 mb-0.5">Elemen CP</div>
                    <div className="font-bold text-slate-800 text-base">{item.jumlah_elemen_cp}</div>
                  </div>
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-2">
                    <div className="text-xs text-emerald-700 mb-0.5">Jumlah TP</div>
                    <div className="font-bold text-emerald-800 text-base">{item.jumlah_tp}</div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <Link
                  href={`/atp/${item.id}`}
                  prefetch={true}
                  className={buttonVariants({
                    className: "flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-sm",
                  })}
                >
                  <Layers className="w-4 h-4 mr-1.5" />
                  Wizard ATP
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>

                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/atp/${item.id}/preview-cp`}
                    prefetch={true}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "h-9 px-2 text-xs text-blue-700 hover:bg-blue-50 border-slate-200",
                    })}
                    title="Lihat & Cetak Dokumen Analisis CP"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    CP
                  </Link>

                  <Link
                    href={`/atp/${item.id}/preview-tp`}
                    prefetch={true}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "h-9 px-2 text-xs text-amber-700 hover:bg-amber-50 border-slate-200",
                    })}
                    title="Lihat & Cetak Dokumen Rumusan TP"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1 text-amber-600" />
                    TP
                  </Link>

                  <Link
                    href={`/atp/${item.id}/preview`}
                    prefetch={true}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "h-9 px-2 text-xs text-emerald-700 hover:bg-emerald-50 border-slate-200",
                    })}
                    title="Lihat & Cetak Dokumen ATP"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    ATP
                  </Link>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
