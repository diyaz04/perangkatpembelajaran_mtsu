"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  LayoutList,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  GraduationCap,
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
import type { ProsemCardItem } from "./actions";
import type { DocStatus } from "@/types/database";

interface ProsemPenugasanClientProps {
  penugasanList: ProsemCardItem[];
  isStaff: boolean;
  error?: string;
}

export function ProsemPenugasanClient({
  penugasanList,
  isStaff,
  error,
}: ProsemPenugasanClientProps) {
  const [search, setSearch] = useState("");
  const [openGuruIds, setOpenGuruIds] = useState<Record<string, boolean>>({});

  const getStatusBadge = (status: DocStatus | string) => {
    switch (status) {
      case "disetujui":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1 text-[11px] font-semibold">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Disetujui
          </Badge>
        );
      case "diajukan":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1 text-[11px] font-semibold">
            <Clock className="w-3 h-3 text-blue-600" />
            Diajukan
          </Badge>
        );
      case "revisi":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1 text-[11px] font-semibold">
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
        items: ProsemCardItem[];
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
    return true;
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

  const renderProsemCard = (item: ProsemCardItem) => (
    <Card
      key={item.id}
      className="flex flex-col border border-slate-200/90 shadow-2xs hover:shadow-md transition-shadow duration-200 bg-white"
    >
      <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 font-semibold text-xs">
            Kelas {item.tingkat_kelas} ({item.rombel})
          </Badge>
          <span className="text-xs font-mono text-slate-500 font-medium">
            {item.mapel.jp_per_minggu} JP/minggu
          </span>
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
        {/* Kartu Status Semester 1 */}
        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-slate-900">Semester 1 (Ganjil)</span>
              <span className="text-[11px] text-slate-500">
                ({item.semester1.minggu_efektif} mg efektif)
              </span>
            </div>
            {getStatusBadge(item.semester1.status)}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Alokasi Matriks:</span>
            <span className="font-semibold text-slate-900">
              {item.semester1.total_jp_terdistribusi} / {item.semester1.total_jp_efektif} JP
            </span>
          </div>

          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                item.semester1.total_jp_terdistribusi > item.semester1.total_jp_efektif
                  ? "bg-rose-500"
                  : "bg-emerald-600"
              }`}
              style={{
                width: `${
                  item.semester1.total_jp_efektif > 0
                    ? Math.min(
                        100,
                        (item.semester1.total_jp_terdistribusi / item.semester1.total_jp_efektif) * 100
                      )
                    : 0
                }%`,
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Link
              href={`/prosem/${item.id}/preview?semester=1`}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              Pratinjau Smt 1
            </Link>
            <Link
              href={`/prosem/${item.id}?semester=1`}
              className={buttonVariants({
                variant: "outline",
                size: "xs",
                className: "text-emerald-700 hover:bg-emerald-50 border-emerald-200 font-medium text-[11px] h-7 px-2.5",
              })}
            >
              Matriks Smt 1 &rarr;
            </Link>
          </div>
        </div>

        {/* Kartu Status Semester 2 */}
        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-slate-900">Semester 2 (Genap)</span>
              <span className="text-[11px] text-slate-500">
                ({item.semester2.minggu_efektif} mg efektif)
              </span>
            </div>
            {getStatusBadge(item.semester2.status)}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Alokasi Matriks:</span>
            <span className="font-semibold text-slate-900">
              {item.semester2.total_jp_terdistribusi} / {item.semester2.total_jp_efektif} JP
            </span>
          </div>

          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                item.semester2.total_jp_terdistribusi > item.semester2.total_jp_efektif
                  ? "bg-rose-500"
                  : "bg-emerald-600"
              }`}
              style={{
                width: `${
                  item.semester2.total_jp_efektif > 0
                    ? Math.min(
                        100,
                        (item.semester2.total_jp_terdistribusi / item.semester2.total_jp_efektif) * 100
                      )
                    : 0
                }%`,
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Link
              href={`/prosem/${item.id}/preview?semester=2`}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              Pratinjau Smt 2
            </Link>
            <Link
              href={`/prosem/${item.id}?semester=2`}
              className={buttonVariants({
                variant: "outline",
                size: "xs",
                className: "text-emerald-700 hover:bg-emerald-50 border-emerald-200 font-medium text-[11px] h-7 px-2.5",
              })}
            >
              Matriks Smt 2 &rarr;
            </Link>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>TP {item.tahun_ajaran.nama}</span>
        </div>

        <Link
          href={`/prosem/${item.id}?semester=1`}
          className={buttonVariants({
            variant: "default",
            size: "sm",
            className: "bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs h-8 px-3",
          })}
        >
          <span>Buka Editor Prosem</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </CardFooter>
    </Card>
  );

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Program Semester (Prosem)"
        description="Matriks alokasi waktu mingguan per Tujuan Pembelajaran (TP) berbasis kalender pendidikan dan minggu efektif madrasah"
        actions={
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 gap-1.5 py-1 px-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Distribusi Matriks Mingguan
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
              icon={LayoutList}
              title="Tidak Ada Data Penugasan Prosem"
              description="Tidak ditemukan penugasan guru yang sesuai dengan kriteria pencarian Anda."
            />
          ) : (
            <div className="space-y-3">
              {groupedByGuru.map((group) => {
                const isOpen = isGuruOpen(group.guruId);
                const avatar = getAvatarInfo(group.guruNama);

                // Hitung status penugasan semester 1 & 2
                const disetujuiCount = group.items.filter(
                  (i) => i.semester1.status === "disetujui" || i.semester2.status === "disetujui"
                ).length;
                const diajukanCount = group.items.filter(
                  (i) => i.semester1.status === "diajukan" || i.semester2.status === "diajukan"
                ).length;
                const revisiCount = group.items.filter(
                  (i) => i.semester1.status === "revisi" || i.semester2.status === "revisi"
                ).length;

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

                    {/* Content: List Pekerjaan Guru (Prosem per kelas) */}
                    {isOpen && (
                      <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 bg-slate-50/40">
                        <div className="pt-3 pb-2 flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold text-slate-700">
                            Daftar Program Semester ({group.items.length} Kelas)
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Buka Matriks Semester 1 atau 2 untuk memeriksa alokasi mingguan
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                          {group.items.map((item) => renderProsemCard(item))}
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
            icon={LayoutList}
            title="Belum Ada Penugasan Mengajar Aktif"
            description={
              error ||
              "Anda belum memiliki penugasan mengajar di tahun ajaran aktif, atau admin madrasah belum mengatur penugasan guru."
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {penugasanList.map((item) => renderProsemCard(item))}
          </div>
        )
      )}
    </div>
  );
}
