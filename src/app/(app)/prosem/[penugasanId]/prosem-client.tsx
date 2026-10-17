"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Save,
  Send,
  Eye,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Layers,
  RotateCcw,
  Wand2,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  saveProsemAction,
  syncProsemFromProtaAction,
  type ProsemDetailData,
  type ProsemItemPayload,
} from "../actions";
import type { DocStatus, JenisKegiatanKalender } from "@/types/database";

interface ProsemClientProps {
  initialData: ProsemDetailData;
  penugasanId: string;
  semester: 1 | 2;
}

export function ProsemClient({
  initialData,
  penugasanId,
  semester,
}: ProsemClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [status, setStatus] = useState<DocStatus>(initialData.prosem.status);
  const [items, setItems] = useState<ProsemItemPayload[]>(initialData.items);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  const jpLimit = initialData.penugasan.mapel.jp_per_minggu;

  // Grupkan kolom minggu berdasarkan bulan
  const bulanMap = new Map<
    string,
    { bulan: string; bulanIndex: number; weeks: typeof initialData.kolomMinggu }
  >();
  initialData.kolomMinggu.forEach((col) => {
    const existing = bulanMap.get(col.bulan) || {
      bulan: col.bulan,
      bulanIndex: col.bulanIndex,
      weeks: [],
    };
    existing.weeks.push(col);
    bulanMap.set(col.bulan, existing);
  });
  const bulanGroupList = Array.from(bulanMap.values());

  // Hitung jumlah JP per kolom minggu (vertikal)
  const sumPerKolom: Record<string, number> = {};
  initialData.kolomMinggu.forEach((col) => {
    let sum = 0;
    items.forEach((it) => {
      sum += Number(it.distribusi_minggu?.[col.key] || 0);
    });
    sumPerKolom[col.key] = sum;
  });

  // Hitung total JP per baris TP (horizontal)
  const getSumBaris = (it: ProsemItemPayload) => {
    return Object.values(it.distribusi_minggu || {}).reduce(
      (acc, v) => acc + Number(v || 0),
      0
    );
  };

  // Grand total seluruh semester
  const grandTotalSemester = Object.values(sumPerKolom).reduce((acc, v) => acc + v, 0);

  // Cek apakah ada minggu yang over-allocated (> jpLimit)
  const hasOverallocatedWeek = Object.entries(sumPerKolom).some(
    ([, sum]) => sum > jpLimit
  );

  // Ubah sel matriks secara inline
  const handleCellChange = (itemIndex: number, weekKey: string, valStr: string) => {
    const val = Math.max(0, parseInt(valStr, 10) || 0);
    setItems((prev) => {
      const copy = [...prev];
      const curItem = { ...copy[itemIndex] };
      const curDist = { ...(curItem.distribusi_minggu || {}) };

      if (val === 0) {
        delete curDist[weekKey];
      } else {
        curDist[weekKey] = val;
      }

      curItem.distribusi_minggu = curDist;
      copy[itemIndex] = curItem;
      return copy;
    });
  };

  // Distribusi Otomatis Alokasi Waktu
  const handleAutoDistribute = () => {
    const effectiveWeeks = initialData.kolomMinggu.filter((k) => k.efektif);

    // Kapasitas mingguan tersisa
    const capacityMap = new Map<string, number>();
    effectiveWeeks.forEach((w) => capacityMap.set(w.key, jpLimit));

    let currentWeekIndex = 0;

    const newItems = items.map((tp) => {
      let neededJp = Number(tp.alokasi_jp || 0);
      const newDistribusi: Record<string, number> = {};

      while (neededJp > 0 && currentWeekIndex < effectiveWeeks.length) {
        const curWeek = effectiveWeeks[currentWeekIndex];
        const avail = capacityMap.get(curWeek.key) || 0;

        if (avail <= 0) {
          currentWeekIndex++;
          continue;
        }

        const allocated = Math.min(avail, neededJp);
        newDistribusi[curWeek.key] = allocated;
        capacityMap.set(curWeek.key, avail - allocated);
        neededJp -= allocated;

        if (capacityMap.get(curWeek.key) === 0) {
          currentWeekIndex++;
        }
      }

      return {
        ...tp,
        distribusi_minggu: newDistribusi,
      };
    });

    setItems(newItems);
    setSaveSuccessMsg("Alokasi jam pelajaran berhasil didistribusikan secara otomatis ke seluruh minggu efektif!");
  };

  // Reset Matriks
  const handleResetMatrix = () => {
    const resetItems = items.map((it) => ({
      ...it,
      distribusi_minggu: {},
    }));
    setItems(resetItems);
    setSaveSuccessMsg("Seluruh sel matriks berhasil dikosongkan.");
  };

  // Sinkronkan Ulang dari Program Tahunan (Prota)
  const handleSyncFromProta = () => {
    if (
      !confirm(
        `Sinkronkan ulang item TP dari Program Tahunan (Prota) untuk Semester ${semester}? Seluruh alokasi matriks akan diselaraskan dengan data Prota.`
      )
    ) {
      return;
    }
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    startTransition(async () => {
      const res = await syncProsemFromProtaAction(penugasanId, semester);
      if (res.success && res.data) {
        setItems(res.data);
        setSaveSuccessMsg(
          `Berhasil menyinkronkan ${res.data.length} item TP dari Program Tahunan (Prota) untuk Semester ${semester}!`
        );
        router.refresh();
      } else {
        setSaveErrorMsg(res.error || "Gagal menyinkronkan dari Prota.");
      }
    });
  };

  // Simpan Draf / Ajukan Validasi
  const handleSave = (targetStatus: DocStatus) => {
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    startTransition(async () => {
      const res = await saveProsemAction(penugasanId, semester, items, targetStatus);
      if (res.success) {
        setStatus(targetStatus);
        setSaveSuccessMsg(
          targetStatus === "diajukan"
            ? "Program Semester berhasil diajukan untuk validasi pimpinan madrasah!"
            : "Draf matriks Program Semester berhasil disimpan."
        );
        router.refresh();
      } else {
        setSaveErrorMsg(res.error || "Gagal menyimpan Prosem.");
      }
    });
  };

  // Helper warna & badge jenis kegiatan
  const getKegiatanStyle = (jenis: JenisKegiatanKalender, efektif: boolean) => {
    if (efektif) {
      return {
        bg: "bg-white",
        text: "text-slate-800",
        badgeBg: "bg-slate-100",
      };
    }
    switch (jenis) {
      case "libur":
        return {
          bg: "bg-rose-100/70 border-rose-200",
          text: "text-rose-900 font-bold",
          badgeBg: "bg-rose-200 text-rose-900",
        };
      case "asesmen":
        return {
          bg: "bg-purple-100/70 border-purple-200",
          text: "text-purple-900 font-bold",
          badgeBg: "bg-purple-200 text-purple-900",
        };
      case "matsama":
        return {
          bg: "bg-blue-100/70 border-blue-200",
          text: "text-blue-900 font-bold",
          badgeBg: "bg-blue-200 text-blue-900",
        };
      case "ramadhan":
        return {
          bg: "bg-emerald-100/70 border-emerald-200",
          text: "text-emerald-900 font-bold",
          badgeBg: "bg-emerald-200 text-emerald-900",
        };
      case "kegiatan_madrasah":
        return {
          bg: "bg-amber-100/70 border-amber-200",
          text: "text-amber-900 font-bold",
          badgeBg: "bg-amber-200 text-amber-900",
        };
      default:
        return {
          bg: "bg-slate-100/80 border-slate-200",
          text: "text-slate-700 font-bold",
          badgeBg: "bg-slate-200 text-slate-800",
        };
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header Navigasi & Identitas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <Link
            href="/prosem"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-emerald-700 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Kembali ke Daftar Penugasan Prosem
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Program Semester (Prosem)
            </h1>
            <Badge
              variant="outline"
              className={
                status === "disetujui"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                  : status === "diajukan"
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : status === "revisi"
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : "bg-slate-100 text-slate-700 border-slate-200"
              }
            >
              {status === "disetujui"
                ? "Disetujui"
                : status === "diajukan"
                ? "Diajukan"
                : status === "revisi"
                ? "Revisi"
                : "Draf"}
            </Badge>
          </div>
          <p className="text-sm text-slate-600">
            {initialData.penugasan.mapel.nama} • Kelas {initialData.penugasan.tingkat_kelas} (
            {initialData.penugasan.rombel}) • Semester {semester} (
            {semester === 1 ? "Ganjil" : "Genap"}) • {jpLimit} JP/minggu • TP{" "}
            {initialData.penugasan.tahun_ajaran.nama}
          </p>
        </div>

        {/* Tab Switcher Semester & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Switcher Semester */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs">
            <Link
              href={`/prosem/${penugasanId}?semester=1`}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                semester === 1
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              Semester 1 (Ganjil)
            </Link>
            <Link
              href={`/prosem/${penugasanId}?semester=2`}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                semester === 2
                  ? "bg-emerald-600 text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              Semester 2 (Genap)
            </Link>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncFromProta}
            disabled={isPending}
            className="border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 font-semibold"
            title="Tarik kembali item TP dan alokasi JP terbaru dari Program Tahunan (Prota)"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 text-blue-600 ${isPending ? "animate-spin" : ""}`} />
            Sinkronkan dari Prota
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoDistribute}
            disabled={isPending || items.length === 0}
            className="border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold"
            title="Isi alokasi waktu otomatis ke minggu-minggu efektif"
          >
            <Wand2 className="w-4 h-4 mr-1.5 text-emerald-600" />
            Distribusi Otomatis
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleResetMatrix}
            disabled={isPending}
            className="border-slate-200 text-slate-600 hover:bg-slate-50"
            title="Kosongkan sel matriks"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Reset
          </Button>

          <Link
            href={`/prosem/${penugasanId}/preview?semester=${semester}`}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "border-slate-200 text-slate-700 hover:bg-slate-50",
            })}
          >
            <Eye className="w-4 h-4 mr-1.5 text-slate-500" />
            Pratinjau Cetak
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave("draf")}
            disabled={isPending}
            className="border-emerald-200 text-emerald-800 hover:bg-emerald-50"
          >
            <Save className="w-4 h-4 mr-1.5 text-emerald-600" />
            Simpan Draf
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => handleSave("diajukan")}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            <Send className="w-4 h-4 mr-1.5" />
            Ajukan Validasi
          </Button>
        </div>
      </div>

      {/* Notifikasi feedback */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <Button variant="ghost" size="xs" onClick={() => setSaveSuccessMsg(null)}>
            Tutup
          </Button>
        </div>
      )}

      {saveErrorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{saveErrorMsg}</span>
          </div>
          <Button variant="ghost" size="xs" onClick={() => setSaveErrorMsg(null)}>
            Tutup
          </Button>
        </div>
      )}

      {/* Ringkasan & Legenda Warna Kegiatan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Metrik 1: Total Terdistribusi */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Alokasi Matriks Terdistribusi
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {grandTotalSemester}{" "}
            <span className="text-xs font-normal text-slate-500">
              / {initialData.jpEfektifSemester} JP Efektif
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            {initialData.mingguEfektifSemester} minggu efektif &times; {jpLimit} JP/minggu
          </span>
        </div>

        {/* Metrik 2: Kepatuhan JP Mingguan */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Batas JP per Minggu
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            Maks. {jpLimit}{" "}
            <span className="text-xs font-normal text-slate-500">JP/minggu</span>
          </div>
          <span
            className={`text-[11px] font-medium flex items-center gap-1 ${
              hasOverallocatedWeek ? "text-rose-600" : "text-emerald-700"
            }`}
          >
            {hasOverallocatedWeek ? (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                Peringatan: Terdapat minggu &gt; {jpLimit} JP!
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Semua minggu memenuhi batas JP
              </>
            )}
          </span>
        </div>

        {/* Metrik 3 & 4: Legenda Warna Kalender */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs md:col-span-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
            Legenda Kalender & Keterangan Warna
          </span>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-rose-200 bg-rose-100 text-rose-900 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              Libur Semester / Nasional
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-purple-200 bg-purple-100 text-purple-900 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              Asesmen (STS / SAS)
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-blue-200 bg-blue-100 text-blue-900 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              MATSAMA
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-emerald-200 bg-emerald-100 text-emerald-900 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              Ramadhan & Idul Fitri
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-amber-200 bg-amber-100 text-amber-900 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
              Kegiatan Madrasah
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              Minggu Efektif KBM
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GRID MATRIKS PROGRAM SEMESTER */}
      {/* ========================================================================= */}
      <Card className="border-slate-200/90 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-3.5 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                Matriks Distribusi Mingguan — Semester {semester} (
                {semester === 1 ? "Juli–Desember" : "Januari–Juni"})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Isi alokasi JP per minggu pada sel efektif atau gunakan tombol &ldquo;Distribusi Otomatis&rdquo;. Geser
                tabel ke kanan untuk melihat seluruh minggu.
              </CardDescription>
            </div>

            <div className="text-xs font-semibold text-slate-700 bg-white px-3 py-1 rounded border border-slate-200 self-start sm:self-auto">
              Total {items.length} TP • {initialData.kolomMinggu.length} Minggu Kalender
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Layers className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">Belum Ada Tujuan Pembelajaran</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Dokumen Prosem belum memiliki TP untuk semester {semester}. Buka modul Prota terlebih dahulu untuk
                mengatur alokasi waktu dan semester TP.
              </p>
              <Link
                href={`/prota/${penugasanId}`}
                className={buttonVariants({
                  variant: "default",
                  size: "sm",
                  className: "bg-emerald-600 hover:bg-emerald-700 text-white text-xs",
                })}
              >
                Atur TP di Program Tahunan (Prota) &rarr;
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto relative">
              <table className="w-full text-xs text-left border-collapse min-w-[1200px]">
                <thead>
                  {/* HEADER TINGKAT 1: BULAN */}
                  <tr className="bg-slate-100 text-slate-800 font-bold uppercase tracking-wider border-b border-slate-200">
                    <th
                      rowSpan={2}
                      className="py-2.5 px-2 text-center w-12 border-r border-slate-200 sticky left-0 bg-slate-100 z-20 shadow-2xs"
                    >
                      No
                    </th>
                    <th
                      rowSpan={2}
                      className="py-2.5 px-3 min-w-[220px] max-w-[280px] border-r border-slate-200 sticky left-12 bg-slate-100 z-20 shadow-2xs"
                    >
                      Tujuan Pembelajaran (TP) & Materi
                    </th>
                    <th
                      rowSpan={2}
                      className="py-2.5 px-2 text-center w-16 border-r border-slate-300 bg-slate-200/60 sticky left-[292px] z-20 shadow-2xs"
                    >
                      Target JP
                    </th>
                    <th
                      rowSpan={2}
                      className="py-2.5 px-2 text-center w-16 border-r border-slate-300 bg-slate-200/80 sticky left-[356px] z-20 shadow-xs"
                    >
                      Total Terisi
                    </th>

                    {/* Kolom Nama Bulan */}
                    {bulanGroupList.map((bg) => (
                      <th
                        key={`header-m-${bg.bulan}`}
                        colSpan={bg.weeks.length}
                        className="py-2 px-1 text-center border-r border-slate-200 bg-slate-100/90 text-slate-900 font-black tracking-normal"
                      >
                        {bg.bulan}
                      </th>
                    ))}
                  </tr>

                  {/* HEADER TINGKAT 2: MINGGU KE-1..5 */}
                  <tr className="bg-slate-50 text-slate-700 font-semibold border-b-2 border-slate-300">
                    {initialData.kolomMinggu.map((col) => {
                      const style = getKegiatanStyle(col.jenisKegiatan, col.efektif);
                      return (
                        <th
                          key={`col-week-${col.key}`}
                          className={`py-1.5 px-1 text-center w-10 border-r border-slate-200 ${
                            !col.efektif ? style.bg : "bg-slate-50"
                          }`}
                          title={`${col.bulan} M-${col.mingguKe} (${col.rentangTanggal}): ${
                            col.efektif
                              ? "Minggu Efektif KBM"
                              : col.kegiatanPemotong.join(", ") || "Tidak Efektif"
                          }`}
                        >
                          <span
                            className={`inline-block w-6 text-center text-[11px] rounded ${
                              !col.efektif ? style.text : "text-slate-700 font-bold"
                            }`}
                          >
                            {col.mingguKe}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {items.map((tp, itemIndex) => {
                    const sumBaris = getSumBaris(tp);
                    const targetJp = Number(tp.alokasi_jp || 0);
                    const isPas = sumBaris === targetJp;
                    const isKurang = sumBaris < targetJp;

                    return (
                      <tr key={`tp-row-${itemIndex}-${tp.kode_tp}`} className="hover:bg-slate-50/70 transition-colors">
                        {/* No */}
                        <td className="py-2.5 px-2 text-center text-slate-500 border-r border-slate-200 sticky left-0 bg-white z-10">
                          {itemIndex + 1}
                        </td>

                        {/* TP & Materi (Sticky Left) */}
                        <td className="py-2 px-3 border-r border-slate-200 sticky left-12 bg-white z-10 max-w-[280px]">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                                {tp.kode_tp}
                              </span>
                              <span className="font-semibold text-slate-800 text-xs line-clamp-1">
                                {tp.materi_pokok}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                              {tp.tujuan_pembelajaran_teks}
                            </p>
                          </div>
                        </td>

                        {/* Target JP */}
                        <td className="py-2 px-2 text-center font-bold text-slate-700 border-r border-slate-300 bg-slate-50/50 sticky left-[292px] z-10">
                          {targetJp} JP
                        </td>

                        {/* Total Terisi (Status Badge) */}
                        <td
                          className={`py-2 px-2 text-center font-black border-r border-slate-300 sticky left-[356px] z-10 ${
                            isPas
                              ? "bg-emerald-50 text-emerald-800"
                              : isKurang
                              ? "bg-amber-50 text-amber-800"
                              : "bg-rose-50 text-rose-800"
                          }`}
                          title={`Target: ${targetJp} JP | Terisi: ${sumBaris} JP`}
                        >
                          <span className="inline-block px-1.5 py-0.5 rounded text-[11px]">
                            {sumBaris} / {targetJp}
                          </span>
                        </td>

                        {/* Sel-Sel Matriks Mingguan */}
                        {initialData.kolomMinggu.map((col) => {
                          const val = tp.distribusi_minggu?.[col.key] || "";
                          const style = getKegiatanStyle(col.jenisKegiatan, col.efektif);

                          if (!col.efektif) {
                            return (
                              <td
                                key={`cell-${tp.kode_tp}-${col.key}`}
                                className={`py-1 px-1 text-center border-r border-slate-200 select-none ${style.bg}`}
                                title={`${col.bulan} M-${col.mingguKe}: ${col.kegiatanPemotong.join(", ")}`}
                              >
                                <span className="inline-block text-[10px] text-slate-400 font-mono">
                                  &times;
                                </span>
                              </td>
                            );
                          }

                          // Minggu Efektif: Input JP
                          const hasVal = Number(val) > 0;
                          return (
                            <td
                              key={`cell-${tp.kode_tp}-${col.key}`}
                              className={`py-1 px-1 text-center border-r border-slate-200 ${
                                hasVal ? "bg-emerald-50/60" : "bg-white"
                              }`}
                            >
                              <Input
                                type="number"
                                min={0}
                                max={jpLimit}
                                value={val}
                                onChange={(e) =>
                                  handleCellChange(itemIndex, col.key, e.target.value)
                                }
                                placeholder="-"
                                className={`w-9 h-7 p-0 text-center text-xs font-bold rounded-sm border ${
                                  hasVal
                                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                                } focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>

                {/* ========================================================================= */}
                {/* FOOTER MATRIKS: JUMLAH JP PER MINGGU & TOTAL */}
                {/* ========================================================================= */}
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-400">
                    <td
                      colSpan={2}
                      className="py-3 px-3 text-right uppercase tracking-wider border-r border-slate-200 sticky left-0 bg-slate-100 z-20 shadow-2xs"
                    >
                      Jumlah JP per Minggu:
                    </td>
                    <td className="py-3 px-2 text-center text-slate-600 border-r border-slate-300 bg-slate-200/60 sticky left-[292px] z-20 shadow-2xs">
                      -
                    </td>
                    <td className="py-3 px-2 text-center text-emerald-900 bg-emerald-100 border-r border-slate-300 sticky left-[356px] z-20 shadow-xs text-sm">
                      {grandTotalSemester} JP
                    </td>

                    {/* Total Tiap Kolom Minggu */}
                    {initialData.kolomMinggu.map((col) => {
                      const totalCol = sumPerKolom[col.key] || 0;
                      const isOver = totalCol > jpLimit;
                      const isFilled = totalCol > 0;

                      if (!col.efektif) {
                        return (
                          <td
                            key={`foot-${col.key}`}
                            className="py-2 px-1 text-center text-slate-400 bg-slate-200/40 border-r border-slate-200"
                          >
                            -
                          </td>
                        );
                      }

                      return (
                        <td
                          key={`foot-${col.key}`}
                          className={`py-2 px-1 text-center font-black text-xs border-r border-slate-200 ${
                            isOver
                              ? "bg-rose-200 text-rose-900 font-black animate-pulse"
                              : isFilled
                              ? "bg-emerald-50 text-emerald-900"
                              : "text-slate-400"
                          }`}
                          title={`Total Minggu Ini: ${totalCol} JP (Batas: ${jpLimit} JP)`}
                        >
                          {totalCol || "-"}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Bottom Bar Simpan */}
      <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-800">Total Matriks Smt {semester}:</span>
            <span className="text-sm font-black text-emerald-700">
              {grandTotalSemester} / {initialData.jpEfektifSemester} JP
            </span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600">Status Validasi Kolom:</span>
            {hasOverallocatedWeek ? (
              <span className="text-rose-700 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Ada minggu melebihi {jpLimit} JP
              </span>
            ) : (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Semua kolom minggu valid
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave("draf")}
            disabled={isPending}
            className="border-slate-300 hover:bg-slate-50 text-slate-700"
          >
            <Save className="w-4 h-4 mr-1.5" />
            Simpan Draf
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => handleSave("diajukan")}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
          >
            <Send className="w-4 h-4 mr-1.5" />
            Ajukan Validasi Dokumen
          </Button>
        </div>
      </div>
    </div>
  );
}
