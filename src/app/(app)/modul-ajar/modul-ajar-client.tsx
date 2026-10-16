"use client";

import React, { useState, useTransition } from "react";
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
}

export function ModulAjarClient({
  initialList,
  penugasanList,
  tpListByPenugasan,
}: ModulAjarClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [rppList, setRppList] = useState<RppCardItem[]>(initialList);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTingkat, setFilterTingkat] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterVersi, setFilterVersi] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Dialog konfirmasi hapus
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Filter list
  const filteredList = rppList.filter((item) => {
    // Search query
    const matchSearch =
      item.materi_pokok.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mapel.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rombel.toLowerCase().includes(searchQuery.toLowerCase());

    // Tingkat filter
    const matchTingkat =
      filterTingkat === "all" || String(item.tingkat_kelas) === filterTingkat;

    // Status filter
    const matchStatus =
      filterStatus === "all" || item.status === filterStatus;

    // Versi filter
    const matchVersi =
      filterVersi === "all" || item.versi === filterVersi;

    return matchSearch && matchTingkat && matchStatus && matchVersi;
  });

  const getStatusBadge = (status: DocStatus) => {
    switch (status) {
      case "disetujui":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Disetujui
          </Badge>
        );
      case "diajukan":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <Clock className="w-3 h-3 mr-1" />
            Diajukan
          </Badge>
        );
      case "revisi":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            Revisi
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700">
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
            Susun modul ajar terintegrasi Panca Cinta, Dimensi Profil Lulusan (DPL),
            dan sintaks model pembelajaran dengan alur berpikir mendalam.
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold"
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
            placeholder="Cari materi pokok, mata pelajaran, rombel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Tingkat */}
          <Select value={filterTingkat} onValueChange={(val) => setFilterTingkat(val || "all")}>
            <SelectTrigger className="w-[120px] text-xs h-9">
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
            <SelectTrigger className="w-[130px] text-xs h-9">
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
            <SelectTrigger className="w-[130px] text-xs h-9">
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
        </div>
      </div>

      {/* List / Grid Kartu RPP */}
      {filteredList.length === 0 ? (
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
          {filteredList.map((item) => {
            return (
              <Card
                key={item.id}
                className="hover:shadow-md transition-shadow border-slate-200 flex flex-col justify-between"
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
                    <span>Oleh: {item.guru.nama_lengkap}</span>
                    <span>
                      {new Date(item.updated_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
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
          })}
        </div>
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
