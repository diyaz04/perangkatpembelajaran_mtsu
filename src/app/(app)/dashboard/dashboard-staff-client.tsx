"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Users,
  Search,
  BookOpen,
  ArrowRight,
  ArrowUpRight,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Folder,
  LayoutGrid,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DashboardHeroBanner } from "@/components/dashboard-hero-banner";
import { getAvatarInfo } from "@/lib/avatar";
import type { DashboardStaffData, RekapKelengkapanGuru } from "@/lib/validasi/actions";
import type { DocStatus } from "@/types/database";

interface DashboardStaffClientProps {
  data: DashboardStaffData;
  namaPengguna: string;
  role?: string;
  roleLabel?: string;
}

export function DashboardStaffClient({
  data,
  namaPengguna,
  roleLabel = "Administrator",
}: DashboardStaffClientProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"bertingkat" | "tabel">("bertingkat");
  const [openGuruIds, setOpenGuruIds] = useState<Record<string, boolean>>({});

  const {
    totalAntrianValidasi,
    persentaseMadrasah,
    totalDokumenDisetujui,
    totalGuruAktif,
    rekapGuru,
  } = data;

  const filteredRekap = useMemo(() => {
    if (!search.trim()) return rekapGuru;
    const q = search.toLowerCase();
    return rekapGuru.filter(
      (r) =>
        r.guruNama.toLowerCase().includes(q) ||
        r.mapelNama.toLowerCase().includes(q) ||
        r.rombel.toLowerCase().includes(q) ||
        String(r.guruNip || "").includes(q)
    );
  }, [rekapGuru, search]);

  // Group by guru for list bertingkat
  const groupedByGuru = useMemo(() => {
    const map = new Map<
      string,
      {
        guruId: string;
        guruNama: string;
        guruNip: string | null;
        items: RekapKelengkapanGuru[];
        avgProgress: number;
      }
    >();

    filteredRekap.forEach((item) => {
      const key = item.guruId || item.guruNama;
      if (!map.has(key)) {
        map.set(key, {
          guruId: key,
          guruNama: item.guruNama,
          guruNip: item.guruNip,
          items: [],
          avgProgress: 0,
        });
      }
      map.get(key)!.items.push(item);
    });

    // Hitung rata-rata progres per guru
    const result = Array.from(map.values()).map((g) => {
      const totalProg = g.items.reduce((acc, cur) => acc + cur.persentaseSelesai, 0);
      const avg = g.items.length > 0 ? Math.round(totalProg / g.items.length) : 0;
      return { ...g, avgProgress: avg };
    });

    return result.sort((a, b) => a.guruNama.localeCompare(b.guruNama));
  }, [filteredRekap]);

  const toggleGuru = (guruId: string) => {
    setOpenGuruIds((prev) => ({
      ...prev,
      [guruId]: prev[guruId] === undefined ? false : !prev[guruId],
    }));
  };

  const isGuruOpen = (guruId: string) => {
    if (openGuruIds[guruId] !== undefined) {
      return openGuruIds[guruId];
    }
    return true; // Default open
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    groupedByGuru.forEach((g) => {
      next[g.guruId] = true;
    });
    setOpenGuruIds(next);
  };

  const handleCollapseAll = () => {
    const next: Record<string, boolean> = {};
    groupedByGuru.forEach((g) => {
      next[g.guruId] = false;
    });
    setOpenGuruIds(next);
  };

  const getStatusBadge = (status: DocStatus | "belum") => {
    switch (status) {
      case "disetujui":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disetujui
          </span>
        );
      case "diajukan":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" /> Diajukan
          </span>
        );
      case "revisi":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" /> Revisi
          </span>
        );
      case "draf":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Draf
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200/70">
            Belum
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Hero Banner MTs KH A Wahab Muhsin */}
      <DashboardHeroBanner
        nama={namaPengguna}
        roleLabel={roleLabel}
        imageSrc="/banner-madrasah.png"
      />

      {/* 2. Empat Kartu Metrik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Antrian Validasi (Biru) */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
                <Clock className="w-5 h-5" />
              </div>
              <Link
                href="/validasi"
                title="Buka antrian validasi"
                className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100/80 border border-blue-100 flex items-center justify-center text-blue-600 transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="mt-3.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Antrian Validasi
              </span>
              <span className="text-3xl font-extrabold text-blue-700 tracking-tight block mt-1">
                {totalAntrianValidasi}
              </span>
              <p className="text-xs text-slate-500 mt-1">Dokumen menunggu telaah</p>
            </div>
          </div>
          <div className="pt-3.5 mt-4 border-t border-slate-100">
            <Link
              href="/validasi"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 transition-colors"
            >
              Buka Antrian <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Card 2: Kelengkapan Madrasah (Hijau Emerald) */}
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
                Kelengkapan Madrasah
              </span>
              <span className="text-3xl font-extrabold text-emerald-700 tracking-tight block mt-1">
                {persentaseMadrasah}%
              </span>
              <div className="mt-2.5">
                <Progress value={persentaseMadrasah} className="h-2 bg-emerald-50" />
              </div>
            </div>
          </div>
          <div className="pt-3.5 mt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
            Standar Kurikulum Kemenag Jabar
          </div>
        </div>

        {/* Card 3: Dokumen Disetujui (Amber / Kuning Emas) */}
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
                Dokumen Disetujui
              </span>
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight block mt-1">
                {totalDokumenDisetujui}
              </span>
              <p className="text-xs text-slate-500 mt-1">Telah disahkan & terbit</p>
            </div>
          </div>
          <div className="pt-3.5 mt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
            Siap untuk supervisi
          </div>
        </div>

        {/* Card 4: Total Guru Aktif (Ungu) */}
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
                Total Guru Aktif
              </span>
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight block mt-1">
                {totalGuruAktif} <span className="text-xl font-bold text-slate-600">Orang</span>
              </span>
              <p className="text-xs text-slate-500 mt-1">{rekapGuru.length} Penugasan kelas</p>
            </div>
          </div>
          <div className="pt-3.5 mt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
            Fase D (Kelas VII–IX)
          </div>
        </div>
      </div>

      {/* 3. Tabel Rekapitulasi Kelengkapan Perangkat Guru (Dengan List Bertingkat per Guru) */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-4">
        {/* Header Rekap */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Rekapitulasi Kelengkapan Perangkat Guru
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar bertingkat perangkat pembelajaran guru (ATP, Prota, Prosem, dan RPP).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("bertingkat")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "bertingkat"
                    ? "bg-white text-emerald-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Tampilan List Bertingkat per Guru"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>List Guru</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("tabel")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "tabel"
                    ? "bg-white text-emerald-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Tampilan Tabel Semua Penugasan"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Tabel Rinci</span>
              </button>
            </div>

            <a href="/api/export/rekap-excel" download>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-2xs gap-1.5 h-9 px-3.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export XLSX
              </Button>
            </a>
          </div>
        </div>

        {/* Input Pencarian & Kontrol Expand */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              placeholder="Cari nama guru, mapel, rombel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs rounded-xl bg-slate-50/80 border-slate-200 focus-visible:bg-white h-9"
            />
          </div>

          {viewMode === "bertingkat" && groupedByGuru.length > 0 && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-slate-500 font-medium mr-1 hidden sm:inline">
                {groupedByGuru.length} Guru • {filteredRekap.length} Penugasan
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAll}
                className="text-xs h-8.5 rounded-xl border-slate-200 hover:bg-slate-50"
              >
                <FolderOpen className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Buka Semua
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCollapseAll}
                className="text-xs h-8.5 rounded-xl border-slate-200 hover:bg-slate-50"
              >
                <Folder className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Tutup Semua
              </Button>
            </div>
          )}
        </div>

        {/* MODE 1: LIST BERTINGKAT PER NAMA GURU (DEFAULT) */}
        {viewMode === "bertingkat" ? (
          groupedByGuru.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              Tidak ada data guru yang cocok dengan pencarian.
            </div>
          ) : (
            <div className="space-y-3">
              {groupedByGuru.map((group) => {
                const isOpen = isGuruOpen(group.guruId);
                const avatar = getAvatarInfo(group.guruNama);

                return (
                  <div
                    key={group.guruId}
                    className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden transition-all duration-200"
                  >
                    {/* Header Guru - Klik untuk melihat pekerjaan guru tersebut */}
                    <button
                      type="button"
                      onClick={() => toggleGuru(group.guruId)}
                      className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full ${avatar.bg} ${avatar.text} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs border border-white`}
                        >
                          {avatar.initials}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate">
                              {group.guruNama}
                            </span>
                            <Badge variant="outline" className="bg-slate-100 text-slate-700 text-[11px] rounded-full border-slate-200 font-semibold px-2 py-0">
                              {group.items.length} Penugasan
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-400 block mt-0.5">
                            {group.guruNip ? `NIP: ${group.guruNip}` : "NIP: -"}
                          </span>
                        </div>
                      </div>

                      {/* Progres Rata-rata Guru & Chevron */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="hidden sm:block text-right min-w-[100px]">
                          <span className="text-xs font-bold text-slate-900 block">
                            {group.avgProgress}% Selesai
                          </span>
                          <div className="w-24 mt-1">
                            <Progress value={group.avgProgress} className="h-1.5 bg-slate-100" />
                          </div>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-transform">
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-emerald-700" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Sub-Tabel Pekerjaan Guru Tersebut (Terbuka saat diklik) */}
                    {isOpen && (
                      <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 bg-slate-50/40">
                        <div className="pt-3 pb-2 flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">
                            Rincian Perangkat Pembelajaran ({group.items.length} Kelas)
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Klik status dokumen untuk membuka rincian perangkat
                          </span>
                        </div>

                        <div className="rounded-xl border border-slate-200 overflow-x-auto bg-white mt-1">
                          <table className="w-full text-left text-xs min-w-[760px]">
                            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-semibold">
                              <tr>
                                <th className="p-3">Mata Pelajaran & Rombel</th>
                                <th className="p-3 text-center">Kelas</th>
                                <th className="p-3 text-center">ATP</th>
                                <th className="p-3 text-center">Prota</th>
                                <th className="p-3 text-center">Prosem 1</th>
                                <th className="p-3 text-center">Prosem 2</th>
                                <th className="p-3 text-center">RPP Tersusun</th>
                                <th className="p-3 text-center w-28">Progres</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {group.items.map((item) => (
                                <tr
                                  key={item.penugasanId}
                                  className="hover:bg-slate-50/60 transition-colors"
                                >
                                  <td className="p-3">
                                    <span className="font-semibold text-slate-900 block">
                                      {item.mapelNama}
                                    </span>
                                    <span className="text-[11px] text-slate-500 block mt-0.5">
                                      Rombel: {item.rombel}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-medium text-slate-700">
                                    Kelas {item.tingkatKelas}
                                  </td>
                                  <td className="p-3 text-center">
                                    <Link
                                      href={`/atp/${item.penugasanId}`}
                                      className="hover:opacity-80 transition-opacity inline-block"
                                      title="Buka Wizard ATP"
                                    >
                                      {getStatusBadge(item.atpStatus)}
                                    </Link>
                                  </td>
                                  <td className="p-3 text-center">
                                    <Link
                                      href={`/prota/${item.penugasanId}`}
                                      className="hover:opacity-80 transition-opacity inline-block"
                                      title="Buka Prota"
                                    >
                                      {getStatusBadge(item.protaStatus)}
                                    </Link>
                                  </td>
                                  <td className="p-3 text-center">
                                    <Link
                                      href={`/prosem/${item.penugasanId}?semester=1`}
                                      className="hover:opacity-80 transition-opacity inline-block"
                                      title="Buka Prosem Semester 1"
                                    >
                                      {getStatusBadge(item.prosem1Status)}
                                    </Link>
                                  </td>
                                  <td className="p-3 text-center">
                                    <Link
                                      href={`/prosem/${item.penugasanId}?semester=2`}
                                      className="hover:opacity-80 transition-opacity inline-block"
                                      title="Buka Prosem Semester 2"
                                    >
                                      {getStatusBadge(item.prosem2Status)}
                                    </Link>
                                  </td>
                                  <td className="p-3 text-center">
                                    <Link
                                      href={`/modul-ajar`}
                                      className="hover:opacity-80 transition-opacity inline-block"
                                      title="Buka RPP / Modul Ajar"
                                    >
                                      <span className="font-bold text-slate-800 block">
                                        {item.rppCount} / {item.rppTarget} TP
                                      </span>
                                      <span className="text-[10px] font-semibold text-emerald-600 block mt-0.5">
                                        ({item.rppDisetujuiCount} disetujui)
                                      </span>
                                    </Link>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="font-extrabold text-slate-900 block">
                                      {item.persentaseSelesai}%
                                    </span>
                                    <div className="w-20 mx-auto mt-1.5">
                                      <Progress
                                        value={item.persentaseSelesai}
                                        className="h-1.5 bg-slate-100"
                                      />
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* MODE 2: TABEL RINCI (SELURUH PENUGASAN GURU) */
          <div className="rounded-xl border border-slate-200 overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[800px]">
              <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="p-3 w-12 text-center">No</th>
                  <th className="p-3">Guru & NIP</th>
                  <th className="p-3">Mata Pelajaran</th>
                  <th className="p-3 text-center">Kelas</th>
                  <th className="p-3 text-center">ATP</th>
                  <th className="p-3 text-center">Prota</th>
                  <th className="p-3 text-center">Prosem 1</th>
                  <th className="p-3 text-center">Prosem 2</th>
                  <th className="p-3 text-center">RPP Tersusun</th>
                  <th className="p-3 text-center w-28">Progres</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRekap.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      Tidak ada data guru yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredRekap.map((item, idx) => {
                    const avatar = getAvatarInfo(item.guruNama);
                    return (
                      <tr
                        key={`${item.penugasanId}-${idx}`}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="p-3 text-center font-medium text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-9 h-9 rounded-full ${avatar.bg} ${avatar.text} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}
                            >
                              {avatar.initials}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block leading-tight">
                                {item.guruNama}
                              </span>
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                {item.guruNip ? `NIP: ${item.guruNip}` : "-"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-800 block">
                            {item.mapelNama}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Rombel: {item.rombel}
                          </span>
                        </td>
                        <td className="p-3 text-center font-medium text-slate-700">
                          Kelas {item.tingkatKelas}
                        </td>
                        <td className="p-3 text-center">
                          <Link href={`/atp/${item.penugasanId}`}>
                            {getStatusBadge(item.atpStatus)}
                          </Link>
                        </td>
                        <td className="p-3 text-center">
                          <Link href={`/prota/${item.penugasanId}`}>
                            {getStatusBadge(item.protaStatus)}
                          </Link>
                        </td>
                        <td className="p-3 text-center">
                          <Link href={`/prosem/${item.penugasanId}?semester=1`}>
                            {getStatusBadge(item.prosem1Status)}
                          </Link>
                        </td>
                        <td className="p-3 text-center">
                          <Link href={`/prosem/${item.penugasanId}?semester=2`}>
                            {getStatusBadge(item.prosem2Status)}
                          </Link>
                        </td>
                        <td className="p-3 text-center">
                          <Link href={`/modul-ajar`}>
                            <span className="font-bold text-slate-800 block">
                              {item.rppCount} / {item.rppTarget} TP
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600 block mt-0.5">
                              ({item.rppDisetujuiCount} disetujui)
                            </span>
                          </Link>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-extrabold text-slate-900 block">
                            {item.persentaseSelesai}%
                          </span>
                          <div className="w-20 mx-auto mt-1.5">
                            <Progress
                              value={item.persentaseSelesai}
                              className="h-1.5 bg-slate-100"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
