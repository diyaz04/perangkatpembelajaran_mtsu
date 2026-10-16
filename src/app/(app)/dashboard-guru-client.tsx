"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileEdit,
  FileText,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { DashboardGuruData } from "./dashboard-actions";
import type { DocStatus } from "@/types/database";

interface DashboardGuruClientProps {
  data: DashboardGuruData;
  namaGuru: string;
}

export function DashboardGuruClient({ data, namaGuru }: DashboardGuruClientProps) {
  const { penugasanList, dokumenRevisi, drafTerakhir } = data;

  const getStatusBadge = (status: DocStatus | "belum") => {
    switch (status) {
      case "disetujui":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] py-0 px-1.5">
            <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> Disetujui
          </Badge>
        );
      case "diajukan":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] py-0 px-1.5">
            <Clock className="w-2.5 h-2.5 mr-1" /> Diajukan
          </Badge>
        );
      case "revisi":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] py-0 px-1.5">
            <AlertCircle className="w-2.5 h-2.5 mr-1" /> Revisi
          </Badge>
        );
      case "draf":
        return (
          <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200 text-[10px] py-0 px-1.5">
            Draf
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-400 bg-slate-50/50 border-dashed border-slate-200 text-[10px] py-0 px-1.5">
            Belum
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Sambutan Guru */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Ahlan wa Sahlan, {namaGuru}
          </h2>
          <p className="text-xs text-slate-500">
            Panel kendali penyusunan perangkat ajar terintegrasi Kurikulum Berbasis Cinta (KBC).
          </p>
        </div>
      </div>

      {/* 1. Banner Dokumen Perlu Revisi (Muncul jika ada dokumen status = revisi) */}
      {dokumenRevisi.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-5 shadow-2xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-rose-900">
                Pemberitahuan: Terdapat {dokumenRevisi.length} Dokumen Perlu Perbaikan (Revisi)
              </h3>
              <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                Waka Kurikulum atau Kepala Madrasah telah memberikan catatan telaah. Silakan periksa dan perbaiki sebelum mengajukan kembali.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {dokumenRevisi.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-lg border border-rose-200 p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      {rev.mapelNama} (Kelas {rev.kelas})
                    </span>
                    <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px]">
                      Perlu Revisi
                    </Badge>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900">{rev.judul}</h4>
                  <p className="text-xs text-rose-800 bg-rose-50/60 p-2 rounded mt-2 border border-rose-100 italic">
                    &ldquo;{rev.catatanValidator}&rdquo;
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <Link href={rev.editUrl}>
                    <Button
                      size="sm"
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-7"
                    >
                      Perbaiki Dokumen <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Pintasan Lanjutkan Draf Terakhir */}
      {drafTerakhir && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <FileEdit className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">
                  Pintasan Kerja
                </span>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-white text-slate-600">
                  {drafTerakhir.dokumen_tipe.toUpperCase()}
                </Badge>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                {drafTerakhir.judul}
              </h4>
              <p className="text-xs text-slate-500">
                Lanjutkan penyusunan draf perangkat yang baru saja Anda edit.
              </p>
            </div>
          </div>

          <Link href={drafTerakhir.editUrl} className="shrink-0">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs w-full sm:w-auto">
              Lanjutkan Draf Terakhir <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* 3. Kartu Progres per Penugasan Guru */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Progres Perangkat Pembelajaran Anda
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {penugasanList.length} Penugasan Aktif
          </span>
        </div>

        {penugasanList.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-600">Belum ada penugasan mengajar di tahun ajaran ini</p>
            <p className="text-xs text-slate-400">Hubungi Administrator untuk mengatur penugasan guru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {penugasanList.map((p) => (
              <div
                key={p.penugasanId}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4 hover:border-emerald-500 transition-colors"
              >
                {/* Header Penugasan */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-700">
                        {p.mapelKode}
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        Kelas {p.tingkatKelas} ({p.rombel})
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {p.mapelNama}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-700">
                      {p.persentaseSelesai}%
                    </span>
                    <span className="text-[11px] text-slate-400 block">Kelengkapan</span>
                  </div>
                </div>

                {/* Progress bar */}
                <Progress value={p.persentaseSelesai} className="h-2" />

                {/* Status per Dokumen */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                  {/* ATP */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block">ATP</span>
                    {getStatusBadge(p.atp.status)}
                  </div>

                  {/* Prota */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block">Prota</span>
                    {getStatusBadge(p.prota.status)}
                  </div>

                  {/* Prosem 1 */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block">Prosem 1</span>
                    {getStatusBadge(p.prosem1.status)}
                  </div>

                  {/* Prosem 2 */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block">Prosem 2</span>
                    {getStatusBadge(p.prosem2.status)}
                  </div>
                </div>

                {/* RPP / Modul Ajar Progress */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-medium text-slate-700">RPP / Modul Ajar:</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {p.rppCount} dari {p.rppTarget} TP ({p.rppDisetujui} Disetujui)
                  </span>
                </div>

                {/* Tombol Akses Cepat */}
                <div className="pt-1 flex items-center gap-2">
                  <Link href={`/atp/${p.penugasanId}`} prefetch={true} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8">
                      Buka ATP
                    </Button>
                  </Link>
                  <Link href={`/prota/${p.penugasanId}`} prefetch={true} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8">
                      Buka Prota
                    </Button>
                  </Link>
                  <Link href={`/modul-ajar`} prefetch={true} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8">
                      RPP
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Landasan Nilai Karakter KBC */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xs">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Landasan Nilai Karakter Kurikulum Berbasis Cinta (KBC)
        </h3>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
            Panca Cinta
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "1. Cinta Allah dan Rasul-Nya",
              "2. Cinta Ilmu",
              "3. Cinta Lingkungan",
              "4. Cinta Diri dan Sesama Manusia",
              "5. Cinta Tanah Air",
            ].map((cinta) => (
              <Badge
                key={cinta}
                variant="outline"
                className="text-xs py-1 px-2.5 bg-slate-50 border-slate-200 text-slate-700"
              >
                {cinta}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
          <div>
            <span className="font-semibold text-slate-700">6 Nilai Dasar KBC:</span>
            <p className="text-slate-500 mt-0.5">
              Spiritual · Intelektual · Ekologis · Personal · Sosial · Kebangsaan
            </p>
          </div>
          <div>
            <span className="font-semibold text-slate-700">
              3 Prinsip Pembelajaran Mendalam:
            </span>
            <p className="text-slate-500 mt-0.5">
              Berkesadaran (Mindful) · Bermakna (Meaningful) · Menggembirakan (Joyful)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
