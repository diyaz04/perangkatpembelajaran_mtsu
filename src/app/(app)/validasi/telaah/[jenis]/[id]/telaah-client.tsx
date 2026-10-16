"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PanelTelaah } from "@/components/validasi/panel-telaah";
import { StatusTimeline } from "@/components/validasi/status-timeline";
import type { TelaahDataResult } from "@/app/(app)/validasi/telaah-actions";
import type { DocStatus } from "@/types/database";

interface TelaahClientProps {
  data: TelaahDataResult;
}

export function TelaahClient({ data }: TelaahClientProps) {
  const { dokumenTipe, dokumenId, status, evaluasi, metadata, rppData, atpData, protaData, prosemData } = data;
  const [currentStatus, setCurrentStatus] = useState<DocStatus>(status);
  const [refreshTimelineTrigger, setRefreshTimelineTrigger] = useState(0);

  const handleValidationSuccess = () => {
    setCurrentStatus("disetujui");
    setRefreshTimelineTrigger((prev) => prev + 1);
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case "disetujui":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Disetujui
          </Badge>
        );
      case "diajukan":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <Clock className="w-3.5 h-3.5 mr-1" /> Menunggu Telaah (Diajukan)
          </Badge>
        );
      case "revisi":
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 mr-1" /> Dalam Tahap Revisi
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

  return (
    <div className="flex-1 p-4 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link href="/validasi">
            <Button variant="outline" size="sm" className="h-9 w-9 p-0">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Telaah Dokumen Perangkat Ajar
              </span>
              {getStatusBadge(currentStatus)}
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              {metadata.judul}
            </h1>
            <p className="text-xs text-slate-500">
              Guru: <strong>{metadata.guruNama}</strong> · {metadata.mapelNama} (Kelas {metadata.tingkatKelas} - {metadata.rombel}) · TA {metadata.tahunAjaran}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Cetak Dokumen
          </Button>
        </div>
      </div>

      {/* Split Layout: Kiri Pratinjau Dokumen (70%) | Kanan Panel Telaah (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Pratinjau Dokumen */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            {/* Header Dokumen Resmi */}
            <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-wide uppercase">
                {metadata.judul}
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-slate-700">
                MTs KH A WAHAB MUHSIN · TASIKMALAYA
              </p>
              <p className="text-xs text-slate-500">
                Tahun Ajaran {metadata.tahunAjaran} · Fase D (Kelas {metadata.tingkatKelas})
              </p>
            </div>

            {/* Identitas Dokumen */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[11px]">Mata Pelajaran:</span>
                <span className="font-semibold text-slate-800">{metadata.mapelNama}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Kelas / Rombel:</span>
                <span className="font-semibold text-slate-800">Kelas {metadata.tingkatKelas} ({metadata.rombel})</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Guru Pengampu:</span>
                <span className="font-semibold text-slate-800">{metadata.guruNama}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">NIP:</span>
                <span className="font-semibold text-slate-800">{metadata.guruNip || "-"}</span>
              </div>
            </div>

            {/* Konten Dokumen sesuai jenis */}
            {dokumenTipe === "rpp" && rppData && (
              <div className="space-y-6 text-xs text-slate-700">
                {/* Tabel 3.5 Identifikasi Kemenag */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm pb-1 border-b border-slate-200">
                    I. IDENTIFIKASI & TUJUAN PEMBELAJARAN
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 border border-slate-200 p-3 rounded-lg">
                      <span className="font-semibold text-slate-800 block text-[11px]">
                        Tujuan Pembelajaran (TP):
                      </span>
                      <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                        {rppData.rpp.tujuan_pembelajaran_teks || "-"}
                      </p>
                    </div>

                    <div className="space-y-2 border border-slate-200 p-3 rounded-lg">
                      <span className="font-semibold text-slate-800 block text-[11px]">
                        Benang Merah Nilai KBC:
                      </span>
                      <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                        {rppData.rpp.benang_merah_kbc || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="border border-slate-200 p-3 rounded-lg">
                      <span className="font-semibold text-slate-800 block text-[11px] mb-1">
                        Dimensi Profil Lulusan (DPL):
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {rppData.master.dpl
                          .filter((d) => (rppData.rpp.dimensi_profil_lulusan_ids || []).includes(d.id))
                          .map((d) => (
                            <Badge key={d.id} variant="outline" className="text-[10px]">
                              {d.kode}: {d.nama}
                            </Badge>
                          ))}
                      </div>
                    </div>

                    <div className="border border-slate-200 p-3 rounded-lg">
                      <span className="font-semibold text-slate-800 block text-[11px] mb-1">
                        Topik Panca Cinta:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {rppData.master.pancaCinta
                          .filter((pc) => (rppData.rpp.panca_cinta_ids || []).includes(pc.id))
                          .map((pc) => (
                            <Badge key={pc.id} className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                              {pc.kode}: {pc.nama}
                            </Badge>
                          ))}
                      </div>
                    </div>

                    <div className="border border-slate-200 p-3 rounded-lg">
                      <span className="font-semibold text-slate-800 block text-[11px] mb-1">
                        Alokasi Waktu & Model:
                      </span>
                      <p>
                        {rppData.rpp.alokasi_jp} JP ({rppData.rpp.alokasi_jp * (rppData.rpp.menit_per_jp || 40)} menit), {rppData.rpp.jumlah_pertemuan} Pertemuan
                      </p>
                    </div>
                  </div>
                </div>

                {/* Langkah-langkah Kegiatan Pembelajaran */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm pb-1 border-b border-slate-200">
                    II. DESAIN PENGALAMAN BELAJAR BERMAKNA & MENDALAM
                  </h3>
                  <div className="space-y-3">
                    {rppData.langkahList.map((langkah, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-slate-200 p-3.5 space-y-1.5 bg-slate-50/40"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 capitalize">
                              Pertemuan {langkah.pertemuan_ke} — {langkah.tahap}
                            </span>
                            <Badge variant="outline" className="text-[10px] uppercase">
                              {langkah.pengalaman}
                            </Badge>
                          </div>
                          <span className="text-slate-500 font-medium text-[11px]">
                            {langkah.durasi_menit} Menit
                          </span>
                        </div>

                        <p className="whitespace-pre-wrap leading-relaxed text-slate-700">
                          {langkah.deskripsi_kegiatan}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-200/60">
                          {(langkah.prinsip || []).map((p) => (
                            <span key={p} className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded">
                              #{p}
                            </span>
                          ))}
                          {langkah.aksi_kbc && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                              Aksi KBC: {langkah.aksi_kbc}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Asesmen & Rubrik */}
                <div className="space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm pb-1 border-b border-slate-200">
                    III. ASESMEN & RUBRIK KBC 4 LEVEL
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="border border-slate-200 p-3 rounded-lg">
                      <span className="font-semibold text-slate-800 block text-[11px]">
                        Asesmen Awal:
                      </span>
                      <p className="text-slate-600 mt-1">{rppData.rpp.asesmen_awal || "-"}</p>
                    </div>
                    <div className="border border-slate-200 p-3 rounded-lg">
                      <span className="font-semibold text-slate-800 block text-[11px]">
                        Asesmen Formatif Proses:
                      </span>
                      <p className="text-slate-600 mt-1">{rppData.rpp.asesmen_proses || "-"}</p>
                    </div>
                    <div className="border border-slate-200 p-3 rounded-lg">
                      <span className="font-semibold text-slate-800 block text-[11px]">
                        Asesmen Sumatif Akhir:
                      </span>
                      <p className="text-slate-600 mt-1">{rppData.rpp.asesmen_akhir || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Konten ATP */}
            {dokumenTipe === "atp" && atpData && (
              <div className="space-y-4 text-xs">
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                      <tr>
                        <th className="p-2.5 w-10 text-center">No</th>
                        <th className="p-2.5 w-16">Kode</th>
                        <th className="p-2.5">Tujuan Pembelajaran (TP)</th>
                        <th className="p-2.5">Materi Pokok</th>
                        <th className="p-2.5 w-16 text-center">Smt</th>
                        <th className="p-2.5 w-16 text-center">JP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {atpData.items.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td className="p-2.5 text-center font-medium">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-emerald-700">{it.kode_tp}</td>
                          <td className="p-2.5">{it.tujuan_pembelajaran}</td>
                          <td className="p-2.5">{it.materi_pokok}</td>
                          <td className="p-2.5 text-center">{it.semester}</td>
                          <td className="p-2.5 text-center font-semibold">{it.alokasi_jp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Konten Prota */}
            {dokumenTipe === "prota" && protaData && (
              <div className="space-y-4 text-xs">
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                      <tr>
                        <th className="p-2.5 w-12 text-center">No</th>
                        <th className="p-2.5">Materi Pokok / Tujuan Pembelajaran</th>
                        <th className="p-2.5 w-24 text-center">Semester</th>
                        <th className="p-2.5 w-20 text-center">Alokasi JP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {protaData.items.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td className="p-2.5 text-center font-medium">{idx + 1}</td>
                          <td className="p-2.5">{it.materi_pokok}</td>
                          <td className="p-2.5 text-center">Semester {it.semester}</td>
                          <td className="p-2.5 text-center font-bold">{it.alokasi_jp} JP</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Konten Prosem */}
            {dokumenTipe === "prosem" && prosemData && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-500 italic">
                  Matriks Program Semester dengan {prosemData.items.length} Tujuan Pembelajaran terdistribusi.
                </p>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                      <tr>
                        <th className="p-2.5 w-12 text-center">No</th>
                        <th className="p-2.5">Tujuan Pembelajaran</th>
                        <th className="p-2.5 w-24 text-center">Total JP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {prosemData.items.map((it, idx) => (
                        <tr key={it.prota_item_id || idx}>
                          <td className="p-2.5 text-center font-medium">{idx + 1}</td>
                          <td className="p-2.5">{it.tujuan_pembelajaran_teks}</td>
                          <td className="p-2.5 text-center font-bold">{it.alokasi_jp} JP</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Panel Samping "Telaah" (Checklist 8 Butir & Aksi) + Riwayat Timeline */}
        <div className="lg:col-span-4 space-y-6">
          <PanelTelaah
            dokumenTipe={dokumenTipe}
            dokumenId={dokumenId}
            currentStatus={currentStatus}
            evaluasi={evaluasi}
            onSuccess={handleValidationSuccess}
          />

          <StatusTimeline
            dokumenTipe={dokumenTipe}
            dokumenId={dokumenId}
            refreshTrigger={refreshTimelineTrigger}
          />
        </div>
      </div>
    </div>
  );
}
