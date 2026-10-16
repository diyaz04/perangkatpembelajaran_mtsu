"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Save,
  Send,
  RefreshCw,
  Eye,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Info,
  Scale,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  saveProtaAction,
  syncProtaFromAtpAction,
  type ProtaDetailData,
  type ProtaItemPayload,
} from "../actions";
import type { DocStatus } from "@/types/database";

interface ProtaClientProps {
  initialData: ProtaDetailData;
  penugasanId: string;
}

export function ProtaClient({ initialData, penugasanId }: ProtaClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [status, setStatus] = useState<DocStatus>(initialData.prota.status);
  const [items, setItems] = useState<ProtaItemPayload[]>(initialData.items);
  const [selectedSemesterTab, setSelectedSemesterTab] = useState<"all" | "1" | "2">("all");
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Ambil analisis minggu efektif: gunakan snapshot jika ada, atau real-time saat ini
  const mingguEfektif = initialData.prota.snapshot_minggu_efektif || initialData.mingguEfektifKini;
  const isUsingSnapshot = !!initialData.prota.snapshot_minggu_efektif;

  // Kalkulasi total JP terpakai per semester
  const jpTerpakaiSmt1 = items
    .filter((it) => it.semester === 1)
    .reduce((sum, it) => sum + Number(it.alokasi_jp || 0), 0);

  const jpTerpakaiSmt2 = items
    .filter((it) => it.semester === 2)
    .reduce((sum, it) => sum + Number(it.alokasi_jp || 0), 0);

  const grandTotalJpTerpakai = jpTerpakaiSmt1 + jpTerpakaiSmt2;

  // Analisis evaluasi JP
  const jpEfektifSmt1 = mingguEfektif.semester1.jpEfektif;
  const jpEfektifSmt2 = mingguEfektif.semester2.jpEfektif;
  const grandTotalJpEfektif = mingguEfektif.totalTahun.jpEfektif;

  const sisaJpSmt1 = jpEfektifSmt1 - jpTerpakaiSmt1;
  const sisaJpSmt2 = jpEfektifSmt2 - jpTerpakaiSmt2;
  const grandTotalSisaJp = grandTotalJpEfektif - grandTotalJpTerpakai;

  const isOverallocatedSmt1 = jpTerpakaiSmt1 > jpEfektifSmt1;
  const isOverallocatedSmt2 = jpTerpakaiSmt2 > jpEfektifSmt2;

  const rasioSisaSmt1 = jpEfektifSmt1 > 0 ? sisaJpSmt1 / jpEfektifSmt1 : 0;
  const rasioSisaSmt2 = jpEfektifSmt2 > 0 ? sisaJpSmt2 / jpEfektifSmt2 : 0;

  const isUnderallocatedSmt1 = rasioSisaSmt1 > 0.2;
  const isUnderallocatedSmt2 = rasioSisaSmt2 > 0.2;

  // Inline edit alokasi JP
  const handleJpChange = (index: number, newJp: number) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], alokasi_jp: Math.max(1, newJp) };
      return copy;
    });
  };

  // Inline edit keterangan
  const handleKeteranganChange = (index: number, newKet: string) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], keterangan: newKet };
      return copy;
    });
  };

  // Ubah semester
  const handleSemesterChange = (index: number, sem: 1 | 2) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], semester: sem };
      return copy;
    });
  };

  // Reorder urutan item
  const handleMoveItem = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    setItems((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy.map((item, idx) => ({ ...item, urutan: idx + 1 }));
    });
  };

  // Tambah baris alokasi khusus (misal Asesmen Sumatif atau Cadangan)
  const handleAddCustomItem = (sem: 1 | 2, nama: string, defaultJp = 2) => {
    const nextUrutan = items.length + 1;
    const newItem: ProtaItemPayload = {
      kode_tp: `CAD-${sem}.${nextUrutan}`,
      materi_pokok: nama,
      tujuan_pembelajaran_teks: nama,
      panca_cinta_nama: "Evaluasi & Refleksi",
      semester: sem,
      alokasi_jp: defaultJp,
      urutan: nextUrutan,
      keterangan: "Alokasi Asesmen / Cadangan",
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Hapus item
  const handleDeleteItem = (index: number) => {
    setItems((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((it, idx) => ({ ...it, urutan: idx + 1 }));
    });
  };

  // Simpan Draf / Ajukan Validasi
  const handleSave = (targetStatus: DocStatus) => {
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    startTransition(async () => {
      const res = await saveProtaAction(penugasanId, items, targetStatus);
      if (res.success) {
        setStatus(targetStatus);
        setSaveSuccessMsg(
          targetStatus === "diajukan"
            ? "Program Tahunan berhasil diajukan untuk validasi pimpinan madrasah!"
            : "Draf Program Tahunan & snapshot minggu efektif berhasil disimpan."
        );
        router.refresh();
      } else {
        setSaveErrorMsg(res.error || "Gagal menyimpan Prota.");
      }
    });
  };

  // Sinkronkan Ulang dari ATP
  const handleSyncFromAtp = () => {
    setShowSyncDialog(false);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    startTransition(async () => {
      const res = await syncProtaFromAtpAction(penugasanId);
      if (res.success) {
        setSaveSuccessMsg("Data distribusi Prota berhasil disinkronkan ulang dari ATP!");
        router.refresh();
      } else {
        setSaveErrorMsg(res.error || "Gagal menyinkronkan data dari ATP.");
      }
    });
  };

  // Item yang difilter berdasarkan semester
  const filteredItems = items.filter((it) => {
    if (selectedSemesterTab === "all") return true;
    return it.semester === Number(selectedSemesterTab);
  });

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header & Navigasi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <Link
            href="/prota"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-emerald-700 transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Kembali ke Daftar Penugasan Prota
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Program Tahunan (Prota)
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
            {initialData.penugasan.rombel}) • TP {initialData.penugasan.tahun_ajaran.nama} •{" "}
            {initialData.penugasan.mapel.jp_per_minggu} JP/minggu
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSyncDialog(true)}
            disabled={isPending || !initialData.adaDataAtp}
            className="border-slate-200 hover:bg-slate-50 text-slate-700"
            title="Tarik kembali data TP dari ATP"
          >
            <RefreshCw className="w-4 h-4 mr-1.5 text-slate-500" />
            Sinkronkan dari ATP
          </Button>

          <Link
            href={`/prota/${penugasanId}/preview`}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "border-slate-200 hover:bg-slate-50 text-slate-700",
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

      {/* Alert Notifikasi */}
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

      {/* ========================================================================= */}
      {/* BAGIAN 1: ANALISIS MINGGU EFEKTIF (KMA 1503/2025) */}
      {/* ========================================================================= */}
      <Card className="border-slate-200/90 shadow-sm">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  Analisis Alokasi Waktu & Minggu Efektif
                </CardTitle>
                {isUsingSnapshot ? (
                  <Badge variant="outline" className="text-[11px] border-blue-200 bg-blue-50 text-blue-700">
                    Snapshot Tersimpan
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[11px] border-emerald-200 bg-emerald-50 text-emerald-700">
                    Kalkulasi Kalender Aktif
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Berdasarkan Kalender Pendidikan Kanwil Kemenag Jawa Barat • Madrasah{" "}
                {initialData.madrasah.hari_sekolah} Hari Belajar (Senin–
                {initialData.madrasah.hari_sekolah === 6 ? "Sabtu" : "Jumat"}) • Ambang Batas Tidak Efektif &ge; 50%
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Beban Mapel: {initialData.penugasan.mapel.jp_per_minggu} JP / Minggu</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Tabel Analisis Minggu Efektif */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4">Bulan</th>
                  <th className="py-3 px-4 text-center w-32">Jumlah Minggu</th>
                  <th className="py-3 px-4 text-center w-32 text-emerald-700">Minggu Efektif</th>
                  <th className="py-3 px-4 text-center w-32 text-rose-700">Tidak Efektif</th>
                  <th className="py-3 px-4">Keterangan Kegiatan Pemotong</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {/* Semester 1 (Juli - Desember) */}
                <tr className="bg-emerald-50/40 font-semibold text-xs text-emerald-900 border-t border-b border-emerald-100">
                  <td colSpan={6} className="py-2 px-4 uppercase tracking-wider">
                    Semester 1 (Ganjil) — Tahun Ajaran {initialData.penugasan.tahun_ajaran.nama}
                  </td>
                </tr>
                {mingguEfektif.semester1.daftarBulan.map((b, idx) => (
                  <tr key={`smt1-${b.bulan}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 text-center text-slate-400 text-xs">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">{b.bulan}</td>
                    <td className="py-2.5 px-4 text-center font-medium">{b.jumlahMinggu}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-700 bg-emerald-50/30">
                      {b.mingguEfektif}
                    </td>
                    <td className="py-2.5 px-4 text-center font-medium text-rose-600 bg-rose-50/30">
                      {b.mingguTidakEfektif}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-500">
                      {b.keterangan || <span className="text-slate-300 italic">-</span>}
                    </td>
                  </tr>
                ))}
                {/* Subtotal Semester 1 */}
                <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={2} className="py-2.5 px-4 text-right">
                    Jumlah Semester 1:
                  </td>
                  <td className="py-2.5 px-4 text-center">{mingguEfektif.semester1.totalMinggu}</td>
                  <td className="py-2.5 px-4 text-center text-emerald-800">
                    {mingguEfektif.semester1.totalMingguEfektif}
                  </td>
                  <td className="py-2.5 px-4 text-center text-rose-700">
                    {mingguEfektif.semester1.totalMingguTidakEfektif}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">
                    JP Efektif Smt 1:{" "}
                    <span className="text-emerald-700 font-extrabold text-sm">
                      {mingguEfektif.semester1.jpEfektif} JP
                    </span>{" "}
                    ({mingguEfektif.semester1.totalMingguEfektif} mg &times;{" "}
                    {initialData.penugasan.mapel.jp_per_minggu} JP)
                  </td>
                </tr>

                {/* Semester 2 (Januari - Juni) */}
                <tr className="bg-emerald-50/40 font-semibold text-xs text-emerald-900 border-t border-b border-emerald-100">
                  <td colSpan={6} className="py-2 px-4 uppercase tracking-wider">
                    Semester 2 (Genap) — Tahun Ajaran {initialData.penugasan.tahun_ajaran.nama}
                  </td>
                </tr>
                {mingguEfektif.semester2.daftarBulan.map((b, idx) => (
                  <tr key={`smt2-${b.bulan}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 text-center text-slate-400 text-xs">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">{b.bulan}</td>
                    <td className="py-2.5 px-4 text-center font-medium">{b.jumlahMinggu}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-emerald-700 bg-emerald-50/30">
                      {b.mingguEfektif}
                    </td>
                    <td className="py-2.5 px-4 text-center font-medium text-rose-600 bg-rose-50/30">
                      {b.mingguTidakEfektif}
                    </td>
                    <td className="py-2.5 px-4 text-xs text-slate-500">
                      {b.keterangan || <span className="text-slate-300 italic">-</span>}
                    </td>
                  </tr>
                ))}
                {/* Subtotal Semester 2 */}
                <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={2} className="py-2.5 px-4 text-right">
                    Jumlah Semester 2:
                  </td>
                  <td className="py-2.5 px-4 text-center">{mingguEfektif.semester2.totalMinggu}</td>
                  <td className="py-2.5 px-4 text-center text-emerald-800">
                    {mingguEfektif.semester2.totalMingguEfektif}
                  </td>
                  <td className="py-2.5 px-4 text-center text-rose-700">
                    {mingguEfektif.semester2.totalMingguTidakEfektif}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">
                    JP Efektif Smt 2:{" "}
                    <span className="text-emerald-700 font-extrabold text-sm">
                      {mingguEfektif.semester2.jpEfektif} JP
                    </span>{" "}
                    ({mingguEfektif.semester2.totalMingguEfektif} mg &times;{" "}
                    {initialData.penugasan.mapel.jp_per_minggu} JP)
                  </td>
                </tr>

                {/* Grand Total 1 Tahun */}
                <tr className="bg-emerald-900 text-white font-extrabold text-sm border-t-2 border-emerald-950">
                  <td colSpan={2} className="py-3 px-4 text-right uppercase tracking-wider">
                    Total 1 Tahun Pelajaran:
                  </td>
                  <td className="py-3 px-4 text-center">{mingguEfektif.totalTahun.totalMinggu}</td>
                  <td className="py-3 px-4 text-center text-emerald-200">
                    {mingguEfektif.totalTahun.totalMingguEfektif}
                  </td>
                  <td className="py-3 px-4 text-center text-rose-200">
                    {mingguEfektif.totalTahun.totalMingguTidakEfektif}
                  </td>
                  <td className="py-3 px-4 text-xs text-emerald-100">
                    Total Jam Efektif:{" "}
                    <span className="text-white font-black text-base underline decoration-emerald-400">
                      {mingguEfektif.totalTahun.jpEfektif} JP
                    </span>{" "}
                    ({mingguEfektif.totalTahun.totalMingguEfektif} mg &times;{" "}
                    {initialData.penugasan.mapel.jp_per_minggu} JP)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Kotak Ringkasan JP Efektif */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-slate-50 border-t border-slate-200 text-center">
            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                JP Efektif Semester 1
              </span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {jpEfektifSmt1} <span className="text-xs font-normal text-slate-500">JP</span>
              </div>
              <span className="text-[11px] text-slate-500">
                {mingguEfektif.semester1.totalMingguEfektif} minggu efektif &times;{" "}
                {initialData.penugasan.mapel.jp_per_minggu} JP
              </span>
            </div>

            <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                JP Efektif Semester 2
              </span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {jpEfektifSmt2} <span className="text-xs font-normal text-slate-500">JP</span>
              </div>
              <span className="text-[11px] text-slate-500">
                {mingguEfektif.semester2.totalMingguEfektif} minggu efektif &times;{" "}
                {initialData.penugasan.mapel.jp_per_minggu} JP
              </span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 shadow-2xs">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                Total JP Efektif Setahun
              </span>
              <div className="text-2xl font-black text-emerald-900 mt-1">
                {grandTotalJpEfektif} <span className="text-xs font-normal text-emerald-700">JP</span>
              </div>
              <span className="text-[11px] text-emerald-700">
                {mingguEfektif.totalTahun.totalMingguEfektif} minggu efektif &times;{" "}
                {initialData.penugasan.mapel.jp_per_minggu} JP
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* BAGIAN 2: INDIKATOR EVALUASI KESEIMBANGAN JP */}
      {/* ========================================================================= */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-600" />
              Indikator Evaluasi Alokasi Waktu Pembelajaran
            </CardTitle>
            <Badge variant="outline" className="border-slate-200 text-xs">
              Total Terdistribusi: {grandTotalJpTerpakai} / {grandTotalJpEfektif} JP (Sisa {grandTotalSisaJp} JP)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Indikator Semester 1 */}
            <div
              className={`p-4 rounded-xl border ${
                isOverallocatedSmt1
                  ? "bg-rose-50/60 border-rose-200"
                  : isUnderallocatedSmt1
                  ? "bg-amber-50/60 border-amber-200"
                  : "bg-emerald-50/60 border-emerald-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-900">Semester 1 (Ganjil)</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200">
                  {jpTerpakaiSmt1} / {jpEfektifSmt1} JP
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full transition-all duration-300 ${
                    isOverallocatedSmt1
                      ? "bg-rose-500"
                      : isUnderallocatedSmt1
                      ? "bg-amber-500"
                      : "bg-emerald-600"
                  }`}
                  style={{
                    width: `${
                      jpEfektifSmt1 > 0 ? Math.min(100, (jpTerpakaiSmt1 / jpEfektifSmt1) * 100) : 0
                    }%`,
                  }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                {isOverallocatedSmt1 ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="text-rose-700 font-medium">
                      Kelebihan {Math.abs(sisaJpSmt1)} JP! Alokasi waktu melebihi jam efektif semester 1.
                    </span>
                  </>
                ) : isUnderallocatedSmt1 ? (
                  <>
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-amber-800 font-medium">
                      Sisa {sisaJpSmt1} JP (&gt;20%). Disarankan menyisihkan 2–4 JP untuk Asesmen Sumatif / Cadangan.
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-emerald-800 font-medium">
                      Alokasi seimbang (sisa {sisaJpSmt1} JP aman untuk cadangan).
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Indikator Semester 2 */}
            <div
              className={`p-4 rounded-xl border ${
                isOverallocatedSmt2
                  ? "bg-rose-50/60 border-rose-200"
                  : isUnderallocatedSmt2
                  ? "bg-amber-50/60 border-amber-200"
                  : "bg-emerald-50/60 border-emerald-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-slate-900">Semester 2 (Genap)</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200">
                  {jpTerpakaiSmt2} / {jpEfektifSmt2} JP
                </span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full transition-all duration-300 ${
                    isOverallocatedSmt2
                      ? "bg-rose-500"
                      : isUnderallocatedSmt2
                      ? "bg-amber-500"
                      : "bg-emerald-600"
                  }`}
                  style={{
                    width: `${
                      jpEfektifSmt2 > 0 ? Math.min(100, (jpTerpakaiSmt2 / jpEfektifSmt2) * 100) : 0
                    }%`,
                  }}
                />
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                {isOverallocatedSmt2 ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="text-rose-700 font-medium">
                      Kelebihan {Math.abs(sisaJpSmt2)} JP! Alokasi waktu melebihi jam efektif semester 2.
                    </span>
                  </>
                ) : isUnderallocatedSmt2 ? (
                  <>
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-amber-800 font-medium">
                      Sisa {sisaJpSmt2} JP (&gt;20%). Disarankan menyisihkan 2–4 JP untuk Asesmen Sumatif / Cadangan.
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-emerald-800 font-medium">
                      Alokasi seimbang (sisa {sisaJpSmt2} JP aman untuk cadangan).
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Saran Pedagogis KBC Callout */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3 text-xs text-slate-700">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 block">
                Saran Pedagogis Kurikulum Berbasis Cinta (KBC):
              </span>
              <span>
                Selalu sisihkan 2–4 JP pada setiap akhir semester untuk pelaksanaan Asesmen Sumatif Akhir Semester
                (SAS/SAT) serta program pengayaan dan remedial (kasih sayang pendidik kepada murid).
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* BAGIAN 3: DISTRIBUSI ALOKASI WAKTU (PROGRAM TAHUNAN) */}
      {/* ========================================================================= */}
      <Card className="border-slate-200/90 shadow-sm">
        <CardHeader className="bg-slate-50/70 border-b border-slate-100 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                Distribusi Alokasi Waktu (Program Tahunan)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Otomatis disinkronkan dari Alur Tujuan Pembelajaran (ATP). Alokasi JP dan keterangan dapat disesuaikan
                secara inline.
              </CardDescription>
            </div>

            {/* Filter Semester & Tambah Cadangan */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedSemesterTab("all")}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    selectedSemesterTab === "all"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Semua ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSemesterTab("1")}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    selectedSemesterTab === "1"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Smt 1 ({items.filter((it) => it.semester === 1).length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSemesterTab("2")}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    selectedSemesterTab === "2"
                      ? "bg-emerald-600 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Smt 2 ({items.filter((it) => it.semester === 2).length})
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAddCustomItem(selectedSemesterTab === "2" ? 2 : 1, "Asesmen Sumatif Akhir Semester", 2)}
                className="text-xs border-dashed border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              >
                <Plus className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Tambah Alokasi Asesmen / Cadangan
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">Belum Ada Tujuan Pembelajaran Terdistribusi</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                Dokumen Prota ini belum memiliki item distribusi. Klik tombol di bawah untuk menyinkronkan daftar TP
                secara otomatis dari Alur Tujuan Pembelajaran (ATP).
              </p>
              <Button
                onClick={() => setShowSyncDialog(true)}
                disabled={!initialData.adaDataAtp}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Tarik Data dari ATP Sekarang
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-3 w-12 text-center">Urutan</th>
                    <th className="py-3 px-3 w-24 text-center">Semester</th>
                    <th className="py-3 px-3 w-24">Kode TP</th>
                    <th className="py-3 px-4 min-w-[240px]">Tujuan Pembelajaran (TP)</th>
                    <th className="py-3 px-4 min-w-[180px]">Materi Pokok</th>
                    <th className="py-3 px-3 w-36">Topik Panca Cinta</th>
                    <th className="py-3 px-3 w-28 text-center">Alokasi (JP)</th>
                    <th className="py-3 px-3 min-w-[150px]">Keterangan</th>
                    <th className="py-3 px-3 w-24 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredItems.map((item) => {
                    // Cari indeks asli di array items untuk mutasi
                    const actualIndex = items.findIndex((it) => it === item);

                    return (
                      <tr key={`item-${actualIndex}-${item.kode_tp}`} className="hover:bg-slate-50/80 transition-colors">
                        {/* Tombol Urutan Naik / Turun */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveItem(actualIndex, "up")}
                              disabled={actualIndex === 0}
                              className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                              title="Pindahkan ke atas"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-semibold text-slate-700">{item.urutan}</span>
                            <button
                              type="button"
                              onClick={() => handleMoveItem(actualIndex, "down")}
                              disabled={actualIndex === items.length - 1}
                              className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                              title="Pindahkan ke bawah"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Semester Dropdown */}
                        <td className="py-3 px-3 text-center">
                          <select
                            value={item.semester}
                            onChange={(e) => handleSemesterChange(actualIndex, Number(e.target.value) as 1 | 2)}
                            className="text-xs font-semibold rounded border border-slate-200 bg-white py-1 px-1.5 focus:outline-emerald-500"
                          >
                            <option value={1}>Smt 1</option>
                            <option value={2}>Smt 2</option>
                          </select>
                        </td>

                        {/* Kode TP */}
                        <td className="py-3 px-3 font-semibold text-slate-900 text-xs">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                            {item.kode_tp}
                          </span>
                        </td>

                        {/* Tujuan Pembelajaran Teks */}
                        <td className="py-3 px-4 text-xs text-slate-700 leading-relaxed">
                          {item.tujuan_pembelajaran_teks}
                        </td>

                        {/* Materi Pokok */}
                        <td className="py-3 px-4 text-xs font-medium text-slate-800">
                          {item.materi_pokok}
                        </td>

                        {/* Topik Panca Cinta Badge */}
                        <td className="py-3 px-3 text-xs">
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200">
                            {item.panca_cinta_nama}
                          </Badge>
                        </td>

                        {/* Inline Edit Alokasi JP */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              min={1}
                              max={40}
                              value={item.alokasi_jp}
                              onChange={(e) => handleJpChange(actualIndex, Number(e.target.value))}
                              className="w-16 h-8 text-center text-xs font-bold bg-white"
                            />
                            <span className="text-xs text-slate-500">JP</span>
                          </div>
                        </td>

                        {/* Inline Edit Keterangan */}
                        <td className="py-3 px-3">
                          <Input
                            type="text"
                            placeholder="Catatan alokasi..."
                            value={item.keterangan || ""}
                            onChange={(e) => handleKeteranganChange(actualIndex, e.target.value)}
                            className="h-8 text-xs bg-white"
                          />
                        </td>

                        {/* Aksi Hapus */}
                        <td className="py-3 px-3 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteItem(actualIndex)}
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Hapus baris"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Floating Bottom Bar Simpan */}
      <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-800">Total Alokasi JP:</span>
            <span className="text-sm font-black text-emerald-700">{grandTotalJpTerpakai} JP</span>
          </div>
          <span>•</span>
          <div>
            Smt 1: <span className="font-bold">{jpTerpakaiSmt1}</span>/{jpEfektifSmt1} JP
          </div>
          <span>•</span>
          <div>
            Smt 2: <span className="font-bold">{jpTerpakaiSmt2}</span>/{jpEfektifSmt2} JP
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

      {/* Dialog Konfirmasi Sinkronkan Ulang dari ATP */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <RefreshCw className="w-5 h-5 text-emerald-600" />
              Sinkronkan Ulang dari ATP?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Tindakan ini akan membaca kembali seluruh Tujuan Pembelajaran (TP) yang sudah dirumuskan dan diurutkan
              pada modul ATP, lalu memperbarui tabel distribusi Prota di bawah ini.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Catatan: Alokasi JP atau baris tambahan manual yang sudah Anda buat sebelumnya akan diperbarui sesuai urutan
              dan alokasi JP terkini di ATP.
            </span>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setShowSyncDialog(false)}>
              Batal
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSyncFromAtp}
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Ya, Sinkronkan Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
