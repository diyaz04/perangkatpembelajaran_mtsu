"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  ExternalLink,
  Edit2,
  FileText,
  Heart,
  Layers,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Info,
  Check,
} from "lucide-react";

import type {
  BankDataOverview,
  StatusRiset,
} from "./actions";
import {
  getBankDataMapelDetailAction,
  toggleVerifyMapelAction,
  updateCpDeskripsiAction,
} from "./actions";
import type { MapelBankData } from "@/lib/bank-data/schema";

interface RegulasiItem {
  kode: string;
  judul: string;
  nomor: string;
  tanggal: string;
  url?: string;
  cakupan: string;
}

interface KbcItem {
  id: number;
  topik_panca_cinta_id: number;
  topik_panca_cinta_kode: string;
  topik_panca_cinta_nama: string;
  judul: string;
  ringkasan: string;
  dalil_hikmah?: string;
  aplikasi_pembelajaran?: string[];
}

interface DplItem {
  id: number;
  kode: string;
  nama: string;
  deskripsi: string;
  elemen_kunci: string[];
}

interface KkoCategoryItem {
  tingkat: string;
  nama: string;
  deskripsi: string;
  kata_kerja: string[];
}

interface BankDataAuxiliaryData {
  regulasi?: RegulasiItem[];
  pancaCinta?: unknown[];
  dpl?: DplItem[];
  kbc?: KbcItem[];
  kko?: {
    kognitif?: KkoCategoryItem[];
    afektif?: KkoCategoryItem[];
    psikomotorik?: KkoCategoryItem[];
  };
}

interface DbMapelDetail {
  id: string;
  nama: string;
  status_verifikasi?: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
}

interface DbCpDetail {
  id: string;
  kode_elemen?: string | null;
  elemen: string;
  deskripsi_cp: string;
  asal?: string | null;
  status_verifikasi?: string | null;
}

interface DbMateriDetail {
  id: string;
  tingkat: number;
  semester: number;
  urutan: number;
  bab: string;
  subbab: string[];
}

interface BankDataClientProps {
  overview?: BankDataOverview;
  auxiliary?: BankDataAuxiliaryData;
  userRole: string;
}

