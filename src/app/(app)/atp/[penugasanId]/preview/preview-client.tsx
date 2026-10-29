"use client";

import { useState } from "react";
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
  FileText,
  Layers,
} from "lucide-react";
import { METODE_PENGURUTAN_ATP } from "@/lib/kbc-pedagogi";
import { formatTitimangsa } from "@/lib/format-titimangsa";
import type { DocStatus, MetodePengurutanAtp } from "@/types/database";
import { submitDokumenAction, createRevisiCopyAction } from "@/lib/validasi/actions";
import { StatusTimeline } from "@/components/validasi/status-timeline";
import { Switch } from "@/components/ui/switch";
import { KopMadrasah } from "@/components/kop-madrasah";

export interface PreviewItem {
  no: number;
  id: string;
  kode_tp: string;
  elemen: string;
  deskripsi_cp: string;
  tujuan_pembelajaran: string;
  materi_pokok: string;
  panca_cinta: string[];
  dpl: string[];
  semester: number;
  alokasi_jp: number;
}

export interface PreviewData {
  madrasah: {
    nama: string;
    nsm: string | null;
    npsn: string | null;
    alamat: string | null;
    kabupaten: string | null;
    kepala_nama: string | null;
    kepala_nip: string | null;
    logo_url: string | null;
  };
  penugasan: {
    id: string;
    tingkat_kelas: 7 | 8 | 9;
    rombel: string;
    mapel: {
      id: string;
      nama: string;
      kode: string;
    };
    guru: {
      nama_lengkap: string;
      nip: string | null;
    };
    tahun_ajaran: {
      nama: string;
      tanggal_penetapan_dokumen: string | null;
    };
  };
  atp: {
    id: string | null;
    status: DocStatus;
    metode_pengurutan: MetodePengurutanAtp;
  };
  items: PreviewItem[];
  summary: {
    totalJpSmt1: number;
    totalJpSmt2: number;
    grandTotalJp: number;
    totalTp: number;
  };
}

interface PreviewClientProps {
  data: PreviewData;
}

