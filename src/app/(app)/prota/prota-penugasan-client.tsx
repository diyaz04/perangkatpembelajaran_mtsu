"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
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
import type { ProtaCardItem } from "./actions";
import type { DocStatus } from "@/types/database";

interface ProtaPenugasanClientProps {
  penugasanList: ProtaCardItem[];
  isStaff: boolean;
  error?: string;
}

export function ProtaPenugasanClient({
  penugasanList,
  isStaff,
  error,
}: ProtaPenugasanClientProps) {
  const [search, setSearch] = useState("");
  const [openGuruIds, setOpenGuruIds] = useState<Record<string, boolean>>({});

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
          <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200 text-[11px]">
            Draf
          </Badge>
        );
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
        items: ProtaCardItem[];
      }
    >();

    penugasanList.forEach((item) => {
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
    if (openGuruIds[guruId] !== undefined) {
      return openGuruIds[guruId];
    }
    return true; // Default expanded for great UX
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

  const renderProtaCard = (item: ProtaCardItem) => {
    const isOverallocated = item.total_jp_terdistribusi > item.total_jp_efektif;
    const sisaJp = item.total_jp_efektif - item.total_jp_terdistribusi;
    const rasioSisa = item.total_jp_efektif > 0 ? sisaJp / item.total_jp_efektif : 0;
    const isUnderallocated = rasioSisa > 0.2;

    return (
      <Card
        key={item.id}
        className="flex flex-col border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow duration-200 bg-white"
      >
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-start justify-between gap-2">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 font-semibold text-xs">
              Kelas {item.tingkat_kelas} ({item.rombel})
            </Badge>
            {getStatusBadge(item.status)}
          </div>
          <CardTitle className="text-base font-bold text-slate-900 mt-2 line-clamp-1">
            {item.mapel.nama}
          </CardTitle>
          {!isStaff && (
            <CardDescription className="text-xs text-slate-500 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <span>{item.guru.nama_lengkap}</span>
              {item.guru.nip && <span className="text-slate-400">({item.guru.nip})</span>}
            </CardDescription>
          )}
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
              className: "text-slate-600 hover:text-slate-900 border-slate-200 h-8.5 px-3 text-xs",
            })}
          >
            <Eye className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Pratinjau
          </Link>

          <Link
            href={`/prota/${item.id}`}
            className={buttonVariants({
              variant: "default",
              size: "sm",
              className: "bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-8.5 px-3.5 text-xs",
            })}
          >
            <span>Buka Prota</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Link>
        </CardFooter>
      </Card>
    );
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

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
          {error}
        </div>
      )}

      {/* TAMPILAN KHUSUS ADMIN / STAFF: LIST BERTINGKAT PER GURU */}
      {isStaff ? (
        <div className="space-y-4">
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
              icon={Calendar}
              title="Tidak Ada Data Penugasan Prota"
              description="Tidak ditemukan penugasan guru yang sesuai dengan kriteria pencarian Anda."
            />
          ) : (
            <div className="space-y-3">
              {groupedByGuru.map((group) => {
                const isOpen = isGuruOpen(group.guruId);
                const avatar = getAvatarInfo(group.guruNama);

                const disetujuiCount = group.items.filter((i) => i.status === "disetujui").length;
                const diajukanCount = group.items.filter((i) => i.status === "diajukan").length;
                const revisiCount = group.items.filter((i) => i.status === "revisi").length;
                const drafCount = group.items.filter((i) => !i.status || i.status === "draf").length;

                return (
                  <div
                    key={group.guruId}
                    className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden transition-all duration-200"
                  >
                    {/* Header Guru Bertingkat */}
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
                              {group.items.length} Kelas
                            </Badge>
                          </div>
                          <span className="text-xs text-slate-400 block mt-0.5">
                            {group.guruNip ? `NIP: ${group.guruNip}` : "NIP: -"}
                          </span>
                        </div>
                      </div>

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

                    {/* Pekerjaan Guru yang Terbuka saat Diklik */}
                    {isOpen && (
                      <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 bg-slate-50/40">
                        <div className="pt-3 pb-2 flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">
                            Daftar Program Tahunan ({group.items.length} Kelas)
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Klik &quot;Buka Prota&quot; untuk mengedit distribusi atau &quot;Pratinjau&quot; untuk cetak
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                          {group.items.map((item) => renderProtaCard(item))}
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
        /* TAMPILAN GURU: GRID KARTU BIASA */
        penugasanList.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Belum Ada Penugasan Mengajar Aktif"
            description={
              error ||
              "Anda belum memiliki penugasan mengajar di tahun ajaran aktif, atau admin madrasah belum mengatur penugasan guru."
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {penugasanList.map((item) => renderProtaCard(item))}
          </div>
        )
      )}
    </div>
  );
}
