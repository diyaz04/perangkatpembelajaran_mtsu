"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileEdit,
  FileText,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DashboardHeroBanner } from "@/components/dashboard-hero-banner";
import type { DashboardGuruData } from "./dashboard-actions";
import type { DocStatus } from "@/types/database";

interface DashboardGuruClientProps {
  data: DashboardGuruData;
  namaGuru: string;
  roleLabel?: string;
}

export function DashboardGuruClient({
  data,
  namaGuru,
  roleLabel = "Guru Pengampu",
}: DashboardGuruClientProps) {
  const { penugasanList, dokumenRevisi, drafTerakhir } = data;

  // Hitung metrik ringkas guru
  const totalDisetujui = penugasanList.reduce((acc, p) => {
    let count = p.rppDisetujui;
    if (p.atp.status === "disetujui") count++;
    if (p.prota.status === "disetujui") count++;
    if (p.prosem1.status === "disetujui") count++;
    if (p.prosem2.status === "disetujui") count++;
    return acc + count;
  }, 0);

  const totalDiajukan = penugasanList.reduce((acc, p) => {
    let count = 0;
    if (p.atp.status === "diajukan") count++;
    if (p.prota.status === "diajukan") count++;
    if (p.prosem1.status === "diajukan") count++;
    if (p.prosem2.status === "diajukan") count++;
    return acc + count;
  }, 0);

  const rataKelengkapan =
    penugasanList.length > 0
      ? Math.round(
          penugasanList.reduce((acc, p) => acc + p.persentaseSelesai, 0) /
            penugasanList.length
        )
      : 0;

  const getStatusBadge = (status: DocStatus | "belum") => {
    switch (status) {
      case "disetujui":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Disetujui
          </span>
        );
      case "diajukan":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-2.5 h-2.5 text-blue-600" /> Diajukan
          </span>
        );
      case "revisi":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-2.5 h-2.5 text-rose-600" /> Revisi
          </span>
        );
      case "draf":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Draf
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200/70">
            Belum
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Hero Banner MTs KH A Wahab Muhsin */}
      <DashboardHeroBanner
        nama={namaGuru}
        roleLabel={roleLabel}
        imageSrc="/banner-madrasah.png"
      />

      {/* 2. Kartu Metrik Ringkas Guru */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metrik 1: Antrian Validasi / Diajukan */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Menunggu Validasi
              </span>
              <span className="text-3xl font-extrabold text-blue-700 tracking-tight block mt-1">
                {totalDiajukan}
              </span>
              <p className="text-xs text-slate-500 mt-1">Dokumen sedang ditelaah pimpinan</p>
            </div>
          </div>
          <div className="pt-3.5 mt-4 border-t border-slate-100 text-xs text-slate-500">
            Status pengajuan aktif
          </div>
        </div>

        {/* Metrik 2: Rata Kelengkapan */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Rata Kelengkapan Anda
              </span>
              <span className="text-3xl font-extrabold text-emerald-700 tracking-tight block mt-1">
                {rataKelengkapan}%
              </span>
              <div className="mt-2.5">
                <Progress value={rataKelengkapan} className="h-2 bg-emerald-50" />
              </div>
            </div>
          </div>
          <div className="pt-3.5 mt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
            KMA 1503/2025 & KBC
          </div>
        </div>

        {/* Metrik 3: Dokumen Disetujui */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-2xs">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Dokumen Disahkan
              </span>
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight block mt-1">
                {totalDisetujui}
              </span>
              <p className="text-xs text-slate-500 mt-1">Telah disahkan Kepala Madrasah</p>
            </div>
          </div>
          <div className="pt-3.5 mt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
            Siap untuk supervisi
          </div>
        </div>

        {/* Metrik 4: Total Penugasan Kelas */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-2xs">
                <Users className="w-5 h-5" />
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Penugasan Mengajar
              </span>
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight block mt-1">
                {penugasanList.length} <span className="text-xl font-bold text-slate-600">Kelas</span>
              </span>
              <p className="text-xs text-slate-500 mt-1">Tahun Pelajaran 2025/2026</p>
            </div>
          </div>
          <div className="pt-3.5 mt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
            Fase D (Kelas VII–IX)
          </div>
        </div>
      </div>

      {/* 3. Banner Dokumen Perlu Revisi (Jika Ada) */}
      {dokumenRevisi.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 shadow-2xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 shadow-2xs">
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
                className="bg-white rounded-xl border border-rose-200 p-4 flex flex-col justify-between gap-3 shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      {rev.mapelNama} (Kelas {rev.kelas})
                    </span>
                    <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] rounded-full">
                      Perlu Revisi
                    </Badge>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{rev.judul}</h4>
                  <p className="text-xs text-rose-800 bg-rose-50/80 p-2.5 rounded-lg mt-2 border border-rose-100 italic">
                    &ldquo;{rev.catatanValidator}&rdquo;
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <Link href={rev.editUrl}>
                    <Button
                      size="sm"
                      className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8 rounded-lg"
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

      {/* 4. Pintasan Lanjutkan Draf Terakhir */}
      {drafTerakhir && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50/80 to-white p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shadow-2xs">
              <FileEdit className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Pintasan Kerja
                </span>
                <Badge variant="outline" className="text-[10px] py-0 px-2 bg-white text-slate-600 rounded-full">
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
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl h-9 px-4 shadow-2xs w-full sm:w-auto">
              Lanjutkan Draf Terakhir <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* 5. Kartu Progres per Penugasan Guru */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Progres Perangkat Pembelajaran Anda
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {penugasanList.length} Penugasan Aktif
          </span>
        </div>

        {penugasanList.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400">
            <BookOpen className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-600">Belum ada penugasan mengajar di tahun ajaran ini</p>
            <p className="text-xs text-slate-400">Hubungi Administrator untuk mengatur penugasan guru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {penugasanList.map((p) => (
              <div
                key={p.penugasanId}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-4 hover:border-emerald-500 transition-all"
              >
                {/* Header Penugasan */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-700">
                        {p.mapelKode}
                      </span>
                      <Badge variant="outline" className="text-[10px] rounded-full">
                        Kelas {p.tingkatKelas} ({p.rombel})
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">
                      {p.mapelNama}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-emerald-700">
                      {p.persentaseSelesai}%
                    </span>
                    <span className="text-[11px] text-slate-400 block">Kelengkapan</span>
                  </div>
                </div>

                {/* Progress bar */}
                <Progress value={p.persentaseSelesai} className="h-2 bg-slate-100" />

                {/* Status per Dokumen */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block">ATP</span>
                    {getStatusBadge(p.atp.status)}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block">Prota</span>
                    {getStatusBadge(p.prota.status)}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block">Prosem 1</span>
                    {getStatusBadge(p.prosem1.status)}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-400 block">Prosem 2</span>
                    {getStatusBadge(p.prosem2.status)}
                  </div>
                </div>

                {/* RPP / Modul Ajar Progress */}
                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-semibold text-slate-700">RPP / Modul Ajar:</span>
                  </div>
                  <span className="font-bold text-slate-900 text-left sm:text-right">
                    {p.rppCount} dari {p.rppTarget} TP{" "}
                    <span className="text-emerald-600 font-semibold">({p.rppDisetujui} Disetujui)</span>
                  </span>
                </div>

                {/* Tombol Akses Cepat */}
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <Link href={`/atp/${p.penugasanId}`} prefetch={true} className="flex-1 min-w-[70px]">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8 px-2 rounded-xl">
                      ATP
                    </Button>
                  </Link>
                  <Link href={`/prota/${p.penugasanId}`} prefetch={true} className="flex-1 min-w-[70px]">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8 px-2 rounded-xl">
                      Prota
                    </Button>
                  </Link>
                  <Link href={`/modul-ajar`} prefetch={true} className="flex-1 min-w-[70px]">
                    <Button variant="outline" size="sm" className="w-full text-xs h-8 px-2 rounded-xl">
                      RPP
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Landasan Nilai Karakter KBC */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 space-y-4 shadow-2xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Landasan Nilai Karakter Kurikulum Berbasis Cinta (KBC)
        </h3>
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
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
                className="text-xs py-1 px-3 bg-slate-50 border-slate-200 text-slate-700 rounded-full"
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
