"use client";

import React, { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  FileText,
  Copy,
  Trash2,
  Eye,
  Edit,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Folder,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DialogBuatRpp } from "./dialog-buat-rpp";
import {
  duplicateRppAction,
  deleteRppAction,
  type RppCardItem,
} from "./actions";
import { getAvatarInfo } from "@/lib/avatar";
import type { DocStatus } from "@/types/database";

interface ModulAjarClientProps {
  initialList: RppCardItem[];
  penugasanList: Array<{
    id: string;
    tingkat_kelas: 7 | 8 | 9;
    rombel: string;
    mapel_nama: string;
    mapel_kode: string;
    jp_per_minggu: number;
  }>;
  tpListByPenugasan: Record<
    string,
    Array<{
      id: string;
      kode_tp: string;
      materi_pokok: string;
      tujuan_pembelajaran_teks: string;
      alokasi_jp?: number;
    }>
  >;
  isStaff?: boolean;
}

export function ModulAjarClient({
  initialList,
  penugasanList,
  tpListByPenugasan,
  isStaff = false,
}: ModulAjarClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [rppList, setRppList] = useState<RppCardItem[]>(initialList);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTingkat, setFilterTingkat] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterVersi, setFilterVersi] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [openGuruIds, setOpenGuruIds] = useState<Record<string, boolean>>({});

  // Dialog konfirmasi hapus
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filter list
  const filteredList = useMemo(() => {
    return rppList.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        item.materi_pokok.toLowerCase().includes(q) ||
        item.mapel.nama.toLowerCase().includes(q) ||
        item.rombel.toLowerCase().includes(q) ||
        item.guru.nama_lengkap.toLowerCase().includes(q) ||
        (item.guru.nip && item.guru.nip.includes(q));

      const matchTingkat =
        filterTingkat === "all" || String(item.tingkat_kelas) === filterTingkat;

      const matchStatus =
        filterStatus === "all" || item.status === filterStatus;

      const matchVersi =
        filterVersi === "all" || item.versi === filterVersi;

      return matchSearch && matchTingkat && matchStatus && matchVersi;
    });
  }, [rppList, searchQuery, filterTingkat, filterStatus, filterVersi]);

  // Group by guru for Admin view
  const groupedByGuru = useMemo(() => {
    if (!isStaff) return [];

    const map = new Map<
      string,
      {
        guruId: string;
        guruNama: string;
        guruNip: string | null;
        items: RppCardItem[];
      }
    >();

    filteredList.forEach((item) => {
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
  }, [filteredList, isStaff]);

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

  const getStatusBadge = (status: DocStatus) => {
    switch (status) {
      case "disetujui":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold text-[10px]">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Disetujui
          </Badge>
        );
      case "diajukan":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold text-[10px]">
            <Clock className="w-3 h-3 mr-1" />
            Diajukan
          </Badge>
        );
      case "revisi":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold text-[10px]">
            <AlertCircle className="w-3 h-3 mr-1" />
            Revisi
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700 text-[10px]">
            <FileCheck className="w-3 h-3 mr-1" />
            Draf
          </Badge>
        );
    }
  };

  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      const res = await duplicateRppAction(id);
      if (res.success && res.newRppId) {
        router.refresh();
      }
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    const res = await deleteRppAction(deleteTargetId);
    if (res.success) {
      setRppList((prev) => prev.filter((r) => r.id !== deleteTargetId));
      setDeleteTargetId(null);
    }
  };

  const renderRppCard = (item: RppCardItem) => (
    <Card
      key={item.id}
      className="hover:shadow-md transition-shadow border-slate-200 flex flex-col justify-between bg-white"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <Badge
              variant="outline"
              className={
                item.versi === "lengkap"
                  ? "bg-purple-50 text-purple-800 border-purple-200 font-bold text-[10px]"
                  : "bg-slate-100 text-slate-700 text-[10px]"
              }
            >
              {item.versi === "lengkap" ? "Versi Lengkap [L]" : "Versi Minimum"}
            </Badge>
            {item.model_pembelajaran_nama && (
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]"
              >
                {item.model_pembelajaran_nama.split("(")[0].trim()}
              </Badge>
            )}
          </div>
          {getStatusBadge(item.status)}
        </div>

        <CardTitle className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
          {item.materi_pokok}
        </CardTitle>

        <CardDescription className="text-xs text-slate-600 space-y-1 pt-1">
          <div className="font-semibold text-slate-800">
            {item.mapel.nama} • Kelas {item.tingkat_kelas} ({item.rombel})
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-3">
            <span>{item.alokasi_jp} JP ({item.jumlah_pertemuan} Pertemuan)</span>
            <span>•</span>
            <span>TP {item.tahun_ajaran.nama}</span>
          </div>
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          {!isStaff && <span>Oleh: {item.guru.nama_lengkap}</span>}
          <span className={isStaff ? "w-full text-right" : ""}>
            Update: {new Date(item.updated_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Tombol Aksi */}
        <div className="flex items-center gap-1.5 pt-1">
          <Link
            href={`/modul-ajar/${item.id}`}
            className={buttonVariants({
              size: "sm",
              className:
                "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8",
            })}
          >
            <Edit className="w-3.5 h-3.5 mr-1" />
            Buka RPP
          </Link>

          <Link
            href={`/modul-ajar/${item.id}/preview`}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className:
                "border-slate-200 text-slate-700 hover:bg-slate-50 h-8 px-2.5",
            })}
            title="Pratinjau Dokumen Cetak"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDuplicate(item.id)}
            disabled={isPending}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 h-8 px-2.5"
            title="Duplikat RPP"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>

          {(item.status === "draf" || item.status === "revisi") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTargetId(item.id)}
              disabled={isPending}
              className="border-rose-200 text-rose-700 hover:bg-rose-50 h-8 px-2.5"
              title="Hapus RPP"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold tracking-wider uppercase">
              Kurikulum Berbasis Cinta (KBC) • KMA 1503 Tahun 2025
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            RPP / Modul Ajar Pembelajaran Mendalam
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            {isStaff
              ? "Daftar RPP / Bahan Ajar yang disusun oleh guru madrasah. Klik nama guru untuk melihat rincian modul ajar mereka."
              : "Susun modul ajar terintegrasi Panca Cinta, Dimensi Profil Lulusan (DPL), dan sintaks model pembelajaran dengan alur berpikir mendalam."}
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold w-full sm:w-auto shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Buat RPP Baru
        </Button>
      </div>

      {/* Filter & Pencarian */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Cari materi pokok, mata pelajaran, nama guru, rombel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          {/* Filter Tingkat */}
          <Select value={filterTingkat} onValueChange={(val) => setFilterTingkat(val || "all")}>
            <SelectTrigger className="w-full sm:w-[120px] text-xs h-9">
              <SelectValue placeholder="Tingkat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              <SelectItem value="7">Kelas VII</SelectItem>
              <SelectItem value="8">Kelas VIII</SelectItem>
              <SelectItem value="9">Kelas IX</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Versi */}
          <Select value={filterVersi} onValueChange={(val) => setFilterVersi(val || "all")}>
            <SelectTrigger className="w-full sm:w-[130px] text-xs h-9">
              <SelectValue placeholder="Versi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Versi</SelectItem>
              <SelectItem value="lengkap">Versi Lengkap [L]</SelectItem>
              <SelectItem value="minimum">Versi Minimum</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter Status */}
          <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val || "all")}>
            <SelectTrigger className="w-full sm:w-[130px] col-span-2 sm:col-span-1 text-xs h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="draf">Draf</SelectItem>
              <SelectItem value="diajukan">Diajukan</SelectItem>
              <SelectItem value="revisi">Revisi</SelectItem>
              <SelectItem value="disetujui">Disetujui</SelectItem>
            </SelectContent>
          </Select>

          {/* Expand/Collapse buttons for staff */}
          {isStaff && groupedByGuru.length > 0 && (
            <div className="col-span-2 sm:col-span-auto flex items-center gap-1.5 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExpandAll}
                className="text-xs h-9 rounded-lg border-slate-200"
                title="Buka Semua Guru"
              >
                <FolderOpen className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Buka
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCollapseAll}
                className="text-xs h-9 rounded-lg border-slate-200"
                title="Tutup Semua Guru"
              >
                <Folder className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Tutup
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* TAMPILAN KHUSUS ADMIN: LIST BERTINGKAT BERDASARKAN GURU */}
      {isStaff ? (
        groupedByGuru.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-base">
                  Tidak Ada Dokumen RPP yang Cocok
                </h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Tidak ditemukan dokumen RPP yang sesuai dengan kata kunci atau filter pencarian.
                </p>
              </div>
            </CardContent>
          </Card>
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
                            {group.items.length} RPP Disusun
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

                  {/* List RPP Guru yang Muncul saat Diklik */}
                  {isOpen && (
                    <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 bg-slate-50/40">
                      <div className="pt-3 pb-2 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">
                          Daftar Modul Ajar ({group.items.length} RPP)
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Klik &quot;Buka RPP&quot; untuk memeriksa atau &quot;Preview&quot; untuk cetak
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                        {group.items.map((item) => renderRppCard(item))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* TAMPILAN GURU: GRID KARTU BIASA */
        filteredList.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-base">
                  Belum Ada Dokumen RPP / Modul Ajar
                </h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Mulai susun modul ajar pembelajaran mendalam KBC dengan memilih penugasan
                  dan Tujuan Pembelajaran (TP) yang telah dirumuskan.
                </p>
              </div>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Susun RPP Pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredList.map((item) => renderRppCard(item))}
          </div>
        )
      )}

      {/* Modal Dialog Buat RPP Baru */}
      <DialogBuatRpp
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        penugasanList={penugasanList}
        tpListByPenugasan={tpListByPenugasan}
      />

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
        title="Hapus Dokumen RPP?"
        description="Apakah Anda yakin ingin menghapus RPP ini? Dokumen dan seluruh langkah kegiatan yang telah disusun akan dihapus secara permanen."
        confirmText="Hapus Permanen"
        cancelText="Batal"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
