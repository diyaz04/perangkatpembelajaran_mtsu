"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  FileCheck,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  BookOpen,
  Calendar,
  LayoutList,
  Sparkles,
  Users,
  Download,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckSquare,
  Square,
  FileArchive,
  RefreshCw,
  Wand2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getAvatarInfo } from "@/lib/avatar";
import {
  approveDokumenAction,
  approveBulkDokumenAction,
  approveSemuaAjuanGuruAction,
  type AntrianDokumenItem,
} from "@/lib/validasi/actions";
import { generateDefaultPerangkatGuruAction } from "@/lib/generator/default-perangkat";
import type { DokumenTipe, DocStatus } from "@/types/database";

interface AntrianValidasiClientProps {
  initialItems: AntrianDokumenItem[];
  mapelList: Array<{ id: string; nama: string; kode: string }>;
  guruList: Array<{ id: string; nama_lengkap: string }>;
}

export function AntrianValidasiClient({
  initialItems,
  mapelList,
  guruList,
}: AntrianValidasiClientProps) {
  const router = useRouter();
  const items = initialItems;

  const [viewMode, setViewMode] = useState<"per_guru" | "semua_berkas">("per_guru");
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState<string>("semua");
  const [filterStatus, setFilterStatus] = useState<string>("diajukan");
  const [filterMapel, setFilterMapel] = useState<string>("semua");
  const [filterGuru, setFilterGuru] = useState<string>("semua");
  const [filterTingkat, setFilterTingkat] = useState<string>("semua");

  // State untuk accordion per guru
  const [openGuruIds, setOpenGuruIds] = useState<Record<string, boolean>>({});

  // State dialog validasi semua per guru
  const [dialogGuru, setDialogGuru] = useState<{
    guruId: string;
    guruNama: string;
    items: AntrianDokumenItem[];
  } | null>(null);
  const [dialogCatatan, setDialogCatatan] = useState("");
  const [isSubmittingGuru, setIsSubmittingGuru] = useState(false);

  // State dialog buat perangkat default
  const [defaultModalGuru, setDefaultModalGuru] = useState<{
    guruId: string;
    guruNama: string;
    penugasanCount: number;
  } | null>(null);
  const [isGeneratingDefault, setIsGeneratingDefault] = useState(false);
  const [autoSubmitDefault, setAutoSubmitDefault] = useState(true);
  const [defaultProgress, setDefaultProgress] = useState<{
    isActive: boolean;
    stepText: string;
    percent: number;
    isDone: boolean;
  }>({
    isActive: false,
    stepText: "",
    percent: 0,
    isDone: false,
  });

  // State download ZIP
  const [downloadingGuruId, setDownloadingGuruId] = useState<string | null>(null);

  // State bulk selection di tampilan semua berkas
  const [selectedDocKeys, setSelectedDocKeys] = useState<Set<string>>(new Set());
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  // State single approve
  const [approvingDocId, setApprovingDocId] = useState<string | null>(null);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (filterStatus !== "semua" && item.status !== filterStatus) {
        return false;
      }
      if (filterJenis !== "semua" && item.dokumen_tipe !== filterJenis) {
        return false;
      }
      if (filterTingkat !== "semua" && item.tingkat_kelas !== Number(filterTingkat)) {
        return false;
      }
      if (filterGuru !== "semua" && item.guru_nama !== filterGuru) {
        return false;
      }
      if (filterMapel !== "semua" && item.mapel_nama !== filterMapel) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchJudul = item.judul.toLowerCase().includes(q);
        const matchGuru = item.guru_nama.toLowerCase().includes(q);
        const matchMapel = item.mapel_nama.toLowerCase().includes(q);
        const matchRombel = item.rombel.toLowerCase().includes(q);
        return matchJudul || matchGuru || matchMapel || matchRombel;
      }
      return true;
    });
  }, [items, filterStatus, filterJenis, filterTingkat, filterGuru, filterMapel, search]);

  // Kelompokkan per guru (dari seluruh items untuk akurasi statistik dan aksi)
  const groupedGuru = useMemo(() => {
    const map = new Map<
      string,
      {
        guruId: string;
        guruNama: string;
        guruNip: string | null;
        items: AntrianDokumenItem[];
        diajukanItems: AntrianDokumenItem[];
        disetujuiCount: number;
        revisiCount: number;
      }
    >();

    items.forEach((item) => {
      const gId = item.guru_id || item.guru_nama;
      if (!map.has(gId)) {
        map.set(gId, {
          guruId: gId,
          guruNama: item.guru_nama,
          guruNip: item.guru_nip,
          items: [],
          diajukanItems: [],
          disetujuiCount: 0,
          revisiCount: 0,
        });
      }
      const entry = map.get(gId)!;
      entry.items.push(item);
      if (item.status === "diajukan") {
        entry.diajukanItems.push(item);
      } else if (item.status === "disetujui") {
        entry.disetujuiCount++;
      } else if (item.status === "revisi") {
        entry.revisiCount++;
      }
    });

    let list = Array.from(map.values());

    // Filter berdasarkan pencarian atau filter dropdown guru/mapel
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) =>
          g.guruNama.toLowerCase().includes(q) ||
          (g.guruNip && g.guruNip.includes(q)) ||
          g.items.some(
            (it) =>
              it.mapel_nama.toLowerCase().includes(q) ||
              it.judul.toLowerCase().includes(q)
          )
      );
    }

    if (filterGuru !== "semua") {
      list = list.filter((g) => g.guruNama === filterGuru);
    }

    if (filterMapel !== "semua") {
      list = list.filter((g) => g.items.some((it) => it.mapel_nama === filterMapel));
    }

    // Urutkan guru yang punya berkas diajukan paling banyak di atas
    list.sort((a, b) => b.diajukanItems.length - a.diajukanItems.length);

    return list;
  }, [items, search, filterGuru, filterMapel]);

  const toggleGuru = (guruId: string) => {
    setOpenGuruIds((prev) => ({
      ...prev,
      [guruId]: !prev[guruId],
    }));
  };

  const getDocTypeIcon = (tipe: DokumenTipe) => {
    switch (tipe) {
      case "atp":
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case "prota":
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case "prosem":
        return <LayoutList className="w-4 h-4 text-purple-600" />;
      case "rpp":
      default:
        return <FileText className="w-4 h-4 text-amber-600" />;
    }
  };

  const getDocTypeBadge = (tipe: DokumenTipe) => {
    switch (tipe) {
      case "atp":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            ATP
          </Badge>
        );
      case "prota":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
            Prota
          </Badge>
        );
      case "prosem":
        return (
          <Badge className="bg-purple-50 text-purple-700 border-purple-200">
            Prosem
          </Badge>
        );
      case "rpp":
      default:
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200">
            RPP / Modul Ajar
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: DocStatus) => {
    switch (status) {
      case "disetujui":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Disetujui
          </Badge>
        );
      case "diajukan":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <Clock className="w-3 h-3 mr-1" /> Diajukan
          </Badge>
        );
      case "revisi":
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300">
            <AlertCircle className="w-3 h-3 mr-1" /> Revisi
          </Badge>
        );
      case "draf":
      default:
        return (
          <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200">
            Draf
          </Badge>
        );
    }
  };

  // AKSI 1: Validasi Semua Ajuan Milik Guru
  const handleOpenValidasiSemuaDialog = (
    guruId: string,
    guruNama: string,
    itemsToApprove: AntrianDokumenItem[]
  ) => {
    setDialogGuru({ guruId, guruNama, items: itemsToApprove });
    setDialogCatatan("Dokumen telah ditelaah dan disetujui kolektif sesuai regulasi Kemenag & standar KBC.");
  };

  const handleConfirmValidasiSemua = async () => {
    if (!dialogGuru) return;
    setIsSubmittingGuru(true);
    try {
      const res = await approveSemuaAjuanGuruAction(dialogGuru.guruId, dialogCatatan);
      if (!res.success) {
        toast.error(res.error || "Gagal memvalidasi ajuan guru.");
      } else {
        toast.success(
          `Berhasil memvalidasi ${res.count || dialogGuru.items.length} berkas ajuan milik ${dialogGuru.guruNama}`
        );
        setDialogGuru(null);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setIsSubmittingGuru(false);
    }
  };

  // AKSI 1.5: Buatkan Otomatis Perangkat Default untuk Guru
  const handleConfirmGenerateDefault = async () => {
    if (!defaultModalGuru) return;
    setIsGeneratingDefault(true);
    setDefaultProgress({
      isActive: true,
      stepText: `Sedang menyiapkan data perangkat untuk ${defaultModalGuru.guruNama}...`,
      percent: 25,
      isDone: false,
    });
    try {
      setDefaultProgress({
        isActive: true,
        stepText: "Membagi JP tahunan ke elemen CP & menyusun ATP, Prota, Prosem, Modul Ajar...",
        percent: 55,
        isDone: false,
      });

      let res: any;
      try {
        const fetchRes = await fetch("/api/generator/default", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "guru",
            guruId: defaultModalGuru.guruId,
            autoSubmit: autoSubmitDefault,
          }),
        });
        res = await fetchRes.json();
      } catch {
        res = await generateDefaultPerangkatGuruAction(defaultModalGuru.guruId, {
          autoSubmit: autoSubmitDefault,
        });
      }

      if (!res.success) {
        toast.error(res.error || "Gagal membuat perangkat pembelajaran default.");
        setDefaultProgress({ isActive: false, stepText: "", percent: 0, isDone: false });
      } else {
        setDefaultProgress({
          isActive: true,
          stepText: "Selesai menyusun seluruh berkas perangkat pembelajaran!",
          percent: 100,
          isDone: true,
        });
        toast.success(
          `Berhasil menyusun perangkat default untuk ${defaultModalGuru.guruNama} (${res.totalTp} TP, ${res.totalRpp} Modul Ajar)`
        );
        setTimeout(() => {
          setDefaultModalGuru(null);
          setDefaultProgress({ isActive: false, stepText: "", percent: 0, isDone: false });
          router.refresh();
        }, 1200);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
      setDefaultProgress({ isActive: false, stepText: "", percent: 0, isDone: false });
    } finally {
      setIsGeneratingDefault(false);
    }
  };

  // AKSI 2: Unduh ZIP Dokumen Tervalidasi Per Guru
  const handleDownloadZipGuru = async (guruId: string, guruNama: string) => {
    setDownloadingGuruId(guruId);
    try {
      const res = await fetch("/api/export/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guruId }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Gagal mengunduh berkas ZIP.");
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = `DOKUMEN_TERVALIDASI_${guruNama.replace(/\s+/g, "_")}.zip`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Berhasil mengunduh dokumen tervalidasi ${guruNama}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh ZIP.");
    } finally {
      setDownloadingGuruId(null);
    }
  };

  // AKSI 3: Validasi Cepat Satuan Dokumen
  const handleApproveSingle = async (
    dokumenTipe: DokumenTipe,
    dokumenId: string,
    judul: string
  ) => {
    setApprovingDocId(`${dokumenTipe}-${dokumenId}`);
    try {
      const res = await approveDokumenAction(dokumenTipe, dokumenId);
      if (!res.success) {
        toast.error(res.error || "Gagal menyetujui dokumen.");
      } else {
        toast.success(`Dokumen "${judul}" disetujui`);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setApprovingDocId(null);
    }
  };

  // AKSI 4: Bulk Approve Dokumen Terpilih (Mode Semua Berkas)
  const toggleSelectDoc = (key: string) => {
    setSelectedDocKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    if (selectedDocKeys.size === filteredItems.length) {
      setSelectedDocKeys(new Set());
    } else {
      const allKeys = new Set(
        filteredItems
          .filter((i) => i.status === "diajukan")
          .map((i) => `${i.dokumen_tipe}::${i.id}`)
      );
      setSelectedDocKeys(allKeys);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedDocKeys.size === 0) return;
    setIsBulkApproving(true);
    try {
      const payload = Array.from(selectedDocKeys).map((key) => {
        const [dokumenTipe, dokumenId] = key.split("::");
        return { dokumenTipe: dokumenTipe as DokumenTipe, dokumenId };
      });

      const res = await approveBulkDokumenAction(payload);
      if (!res.success) {
        toast.error(res.error || "Gagal menyetujui dokumen.");
      } else {
        toast.success(`Berhasil menyetujui ${res.count || payload.length} berkas`);
        setSelectedDocKeys(new Set());
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
    } finally {
      setIsBulkApproving(false);
    }
  };

  const totalDiajukan = items.filter((i) => i.status === "diajukan").length;
  const totalDisetujui = items.filter((i) => i.status === "disetujui").length;
  const totalRevisi = items.filter((i) => i.status === "revisi").length;

  return (
    <div className="space-y-6">
      {/* Statistik Banner Mini */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Antrian Menunggu Telaah</p>
            <h4 className="text-2xl font-bold text-blue-700 mt-1">{totalDiajukan} Dokumen</h4>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Dokumen Disetujui</p>
            <h4 className="text-2xl font-bold text-emerald-700 mt-1">{totalDisetujui} Dokumen</h4>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Dalam Tahap Revisi</p>
            <h4 className="text-2xl font-bold text-rose-700 mt-1">{totalRevisi} Dokumen</h4>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Mode Switcher & Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tampilan:
            </span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode("per_guru")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === "per_guru"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Per Guru ({groupedGuru.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("semua_berkas")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === "semua_berkas"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Semua Berkas ({filteredItems.length})</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>
              💡 <em>Tips:</em> Anda dapat langsung <strong>memvalidasi semua ajuan</strong> atau{" "}
              <strong>mengunduh ZIP tervalidasi</strong> langsung per guru.
            </span>
          </div>
        </div>

        {/* Filter Bar Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              placeholder="Cari materi, nama guru, mapel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Status (Hanya relevan di mode semua_berkas) */}
          {viewMode === "semua_berkas" && (
            <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val || "semua")}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Status</SelectItem>
                <SelectItem value="diajukan">Diajukan (Antrian)</SelectItem>
                <SelectItem value="revisi">Perlu Revisi</SelectItem>
                <SelectItem value="disetujui">Disetujui</SelectItem>
                <SelectItem value="draf">Draf</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Jenis Dokumen */}
          <Select value={filterJenis} onValueChange={(val) => setFilterJenis(val || "semua")}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Jenis Dokumen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Jenis</SelectItem>
              <SelectItem value="rpp">RPP / Modul Ajar</SelectItem>
              <SelectItem value="atp">ATP</SelectItem>
              <SelectItem value="prota">Prota</SelectItem>
              <SelectItem value="prosem">Prosem</SelectItem>
            </SelectContent>
          </Select>

          {/* Tingkat Kelas */}
          <Select value={filterTingkat} onValueChange={(val) => setFilterTingkat(val || "semua")}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Kelas</SelectItem>
              <SelectItem value="7">Kelas VII</SelectItem>
              <SelectItem value="8">Kelas VIII</SelectItem>
              <SelectItem value="9">Kelas IX</SelectItem>
            </SelectContent>
          </Select>

          {/* Mapel */}
          <Select value={filterMapel} onValueChange={(val) => setFilterMapel(val || "semua")}>
            <SelectTrigger className="text-xs truncate">
              <SelectValue placeholder="Mata Pelajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Mapel</SelectItem>
              {mapelList.map((m) => (
                <SelectItem key={m.id} value={m.nama}>
                  {m.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Guru */}
          <Select value={filterGuru} onValueChange={(val) => setFilterGuru(val || "semua")}>
            <SelectTrigger className="text-xs truncate">
              <SelectValue placeholder="Guru Pengampu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Guru</SelectItem>
              {guruList.map((g) => (
                <SelectItem key={g.id} value={g.nama_lengkap}>
                  {g.nama_lengkap}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAMPILAN 1: PER GURU (BERTINGKAT DENGAN VALIDASI & UNDUH ZIP LANGSUNG) */}
      {/* ========================================================================= */}
      {viewMode === "per_guru" && (
        <div className="space-y-4">
          {groupedGuru.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Tidak ada data guru yang cocok</p>
              <p className="text-xs text-slate-400">
                Silakan sesuaikan kata kunci pencarian atau filter di atas.
              </p>
            </div>
          ) : (
            groupedGuru.map((guru) => {
              const isOpen = !!openGuruIds[guru.guruId];
              const avatar = getAvatarInfo(guru.guruNama);
              const diajukanCount = guru.diajukanItems.length;
              const isDownloading = downloadingGuruId === guru.guruId;

              return (
                <div
                  key={guru.guruId}
                  className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all duration-200 hover:border-slate-300"
                >
                  {/* Header Bar Guru */}
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white">
                    {/* Info Guru */}
                    <div
                      className="flex items-center gap-3.5 cursor-pointer flex-1 select-none"
                      onClick={() => toggleGuru(guru.guruId)}
                    >
                      <button
                        type="button"
                        aria-label="Toggle berkas guru"
                        className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        {isOpen ? (
                          <ChevronDown className="w-5 h-5 text-slate-600" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatar.bg} ${avatar.text}`}
                      >
                        {avatar.initials}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 hover:text-emerald-700 transition-colors">
                            {guru.guruNama}
                          </h4>
                          {guru.guruNip && (
                            <span className="text-xs text-slate-400 font-mono">
                              NIP. {guru.guruNip}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {diajukanCount > 0 ? (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-medium text-[11px]">
                              <Clock className="w-3 h-3 mr-1" />
                              {diajukanCount} Menunggu Validasi
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500 bg-slate-50 text-[11px]">
                              0 Menunggu
                            </Badge>
                          )}

                          {guru.disetujuiCount > 0 && (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-medium text-[11px]">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {guru.disetujuiCount} Disetujui
                            </Badge>
                          )}

                          {guru.revisiCount > 0 && (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-medium text-[11px]">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {guru.revisiCount} Revisi
                            </Badge>
                          )}

                          <span className="text-xs text-slate-400">
                            Total {guru.items.length} Berkas Ditugaskan
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Tombol Aksi Cepat Per Guru */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      {/* Tombol Validasi Langsung Semua Berkas Guru */}
                      <Button
                        size="sm"
                        disabled={diajukanCount === 0}
                        onClick={() =>
                          handleOpenValidasiSemuaDialog(
                            guru.guruId,
                            guru.guruNama,
                            guru.diajukanItems
                          )
                        }
                        className={`text-xs h-9 gap-1.5 font-medium transition-all ${
                          diajukanCount > 0
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                        }`}
                        title={
                          diajukanCount > 0
                            ? `Validasi langsung ${diajukanCount} berkas ajuan guru ini`
                            : "Tidak ada berkas berstatus 'diajukan' yang menunggu validasi"
                        }
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>Validasi Semua Ajuan ({diajukanCount})</span>
                      </Button>

                      {/* Tombol Unduh ZIP Dokumen Tervalidasi Guru */}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={guru.disetujuiCount === 0 || isDownloading}
                        onClick={() => handleDownloadZipGuru(guru.guruId, guru.guruNama)}
                        className={`text-xs h-9 gap-1.5 font-medium transition-all ${
                          guru.disetujuiCount > 0
                            ? "border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                            : "text-slate-300 border-slate-200 cursor-not-allowed"
                        }`}
                        title={
                          guru.disetujuiCount > 0
                            ? `Unduh paket ZIP seluruh dokumen yang telah divalidasi (${guru.disetujuiCount} berkas)`
                            : "Guru belum memiliki dokumen dengan status 'disetujui'"
                        }
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                            <span>Membuat ZIP...</span>
                          </>
                        ) : (
                          <>
                            <FileArchive className="w-4 h-4 text-blue-600" />
                            <span>Unduh ZIP ({guru.disetujuiCount})</span>
                          </>
                        )}
                      </Button>

                      {/* Tombol Buat Default Perangkat Guru */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setDefaultModalGuru({
                            guruId: guru.guruId,
                            guruNama: guru.guruNama,
                            penugasanCount: guru.items.length,
                          })
                        }
                        className="text-xs h-9 gap-1.5 border-amber-300 bg-amber-50/70 text-amber-800 hover:bg-amber-100 font-medium"
                        title="Buatkan otomatis seluruh dokumen default (ATP, Prota, Prosem, Modul Ajar) untuk guru ini"
                      >
                        <Wand2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Buat Default</span>
                      </Button>
                    </div>
                  </div>

                  {/* Sub-List Dokumen Pekerjaan Guru (Accordion Content) */}
                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50/60 divide-y divide-slate-100">
                      {guru.items.map((doc) => {
                        let updatedDate = doc.updated_at;
                        try {
                          updatedDate = format(
                            new Date(doc.updated_at),
                            "d MMM yyyy, HH:mm",
                            { locale: localeId }
                          );
                        } catch {
                          // fallback
                        }

                        const telaahHref = `/validasi/telaah/${doc.dokumen_tipe}/${doc.id}`;
                        const isApproving =
                          approvingDocId === `${doc.dokumen_tipe}-${doc.id}`;

                        return (
                          <div
                            key={`${doc.dokumen_tipe}-${doc.id}`}
                            className="p-3.5 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-2xs">
                                {getDocTypeIcon(doc.dokumen_tipe)}
                              </div>

                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {getDocTypeBadge(doc.dokumen_tipe)}
                                  {getStatusBadge(doc.status)}
                                  <span className="text-[11px] text-slate-400">· {updatedDate}</span>
                                </div>

                                <p className="text-xs sm:text-sm font-semibold text-slate-900">
                                  {doc.judul}
                                </p>

                                <div className="text-xs text-slate-500">
                                  <span>
                                    {doc.mapel_nama} (Kelas {doc.tingkat_kelas} - {doc.rombel})
                                  </span>
                                </div>

                                {doc.catatan_validator && (
                                  <div className="mt-1 text-xs bg-amber-50/70 border border-amber-200/70 rounded p-2 text-amber-900">
                                    <span className="font-semibold">Catatan Validator: </span>
                                    {doc.catatan_validator}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Tombol Aksi Dokumen */}
                            <div className="flex items-center gap-2 sm:self-center shrink-0">
                              {doc.status === "diajukan" && (
                                <Button
                                  size="sm"
                                  disabled={isApproving}
                                  onClick={() =>
                                    handleApproveSingle(
                                      doc.dokumen_tipe,
                                      doc.id,
                                      doc.judul
                                    )
                                  }
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1"
                                >
                                  {isApproving ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  )}
                                  <span>Setujui</span>
                                </Button>
                              )}

                              <Link href={telaahHref}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-8 gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-100"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Telaah</span>
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAMPILAN 2: SEMUA BERKAS (DAFTAR SATUAN DENGAN BULK ACTION) */}
      {/* ========================================================================= */}
      {viewMode === "semua_berkas" && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs space-y-0">
          {/* Bar Seleksi Massal */}
          {filteredItems.some((i) => i.status === "diajukan") && (
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllVisible}
                  className="h-8 text-xs gap-1.5 bg-white"
                >
                  {selectedDocKeys.size > 0 &&
                  selectedDocKeys.size ===
                    filteredItems.filter((i) => i.status === "diajukan").length ? (
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Pilih Semua yang Diajukan</span>
                </Button>
                {selectedDocKeys.size > 0 && (
                  <span className="font-medium text-emerald-700">
                    {selectedDocKeys.size} dokumen dipilih
                  </span>
                )}
              </div>

              {selectedDocKeys.size > 0 && (
                <Button
                  size="sm"
                  disabled={isBulkApproving}
                  onClick={handleBulkApprove}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1.5"
                >
                  {isBulkApproving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Validasi {selectedDocKeys.size} Dokumen Terpilih</span>
                </Button>
              )}
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileCheck className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-medium text-slate-600">Tidak ada dokumen dalam antrian</p>
              <p className="text-xs text-slate-400">
                Coba sesuaikan filter status atau kata kunci pencarian di atas.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                let updatedDate = item.updated_at;
                try {
                  updatedDate = format(new Date(item.updated_at), "d MMM yyyy, HH:mm", {
                    locale: localeId,
                  });
                } catch {
                  // fallback
                }

                const docKey = `${item.dokumen_tipe}::${item.id}`;
                const isSelected = selectedDocKeys.has(docKey);
                const telaahHref = `/validasi/telaah/${item.dokumen_tipe}/${item.id}`;
                const isApproving = approvingDocId === `${item.dokumen_tipe}-${item.id}`;

                return (
                  <div
                    key={`${item.dokumen_tipe}-${item.id}`}
                    className={`p-4 sm:p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isSelected ? "bg-emerald-50/50" : "hover:bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {item.status === "diajukan" && (
                        <button
                          type="button"
                          onClick={() => toggleSelectDoc(docKey)}
                          className="mt-2 text-slate-400 hover:text-emerald-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300" />
                          )}
                        </button>
                      )}

                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-200">
                        {getDocTypeIcon(item.dokumen_tipe)}
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {getDocTypeBadge(item.dokumen_tipe)}
                          {getStatusBadge(item.status)}
                          <span className="text-xs text-slate-400">· {updatedDate}</span>
                        </div>

                        <h4 className="text-sm font-semibold text-slate-900">{item.judul}</h4>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>
                            Guru: <strong>{item.guru_nama}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            {item.mapel_nama} (Kelas {item.tingkat_kelas} - {item.rombel})
                          </span>
                        </div>

                        {item.catatan_validator && (
                          <div className="mt-2 text-xs bg-slate-50 border border-slate-200 rounded p-2 text-slate-600">
                            <span className="font-semibold text-slate-700">Catatan Sebelumnya: </span>
                            {item.catatan_validator}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 sm:self-center w-full sm:w-auto">
                      {item.status === "diajukan" && (
                        <Button
                          size="sm"
                          disabled={isApproving}
                          onClick={() =>
                            handleApproveSingle(
                              item.dokumen_tipe,
                              item.id,
                              item.judul
                            )
                          }
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                        >
                          {isApproving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          )}
                          <span>Setujui</span>
                        </Button>
                      )}

                      <Link href={telaahHref} className="w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs w-full sm:w-auto border-slate-200 text-slate-700"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                          Telaah Dokumen
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG KONFIRMASI VALIDASI SEMUA AJUAN GURU */}
      {/* ========================================================================= */}
      <Dialog open={!!dialogGuru} onOpenChange={(open) => !open && setDialogGuru(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <CheckCheck className="w-5 h-5 text-emerald-600" />
              <span>Validasi Langsung Semua Berkas Ajuan</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Menyetujui sekaligus seluruh dokumen yang sedang diajukan oleh guru berikut ini.
            </DialogDescription>
          </DialogHeader>

          {dialogGuru && (
            <div className="space-y-4 py-2">
              {/* Profil Guru */}
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-900">
                    Guru: {dialogGuru.guruNama}
                  </p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    {dialogGuru.items.length} berkas ajuan siap divalidasi kolektif
                  </p>
                </div>
                <Badge className="bg-emerald-600 text-white text-xs">
                  {dialogGuru.items.length} Berkas
                </Badge>
              </div>

              {/* Rincian Berkas yang akan Divalidasi */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Daftar Dokumen yang akan Disetujui:
                </p>
                {dialogGuru.items.map((doc, idx) => (
                  <div
                    key={`${doc.dokumen_tipe}-${doc.id}`}
                    className="flex items-center gap-2 p-1.5 rounded bg-white border border-slate-100 text-xs"
                  >
                    <span className="w-5 text-slate-400 font-mono text-[10px] text-center">
                      {idx + 1}.
                    </span>
                    {getDocTypeBadge(doc.dokumen_tipe)}
                    <span className="font-medium text-slate-800 truncate flex-1">
                      {doc.judul}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Kelas {doc.tingkat_kelas}
                    </span>
                  </div>
                ))}
              </div>

              {/* Input Catatan Validator Kolektif */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Catatan Penelaahan / Pengesahan (Opsional):
                </label>
                <Textarea
                  value={dialogCatatan}
                  onChange={(e) => setDialogCatatan(e.target.value)}
                  placeholder="Tuliskan catatan telaah atau konfirmasi pengesahan..."
                  rows={3}
                  className="text-xs"
                />
                <p className="text-[11px] text-slate-400">
                  Catatan ini akan tersimpan pada riwayat validasi untuk seluruh dokumen di atas.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDialogGuru(null)}
              disabled={isSubmittingGuru}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmValidasiSemua}
              disabled={isSubmittingGuru}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
            >
              {isSubmittingGuru ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Setujui Semua ({dialogGuru?.items.length || 0} Berkas)</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG AUTO-GENERATE PERANGKAT DEFAULT GURU */}
      <Dialog
        open={!!defaultModalGuru}
        onOpenChange={(open) => {
          if (!open && !isGeneratingDefault) {
            setDefaultModalGuru(null);
            setDefaultProgress({ isActive: false, stepText: "", percent: 0, isDone: false });
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Wand2 className="w-5 h-5 text-amber-600" />
              <span>Buat Default Seluruh Perangkat Guru</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Sistem akan secara otomatis menyusun seluruh dokumen perangkat pembelajaran lengkap (ATP, Prota, Prosem, dan Modul Ajar/RPP) sesuai regulasi Kemenag & standar Kurikulum Berbasis Cinta (KBC).
            </DialogDescription>
          </DialogHeader>

          {defaultModalGuru && (
            <div className="space-y-4 py-2 text-xs">
              {defaultProgress.isActive ? (
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 border-2 border-amber-300 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold shrink-0">
                        {defaultProgress.isDone ? (
                          <CheckCheck className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                          {defaultProgress.isDone ? "Selesai" : "Sedang Menyusun"}
                        </span>
                        <span className="font-bold text-amber-950 text-sm block truncate">
                          {defaultModalGuru.guruNama}
                        </span>
                      </div>
                    </div>
                    <Badge
                      className={`${
                        defaultProgress.isDone ? "bg-emerald-600" : "bg-amber-600"
                      } text-white font-mono text-xs px-2.5 py-0.5 shrink-0`}
                    >
                      {defaultProgress.percent}%
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-amber-800 font-medium">
                      <span>{defaultProgress.stepText}</span>
                      <span className="font-bold">{defaultProgress.percent}%</span>
                    </div>
                    <Progress
                      value={defaultProgress.percent}
                      className={`h-2.5 ${
                        defaultProgress.isDone ? "bg-emerald-200" : "bg-amber-200/60"
                      }`}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
                    <span className="font-bold text-amber-950 text-sm block">{defaultModalGuru.guruNama}</span>
                    <p className="text-amber-800">
                      Meliputi <strong>{defaultModalGuru.penugasanCount} penugasan kelas</strong> yang diampu oleh guru ini.
                    </p>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                    <span className="font-semibold block">💡 Aturan Pembagian JP per Elemen (ATP):</span>
                    <p className="text-blue-800">
                      Perhitungan alokasi JP per elemen dibagi rata otomatis dari porsi JP tahunan kalender pendidikan dibagi jumlah elemen CP, serta dibagi merata ke Semester 1 dan 2.
                    </p>
                  </div>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoSubmitDefault}
                      onChange={(e) => setAutoSubmitDefault(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-xs text-slate-700 font-medium">
                      Langsung ajukan dokumen ke antrian validasi (Status: <strong>Diajukan</strong>).
                    </span>
                  </label>
                </>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {defaultProgress.isDone ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setDefaultModalGuru(null);
                  setDefaultProgress({ isActive: false, stepText: "", percent: 0, isDone: false });
                  router.refresh();
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-9 font-semibold"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Selesai & Tutup</span>
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isGeneratingDefault}
                  onClick={() => {
                    setDefaultModalGuru(null);
                    setDefaultProgress({ isActive: false, stepText: "", percent: 0, isDone: false });
                  }}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isGeneratingDefault}
                  onClick={handleConfirmGenerateDefault}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
                >
                  {isGeneratingDefault ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sedang Menyusun...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Buatkan Perangkat Sekarang</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
