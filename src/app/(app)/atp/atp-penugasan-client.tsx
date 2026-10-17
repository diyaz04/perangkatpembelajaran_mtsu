"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
  Search,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Folder,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { getAvatarInfo } from "@/lib/avatar";
import type { PenugasanCardItem } from "./actions";
import type { DocStatus } from "@/types/database";

interface AtpPenugasanClientProps {
  penugasanList: PenugasanCardItem[];
  isStaff: boolean;
  error?: string;
}

export function AtpPenugasanClient({
  penugasanList,
  isStaff,
  error,
}: AtpPenugasanClientProps) {
  const [search, setSearch] = useState("");
  // Track open state for teachers (default first 3 open or all open if <= 5)
  const [openGuruIds, setOpenGuruIds] = useState<Record<string, boolean>>({});

  // Helper status badge
  const getStatusBadge = (status: DocStatus | string) => {
    switch (status) {
      case "disetujui":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1 font-semibold text-[11px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Disetujui
          </Badge>
        );
      case "diajukan":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1 font-semibold text-[11px]">
            <Clock className="w-3 h-3 text-blue-600" />
            Diajukan
          </Badge>
        );
      case "revisi":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1 font-semibold text-[11px]">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Revisi
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200 flex items-center gap-1 text-[11px]">
            <FileCheck className="w-3 h-3 text-slate-500" />
            Draf
          </Badge>
        );
    }
  };

  const getKelompokBadge = (kelompok: string) => {
    switch (kelompok) {
      case "PAI":
        return <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">PAI</Badge>;
      case "Bahasa Arab":
        return <Badge variant="secondary" className="bg-teal-50 text-teal-700 border border-teal-200 text-[10px]">Bahasa Arab</Badge>;
      case "muatan_lokal":
        return <Badge variant="secondary" className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px]">Muatan Lokal</Badge>;
      default:
        return <Badge variant="secondary" className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px]">Umum</Badge>;
    }
  };

  // Group by guru
  const groupedByGuru = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<
      string,
      {
        guruId: string;
        guruNama: string;
        guruNip: string | null;
        items: PenugasanCardItem[];
      }
    >();

    penugasanList.forEach((item) => {
      // Filter check
      if (q) {
        const match =
          item.guru.nama_lengkap.toLowerCase().includes(q) ||
          (item.guru.nip && item.guru.nip.includes(q)) ||
          item.mapel.nama.toLowerCase().includes(q) ||
          item.mapel.kode.toLowerCase().includes(q) ||
          item.rombel.toLowerCase().includes(q);
        if (!match) return;
      }

      const key = item.guru.id || item.guru.nama_lengkap;
      if (!map.has(key)) {
        map.set(key, {
          guruId: key,
          guruNama: item.guru.nama_lengkap,
          guruNip: item.guru.nip,
          items: [],
        });
      }
      map.get(key)!.items.push(item);
    });

    return Array.from(map.values()).sort((a, b) =>
      a.guruNama.localeCompare(b.guruNama)
    );
  }, [penugasanList, search]);

  const toggleGuru = (guruId: string) => {
    setOpenGuruIds((prev) => ({
      ...prev,
      [guruId]: prev[guruId] === undefined ? false : !prev[guruId],
    }));
  };

  const isGuruOpen = (guruId: string) => {
    // If not set yet, default to true if search is active or first few items
    if (openGuruIds[guruId] !== undefined) {
      return openGuruIds[guruId];
    }
    // Default open when searching or if only 1-5 teachers
    if (search.trim() || groupedByGuru.length <= 5) return true;
    return true; // default open for intuitive experience
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

  // Render Card for an individual Penugasan Item
  const renderPenugasanCard = (item: PenugasanCardItem) => (
    <Card
      key={item.id}
      className="flex flex-col justify-between hover:shadow-md transition-shadow border-slate-200/90 bg-white"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {getKelompokBadge(item.mapel.kelompok)}
            <Badge variant="outline" className="font-semibold bg-blue-50 text-blue-700 border-blue-200 text-xs">
              Kelas {item.tingkat_kelas === 7 ? "VII" : item.tingkat_kelas === 8 ? "VIII" : "IX"}
            </Badge>
            <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200 text-xs">
              Rombel {item.rombel}
            </Badge>
          </div>
          <div>{getStatusBadge(item.atp_status)}</div>
        </div>

        <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
          {item.mapel.nama}
        </CardTitle>
        <CardDescription className="text-slate-500 text-xs">
          Kode: <span className="font-mono font-medium text-slate-700">{item.mapel.kode}</span> • Alokasi:{" "}
          <span className="font-semibold text-slate-700">{item.mapel.jp_per_minggu} JP</span> / minggu
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3 py-2">
        {!isStaff && (
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex justify-between items-center">
            <span className="text-slate-500">Guru Pengampu:</span>
            <span className="font-medium text-slate-800">{item.guru.nama_lengkap}</span>
          </div>
        )}

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
            <div className="bg-white p-2 rounded border border-slate-200/80">
              <div className="text-slate-500 flex justify-between font-medium">
                <span>Smt 1:</span>
                <span className="font-bold text-slate-800">
                  {item.terisi_jp_smt1} / {item.target_jp_smt1} JP
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {item.minggu_efektif_smt1} mgg efektif
              </span>
            </div>

            <div className="bg-white p-2 rounded border border-slate-200/80">
              <div className="text-slate-500 flex justify-between font-medium">
                <span>Smt 2:</span>
                <span className="font-bold text-slate-800">
                  {item.terisi_jp_smt2} / {item.target_jp_smt2} JP
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {item.minggu_efektif_smt2} mgg efektif
              </span>
            </div>
          </div>
        </div>

        {/* Indikator Progres Elemen & TP */}
        <div className="grid grid-cols-2 gap-2 text-center pt-0.5">
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2">
            <div className="text-xs text-slate-500 mb-0.5">Elemen CP</div>
            <div className="font-bold text-slate-800 text-sm">{item.jumlah_elemen_cp}</div>
          </div>
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-2">
            <div className="text-xs text-emerald-700 mb-0.5">Jumlah TP</div>
            <div className="font-bold text-emerald-800 text-sm">{item.jumlah_tp}</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
        <Link
          href={`/atp/${item.id}`}
          prefetch={true}
          className={buttonVariants({
            className: "flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs shadow-xs h-8.5",
          })}
        >
          <Layers className="w-3.5 h-3.5 mr-1.5" />
          Wizard ATP
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>

        <div className="flex items-center gap-1 shrink-0">
          <Link
            href={`/atp/${item.id}/preview-cp`}
            prefetch={true}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "h-8.5 px-2 text-xs text-blue-700 hover:bg-blue-50 border-slate-200",
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
              className: "h-8.5 px-2 text-xs text-amber-700 hover:bg-amber-50 border-slate-200",
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
              className: "h-8.5 px-2 text-xs text-emerald-700 hover:bg-emerald-50 border-slate-200",
            })}
            title="Lihat & Cetak Dokumen ATP"
          >
            <Eye className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            ATP
          </Link>
        </div>
      </CardFooter>
    </Card>
  );

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
              {isStaff
                ? "Daftar penugasan guru madrasah. Klik pada nama guru di bawah untuk membuka dan memeriksa rincian pekerjaan CP & ATP."
                : "Pilih kartu penugasan kelas Anda di bawah untuk memulai wizard 3 langkah: (1) Analisis Elemen CP → (2) Rumuskan TP SOLO/Bloom → (3) Susun & Urutkan ATP."}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-emerald-800/80 px-3 py-1.5 rounded-lg border border-emerald-700 text-emerald-100 shrink-0">
            <GraduationCap className="w-4 h-4 text-emerald-300" />
            <span>Fase D (Tingkat MTs)</span>
          </div>
        </div>
      </div>

      {/* Pesan Error jika ada */}
      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          {error}
        </div>
      )}

      {/* TAMPILAN KHUSUS ADMIN / STAFF: LIST BERTINGKAT PER GURU */}
      {isStaff ? (
        <div className="space-y-4">
          {/* Bar Kontrol & Pencarian */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                placeholder="Cari nama guru, NIP, mata pelajaran, rombel..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs rounded-xl bg-slate-50 border-slate-200 h-9"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-slate-500 font-medium mr-1 hidden md:inline">
                {groupedByGuru.length} Guru • {penugasanList.length} Penugasan
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
          </div>

          {groupedByGuru.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Tidak Ada Data Penugasan Guru"
              description="Tidak ditemukan penugasan guru yang sesuai dengan kriteria pencarian Anda."
            />
          ) : (
            <div className="space-y-3">
              {groupedByGuru.map((group) => {
                const isOpen = isGuruOpen(group.guruId);
                const avatar = getAvatarInfo(group.guruNama);

                // Hitung status penugasan guru ini
                const disetujuiCount = group.items.filter((i) => i.atp_status === "disetujui").length;
                const diajukanCount = group.items.filter((i) => i.atp_status === "diajukan").length;
                const revisiCount = group.items.filter((i) => i.atp_status === "revisi").length;
                const drafCount = group.items.filter((i) => !i.atp_status || i.atp_status === "draf").length;

                return (
                  <div
                    key={group.guruId}
                    className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden transition-all duration-200"
                  >
                    {/* Header Guru (Bisa diklik untuk expand/collapse) */}
                    <button
                      type="button"
                      onClick={() => toggleGuru(group.guruId)}
                      className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Avatar Guru Berwarna */}
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
                              {group.items.length} Kelas
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-400 block mt-0.5">
                            {group.guruNip ? `NIP: ${group.guruNip}` : "NIP: -"}
                          </span>
                        </div>
                      </div>

                      {/* Status Pills & Chevron */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="hidden sm:flex items-center gap-1.5">
                          {disetujuiCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {disetujuiCount} Disetujui
                            </span>
                          )}
                          {diajukanCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              <Clock className="w-3 h-3 text-blue-600" />
                              {diajukanCount} Diajukan
                            </span>
                          )}
                          {revisiCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              {revisiCount} Revisi
                            </span>
                          )}
                          {drafCount > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {drafCount} Draf
                            </span>
                          )}
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

                    {/* Content / List Pekerjaan Guru (Muncul saat diklik) */}
                    {isOpen && (
                      <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 bg-slate-50/40">
                        <div className="pt-3 pb-2 flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">
                            Daftar Penugasan CP & ATP ({group.items.length} Pekerjaan)
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Klik &quot;Wizard ATP&quot; untuk memeriksa atau &quot;Preview&quot; untuk cetak
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                          {group.items.map((item) => renderPenugasanCard(item))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* TAMPILAN GURU: GRID KARTU KELAS MILIK SENDIRI */
        penugasanList.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Belum Ada Penugasan Guru Aktif"
            description="Anda belum memiliki penugasan mata pelajaran di tahun ajaran aktif. Silakan hubungi admin atau waka kurikulum untuk menambahkan penugasan kelas Anda."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {penugasanList.map((item) => renderPenugasanCard(item))}
          </div>
        )
      )}
    </div>
  );
}
