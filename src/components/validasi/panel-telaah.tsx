"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { EvaluasiDokumenResult } from "@/lib/validasi/types";
import { approveDokumenAction, requestRevisiAction } from "@/lib/validasi/actions";
import type { DocStatus, DokumenTipe } from "@/types/database";

interface PanelTelaahProps {
  dokumenTipe: DokumenTipe;
  dokumenId: string;
  currentStatus: DocStatus;
  evaluasi: EvaluasiDokumenResult;
  onSuccess?: () => void;
}

export function PanelTelaah({
  dokumenTipe,
  dokumenId,
  evaluasi,
  onSuccess,
}: PanelTelaahProps) {
  const router = useRouter();
  const items = evaluasi.items;
  const [catatanPerButir, setCatatanPerButir] = useState<Record<string, string>>({});
  const [catatanUmum, setCatatanUmum] = useState<string>("");
  const [expandedButir, setExpandedButir] = useState<Record<string, boolean>>({});

  // Dialog state
  const [dialogApproveOpen, setDialogApproveOpen] = useState(false);
  const [dialogRevisiOpen, setDialogRevisiOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleExpand = (kode: string) => {
    setExpandedButir((prev) => ({ ...prev, [kode]: !prev[kode] }));
  };

  const handleCatatanChange = (kode: string, text: string) => {
    setCatatanPerButir((prev) => ({ ...prev, [kode]: text }));
  };

  const totalMemenuhi = items.filter((i) => i.memenuhi).length;
  const skorPersen = Math.round((totalMemenuhi / items.length) * 100);

  const handleApprove = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      // Gabungkan catatan jika ada
      let finalCatatan = catatanUmum.trim();
      const perButirNotes = Object.entries(catatanPerButir)
        .filter(([, v]) => v.trim().length > 0)
        .map(([k, v]) => `• ${k}: ${v.trim()}`);

      if (perButirNotes.length > 0) {
        finalCatatan += (finalCatatan ? "\n\nCatatan Khusus:\n" : "Catatan Khusus:\n") + perButirNotes.join("\n");
      }

      const res = await approveDokumenAction(dokumenTipe, dokumenId, finalCatatan);
      if (res.success) {
        setDialogApproveOpen(false);
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        setErrorMsg(res.error || "Gagal menyetujui dokumen.");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan saat menyetujui dokumen.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRevisi = async () => {
    if (!catatanUmum.trim()) {
      setErrorMsg("Catatan perbaikan / revisi wajib diisi!");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      let finalCatatan = catatanUmum.trim();
      const perButirNotes = Object.entries(catatanPerButir)
        .filter(([, v]) => v.trim().length > 0)
        .map(([k, v]) => `• ${k}: ${v.trim()}`);

      if (perButirNotes.length > 0) {
        finalCatatan += "\n\nCatatan Perbaikan per Butir:\n" + perButirNotes.join("\n");
      }

      const res = await requestRevisiAction(dokumenTipe, dokumenId, finalCatatan);
      if (res.success) {
        setDialogRevisiOpen(false);
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        setErrorMsg(res.error || "Gagal mengirim permintaan revisi.");
      }
    } catch {
      setErrorMsg("Terjadi kesalahan saat meminta revisi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
      {/* Header Panel */}
      <div className="space-y-2 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-800">
              Instrumen Telaah Otomatis KBC
            </h3>
          </div>
          <Badge
            className={`text-xs ${
              skorPersen >= 85
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : skorPersen >= 60
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}
          >
            {skorPersen}% Terpenuhi
          </Badge>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Kesesuaian dengan KMA 1503/2025 dan Panduan Pembelajaran & Asesmen Kemenag.
        </p>

        {/* Progress bar */}
        <div className="pt-1">
          <Progress value={skorPersen} className="h-2" />
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
            <span>
              {totalMemenuhi} dari {items.length} butir memenuhi
            </span>
            <span>Target: 100%</span>
          </div>
        </div>
      </div>

      {/* Checklist Butir Telaah */}
      <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
        {items.map((butir) => {
          const isExpanded = expandedButir[butir.kode];
          const hasNote = Boolean(catatanPerButir[butir.kode]?.trim());

          return (
            <div
              key={butir.kode}
              className={`rounded-lg border p-3 text-xs transition-colors ${
                butir.memenuhi
                  ? "border-emerald-100 bg-emerald-50/30"
                  : "border-amber-200 bg-amber-50/40"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {butir.memenuhi ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {butir.label}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] py-0 px-1.5 ${
                        butir.memenuhi
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {butir.memenuhi ? "Memenuhi" : "Perlu Dicek"}
                    </Badge>
                  </div>

                  <p className="text-slate-600 leading-relaxed">
                    {butir.deskripsi}
                  </p>

                  <p
                    className={`text-[11px] font-medium ${
                      butir.memenuhi ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    Hasil sistem: {butir.keterangan}
                  </p>

                  {/* Toggle Catatan Per Butir */}
                  <div className="pt-1.5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleExpand(butir.kode)}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium inline-flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" /> Tutup Catatan
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          {hasNote ? "Edit Catatan Butir" : "+ Tambah Catatan Butir"}
                        </>
                      )}
                    </button>
                    {hasNote && (
                      <span className="text-[10px] text-emerald-600 italic">
                        Catatan tersimpan
                      </span>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="pt-2">
                      <Textarea
                        rows={2}
                        placeholder={`Tulis catatan penelaahan untuk ${butir.label}...`}
                        value={catatanPerButir[butir.kode] || ""}
                        onChange={(e) => handleCatatanChange(butir.kode, e.target.value)}
                        className="text-xs bg-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Catatan Keseluruhan Validator */}
      <div className="space-y-1.5 pt-2 border-t border-slate-100">
        <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
          <span>Catatan Umum Penelaah / Validator:</span>
          <span className="text-[11px] text-slate-400 font-normal">
            (Wajib bila minta revisi)
          </span>
        </label>
        <Textarea
          rows={3}
          placeholder="Tuliskan apresiasi, masukan penguatan materi, atau poin-poin revisi spesifik untuk guru..."
          value={catatanUmum}
          onChange={(e) => setCatatanUmum(e.target.value)}
          className="text-xs"
        />
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tombol Aksi Validator */}
      <div className="pt-2 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setErrorMsg(null);
            setDialogRevisiOpen(true);
          }}
          disabled={submitting}
          className="border-rose-200 text-rose-700 hover:bg-rose-50 text-xs"
        >
          <AlertCircle className="w-3.5 h-3.5 mr-1" />
          Minta Revisi
        </Button>

        <Button
          type="button"
          onClick={() => {
            setErrorMsg(null);
            setDialogApproveOpen(true);
          }}
          disabled={submitting}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          Setujui Dokumen
        </Button>
      </div>

      {/* Dialog Konfirmasi Setujui */}
      <Dialog open={dialogApproveOpen} onOpenChange={setDialogApproveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Konfirmasi Persetujuan Dokumen
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Apakah Anda yakin dokumen ini telah memenuhi kriteria Kurikulum Berbasis Cinta (KBC) dan siap disahkan? Status dokumen akan berubah menjadi <strong>Disetujui</strong>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogApproveOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? "Memproses..." : "Ya, Setujui Sekarang"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Minta Revisi */}
      <Dialog open={dialogRevisiOpen} onOpenChange={setDialogRevisiOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-800">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              Kembalikan untuk Revisi
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Dokumen akan dikembalikan kepada guru pengampu dengan status <strong>Perlu Revisi</strong> beserta catatan perbaikan yang Anda berikan.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Catatan Perbaikan (Wajib):
            </label>
            <Textarea
              rows={3}
              placeholder="Jelaskan aspek yang perlu diperbaiki oleh guru..."
              value={catatanUmum}
              onChange={(e) => setCatatanUmum(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogRevisiOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              size="sm"
              onClick={handleRequestRevisi}
              disabled={submitting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {submitting ? "Memproses..." : "Kirim Catatan Revisi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
