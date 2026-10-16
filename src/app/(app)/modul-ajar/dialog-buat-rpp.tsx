"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { createRppAction } from "./actions";
import type { VersiRpp } from "@/types/database";

interface DialogBuatRppProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  penugasanList: Array<{
    id: string;
    tingkat_kelas: 7 | 8 | 9;
    rombel: string;
    mapel_nama: string;
    mapel_kode: string;
    jp_per_minggu: number;
  }>;
  tpListByPenugasan: Record<
    string,
    Array<{
      id: string;
      kode_tp: string;
      materi_pokok: string;
      tujuan_pembelajaran_teks: string;
      alokasi_jp?: number;
    }>
  >;
}

export function DialogBuatRpp({
  open,
  onOpenChange,
  penugasanList,
  tpListByPenugasan,
}: DialogBuatRppProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedPenugasanId, setSelectedPenugasanId] = useState<string>(
    penugasanList[0]?.id || ""
  );
  const [selectedTpIds, setSelectedTpIds] = useState<string[]>([]);
  const [versi, setVersi] = useState<VersiRpp>("lengkap");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Ambil daftar TP untuk penugasan aktif
  const currentTpList = tpListByPenugasan[selectedPenugasanId] || [];

  const handlePenugasanChange = (id: string) => {
    setSelectedPenugasanId(id);
    setSelectedTpIds([]);
  };

  const handleToggleTp = (tpId: string) => {
    setSelectedTpIds((prev) =>
      prev.includes(tpId) ? prev.filter((id) => id !== tpId) : [...prev, tpId]
    );
  };

  const handleSelectAllTp = () => {
    if (selectedTpIds.length === currentTpList.length) {
      setSelectedTpIds([]);
    } else {
      setSelectedTpIds(currentTpList.map((t) => t.id));
    }
  };

  const handleSubmit = () => {
    if (!selectedPenugasanId) {
      setErrorMsg("Silakan pilih penugasan mata pelajaran.");
      return;
    }
    setErrorMsg(null);

    startTransition(async () => {
      const res = await createRppAction({
        penugasan_id: selectedPenugasanId,
        tp_ids: selectedTpIds,
        versi,
      });

      if (res.success && res.rppId) {
        onOpenChange(false);
        router.push(`/modul-ajar/${res.rppId}`);
      } else {
        setErrorMsg(res.error || "Gagal membuat dokumen RPP.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-700 mb-1">
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-bold tracking-wider uppercase">
              Kurikulum Berbasis Cinta (KBC)
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Buat RPP / Modul Ajar Pembelajaran Mendalam
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Pilih penugasan kelas, satu atau lebih Tujuan Pembelajaran (TP) dari ATP,
            serta versi dokumen yang diinginkan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* 1. Pilih Penugasan Guru */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">
              1. Pilih Mata Pelajaran & Kelas Penugasan
            </Label>
            {penugasanList.length === 0 ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                Tidak ada penugasan guru di tahun ajaran aktif. Hubungi Admin Madrasah.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {penugasanList.map((p) => {
                  const isSelected = selectedPenugasanId === p.id;
                  return (
                    <button
                      key={`penugasan-${p.id}`}
                      type="button"
                      onClick={() => handlePenugasanChange(p.id)}
                      className={`p-3 text-left rounded-xl border transition-all text-xs ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50/70 shadow-2xs ring-1 ring-emerald-600"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{p.mapel_nama}</span>
                        <Badge
                          variant="outline"
                          className={
                            isSelected
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : "bg-slate-100 text-slate-600"
                          }
                        >
                          Kelas {p.tingkat_kelas} ({p.rombel})
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>Kode: {p.mapel_kode}</span>
                        <span>•</span>
                        <span>{p.jp_per_minggu} JP/minggu</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Pilih TP dari ATP */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700">
                2. Pilih Tujuan Pembelajaran (TP) Terkait
              </Label>
              {currentTpList.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllTp}
                  className="text-[11px] font-semibold text-emerald-700 hover:underline"
                >
                  {selectedTpIds.length === currentTpList.length
                    ? "Batalkan Semua"
                    : "Pilih Semua TP"}
                </button>
              )}
            </div>

            {currentTpList.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                Belum ada TP yang dirumuskan di ATP/Prota untuk penugasan ini. Anda tetap
                dapat melanjutkan dan mengisi TP secara langsung di dalam form wizard.
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                {currentTpList.map((tp) => {
                  const isChecked = selectedTpIds.includes(tp.id);
                  return (
                    <label
                      key={`tp-opt-${tp.id}`}
                      className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-white border-emerald-500 shadow-2xs"
                          : "bg-white/70 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleTp(tp.id)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <span className="text-[10px] px-1 rounded bg-slate-100 border border-slate-200">
                            {tp.kode_tp}
                          </span>
                          <span>{tp.materi_pokok}</span>
                          {tp.alokasi_jp && (
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({tp.alokasi_jp} JP)
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {tp.tujuan_pembelajaran_teks}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Pilih Versi RPP (Minimum vs Lengkap) */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">
              3. Pilih Format Versi RPP / Modul Ajar
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Versi Lengkap */}
              <button
                type="button"
                onClick={() => setVersi("lengkap")}
                className={`p-3.5 text-left rounded-xl border transition-all ${
                  versi === "lengkap"
                    ? "border-emerald-600 bg-emerald-50/70 shadow-2xs ring-1 ring-emerald-600"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    Versi Lengkap [L]
                    <Badge className="bg-emerald-600 text-white text-[9px]">
                      Rekomendasi
                    </Badge>
                  </span>
                  {versi === "lengkap" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Format paripurna Tabel 3.5 & 3.6 Panduan Kemenag. Dilengkapi analisis
                  kesiapan murid, lintas disiplin ilmu, dan pemanfaatan digital.
                </p>
              </button>

              {/* Versi Minimum */}
              <button
                type="button"
                onClick={() => setVersi("minimum")}
                className={`p-3.5 text-left rounded-xl border transition-all ${
                  versi === "minimum"
                    ? "border-emerald-600 bg-emerald-50/70 shadow-2xs ring-1 ring-emerald-600"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-900">
                    Versi Minimum
                  </span>
                  {versi === "minimum" && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Format ringkas esensial: tujuan pembelajaran, langkah kegiatan (awal,
                  inti, penutup), dan rencana asesmen tanpa lampiran kompleks.
                </p>
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="text-xs"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || penugasanList.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
          >
            {isPending ? (
              "Menyiapkan Dokumen..."
            ) : (
              <>
                Mulai Susun RPP
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
