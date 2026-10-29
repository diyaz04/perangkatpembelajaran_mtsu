"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Printer,
  ArrowLeft,
  Download,
  FileText,
  Layers,
  Sparkles,
  Target,
} from "lucide-react";
import type { TpPreviewData } from "@/app/(app)/atp/actions";
import { formatTitimangsa } from "@/lib/format-titimangsa";
import { Switch } from "@/components/ui/switch";
import { KopMadrasah } from "@/components/kop-madrasah";

interface TpPreviewClientProps {
  data: TpPreviewData;
}

export function TpPreviewClient({ data }: TpPreviewClientProps) {
  const { madrasah, penugasan, items, summary } = data;
  const [showKop, setShowKop] = useState(true);

  const handlePrint = () => {
    window.print();
  };

  const tanggalFormatted = formatTitimangsa(penugasan.tahun_ajaran.tanggal_penetapan_dokumen);

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
            padding: 0 2px 0 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: calc(100% - 2px) !important;
            max-width: calc(100% - 2px) !important;
            border-right: 1.5px solid #1e293b !important;
          }
          th:last-child, td:last-child {
            border-right: 1.5px solid #1e293b !important;
          }
          th:first-child, td:first-child {
            border-left: 1.5px solid #1e293b !important;
          }
        }
      `}} />

      <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto space-y-5 print:p-0 print:m-0 print:max-w-none">
        {/* Tab Navigasi Dokumen Kurikulum (CP, TP, ATP) */}
        <div className="print:hidden flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <Link
              href={`/atp/${penugasan.id}/preview-cp`}
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className: "text-xs font-medium text-slate-600 hover:text-slate-900 shrink-0",
              })}
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              1. Analisis CP
            </Link>
            <div className="text-xs font-bold bg-white text-amber-800 shadow-xs px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1.5 border border-slate-200/80">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              2. Rumusan TP & KKTP
            </div>
            <Link
              href={`/atp/${penugasan.id}/preview`}
              className={buttonVariants({
                variant: "ghost",
                size: "sm",
                className: "text-xs font-medium text-slate-600 hover:text-slate-900 shrink-0",
              })}
            >
              <Layers className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              3. Alur TP (ATP)
            </Link>
          </div>

          {/* Toggle KOP Surat */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <Switch
              id="toggle-kop-tp"
              checked={showKop}
              onCheckedChange={setShowKop}
            />
            <label
              htmlFor="toggle-kop-tp"
              className="text-xs font-semibold cursor-pointer text-slate-700 select-none"
            >
              {showKop ? "KOP Surat: Aktif" : "KOP Surat: Nonaktif"}
            </label>
          </div>
        </div>

        {/* Action Bar */}
        <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3">
            <Link
              href={`/atp/${penugasan.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Kembali ke Wizard
            </Link>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200">
              <Target className="w-3.5 h-3.5 mr-1" />
              Dokumen Rumusan TP & KKTP
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <a
              href={`/api/export/tp/${penugasan.id}?format=docx&kop=${showKop}`}
              className={buttonVariants({ variant: "outline", size: "sm" }) + " flex-1 sm:flex-none border-slate-300 hover:bg-slate-50 text-slate-800 font-medium"}
              download
            >
              <Download className="w-4 h-4 mr-2 text-amber-700" />
              Unduh DOCX
            </a>
            <Button
              onClick={handlePrint}
              className="flex-1 sm:flex-none bg-amber-700 hover:bg-amber-800 text-white font-medium shadow-sm"
            >
              <Printer className="w-4 h-4 mr-2" />
              Cetak / Simpan PDF
            </Button>
          </div>
        </div>

        {/* Kontainer Dokumen Siap Cetak */}
        <div className="print-landscape-container relative bg-white p-6 md:p-10 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 text-slate-900 font-sans">
          {/* KOP MADRASAH RESMI */}
          {showKop && <KopMadrasah madrasah={madrasah} />}

          {/* JUDUL DOKUMEN RESMI */}
          <div className="text-center space-y-1 mb-5 print:mb-3">
            <h2 className="text-base md:text-lg font-black uppercase tracking-wide text-slate-900">
              Rumusan Tujuan Pembelajaran (TP) & KKTP
            </h2>
            <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-emerald-800">
              Kurikulum Berbasis Cinta (KBC) • Fase D (Madrasah Tsanawiyah)
            </h3>
            <p className="text-xs font-semibold text-slate-700">
              Tahun Ajaran {penugasan.tahun_ajaran?.nama || "2026/2027"}
            </p>
          </div>

          {/* IDENTITAS MATA PELAJARAN & GURU */}
          <div className="bg-slate-50/80 print:bg-transparent rounded-lg p-3 print:p-2 mb-5 print:mb-3 border border-slate-200 print:border-none text-xs grid grid-cols-2 gap-x-8 gap-y-1.5">
            <div className="space-y-1">
              <div className="flex">
                <span className="w-36 text-slate-600 font-medium">Satuan Pendidikan</span>
                <span className="font-semibold text-slate-900">: {madrasah.nama}</span>
              </div>
              <div className="flex">
                <span className="w-36 text-slate-600 font-medium">Mata Pelajaran</span>
                <span className="font-semibold text-slate-900">: {penugasan.mapel.nama} ({penugasan.mapel.kode})</span>
              </div>
              <div className="flex">
                <span className="w-36 text-slate-600 font-medium">Fase / Kelas</span>
                <span className="font-semibold text-slate-900">: Fase D / Kelas {penugasan.tingkat_kelas} ({penugasan.rombel})</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex">
                <span className="w-36 text-slate-600 font-medium">Tahun Ajaran</span>
                <span className="font-semibold text-slate-900">: {penugasan.tahun_ajaran?.nama}</span>
              </div>
              <div className="flex">
                <span className="w-36 text-slate-600 font-medium">Guru Pengampu</span>
                <span className="font-semibold text-slate-900">: {penugasan.guru.nama_lengkap}</span>
              </div>
              <div className="flex">
                <span className="w-36 text-slate-600 font-medium">Alokasi Waktu</span>
                <span className="font-semibold text-slate-900">: {summary.grandTotalJp} JP ({summary.totalTp} Tujuan Pembelajaran)</span>
              </div>
            </div>
          </div>

          {/* TABEL RUMUSAN TP & KKTP */}
          <div className="overflow-x-auto print:overflow-visible mb-8 print:mb-4 print:pr-0.5">
            <table className="w-full print:w-[calc(100%-2px)] border-collapse border border-slate-800 text-xs print:text-[10px] table-fixed">
              <thead>
                <tr className="bg-slate-100 print:bg-slate-200 text-slate-900">
                  <th className="border border-slate-800 px-2 py-2 print:px-1 print:py-1 text-center w-[4%] font-bold">No</th>
                  <th className="border border-slate-800 px-2 py-2 print:px-1 print:py-1 text-center w-[7%] font-bold">Kode TP</th>
                  <th className="border border-slate-800 px-3 py-2 print:px-1.5 print:py-1 text-left w-[13%] font-bold">Elemen CP</th>
                  <th className="border border-slate-800 px-3 py-2 print:px-1.5 print:py-1 text-left w-[28%] font-bold">Rumusan Tujuan Pembelajaran (TP)</th>
                  <th className="border border-slate-800 px-3 py-2 print:px-1.5 print:py-1 text-left w-[16%] font-bold">Lingkup Materi</th>
                  <th className="border border-slate-800 px-3 py-2 print:px-1.5 print:py-1 text-left w-[18%] font-bold">Panca Cinta & Profil Lulusan</th>
                  <th className="border border-slate-800 px-2 py-2 print:px-1 print:py-1 text-center w-[6%] font-bold">Smt</th>
                  <th className="border border-slate-800 px-2 py-2 print:px-1 print:py-1 text-center w-[8%] font-bold">Alokasi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const kktpAny = item.kktp as any;
                  const intervalItems = (kktpAny?.interval || [])
                    .map((iv: any) => {
                      if (iv?.kriteria?.trim()) return iv.kriteria.trim();
                      if (iv?.rentang?.trim() && iv?.keterangan?.trim()) return `${iv.rentang.trim()} (${iv.keterangan.trim()})`;
                      if (iv?.keterangan?.trim()) return iv.keterangan.trim();
                      if (iv?.rentang?.trim()) return iv.rentang.trim();
                      return "";
                    })
                    .filter(Boolean);

                  const rubrikItems = (kktpAny?.rubrik || [])
                    .map((r: any) => r?.aspek?.trim())
                    .filter(Boolean);

                  const deskripsiItems = (kktpAny?.deskripsi || [])
                    .map((d: any) => d?.kriteria?.trim())
                    .filter(Boolean);

                  const hasRubrik = kktpAny?.pendekatan === "rubrik" && rubrikItems.length > 0;
                  const hasInterval = kktpAny?.pendekatan === "interval_nilai" && intervalItems.length > 0;
                  const hasDeskripsi = kktpAny?.pendekatan === "deskripsi_kriteria" && deskripsiItems.length > 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="border border-slate-800 px-2 py-2 print:px-1 print:py-1 text-center align-top font-medium break-words">
                        {item.no}
                      </td>
                      <td className="border border-slate-800 px-2 py-2 print:px-1 print:py-1 text-center align-top font-bold text-slate-900 break-words">
                        {item.kode_tp}
                      </td>
                      <td className="border border-slate-800 px-3 py-2 print:px-1.5 print:py-1 align-top font-semibold text-slate-900 break-words">
                        {item.elemen}
                      </td>
                      <td className="border border-slate-800 px-3 py-2 print:px-1.5 print:py-1 align-top leading-relaxed text-slate-800 break-words">
                        <p className="font-medium text-slate-950 mb-1">{item.deskripsi}</p>
                        {/* Indikator KKTP Ringkas */}
                        {hasRubrik && (
                          <div className="mt-1.5 p-1.5 bg-slate-50 print:bg-transparent rounded border border-slate-200 print:border-none text-[11px] print:text-[9.5px] text-slate-700">
                            <span className="font-semibold text-slate-900">KKTP Rubrik: </span>
                            <span>{rubrikItems.join(", ")}</span>
                          </div>
                        )}
                        {hasInterval && (
                          <div className="mt-1.5 p-1.5 bg-slate-50 print:bg-transparent rounded border border-slate-200 print:border-none text-[11px] print:text-[9.5px] text-slate-700">
                            <span className="font-semibold text-slate-900">KKTP Interval: </span>
                            <span>{intervalItems.join(", ")}</span>
                          </div>
                        )}
                        {hasDeskripsi && (
                          <div className="mt-1.5 p-1.5 bg-slate-50 print:bg-transparent rounded border border-slate-200 print:border-none text-[11px] print:text-[9.5px] text-slate-700">
                            <span className="font-semibold text-slate-900">KKTP Kriteria: </span>
                            <span>{deskripsiItems.join(", ")}</span>
                          </div>
                        )}
                      </td>
                      <td className="border border-slate-800 px-3 py-2 print:px-1.5 print:py-1 align-top font-medium text-slate-900 break-words">
                        {item.lingkup_materi}
                      </td>
                      <td className="border border-slate-800 px-3 py-2 print:px-1.5 print:py-1 align-top space-y-1 print:space-y-0.5 break-words">
                        {item.panca_cinta && item.panca_cinta.length > 0 && (
                          <div>
                            <span className="font-semibold text-emerald-800">PC: </span>
                            <span className="text-slate-700">{item.panca_cinta.join("; ")}</span>
                          </div>
                        )}
                        {item.dpl && item.dpl.length > 0 && (
                          <div>
                            <span className="font-semibold text-blue-800">DPL: </span>
                            <span className="text-slate-700">{item.dpl.join("; ")}</span>
                          </div>
                        )}
                      </td>
                      <td className="border border-slate-800 px-2 py-2 print:px-1 print:py-1 text-center align-top font-semibold text-slate-900 break-words">
                        Smt {item.semester}
                      </td>
                      <td className="border border-slate-800 px-2 py-2 print:px-1 print:py-1 text-center align-top font-bold text-slate-900 break-words">
                        {item.alokasi_jp} JP
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 print:bg-slate-200 font-bold text-slate-900">
                  <td colSpan={6} className="border border-slate-800 px-4 py-2 print:px-2 print:py-1 text-right">
                    Total JP Semester 1: {summary.totalJpSmt1} JP | Total JP Semester 2: {summary.totalJpSmt2} JP | Grand Total:
                  </td>
                  <td colSpan={2} className="border border-slate-800 px-2 py-2 print:px-1 print:py-1 text-center">
                    {summary.grandTotalJp} JP
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* TANDA TANGAN RESMI */}
          <div className="no-break mt-10 pt-4 grid grid-cols-2 gap-8 text-xs text-center">
            <div>
              <p className="mb-1">Mengetahui,</p>
              <p className="font-semibold">Kepala {madrasah.nama}</p>
              <div className="h-20" />
              <p className="font-bold underline text-slate-900">
                {madrasah.kepala_nama || "Kepala Madrasah"}
              </p>
              <p className="text-slate-600">
                NIP. {madrasah.kepala_nip || "-"}
              </p>
            </div>
            <div>
              <p className="mb-1">{madrasah.kabupaten || "Tasikmalaya"}, {tanggalFormatted}</p>
              <p className="font-semibold">Guru Mata Pelajaran</p>
              <div className="h-20" />
              <p className="font-bold underline text-slate-900">
                {penugasan.guru.nama_lengkap}{penugasan.guru.gelar ? `, ${penugasan.guru.gelar}` : ""}
              </p>
              <p className="text-slate-600">
                NIP. {penugasan.guru.nip || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
