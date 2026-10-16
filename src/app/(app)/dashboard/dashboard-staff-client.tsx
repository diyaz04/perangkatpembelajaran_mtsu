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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { DashboardHeroBanner } from "@/components/dashboard-hero-banner";
import type { DashboardStaffData } from "@/lib/validasi/actions";
import type { DocStatus } from "@/types/database";

interface DashboardStaffClientProps {
  data: DashboardStaffData;
  namaPengguna: string;
  role: string;
  roleLabel?: string;
}

// Menghasilkan inisial dan warna avatar guru secara konsisten
function getAvatarInfo(name: string) {
  const parts = name.trim().split(/\s+/);
  let initials = "";
  if (parts.length >= 2) {
    initials = (parts[0][0] + parts[1][0]).toUpperCase();
  } else if (parts.length === 1 && parts[0].length > 0) {
    initials = parts[0].slice(0, 2).toUpperCase();
  } else {
    initials = "GR";
  }

  const palette = [
    { bg: "bg-blue-100", text: "text-blue-700" },
    { bg: "bg-purple-100", text: "text-purple-700" },
    { bg: "bg-emerald-100", text: "text-emerald-700" },
    { bg: "bg-amber-100", text: "text-amber-800" },
    { bg: "bg-rose-100", text: "text-rose-700" },
    { bg: "bg-teal-100", text: "text-teal-700" },
    { bg: "bg-indigo-100", text: "text-indigo-700" },
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = palette[Math.abs(hash) % palette.length];

  return { initials, ...color };
}

export function DashboardStaffClient({
  data,
  namaPengguna,
  role,
  roleLabel = "Administrator",
}: DashboardStaffClientProps) {
  const [search, setSearch] = useState("");
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

      {/* 3. Tabel Rekapitulasi Kelengkapan Perangkat Guru */}
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
                Matriks kelengkapan ATP, Prota, Prosem, dan RPP per penugasan mengajar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a href="/api/export/rekap-excel" download>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-2xs gap-1.5 h-9 px-3.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export Rekap XLSX (Excel)
              </Button>
            </a>
          </div>
        </div>

        {/* Input Pencarian */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            placeholder="Cari nama guru, mapel, rombel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs rounded-xl bg-slate-50/80 border-slate-200 focus-visible:bg-white"
          />
        </div>

        {/* Container Tabel dengan Scroll Horizontal di HP */}
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
                          {/* Avatar Inisial Berwarna seperti di Desain */}
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
                      <td className="p-3 text-center">{getStatusBadge(item.atpStatus)}</td>
                      <td className="p-3 text-center">{getStatusBadge(item.protaStatus)}</td>
                      <td className="p-3 text-center">{getStatusBadge(item.prosem1Status)}</td>
                      <td className="p-3 text-center">{getStatusBadge(item.prosem2Status)}</td>
                      <td className="p-3 text-center">
                        <span className="font-bold text-slate-800 block">
                          {item.rppCount} / {item.rppTarget} TP
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 block mt-0.5">
                          ({item.rppDisetujuiCount} disetujui)
                        </span>
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
      </div>
    </div>
  );
}