export function BankDataClient({ overview, auxiliary, userRole }: BankDataClientProps) {
  const [mainTab, setMainTab] = useState<string>("mapel");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKelompok, setFilterKelompok] = useState<string>("all");
  const [filterVerifikasi, setFilterVerifikasi] = useState<string>("all");
  const [filterStatusRiset, setFilterStatusRiset] = useState<string>("all");

  // Detail Modal / Sheet state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMapelSlug, setSelectedMapelSlug] = useState<string | null>(null);
  const [mapelDetail, setMapelDetail] = useState<{
    bankData: MapelBankData;
    dbMapel: DbMapelDetail | null;
    dbCps: DbCpDetail[];
    dbMateri: DbMateriDetail[];
  } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Edit CP State
  const [editingCp, setEditingCp] = useState<{
    id?: string;
    kode: string;
    nama: string;
    deskripsi: string;
  } | null>(null);
  const [editCpModalOpen, setEditCpModalOpen] = useState(false);
  const [savingCp, setSavingCp] = useState(false);

  // Detail tab state (CP vs Materi vs Sumber)
  const [detailTab, setDetailTab] = useState<string>("cp");
  const [materiTingkatFilter, setMateriTingkatFilter] = useState<number>(7);
  const [materiSemesterFilter, setMateriSemesterFilter] = useState<number | "all">("all");

  const canVerify = userRole === "admin" || userRole === "waka_kurikulum";

  // Filtered mapel list
  const filteredMapel = (overview?.mapelList || []).filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.nama.toLowerCase().includes(q);
      const matchSlug = item.slug.toLowerCase().includes(q);
      if (!matchName && !matchSlug) return false;
    }
    if (filterKelompok !== "all" && item.kelompok !== filterKelompok) return false;
    if (filterVerifikasi !== "all" && item.status_verifikasi !== filterVerifikasi) return false;
    if (filterStatusRiset !== "all" && item.status_riset !== filterStatusRiset) return false;
    return true;
  });

  async function handleOpenDetail(slug: string) {
    setSelectedMapelSlug(slug);
    setDetailOpen(true);
    setLoadingDetail(true);
    const res = await getBankDataMapelDetailAction(slug);
    if (res.success && res.data) {
      setMapelDetail(res.data);
    } else {
      toast.error(res.error || "Gagal memuat detail mapel");
      setDetailOpen(false);
    }
    setLoadingDetail(false);
  }

  function handleToggleVerify(slug: string, currentStatus: "terverifikasi" | "belum") {
    startTransition(async () => {
      const nextStatus = currentStatus !== "terverifikasi";
      const res = await toggleVerifyMapelAction(slug, nextStatus);
      if (res.success) {
        toast.success(
          nextStatus
            ? "Mata pelajaran berhasil diverifikasi waka kurikulum"
            : "Status verifikasi mata pelajaran dicabut"
        );
        // Refresh detail if open
        if (selectedMapelSlug === slug) {
          void handleOpenDetail(slug);
        }
      } else {
        toast.error(res.error || "Gagal memperbarui verifikasi");
      }
    });
  }

  async function handleSaveCp() {
    if (!editingCp) return;
    setSavingCp(true);
    // Find CP id from dbCps or use matched
    const cpRow = mapelDetail?.dbCps.find(
      (c) => c.kode_elemen === editingCp.kode || c.elemen === editingCp.nama
    );
    if (!cpRow?.id) {
      toast.error("Data CP belum tersinkron di database. Jalankan migrasi database terlebih dahulu.");
      setSavingCp(false);
      return;
    }

    const res = await updateCpDeskripsiAction(cpRow.id, editingCp.deskripsi);
    if (res.success) {
      toast.success("Deskripsi CP berhasil diperbarui dan ditandai sebagai entri manual");
      setEditCpModalOpen(false);
      if (selectedMapelSlug) {
        void handleOpenDetail(selectedMapelSlug);
      }
    } else {
      toast.error(res.error || "Gagal memperbarui deskripsi CP");
    }
    setSavingCp(false);
  }

  function renderStatusBadge(status: StatusRiset) {
    switch (status) {
      case "LENGKAP":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-medium">
            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
            Lengkap
          </Badge>
        );
      case "SEKUNDER_PERLU_CEK":
        return (
          <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-medium">
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
            Perlu Cek (Sekunder)
          </Badge>
        );
      case "TIDAK_DITEMUKAN":
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-medium">
            <XCircle className="w-3 h-3 mr-1 text-rose-600" />
            Tidak Ditemukan
          </Badge>
        );
      case "SEBAGIAN":
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-medium">
            <Clock className="w-3 h-3 mr-1 text-blue-600" />
            Sebagian
          </Badge>
        );
    }
  }

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/master-data"
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Master Data
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Bank Data Fase D (Kelas VII–IX MTs)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Repositori resmi Capaian Pembelajaran per elemen, 311 materi pokok, integrasi Panca Cinta, dan DPL untuk Tahun Ajaran 2026/2027.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 py-1 px-3">
            Versi {overview?.manifest.versi || "2026-2027-v1"}
          </Badge>
          <Badge className="bg-emerald-600 text-white py-1 px-3">
            TA {overview?.manifest.tahun_ajaran || "2026/2027"}
          </Badge>
        </div>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Mata Pelajaran</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                {overview?.summary.total_mapel || 16}
              </h3>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">100% Terdata Lengkap</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Elemen CP Verbatim</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                {overview?.summary.total_cp || 63}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">KMA 1503 & BSKAP 032</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Bab Materi Pokok</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">
                {overview?.summary.total_materi || 311}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">Kelas VII, VIII, IX</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Verifikasi Waka</p>
              <h3 className="text-2xl font-bold text-emerald-700 mt-0.5">
                {overview?.summary.terverifikasi_count || 16} / {overview?.summary.total_mapel || 16}
              </h3>
              <p className="text-[11px] text-emerald-600 mt-1 font-medium">Siap Digunakan Guru</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Menu Utama */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-4">
        <TabsList className="bg-slate-100 p-1 border border-slate-200">
          <TabsTrigger value="mapel" className="text-xs data-[state=active]:bg-white">
            <BookOpen className="w-3.5 h-3.5 mr-1.5" />
            16 Mata Pelajaran & Riset
          </TabsTrigger>
          <TabsTrigger value="regulasi" className="text-xs data-[state=active]:bg-white">
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Regulasi Resmi
          </TabsTrigger>
          <TabsTrigger value="panca_cinta" className="text-xs data-[state=active]:bg-white">
            <Heart className="w-3.5 h-3.5 mr-1.5" />
            Panca Cinta & KBC
          </TabsTrigger>
          <TabsTrigger value="dpl" className="text-xs data-[state=active]:bg-white">
            <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
            8 Dimensi DPL
          </TabsTrigger>
          <TabsTrigger value="kko" className="text-xs data-[state=active]:bg-white">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            KKO Bloom (C1-C6)
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: 16 MATA PELAJARAN */}
        <TabsContent value="mapel" className="space-y-4">
          {/* Filter Bar */}
          <Card className="border-slate-200 shadow-xs">
            <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  placeholder="Cari mata pelajaran atau slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={filterKelompok}
                  onChange={(e) => setFilterKelompok(e.target.value)}
                  aria-label="Filter Kelompok"
                  className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700"
                >
                  <option value="all">Semua Kelompok</option>
                  <option value="PAI">PAI</option>
                  <option value="Bahasa Arab">Bahasa Arab</option>
                  <option value="umum">Umum</option>
                  <option value="muatan_lokal">Muatan Lokal</option>
                </select>

                <select
                  value={filterStatusRiset}
                  onChange={(e) => setFilterStatusRiset(e.target.value)}
                  aria-label="Filter Status Riset"
                  className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700"
                >
                  <option value="all">Semua Status Riset</option>
                  <option value="LENGKAP">Lengkap (Primer)</option>
                  <option value="SEKUNDER_PERLU_CEK">Perlu Cek (Sekunder)</option>
                  <option value="TIDAK_DITEMUKAN">Tidak Ditemukan</option>
                  <option value="SEBAGIAN">Sebagian</option>
                </select>

                <select
                  value={filterVerifikasi}
                  onChange={(e) => setFilterVerifikasi(e.target.value)}
                  aria-label="Filter Status Verifikasi"
                  className="text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-700"
                >
                  <option value="all">Semua Status Verifikasi</option>
                  <option value="terverifikasi">Terverifikasi</option>
                  <option value="belum">Belum Diverifikasi</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Tabel Mata Pelajaran */}
          <Card className="border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-12 text-center text-xs">No</TableHead>
                    <TableHead className="text-xs">Mata Pelajaran</TableHead>
                    <TableHead className="text-xs">Kelompok</TableHead>
                    <TableHead className="text-xs">Status Riset</TableHead>
                    <TableHead className="text-xs">Sumber CP</TableHead>
                    <TableHead className="text-xs text-center">Elemen CP</TableHead>
                    <TableHead className="text-xs text-center">Materi (Kls 7 / 8 / 9)</TableHead>
                    <TableHead className="text-xs">Status Verifikasi</TableHead>
                    <TableHead className="w-28 text-center text-xs">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMapel.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-slate-500 text-xs">
                        Tidak ada mata pelajaran yang cocok dengan filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMapel.map((m, idx) => (
                      <TableRow key={m.slug} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell className="text-center text-xs text-slate-500">{idx + 1}</TableCell>
                        <TableCell>
                          <div>
                            <span className="font-semibold text-xs text-slate-900 block">{m.nama}</span>
                            <span className="text-[11px] text-slate-400 font-mono">{m.slug}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[11px] capitalize">
                            {m.kelompok.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{renderStatusBadge(m.status_riset)}</TableCell>
                        <TableCell>
                          <div className="max-w-[220px]">
                            <span className="font-medium text-xs text-slate-800 block truncate">
                              {m.sumber_cp.regulasi_kode}
                            </span>
                            <span className="text-[11px] text-slate-500 truncate block">
                              {m.sumber_cp.halaman ? `Hal. ${m.sumber_cp.halaman}` : m.sumber_cp.nama}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-semibold text-xs">
                            {m.cp_count} Elemen
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-xs font-medium text-slate-700">
                            {m.materi_count.kls7} / {m.materi_count.kls8} / {m.materi_count.kls9}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            (Total {m.materi_count.total} Bab)
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            {m.status_verifikasi === "terverifikasi" ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">
                                <Check className="w-3 h-3 mr-1" />
                                Terverifikasi
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[11px]">
                                Belum Diverifikasi
                              </Badge>
                            )}
                            {m.verified_by_nama && (
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                Oleh {m.verified_by_nama}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleOpenDetail(m.slug)}
                            className="text-xs h-8 px-2.5 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                          >
                            Telaah Detail
                            <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: REGULASI RESMI */}
        <TabsContent value="regulasi" className="space-y-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Landasan Hukum & Regulasi Resmi</CardTitle>
              <CardDescription className="text-xs">
                Dokumen yuridis formal yang menjadi rujukan perumusan Capaian Pembelajaran dan Kurikulum MTs Tahun Ajaran 2026/2027.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(auxiliary?.regulasi || []).map((r: RegulasiItem) => (
                <div key={r.kode} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-white font-mono text-xs">
                      {r.nomor}
                    </Badge>
                    <span className="text-[11px] text-slate-400">Tgl: {r.tanggal}</span>
                  </div>
                  <h4 className="font-semibold text-sm text-slate-900">{r.judul}</h4>
                  <p className="text-xs text-slate-600">{r.cakupan}</p>
                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Kode: {r.kode}</span>
                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:underline inline-flex items-center gap-1 font-medium"
                      >
                        Lihat Sumber Resmi
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: PANCA CINTA & KBC */}
        <TabsContent value="panca_cinta" className="space-y-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">5 Pilar Panca Cinta & Materi KBC Terintegrasi</CardTitle>
              <CardDescription className="text-xs">
                Pilar pembentukan karakter khas Madrasah: Cinta Allah & Rasul, Cinta Ilmu, Cinta Lingkungan, Cinta Sesama, dan Cinta Tanah Air.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(auxiliary?.kbc || []).map((k: KbcItem) => (
                <div key={k.id} className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-emerald-600 text-white text-xs">
                      {k.topik_panca_cinta_kode} · {k.topik_panca_cinta_nama}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-sm text-emerald-950">{k.judul}</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{k.ringkasan}</p>
                  {k.dalil_hikmah && (
                    <div className="p-2.5 rounded-md bg-white border border-emerald-200/60 text-xs text-emerald-900 italic font-serif">
                      &ldquo;{k.dalil_hikmah}&rdquo;
                    </div>
                  )}
                  <div className="pt-1">
                    <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Aplikasi Pembelajaran Terintegrasi:
                    </span>
                    <ul className="text-xs text-slate-600 space-y-0.5 list-disc list-inside">
                      {k.aplikasi_pembelajaran?.map((ap: string, i: number) => (
                        <li key={i}>{ap}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: 8 DIMENSI DPL */}
        <TabsContent value="dpl" className="space-y-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">8 Dimensi Profil Lulusan (DPL1–DPL8)</CardTitle>
              <CardDescription className="text-xs">
                Profil lulusan madrasah sesuai regulasi KMA 1503/2025 yang diintegrasikan ke dalam tujuan dan modul ajar.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {(auxiliary?.dpl || []).map((d: DplItem) => (
                <div key={d.kode} className="p-3 rounded-lg border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-xs font-bold text-purple-700 bg-purple-50">
                      {d.kode}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-xs text-slate-900">{d.nama}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{d.deskripsi}</p>
                  <div className="pt-1">
                    <span className="text-[10px] font-medium text-slate-400 block mb-0.5">Elemen Kunci:</span>
                    <div className="flex flex-wrap gap-1">
                      {d.elemen_kunci?.map((el: string, i: number) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {el}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: KKO BLOOM */}
        <TabsContent value="kko" className="space-y-4">
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Kata Kerja Operasional (KKO) Taksonomi Bloom Revisi</CardTitle>
              <CardDescription className="text-xs">
                Panduan memilih kata kerja operasional yang terukur untuk perumusan Tujuan Pembelajaran (TP) dari tingkat C1 hingga C6.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(auxiliary?.kko?.kognitif || []).map((k: KkoCategoryItem) => (
                <div key={k.tingkat} className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-slate-900 text-white text-xs">{k.tingkat}</Badge>
                    <span className="font-semibold text-xs text-slate-800">{k.nama}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">{k.deskripsi}</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {k.kata_kerja?.map((verb: string, idx: number) => (
                      <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                        {verb}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DETAIL MODAL / DIALOG */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          {loadingDetail || !mapelDetail ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500">Memuat detail bank data mata pelajaran...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <DialogTitle className="text-lg font-bold text-slate-900">
                      {mapelDetail.bankData.mapel} (Fase D)
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500 mt-0.5">
                      Kelompok: <span className="font-medium capitalize">{mapelDetail.bankData.kelompok.replace("_", " ")}</span> · Slug: <code className="font-mono bg-slate-100 px-1 rounded">{mapelDetail.bankData.slug}</code>
                    </DialogDescription>
                  </div>

                  {canVerify && (
                    <Button
                      variant={mapelDetail.dbMapel?.status_verifikasi === "terverifikasi" ? "outline" : "default"}
                      size="sm"
                      disabled={isPending}
                      onClick={() =>
                        handleToggleVerify(
                          mapelDetail.bankData.slug,
                          mapelDetail.dbMapel?.status_verifikasi === "terverifikasi" ? "terverifikasi" : "belum"
                        )
                      }
                      className={
                        mapelDetail.dbMapel?.status_verifikasi === "terverifikasi"
                          ? "text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
                          : "text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      }
                    >
                      {mapelDetail.dbMapel?.status_verifikasi === "terverifikasi" ? (
                        <>
                          <XCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          Batal Verifikasi
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Tandai Terverifikasi Waka
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </DialogHeader>

              {/* Status Notice jika ada catatan khusus */}
              {mapelDetail.bankData.status === "SEKUNDER_PERLU_CEK" && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Perhatian Riset Bank Data:</span>
                    <span>
                      Mapel ini bersumber dari kurikulum sekunder ({mapelDetail.bankData.sumber_cp.regulasi_kode}). Waka kurikulum disarankan mengecek kesesuaian materi sebelum pengesahan.
                    </span>
                  </div>
                </div>
              )}

              {/* Subtabs Detail */}
              <Tabs value={detailTab} onValueChange={setDetailTab} className="space-y-4">
                <TabsList className="bg-slate-100 p-1 border border-slate-200">
                  <TabsTrigger value="cp" className="text-xs data-[state=active]:bg-white">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Capaian Pembelajaran ({mapelDetail.bankData.elemen.length} Elemen)
                  </TabsTrigger>
                  <TabsTrigger value="materi" className="text-xs data-[state=active]:bg-white">
                    <Layers className="w-3.5 h-3.5 mr-1.5" />
                    Materi Pokok ({mapelDetail.bankData.materi.length} Bab)
                  </TabsTrigger>
                  <TabsTrigger value="sumber" className="text-xs data-[state=active]:bg-white">
                    <Info className="w-3.5 h-3.5 mr-1.5" />
                    Sumber & Rujukan
                  </TabsTrigger>
                </TabsList>

                {/* TAB DETAIL: CP */}
                <TabsContent value="cp" className="space-y-3">
                  <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    <span className="font-medium text-slate-800">Capaian Pembelajaran Fase D: </span>
                    {mapelDetail.bankData.capaian_umum_fase_d}
                  </div>

                  <div className="space-y-3">
                    {mapelDetail.bankData.elemen.map((el) => {
                      const dbCp = mapelDetail.dbCps.find(
                        (c) => c.kode_elemen === el.kode || c.elemen === el.nama
                      );
                      const displayDeskripsi = dbCp?.deskripsi_cp || el.deskripsi_cp;
                      const isManual = dbCp?.asal === "manual";

                      return (
                        <div key={el.kode} className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50">
                                {el.kode}
                              </Badge>
                              <h4 className="font-semibold text-xs text-slate-900">{el.nama}</h4>
                            </div>

                            <div className="flex items-center gap-2">
                              {isManual && (
                                <Badge variant="secondary" className="text-[10px] bg-purple-100 text-purple-800">
                                  Diedit Manual
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingCp({
                                    id: dbCp?.id,
                                    kode: el.kode,
                                    nama: el.nama,
                                    deskripsi: displayDeskripsi,
                                  });
                                  setEditCpModalOpen(true);
                                }}
                                className="h-7 text-xs px-2 text-slate-600 hover:text-emerald-700"
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                Edit CP
                              </Button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed font-sans">
                            {displayDeskripsi}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* TAB DETAIL: MATERI POKOK */}
                <TabsContent value="materi" className="space-y-3">
                  {/* Filter Tingkat & Semester */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">Tingkat Kelas:</span>
                      <div className="flex gap-1">
                        {[7, 8, 9].map((t) => (
                          <Button
                            key={t}
                            type="button"
                            size="sm"
                            variant={materiTingkatFilter === t ? "default" : "outline"}
                            onClick={() => setMateriTingkatFilter(t)}
                            className="h-7 text-xs px-2.5"
                          >
                            Kelas {t === 7 ? "VII" : t === 8 ? "VIII" : "IX"}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-700">Semester:</span>
                      <select
                        value={String(materiSemesterFilter)}
                        onChange={(e) =>
                          setMateriSemesterFilter(e.target.value === "all" ? "all" : (parseInt(e.target.value, 10) as 1 | 2))
                        }
                        aria-label="Filter Semester Materi"
                        className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                      >
                        <option value="all">Semua Semester</option>
                        <option value="1">Semester 1 (Ganjil)</option>
                        <option value="2">Semester 2 (Genap)</option>
                      </select>
                    </div>
                  </div>

                  {/* List Materi */}
                  <div className="space-y-3">
                    {mapelDetail.bankData.materi
                      .filter((m) => {
                        if (m.tingkat !== materiTingkatFilter) return false;
                        if (materiSemesterFilter !== "all" && m.semester !== materiSemesterFilter) return false;
                        return true;
                      })
                      .map((m) => (
                        <div key={`${m.tingkat}-${m.semester}-${m.urutan}`} className="p-3.5 rounded-lg border border-slate-200 bg-white space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-slate-900 text-white text-[10px]">
                                Bab {m.urutan} · Smt {m.semester}
                              </Badge>
                              <h4 className="font-semibold text-xs text-slate-900">{m.bab}</h4>
                            </div>
                            <div className="flex items-center gap-1">
                              {m.elemen_kode.map((ek) => (
                                <Badge key={ek} variant="outline" className="text-[10px] font-mono text-emerald-800 bg-emerald-50">
                                  {ek}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Subbab */}
                          {m.subbab && m.subbab.length > 0 && (
                            <div className="pl-2 border-l-2 border-slate-200 space-y-0.5">
                              <span className="text-[11px] font-medium text-slate-500 block">Subbab / Lingkup Materi:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {m.subbab.map((sb, i) => (
                                  <span key={i} className="text-[11px] bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                    {sb}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Saran Panca Cinta & DPL */}
                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
                            <span className="text-[11px] font-medium text-slate-500">Integrasi Rekomendasi:</span>
                            {m.saran_panca_cinta?.map((spc, i) => (
                              <Badge key={i} className="bg-pink-50 text-pink-700 border-pink-200 text-[10px]" title={spc.alasan}>
                                ❤️ PC{spc.id} ({spc.alasan})
                              </Badge>
                            ))}
                            {m.saran_dpl?.map((dplNum) => (
                              <Badge key={dplNum} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px]">
                                🎓 DPL{dplNum}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </TabsContent>

                {/* TAB DETAIL: SUMBER & RUJUKAN */}
                <TabsContent value="sumber" className="space-y-3">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Dokumen Regulasi CP:</span>
                      <span className="font-semibold text-slate-800 text-sm">{mapelDetail.bankData.sumber_cp.regulasi_kode}</span>
                      <span className="text-slate-600 block mt-0.5">
                        Nomor: {mapelDetail.bankData.sumber_cp.regulasi_kode} · Halaman: {mapelDetail.bankData.sumber_cp.halaman || "-"}
                      </span>
                    </div>

                    {mapelDetail.bankData.sumber_cp.url && (
                      <div>
                        <span className="text-slate-400 font-medium block">Tautan Dokumen Resmi:</span>
                        <a
                          href={mapelDetail.bankData.sumber_cp.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 hover:underline inline-flex items-center gap-1 font-medium break-all"
                        >
                          {mapelDetail.bankData.sumber_cp.url}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    )}

                    {mapelDetail.bankData.catatan && (
                      <div className="p-2.5 rounded bg-white border border-slate-200 text-slate-700">
                        <span className="font-semibold text-slate-800 block mb-0.5">Catatan Riset:</span>
                        {mapelDetail.bankData.catatan}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT CP MODAL */}
      <Dialog open={editCpModalOpen} onOpenChange={setEditCpModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">Edit Deskripsi Capaian Pembelajaran</DialogTitle>
            <DialogDescription className="text-xs">
              Elemen: <span className="font-semibold text-slate-800">{editingCp?.nama}</span> ({editingCp?.kode})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="cp_deskripsi" className="text-xs font-medium">
              Deskripsi Verbatim CP <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="cp_deskripsi"
              rows={6}
              value={editingCp?.deskripsi || ""}
              onChange={(e) =>
                setEditingCp((prev) => (prev ? { ...prev, deskripsi: e.target.value } : null))
              }
              className="text-xs font-sans leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 italic">
              Perubahan pada CP ini akan disimpan ke database madrasah dan ditandai sebagai entri manual tanpa menimpa file bank data kurikulum.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditCpModalOpen(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              size="sm"
              disabled={savingCp}
              onClick={() => void handleSaveCp()}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {savingCp ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
