"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  BookOpen,
  BookmarkCheck,
  ListChecks,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import type { RppDetailData, LampiranData } from "../../actions";
import { generateDefaultLampiran } from "@/lib/rpp-suggestions";

interface Step6Props {
  data: RppDetailData;
  onChange: (updates: Partial<RppDetailData["rpp"]>) => void;
}

export function Step6Lampiran({ data, onChange }: Step6Props) {
  const { rpp, penugasan, master } = data;
  const selectedModel = master.models.find((m) => m.id === rpp.model_id) || master.models[0];

  // Auto-fill saran lampiran jika masih kosong saat komponen dibuka
  React.useEffect(() => {
    const defaultLampiran = generateDefaultLampiran(
      rpp.materi_pokok,
      penugasan?.mapel?.nama,
      penugasan?.tingkat_kelas,
      selectedModel?.nama
    );
    const current = { ...(rpp.lampiran || {}) };
    let hasChanges = false;

    const keys: Array<"lkpd" | "bahan_bacaan" | "rubrik_penilaian" | "glosarium" | "daftar_pustaka"> = [
      "lkpd",
      "bahan_bacaan",
      "rubrik_penilaian",
      "glosarium",
      "daftar_pustaka",
    ];

    keys.forEach((k) => {
      const val = current[k];
      if (typeof val !== "string" || !val.trim()) {
        current[k] = defaultLampiran[k];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      onChange({ lampiran: current as LampiranData });
    }
  }, [rpp.materi_pokok, penugasan?.mapel?.nama, penugasan?.tingkat_kelas, selectedModel?.nama]);

  // Muat ulang saran default lampiran
  const handleResetSuggestions = () => {
    const defaultLampiran = generateDefaultLampiran(
      rpp.materi_pokok,
      penugasan?.mapel?.nama,
      penugasan?.tingkat_kelas,
      selectedModel?.nama
    );
    onChange({ lampiran: defaultLampiran });
  };

  const handleLampiranChange = (key: keyof LampiranData, val: string) => {
    onChange({
      lampiran: {
        ...rpp.lampiran,
        [key]: val,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Langkah 6 — Lampiran Modul Ajar
          </h3>
          <p className="text-xs text-slate-600">
            Lembar Kerja Peserta Didik (LKPD), bahan bacaan guru & murid, glosarium
            istilah penting, dan daftar pustaka rujukan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] gap-1 font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Saran Otomatis Aktif
          </Badge>
          <button
            type="button"
            onClick={handleResetSuggestions}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
            title="Muat ulang saran standar relevan berdasarkan topik dan mapel"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Muat Ulang Saran
          </button>
        </div>
      </div>

      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
        <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Lampiran telah diisi saran otomatis secara kontekstual.</p>
          <p className="text-[11px] text-amber-800/90 mt-0.5">
            Sistem telah menyusun LKPD, Bahan Bacaan, Glosarium, dan Daftar Pustaka sesuai mata pelajaran <strong>{penugasan?.mapel?.nama || "Mapel"}</strong> dan materi pokok <strong>{rpp.materi_pokok}</strong>. Anda dapat langsung menggunakannya atau menyesuaikan isinya.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* LKPD */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              Lembar Kerja Peserta Didik (LKPD)
            </Label>
            <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
              Aktivitas & Refleksi
            </span>
          </div>
          <Textarea
            rows={8}
            value={rpp.lampiran?.lkpd || ""}
            onChange={(e) => handleLampiranChange("lkpd", e.target.value)}
            placeholder="Petunjuk aktivitas kelompok, studi kasus, instruksi kerja, dan lembar kerja reflektif murid..."
            className="text-xs leading-relaxed font-mono text-[11.5px]"
          />
        </div>

        {/* Bahan Bacaan Guru & Murid */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Bahan Bacaan Guru & Peserta Didik
            </Label>
            <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
              Sumber Belajar & PPA Kemenag
            </span>
          </div>
          <Textarea
            rows={8}
            value={rpp.lampiran?.bahan_bacaan || ""}
            onChange={(e) => handleLampiranChange("bahan_bacaan", e.target.value)}
            placeholder="Ringkasan materi esensial, dalil/ayat rujukan, artikel kontekstual, atau ringkasan teori..."
            className="text-xs leading-relaxed font-mono text-[11.5px]"
          />
        </div>

        {/* Glosarium */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <BookmarkCheck className="w-4 h-4 text-emerald-600" />
              Glosarium (Daftar Istilah)
            </Label>
            <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
              Istilah Materi & KBC
            </span>
          </div>
          <Textarea
            rows={7}
            value={rpp.lampiran?.glosarium || ""}
            onChange={(e) => handleLampiranChange("glosarium", e.target.value)}
            placeholder="Daftar istilah penting dan definisinya, misal: Mad Thabi'i: pemanjangan bunyi huruf hijaiyah..."
            className="text-xs leading-relaxed font-mono text-[11.5px]"
          />
        </div>

        {/* Daftar Pustaka */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ListChecks className="w-4 h-4 text-emerald-600" />
              Daftar Pustaka / Referensi
            </Label>
            <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded">
              Buku Kemenag & Kepdirjen 6077/2025
            </span>
          </div>
          <Textarea
            rows={7}
            value={rpp.lampiran?.daftar_pustaka || ""}
            onChange={(e) => handleLampiranChange("daftar_pustaka", e.target.value)}
            placeholder="Buku Teks Utama Kemenag, Modul PPA Kemenag (Nov 2025), Kepdirjen Pendis 6077/2025, website referensi..."
            className="text-xs leading-relaxed font-mono text-[11.5px]"
          />
        </div>
      </div>
    </div>
  );
}
