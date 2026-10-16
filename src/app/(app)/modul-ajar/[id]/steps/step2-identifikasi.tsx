"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, Compass, UserCheck, Sparkles, RotateCcw } from "lucide-react";
import type { RppDetailData, KesiapanMuridData } from "../../actions";
import {
  generateDefaultKesiapanMurid,
  generateDefaultKarakteristik,
} from "@/lib/rpp-suggestions";

interface Step2Props {
  data: RppDetailData;
  onChange: (updates: Partial<RppDetailData["rpp"]>) => void;
}

export function Step2Identifikasi({ data, onChange }: Step2Props) {
  const { rpp, master, penugasan } = data;
  const isLengkap = rpp.versi === "lengkap";

  // Auto-fill saran jika masih kosong saat komponen dibuka
  React.useEffect(() => {
    const defaultKm = generateDefaultKesiapanMurid(rpp.materi_pokok, penugasan?.mapel?.nama);
    const defaultKarakter = generateDefaultKarakteristik(rpp.materi_pokok, penugasan?.mapel?.nama);
    const updates: Partial<RppDetailData["rpp"]> = {};

    let kmChanged = false;
    const currentKm = { ...(rpp.kesiapan_murid || {}) };
    (Object.keys(defaultKm) as Array<keyof KesiapanMuridData>).forEach((k) => {
      if (!currentKm[k] || !currentKm[k].trim()) {
        currentKm[k] = defaultKm[k];
        kmChanged = true;
      }
    });

    if (kmChanged) {
      updates.kesiapan_murid = currentKm as KesiapanMuridData;
    }
    if (!rpp.karakteristik_materi || !rpp.karakteristik_materi.trim()) {
      updates.karakteristik_materi = defaultKarakter.karakteristik_materi;
    }
    if (!rpp.benang_merah_kbc || !rpp.benang_merah_kbc.trim()) {
      updates.benang_merah_kbc = defaultKarakter.benang_merah_kbc;
    }

    if (Object.keys(updates).length > 0) {
      onChange(updates);
    }
  }, [rpp.materi_pokok, penugasan?.mapel?.nama]);

  // Muat ulang saran standar jika pengguna ingin reset
  const handleResetSuggestions = () => {
    const defaultKm = generateDefaultKesiapanMurid(rpp.materi_pokok, penugasan?.mapel?.nama);
    const defaultKarakter = generateDefaultKarakteristik(rpp.materi_pokok, penugasan?.mapel?.nama);
    onChange({
      kesiapan_murid: defaultKm,
      karakteristik_materi: defaultKarakter.karakteristik_materi,
      benang_merah_kbc: defaultKarakter.benang_merah_kbc,
    });
  };

  // Toggle DPL
  const handleToggleDpl = (dplId: string) => {
    const current = rpp.dimensi_profil_lulusan_ids || [];
    const updated = current.includes(dplId)
      ? current.filter((id) => id !== dplId)
      : [...current, dplId];
    onChange({ dimensi_profil_lulusan_ids: updated });
  };

  // Toggle Panca Cinta
  const handleTogglePc = (pcId: string) => {
    const current = rpp.panca_cinta_ids || [];
    const updated = current.includes(pcId)
      ? current.filter((id) => id !== pcId)
      : [...current, pcId];
    onChange({ panca_cinta_ids: updated });
  };

  // Update Kesiapan Murid
  const handleKesiapanChange = (key: keyof KesiapanMuridData, val: string) => {
    onChange({
      kesiapan_murid: {
        ...rpp.kesiapan_murid,
        [key]: val,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Langkah 2 — Identifikasi Karakteristik & Nilai Cinta
          </h3>
          <p className="text-xs text-slate-600">
            Pemetaan kesiapan murid, karakteristik materi, Dimensi Profil Lulusan (DPL),
            serta penguatan nilai Panca Cinta Kurikulum Berbasis Cinta (KBC).
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetSuggestions}
          className="self-start sm:self-auto text-[11px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
          title="Muat ulang saran standar kurikulum untuk materi ini"
        >
          <RotateCcw className="w-3 h-3 text-purple-600" />
          Muat Ulang Saran
        </button>
      </div>

      {/* Bagian A: [L] Kesiapan Murid (Hanya Versi Lengkap) */}
      {isLengkap ? (
        <div className="bg-purple-50/50 p-5 rounded-xl border border-purple-200 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                A. Kesiapan & Kebutuhan Murid [Versi Lengkap]
              </h4>
              <span className="text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                Saran Otomatis Aktif
              </span>
            </div>
            <Badge className="bg-purple-700 text-white text-[10px]">
              Tabel 3.5 Kemenag
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">
                Pengetahuan Awal Murid <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                rows={2}
                value={rpp.kesiapan_murid?.pengetahuan_awal || ""}
                onChange={(e) =>
                  handleKesiapanChange("pengetahuan_awal", e.target.value)
                }
                placeholder="Sebagian besar murid telah mengenal konsep dasar, namun sebagian masih memerlukan bimbingan membaca..."
                className="text-xs bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">
                Minat & Latar Belakang Murid
              </Label>
              <Textarea
                rows={2}
                value={rpp.kesiapan_murid?.minat || ""}
                onChange={(e) => handleKesiapanChange("minat", e.target.value)}
                placeholder="Murid antusias dengan aktivitas visual, studi kasus keseharian, dan praktik kelompok..."
                className="text-xs bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">
                Kebutuhan Belajar / Gaya Belajar
              </Label>
              <Textarea
                rows={2}
                value={rpp.kesiapan_murid?.kebutuhan || ""}
                onChange={(e) => handleKesiapanChange("kebutuhan", e.target.value)}
                placeholder="Variasi gaya belajar: visual, auditori, kinestetik; scaffolding bagi murid berkesulitan..."
                className="text-xs bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-800">
                Strategi Asesmen Awal & Tindak Lanjut
              </Label>
              <Textarea
                rows={2}
                value={rpp.kesiapan_murid?.strategi_asesmen_awal || ""}
                onChange={(e) =>
                  handleKesiapanChange("strategi_asesmen_awal", e.target.value)
                }
                placeholder="Kuis diagnostik lisan di awal pembelajaran. Tindak lanjut: pengelompokan diferensiasi berpasangan..."
                className="text-xs bg-white"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 flex items-center justify-between">
          <span>
            💡 Analisis kesiapan murid disederhanakan pada <strong>Versi Minimum</strong>.
          </span>
          <Badge variant="outline" className="text-[10px]">
            Versi Minimum Aktif
          </Badge>
        </div>
      )}

      {/* Bagian B: Karakteristik Materi */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2 shadow-2xs">
        <Label className="text-xs font-bold text-slate-800">
          Karakteristik Materi Pembelajaran <span className="text-rose-500">*</span>
        </Label>
        <Textarea
          rows={3}
          value={rpp.karakteristik_materi}
          onChange={(e) => onChange({ karakteristik_materi: e.target.value })}
          placeholder="Materi memuat dimensi faktual, konseptual, dan aplikatif yang menuntut kecermatan, pembiasaan tilawah harian, dan penalaran kritis..."
          className="text-xs"
        />
        <p className="text-[11px] text-slate-500">
          Uraikan karakteristik keilmuan materi: tingkat keabstrakan, prasyarat, dan
          kontekstualisasinya dalam kehidupan murid madrasah.
        </p>
      </div>

      {/* Bagian C: Dimensi Profil Lulusan (DPL) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-700" />
            <Label className="text-xs font-bold text-slate-900">
              Dimensi Profil Lulusan (DPL) yang Dikuatkan{" "}
              <span className="text-rose-500">*</span>
            </Label>
          </div>
          <span className="text-[11px] text-slate-500">
            Terpilih: {rpp.dimensi_profil_lulusan_ids.length} dari 8 Dimensi
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {master.dpl.map((d) => {
            const isChecked = rpp.dimensi_profil_lulusan_ids.includes(d.id);
            return (
              <label
                key={`dpl-${d.id}`}
                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2 ${
                  isChecked
                    ? "border-emerald-600 bg-emerald-50/60 shadow-2xs text-slate-900 font-semibold"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleDpl(d.id)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="text-[10px] font-mono text-emerald-700">
                    [{d.kode}]
                  </div>
                  <div className="leading-snug">{d.nama}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Bagian D: Topik Panca Cinta & Materi Integrasi KBC */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-600" />
            <Label className="text-xs font-bold text-slate-900">
              Topik Panca Cinta KBC yang Diintegrasikan{" "}
              <span className="text-rose-500">*</span>
            </Label>
          </div>
          <span className="text-[11px] text-slate-500">
            Terpilih: {rpp.panca_cinta_ids.length} Topik
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {master.pancaCinta.map((pc) => {
            const isChecked = rpp.panca_cinta_ids.includes(pc.id);
            return (
              <label
                key={`pc-${pc.id}`}
                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2 ${
                  isChecked
                    ? "border-rose-400 bg-rose-50/60 shadow-2xs text-slate-900 font-bold"
                    : "border-slate-200 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleTogglePc(pc.id)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                />
                <div className="flex-1">
                  <div className="text-[10px] font-mono text-rose-700">
                    [{pc.kode}]
                  </div>
                  <div className="leading-snug">{pc.nama}</div>
                </div>
              </label>
            );
          })}
        </div>

        {/* Pilihan Materi KBC Terintegrasi (Terfilter berdasarkan Panca Cinta yang dipilih) */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-800">
              Modul Nilai Materi Integrasi KBC
            </Label>
            <span className="text-[11px] text-slate-500">
              {rpp.panca_cinta_ids.length === 0
                ? "Pilih topik Panca Cinta di atas terlebih dahulu"
                : `Terpilih ${rpp.materi_kbc_ids?.length || 0} Nilai`}
            </span>
          </div>

          {rpp.panca_cinta_ids.length === 0 ? (
            <div className="p-3 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-500">
              Pilih minimal satu topik Panca Cinta di atas untuk memfilter materi integrasi KBC.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {master.materiKbc
                .filter((kbc) => rpp.panca_cinta_ids.includes(kbc.panca_cinta_id))
                .map((kbc) => {
                  const isChecked = (rpp.materi_kbc_ids || []).includes(kbc.id);
                  return (
                    <label
                      key={`kbc-${kbc.id}`}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2 ${
                        isChecked
                          ? "border-emerald-500 bg-emerald-50/60 shadow-2xs text-slate-900 font-medium"
                          : "border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const current = rpp.materi_kbc_ids || [];
                          const updated = isChecked
                            ? current.filter((id) => id !== kbc.id)
                            : [...current, kbc.id];
                          onChange({ materi_kbc_ids: updated });
                        }}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-slate-900">{kbc.nilai}</span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded font-medium">
                            {kbc.pilar}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-tight">
                          {kbc.deskripsi}
                        </p>
                      </div>
                    </label>
                  );
                })}
            </div>
          )}
        </div>

        {/* Alasan Benang Merah KBC */}
        <div className="pt-2 space-y-1.5">
          <Label className="text-xs font-bold text-slate-800">
            Benang Merah KBC (Alasan Integrasi Nilai Cinta){" "}
            <span className="text-rose-500">*</span>
          </Label>
          <Textarea
            rows={2}
            value={rpp.benang_merah_kbc}
            onChange={(e) => onChange({ benang_merah_kbc: e.target.value })}
            placeholder="Menghubungkan ketelitian membaca dan menghafal ayat-ayat Al-Qur'an dengan rasa cinta kepada Allah dan Rasul-Nya, serta membangun kasih sayang antarsesama..."
            className="text-xs"
          />
          <p className="text-[11px] text-slate-500">
            Wajib diisi: Penjelasan singkat bagaimana materi ini menumbuhkan nilai
            spiritual, kemanusiaan, atau kepedulian lingkungan.
          </p>
        </div>

        {/* Materi Integrasi Custom (Opsional) */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-800">
            Materi Integrasi KBC Tambahan (Opsional)
          </Label>
          <Input
            value={rpp.materi_kbc_custom || ""}
            onChange={(e) => onChange({ materi_kbc_custom: e.target.value })}
            placeholder="Contoh: Mengaitkan kisah sahabat Nabi dalam menjaga adab berteman..."
            className="text-xs"
          />
        </div>
      </div>
    </div>
  );
}
