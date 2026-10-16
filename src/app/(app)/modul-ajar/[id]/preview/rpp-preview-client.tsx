"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Download,
  Send,
  RefreshCw,
} from "lucide-react";
import type { RppDetailData } from "../../actions";
import { submitDokumenAction, createRevisiCopyAction } from "@/lib/validasi/actions";
import { StatusTimeline } from "@/components/validasi/status-timeline";
import { Switch } from "@/components/ui/switch";
import { KopMadrasah } from "@/components/kop-madrasah";
import {
  getModelPedagogiSpec,
  parseLangkahDeskripsi,
} from "@/lib/rpp-model-pedagogi";

interface RppPreviewClientProps {
  data: RppDetailData;
}

export function RppPreviewClient({ data }: RppPreviewClientProps) {
  const router = useRouter();
  const { rpp, langkahList, penugasan, madrasah, master } = data;
  const isLengkap = rpp.versi === "lengkap";
  const [currentStatus, setCurrentStatus] = useState<string>(rpp.status);
  const [showKop, setShowKop] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleAjukan = async () => {
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await submitDokumenAction("rpp", rpp.id);
      if (res.success) {
        setCurrentStatus("diajukan");
        setMsg({ type: "success", text: "RPP berhasil diajukan untuk validasi." });
        router.refresh();
      } else {
        setMsg({ type: "error", text: res.error || "Gagal mengajukan RPP." });
      }
    } catch {
      setMsg({ type: "error", text: "Terjadi kesalahan sistem saat mengajukan." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuatRevisi = async () => {
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await createRevisiCopyAction("rpp", rpp.id);
      if (res.success && res.newId) {
        router.push(`/modul-ajar/${res.newId}`);
      } else {
        setMsg({ type: "error", text: res.error || "Gagal membuat revisi RPP." });
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

  // Nama DPL terpilih
  const selectedDplNames = master.dpl
    .filter((d) => rpp.dimensi_profil_lulusan_ids.includes(d.id))
    .map((d) => `[${d.kode}] ${d.nama}`);

  // Nama Panca Cinta terpilih
  const selectedPcNames = master.pancaCinta
    .filter((p) => rpp.panca_cinta_ids.includes(p.id))
    .map((p) => `[${p.kode}] ${p.nama}`);

  // Model terpilih
  const selectedModel = master.models.find((m) => m.id === rpp.model_id);

  // Group langkah per pertemuan
  const pertemuanList = Array.from({ length: rpp.jumlah_pertemuan || 1 }).map(
    (_, i) => i + 1
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: portrait;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
          .print-doc-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}} />

      <div className="flex-1 p-3 md:p-8 max-w-5xl mx-auto space-y-4">
        {/* Action Bar (Layar Saja) */}
        <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href={`/modul-ajar/${rpp.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Kembali ke Wizard Editor
            </Link>
            <div>{getStatusBadge(currentStatus)}</div>
            <Badge
              variant="outline"
              className={
                isLengkap
                  ? "bg-purple-50 text-purple-800 border-purple-200 font-bold"
                  : "bg-slate-50 text-slate-700"
              }
            >
              {isLengkap ? "Versi Lengkap [L]" : "Versi Minimum"}
            </Badge>
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
                id="toggle-kop-rpp"
                checked={showKop}
                onCheckedChange={setShowKop}
              />
              <label
                htmlFor="toggle-kop-rpp"
                className="text-xs font-semibold cursor-pointer text-slate-700 select-none"
              >
                {showKop ? "KOP: Aktif" : "KOP: Nonaktif"}
              </label>
            </div>

            <a
              href={`/api/export/rpp/${rpp.id}?format=docx&kop=${showKop}`}
              className={buttonVariants({ variant: "outline", size: "sm" }) + " flex-1 sm:flex-none border-slate-300 hover:bg-slate-50 text-slate-800 font-medium"}
              download
            >
              <Download className="w-4 h-4 mr-2 text-emerald-700" />
              Unduh DOCX
            </a>
            <Button
              onClick={handlePrint}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-sm flex-1 sm:flex-none"
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

        {/* Catatan Revisi Alert */}
        {currentStatus === "revisi" && rpp.catatan_validator && (
          <div className="print:hidden p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-rose-900">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Catatan Revisi dari Validator:</span>
            </div>
            <p className="whitespace-pre-wrap pl-5">{rpp.catatan_validator}</p>
          </div>
        )}

        {/* Kontainer Dokumen Siap Cetak (A4 Styling) */}
        <div className="relative print-doc-container bg-white p-6 md:p-10 rounded-xl border border-slate-200 shadow-sm text-slate-900 font-sans">
          {currentStatus !== "disetujui" && (
            <div className="watermark-draf-print pointer-events-none select-none">
              DRAF
            </div>
          )}
          {/* KOP MADRASAH RESMI */}
          {showKop && <KopMadrasah madrasah={madrasah} />}

          {/* JUDUL DOKUMEN */}
          <div className="text-center my-4 space-y-0.5">
            <h2 className="text-sm md:text-base font-black uppercase tracking-wider text-slate-900 underline decoration-slate-900 underline-offset-4">
              MODUL AJAR / RENCANA PELAKSANAAN PEMBELAJARAN (RPP)
            </h2>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-800">
              PEMBELAJARAN MENDALAM TERINTEGRASI KURIKULUM BERBASIS CINTA (KBC)
            </p>
            <p className="text-[10px] font-semibold text-emerald-800 tracking-wide">
              Standar Regulasi KMA 1503 Tahun 2025 • Tabel 3.5 & 3.6 Panduan Kemenag
            </p>
          </div>

          {/* ========================================================================= */}
          {/* TABEL FORMAT 2 KOLOM RESMI */}
          {/* ========================================================================= */}
          <div className="my-4 border border-slate-900 text-xs">
            {/* A. SPESIFIKASI DOKUMEN */}
            <div className="bg-slate-200/90 font-black px-3 py-1.5 border-b border-slate-900 uppercase tracking-wide">
              A. SPESIFIKASI DOKUMEN
            </div>
            <table className="w-full border-collapse">
              <tbody className="divide-y divide-slate-300">
                <tr>
                  <td className="w-1/3 py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                    Satuan Pendidikan
                  </td>
                  <td className="py-1.5 px-3 font-bold text-slate-900">
                    {madrasah.nama}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                    Mata Pelajaran & Kode
                  </td>
                  <td className="py-1.5 px-3 font-bold text-slate-900">
                    {penugasan.mapel.nama} ({penugasan.mapel.kode})
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                    Fase / Kelas / Rombel
                  </td>
                  <td className="py-1.5 px-3 text-slate-900">
                    Fase D • Kelas {penugasan.tingkat_kelas} ({penugasan.rombel})
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                    Lingkup Materi Pokok
                  </td>
                  <td className="py-1.5 px-3 font-black text-slate-900">
                    {rpp.materi_pokok}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                    Alokasi Waktu
                  </td>
                  <td className="py-1.5 px-3 text-slate-900">
                    {rpp.alokasi_waktu}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                    Guru Pengampu
                  </td>
                  <td className="py-1.5 px-3 text-slate-900">
                    {penugasan.guru.nama_lengkap}
                    {penugasan.guru.gelar ? `, ${penugasan.guru.gelar}` : ""}{" "}
                    {penugasan.guru.nip ? `(NIP. ${penugasan.guru.nip})` : ""}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* B. IDENTIFIKASI */}
            <div className="bg-slate-200/90 font-black px-3 py-1.5 border-t border-b border-slate-900 uppercase tracking-wide">
              B. IDENTIFIKASI
            </div>
            <table className="w-full border-collapse">
              <tbody className="divide-y divide-slate-300">
                {isLengkap && (
                  <tr>
                    <td className="w-1/3 py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                      Kesiapan & Karakteristik Murid [L]
                    </td>
                    <td className="py-1.5 px-3 text-slate-900 leading-relaxed space-y-1">
                      <div>
                        <strong>Pengetahuan Awal:</strong>{" "}
                        {rpp.kesiapan_murid?.pengetahuan_awal || "-"}
                      </div>
                      {rpp.kesiapan_murid?.minat && (
                        <div>
                          <strong>Minat & Kebutuhan:</strong>{" "}
                          {rpp.kesiapan_murid.minat}
                        </div>
                      )}
                      {rpp.kesiapan_murid?.strategi_asesmen_awal && (
                        <div>
                          <strong>Strategi Awal & Tindak Lanjut:</strong>{" "}
                          {rpp.kesiapan_murid.strategi_asesmen_awal}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="w-1/3 py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                    Karakteristik Materi
                  </td>
                  <td className="py-1.5 px-3 text-slate-900 leading-relaxed">
                    {rpp.karakteristik_materi || "-"}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                    Dimensi Profil Lulusan (DPL)
                  </td>
                  <td className="py-1.5 px-3 text-slate-900">
                    {selectedDplNames.length > 0
                      ? selectedDplNames.join("; ")
                      : "-"}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                    Topik Panca Cinta KBC
                  </td>
                  <td className="py-1.5 px-3 font-bold text-rose-900">
                    {selectedPcNames.length > 0
                      ? selectedPcNames.join("; ")
                      : "-"}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                    Benang Merah Nilai Cinta (KBC)
                  </td>
                  <td className="py-1.5 px-3 text-slate-900 leading-relaxed">
                    {rpp.benang_merah_kbc || "-"}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* C. DESAIN PEMBELAJARAN */}
            <div className="bg-slate-200/90 font-black px-3 py-1.5 border-t border-b border-slate-900 uppercase tracking-wide">
              C. DESAIN PEMBELAJARAN
            </div>
            <table className="w-full border-collapse">
              <tbody className="divide-y divide-slate-300">
                {isLengkap && master.capaianPembelajaran && (
                  <tr>
                    <td className="w-1/3 py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                      Capaian Pembelajaran (CP) [L]
                    </td>
                    <td className="py-1.5 px-3 text-slate-900 leading-relaxed">
                      <strong>Elemen: {master.capaianPembelajaran.elemen}</strong> —{" "}
                      {master.capaianPembelajaran.deskripsi_cp}
                    </td>
                  </tr>
                )}
                {isLengkap && rpp.topik_pembelajaran && (
                  <tr>
                    <td className="w-1/3 py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                      Topik Pembelajaran [L]
                    </td>
                    <td className="py-1.5 px-3 font-bold text-slate-900">
                      {rpp.topik_pembelajaran}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="w-1/3 py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                    Tujuan Pembelajaran (TP)
                  </td>
                  <td className="py-1.5 px-3 text-slate-900 leading-relaxed whitespace-pre-line">
                    {rpp.tujuan_pembelajaran_teks}
                  </td>
                </tr>
                {isLengkap && rpp.lintas_disiplin_ilmu && (
                  <tr>
                    <td className="w-1/3 py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                      Lintas Disiplin Ilmu [L]
                    </td>
                    <td className="py-1.5 px-3 text-slate-900">
                      {rpp.lintas_disiplin_ilmu}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                    Model & Metode Pembelajaran
                  </td>
                  <td className="py-1.5 px-3 text-slate-900">
                    <strong>Model:</strong> {selectedModel?.nama || "Pembelajaran Mendalam"}{" "}
                    • <strong>Metode:</strong>{" "}
                    {(rpp.metode_pembelajaran || []).join(", ") || "-"}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                    Lingkungan & Budaya Belajar
                  </td>
                  <td className="py-1.5 px-3 text-slate-900">
                    <strong>Fisik:</strong> {rpp.lingkungan_belajar_fisik || "-"} •{" "}
                    <strong>Budaya:</strong> {rpp.budaya_belajar || "-"}
                    {isLengkap && rpp.kemitraan_pembelajaran && (
                      <> • <strong>Kemitraan:</strong> {rpp.kemitraan_pembelajaran}</>
                    )}
                    {isLengkap && rpp.pemanfaatan_digital && (
                      <> • <strong>Digital:</strong> {rpp.pemanfaatan_digital}</>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* D. PENGALAMAN BELAJAR PER PERTEMUAN */}
            {(() => {
              const activeSpec = getModelPedagogiSpec(selectedModel?.nama);
              return (
                <>
                  <div className="bg-slate-200/90 font-black px-3 py-1.5 border-t border-b border-slate-900 uppercase tracking-wide flex flex-wrap items-center justify-between gap-2">
                    <span>D. PENGALAMAN BELAJAR ({activeSpec.nama_resmi.toUpperCase()})</span>
                    <span className="text-[10px] font-bold text-emerald-900 normal-case">
                      {activeSpec.format_pengalaman_label}
                    </span>
                  </div>

                  {/* Ringkasan Struktur 3M Model pada Dokumen Cetak */}
                  <div className="grid grid-cols-3 border-b border-slate-400 bg-slate-50/70 text-[10.5px] divide-x divide-slate-300">
                    <div className="p-2">
                      <div className="font-bold text-slate-900">
                        1. {activeSpec.struktur_3m.memahami.judul_fase}
                      </div>
                      <div className="text-slate-600 leading-snug">
                        {activeSpec.struktur_3m.memahami.deskripsi_fase}
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="font-bold text-slate-900">
                        2. {activeSpec.struktur_3m.mengaplikasi.judul_fase}
                      </div>
                      <div className="text-slate-600 leading-snug">
                        {activeSpec.struktur_3m.mengaplikasi.deskripsi_fase}
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="font-bold text-slate-900">
                        3. {activeSpec.struktur_3m.merefleksi.judul_fase}
                      </div>
                      <div className="text-slate-600 leading-snug">
                        {activeSpec.struktur_3m.merefleksi.deskripsi_fase}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            {pertemuanList.map((pNum) => {
              const pLangkah = langkahList.filter((l) => l.pertemuan_ke === pNum);
              return (
                <div key={`prev-p-${pNum}`} className="border-b border-slate-900 last:border-b-0">
                  <div className="bg-slate-100 font-bold px-3 py-1 text-slate-800 text-[11px] flex items-center justify-between">
                    <span>
                      PERTEMUAN KE-{pNum} — MODEL:{" "}
                      {(selectedModel?.nama || "Pembelajaran Mendalam").toUpperCase()}
                    </span>
                    <span>
                      Total Durasi:{" "}
                      {pLangkah.reduce((s, l) => s + Number(l.durasi_menit || 0), 0)} menit
                    </span>
                  </div>

                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-400 font-bold text-slate-800">
                        <th className="py-1 px-1.5 text-center w-8 border-r border-slate-300">
                          No
                        </th>
                        <th className="py-1 px-2 text-left border-r border-slate-300">
                          Sintaks Model & Rincian Pengalaman Pembelajaran (Guru & Murid)
                        </th>
                        <th className="py-1 px-2 text-center w-24 border-r border-slate-300">
                          Pengalaman Belajar (3M)
                        </th>
                        <th className="py-1 px-2 text-center w-28 border-r border-slate-300">
                          Prinsip & Nilai Cinta
                        </th>
                        <th className="py-1 px-1.5 text-center w-14">Durasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {pLangkah.map((l, idx) => {
                        const pcObj = master.pancaCinta.find(
                          (p) => p.id === l.panca_cinta_id
                        );
                        const parsed = parseLangkahDeskripsi(l.deskripsi_kegiatan);

                        return (
                          <tr key={`p-${pNum}-l-${idx}`}>
                            <td className="py-1.5 px-1.5 text-center font-bold border-r border-slate-300 align-top">
                              {idx + 1}
                            </td>
                            <td className="py-1.5 px-2 border-r border-slate-300 align-top leading-relaxed space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-bold uppercase text-[10px] text-emerald-800">
                                  [{l.tahap.toUpperCase()}]
                                </span>
                                {parsed.sintaksHeader && (
                                  <span className="font-bold text-[10.5px] text-slate-900 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                    {parsed.sintaksHeader}
                                  </span>
                                )}
                              </div>

                              {parsed.aktivitasGuru || parsed.aktivitasMurid ? (
                                <div className="space-y-1 text-[11px]">
                                  {parsed.aktivitasGuru && (
                                    <div>
                                      <strong className="text-slate-800">
                                        • Aktivitas Guru:{" "}
                                      </strong>
                                      <span>{parsed.aktivitasGuru}</span>
                                    </div>
                                  )}
                                  {parsed.aktivitasMurid && (
                                    <div>
                                      <strong className="text-emerald-950">
                                        • Aktivitas Murid:{" "}
                                      </strong>
                                      <span>{parsed.aktivitasMurid}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="whitespace-pre-line">
                                  {parsed.isiUtama}
                                </div>
                              )}

                              {l.aksi_kbc && (
                                <div className="text-[10px] text-rose-800 italic pt-0.5">
                                  ❤️ Aksi Cinta Guru ({pcObj?.nama || "KBC"}):{" "}
                                  {l.aksi_kbc}
                                </div>
                              )}
                            </td>
                            <td className="py-1.5 px-2 text-center border-r border-slate-300 align-top capitalize font-semibold">
                              {l.pengalaman}
                            </td>
                            <td className="py-1.5 px-2 text-center border-r border-slate-300 align-top text-[10px]">
                              <div>{(l.prinsip || []).join(", ")}</div>
                              {pcObj && (
                                <div className="font-bold text-rose-800 mt-0.5">
                                  [{pcObj.kode}]
                                </div>
                              )}
                            </td>
                            <td className="py-1.5 px-1.5 text-center font-bold align-top">
                              {l.durasi_menit}&apos;
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}

            {/* E. RANCANGAN ASESMEN */}
            <div className="bg-slate-200/90 font-black px-3 py-1.5 border-t border-b border-slate-900 uppercase tracking-wide">
              E. RANCANGAN ASESMEN
            </div>
            <table className="w-full border-collapse">
              <tbody className="divide-y divide-slate-300">
                <tr>
                  <td className="w-1/3 py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                    Asesmen Awal (Diagnostik)
                  </td>
                  <td className="py-1.5 px-3 text-slate-900 leading-relaxed">
                    {rpp.asesmen_awal || "-"}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                    Asesmen Proses (Formatif)
                  </td>
                  <td className="py-1.5 px-3 text-slate-900 leading-relaxed">
                    {rpp.asesmen_proses || "-"}
                  </td>
                </tr>
                <tr>
                  <td className="py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                    Asesmen Akhir (Sumatif)
                  </td>
                  <td className="py-1.5 px-3 text-slate-900 leading-relaxed">
                    {rpp.asesmen_akhir || "-"}
                  </td>
                </tr>
                {rpp.kktp && (
                  <tr>
                    <td className="py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                      Kriteria Ketercapaian (KKTP)
                    </td>
                    <td className="py-1.5 px-3 text-slate-900 leading-relaxed">
                      {rpp.kktp}
                    </td>
                  </tr>
                )}
                {/* Rubrik Karakter Nilai Panca Cinta */}
                {(rpp.rubrik_kbc || []).length > 0 && (
                  <tr>
                    <td className="py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                      Rubrik Karakter Nilai Panca Cinta KBC
                    </td>
                    <td className="py-2 px-3 text-slate-900 space-y-2">
                      {(rpp.rubrik_kbc || []).map((rb, idx) => (
                        <div
                          key={`rb-pv-${idx}`}
                          className="border border-slate-300 rounded p-2 bg-slate-50 text-[10px]"
                        >
                          <div className="font-bold text-rose-900 mb-1">
                            Topik: {rb.topik_nama} ({rb.indikator})
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                            {rb.levels.map((lvl) => (
                              <div
                                key={`rbl-${lvl.level}`}
                                className="bg-white p-1 rounded border border-slate-200"
                              >
                                <span className="font-bold text-emerald-800">
                                  [{lvl.level}] {lvl.label}:
                                </span>{" "}
                                <span>{lvl.deskripsi}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* F. LAMPIRAN */}
            <div className="bg-slate-200/90 font-black px-3 py-1.5 border-t border-b border-slate-900 uppercase tracking-wide">
              F. LAMPIRAN
            </div>
            <table className="w-full border-collapse">
              <tbody className="divide-y divide-slate-300">
                {rpp.lampiran?.lkpd && (
                  <tr>
                    <td className="w-1/3 py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                      Lembar Kerja Peserta Didik (LKPD)
                    </td>
                    <td className="py-1.5 px-3 text-slate-900 leading-relaxed whitespace-pre-line">
                      {rpp.lampiran.lkpd}
                    </td>
                  </tr>
                )}
                {rpp.lampiran?.bahan_bacaan && (
                  <tr>
                    <td className="w-1/3 py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                      Bahan Bacaan Guru & Murid
                    </td>
                    <td className="py-1.5 px-3 text-slate-900 leading-relaxed whitespace-pre-line">
                      {rpp.lampiran.bahan_bacaan}
                    </td>
                  </tr>
                )}
                {rpp.lampiran?.glosarium && (
                  <tr>
                    <td className="w-1/3 py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                      Glosarium (Daftar Istilah)
                    </td>
                    <td className="py-1.5 px-3 text-slate-900 leading-relaxed whitespace-pre-line">
                      {rpp.lampiran.glosarium}
                    </td>
                  </tr>
                )}
                {rpp.lampiran?.daftar_pustaka && (
                  <tr>
                    <td className="w-1/3 py-1.5 px-3 font-semibold text-slate-700 bg-slate-50/70 border-r border-slate-300">
                      Daftar Pustaka & Referensi
                    </td>
                    <td className="py-1.5 px-3 text-slate-900 leading-relaxed whitespace-pre-line">
                      {rpp.lampiran.daftar_pustaka}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ========================================================================= */}
          {/* LEMBAR PENGESAHAN TANDA TANGAN */}
          {/* ========================================================================= */}
          <div className="mt-8 pt-2 break-inside-avoid text-xs text-slate-900">
            <div className="flex justify-between items-start">
              {/* Tanda Tangan Kepala Madrasah */}
              <div className="text-center w-64 space-y-1">
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala {madrasah.nama}</p>
                <div className="h-20" />
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
                <div className="h-20" />
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
            <span>{madrasah.nama} • Modul Ajar / RPP Kurikulum Berbasis Cinta (Fase D)</span>
            <span>Sumber CP: KMA 1503/2025 · Bank data 2026-2027-v1</span>
          </div>
        </div>

        {/* Riwayat Validasi & Status Timeline (Hanya di layar) */}
        <div className="print:hidden pt-4">
          <StatusTimeline dokumenTipe="rpp" dokumenId={rpp.id} />
        </div>
      </div>
    </>
  );
}
