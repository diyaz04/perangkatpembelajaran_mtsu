"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
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
  FileArchive,
  Loader2,
  Wand2,
  Sparkles,
  CheckCheck,
  PartyPopper,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { DashboardHeroBanner } from "@/components/dashboard-hero-banner";
import { getAvatarInfo } from "@/lib/avatar";
import {
  generateDefaultPerangkatGuruAction,
  generateDefaultPerangkatMassalAction,
  generateDefaultPerangkatForPenugasan,
} from "@/lib/generator/default-perangkat";
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
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"bertingkat" | "tabel">("bertingkat");
  const [openGuruIds, setOpenGuruIds] = useState<Record<string, boolean>>({});
  const [downloadingGuruId, setDownloadingGuruId] = useState<string | null>(null);

  // State Modal Auto-Generate Perangkat Default
  const [modalGuru, setModalGuru] = useState<{
    guruId: string;
    guruNama: string;
    avgProgress: number;
    penugasanCount: number;
    items?: RekapKelengkapanGuru[];
  } | null>(null);
  const [singleProgress, setSingleProgress] = useState<{
    isActive: boolean;
    stepText: string;
    currentMapel?: string;
    percent: number;
    isDone: boolean;
  }>({
    isActive: false,
    stepText: "",
    percent: 0,
    isDone: false,
  });

  const [modalMassalOpen, setModalMassalOpen] = useState(false);
  const [autoSubmitOption, setAutoSubmitOption] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // State Progres Realtime Massal
  const [massalProgress, setMassalProgress] = useState<{
    isActive: boolean;
    currentIndex: number;
    total: number;
    currentGuruId: string | null;
    currentGuruNama: string;
    currentMapelInfo: string;
    percent: number;
    isDone: boolean;
    successCount: number;
    failCount: number;
  }>({
    isActive: false,
    currentIndex: 0,
    total: 0,
    currentGuruId: null,
    currentGuruNama: "",
    currentMapelInfo: "",
    percent: 0,
    isDone: false,
    successCount: 0,
    failCount: 0,
  });

  const [teacherStatusMap, setTeacherStatusMap] = useState<
    Record<string, "pending" | "processing" | "success" | "error">
  >({});
  const [batchLimit, setBatchLimit] = useState<number>(0); // 0 = Semua, 5 = 5 Guru, 10 = 10 Guru
  const isPausedRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);

  const callGenerateGuru = async (guruId: string, autoSubmit: boolean) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000);
      const res = await fetch("/api/generator/default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "guru", guruId, autoSubmit }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn("API route fallback ke server action:", err);
      return await generateDefaultPerangkatGuruAction(guruId, { autoSubmit });
    }
  };

  const callGeneratePenugasan = async (penugasanId: string, autoSubmit: boolean) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 55000);
      const res = await fetch("/api/generator/default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "penugasan", penugasanId, autoSubmit }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      return await generateDefaultPerangkatForPenugasan(penugasanId, { autoSubmit });
    }
  };

  const handleDownloadTeacherZip = async (guruId: string, guruNama: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingGuruId(guruId);
    try {
      const res = await fetch("/api/export/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guruId }),
      });
      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Gagal mengunduh ZIP tervalidasi.");
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
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh berkas ZIP");
    } finally {
      setDownloadingGuruId(null);
    }
  };

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

  // Guru yang progresnya masih belum lengkap (< 100%)
  const guruBelumLengkap = useMemo(() => {
    return groupedByGuru.filter((g) => g.avgProgress < 100);
  }, [groupedByGuru]);

  const handleConfirmGenerateGuru = async () => {
    if (!modalGuru) return;
    setIsGenerating(true);
    setSingleProgress({
      isActive: true,
      stepText: "Mempersiapkan data penugasan...",
      percent: 10,
      isDone: false,
    });

    try {
      if (modalGuru.items && modalGuru.items.length > 0) {
        const totalItems = modalGuru.items.length;
        let totalTpAcc = 0;
        let totalRppAcc = 0;

        for (let i = 0; i < totalItems; i++) {
          const item = modalGuru.items[i];
          const mapelTitle = `${item.mapelNama} (Kelas ${item.tingkatKelas} - ${item.rombel})`;

          setSingleProgress({
            isActive: true,
            stepText: `Menyusun perangkat penugasan ${i + 1} dari ${totalItems}...`,
            currentMapel: mapelTitle,
            percent: Math.round(15 + (i / totalItems) * 75),
            isDone: false,
          });

          const res = await callGeneratePenugasan(item.penugasanId, autoSubmitOption);

          if (res.success) {
            totalTpAcc += res.jumlahTp || 0;
            totalRppAcc += res.rppCount || 0;
          }
        }

        setSingleProgress({
          isActive: true,
          stepText: `Selesai! Berhasil membuat seluruh perangkat untuk ${modalGuru.guruNama}.`,
          percent: 100,
          isDone: true,
        });

        toast.success(
          `Berhasil membuatkan seluruh perangkat default untuk ${modalGuru.guruNama} (${totalTpAcc} TP, ${totalRppAcc} Modul Ajar)`
        );

        setTimeout(() => {
          setModalGuru(null);
          setSingleProgress({ isActive: false, stepText: "", percent: 0, isDone: false });
          router.refresh();
        }, 1200);
      } else {
        setSingleProgress({
          isActive: true,
          stepText: `Sedang membuat perangkat untuk ${modalGuru.guruNama}...`,
          percent: 40,
          isDone: false,
        });

        const res = await callGenerateGuru(modalGuru.guruId, autoSubmitOption);

        if (!res.success) {
          toast.error(res.error || "Gagal membuat perangkat pembelajaran default.");
          setSingleProgress({ isActive: false, stepText: "", percent: 0, isDone: false });
        } else {
          setSingleProgress({
            isActive: true,
            stepText: "Selesai membuat seluruh dokumen!",
            percent: 100,
            isDone: true,
          });
          toast.success(
            `Berhasil membuatkan seluruh perangkat default untuk ${modalGuru.guruNama} (${res.totalTp} TP, ${res.totalRpp} Modul Ajar)`
          );
          setTimeout(() => {
            setModalGuru(null);
            setSingleProgress({ isActive: false, stepText: "", percent: 0, isDone: false });
            router.refresh();
          }, 1200);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan sistem.");
      setSingleProgress({ isActive: false, stepText: "", percent: 0, isDone: false });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmGenerateMassal = async (resumeOnly = false) => {
    if (guruBelumLengkap.length === 0) return;
    setIsGenerating(true);
    isPausedRef.current = false;
    setIsPaused(false);

    // Tentukan daftar target guru yang akan diproses
    let targets = [...guruBelumLengkap];
    if (resumeOnly) {
      targets = targets.filter((g) => teacherStatusMap[g.guruId] !== "success");
    } else {
      const initialStatus: Record<string, "pending" | "processing" | "success" | "error"> = {};
      guruBelumLengkap.forEach((g) => {
        initialStatus[g.guruId] = "pending";
      });
      setTeacherStatusMap(initialStatus);
    }

    if (batchLimit > 0) {
      targets = targets.slice(0, batchLimit);
    }

    if (targets.length === 0) {
      setIsGenerating(false);
      toast.info("Seluruh guru yang dipilih telah selesai dibuatkan.");
      return;
    }

    let successCount = resumeOnly ? massalProgress.successCount : 0;
    let failCount = 0;

    setMassalProgress((prev) => ({
      isActive: true,
      currentIndex: 0,
      total: targets.length,
      currentGuruId: null,
      currentGuruNama: "",
      currentMapelInfo: "",
      percent: 0,
      isDone: false,
      successCount,
      failCount: 0,
    }));

    for (let i = 0; i < targets.length; i++) {
      if (isPausedRef.current) {
        toast.info("Pembuatan dijeda. Anda dapat melanjutkannya kapan saja.");
        break;
      }

      const g = targets[i];
      const mapelInfo = g.items
        .map((it) => `${it.mapelNama} (Kls ${it.tingkatKelas})`)
        .join(", ");

      setTeacherStatusMap((prev) => ({
        ...prev,
        [g.guruId]: "processing",
      }));

      setMassalProgress((prev) => ({
        ...prev,
        currentIndex: i + 1,
        total: targets.length,
        currentGuruId: g.guruId,
        currentGuruNama: g.guruNama,
        currentMapelInfo: mapelInfo,
        percent: Math.round((i / targets.length) * 100),
      }));

      setTimeout(() => {
        const el = document.getElementById(`massal-guru-item-${g.guruId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 50);

      try {
        const res = await callGenerateGuru(g.guruId, autoSubmitOption);

        if (res.success) {
          successCount++;
          setTeacherStatusMap((prev) => ({
            ...prev,
            [g.guruId]: "success",
          }));
        } else {
          failCount++;
          setTeacherStatusMap((prev) => ({
            ...prev,
            [g.guruId]: "error",
          }));
          console.warn(`Galat pada guru ${g.guruNama}:`, res.error);
        }
      } catch (err) {
        failCount++;
        setTeacherStatusMap((prev) => ({
          ...prev,
          [g.guruId]: "error",
        }));
        console.warn(`Exception guru ${g.guruNama}:`, err);
      }

      setMassalProgress((prev) => ({
        ...prev,
        percent: Math.round(((i + 1) / targets.length) * 100),
        successCount,
        failCount,
      }));

      // Jeda 120ms agar browser & event loop rileks
      await new Promise((r) => setTimeout(r, 120));
    }

    const completedNaturally = !isPausedRef.current;

    setMassalProgress((prev) => ({
      ...prev,
      isActive: true,
      currentIndex: targets.length,
      currentGuruId: null,
      currentGuruNama: "",
      currentMapelInfo: "",
      percent: completedNaturally ? 100 : prev.percent,
      isDone: completedNaturally,
      successCount,
      failCount,
    }));

    setIsGenerating(false);

    if (completedNaturally) {
      toast.success(
        `Selesai memproses perangkat pembelajaran! (${successCount} berhasil${
          failCount > 0 ? `, ${failCount} gagal` : ""
        })`
      );
    }
  };

  const handlePauseMassal = () => {
    isPausedRef.current = true;
    setIsPaused(true);
  };

  const handleRetryGuru = async (guruId: string) => {
    setTeacherStatusMap((prev) => ({ ...prev, [guruId]: "processing" }));
    try {
      const res = await callGenerateGuru(guruId, autoSubmitOption);
      if (res.success) {
        setTeacherStatusMap((prev) => ({ ...prev, [guruId]: "success" }));
        toast.success("Berhasil membuatkan perangkat untuk guru ini.");
      } else {
        setTeacherStatusMap((prev) => ({ ...prev, [guruId]: "error" }));
        toast.error(res.error || "Gagal membuat perangkat.");
      }
    } catch {
      setTeacherStatusMap((prev) => ({ ...prev, [guruId]: "error" }));
      toast.error("Terjadi galat koneksi.");
    }
  };

  const handleCloseMassalModal = () => {
    if (isGenerating) return;
    const wasDone = massalProgress.isDone;
    setModalMassalOpen(false);
    setMassalProgress({
      isActive: false,
      currentIndex: 0,
      total: 0,
      currentGuruId: null,
      currentGuruNama: "",
      currentMapelInfo: "",
      percent: 0,
      isDone: false,
      successCount: 0,
      failCount: 0,
    });
    setTeacherStatusMap({});
    if (wasDone) {
      router.refresh();
    }
  };

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

            {guruBelumLengkap.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setModalMassalOpen(true)}
                className="border-amber-300 bg-amber-50/70 text-amber-800 hover:bg-amber-100 font-medium text-xs rounded-xl shadow-2xs gap-1.5 h-9 px-3.5 transition-colors cursor-pointer"
                title="Buatkan otomatis seluruh dokumen default untuk guru yang progresnya masih rendah"
              >
                <Wand2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Auto-Generate Default ({guruBelumLengkap.length})</span>
              </Button>
            )}
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

                      {/* Progres Rata-rata Guru, Tombol Unduh ZIP & Chevron */}
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <div className="hidden sm:block text-right min-w-[100px]">
                          <span className="text-xs font-bold text-slate-900 block">
                            {group.avgProgress}% Selesai
                          </span>
                          <div className="w-24 mt-1">
                            <Progress value={group.avgProgress} className="h-1.5 bg-slate-100" />
                          </div>
                        </div>

                        {/* Tombol Unduh ZIP Cepat */}
                        <div
                          onClick={(e) => handleDownloadTeacherZip(group.guruId, group.guruNama, e)}
                          role="button"
                          tabIndex={0}
                          className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-medium transition-colors cursor-pointer"
                          title="Unduh berkas ZIP seluruh dokumen tervalidasi milik guru ini"
                        >
                          {downloadingGuruId === group.guruId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          ) : (
                            <FileArchive className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>Unduh ZIP</span>
                        </div>

                        {/* Tombol Buat Default Perangkat Guru */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalGuru({
                              guruId: group.guruId,
                              guruNama: group.guruNama,
                              avgProgress: group.avgProgress,
                              penugasanCount: group.items.length,
                              items: group.items,
                            });
                          }}
                          role="button"
                          tabIndex={0}
                          className={`hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                            group.avgProgress < 100
                              ? "border-amber-300 bg-amber-50/80 text-amber-900 hover:bg-amber-100"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                          title={
                            group.avgProgress < 100
                              ? "Progres guru ini belum 100%. Klik untuk membuatkan otomatis seluruh dokumen default (ATP, Prota, Prosem, RPP)."
                              : "Generate ulang perangkat default untuk guru ini"
                          }
                        >
                          <Wand2 className="w-3.5 h-3.5 text-amber-600" />
                          <span>Buat Default</span>
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
                                        {item.rppCount} / {item.rppTarget} RPP
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
                              {item.rppCount} / {item.rppTarget} RPP
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

      {/* ========================================================================= */}
      {/* DIALOG AUTO-GENERATE PERANGKAT DEFAULT (SATU GURU) */}
      {/* ========================================================================= */}
      <Dialog
        open={!!modalGuru}
        onOpenChange={(open) => {
          if (!open && !isGenerating) {
            setModalGuru(null);
            setSingleProgress({ isActive: false, stepText: "", percent: 0, isDone: false });
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
              Sistem akan secara otomatis menyusun seluruh dokumen perangkat ajar lengkap (ATP, Prota, Prosem, dan Modul Ajar) sesuai standar Kurikulum Berbasis Cinta (KBC).
            </DialogDescription>
          </DialogHeader>

          {modalGuru && (
            <div className="space-y-4 py-2 text-xs">
              {singleProgress.isActive ? (
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 border-2 border-amber-300 rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold shrink-0">
                        {singleProgress.isDone ? (
                          <CheckCheck className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                          {singleProgress.isDone ? "Selesai" : "Sedang Menyusun"}
                        </span>
                        <span className="font-bold text-amber-950 text-sm block truncate">
                          {modalGuru.guruNama}
                        </span>
                      </div>
                    </div>
                    <Badge
                      className={`${
                        singleProgress.isDone
                          ? "bg-emerald-600 text-white"
                          : "bg-amber-600 text-white"
                      } font-mono text-xs px-2.5 py-0.5 shrink-0 shadow-2xs`}
                    >
                      {singleProgress.percent}%
                    </Badge>
                  </div>

                  {singleProgress.currentMapel && (
                    <div className="bg-white/85 backdrop-blur-xs rounded-xl px-3 py-2 border border-amber-200/70 text-[11px] text-amber-900 flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="truncate">
                        <strong>Menyusun:</strong> {singleProgress.currentMapel}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-amber-800 font-medium">
                      <span>{singleProgress.stepText}</span>
                      <span className="font-bold">{singleProgress.percent}%</span>
                    </div>
                    <Progress
                      value={singleProgress.percent}
                      className={`h-2.5 ${
                        singleProgress.isDone ? "bg-emerald-200" : "bg-amber-200/60"
                      }`}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 text-sm">{modalGuru.guruNama}</span>
                      <Badge className="bg-amber-600 text-white text-[11px]">
                        Progres: {modalGuru.avgProgress}%
                      </Badge>
                    </div>
                    <p className="text-amber-800">
                      Meliputi <strong>{modalGuru.penugasanCount} penugasan kelas</strong> yang ditugaskan kepada guru ini.
                      {modalGuru.items && modalGuru.items.length > 0 && (
                        <span className="block mt-1 text-[11px] text-amber-700">
                          Kelas: {modalGuru.items.map((it) => `${it.mapelNama} (${it.rombel})`).join(", ")}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-3 bg-slate-50/60 space-y-2">
                    <p className="font-semibold text-slate-800">Dokumen yang otomatis dihasilkan:</p>
                    <ul className="space-y-1 text-slate-600 pl-4 list-disc">
                      <li><strong>Alur Tujuan Pembelajaran (ATP)</strong>: Analisis CP & Tujuan Pembelajaran operasional.</li>
                      <li><strong>Program Tahunan (Prota)</strong>: Distribusi materi dan alokasi JP per semester.</li>
                      <li><strong>Program Semester (Prosem)</strong>: Matriks alokasi mingguan efektif Semester 1 & 2.</li>
                      <li><strong>Modul Ajar / RPP KBC</strong>: Perangkat ajar lengkap dengan sintaks pedagogi kasih sayang.</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 space-y-1">
                    <span className="font-semibold block">💡 Rumus Alokasi JP Per Elemen (ATP):</span>
                    <p className="text-blue-800">
                      Alokasi JP per elemen dibagi rata secara otomatis berdasarkan target JP tahunan kalender pendidikan dibagi jumlah elemen CP, serta terdistribusi seimbang ke Semester 1 dan 2.
                    </p>
                  </div>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoSubmitOption}
                      onChange={(e) => setAutoSubmitOption(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-xs text-slate-700 font-medium">
                      Langsung ajukan dokumen (status <strong>Diajukan</strong>) agar siap ditelaah & divalidasi.
                    </span>
                  </label>
                </>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {singleProgress.isDone ? (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setModalGuru(null);
                  setSingleProgress({ isActive: false, stepText: "", percent: 0, isDone: false });
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
                  disabled={isGenerating}
                  onClick={() => {
                    setModalGuru(null);
                    setSingleProgress({ isActive: false, stepText: "", percent: 0, isDone: false });
                  }}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isGenerating}
                  onClick={handleConfirmGenerateGuru}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sedang Menyusun...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Buatkan Perangkat Sekarang</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* DIALOG AUTO-GENERATE MASSAL (SEMUA GURU BELUM LENGKAP) */}
      {/* ========================================================================= */}
      <Dialog
        open={modalMassalOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseMassalModal();
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Wand2 className="w-5 h-5 text-amber-600" />
              <span>Generate Default Massal untuk Guru Belum Lengkap</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Menyusun sekaligus seluruh dokumen perangkat ajar bagi seluruh guru yang progresnya masih rendah (&lt; 100%).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {/* 1. Header Progress Banner */}
            {massalProgress.isDone ? (
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <CheckCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-950 text-sm">
                      🎉 Seluruh Perangkat Default Berhasil Dibuat!
                    </h4>
                    <p className="text-emerald-800 text-[11px] mt-0.5">
                      Berhasil membuatkan seluruh dokumen perangkat ajar untuk{" "}
                      <strong>{massalProgress.successCount} guru</strong>
                      {massalProgress.failCount > 0 && ` (${massalProgress.failCount} gagal)`}.
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-emerald-800 font-medium">
                    <span>Progres Selesai</span>
                    <span className="font-bold text-emerald-900">100% Selesai</span>
                  </div>
                  <Progress value={100} className="h-2.5 bg-emerald-200" />
                </div>
              </div>
            ) : isGenerating ? (
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 border-2 border-amber-300 rounded-2xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                        Memproses Guru {massalProgress.currentIndex} dari {massalProgress.total}
                      </span>
                      <span className="font-bold text-amber-950 text-sm block truncate">
                        Sedang membuat punya: {massalProgress.currentGuruNama || "Mempersiapkan..."}
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-amber-600 text-white font-mono text-xs px-2.5 py-0.5 shrink-0 shadow-2xs">
                    {massalProgress.percent}%
                  </Badge>
                </div>

                {massalProgress.currentMapelInfo && (
                  <div className="bg-white/85 backdrop-blur-xs rounded-xl px-3 py-2 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span className="truncate">
                      <strong>Penugasan:</strong> {massalProgress.currentMapelInfo}
                    </span>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-amber-800 font-medium">
                    <span>Sedang Menyusun Dokumen (ATP, Prota, Prosem, Modul Ajar)...</span>
                    <span className="font-bold">{massalProgress.currentIndex} / {massalProgress.total} Guru</span>
                  </div>
                  <Progress value={massalProgress.percent} className="h-2.5 bg-amber-200/60" />
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-amber-950 text-sm">
                    {guruBelumLengkap.length} Guru Memerlukan Pembuatan
                  </p>
                  <p className="text-amber-800 text-[11px] mt-0.5">
                    Total {guruBelumLengkap.reduce((acc, g) => acc + g.items.length, 0)} penugasan kelas yang belum lengkap.
                  </p>
                </div>
                <Badge className="bg-amber-600 text-white text-xs font-semibold">
                  {guruBelumLengkap.length} Guru
                </Badge>
              </div>
            )}

            {/* List Guru yang Belum Lengkap dengan Status Realtime */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 px-1">
                <span>Daftar Guru ({guruBelumLengkap.length})</span>
                {isGenerating && (
                  <span className="text-amber-700 font-medium animate-pulse">
                    Sedang memproses antrean...
                  </span>
                )}
              </div>

              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white scroll-smooth p-1 space-y-0.5">
                {guruBelumLengkap.map((g, idx) => {
                  const status = teacherStatusMap[g.guruId] || "pending";
                  const isCurrent = massalProgress.currentGuruId === g.guruId;

                  return (
                    <div
                      key={g.guruId}
                      id={`massal-guru-item-${g.guruId}`}
                      className={`p-2.5 rounded-lg flex items-center justify-between text-xs transition-all duration-200 ${
                        isCurrent
                          ? "bg-amber-50/90 border border-amber-300 ring-2 ring-amber-400/40 shadow-xs"
                          : status === "success"
                          ? "bg-emerald-50/30 border border-emerald-100"
                          : status === "error"
                          ? "bg-rose-50/40 border border-rose-200"
                          : "hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span
                          className={`font-mono text-[11px] w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-medium ${
                            isCurrent
                              ? "bg-amber-600 text-white"
                              : status === "success"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span
                            className={`font-semibold block truncate ${
                              isCurrent ? "text-amber-950 font-bold" : "text-slate-800"
                            }`}
                          >
                            {g.guruNama}
                          </span>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {g.items.length} Penugasan (
                            {g.items.map((it) => `${it.mapelNama} Kls ${it.tingkatKelas}`).join(", ")})
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {status === "processing" ? (
                          <Badge className="bg-amber-500 hover:bg-amber-500 text-white border-0 text-[11px] gap-1 animate-pulse shadow-2xs">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Sedang dibuat...</span>
                          </Badge>
                        ) : status === "success" ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[11px] gap-1 font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Selesai</span>
                          </Badge>
                        ) : status === "error" ? (
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[11px] gap-1">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>Gagal</span>
                            </Badge>
                            {!isGenerating && (
                              <button
                                type="button"
                                onClick={() => handleRetryGuru(g.guruId)}
                                className="text-[11px] text-amber-700 font-semibold underline hover:text-amber-900 cursor-pointer"
                                title="Coba buatkan ulang untuk guru ini"
                              >
                                Coba lagi
                              </button>
                            )}
                          </div>
                        ) : isGenerating ? (
                          <Badge
                            variant="outline"
                            className="text-slate-400 bg-slate-50 border-slate-200 text-[11px] gap-1"
                          >
                            <Clock className="w-3 h-3" />
                            <span>Menunggu</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-rose-700 bg-rose-50 border-rose-200 text-[11px]"
                          >
                            {g.avgProgress}% Selesai
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {!isGenerating && !massalProgress.isDone && (
              <>
                {/* Opsi Batch Limit untuk Mencegah Timeout */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/70">
                  <div>
                    <span className="font-semibold text-slate-800 block text-xs">Porsi Pembuatan:</span>
                    <span className="text-[11px] text-slate-500">
                      Bisa diproses bertahap per batch agar server tetap ringan
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[
                      { val: 0, label: "Semua Sekaligus" },
                      { val: 5, label: "5 Guru" },
                      { val: 10, label: "10 Guru" },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setBatchLimit(opt.val)}
                        className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-colors cursor-pointer ${
                          batchLimit === opt.val
                            ? "bg-amber-600 text-white shadow-2xs font-semibold"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoSubmitOption}
                    onChange={(e) => setAutoSubmitOption(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Langsung ajukan seluruh dokumen ke antrian validasi (Status: <strong>Diajukan</strong>).
                  </span>
                </label>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {massalProgress.isDone ? (
              <Button
                type="button"
                size="sm"
                onClick={handleCloseMassalModal}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-9 font-semibold"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Tutup & Perbarui Tampilan Dashboard</span>
              </Button>
            ) : isGenerating ? (
              <div className="w-full flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePauseMassal}
                  className="text-xs gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50"
                  title="Jeda sementara antrean pembuatan perangkat"
                >
                  <Pause className="w-3.5 h-3.5 text-amber-600" />
                  <span>Jeda Sementara</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={true}
                  className="bg-amber-600 text-white text-xs gap-1.5"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    Sedang Membuat ({massalProgress.currentIndex}/{massalProgress.total})...
                  </span>
                </Button>
              </div>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseMassalModal}
                  className="text-xs"
                >
                  {Object.values(teacherStatusMap).some((s) => s === "success")
                    ? "Tutup & Refresh"
                    : "Batal"}
                </Button>

                {/* Tombol Lanjutkan jika ada yang dijeda atau gagal */}
                {guruBelumLengkap.some((g) => teacherStatusMap[g.guruId] === "error" || teacherStatusMap[g.guruId] === "pending") &&
                Object.values(teacherStatusMap).some((s) => s === "success") ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleConfirmGenerateMassal(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>
                      Lanjutkan Sisa (
                      {
                        guruBelumLengkap.filter(
                          (g) => teacherStatusMap[g.guruId] !== "success"
                        ).length
                      }{" "}
                      Guru)
                    </span>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleConfirmGenerateMassal(false)}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>
                      Generate Sekarang (
                      {batchLimit > 0
                        ? `${Math.min(batchLimit, guruBelumLengkap.length)} Guru`
                        : `${guruBelumLengkap.length} Guru`}
                      )
                    </span>
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
