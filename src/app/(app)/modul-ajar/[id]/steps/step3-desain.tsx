"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Layers,
  Globe,
  Share2,
  Tv,
  Building,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Compass,
  Info,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RppDetailData } from "../../actions";
import { getModelPedagogiSpec } from "@/lib/rpp-model-pedagogi";

interface Step3Props {
  data: RppDetailData;
  onChange: (updates: Partial<RppDetailData["rpp"]>) => void;
  onApplyModelSyntax: (modelId: string) => void;
}

export function Step3Desain({ data, onChange, onApplyModelSyntax }: Step3Props) {
  const { rpp, master } = data;
  const isLengkap = rpp.versi === "lengkap";

  const selectedModel = master.models.find((m) => m.id === rpp.model_id) || null;
  const activeSpec = selectedModel ? getModelPedagogiSpec(selectedModel.nama) : null;

  // Auto-sinkronisasi topik pembelajaran dari topik RPP (materi pokok) jika belum terisi
  React.useEffect(() => {
    if (!rpp.topik_pembelajaran?.trim() && rpp.materi_pokok?.trim()) {
      onChange({ topik_pembelajaran: rpp.materi_pokok });
    }
  }, [rpp.topik_pembelajaran, rpp.materi_pokok]);

  const handleModelChange = (modelId: string) => {
    const targetModel = master.models.find((m) => m.id === modelId);
    const spec = getModelPedagogiSpec(targetModel?.nama);
    const updates: Partial<RppDetailData["rpp"]> = { model_id: modelId };
    if (!rpp.metode_pembelajaran || rpp.metode_pembelajaran.length === 0) {
      updates.metode_pembelajaran = spec.rekomendasi_metode;
    }
    onChange(updates);
    onApplyModelSyntax(modelId);
  };

  const handleApplyRecommendedMetode = () => {
    if (!activeSpec) return;
    onChange({ metode_pembelajaran: activeSpec.rekomendasi_metode });
  };

  const handleMetodeToggle = (metode: string) => {
    const cur = rpp.metode_pembelajaran || [];
    const updated = cur.includes(metode)
      ? cur.filter((m) => m !== metode)
      : [...cur, metode];
    onChange({ metode_pembelajaran: updated });
  };

  const daftarMetodePilihan = [
    "Diskusi Kelompok",
    "Tanya Jawab Interaktif",
    "Presentasi Murid",
    "Eksperimen / Praktik",
    "Studi Kasus Kontekstual",
    "Bermain Peran (Role Play)",
    "Demonstrasi",
    "Refleksi Terbimbing",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">
          Langkah 3 — Desain Pembelajaran & Praktik Pedagogis
        </h3>
        <p className="text-xs text-slate-600">
          Perumusan tujuan pembelajaran, pemilihan model pembelajaran mendalam,
          metode, kemitraan, serta desain lingkungan belajar fisik dan digital.
        </p>
      </div>

      {/* [L] Capaian Pembelajaran (Read-Only) */}
      {isLengkap && master.capaianPembelajaran && (
        <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-800" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Capaian Pembelajaran (CP) Terkait [Fase D — Elemen:{" "}
              {master.capaianPembelajaran.elemen}]
            </h4>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-sans">
            {master.capaianPembelajaran.deskripsi_cp}
          </p>
        </div>
      )}

      {/* Bagian A: Tujuan Pembelajaran (TP) & Topik */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
        {isLengkap && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                Topik Pembelajaran [Versi Lengkap] <span className="text-rose-500">*</span>
              </Label>
              {rpp.materi_pokok && (
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Ditarik otomatis dari RPP
                </span>
              )}
            </div>
            <Input
              value={rpp.topik_pembelajaran || rpp.materi_pokok || ""}
              onChange={(e) => onChange({ topik_pembelajaran: e.target.value })}
              placeholder="Topik ditarik otomatis dari materi pokok RPP..."
              className="text-xs font-semibold"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <p>
                Ditarik otomatis dari topik/materi pokok RPP yang sedang dibuat.
              </p>
              {rpp.topik_pembelajaran && rpp.materi_pokok && rpp.topik_pembelajaran !== rpp.materi_pokok && (
                <button
                  type="button"
                  onClick={() => onChange({ topik_pembelajaran: rpp.materi_pokok })}
                  className="text-emerald-700 hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  Kembalikan ke topik awal ({rpp.materi_pokok})
                </button>
              )}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-800">
            Tujuan Pembelajaran RPP Ini <span className="text-rose-500">*</span>
          </Label>
          <Textarea
            rows={3}
            value={rpp.tujuan_pembelajaran_teks}
            onChange={(e) => onChange({ tujuan_pembelajaran_teks: e.target.value })}
            placeholder="Tuliskan tujuan pembelajaran spesifik untuk rangkaian pertemuan ini..."
            className="text-xs leading-relaxed"
          />
          <p className="text-[11px] text-slate-500">
            Ditarik dari TP terpilih dan dapat disunting atau diperinci khusus untuk
            modul ajar ini.
          </p>
        </div>

        {/* [L] Lintas Disiplin Ilmu */}
        {isLengkap && (
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              Lintas Disiplin Ilmu [Versi Lengkap]
            </Label>
            <Textarea
              rows={2}
              value={rpp.lintas_disiplin_ilmu || ""}
              onChange={(e) => onChange({ lintas_disiplin_ilmu: e.target.value })}
              placeholder="Integrasi dengan Bahasa Indonesia (kejelasan artikulasi), Seni Budaya (irama tilawah), dan IPA/Kesehatan (pernapasan)..."
              className="text-xs"
            />
          </div>
        )}
      </div>

      {/* Bagian B: Model & Metode Pembelajaran */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              Model Pembelajaran Mendalam <span className="text-rose-500">*</span>
            </Label>
            <span className="text-[10px] text-emerald-700 font-semibold">
              Sintaks & Pengalaman Belajar (Langkah 4) otomatis menyesuaikan model
            </span>
          </div>

          <Select
            value={rpp.model_id || ""}
            onValueChange={(val) => {
              if (val) handleModelChange(val);
            }}
          >
            <SelectTrigger className="text-xs h-9 font-semibold">
              <SelectValue placeholder="Pilih Model Pembelajaran..." />
            </SelectTrigger>
            <SelectContent>
              {master.models.map((m) => (
                <SelectItem key={`m-opt-${m.id}`} value={m.id} className="text-xs">
                  {m.nama} ({m.sintaks.length} Sintaks)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-slate-500">
            Memilih model akan menyesuaikan format pengalaman belajar, sintaks guru-murid, proporsi durasi, dan LKPD secara otomatis.
          </p>
        </div>

        {/* Panel Riset Pedagogis & Struktur Sintaks Model */}
        {activeSpec && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-emerald-200/70">
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-xs font-bold text-emerald-950">
                    {activeSpec.nama_resmi}
                  </h4>
                  <Badge
                    variant="outline"
                    className="bg-white border-emerald-300 text-emerald-800 text-[10px] font-semibold"
                  >
                    {activeSpec.pendekatan_label}
                  </Badge>
                </div>
                <p className="text-[11px] font-medium text-emerald-800">
                  Format Pengalaman Belajar: <span className="font-bold">{activeSpec.format_pengalaman_label}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => rpp.model_id && onApplyModelSyntax(rpp.model_id)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Terapkan Ulang Sintaks ke Langkah 4
              </button>
            </div>

            <div className="text-xs text-slate-700 leading-relaxed bg-white/80 p-3 rounded-lg border border-emerald-100 flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900">Landasan & Karakteristik Model: </span>
                {activeSpec.ringkasan_riset}
              </div>
            </div>

            {/* Pemetaan Alur 3M (Memahami, Mengaplikasi, Merefleksi) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="bg-white p-2.5 rounded-lg border border-blue-200/80 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 px-2 py-0.5 rounded inline-block">
                  1. {activeSpec.struktur_3m.memahami.judul_fase}
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {activeSpec.struktur_3m.memahami.deskripsi_fase}
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-emerald-200/80 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                  2. {activeSpec.struktur_3m.mengaplikasi.judul_fase}
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {activeSpec.struktur_3m.mengaplikasi.deskripsi_fase}
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-purple-200/80 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-50 px-2 py-0.5 rounded inline-block">
                  3. {activeSpec.struktur_3m.merefleksi.judul_fase}
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {activeSpec.struktur_3m.merefleksi.deskripsi_fase}
                </p>
              </div>
            </div>

            {/* Daftar Sintaks Model */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-emerald-950">
                Rincian Sintaks ({activeSpec.sintaks_list.length} Tahapan Inti):
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {activeSpec.sintaks_list.map((stx) => (
                  <div
                    key={`preview-stx-${stx.urutan}`}
                    className="bg-white p-2.5 rounded-lg border border-slate-200/90 flex items-start gap-2"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {stx.urutan}
                    </span>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">
                          {stx.nama_sintaks}
                        </span>
                        <span className="text-[10px] text-slate-500 italic">
                          ({stx.nama_inggris})
                        </span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                            stx.pengalaman_belajar === "memahami"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : stx.pengalaman_belajar === "mengaplikasi"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}
                        >
                          {stx.pengalaman_belajar}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {stx.fokus_sintaks}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Metode Pembelajaran */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-800">
              Metode / Strategi Pembelajaran
            </Label>
            {activeSpec && (
              <button
                type="button"
                onClick={handleApplyRecommendedMetode}
                className="text-[11px] text-emerald-700 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3 h-3" />
                Gunakan Rekomendasi Metode {activeSpec.singkatan}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {daftarMetodePilihan.map((metode) => {
              const isSelected = (rpp.metode_pembelajaran || []).includes(metode);
              const isRecommended = activeSpec?.rekomendasi_metode.includes(metode);
              return (
                <button
                  key={`metode-${metode}`}
                  type="button"
                  onClick={() => handleMetodeToggle(metode)}
                  className={`px-2.5 py-1 rounded-md text-xs border transition-colors inline-flex items-center gap-1 ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 font-semibold"
                      : isRecommended
                      ? "bg-emerald-50/70 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>{metode}</span>
                  {isRecommended && !isSelected && (
                    <span className="text-[9px] bg-emerald-200/80 text-emerald-900 px-1 rounded font-bold">
                      Saran
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bagian C: Lingkungan Pembelajaran, Kemitraan, Digital */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-emerald-600" />
              Ruang Fisik Belajar <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={rpp.lingkungan_belajar_fisik || ""}
              onChange={(e) =>
                onChange({ lingkungan_belajar_fisik: e.target.value })
              }
              placeholder="Ruang kelas, perpustakaan madrasah, atau masjid..."
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800">
              Budaya Belajar Berbasis Cinta
            </Label>
            <Input
              value={rpp.budaya_belajar || ""}
              onChange={(e) => onChange({ budaya_belajar: e.target.value })}
              placeholder="Saling menghormati, kesantunan, berani mencoba, empati..."
              className="text-xs"
            />
          </div>

          {/* [L] Kemitraan Pembelajaran */}
          {isLengkap && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-purple-600" />
                Kemitraan Pembelajaran (Opsional) [Versi Lengkap]
              </Label>
              <Input
                value={rpp.kemitraan_pembelajaran || ""}
                onChange={(e) =>
                  onChange({ kemitraan_pembelajaran: e.target.value })
                }
                placeholder="Guru mapel Bahasa, orang tua murid, tokoh agama setempat..."
                className="text-xs"
              />
            </div>
          )}

          {/* [L] Pemanfaatan Digital */}
          {isLengkap && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-purple-600" />
                Pemanfaatan Digital (Opsional) [Versi Lengkap]
              </Label>
              <Input
                value={rpp.pemanfaatan_digital || ""}
                onChange={(e) => onChange({ pemanfaatan_digital: e.target.value })}
                placeholder="Proyektor LCD, platform Quizizz, audio murottal digital..."
                className="text-xs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
