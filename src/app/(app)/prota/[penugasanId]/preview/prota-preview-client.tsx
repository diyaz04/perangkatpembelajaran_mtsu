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
  Download,
  Send,
  RefreshCw,
} from "lucide-react";
import type { ProtaDetailData } from "../../actions";
import { submitDokumenAction, createRevisiCopyAction } from "@/lib/validasi/actions";
import { StatusTimeline } from "@/components/validasi/status-timeline";
import { Switch } from "@/components/ui/switch";
import { KopMadrasah } from "@/components/kop-madrasah";

interface ProtaPreviewClientProps {
  data: ProtaDetailData;
}

export function ProtaPreviewClient({ data }: ProtaPreviewClientProps) {
  const router = useRouter();
  const { penugasan, madrasah, prota, items } = data;
  const mingguEfektif = prota.snapshot_minggu_efektif || data.mingguEfektifKini;
  const [currentStatus, setCurrentStatus] = useState<string>(prota.status);
  const [showKop, setShowKop] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleAjukan = async () => {
    if (!prota.id) return;
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await submitDokumenAction("prota", prota.id);
      if (res.success) {
        setCurrentStatus("diajukan");
        setMsg({ type: "success", text: "Prota berhasil diajukan untuk validasi." });
        router.refresh();
      } else {
        setMsg({ type: "error", text: res.error || "Gagal mengajukan Prota." });
      }
    } catch {
      setMsg({ type: "error", text: "Terjadi kesalahan sistem saat mengajukan." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuatRevisi = async () => {
    if (!prota.id) return;
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await createRevisiCopyAction("prota", prota.id);
      if (res.success) {
        setCurrentStatus("draf");
        router.push(`/prota/${penugasan.id}`);
      } else {
        setMsg({ type: "error", text: res.error || "Gagal membuat revisi Prota." });
      }
    } catch {
      setMsg({ type: "error", text: "Terjadi kesalahan sistem saat membuat revisi." });
    } finally {
      setActionLoading(false);
    }
  };

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

  const totalJpTerdistribusi = items.reduce(
    (sum, it) => sum + Number(it.alokasi_jp || 0),
    0
  );

  return (
    <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Action Bar (Hanya tampil di layar, disembunyikan saat print) */}
      <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href={`/prota/${penugasan.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali ke Editor Prota
          </Link>
          <div>{getStatusBadge(currentStatus)}</div>
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
              id="toggle-kop-prota"
              checked={showKop}
              onCheckedChange={setShowKop}
            />
            <label
              htmlFor="toggle-kop-prota"
              className="text-xs font-semibold cursor-pointer text-slate-700 select-none"
            >
              {showKop ? "KOP: Aktif" : "KOP: Nonaktif"}
            </label>
          </div>

          <a
            href={`/api/export/prota/${penugasan.id}?format=docx&kop=${showKop}`}
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
            Cetak / Simpan PDF
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

      {/* Kontainer Dokumen Siap Cetak (A4 Styling) */}
      <div className="relative bg-white p-8 md:p-12 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 text-slate-900 font-sans">
        {currentStatus !== "disetujui" && (
          <div className="watermark-draf-print pointer-events-none select-none">
            DRAF
          </div>
        )}
        {/* KOP MADRASAH RESMI */}
        {showKop && <KopMadrasah madrasah={madrasah} />}

        {/* JUDUL DOKUMEN */}
        <div className="text-center my-6 space-y-1">
          <h2 className="text-base md:text-lg font-black uppercase tracking-wider text-slate-900 underline decoration-slate-900 underline-offset-4">
            PROGRAM TAHUNAN (PROTA)
          </h2>
          <p className="text-xs md:text-sm font-bold uppercase tracking-wide text-slate-700">
            TAHUN PELAJARAN {penugasan.tahun_ajaran.nama}
          </p>
          <p className="text-[11px] font-medium text-emerald-800 tracking-wide">
            Kurikulum Berbasis Cinta (KBC) • Sesuai KMA 1503 Tahun 2025
          </p>
        </div>

        {/* IDENTITAS DOKUMEN */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-xs text-slate-800 my-6 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/80">
          <div className="flex">
            <span className="w-36 font-semibold">Satuan Pendidikan</span>
            <span className="w-3">:</span>
            <span className="font-bold">{madrasah.nama}</span>
          </div>
          <div className="flex">
            <span className="w-36 font-semibold">Fase / Kelas</span>
            <span className="w-3">:</span>
            <span>
              Fase D / Kelas {penugasan.tingkat_kelas} ({penugasan.rombel})
            </span>
          </div>
          <div className="flex">
            <span className="w-36 font-semibold">Mata Pelajaran</span>
            <span className="w-3">:</span>
            <span className="font-bold">{penugasan.mapel.nama}</span>
          </div>
          <div className="flex">
            <span className="w-36 font-semibold">Alokasi Waktu</span>
            <span className="w-3">:</span>
            <span>{penugasan.mapel.jp_per_minggu} JP / Minggu</span>
          </div>
          <div className="flex">
            <span className="w-36 font-semibold">Guru Pengampu</span>
            <span className="w-3">:</span>
            <span>{penugasan.guru.nama_lengkap}</span>
          </div>
          <div className="flex">
            <span className="w-36 font-semibold">Tahun Pelajaran</span>
            <span className="w-3">:</span>
            <span>{penugasan.tahun_ajaran.nama}</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* I. ANALISIS ALOKASI WAKTU & MINGGU EFEKTIF */}
        {/* ========================================================================= */}
        <div className="space-y-3 my-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-l-3 border-emerald-700 pl-2">
            I. Analisis Alokasi Waktu dan Minggu Efektif
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-900 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold text-center border-b border-slate-900">
                  <th className="border border-slate-900 py-2 px-2 w-10">No</th>
                  <th className="border border-slate-900 py-2 px-3 text-left">Bulan</th>
                  <th className="border border-slate-900 py-2 px-2 w-24">Jumlah Minggu</th>
                  <th className="border border-slate-900 py-2 px-2 w-24">Minggu Efektif</th>
                  <th className="border border-slate-900 py-2 px-2 w-24">Tidak Efektif</th>
                  <th className="border border-slate-900 py-2 px-3 text-left">Keterangan Kegiatan</th>
                </tr>
              </thead>
              <tbody>
                {/* Semester 1 */}
                <tr className="bg-slate-50 font-bold text-[11px]">
                  <td colSpan={6} className="border border-slate-900 py-1.5 px-3 uppercase tracking-wider">
                    Semester 1 (Ganjil)
                  </td>
                </tr>
                {mingguEfektif.semester1.daftarBulan.map((b, idx) => (
                  <tr key={`prev-smt1-${b.bulan}`} className="border-b border-slate-300">
                    <td className="border border-slate-900 py-1.5 px-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-900 py-1.5 px-3 font-medium">{b.bulan}</td>
                    <td className="border border-slate-900 py-1.5 px-2 text-center">{b.jumlahMinggu}</td>
                    <td className="border border-slate-900 py-1.5 px-2 text-center font-bold">
                      {b.mingguEfektif}
                    </td>
                    <td className="border border-slate-900 py-1.5 px-2 text-center">{b.mingguTidakEfektif}</td>
                    <td className="border border-slate-900 py-1.5 px-3 text-[11px] text-slate-700">
                      {b.keterangan || "-"}
                    </td>
                  </tr>
                ))}
                {/* Subtotal Smt 1 */}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={2} className="border border-slate-900 py-1.5 px-3 text-right">
                    Jumlah Semester 1:
                  </td>
                  <td className="border border-slate-900 py-1.5 px-2 text-center">
                    {mingguEfektif.semester1.totalMinggu}
                  </td>
                  <td className="border border-slate-900 py-1.5 px-2 text-center">
                    {mingguEfektif.semester1.totalMingguEfektif}
                  </td>
                  <td className="border border-slate-900 py-1.5 px-2 text-center">
                    {mingguEfektif.semester1.totalMingguTidakEfektif}
                  </td>
                  <td className="border border-slate-900 py-1.5 px-3 text-[11px]">
                    Jam Efektif Smt 1: {mingguEfektif.semester1.jpEfektif} JP
                  </td>
                </tr>

                {/* Semester 2 */}
                <tr className="bg-slate-50 font-bold text-[11px]">
                  <td colSpan={6} className="border border-slate-900 py-1.5 px-3 uppercase tracking-wider">
                    Semester 2 (Genap)
                  </td>
                </tr>
                {mingguEfektif.semester2.daftarBulan.map((b, idx) => (
                  <tr key={`prev-smt2-${b.bulan}`} className="border-b border-slate-300">
                    <td className="border border-slate-900 py-1.5 px-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-900 py-1.5 px-3 font-medium">{b.bulan}</td>
                    <td className="border border-slate-900 py-1.5 px-2 text-center">{b.jumlahMinggu}</td>
                    <td className="border border-slate-900 py-1.5 px-2 text-center font-bold">
                      {b.mingguEfektif}
                    </td>
                    <td className="border border-slate-900 py-1.5 px-2 text-center">{b.mingguTidakEfektif}</td>
                    <td className="border border-slate-900 py-1.5 px-3 text-[11px] text-slate-700">
                      {b.keterangan || "-"}
                    </td>
                  </tr>
                ))}
                {/* Subtotal Smt 2 */}
                <tr className="bg-slate-100 font-bold">
                  <td colSpan={2} className="border border-slate-900 py-1.5 px-3 text-right">
                    Jumlah Semester 2:
                  </td>
                  <td className="border border-slate-900 py-1.5 px-2 text-center">
                    {mingguEfektif.semester2.totalMinggu}
                  </td>
                  <td className="border border-slate-900 py-1.5 px-2 text-center">
                    {mingguEfektif.semester2.totalMingguEfektif}
                  </td>
                  <td className="border border-slate-900 py-1.5 px-2 text-center">
                    {mingguEfektif.semester2.totalMingguTidakEfektif}
                  </td>
                  <td className="border border-slate-900 py-1.5 px-3 text-[11px]">
                    Jam Efektif Smt 2: {mingguEfektif.semester2.jpEfektif} JP
                  </td>
                </tr>

                {/* Grand Total 1 Tahun */}
                <tr className="bg-slate-200 font-extrabold text-slate-950">
                  <td colSpan={2} className="border border-slate-900 py-2 px-3 text-right uppercase tracking-wider">
                    Total 1 Tahun Pelajaran:
                  </td>
                  <td className="border border-slate-900 py-2 px-2 text-center">
                    {mingguEfektif.totalTahun.totalMinggu}
                  </td>
                  <td className="border border-slate-900 py-2 px-2 text-center">
                    {mingguEfektif.totalTahun.totalMingguEfektif}
                  </td>
                  <td className="border border-slate-900 py-2 px-2 text-center">
                    {mingguEfektif.totalTahun.totalMingguTidakEfektif}
                  </td>
                  <td className="border border-slate-900 py-2 px-3 text-xs">
                    Total Jam Efektif: {mingguEfektif.totalTahun.jpEfektif} JP
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* II. DISTRIBUSI ALOKASI WAKTU PROGRAM TAHUNAN */}
        {/* ========================================================================= */}
        <div className="space-y-3 my-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-l-3 border-emerald-700 pl-2">
            II. Distribusi Alokasi Waktu Pembelajaran
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-900 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold text-center border-b border-slate-900">
                  <th className="border border-slate-900 py-2 px-2 w-10">No</th>
                  <th className="border border-slate-900 py-2 px-2 w-16">Smt</th>
                  <th className="border border-slate-900 py-2 px-2 w-20">Kode</th>
                  <th className="border border-slate-900 py-2 px-3 text-left min-w-[200px]">
                    Alur Tujuan Pembelajaran (TP)
                  </th>
                  <th className="border border-slate-900 py-2 px-3 text-left min-w-[140px]">
                    Materi Pokok
                  </th>
                  <th className="border border-slate-900 py-2 px-2.5 text-left w-32">
                    Topik Panca Cinta
                  </th>
                  <th className="border border-slate-900 py-2 px-2 w-16">Alokasi (JP)</th>
                  <th className="border border-slate-900 py-2 px-3 text-left min-w-[100px]">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border border-slate-900 py-4 text-center text-slate-500 italic">
                      Belum ada data distribusi alokasi waktu.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={`dist-${idx}-${item.kode_tp}`} className="border-b border-slate-300">
                      <td className="border border-slate-900 py-1.5 px-2 text-center">{idx + 1}</td>
                      <td className="border border-slate-900 py-1.5 px-2 text-center font-semibold">
                        {item.semester}
                      </td>
                      <td className="border border-slate-900 py-1.5 px-2 text-center font-bold">
                        {item.kode_tp}
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3 leading-relaxed">
                        {item.tujuan_pembelajaran_teks}
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3 font-medium">
                        {item.materi_pokok}
                      </td>
                      <td className="border border-slate-900 py-1.5 px-2.5 text-[11px]">
                        {item.panca_cinta_nama}
                      </td>
                      <td className="border border-slate-900 py-1.5 px-2 text-center font-bold">
                        {item.alokasi_jp}
                      </td>
                      <td className="border border-slate-900 py-1.5 px-3 text-[11px] text-slate-600">
                        {item.keterangan || "-"}
                      </td>
                    </tr>
                  ))
                )}
                {/* Total JP Terdistribusi */}
                <tr className="bg-slate-100 font-extrabold text-slate-900 border-t border-slate-900">
                  <td colSpan={6} className="border border-slate-900 py-2 px-3 text-right uppercase tracking-wider">
                    Total Jam Pelajaran Terdistribusi:
                  </td>
                  <td className="border border-slate-900 py-2 px-2 text-center font-black text-sm">
                    {totalJpTerdistribusi}
                  </td>
                  <td className="border border-slate-900 py-2 px-3 text-[11px] text-slate-600">
                    JP Efektif Tersedia: {mingguEfektif.totalTahun.jpEfektif} JP
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LEMBAR PENGESAHAN TANDA TANGAN */}
        {/* ========================================================================= */}
        <div className="mt-12 pt-4 break-inside-avoid text-xs text-slate-900">
          <div className="flex justify-between items-start">
            {/* Tanda Tangan Kepala Madrasah */}
            <div className="text-center w-64 space-y-1">
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
            <div className="text-center w-64 space-y-1">
              <p>
                {madrasah.kabupaten || "Tasikmalaya"},{" "}
                {new Date().toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
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

          {/* Footer Dokumen Bank Data */}
          <div className="pt-6 border-t border-slate-200 mt-8 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 italic">
            <span>{madrasah.nama} • Program Tahunan (Prota) Fase D</span>
            <span>Sumber CP: KMA 1503/2025 · Bank data 2026-2027-v1</span>
          </div>
        </div>
      </div>

      {/* Riwayat Validasi & Status Timeline (Hanya di layar) */}
      <div className="print:hidden">
        {prota.id && <StatusTimeline dokumenTipe="prota" dokumenId={prota.id} />}
      </div>
    </div>
  );
}
