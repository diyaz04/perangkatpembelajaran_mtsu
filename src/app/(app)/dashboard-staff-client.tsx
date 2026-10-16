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
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { DashboardStaffData } from "@/lib/validasi/actions";
import type { DocStatus } from "@/types/database";

interface DashboardStaffClientProps {
  data: DashboardStaffData;
  namaPengguna: string;
  role: string;
}

export function DashboardStaffClient({
  data,
  namaPengguna,
  role,
}: DashboardStaffClientProps) {
  const [search, setSearch] = useState("");
  const { totalAntrianValidasi, persentaseMadrasah, totalDokumenDisetujui, totalGuruAktif, rekapGuru } = data;

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
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] py-0 px-1.5 font-medium">
            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Disetujui
          </Badge>
        );
      case "diajukan":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] py-0 px-1.5 font-medium">
            <Clock className="w-2.5 h-2.5 mr-0.5" /> Diajukan
          </Badge>
        );
      case "revisi":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px] py-0 px-1.5 font-medium">
            <AlertCircle className="w-2.5 h-2.5 mr-0.5" /> Revisi
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

  const getRoleTitle = (r: string) => {
    switch (r) {
      case "kepala":
        return "Kepala Madrasah";
      case "waka_kurikulum":
        return "Waka Kurikulum";
      case "admin":
        return "Administrator";
      default:
        return "Pimpinan";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Sambutan Pimpinan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Ahlan wa Sahlan, {namaPengguna} ({getRoleTitle(role)})
          </h2>
          <p className="text-xs text-slate-500">
            Dasbor Supervisi & Pengawasan Perangkat Pembelajaran KBC & Kurikulum Merdeka.
          </p>
        </div>
      </div>

      {/* 1. Kartu Metrik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Antrian Validasi */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Antrian Validasi
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-blue-700">
              {totalAntrianValidasi}
            </span>
            <p className="text-xs text-slate-400 mt-0.5">Dokumen menunggu telaah</p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100">
            <Link
              href="/validasi"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Buka Antrian <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Persentase Kelengkapan */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kelengkapan Madrasah
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-emerald-700">
              {persentaseMadrasah}%
            </span>
            <Progress value={persentaseMadrasah} className="h-1.5 mt-2" />
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Standar Kurikulum Kemenag Jabar
          </div>
        </div>

        {/* Total Dokumen Disetujui */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Dokumen Disetujui
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">
              {totalDokumenDisetujui}
            </span>
            <p className="text-xs text-slate-400 mt-0.5">Telah disahkan & terbit</p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Siap untuk supervisi
          </div>
        </div>

        {/* Guru Aktif */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Guru Aktif
            </span>
            <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-900">
              {totalGuruAktif} Orang
            </span>
            <p className="text-xs text-slate-400 mt-0.5">{rekapGuru.length} Penugasan kelas</p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Fase D (Kelas VII–IX)
          </div>
        </div>
      </div>

      {/* 2. Tombol Aksi & Rekap Tabel Guru */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Rekapitulasi Kelengkapan Perangkat Guru
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Matriks kelengkapan ATP, Prota, Prosem, dan RPP per penugasan mengajar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a href="/api/export/rekap-excel" download>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Export Rekap XLSX (Excel)
              </Button>
            </a>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            placeholder="Cari nama guru, mapel, rombel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        {/* Tabel Rekapitulasi */}
        <div className="rounded-lg border border-slate-200 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="p-3 w-10 text-center">No</th>
                <th className="p-3">Guru & NIP</th>
                <th className="p-3">Mata Pelajaran</th>
                <th className="p-3 text-center">Kelas</th>
                <th className="p-3 text-center">ATP</th>
                <th className="p-3 text-center">Prota</th>
                <th className="p-3 text-center">Prosem 1</th>
                <th className="p-3 text-center">Prosem 2</th>
                <th className="p-3 text-center">RPP Tersusun</th>
                <th className="p-3 text-center">Progres</th>
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
                filteredRekap.map((item, idx) => (
                  <tr key={`${item.penugasanId}-${idx}`} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 text-center font-medium text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-900 block">
                        {item.guruNama}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {item.guruNip ? `NIP: ${item.guruNip}` : "-"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-slate-800">{item.mapelNama}</span>
                      <span className="text-[11px] text-slate-400 block">Rombel: {item.rombel}</span>
                    </td>
                    <td className="p-3 text-center font-medium">
                      Kelas {item.tingkatKelas}
                    </td>
                    <td className="p-3 text-center">{getStatusBadge(item.atpStatus)}</td>
                    <td className="p-3 text-center">{getStatusBadge(item.protaStatus)}</td>
                    <td className="p-3 text-center">{getStatusBadge(item.prosem1Status)}</td>
                    <td className="p-3 text-center">{getStatusBadge(item.prosem2Status)}</td>
                    <td className="p-3 text-center">
                      <span className="font-semibold text-slate-800">
                        {item.rppCount} / {item.rppTarget} TP
                      </span>
                      <span className="text-[10px] text-emerald-600 block">
                        ({item.rppDisetujuiCount} disetujui)
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-bold text-slate-900 block">
                        {item.persentaseSelesai}%
                      </span>
                      <div className="w-16 mx-auto mt-1">
                        <Progress value={item.persentaseSelesai} className="h-1.5" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
