"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  saveTujuanPembelajaranAction,
  saveAnalisisCpAction,
  type TujuanPembelajaranPayload,
  type AnalisisCpItemPayload,
  type TargetJpInfo,
} from "../actions";
import {
  TAKSONOMI_SOLO,
  TAKSONOMI_BLOOM,
} from "@/lib/kbc-pedagogi";
import type {
  KktpData,
  KktpPendekatan,
} from "@/types/database";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Save,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  BookOpen,
  Calendar,
  Clock,
  Sliders,
  Loader2,
  FileText,
} from "lucide-react";

interface Step2Props {
  penugasanId: string;
  tingkatKelas: 7 | 8 | 9;
  cpElements: Array<{
    id: string;
    elemen: string;
    deskripsi_cp: string;
  }>;
  pancaCintaList: Array<{
    id: string;
    urutan: number;
    kode: string;
    nama: string;
  }>;
  analisisList: AnalisisCpItemPayload[];
  initialTpList: TujuanPembelajaranPayload[];
  kkoList?: Array<{
    tingkat: string;
    nama: string;
    deskripsi: string;
    kata_kerja: string[];
  }>;
  targetJp?: TargetJpInfo;
  onPrev: () => void;
  onNext: () => void;
  onAnalisisUpdated?: (updatedList: AnalisisCpItemPayload[]) => void;
  onTpUpdated?: (updatedTpList: TujuanPembelajaranPayload[]) => void;
}

