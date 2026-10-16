"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  saveAtpOrderAndStatusAction,
  type TujuanPembelajaranPayload,
  type AnalisisCpItemPayload,
  type TargetJpInfo,
} from "../actions";
import {
  METODE_PENGURUTAN_ATP,
  type InfoMetodePengurutan,
} from "@/lib/kbc-pedagogi";
import type {
  DocStatus,
  MetodePengurutanAtp,
} from "@/types/database";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Save,
  Send,
  Eye,
  CheckCircle2,
  Sparkles,
  Info,
  Calendar,
  Layers,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface Step3Props {
  penugasanId: string;
  tingkatKelas: 7 | 8 | 9;
  mapel?: {
    nama: string;
    kode: string;
    jp_per_minggu: number;
  };
  cpElements: Array<{
    id: string;
    elemen: string;
  }>;
  analisisList?: AnalisisCpItemPayload[];
  initialTpList: TujuanPembelajaranPayload[];
  initialMetode: MetodePengurutanAtp;
  initialStatus: DocStatus;
  targetJp?: TargetJpInfo;
  onPrev: () => void;
  onTpUpdated?: (updatedTpList: TujuanPembelajaranPayload[]) => void;
}

export function Step3Atp({
  penugasanId,
  tingkatKelas,
  mapel,
  cpElements,
  analisisList,
  initialTpList,
  initialMetode,
  initialStatus,
  targetJp,
  onPrev,
  onTpUpdated,
}: Step3Props) {
  const router = useRouter();

  // Peta elemen CP
  const cpMap = new Map<string, string>();
  cpElements.forEach((cp) => cpMap.set(cp.id, cp.elemen));

  // Peta analisis_cp_id ke nama Elemen CP
  const analisisToCpNameMap = new Map<string, string>();
  (analisisList || []).forEach((a) => {
    const name = cpMap.get(a.cp_id) || "Elemen CP";
    if (a.id) analisisToCpNameMap.set(a.id, name);
    if (a.cp_id) analisisToCpNameMap.set(a.cp_id, name);
  });

  // State daftar TP berurutan
  const [orderedItems, setOrderedItems] = useState<TujuanPembelajaranPayload[]>(() => {
    // Sort awal berdasarkan urutan yang ada
    const sorted = [...initialTpList].sort((a, b) => (a.urutan || 1) - (b.urutan || 1));
    return sorted.map((tp, idx) => ({
      ...tp,
      urutan: idx + 1,
      kode_tp: `${tingkatKelas}.${idx + 1}`,
    }));
  });

  // Sinkronkan state orderedItems jika initialTpList berubah dari luar (misal dari Step 1 / Step 2)
  useEffect(() => {
    const sorted = [...initialTpList].sort((a, b) => (a.urutan || 1) - (b.urutan || 1));
    setOrderedItems(
      sorted.map((tp, idx) => ({
        ...tp,
        urutan: idx + 1,
        kode_tp: `${tingkatKelas}.${idx + 1}`,
      }))
    );
  }, [initialTpList, tingkatKelas]);

  const [metode, setMetode] = useState<MetodePengurutanAtp>(
    initialMetode || "konkret_ke_abstrak"
  );
  const [docStatus, setDocStatus] = useState<DocStatus>(initialStatus || "draf");

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selaraskan kembali urutan TP mengikuti urutan CP dari Langkah 1 & 2
  const handleResetToCpOrder = () => {
    if (!analisisList || analisisList.length === 0) return;

    const orderMap = new Map<string, number>();
    analisisList.forEach((a, idx) => {
      if (a.id) orderMap.set(a.id, idx);
      if (a.cp_id) orderMap.set(a.cp_id, idx);
    });

    const sorted = [...orderedItems].sort((a, b) => {
      const orderA = orderMap.has(a.analisis_cp_id) ? orderMap.get(a.analisis_cp_id)! : 9999;
      const orderB = orderMap.has(b.analisis_cp_id) ? orderMap.get(b.analisis_cp_id)! : 9999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.urutan || 1) - (b.urutan || 1);
    });

    const reindexed = sorted.map((item, idx) => ({
      ...item,
      urutan: idx + 1,
      kode_tp: `${tingkatKelas}.${idx + 1}`,
    }));

    setOrderedItems(reindexed);
    if (onTpUpdated) {
      onTpUpdated(reindexed);
    }
    setSaveSuccess("Urutan alur ATP berhasil diselaraskan kembali mengikuti urutan Capaian Pembelajaran!");
  };

  // Reorder TP: geser item ke atas / ke bawah
  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedItems.length) return;

    const copy = [...orderedItems];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    // Perbarui kode_tp dan urutan otomatis
    const reindexed = copy.map((item, idx) => ({
      ...item,
      urutan: idx + 1,
      kode_tp: `${tingkatKelas}.${idx + 1}`,
    }));

    setOrderedItems(reindexed);
    if (onTpUpdated) {
      onTpUpdated(reindexed);
    }
    setSaveSuccess(null);
  };

  // Ubah semester suatu TP
  const handleSemesterChange = (index: number, smt: 1 | 2) => {
    const copy = [...orderedItems];
    copy[index] = { ...copy[index], semester: smt };
    setOrderedItems(copy);
    setSaveSuccess(null);
  };

  // Hitung total JP
  const totalJpSmt1 = orderedItems
    .filter((tp) => tp.semester === 1)
    .reduce((acc, cur) => acc + (Number(cur.alokasi_jp) || 0), 0);

  const totalJpSmt2 = orderedItems
    .filter((tp) => tp.semester === 2)
    .reduce((acc, cur) => acc + (Number(cur.alokasi_jp) || 0), 0);

  const grandTotalJp = totalJpSmt1 + totalJpSmt2;

  // Info metode terpilih
  const selectedMetodeInfo: InfoMetodePengurutan =
    METODE_PENGURUTAN_ATP.find((m) => m.id === metode) || METODE_PENGURUTAN_ATP[0];

  // Handler Simpan (Draf / Ajukan)
  const handleSave = async (submitForValidation: boolean = false) => {
    const nextStatus: DocStatus = submitForValidation ? "diajukan" : "draf";
    if (submitForValidation) setIsSubmitting(true);
    else setIsSaving(true);

    setErrorMessage(null);
    setSaveSuccess(null);

    const payload = orderedItems.map((item) => ({
      id: item.id!,
      urutan: item.urutan,
      kode_tp: item.kode_tp,
      semester: item.semester,
    }));

    const res = await saveAtpOrderAndStatusAction(
      penugasanId,
      payload,
      metode,
      nextStatus
    );

    setIsSaving(false);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMessage(res.error || "Gagal menyimpan ATP.");
      return;
    }

    setDocStatus(nextStatus);
    setSaveSuccess(
      submitForValidation
        ? "ATP berhasil diajukan untuk validasi ke Waka Kurikulum / Kepala Madrasah!"
        : "Alur Tujuan Pembelajaran (ATP) berhasil disimpan sebagai draf!"
    );

    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Banner Ringkasan Langkah 3 */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-300" />
              <h3 className="font-semibold text-lg text-white">
                Langkah 3: Penyusunan Alur Tujuan Pembelajaran (ATP) {mapel ? `• ${mapel.nama}` : ""}
              </h3>
            </div>
            <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
              Urutkan Tujuan Pembelajaran menggunakan tombol panah Naik / Turun. Kode TP ({tingkatKelas}.1, {tingkatKelas}.2, ...)
              akan otomatis diperbarui secara kronologis. Tentukan pendekatan pengurutan pedagogis dan semester.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/atp/${penugasanId}/preview`}
              className={buttonVariants({
                variant: "secondary",
                size: "sm",
                className: "bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-semibold shadow-xs",
              })}
            >
              <Eye className="w-4 h-4 mr-1.5 text-emerald-700" />
              Lihat Pratinjau Dokumen ATP
            </Link>
          </div>
        </div>
      </div>

      {/* Pesan Feedback */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-sm flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Bagian 1: Pemilihan Metode Pengurutan ATP */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <label className="text-sm font-bold text-slate-900 block flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Metode Pengurutan ATP (Sesuai Panduan Pembelajaran Kemenag)
            </label>
            <p className="text-xs text-slate-500">
              Pilih prinsip didaktis yang melandasi perurutan alur materi pembelajaran pada Fase ini.
            </p>
          </div>

          <div className="w-full md:w-72">
            <Select
              value={metode}
              onValueChange={(val) => {
                if (val) setMetode(val as MetodePengurutanAtp);
              }}
            >
              <SelectTrigger className="w-full text-xs font-medium bg-slate-50 border-slate-300">
                <SelectValue placeholder="Pilih Metode Pengurutan" />
              </SelectTrigger>
              <SelectContent>
                {METODE_PENGURUTAN_ATP.map((item) => (
                  <SelectItem key={item.id} value={item.id} className="text-xs">
                    {item.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Kartu Penjelasan Metode Terpilih */}
        <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-3.5 text-xs text-slate-700 space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-emerald-950">
            <Info className="w-4 h-4 text-emerald-700" />
            <span>{selectedMetodeInfo.nama}: {selectedMetodeInfo.ringkasan}</span>
          </div>
          <p className="text-slate-600 leading-relaxed pl-6">
            {selectedMetodeInfo.penjelasan}
          </p>
          <div className="text-[11px] text-emerald-800 bg-white/70 p-2 rounded border border-emerald-100 font-mono ml-6">
            {selectedMetodeInfo.contoh}
          </div>
        </div>
      </div>

      {/* Bagian 2: Daftar Reorderable TP */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              Daftar Alur Tujuan Pembelajaran Terurut ({orderedItems.length} TP)
            </h4>
            <span className="text-xs text-slate-500">
              Gunakan tombol panah untuk menaikkan/menurunkan posisi atau selaraskan langsung dengan urutan CP.
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetToCpOrder}
            className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50 shrink-0 cursor-pointer self-start sm:self-auto"
            title="Urutkan alur TP agar otomatis persis mengikuti urutan Capaian Pembelajaran"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
            Selaraskan dengan Urutan CP
          </Button>
        </div>

        {orderedItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-xs text-slate-500 mb-3">
              Belum ada Tujuan Pembelajaran yang dapat disusun. Silakan kembali ke Langkah 2.
            </p>
            <Button variant="outline" size="sm" onClick={onPrev}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Rumuskan TP
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orderedItems.map((tp, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === orderedItems.length - 1;

              return (
                <div
                  key={tp.id || idx}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs hover:border-emerald-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Kolom Reorder Controls + Nomor */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={isFirst}
                        onClick={() => moveItem(idx, "up")}
                        className="h-7 w-7 text-slate-600 hover:text-emerald-700 disabled:opacity-30"
                        title="Geser ke Atas"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={isLast}
                        onClick={() => moveItem(idx, "down")}
                        className="h-7 w-7 text-slate-600 hover:text-emerald-700 disabled:opacity-30"
                        title="Geser ke Bawah"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="text-center w-14">
                      <div className="font-mono font-bold text-sm bg-emerald-700 text-white py-1 px-2 rounded-md shadow-xs">
                        {tp.kode_tp}
                      </div>
                      <span className="text-[10px] text-slate-400">Urutan #{idx + 1}</span>
                    </div>
                  </div>

                  {/* Isi TP & Deskripsi */}
                  <div className="flex-1 space-y-1.5">
                    <p className="text-slate-900 text-xs md:text-sm font-medium leading-relaxed">
                      {tp.deskripsi}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {analisisToCpNameMap.get(tp.analisis_cp_id) && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-semibold">
                          Elemen: {analisisToCpNameMap.get(tp.analisis_cp_id)}
                        </span>
                      )}
                      {tp.lingkup_materi && (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                          Materi: <strong className="font-semibold">{tp.lingkup_materi}</strong>
                        </span>
                      )}
                      {tp.kktp?.pendekatan && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px]">
                          KKTP: {tp.kktp.pendekatan.replace("_", " ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pengaturan Semester & JP per Baris */}
                  <div className="flex items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 font-medium">Smt:</span>
                      <select
                        value={tp.semester}
                        onChange={(e) =>
                          handleSemesterChange(idx, Number(e.target.value) as 1 | 2)
                        }
                        className="h-7 rounded border border-slate-300 bg-white px-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
                      >
                        <option value={1}>Smt 1</option>
                        <option value={2}>Smt 2</option>
                      </select>
                    </div>

                    <div className="text-center px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="text-[10px] text-blue-700 block font-semibold">Alokasi</span>
                      <span className="text-xs font-bold text-blue-900">{tp.alokasi_jp} JP</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bagian 3: Ringkasan Alokasi JP Semester 1 & 2 vs JP Target Kalender */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              Ringkasan Alokasi JP vs Target Kalender Pendidikan Efektif
            </h4>
            <p className="text-xs text-slate-500">
              Dihitung otomatis dari kalender pendidikan madrasah setelah memotong hari libur dan kegiatan tidak efektif.
            </p>
          </div>
          {targetJp && (
            <Badge variant="outline" className="text-xs bg-white border-slate-300 font-semibold text-slate-800 self-start sm:self-auto">
              Beban Waktu: {targetJp.totalMingguEfektif} Minggu Efektif × {mapel?.jp_per_minggu || 2} JP/mgg
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Semester 1 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Semester 1 (Ganjil)</span>
              {targetJp && (
                <span className="text-[10px] text-slate-400 font-medium">
                  {targetJp.smt1MingguEfektif} mgg efektif
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalJpSmt1} JP</div>
            <div className="text-[11px] text-slate-500 pt-1.5 flex items-center justify-between border-t border-slate-100">
              <span>Target Kalender:</span>
              {targetJp ? (
                <span
                  className={`font-semibold px-1.5 py-0.5 rounded text-xs ${
                    totalJpSmt1 === targetJp.smt1
                      ? "text-emerald-800 bg-emerald-50"
                      : totalJpSmt1 < targetJp.smt1
                      ? "text-amber-800 bg-amber-50"
                      : "text-rose-800 bg-rose-50"
                  }`}
                >
                  {targetJp.smt1} JP (
                  {totalJpSmt1 === targetJp.smt1
                    ? "Tepat"
                    : totalJpSmt1 < targetJp.smt1
                    ? `-${targetJp.smt1 - totalJpSmt1}`
                    : `+${totalJpSmt1 - targetJp.smt1}`}
                  )
                </span>
              ) : (
                <span className="font-medium text-slate-600">—</span>
              )}
            </div>
          </div>

          {/* Semester 2 */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Semester 2 (Genap)</span>
              {targetJp && (
                <span className="text-[10px] text-slate-400 font-medium">
                  {targetJp.smt2MingguEfektif} mgg efektif
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-slate-900">{totalJpSmt2} JP</div>
            <div className="text-[11px] text-slate-500 pt-1.5 flex items-center justify-between border-t border-slate-100">
              <span>Target Kalender:</span>
              {targetJp ? (
                <span
                  className={`font-semibold px-1.5 py-0.5 rounded text-xs ${
                    totalJpSmt2 === targetJp.smt2
                      ? "text-emerald-800 bg-emerald-50"
                      : totalJpSmt2 < targetJp.smt2
                      ? "text-amber-800 bg-amber-50"
                      : "text-rose-800 bg-rose-50"
                  }`}
                >
                  {targetJp.smt2} JP (
                  {totalJpSmt2 === targetJp.smt2
                    ? "Tepat"
                    : totalJpSmt2 < targetJp.smt2
                    ? `-${targetJp.smt2 - totalJpSmt2}`
                    : `+${totalJpSmt2 - targetJp.smt2}`}
                  )
                </span>
              ) : (
                <span className="font-medium text-slate-600">—</span>
              )}
            </div>
          </div>

          {/* Total 1 Tahun Ajaran */}
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-800 font-semibold">Total 1 Tahun Ajaran</span>
              <Badge variant="outline" className="text-[10px] uppercase font-bold bg-white text-emerald-900 border-emerald-200">
                {docStatus}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-emerald-900">
              {grandTotalJp}
              {targetJp ? (
                <span className="text-sm font-normal text-emerald-700 ml-1">
                  / {targetJp.total} JP
                </span>
              ) : (
                " JP"
              )}
            </div>
            <div className="text-[11px] text-emerald-700 pt-1.5 flex items-center justify-between border-t border-emerald-100">
              <span>Kesesuaian:</span>
              {targetJp ? (
                <span
                  className={`font-bold px-1.5 py-0.5 rounded text-xs ${
                    grandTotalJp === targetJp.total
                      ? "text-emerald-800 bg-emerald-100"
                      : grandTotalJp < targetJp.total
                      ? "text-amber-800 bg-amber-100"
                      : "text-rose-800 bg-rose-100"
                  }`}
                >
                  {grandTotalJp === targetJp.total
                    ? "✓ Sesuai Target (100%)"
                    : grandTotalJp < targetJp.total
                    ? `Kurang ${targetJp.total - grandTotalJp} JP`
                    : `Kelebihan ${grandTotalJp - targetJp.total} JP`}
                </span>
              ) : (
                <span className="font-medium text-emerald-800">—</span>
              )}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 italic">
          * Catatan: Distribusi alokasi JP per TP di atas akan langsung tersinkronisasi ke Program Tahunan (Prota) dan Program Semester (Prosem).
        </p>
      </div>

      {/* Action Bar Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          className="border-slate-300 hover:bg-slate-100 w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Rumuskan TP
        </Button>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving || isSubmitting}
            onClick={() => handleSave(false)}
            className="flex-1 sm:flex-none border-slate-300 hover:bg-slate-100"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2 text-slate-600" />
            )}
            Simpan Draf ATP
          </Button>

          <Button
            type="button"
            disabled={isSaving || isSubmitting}
            onClick={() => handleSave(true)}
            className="flex-1 sm:flex-none bg-blue-700 hover:bg-blue-800 text-white font-medium shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Ajukan Validasi ATP
          </Button>

          <Link
            href={`/atp/${penugasanId}/preview`}
            className={buttonVariants({
              className: "flex-1 sm:flex-none bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-sm",
            })}
          >
            <Eye className="w-4 h-4 mr-2" />
            Lihat Pratinjau Dokumen
          </Link>
        </div>
      </div>
    </div>
  );
}
