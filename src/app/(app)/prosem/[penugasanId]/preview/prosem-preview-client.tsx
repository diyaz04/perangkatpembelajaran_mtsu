"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  ArrowLeft,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Download,
  Send,
  RefreshCw,
} from "lucide-react";
import type { ProsemDetailData } from "../../actions";
import type { JenisKegiatanKalender } from "@/types/database";
import { formatTitimangsa } from "@/lib/format-titimangsa";
import { submitDokumenAction, createRevisiCopyAction } from "@/lib/validasi/actions";
import { StatusTimeline } from "@/components/validasi/status-timeline";
import { Switch } from "@/components/ui/switch";
import { KopMadrasah } from "@/components/kop-madrasah";

interface ProsemPreviewClientProps {
  data: ProsemDetailData;
  penugasanId: string;
  semester: 1 | 2;
}

export function ProsemPreviewClient({
  data,
  penugasanId,
  semester,
}: ProsemPreviewClientProps) {
  const router = useRouter();
  const { penugasan, madrasah, prosem, kolomMinggu, items } = data;
  const [currentStatus, setCurrentStatus] = useState<string>(prosem.status);
  const [showKop, setShowKop] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleAjukan = async () => {
    if (!prosem.id) return;
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await submitDokumenAction("prosem", prosem.id);
      if (res.success) {
        setCurrentStatus("diajukan");
        setMsg({ type: "success", text: "Prosem berhasil diajukan untuk validasi." });
        router.refresh();
      } else {
        setMsg({ type: "error", text: res.error || "Gagal mengajukan Prosem." });
      }
    } catch {
      setMsg({ type: "error", text: "Terjadi kesalahan sistem saat mengajukan." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuatRevisi = async () => {
    if (!prosem.id) return;
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await createRevisiCopyAction("prosem", prosem.id);
      if (res.success) {
        setCurrentStatus("draf");
        router.push(`/prosem/${penugasanId}?semester=${semester}`);
      } else {
        setMsg({ type: "error", text: res.error || "Gagal membuat revisi Prosem." });
      }
    } catch {
      setMsg({ type: "error", text: "Terjadi kesalahan sistem saat membuat revisi." });
    } finally {
      setActionLoading(false);
    }
  };
  const { jpEfektifSemester, mingguEfektifSemester } = data;

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "disetujui":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Disetujui
          </Badge>
        );
      case "diajukan":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Diajukan
          </Badge>
        );
      case "revisi":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            Revisi
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-700">
            <FileCheck className="w-3.5 h-3.5 mr-1" />
            Draf
          </Badge>
        );
    }
  };

  // Group kolom minggu berdasarkan nama bulan
  const bulanMap = new Map<
    string,
    { bulan: string; bulanIndex: number; weeks: typeof kolomMinggu }
  >();
  kolomMinggu.forEach((col) => {
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
  kolomMinggu.forEach((col) => {
    let sum = 0;
    items.forEach((it) => {
      sum += Number(it.distribusi_minggu?.[col.key] || 0);
    });
    sumPerKolom[col.key] = sum;
  });

  // Grand total JP seluruh semester
  const grandTotalSemester = Object.values(sumPerKolom).reduce((acc, v) => acc + v, 0);

  // Helper style kegiatan kalender untuk print/layar
  const getKegiatanPrintStyle = (jenis: JenisKegiatanKalender, efektif: boolean) => {
    if (efektif) {
      return {
        bg: "bg-white",
        text: "text-slate-900 font-semibold",
        badge: "bg-slate-100 text-slate-800",
      };
    }
    switch (jenis) {
      case "libur":
        return {
          bg: "bg-rose-100 print:bg-rose-100",
          text: "text-rose-900 font-bold",
          badge: "bg-rose-200 text-rose-900",
        };
      case "asesmen":
        return {
          bg: "bg-purple-100 print:bg-purple-100",
          text: "text-purple-900 font-bold",
          badge: "bg-purple-200 text-purple-900",
        };
      case "matsama":
        return {
          bg: "bg-blue-100 print:bg-blue-100",
          text: "text-blue-900 font-bold",
          badge: "bg-blue-200 text-blue-900",
        };
      case "ramadhan":
        return {
          bg: "bg-emerald-100 print:bg-emerald-100",
          text: "text-emerald-900 font-bold",
          badge: "bg-emerald-200 text-emerald-900",
        };
      case "kegiatan_madrasah":
        return {
          bg: "bg-amber-100 print:bg-amber-100",
          text: "text-amber-900 font-bold",
          badge: "bg-amber-200 text-amber-900",
        };
      default:
        return {
          bg: "bg-slate-100 print:bg-slate-100",
          text: "text-slate-800 font-bold",
          badge: "bg-slate-200 text-slate-800",
        };
    }
  };

  // Kumpulkan daftar kegiatan non-efektif untuk catatan legenda
  const kegiatanNonEfektifList: { nama: string; jenis: JenisKegiatanKalender; rentang: string }[] = [];
  kolomMinggu.forEach((col) => {
    if (!col.efektif && col.kegiatanPemotong.length > 0) {
      col.kegiatanPemotong.forEach((namaKeg) => {
        if (!kegiatanNonEfektifList.some((k) => k.nama === namaKeg)) {
          kegiatanNonEfektifList.push({
            nama: namaKeg,
            jenis: col.jenisKegiatan,
            rentang: col.rentangTanggal,
          });
        }
      });
    }
  });

  return (
    <>
      {/* Inline Print Styles for Landscape A4 */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: landscape;
            margin: 8mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
          .print-landscape-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}} />

      <div className="flex-1 p-3 md:p-6 max-w-[1700px] mx-auto space-y-4">
        {/* Action Bar (Hanya tampil di layar, tersembunyi saat print) */}
        <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/prosem/${penugasanId}?semester=${semester}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Kembali ke Matriks Prosem
            </Link>
            <div>{getStatusBadge(prosem.status)}</div>

            {/* Switcher Semester */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs">
              <Link
                href={`/prosem/${penugasanId}/preview?semester=1`}
                className={`px-3 py-1 rounded font-semibold transition-colors ${
                  semester === 1
                    ? "bg-emerald-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Semester 1 (Ganjil)
              </Link>
              <Link
                href={`/prosem/${penugasanId}/preview?semester=2`}
                className={`px-3 py-1 rounded font-semibold transition-colors ${
                  semester === 2
                    ? "bg-emerald-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Semester 2 (Genap)
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {currentStatus === "disetujui" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBuatRevisi}
                disabled={actionLoading}
                className="border-amber-300 text-amber-800 hover:bg-amber-50 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                Buat Revisi
              </Button>
            ) : (currentStatus === "draf" || currentStatus === "revisi") && (
              <Button
                size="sm"
                onClick={handleAjukan}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {currentStatus === "revisi" ? "Ajukan Ulang Validasi" : "Ajukan Validasi"}
              </Button>
            )}

            {/* Toggle KOP Surat */}
            <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <Switch
                id="toggle-kop-prosem"
                checked={showKop}
                onCheckedChange={setShowKop}
              />
              <label
                htmlFor="toggle-kop-prosem"
                className="text-xs font-semibold cursor-pointer text-slate-700 select-none"
              >
                {showKop ? "KOP: Aktif" : "KOP: Nonaktif"}
              </label>
            </div>

            <a
              href={`/api/export/prosem/${penugasanId}?semester=${semester}&format=docx&kop=${showKop}`}
              className={buttonVariants({ variant: "outline", size: "sm" }) + " flex-1 sm:flex-none border-slate-300 hover:bg-slate-50 text-slate-800 font-medium"}
              download
            >
              <Download className="w-4 h-4 mr-2 text-emerald-700" />
              Unduh DOCX
            </a>
            <Button
              onClick={handlePrint}
              className="flex-1 sm:flex-none bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-sm"
            >
              <Printer className="w-4 h-4 mr-2" />
              Cetak / Simpan PDF (Landscape)
            </Button>
          </div>
        </div>

        {/* Feedback message */}
        {msg && (
          <div
            className={`print:hidden p-3 rounded-lg text-xs flex items-center gap-2 ${
              msg.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            {msg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* KONTAINER DOKUMEN CETAK RESMI (LANDSCAPE A4) */}
        {/* ========================================================================= */}
        <div className="relative print-landscape-container bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm text-slate-900 font-sans">
          {prosem.status !== "disetujui" && (
            <div className="watermark-draf-print pointer-events-none select-none">
              DRAF
            </div>
          )}
          {/* KOP MADRASAH RESMI */}
          {showKop && <KopMadrasah madrasah={madrasah} />}

          {/* JUDUL DOKUMEN */}
          <div className="text-center my-3 space-y-0.5">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-900 underline decoration-slate-900 underline-offset-4">
              PROGRAM SEMESTER (PROSEM)
            </h2>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-800">
              SEMESTER {semester === 1 ? "GANJIL" : "GENAP"} — TAHUN PELAJARAN {penugasan.tahun_ajaran.nama}
            </p>
            <p className="text-[10px] font-semibold text-emerald-800 tracking-wide">
              Kurikulum Berbasis Cinta (KBC) • Sesuai KMA 1503 Tahun 2025
            </p>
          </div>

          {/* IDENTITAS MAPEL */}
          <div className="my-3 text-[11px] bg-slate-50/60 p-2.5 rounded border border-slate-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-1.5 gap-x-4">
              <div>
                <span className="text-slate-500">Satuan Pendidikan:</span>{" "}
                <span className="font-bold text-slate-900">{madrasah.nama}</span>
              </div>
              <div>
                <span className="text-slate-500">Mata Pelajaran:</span>{" "}
                <span className="font-bold text-slate-900">
                  {penugasan.mapel.nama} ({penugasan.mapel.kode})
                </span>
              </div>
              <div>
                <span className="text-slate-500">Kelas / Rombel:</span>{" "}
                <span className="font-bold text-slate-900">
                  {penugasan.tingkat_kelas} ({penugasan.rombel})
                </span>
              </div>
              <div>
                <span className="text-slate-500">Semester:</span>{" "}
                <span className="font-bold text-slate-900">
                  {semester} ({semester === 1 ? "Ganjil" : "Genap"})
                </span>
              </div>
              <div>
                <span className="text-slate-500">Alokasi Waktu:</span>{" "}
                <span className="font-bold text-slate-900">
                  {penugasan.mapel.jp_per_minggu} JP / Minggu
                </span>
              </div>
              <div>
                <span className="text-slate-500">Minggu Efektif:</span>{" "}
                <span className="font-bold text-slate-900">
                  {mingguEfektifSemester} Minggu ({jpEfektifSemester} JP Efektif)
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">Guru Pengampu:</span>{" "}
                <span className="font-bold text-slate-900">
                  {penugasan.guru.nama_lengkap}
                  {penugasan.guru.gelar ? `, ${penugasan.guru.gelar}` : ""}{" "}
                  {penugasan.guru.nip ? `(NIP. ${penugasan.guru.nip})` : ""}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TABEL MATRIKS DISTRIBUSI MINGGUAN */}
          {/* ========================================================================= */}
          <div className="my-3 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-900 text-[10px]">
              {/* HEADER TINGKAT 1: NAMA BULAN */}
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 text-slate-900">
                  <th
                    rowSpan={2}
                    className="border border-slate-900 py-1.5 px-1.5 text-center w-8 font-black uppercase"
                  >
                    No
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-slate-900 py-1.5 px-2 text-left min-w-[200px] max-w-[280px] font-black uppercase"
                  >
                    Tujuan Pembelajaran (TP) & Materi Pokok
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-slate-900 py-1.5 px-1.5 text-center w-12 font-black uppercase"
                  >
                    Target JP
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-slate-900 py-1.5 px-1.5 text-center w-12 font-black uppercase"
                  >
                    Total Terisi
                  </th>

                  {/* Header Nama Bulan */}
                  {bulanGroupList.map((bg) => (
                    <th
                      key={`preview-m-${bg.bulan}`}
                      colSpan={bg.weeks.length}
                      className="border border-slate-900 py-1 px-1 text-center font-black uppercase bg-slate-200/80"
                    >
                      {bg.bulan}
                    </th>
                  ))}
                </tr>

                {/* HEADER TINGKAT 2: MINGGU KE */}
                <tr className="bg-slate-50 border-b-2 border-slate-900 text-slate-800">
                  {kolomMinggu.map((col) => {
                    const style = getKegiatanPrintStyle(col.jenisKegiatan, col.efektif);
                    return (
                      <th
                        key={`preview-week-${col.key}`}
                        className={`border border-slate-900 py-1 px-0.5 text-center w-6 font-bold ${
                          !col.efektif ? style.bg : "bg-slate-50"
                        }`}
                        title={`${col.bulan} M-${col.mingguKe} (${col.rentangTanggal}): ${
                          col.efektif ? "Minggu Efektif" : col.kegiatanPemotong.join(", ")
                        }`}
                      >
                        {col.mingguKe}
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* BODY BARIS TP */}
              <tbody className="divide-y divide-slate-400">
                {items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4 + kolomMinggu.length}
                      className="border border-slate-900 py-6 text-center text-slate-500 italic"
                    >
                      Belum ada data Tujuan Pembelajaran (TP) pada semester ini. Silakan atur
                      alur Prota terlebih dahulu.
                    </td>
                  </tr>
                ) : (
                  items.map((tp, idx) => {
                    const sumBaris = Object.values(tp.distribusi_minggu || {}).reduce(
                      (acc, v) => acc + Number(v || 0),
                      0
                    );
                    const targetJp = Number(tp.alokasi_jp || 0);

                    return (
                      <tr key={`preview-row-${idx}-${tp.kode_tp}`} className="align-middle">
                        {/* Nomor */}
                        <td className="border border-slate-900 py-1 px-1 text-center font-bold">
                          {idx + 1}
                        </td>

                        {/* TP & Materi */}
                        <td className="border border-slate-900 py-1 px-2 leading-tight">
                          <div className="font-bold text-slate-900">
                            [{tp.kode_tp}] {tp.materi_pokok}
                          </div>
                          <div className="text-[9.5px] text-slate-700 leading-snug mt-0.5">
                            {tp.tujuan_pembelajaran_teks}
                          </div>
                        </td>

                        {/* Target JP */}
                        <td className="border border-slate-900 py-1 px-1 text-center font-bold">
                          {targetJp}
                        </td>

                        {/* Total Terisi */}
                        <td className="border border-slate-900 py-1 px-1 text-center font-black">
                          {sumBaris}
                        </td>

                        {/* Sel-Sel Matriks Mingguan */}
                        {kolomMinggu.map((col) => {
                          const val = tp.distribusi_minggu?.[col.key];
                          const style = getKegiatanPrintStyle(col.jenisKegiatan, col.efektif);

                          if (!col.efektif) {
                            return (
                              <td
                                key={`cell-prv-${tp.kode_tp}-${col.key}`}
                                className={`border border-slate-900 py-1 px-0.5 text-center ${style.bg}`}
                                title={`${col.bulan} M-${col.mingguKe}: ${col.kegiatanPemotong.join(", ")}`}
                              >
                                <span className="text-[9px] text-slate-400 font-mono">&times;</span>
                              </td>
                            );
                          }

                          const hasVal = Number(val) > 0;
                          return (
                            <td
                              key={`cell-prv-${tp.kode_tp}-${col.key}`}
                              className={`border border-slate-900 py-1 px-0.5 text-center font-black ${
                                hasVal ? "bg-slate-100/60 text-slate-900" : "text-slate-400"
                              }`}
                            >
                              {hasVal ? val : "-"}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}

                {/* ========================================================================= */}
                {/* FOOTER BARIS MATRIKS: TOTAL JP PER MINGGU */}
                {/* ========================================================================= */}
                <tr className="bg-slate-200/90 font-black text-slate-900 border-t-2 border-slate-900">
                  <td
                    colSpan={2}
                    className="border border-slate-900 py-1.5 px-2 text-right uppercase tracking-wider"
                  >
                    Jumlah JP per Minggu:
                  </td>
                  <td className="border border-slate-900 py-1.5 px-1 text-center">
                    {items.reduce((s, it) => s + Number(it.alokasi_jp || 0), 0)}
                  </td>
                  <td className="border border-slate-900 py-1.5 px-1 text-center font-black">
                    {grandTotalSemester}
                  </td>

                  {/* Total per Kolom Minggu */}
                  {kolomMinggu.map((col) => {
                    const totalCol = sumPerKolom[col.key] || 0;
                    const style = getKegiatanPrintStyle(col.jenisKegiatan, col.efektif);

                    if (!col.efektif) {
                      return (
                        <td
                          key={`f-col-${col.key}`}
                          className={`border border-slate-900 py-1 px-0.5 text-center ${style.bg}`}
                        >
                          -
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`f-col-${col.key}`}
                        className="border border-slate-900 py-1 px-0.5 text-center font-black bg-slate-100"
                      >
                        {totalCol > 0 ? totalCol : "-"}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* ========================================================================= */}
          {/* LEGENDA KALENDER PENDIDIKAN & KETERANGAN WARNA */}
          {/* ========================================================================= */}
          <div className="my-4 p-3 border border-slate-300 rounded bg-slate-50 text-[10px] space-y-2 break-inside-avoid">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 uppercase">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              <span>Keterangan Arsiran Matriks Kalender Pendidikan:</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 border border-rose-400 bg-rose-100 shrink-0 inline-block text-center text-[9px] font-mono text-rose-900">&times;</span>
                <span className="text-slate-700">Libur Semester/Nasional</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 border border-purple-400 bg-purple-100 shrink-0 inline-block text-center text-[9px] font-mono text-purple-900">&times;</span>
                <span className="text-slate-700">Asesmen / Sumatif</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 border border-blue-400 bg-blue-100 shrink-0 inline-block text-center text-[9px] font-mono text-blue-900">&times;</span>
                <span className="text-slate-700">MATSAMA / Orientasi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 border border-emerald-400 bg-emerald-100 shrink-0 inline-block text-center text-[9px] font-mono text-emerald-900">&times;</span>
                <span className="text-slate-700">Ramadan / Idul Fitri</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 border border-amber-400 bg-amber-100 shrink-0 inline-block text-center text-[9px] font-mono text-amber-900">&times;</span>
                <span className="text-slate-700">Kegiatan Madrasah</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 border border-slate-400 bg-white shrink-0 inline-block text-center text-[9px] font-bold text-slate-900">JP</span>
                <span className="text-slate-700">Minggu Efektif KBM</span>
              </div>
            </div>

            {/* Rincian kegiatan di semester ini */}
            {kegiatanNonEfektifList.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <span className="font-semibold text-slate-800">Kegiatan Non-Efektif Terjadwal: </span>
                <span className="text-slate-600">
                  {kegiatanNonEfektifList.map((k, i) => (
                    <span key={`keg-${i}`}>
                      {k.nama} ({k.rentang})
                      {i < kegiatanNonEfektifList.length - 1 ? " • " : ""}
                    </span>
                  ))}
                </span>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* LEMBAR PENGESAHAN TANDA TANGAN */}
          {/* ========================================================================= */}
          <div className="mt-8 pt-2 break-inside-avoid text-xs text-slate-900">
            <div className="flex justify-between items-start">
              {/* Tanda Tangan Kepala Madrasah */}
              <div className="text-center w-72 space-y-1">
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala {madrasah.nama}</p>
                <div className="h-20" /> {/* Ruang tanda tangan */}
                <p className="font-bold underline decoration-slate-900 underline-offset-2">
                  {madrasah.kepala_nama || "..................................................."}
                </p>
                <p className="text-[11px] text-slate-600">
                  NIP. {madrasah.kepala_nip || "......................................."}
                </p>
              </div>

              {/* Tanda Tangan Guru Mata Pelajaran */}
              <div className="text-center w-72 space-y-1">
                <p>
                  {madrasah.kabupaten || "Tasikmalaya"},{" "}
                  {formatTitimangsa(penugasan.tahun_ajaran.tanggal_penetapan_dokumen)}
                </p>
                <p className="font-bold">Guru Mata Pelajaran,</p>
                <div className="h-20" /> {/* Ruang tanda tangan */}
                <p className="font-bold underline decoration-slate-900 underline-offset-2">
                  {penugasan.guru.nama_lengkap}
                  {penugasan.guru.gelar ? `, ${penugasan.guru.gelar}` : ""}
                </p>
                <p className="text-[11px] text-slate-600">
                  NIP. {penugasan.guru.nip || "......................................."}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Dokumen Bank Data */}
          <div className="pt-6 border-t border-slate-200 mt-8 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 italic">
            <span>{madrasah.nama} • Program Semester (Prosem) Fase D</span>
            <span>Sumber CP: KMA 1503/2025 · Bank data 2026-2027-v1</span>
          </div>
        </div>

        {/* Riwayat Validasi & Status Timeline (Hanya di layar) */}
        <div className="print:hidden">
          {prosem.id && <StatusTimeline dokumenTipe="prosem" dokumenId={prosem.id} />}
        </div>
      </div>
    </>
  );
}