export function PreviewClient({ data }: PreviewClientProps) {
  const router = useRouter();
  const { madrasah, penugasan, atp, items, summary } = data;
  const [currentStatus, setCurrentStatus] = useState<string>(atp.status);
  const [showKop, setShowKop] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const metodeInfo =
    METODE_PENGURUTAN_ATP.find((m) => m.id === atp.metode_pengurutan) ||
    METODE_PENGURUTAN_ATP[0];

  const handlePrint = () => {
    window.print();
  };

  const handleAjukan = async () => {
    if (!atp.id) {
      setMsg({ type: "error", text: "Dokumen ATP belum tersimpan sebagai draf." });
      return;
    }
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await submitDokumenAction("atp", atp.id);
      if (res.success) {
        setCurrentStatus("diajukan");
        setMsg({ type: "success", text: "ATP berhasil diajukan untuk validasi." });
        router.refresh();
      } else {
        setMsg({ type: "error", text: res.error || "Gagal mengajukan ATP." });
      }
    } catch {
      setMsg({ type: "error", text: "Terjadi kesalahan sistem saat mengajukan." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBuatRevisi = async () => {
    if (!atp.id) return;
    setActionLoading(true);
    setMsg(null);
    try {
      const res = await createRevisiCopyAction("atp", atp.id);
      if (res.success) {
        setCurrentStatus("draf");
        router.push(`/atp/${penugasan.id}`);
      } else {
        setMsg({ type: "error", text: res.error || "Gagal membuat revisi ATP." });
      }
    } catch {
      setMsg({ type: "error", text: "Terjadi kesalahan sistem saat membuat revisi." });
    } finally {
      setActionLoading(false);
    }
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
            Diajukan untuk Validasi
          </Badge>
        );
      case "revisi":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300">
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            Perlu Revisi
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
            border-right: 1.5px solid #0f172a !important;
          }
          th:last-child, td:last-child {
            border-right: 1.5px solid #0f172a !important;
          }
          th:first-child, td:first-child {
            border-left: 1.5px solid #0f172a !important;
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
          <Link
            href={`/atp/${penugasan.id}/preview-tp`}
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "text-xs font-medium text-slate-600 hover:text-slate-900 shrink-0",
            })}
          >
            <FileText className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
            2. Rumusan TP & KKTP
          </Link>
          <div className="text-xs font-bold bg-white text-emerald-800 shadow-xs px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1.5 border border-slate-200/80">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            3. Alur TP (ATP)
          </div>
        </div>

        {/* Toggle KOP Surat */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
          <Switch
            id="toggle-kop-atp"
            checked={showKop}
            onCheckedChange={setShowKop}
          />
          <label
            htmlFor="toggle-kop-atp"
            className="text-xs font-semibold cursor-pointer text-slate-700 select-none"
          >
            {showKop ? "KOP Surat: Aktif" : "KOP Surat: Nonaktif"}
          </label>
        </div>
      </div>

      {/* Action Bar (Hanya tampil di layar, disembunyikan saat print) */}
      <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href={`/atp/${penugasan.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Kembali ke Wizard
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

          <a
            href={`/api/export/atp/${penugasan.id}?format=docx&kop=${showKop}`}
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
      <div className="print-landscape-container relative bg-white p-6 md:p-10 rounded-xl border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0 text-slate-900 font-sans">
        {currentStatus !== "disetujui" && (
          <div className="watermark-draf-print pointer-events-none select-none">
            DRAF
          </div>
        )}
        {/* KOP MADRASAH RESMI */}
        {showKop && <KopMadrasah madrasah={madrasah} />}

        {/* JUDUL DOKUMEN RESMI */}
        <div className="text-center space-y-1 mb-5 print:mb-3">
          <h2 className="text-base md:text-lg font-black uppercase tracking-wide text-slate-900">
            Alur Tujuan Pembelajaran (ATP)
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
              <span className="font-semibold text-slate-900">: {penugasan.mapel?.nama} ({penugasan.mapel?.kode})</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-600 font-medium">Fase / Kelas</span>
              <span className="font-semibold text-slate-900">
                : Fase D / Kelas {penugasan.tingkat_kelas === 7 ? "VII" : penugasan.tingkat_kelas === 8 ? "VIII" : "IX"} (Rombel {penugasan.rombel})
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex">
              <span className="w-36 text-slate-600 font-medium">Guru Mata Pelajaran</span>
              <span className="font-semibold text-slate-900">: {penugasan.guru?.nama_lengkap}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-600 font-medium">NIP Guru</span>
              <span className="font-semibold text-slate-900">: {penugasan.guru?.nip || "-"}</span>
            </div>
            <div className="flex">
              <span className="w-36 text-slate-600 font-medium">Metode Pengurutan ATP</span>
              <span className="font-semibold text-emerald-800">: {metodeInfo.nama}</span>
            </div>
          </div>
        </div>

        {/* KETERANGAN METODE PENGURUTAN SINGKAT */}
        <div className="mb-5 print:mb-3 text-xs text-slate-600 bg-emerald-50/30 print:bg-transparent p-2.5 print:p-1.5 rounded border border-emerald-100 print:border-none italic">
          <strong>Catatan Alur:</strong> {metodeInfo.penjelasan}
        </div>

        {/* TABEL RESMI ATP */}
        <div className="overflow-x-auto print:overflow-visible mb-8 print:mb-4 print:pr-0.5">
          <table className="w-full print:w-[calc(100%-2px)] text-left border-collapse border border-slate-900 text-xs print:text-[10px] table-fixed">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200 text-slate-900 text-center font-bold">
                <th className="border border-slate-900 px-2 py-2 print:px-1 print:py-1 w-[4%]">No</th>
                <th className="border border-slate-900 px-2 py-2 print:px-1.5 print:py-1 w-[13%]">Elemen CP</th>
                <th className="border border-slate-900 px-3 py-2 print:px-1.5 print:py-1 w-[28%]">
                  Alur Tujuan Pembelajaran (ATP)
                </th>
                <th className="border border-slate-900 px-2 py-2 print:px-1.5 print:py-1 w-[16%]">Lingkup Materi</th>
                <th className="border border-slate-900 px-2 py-2 print:px-1.5 print:py-1 w-[14%]">Topik Panca Cinta</th>
                <th className="border border-slate-900 px-2 py-2 print:px-1.5 print:py-1 w-[14%]">Dimensi Profil Lulusan</th>
                <th className="border border-slate-900 px-2 py-2 print:px-1 print:py-1 w-[5%] text-center">Smt</th>
                <th className="border border-slate-900 px-2 py-2 print:px-1 print:py-1 w-[6%] text-center">JP</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="border border-slate-900 px-4 py-8 text-center text-slate-500 italic">
                    Belum ada Tujuan Pembelajaran yang dimasukkan dalam ATP ini.
                  </td>
                </tr>
              ) : (
                items.map((row: PreviewItem) => (
                  <tr key={row.id} className="align-top hover:bg-slate-50/50">
                    <td className="border border-slate-900 px-2 py-2 print:px-1 print:py-1 text-center font-mono font-medium break-words">
                      {row.no}
                    </td>
                    <td className="border border-slate-900 px-2 py-2 print:px-1.5 print:py-1 font-semibold text-slate-900 break-words">
                      {row.elemen}
                    </td>
                    <td className="border border-slate-900 px-3 py-2 print:px-1.5 print:py-1 space-y-1 break-words">
                      <div className="font-mono text-[10px] print:text-[9px] font-bold text-emerald-800">
                        [{row.kode_tp}]
                      </div>
                      <div className="leading-relaxed text-slate-800">
                        {row.tujuan_pembelajaran}
                      </div>
                    </td>
                    <td className="border border-slate-900 px-2 py-2 print:px-1.5 print:py-1 text-slate-800 break-words">
                      {row.materi_pokok}
                    </td>
                    <td className="border border-slate-900 px-2 py-2 print:px-1.5 print:py-1 break-words">
                      {row.panca_cinta.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5 text-slate-800">
                          {row.panca_cinta.map((pc: string, i: number) => (
                            <li key={i} className="text-[11px] print:text-[9.5px]">{pc}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-2 py-2 print:px-1.5 print:py-1 break-words">
                      {row.dpl.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5 text-slate-800">
                          {row.dpl.map((d: string, i: number) => (
                            <li key={i} className="text-[11px] print:text-[9.5px]">{d}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>
                    <td className="border border-slate-900 px-2 py-2 print:px-1 print:py-1 text-center font-bold break-words">
                      {row.semester}
                    </td>
                    <td className="border border-slate-900 px-2 py-2 print:px-1 print:py-1 text-center font-bold font-mono break-words">
                      {row.alokasi_jp}
                    </td>
                  </tr>
                ))
              )}

              {/* Baris Ringkasan Total JP */}
              {items.length > 0 && (
                <>
                  <tr className="bg-slate-50 print:bg-slate-100 font-bold">
                    <td colSpan={7} className="border border-slate-900 px-3 py-2 print:px-2 print:py-1 text-right">
                      Total Jam Pembelajaran (JP) Semester 1 (Ganjil):
                    </td>
                    <td className="border border-slate-900 px-2 py-2 print:px-1 print:py-1 text-center font-mono">
                      {summary.totalJpSmt1} JP
                    </td>
                  </tr>
                  <tr className="bg-slate-50 print:bg-slate-100 font-bold">
                    <td colSpan={7} className="border border-slate-900 px-3 py-2 print:px-2 print:py-1 text-right">
                      Total Jam Pembelajaran (JP) Semester 2 (Genap):
                    </td>
                    <td className="border border-slate-900 px-2 py-2 print:px-1 print:py-1 text-center font-mono">
                      {summary.totalJpSmt2} JP
                    </td>
                  </tr>
                  <tr className="bg-slate-100 print:bg-slate-200 font-extrabold text-slate-950">
                    <td colSpan={7} className="border border-slate-900 px-3 py-2 print:px-2 print:py-1 text-right">
                      GRAND TOTAL ALOKASI WAKTU (1 TAHUN AJARAN):
                    </td>
                    <td className="border border-slate-900 px-2 py-2 print:px-1 print:py-1 text-center font-mono text-sm print:text-xs text-emerald-900">
                      {summary.grandTotalJp} JP
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* KOLOM TANDA TANGAN RESMI */}
        <div className="pt-6 break-inside-avoid text-xs text-slate-900">
          <div className="flex justify-between items-start">
            {/* Tanda Tangan Kepala Madrasah */}
            <div className="w-64 text-center space-y-16">
              <div>
                <p>Mengetahui,</p>
                <p className="font-semibold">Kepala {madrasah.nama}</p>
              </div>
              <div className="space-y-0.5">
                <p className="font-bold underline text-slate-900 text-sm">
                  {madrasah.kepala_nama || "Drs. H. Ahmad Fauzi, M.Pd.I"}
                </p>
                <p className="font-mono text-slate-700">
                  NIP. {madrasah.kepala_nip || "197205121998031002"}
                </p>
              </div>
            </div>

            {/* Tanda Tangan Guru Pengampu */}
            <div className="w-64 text-center space-y-16">
              <div>
                <p>
                  {madrasah.kabupaten?.replace("Kabupaten ", "") || "Tasikmalaya"},{" "}
                  {formatTitimangsa(penugasan.tahun_ajaran.tanggal_penetapan_dokumen)}
                </p>
                <p className="font-semibold">Guru Mata Pelajaran</p>
              </div>
              <div className="space-y-0.5">
                <p className="font-bold underline text-slate-900 text-sm">
                  {penugasan.guru?.nama_lengkap}
                </p>
                <p className="font-mono text-slate-700">
                  NIP. {penugasan.guru?.nip || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Dokumen Bank Data */}
          <div className="pt-6 border-t border-slate-200 mt-8 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-500 italic">
            <span>{madrasah.nama} • Alur Tujuan Pembelajaran Fase D</span>
            <span>Sumber CP: KMA 1503/2025 · Bank data 2026-2027-v1</span>
          </div>
        </div>
      </div>

      {/* Riwayat Validasi & Status Timeline (Hanya di layar) */}
      <div className="print:hidden">
        <StatusTimeline dokumenTipe="atp" dokumenId={atp.id || penugasan.id} />
      </div>
    </div>
  </>
);
}