export function Step2Tp({
  penugasanId,
  tingkatKelas,
  cpElements,
  pancaCintaList,
  analisisList,
  initialTpList,
  kkoList,
  targetJp,
  onPrev,
  onNext,
  onAnalisisUpdated,
  onTpUpdated,
}: Step2Props) {
  // Peta analisis berdasarkan id
  const analisisMap = new Map<string, AnalisisCpItemPayload>();
  analisisList.forEach((a) => {
    if (a.id) analisisMap.set(a.id, a);
  });

  const cpMap = new Map<string, string>();
  cpElements.forEach((cp) => cpMap.set(cp.id, cp.elemen));

  const pancaMap = new Map<string, string>();
  pancaCintaList.forEach((pc) => pancaMap.set(pc.id, pc.nama));

  // State daftar TP
  const [tpList, setTpList] = useState<TujuanPembelajaranPayload[]>(() => {
    if (initialTpList && initialTpList.length > 0) {
      return [...initialTpList];
    }

    // Jika belum ada TP sama sekali, generate default template awal dari tiap analisis
    const defaults: TujuanPembelajaranPayload[] = [];
    analisisList.forEach((a, idx) => {
      if (!a.id) return;
      const pcFirst = a.panca_cinta_ids[0] || pancaCintaList[0]?.id || "";
      const pcNama = pancaMap.get(pcFirst) || "Cinta Allah dan Rasul";
      const materi = a.materi_pokok || "materi pokok";

      defaults.push({
        id: `temp-init-${idx + 1}`,
        analisis_cp_id: a.id,
        kode_tp: `${tingkatKelas}.${idx + 1}`,
        kompetensi: "memahami dan menganalisis",
        lingkup_materi: materi,
        konteks: "dalam konteks keteladanan sehari-hari",
        panca_cinta_ids: a.panca_cinta_ids.length > 0 ? a.panca_cinta_ids : [pcFirst],
        dpl_ids: a.dpl_ids,
        deskripsi: `Murid dapat memahami dan menganalisis ${materi} dalam konteks keteladanan sehari-hari, sebagai wujud ${pcNama}.`,
        semester: 1,
        alokasi_jp: 4,
        urutan: idx + 1,
        kktp: {
          pendekatan: "rubrik",
          rubrik: [
            {
              aspek: "Pemahaman Konsep",
              baru_berkembang: "Belum mampu menjelaskan konsep secara mandiri",
              layak: "Mampu menjelaskan konsep dasar dengan bimbingan",
              cakap: "Mampu menjelaskan dan menganalisis konsep secara mandiri",
              mahir: "Mampu menganalisis mendalam dan menghubungkan dengan nilai Panca Cinta",
            },
          ],
        },
      });
    });

    return defaults;
  });

  const [deletedTpIds, setDeletedTpIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State daftar Analisis CP lokal agar dapat direorder langsung di Langkah 2
  const [currentAnalisisList, setCurrentAnalisisList] = useState<AnalisisCpItemPayload[]>(() => [...analisisList]);

  useEffect(() => {
    setCurrentAnalisisList([...analisisList]);
  }, [analisisList]);

  useEffect(() => {
    if (initialTpList && initialTpList.length > 0) {
      setTpList([...initialTpList]);
    }
  }, [initialTpList]);

  // Handler geser urutan elemen CP langsung di Langkah 2
  const handleMoveElemen = (anIdx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? anIdx - 1 : anIdx + 1;
    if (targetIdx < 0 || targetIdx >= currentAnalisisList.length) return;

    const copy = [...currentAnalisisList];
    const temp = copy[anIdx];
    copy[anIdx] = copy[targetIdx];
    copy[targetIdx] = temp;

    const reorderedAnalisis = copy.map((item, idx) => ({
      ...item,
      urutan: idx + 1,
    }));

    setCurrentAnalisisList(reorderedAnalisis);
    if (onAnalisisUpdated) {
      onAnalisisUpdated(reorderedAnalisis);
    }
  };

  // State Modal KKTP
  const [activeKktpIndex, setActiveKktpIndex] = useState<number | null>(null);
  const [kktpModalOpen, setKktpModalOpen] = useState(false);
  const [currentKktp, setCurrentKktp] = useState<KktpData>({ pendekatan: "rubrik" });

  // Update TP field
  const updateTpField = <K extends keyof TujuanPembelajaranPayload>(
    index: number,
    field: K,
    value: TujuanPembelajaranPayload[K]
  ) => {
    setTpList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
    setSaveSuccess(false);
  };

  // Generator Rumusan Otomatis TP
  const generateFormula = (index: number) => {
    const tp = tpList[index];
    if (!tp) return;

    const kompetensi = (tp.kompetensi || "memahami").trim();
    const lingkupMateri = (tp.lingkup_materi || "materi").trim();
    const konteks = (tp.konteks || "").trim();

    // Dapatkan nama topik Panca Cinta terpilih
    const firstPcId = tp.panca_cinta_ids?.[0];
    const pcNama = firstPcId ? pancaMap.get(firstPcId) : "Cinta Ilmu dan Kebajikan";

    let formula = `Murid dapat ${kompetensi} ${lingkupMateri}`;
    if (konteks) {
      formula += ` ${konteks}`;
    }
    formula += `, sebagai wujud ${pcNama || "pengamalan nilai luhur"}.`;

    updateTpField(index, "deskripsi", formula);
  };

  // Tambah TP baru untuk suatu analisis elemen
  const handleAddTp = (analisisId: string) => {
    const an = analisisMap.get(analisisId);
    const pcFirst = an?.panca_cinta_ids?.[0] || pancaCintaList[0]?.id || "";
    const pcNama = pancaMap.get(pcFirst) || "Cinta Ilmu";
    const nextUrutan = tpList.length + 1;

    const newTp: TujuanPembelajaranPayload = {
      id: `temp-add-${nextUrutan}-${tpList.length + 1}`,
      analisis_cp_id: analisisId,
      kode_tp: `${tingkatKelas}.${nextUrutan}`,
      kompetensi: "menganalisis dan menerapkan",
      lingkup_materi: an?.materi_pokok || "",
      konteks: "dalam kehidupan nyata",
      panca_cinta_ids: an?.panca_cinta_ids && an.panca_cinta_ids.length > 0 ? an.panca_cinta_ids : [pcFirst],
      dpl_ids: an?.dpl_ids || [],
      deskripsi: `Murid dapat menganalisis dan menerapkan ${an?.materi_pokok || "materi"} dalam kehidupan nyata, sebagai wujud ${pcNama}.`,
      semester: 1,
      alokasi_jp: 4,
      urutan: nextUrutan,
      kktp: {
        pendekatan: "rubrik",
        rubrik: [
          {
            aspek: "Penguasaan Kompetensi",
            baru_berkembang: "Belum mampu menerapkan konsep",
            layak: "Mampu menerapkan konsep dengan arahan",
            cakap: "Mampu menerapkan secara mandiri",
            mahir: "Mampu mengkreasi dan merefleksikan nilai secara mendalam",
          },
        ],
      },
    };

    setTpList((prev) => [...prev, newTp]);
  };

  // Hapus TP
  const handleDeleteTp = (index: number) => {
    const target = tpList[index];
    if (target.id && !target.id.startsWith("temp-")) {
      setDeletedTpIds((prev) => [...prev, target.id!]);
    }
    setTpList((prev) => prev.filter((_, i) => i !== index));
  };

  // Validasi Lunak (Soft Warnings):
  const getSoftWarnings = (tp: TujuanPembelajaranPayload) => {
    const warnings: string[] = [];
    const text = (tp.deskripsi || "").toLowerCase();
    const kompetensiText = (tp.kompetensi || "").toLowerCase();

    // 1. Cek integrasi Panca Cinta
    const hasPancaKeyword =
      text.includes("cinta") ||
      text.includes("wujud") ||
      (tp.panca_cinta_ids && tp.panca_cinta_ids.length > 0);

    if (!hasPancaKeyword) {
      warnings.push("TP belum memuat konteks penanaman nilai Panca Cinta.");
    }

    // 2. Cek apakah hanya kognitif rendah tanpa sikap/keterampilan
    const kognitifRendahOnly =
      (kompetensiText.includes("menyebutkan") ||
        kompetensiText.includes("menghafal") ||
        kompetensiText.includes("mengingat")) &&
      !kompetensiText.includes("menganalisis") &&
      !kompetensiText.includes("mempraktikkan") &&
      !kompetensiText.includes("menerapkan") &&
      !kompetensiText.includes("menghayati") &&
      !kompetensiText.includes("merefleksi");

    if (kognitifRendahOnly) {
      warnings.push(
        "TP masih terbatas pada kata kerja pengetahuan dasar (C1/Unistruktural). Pertimbangkan menambahkan aspek penerapan, analisis, atau sikap."
      );
    }

    return warnings;
  };

  // Buka Dialog KKTP
  const handleOpenKktpModal = (index: number) => {
    setActiveKktpIndex(index);
    const existing = tpList[index]?.kktp;
    if (existing && existing.pendekatan) {
      setCurrentKktp(JSON.parse(JSON.stringify(existing)));
    } else {
      setCurrentKktp({
        pendekatan: "rubrik",
        rubrik: [
          {
            aspek: "Ketercapaian Tujuan Pembelajaran",
            baru_berkembang: "Memerlukan bimbingan intensif dalam menguasai kompetensi",
            layak: "Mampu mencapai kriteria dasar dengan bantuan sesekali",
            cakap: "Mencapai seluruh kompetensi secara mandiri dan konsisten",
            mahir: "Mencapai kompetensi melampaui standar dan mampu membimbing rekan",
          },
        ],
      });
    }
    setKktpModalOpen(true);
  };

  // Simpan KKTP dari modal ke TP
  const handleSaveKktpModal = () => {
    if (activeKktpIndex !== null) {
      updateTpField(activeKktpIndex, "kktp", currentKktp);
    }
    setKktpModalOpen(false);
  };

  // Simpan Semua TP ke Server
  const handleSave = async (proceedNext: boolean = false) => {
    setIsSaving(true);
    setErrorMessage(null);

    // 1. Simpan Analisis CP terlebih dahulu jika ada, untuk memastikan seluruh UUID analisis_cp sudah tersimpan di DB
    let updatedAnalisis = currentAnalisisList;
    if (currentAnalisisList && currentAnalisisList.length > 0) {
      const anRes = await saveAnalisisCpAction(penugasanId, currentAnalisisList);
      if (anRes.success && anRes.data && anRes.data.length > 0) {
        updatedAnalisis = anRes.data;
        setCurrentAnalisisList(anRes.data);
        if (onAnalisisUpdated) onAnalisisUpdated(anRes.data);
      }
    }

    // Pemetaan ID sementara atau CP ID ke UUID analisis_cp resmi
    const anIdMap = new Map<string, string>();
    updatedAnalisis.forEach((a, idx) => {
      if (a.id) {
        anIdMap.set(`temp-${idx}`, a.id);
        anIdMap.set(a.cp_id, a.id);
        anIdMap.set(a.id, a.id);
      }
    });

    // 2. Pastikan kode_tp terurut dan analisis_cp_id adalah UUID resmi
    const payload = tpList.map((tp, idx) => {
      let resolvedId = tp.analisis_cp_id;
      if (anIdMap.has(resolvedId)) {
        resolvedId = anIdMap.get(resolvedId)!;
      } else if (resolvedId?.startsWith("temp-")) {
        const match = resolvedId.match(/^temp-(\d+)/);
        if (match) {
          const mIdx = parseInt(match[1], 10);
          resolvedId = updatedAnalisis[mIdx]?.id || updatedAnalisis[0]?.id || resolvedId;
        }
      } else if (!resolvedId && updatedAnalisis[0]?.id) {
        resolvedId = updatedAnalisis[0].id;
      }

      return {
        ...tp,
        analisis_cp_id: resolvedId,
        urutan: idx + 1,
        kode_tp: tp.kode_tp || `${tingkatKelas}.${idx + 1}`,
      };
    });

    const res = await saveTujuanPembelajaranAction(penugasanId, payload, deletedTpIds);
    setIsSaving(false);

    if (!res.success) {
      setErrorMessage(res.error || "Gagal menyimpan TP.");
      return;
    }

    // Perbarui state lokal dengan payload yang sudah ber-UUID resmi
    setTpList(payload);
    if (onTpUpdated) {
      onTpUpdated(payload);
    }

    setSaveSuccess(true);
    if (proceedNext) {
      onNext();
    }
  };

  // Perhitungan akumulasi JP terisi di Step 2
  const currentSmt1Jp = tpList
    .filter((tp) => tp.semester === 1)
    .reduce((acc, cur) => acc + (Number(cur.alokasi_jp) || 0), 0);

  const currentSmt2Jp = tpList
    .filter((tp) => tp.semester === 2)
    .reduce((acc, cur) => acc + (Number(cur.alokasi_jp) || 0), 0);

  const currentTotalJp = currentSmt1Jp + currentSmt2Jp;

  return (
    <div className="space-y-8">
      {/* Banner Panduan TP */}
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-semibold text-emerald-950 text-base">
              Langkah 2: Perumusan Tujuan Pembelajaran (TP) Berbasis KBC
            </h3>
            <p className="text-xs text-emerald-800 leading-relaxed max-w-3xl">
              Rumuskan TP dengan memecahnya ke dalam 3 komponen utama:{" "}
              <span className="font-bold">Kompetensi (KKO SOLO / Bloom)</span>,{" "}
              <span className="font-bold">Lingkup Materi</span>, dan{" "}
              <span className="font-bold">Konteks Nilai Panca Cinta</span>. Generator rumusan otomatis akan
              membantu menyusun kalimat yang utuh dan tetap dapat Anda modifikasi secara manual.
            </p>
          </div>
        </div>
        <Link
          href={`/atp/${penugasanId}/preview-tp`}
          target="_blank"
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "bg-white border-amber-300 text-amber-800 hover:bg-amber-50 font-semibold text-xs h-8 px-3 shrink-0 shadow-2xs",
          })}
        >
          <FileText className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
          Dokumen / Cetak TP
        </Link>
      </div>

      {/* Tracker Beban & Target JP Kalender */}
      {targetJp && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <h4 className="text-xs font-bold text-slate-900">
                Distribusi Alokasi Waktu Pembelajaran (Target Kalender Efektif)
              </h4>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs bg-slate-50 border-slate-300 font-semibold text-slate-800">
                Target: {targetJp.total} JP / Tahun ({targetJp.totalMingguEfektif} Mgg Efektif)
              </Badge>
              {currentTotalJp === targetJp.total ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
                  ✓ Sesuai Target (100%)
                </Badge>
              ) : currentTotalJp < targetJp.total ? (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs">
                  Kurang {targetJp.total - currentTotalJp} JP
                </Badge>
              ) : (
                <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-xs">
                  Kelebihan {currentTotalJp - targetJp.total} JP
                </Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Semester 1 */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-slate-500 font-medium block">Semester 1 (Ganjil):</span>
                <span className="text-[10px] text-slate-400">Target: {targetJp.smt1} JP ({targetJp.smt1MingguEfektif} mgg)</span>
              </div>
              <div className="text-right">
                <span className={`font-bold ${currentSmt1Jp === targetJp.smt1 ? "text-emerald-700" : currentSmt1Jp > targetJp.smt1 ? "text-rose-700" : "text-slate-800"}`}>
                  {currentSmt1Jp} / {targetJp.smt1} JP
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {currentSmt1Jp === targetJp.smt1 ? "Tepat" : currentSmt1Jp < targetJp.smt1 ? `-${targetJp.smt1 - currentSmt1Jp}` : `+${currentSmt1Jp - targetJp.smt1}`}
                </span>
              </div>
            </div>

            {/* Semester 2 */}
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-slate-500 font-medium block">Semester 2 (Genap):</span>
                <span className="text-[10px] text-slate-400">Target: {targetJp.smt2} JP ({targetJp.smt2MingguEfektif} mgg)</span>
              </div>
              <div className="text-right">
                <span className={`font-bold ${currentSmt2Jp === targetJp.smt2 ? "text-emerald-700" : currentSmt2Jp > targetJp.smt2 ? "text-rose-700" : "text-slate-800"}`}>
                  {currentSmt2Jp} / {targetJp.smt2} JP
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {currentSmt2Jp === targetJp.smt2 ? "Tepat" : currentSmt2Jp < targetJp.smt2 ? `-${targetJp.smt2 - currentSmt2Jp}` : `+${currentSmt2Jp - targetJp.smt2}`}
                </span>
              </div>
            </div>

            {/* Total Terisi */}
            <div className="bg-emerald-50/60 p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-emerald-800 font-medium block">Total Terdistribusi:</span>
                <span className="text-[10px] text-emerald-600">{tpList.length} TP Terumuskan</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-950 text-sm">
                  {currentTotalJp} / {targetJp.total} JP
                </span>
                <span className="text-[10px] text-emerald-700 block">
                  {targetJp.total > 0 ? Math.round((currentTotalJp / targetJp.total) * 100) : 0}% teralokasi
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pesan Feedback */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Seluruh Tujuan Pembelajaran berhasil disimpan! Anda dapat melanjutkan ke Langkah 3.
        </div>
      )}

      {/* Iterasi per Analisis Elemen CP */}
      <div className="space-y-8">
        {analisisList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h4 className="font-semibold text-slate-800 mb-1">Analisis CP Belum Disimpan</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Silakan kembali ke Langkah 1 dan isi analisis elemen Capaian Pembelajaran terlebih dahulu.
            </p>
            <Button variant="outline" size="sm" onClick={onPrev}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Langkah 1
            </Button>
          </div>
        ) : (
          currentAnalisisList.map((an, anIdx) => {
            const anId = an.id || `temp-${anIdx}`;
            const cpName = cpMap.get(an.cp_id) || `Elemen ${anIdx + 1}`;
            const elemenTpItems = tpList.filter(
              (tp) =>
                tp.analisis_cp_id === anId ||
                (Boolean(an.id) && tp.analisis_cp_id === an.id) ||
                tp.analisis_cp_id === `temp-${anIdx}` ||
                tp.analisis_cp_id === an.cp_id
            );

            return (
              <div
                key={anId}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
              >
                {/* Header Elemen */}
                <div className="bg-slate-50/90 border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {/* Tombol Reorder Elemen CP */}
                    <div className="flex flex-col gap-0.5 mr-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={anIdx === 0}
                        onClick={() => handleMoveElemen(anIdx, "up")}
                        className="h-6 w-6 text-slate-600 hover:text-emerald-700 disabled:opacity-30 cursor-pointer"
                        title="Geser Elemen CP ke Atas"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={anIdx === currentAnalisisList.length - 1}
                        onClick={() => handleMoveElemen(anIdx, "down")}
                        className="h-6 w-6 text-slate-600 hover:text-emerald-700 disabled:opacity-30 cursor-pointer"
                        title="Geser Elemen CP ke Bawah"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-700 text-white hover:bg-emerald-800 text-xs">
                          Elemen {anIdx + 1}: {cpName}
                        </Badge>
                        <span className="text-xs text-slate-500 font-medium">
                          Materi: <span className="text-slate-800">{an.materi_pokok || "(Belum diisi)"}</span>
                        </span>
                      </div>
                      {an.benang_merah && (
                        <p className="text-[11px] text-slate-500 italic line-clamp-1">
                          &quot;{an.benang_merah}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddTp(anId)}
                    className="text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Tambah TP untuk Elemen Ini
                  </Button>
                </div>

                {/* TP Items untuk Elemen ini */}
                <div className="p-5 space-y-6">
                  {elemenTpItems.length === 0 ? (
                    <div className="text-center py-6 bg-slate-50/60 rounded-lg border border-dashed border-slate-200">
                      <p className="text-xs text-slate-500 mb-2">
                        Belum ada Tujuan Pembelajaran yang dirumuskan untuk elemen ini.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAddTp(anId)}
                        className="text-xs"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Rumuskan TP Pertama
                      </Button>
                    </div>
                  ) : (
                    elemenTpItems.map((tp) => {
                      const tpIndex = tpList.findIndex((item) => item === tp);
                      const softWarnings = getSoftWarnings(tp);

                      return (
                        <div
                          key={tp.id || tpIndex}
                          className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 md:p-5 space-y-4 hover:border-slate-300 transition-colors"
                        >
                          {/* Baris Atas: Kode TP, Semester, JP, KKTP, Hapus */}
                          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-md border border-emerald-200">
                                Kode TP: {tp.kode_tp}
                              </span>
                              <Badge variant="outline" className="text-xs text-slate-600 bg-white">
                                Urutan #{tp.urutan}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                              {/* Semester */}
                              <div className="flex items-center gap-1.5 text-xs text-slate-700">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>Semester:</span>
                                <select
                                  value={tp.semester}
                                  onChange={(e) =>
                                    updateTpField(
                                      tpIndex,
                                      "semester",
                                      Number(e.target.value) as 1 | 2
                                    )
                                  }
                                  className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                  <option value={1}>Semester 1</option>
                                  <option value={2}>Semester 2</option>
                                </select>
                              </div>

                              {/* Alokasi JP */}
                              <div className="flex items-center gap-1.5 text-xs text-slate-700">
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span>JP:</span>
                                <Input
                                  type="number"
                                  min={1}
                                  max={30}
                                  value={tp.alokasi_jp}
                                  onChange={(e) =>
                                    updateTpField(
                                      tpIndex,
                                      "alokasi_jp",
                                      Number(e.target.value) || 2
                                    )
                                  }
                                  className="h-8 w-16 text-center text-xs bg-white font-medium"
                                />
                              </div>

                              {/* Tombol KKTP */}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenKktpModal(tpIndex)}
                                className="h-8 text-xs bg-white hover:bg-slate-100 border-slate-300"
                              >
                                <Sliders className="w-3.5 h-3.5 mr-1 text-slate-600" />
                                KKTP ({tp.kktp?.pendekatan ? tp.kktp.pendekatan.replace("_", " ") : "Atur"})
                              </Button>

                              {/* Hapus TP */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTp(tpIndex)}
                                className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                title="Hapus TP ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* 3 Komponen TP Sesuai Panduan Kemenag */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                            {/* Komponen 1: Kompetensi (dengan KKO Taksonomi SOLO & Bloom) */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-800 block flex items-center justify-between">
                                <span>1. Kompetensi (KKO)</span>
                              </label>

                              {/* Dropdown KKO SOLO & Bloom */}
                              <Select
                                value=""
                                onValueChange={(val) => {
                                  if (val) {
                                    const kkoLower = val.toLowerCase();
                                    updateTpField(tpIndex, "kompetensi", kkoLower);
                                    const currentDeskripsi = tp.deskripsi || "";
                                    if (currentDeskripsi.startsWith("Murid dapat ")) {
                                      const parts = currentDeskripsi.replace("Murid dapat ", "").split(" ");
                                      parts[0] = kkoLower;
                                      updateTpField(tpIndex, "deskripsi", `Murid dapat ${parts.join(" ")}`);
                                    }
                                  }
                                }}
                              >
                                <SelectTrigger className="h-8 text-xs bg-white border-slate-300">
                                  <SelectValue placeholder="Pilih KKO SOLO / Bloom..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-64">
                                  {kkoList && kkoList.length > 0 && (
                                    <SelectGroup>
                                      <SelectLabel className="text-[11px] font-bold text-purple-800">
                                        Taksonomi Bloom (C1–C6 Bank Data)
                                      </SelectLabel>
                                      {kkoList.map((bloom) =>
                                        bloom.kata_kerja.map((kko) => (
                                          <SelectItem
                                            key={`kko-bank-${bloom.tingkat}-${kko}`}
                                            value={kko}
                                            className="text-xs"
                                          >
                                            {kko} ({bloom.tingkat} - {bloom.nama})
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectGroup>
                                  )}
                                  <SelectGroup>
                                    <SelectLabel className="text-[11px] font-bold text-emerald-800">
                                      Taksonomi SOLO (Disarankan KBC)
                                    </SelectLabel>
                                    {TAKSONOMI_SOLO.map((solo) =>
                                      solo.kko.map((kko) => (
                                        <SelectItem
                                          key={`solo-${solo.tingkat}-${kko}`}
                                          value={kko}
                                          className="text-xs"
                                        >
                                          {kko} ({solo.tingkat})
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectGroup>
                                  <SelectGroup>
                                    <SelectLabel className="text-[11px] font-bold text-sky-800">
                                      Taksonomi Bloom Tambahan
                                    </SelectLabel>
                                    {TAKSONOMI_BLOOM.map((bloom) =>
                                      bloom.kko.map((kko) => (
                                        <SelectItem
                                          key={`bloom-${bloom.kategori}-${kko}`}
                                          value={kko}
                                          className="text-xs"
                                        >
                                          {kko} ({bloom.kategori.split(" ")[0]})
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>

                              <Input
                                placeholder="Kompetensi (misal: menganalisis makna)"
                                value={tp.kompetensi || ""}
                                onChange={(e) => updateTpField(tpIndex, "kompetensi", e.target.value)}
                                className="h-8 text-xs bg-white"
                              />
                            </div>

                            {/* Komponen 2: Lingkup Materi */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-800 block">
                                2. Lingkup Materi
                              </label>
                              <Input
                                placeholder="Materi (misal: hukum bacaan mad lazim)"
                                value={tp.lingkup_materi || ""}
                                onChange={(e) =>
                                  updateTpField(tpIndex, "lingkup_materi", e.target.value)
                                }
                                className="h-8 text-xs bg-white mt-8 md:mt-8"
                              />
                            </div>

                            {/* Komponen 3: Konteks Nilai Panca Cinta */}
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-800 block">
                                3. Konteks Panca Cinta
                              </label>

                              {/* Pilihan Topik Panca Cinta */}
                              <Select
                                value={tp.panca_cinta_ids?.[0] || ""}
                                onValueChange={(val) => {
                                  updateTpField(
                                    tpIndex,
                                    "panca_cinta_ids",
                                    val && val !== "none" ? [val] : []
                                  );
                                }}
                              >
                                <SelectTrigger className="w-full h-8 text-xs bg-white border-slate-300">
                                  <SelectValue placeholder="Pilih Topik Panca Cinta..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none" className="text-xs text-slate-500 italic">
                                    -- Tanpa Topik Panca Cinta --
                                  </SelectItem>
                                  {pancaCintaList.map((pc) => (
                                    <SelectItem key={pc.id} value={pc.id} className="text-xs">
                                      {pc.kode}: {pc.nama}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Input
                                placeholder="Konteks (misal: dalam tartil tilawah & adab harian)"
                                value={tp.konteks || ""}
                                onChange={(e) => updateTpField(tpIndex, "konteks", e.target.value)}
                                className="h-8 text-xs bg-white"
                              />
                            </div>
                          </div>

                          {/* Rumusan Lengkap Tersusun Otomatis */}
                          <div className="space-y-2 pt-1 bg-white p-3.5 rounded-lg border border-slate-200">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                Rumusan Lengkap Tujuan Pembelajaran (Dapat Diedit Manual)
                              </label>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => generateFormula(tpIndex)}
                                className="h-7 text-[11px] text-emerald-700 hover:bg-emerald-50"
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Generate Ulang
                              </Button>
                            </div>

                            <Textarea
                              rows={2}
                              value={tp.deskripsi}
                              onChange={(e) => updateTpField(tpIndex, "deskripsi", e.target.value)}
                              className="text-xs md:text-sm leading-relaxed font-normal bg-white"
                              placeholder="Murid dapat..."
                            />

                            {/* Soft Warning (Peringatan Lunak Non-Blocking) */}
                            {softWarnings.length > 0 && (
                              <div className="space-y-1 pt-1">
                                {softWarnings.map((warn, wIdx) => (
                                  <div
                                    key={wIdx}
                                    className="flex items-start gap-2 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-md p-2 text-xs"
                                  >
                                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <span>{warn}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Dialog Editor KKTP */}
      <Dialog open={kktpModalOpen} onOpenChange={setKktpModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-700" />
              Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tentukan pendekatan asesmen formatif yang digunakan untuk mengukur pencapaian tujuan pembelajaran ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Pilihan Pendekatan */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800">Pilih Pendekatan KKTP:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "deskripsi_kriteria", label: "Deskripsi Kriteria" },
                  { id: "rubrik", label: "Rubrik (4 Level)" },
                  { id: "interval_nilai", label: "Interval Nilai" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const nextType = item.id as KktpPendekatan;
                      setCurrentKktp((prev) => ({
                        ...prev,
                        pendekatan: nextType,
                        deskripsi:
                          nextType === "deskripsi_kriteria"
                            ? prev.deskripsi || [
                                { kriteria: "Mampu menjelaskan konsep dasar dengan benar", memadai: true },
                                { kriteria: "Mampu mengaitkan dengan contoh kehidupan nyata", memadai: true },
                              ]
                            : prev.deskripsi,
                        rubrik:
                          nextType === "rubrik"
                            ? prev.rubrik || [
                                {
                                  aspek: "Pemahaman Konsep & Sikap",
                                  baru_berkembang: "Perlu bimbingan",
                                  layak: "Cukup memadai",
                                  cakap: "Baik dan mandiri",
                                  mahir: "Sangat baik dan menginspirasi",
                                },
                              ]
                            : prev.rubrik,
                        interval:
                          nextType === "interval_nilai"
                            ? prev.interval || [
                                {
                                  rentang: "0 - 40%",
                                  keterangan: "Belum mencapai ketuntasan",
                                  tindak_lanjut: "Remedial di seluruh bagian",
                                },
                                {
                                  rentang: "41 - 70%",
                                  keterangan: "Belum mencapai ketuntasan",
                                  tindak_lanjut: "Remedial di bagian yang belum dikuasai",
                                },
                                {
                                  rentang: "71 - 85%",
                                  keterangan: "Sudah mencapai ketuntasan",
                                  tindak_lanjut: "Penguatan pemahaman mandiri",
                                },
                                {
                                  rentang: "86 - 100%",
                                  keterangan: "Sudah mencapai ketuntasan",
                                  tindak_lanjut: "Pengayaan / menjadi tutor sebaya",
                                },
                              ]
                            : prev.interval,
                      }));
                    }}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium text-center transition-all ${
                      currentKktp.pendekatan === item.id
                        ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Form sesuai Pendekatan yang dipilih */}
            {currentKktp.pendekatan === "deskripsi_kriteria" && (
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">Daftar Kriteria Ketuntasan:</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const cur = currentKktp.deskripsi || [];
                      setCurrentKktp({
                        ...currentKktp,
                        deskripsi: [...cur, { kriteria: "", memadai: true }],
                      });
                    }}
                    className="h-7 text-xs text-emerald-700 hover:bg-emerald-50"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Tambah Kriteria
                  </Button>
                </div>

                {(currentKktp.deskripsi || []).map((desc, dIdx) => (
                  <div key={dIdx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 w-5">{dIdx + 1}.</span>
                    <Input
                      value={desc.kriteria}
                      onChange={(e) => {
                        const copy = [...(currentKktp.deskripsi || [])];
                        copy[dIdx].kriteria = e.target.value;
                        setCurrentKktp({ ...currentKktp, deskripsi: copy });
                      }}
                      placeholder="Uraikan kriteria ketercapaian..."
                      className="text-xs bg-white flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const copy = (currentKktp.deskripsi || []).filter((_, i) => i !== dIdx);
                        setCurrentKktp({ ...currentKktp, deskripsi: copy });
                      }}
                      className="h-8 w-8 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {currentKktp.pendekatan === "rubrik" && (
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-800">Tabel Rubrik 4 Kategori:</span>
                {(currentKktp.rubrik || []).map((rub, rIdx) => (
                  <div key={rIdx} className="space-y-2 bg-white p-3 rounded border border-slate-200">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-600">Aspek yang Dinilai:</label>
                      <Input
                        value={rub.aspek}
                        onChange={(e) => {
                          const copy = [...(currentKktp.rubrik || [])];
                          copy[rIdx].aspek = e.target.value;
                          setCurrentKktp({ ...currentKktp, rubrik: copy });
                        }}
                        placeholder="Contoh: Pemahaman Konsep dan Pengamalan Sikap"
                        className="text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-rose-700 block">1. Baru Berkembang</span>
                        <Textarea
                          rows={2}
                          value={rub.baru_berkembang}
                          onChange={(e) => {
                            const copy = [...(currentKktp.rubrik || [])];
                            copy[rIdx].baru_berkembang = e.target.value;
                            setCurrentKktp({ ...currentKktp, rubrik: copy });
                          }}
                          className="text-[11px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-amber-700 block">2. Layak</span>
                        <Textarea
                          rows={2}
                          value={rub.layak}
                          onChange={(e) => {
                            const copy = [...(currentKktp.rubrik || [])];
                            copy[rIdx].layak = e.target.value;
                            setCurrentKktp({ ...currentKktp, rubrik: copy });
                          }}
                          className="text-[11px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-sky-700 block">3. Cakap</span>
                        <Textarea
                          rows={2}
                          value={rub.cakap}
                          onChange={(e) => {
                            const copy = [...(currentKktp.rubrik || [])];
                            copy[rIdx].cakap = e.target.value;
                            setCurrentKktp({ ...currentKktp, rubrik: copy });
                          }}
                          className="text-[11px]"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-emerald-700 block">4. Mahir</span>
                        <Textarea
                          rows={2}
                          value={rub.mahir}
                          onChange={(e) => {
                            const copy = [...(currentKktp.rubrik || [])];
                            copy[rIdx].mahir = e.target.value;
                            setCurrentKktp({ ...currentKktp, rubrik: copy });
                          }}
                          className="text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {currentKktp.pendekatan === "interval_nilai" && (
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <span className="text-xs font-semibold text-slate-800">Interval Nilai & Tindak Lanjut:</span>
                <div className="space-y-2">
                  {(currentKktp.interval || []).map((item, iIdx) => (
                    <div key={iIdx} className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-white p-2.5 rounded border border-slate-200 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold block">Rentang:</span>
                        <Input
                          value={item.rentang}
                          onChange={(e) => {
                            const copy = [...(currentKktp.interval || [])];
                            copy[iIdx].rentang = e.target.value;
                            setCurrentKktp({ ...currentKktp, interval: copy });
                          }}
                          className="text-xs h-7"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold block">Keterangan:</span>
                        <Input
                          value={item.keterangan}
                          onChange={(e) => {
                            const copy = [...(currentKktp.interval || [])];
                            copy[iIdx].keterangan = e.target.value;
                            setCurrentKktp({ ...currentKktp, interval: copy });
                          }}
                          className="text-xs h-7"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold block">Tindak Lanjut:</span>
                        <Input
                          value={item.tindak_lanjut}
                          onChange={(e) => {
                            const copy = [...(currentKktp.interval || [])];
                            copy[iIdx].tindak_lanjut = e.target.value;
                            setCurrentKktp({ ...currentKktp, interval: copy });
                          }}
                          className="text-xs h-7"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setKktpModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveKktpModal}
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              Terapkan KKTP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Bar Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          className="border-slate-300 hover:bg-slate-100 w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Analisis CP
        </Button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href={`/atp/${penugasanId}/preview-tp`}
            target="_blank"
            className={buttonVariants({
              variant: "outline",
              className: "flex-1 sm:flex-none border-amber-300 text-amber-800 hover:bg-amber-50 font-medium text-xs",
            })}
          >
            <FileText className="w-4 h-4 mr-1.5 text-amber-600" />
            Dokumen TP
          </Link>

          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => handleSave(false)}
            className="flex-1 sm:flex-none border-slate-300 hover:bg-slate-100"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2 text-slate-600" />
            )}
            Simpan Draf TP
          </Button>

          <Button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(true)}
            className="flex-1 sm:flex-none bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            Lanjut ke Susun ATP
          </Button>
        </div>
      </div>
    </div>
  );
}
