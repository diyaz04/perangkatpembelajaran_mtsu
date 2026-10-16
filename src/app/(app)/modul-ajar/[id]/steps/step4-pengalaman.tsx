"use client";

import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Trash2,
  Clock,
  Heart,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
  RotateCcw,
  UserCheck,
  Users,
  BookOpen,
  Scale,
} from "lucide-react";
import type {
  RppDetailData,
  RppLangkahPayload,
} from "../../actions";
import type {
  TahapKegiatan,
  PengalamanBelajar,
} from "@/types/database";
import {
  getModelPedagogiSpec,
  parseLangkahDeskripsi,
  formatSintaksDeskripsi,
  formatTahapUmumDeskripsi,
  distributeSintaksDurations,
  type ModeDistribusiPertemuan,
  type SintaksRisetContext,
} from "@/lib/rpp-model-pedagogi";

interface Step4Props {
  data: RppDetailData;
  langkahList: RppLangkahPayload[];
  onChangeLangkah: (updated: RppLangkahPayload[]) => void;
  onChangeRpp?: (updates: Partial<RppDetailData["rpp"]>) => void;
  onApplyModelSyntax?: (
    modelId: string,
    modeDistribusi?: ModeDistribusiPertemuan
  ) => void;
  modeDistribusiSintaks?: ModeDistribusiPertemuan;
  onChangeModeDistribusi?: (mode: ModeDistribusiPertemuan) => void;
}

export function Step4Pengalaman({
  data,
  langkahList,
  onChangeLangkah,
  onChangeRpp,
  onApplyModelSyntax,
  modeDistribusiSintaks = "utuh_per_pertemuan",
  onChangeModeDistribusi,
}: Step4Props) {
  const { rpp, master, penugasan } = data;
  const jumlahPertemuan = rpp.jumlah_pertemuan || 2;
  const alokasiJp = rpp.alokasi_jp || 4;
  const menitPerJp = rpp.menit_per_jp || 40;
  const targetDurasi = Math.round((alokasiJp / jumlahPertemuan) * menitPerJp);

  const [activePertemuan, setActivePertemuan] = useState<number>(1);

  // Model Pembelajaran aktif
  const selectedModel =
    master.models.find((m) => m.id === rpp.model_id) || master.models[0] || null;
  const activeSpec = getModelPedagogiSpec(selectedModel?.nama);

  // Filter langkah untuk pertemuan aktif
  const currentLangkah = langkahList.filter(
    (l) => l.pertemuan_ke === activePertemuan
  );

  // Ambil topik Panca Cinta yang dipilih di Identifikasi
  const selectedPcList = master.pancaCinta.filter((p) =>
    rpp.panca_cinta_ids.includes(p.id)
  );

  // Cek integrasi Panca Cinta di seluruh langkah
  const integratedPcIds = new Set(
    langkahList.map((l) => l.panca_cinta_id).filter(Boolean)
  );

  // Konteks penyusunan sintaks untuk pertemuan aktif
  const buildCurrentContext = (): SintaksRisetContext => ({
    materi: rpp.materi_pokok || "Materi Pokok",
    topik: rpp.topik_pembelajaran || rpp.materi_pokok || "Topik Pembelajaran",
    mapel: penugasan?.mapel?.nama || "Mata Pelajaran",
    tingkatKelas: penugasan?.tingkat_kelas || 7,
    pertemuanKe: activePertemuan,
    totalPertemuan: jumlahPertemuan,
  });

  // Cek pengalaman belajar di pertemuan aktif
  const countMemahami = currentLangkah.filter((l) => l.pengalaman === "memahami").length;
  const countMengaplikasi = currentLangkah.filter((l) => l.pengalaman === "mengaplikasi").length;
  const countMerefleksi = currentLangkah.filter((l) => l.pengalaman === "merefleksi").length;

  // Hitung total durasi di pertemuan aktif
  const currentTotalDurasi = currentLangkah.reduce(
    (sum, l) => sum + Number(l.durasi_menit || 0),
    0
  );
  const durasiPas = currentTotalDurasi === targetDurasi;
  const durasiKurang = currentTotalDurasi < targetDurasi;

  // Handler ganti model langsung dari Langkah 4
  const handleSelectModelInStep4 = (modelId: string) => {
    onChangeRpp?.({ model_id: modelId });
    onApplyModelSyntax?.(modelId, modeDistribusiSintaks);
  };

  // Seimbangkan durasi langkah di pertemuan aktif agar tepat sama dengan targetDurasi
  const handleBalanceDurations = () => {
    if (currentLangkah.length === 0) return;
    const awalSteps = currentLangkah.filter((l) => l.tahap === "awal");
    const intiSteps = currentLangkah.filter((l) => l.tahap === "inti");
    const penutupSteps = currentLangkah.filter((l) => l.tahap === "penutup");

    const durasiAwal = targetDurasi >= 70 ? 10 : Math.max(5, Math.round(targetDurasi * 0.12));
    const durasiPenutup = targetDurasi >= 70 ? 10 : Math.max(5, Math.round(targetDurasi * 0.12));
    const totalInti = Math.max(20, targetDurasi - durasiAwal - durasiPenutup);

    const weights = intiSteps.map((step, idx) => {
      const parsed = parseLangkahDeskripsi(step.deskripsi_kegiatan);
      const matchedStx =
        activeSpec.sintaks_list.find(
          (s) =>
            (parsed.urutanSintaks && s.urutan === parsed.urutanSintaks) ||
            (parsed.namaSintaks &&
              s.nama_sintaks.toLowerCase() === parsed.namaSintaks.toLowerCase())
        ) || activeSpec.sintaks_list[idx];
      return matchedStx?.bobot_durasi || Math.round(100 / Math.max(1, intiSteps.length));
    });

    const intiDurations = distributeSintaksDurations(weights, totalInti);

    const copy = [...langkahList];
    awalSteps.forEach((step, idx) => {
      const gIdx = copy.indexOf(step);
      if (gIdx !== -1) {
        copy[gIdx] = {
          ...copy[gIdx],
          durasi_menit: idx === 0 ? durasiAwal : 5,
        };
      }
    });
    intiSteps.forEach((step, idx) => {
      const gIdx = copy.indexOf(step);
      if (gIdx !== -1) {
        copy[gIdx] = {
          ...copy[gIdx],
          durasi_menit: intiDurations[idx] || 10,
        };
      }
    });
    penutupSteps.forEach((step, idx) => {
      const gIdx = copy.indexOf(step);
      if (gIdx !== -1) {
        copy[gIdx] = {
          ...copy[gIdx],
          durasi_menit: idx === 0 ? durasiPenutup : 5,
        };
      }
    });

    onChangeLangkah(copy);
  };

  // Tambah langkah baru pada blok tertentu
  const handleAddLangkah = (tahap: TahapKegiatan) => {
    const ctx = buildCurrentContext();
    const langkahTahap = currentLangkah.filter((l) => l.tahap === tahap);

    if (tahap === "inti") {
      const nextSintaks =
        activeSpec.sintaks_list[langkahTahap.length % activeSpec.sintaks_list.length] ||
        activeSpec.sintaks_list[0];
      const deskripsi = nextSintaks
        ? formatSintaksDeskripsi({
            urutanSintaks: nextSintaks.urutan,
            namaSintaks: nextSintaks.nama_sintaks,
            namaInggris: nextSintaks.nama_inggris,
            aktivitasGuru: nextSintaks.buildAktivitasGuru(ctx),
            aktivitasMurid: nextSintaks.buildAktivitasMurid(ctx),
          })
        : formatSintaksDeskripsi({
            urutanSintaks: langkahTahap.length + 1,
            namaSintaks: "Tahap Eksplorasi & Aplikasi",
            namaInggris: "Core Activity",
            aktivitasGuru: `Guru memfasilitasi murid mendalami materi "${ctx.materi}".`,
            aktivitasMurid: `Murid melaksanakan aktivitas kolaboratif terkait "${ctx.materi}".`,
          });

      const newLangkah: RppLangkahPayload = {
        pertemuan_ke: activePertemuan,
        tahap: "inti",
        pengalaman: nextSintaks?.pengalaman_belajar || "mengaplikasi",
        deskripsi_kegiatan: deskripsi,
        durasi_menit: 15,
        urutan: currentLangkah.length + 1,
        prinsip: nextSintaks?.prinsip_default || ["berkesadaran", "bermakna"],
        panca_cinta_id: selectedPcList[0]?.id || null,
        aksi_kbc:
          nextSintaks?.buildAksiKbc(
            ctx,
            selectedPcList[0]?.nama || "Cinta Ilmu"
          ) || null,
      };
      onChangeLangkah([...langkahList, newLangkah]);
      return;
    }

    const templateUmum =
      tahap === "awal"
        ? activeSpec.buildKegiatanAwal(ctx)
        : activeSpec.buildKegiatanPenutup(ctx);

    const newLangkah: RppLangkahPayload = {
      pertemuan_ke: activePertemuan,
      tahap,
      pengalaman: tahap === "awal" ? "memahami" : "merefleksi",
      deskripsi_kegiatan: formatTahapUmumDeskripsi({
        labelTahap:
          tahap === "awal"
            ? `Orientasi, Apersepsi & Motivasi Awal — Model ${activeSpec.singkatan}`
            : `Refleksi Cinta, Konfirmasi & Penutup — Model ${activeSpec.singkatan}`,
        aktivitasGuru: templateUmum.aktivitas_guru,
        aktivitasMurid: templateUmum.aktivitas_murid,
      }),
      durasi_menit: 10,
      urutan: currentLangkah.length + 1,
      prinsip:
        tahap === "awal"
          ? ["berkesadaran", "menggembirakan"]
          : ["berkesadaran", "bermakna"],
      panca_cinta_id: selectedPcList[0]?.id || null,
      aksi_kbc: templateUmum.aksi_kbc,
    };

    onChangeLangkah([...langkahList, newLangkah]);
  };

  // Update sebuah langkah kegiatan
  const handleUpdateLangkah = (
    itemIndexInCurrent: number,
    field: Partial<RppLangkahPayload>
  ) => {
    const targetItem = currentLangkah[itemIndexInCurrent];
    const globalIndex = langkahList.findIndex((l) => l === targetItem);
    if (globalIndex === -1) return;

    const copy = [...langkahList];
    copy[globalIndex] = { ...copy[globalIndex], ...field };
    onChangeLangkah(copy);
  };

  // Reset 1 langkah ke template asli sintaks model
  const handleResetSingleStepToModel = (
    itemIndexInCurrent: number,
    sintaksUrutan?: number
  ) => {
    const targetItem = currentLangkah[itemIndexInCurrent];
    if (!targetItem) return;
    const ctx = buildCurrentContext();

    if (targetItem.tahap === "awal") {
      const awalTpl = activeSpec.buildKegiatanAwal(ctx);
      handleUpdateLangkah(itemIndexInCurrent, {
        pengalaman: "memahami",
        deskripsi_kegiatan: formatTahapUmumDeskripsi({
          labelTahap: `Orientasi, Apersepsi & Motivasi Awal — Model ${activeSpec.singkatan}`,
          aktivitasGuru: awalTpl.aktivitas_guru,
          aktivitasMurid: awalTpl.aktivitas_murid,
        }),
        prinsip: ["berkesadaran", "menggembirakan"],
        aksi_kbc: awalTpl.aksi_kbc,
      });
      return;
    }

    if (targetItem.tahap === "penutup") {
      const penutupTpl = activeSpec.buildKegiatanPenutup(ctx);
      handleUpdateLangkah(itemIndexInCurrent, {
        pengalaman: "merefleksi",
        deskripsi_kegiatan: formatTahapUmumDeskripsi({
          labelTahap: `Refleksi Cinta, Konfirmasi & Penutup — Model ${activeSpec.singkatan}`,
          aktivitasGuru: penutupTpl.aktivitas_guru,
          aktivitasMurid: penutupTpl.aktivitas_murid,
        }),
        prinsip: ["berkesadaran", "bermakna"],
        aksi_kbc: penutupTpl.aksi_kbc,
      });
      return;
    }

    const stx =
      activeSpec.sintaks_list.find((s) => s.urutan === sintaksUrutan) ||
      activeSpec.sintaks_list[0];
    if (!stx) return;

    const pcItem =
      selectedPcList[(stx.urutan - 1) % Math.max(1, selectedPcList.length)] ||
      selectedPcList[0];

    handleUpdateLangkah(itemIndexInCurrent, {
      pengalaman: stx.pengalaman_belajar,
      deskripsi_kegiatan: formatSintaksDeskripsi({
        urutanSintaks: stx.urutan,
        namaSintaks: stx.nama_sintaks,
        namaInggris: stx.nama_inggris,
        aktivitasGuru: stx.buildAktivitasGuru(ctx),
        aktivitasMurid: stx.buildAktivitasMurid(ctx),
      }),
      prinsip: [...stx.prinsip_default],
      panca_cinta_id: pcItem?.id || targetItem.panca_cinta_id,
      aksi_kbc: stx.buildAksiKbc(ctx, pcItem?.nama || "Cinta Ilmu"),
    });
  };

  // Hapus sebuah langkah kegiatan
  const handleDeleteLangkah = (itemIndexInCurrent: number) => {
    const targetItem = currentLangkah[itemIndexInCurrent];
    const updated = langkahList.filter((l) => l !== targetItem);
    onChangeLangkah(updated);
  };

  // Toggle label prinsip (berkesadaran, bermakna, menggembirakan)
  const handleTogglePrinsip = (
    itemIndexInCurrent: number,
    val: "berkesadaran" | "bermakna" | "menggembirakan"
  ) => {
    const targetItem = currentLangkah[itemIndexInCurrent];
    const currentPrinsip = targetItem.prinsip || [];
    const updatedPrinsip = currentPrinsip.includes(val)
      ? currentPrinsip.filter((p) => p !== val)
      : [...currentPrinsip, val];
    handleUpdateLangkah(itemIndexInCurrent, { prinsip: updatedPrinsip });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Langkah 4 — Pengalaman Belajar Berbasis Sintaks Model Pembelajaran
          </h3>
          <p className="text-xs text-slate-600">
            Format pengalaman pembelajaran disesuaikan secara spesifik dengan sintaks model{" "}
            <strong className="text-emerald-800">{activeSpec.nama_resmi}</strong>,
            alur 3M (Memahami, Mengaplikasi, Merefleksi), dan integrasi Panca Cinta.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BANNER KONTROL MODEL PEMBELAJARAN & KOMPONEN KHAS MODEL */}
      {/* ========================================================================= */}
      <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 space-y-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-emerald-200/80">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-700 text-white text-[10px] font-bold">
                <Layers className="w-3 h-3 mr-1" />
                Format Model Aktif
              </Badge>
              <span className="text-sm font-bold text-emerald-950">
                {activeSpec.nama_resmi}
              </span>
              <Badge
                variant="outline"
                className="bg-white border-emerald-300 text-emerald-800 text-[10px] font-semibold"
              >
                {activeSpec.sintaks_list.length} Sintaks Baku
              </Badge>
            </div>
            <p className="text-xs text-emerald-900 font-medium">
              Struktur Format: <strong>{activeSpec.format_pengalaman_label}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Pemilih Model Langsung di Step 4 */}
            <div className="w-full sm:w-[270px]">
              <Select
                value={rpp.model_id || selectedModel?.id || ""}
                onValueChange={(val) => {
                  if (val) handleSelectModelInStep4(val);
                }}
              >
                <SelectTrigger className="h-8 text-xs font-semibold bg-white border-emerald-300">
                  <SelectValue placeholder="Pilih Model Pembelajaran..." />
                </SelectTrigger>
                <SelectContent>
                  {master.models.map((m) => (
                    <SelectItem key={`s4-m-${m.id}`} value={m.id} className="text-xs">
                      {m.nama} ({m.sintaks.length} Sintaks)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {onApplyModelSyntax && (
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  onApplyModelSyntax(
                    rpp.model_id || selectedModel?.id || "",
                    modeDistribusiSintaks
                  )
                }
                className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Muat Ulang Sintaks {activeSpec.singkatan}
              </Button>
            )}
          </div>
        </div>

        {/* Mode Distribusi Sintaks Lintas Pertemuan (Jika > 1 Pertemuan) */}
        {jumlahPertemuan > 1 && onChangeModeDistribusi && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/90 p-2.5 rounded-lg border border-emerald-200/80 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Pola Distribusi Sintaks ({jumlahPertemuan} Pertemuan):</strong>{" "}
                Pilih bagaimana {activeSpec.sintaks_list.length} sintaks{" "}
                {activeSpec.singkatan} dijabarkan pada setiap pertemuan:
              </span>
            </div>
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => onChangeModeDistribusi("utuh_per_pertemuan")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  modeDistribusiSintaks === "utuh_per_pertemuan"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Siklus Utuh per Pertemuan ({activeSpec.sintaks_list.length} Sintaks/Pertemuan)
              </button>
              <button
                type="button"
                onClick={() => onChangeModeDistribusi("berjenjang_lintas_pertemuan")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  modeDistribusiSintaks === "berjenjang_lintas_pertemuan"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sintaks Berjenjang Lintas Pertemuan
              </button>
            </div>
          </div>
        )}

        {/* 3 Komponen Khas Model Pembelajaran Terpilih */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {activeSpec.komponen_khas.map((komp, idx) => (
            <div
              key={`komp-khas-${idx}`}
              className="bg-white p-3 rounded-lg border border-emerald-200/80 space-y-1"
            >
              <div className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span>{komp.label}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {komp.getNilaiKontekstual(
                  rpp.materi_pokok || "Materi Pokok",
                  penugasan?.mapel?.nama || "Mata Pelajaran"
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Pemetaan 3M Spesifik Model */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-lg p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
              Fase 1 • {activeSpec.struktur_3m.memahami.judul_fase}
            </div>
            <p className="text-[11px] text-blue-950/80 mt-0.5 leading-snug">
              {activeSpec.struktur_3m.memahami.deskripsi_fase}
            </p>
          </div>
          <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-lg p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-900">
              Fase 2 • {activeSpec.struktur_3m.mengaplikasi.judul_fase}
            </div>
            <p className="text-[11px] text-emerald-950/80 mt-0.5 leading-snug">
              {activeSpec.struktur_3m.mengaplikasi.deskripsi_fase}
            </p>
          </div>
          <div className="bg-purple-50/70 border border-purple-200/80 rounded-lg p-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-900">
              Fase 3 • {activeSpec.struktur_3m.merefleksi.judul_fase}
            </div>
            <p className="text-[11px] text-purple-950/80 mt-0.5 leading-snug">
              {activeSpec.struktur_3m.merefleksi.deskripsi_fase}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Switcher Pertemuan */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: jumlahPertemuan }).map((_, idx) => {
            const pNum = idx + 1;
            const isTabActive = activePertemuan === pNum;
            return (
              <button
                key={`tab-p-${pNum}`}
                type="button"
                onClick={() => setActivePertemuan(pNum)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  isTabActive
                    ? "bg-white text-emerald-800 shadow-2xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                Pertemuan {pNum}
              </button>
            );
          })}
        </div>

        {/* Ringkasan Durasi Pertemuan Aktif */}
        <div className="flex items-center gap-2 pr-2">
          {!durasiPas && (
            <button
              type="button"
              onClick={handleBalanceDurations}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 shadow-2xs cursor-pointer"
              title="Sesuaikan otomatis durasi menit seluruh sintaks agar tepat sama dengan target JP"
            >
              <Scale className="w-3 h-3 text-emerald-600" />
              Seimbangkan ke {targetDurasi} Menit
            </button>
          )}
          <Badge
            className={`text-xs font-mono font-bold ${
              durasiPas
                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                : durasiKurang
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : "bg-rose-100 text-rose-800 border-rose-300"
            }`}
          >
            <Clock className="w-3.5 h-3.5 mr-1" />
            Total: {currentTotalDurasi} / {targetDurasi} menit
          </Badge>
        </div>
      </div>

      {/* Panel Validasi Kritis Langkah 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Validasi Pengalaman Belajar */}
        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
          <div className="font-bold text-slate-800 flex items-center justify-between">
            <span>Keseimbangan Pengalaman Belajar (3M):</span>
            {countMemahami > 0 && countMengaplikasi > 0 && countMerefleksi > 0 ? (
              <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Lengkap
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-800 text-[10px]">
                <AlertCircle className="w-3 h-3 mr-1" /> Perlu Dilengkapi
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                countMemahami > 0
                  ? "bg-blue-50 text-blue-800 border-blue-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              Memahami ({countMemahami})
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                countMengaplikasi > 0
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              Mengaplikasi ({countMengaplikasi})
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                countMerefleksi > 0
                  ? "bg-purple-50 text-purple-800 border-purple-200"
                  : "bg-slate-50 text-slate-500 border-slate-200"
              }`}
            >
              Merefleksi ({countMerefleksi})
            </span>
          </div>
        </div>

        {/* Validasi Integrasi Panca Cinta */}
        <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
          <div className="font-bold text-slate-800 flex items-center justify-between">
            <span>Integrasi Panca Cinta Terpilih:</span>
            {selectedPcList.every((p) => integratedPcIds.has(p.id)) ? (
              <Badge className="bg-rose-100 text-rose-800 text-[10px]">
                <Heart className="w-3 h-3 mr-1 fill-rose-600" /> Semua Terintegrasi
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-800 text-[10px]">
                Belum Terintegrasi Semua
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedPcList.map((pc) => {
              const isIntegrated = integratedPcIds.has(pc.id);
              return (
                <span
                  key={`pc-badge-${pc.id}`}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border flex items-center gap-1 ${
                    isIntegrated
                      ? "bg-rose-50 text-rose-900 border-rose-300"
                      : "bg-slate-50 text-slate-400 border-slate-200 line-through"
                  }`}
                >
                  <Heart className={`w-2.5 h-2.5 ${isIntegrated ? "fill-rose-500" : ""}`} />
                  {pc.nama}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3 BLOK TETAP: KEGIATAN AWAL, INTI (SINTAKS MODEL), PENUTUP */}
      {/* ========================================================================= */}
      {(["awal", "inti", "penutup"] as TahapKegiatan[]).map((tahap) => {
        const langkahTahap = currentLangkah.filter((l) => l.tahap === tahap);
        const judulTahap =
          tahap === "awal"
            ? `1. Kegiatan Awal — Orientasi, Apersepsi & Kesiapan Belajar (${activeSpec.singkatan})`
            : tahap === "inti"
            ? `2. Kegiatan Inti — Sintaks ${activeSpec.nama_resmi}`
            : `3. Kegiatan Penutup — Refleksi Panca Cinta, Kesimpulan & Penguatan`;

        const durasiTahap = langkahTahap.reduce(
          (sum, l) => sum + Number(l.durasi_menit || 0),
          0
        );

        let lastPengalamanInInti: PengalamanBelajar | null = null;

        return (
          <div
            key={`blok-${tahap}`}
            className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-900">{judulTahap}</h4>
                </div>
                {tahap === "inti" && (
                  <p className="text-[11px] text-slate-500 mt-0.5 ml-4">
                    Setiap langkah di bawah ini merepresentasikan sintaks resmi{" "}
                    <strong>{activeSpec.singkatan}</strong> beserta rincian{" "}
                    <strong>Aktivitas Fasilitasi Guru</strong> dan{" "}
                    <strong>Aktivitas Pengalaman Belajar Murid</strong>.
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {durasiTahap} menit
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddLangkah(tahap)}
                  className="h-7 text-xs border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {tahap === "inti" ? "Tambah Sintaks" : "Tambah Langkah"}
                </Button>
              </div>
            </div>

            {/* List Langkah */}
            <div className="space-y-4">
              {langkahTahap.map((langkah, idxInTahap) => {
                const currentIdx = currentLangkah.indexOf(langkah);
                const hasPc = Boolean(langkah.panca_cinta_id);
                const parsed = parseLangkahDeskripsi(langkah.deskripsi_kegiatan);

                // Cocokkan spesifikasi sintaks jika tahap === "inti"
                const matchedSintaks =
                  tahap === "inti"
                    ? activeSpec.sintaks_list.find(
                        (s) =>
                          (parsed.urutanSintaks && s.urutan === parsed.urutanSintaks) ||
                          (parsed.namaSintaks &&
                            s.nama_sintaks.toLowerCase() ===
                              parsed.namaSintaks.toLowerCase())
                      ) ||
                      activeSpec.sintaks_list[
                        idxInTahap % activeSpec.sintaks_list.length
                      ]
                    : null;

                // Cek apakah perlu menampilkan sub-header fase 3M di Kegiatan Inti
                const show3MHeader =
                  tahap === "inti" && langkah.pengalaman !== lastPengalamanInInti;
                if (tahap === "inti") {
                  lastPengalamanInInti = langkah.pengalaman;
                }

                const phaseInfo = activeSpec.struktur_3m[langkah.pengalaman];

                const handleStructuredChange = (
                  newGuru: string,
                  newMurid: string,
                  overrideStx?: {
                    urutan: number;
                    nama_sintaks: string;
                    nama_inggris: string;
                  }
                ) => {
                  if (tahap === "inti") {
                    const urutan =
                      overrideStx?.urutan ||
                      parsed.urutanSintaks ||
                      matchedSintaks?.urutan ||
                      idxInTahap + 1;
                    const namaStx =
                      overrideStx?.nama_sintaks ||
                      parsed.namaSintaks ||
                      matchedSintaks?.nama_sintaks ||
                      `Sintaks ${urutan}`;
                    const inggrisStx =
                      overrideStx?.nama_inggris ??
                      parsed.istilahInggris ??
                      matchedSintaks?.nama_inggris ??
                      "";

                    handleUpdateLangkah(currentIdx, {
                      deskripsi_kegiatan: formatSintaksDeskripsi({
                        urutanSintaks: urutan,
                        namaSintaks: namaStx,
                        namaInggris: inggrisStx,
                        aktivitasGuru: newGuru,
                        aktivitasMurid: newMurid,
                      }),
                    });
                  } else {
                    handleUpdateLangkah(currentIdx, {
                      deskripsi_kegiatan: formatTahapUmumDeskripsi({
                        labelTahap:
                          parsed.headerLabel ||
                          (tahap === "awal"
                            ? `Orientasi, Apersepsi & Motivasi Awal — Model ${activeSpec.singkatan}`
                            : `Refleksi Cinta, Konfirmasi & Penutup — Model ${activeSpec.singkatan}`),
                        aktivitasGuru: newGuru,
                        aktivitasMurid: newMurid,
                      }),
                    });
                  }
                };

                const guruText =
                  parsed.aktivitasGuru ||
                  (tahap !== "inti" ? "" : "");
                const muridText =
                  parsed.aktivitasMurid ||
                  (!parsed.aktivitasGuru ? parsed.isiUtama : "");

                return (
                  <React.Fragment key={`langkah-${currentIdx}`}>
                    {/* Sub-header Fase 3M pada Kegiatan Inti */}
                    {show3MHeader && phaseInfo && (
                      <div
                        className={`px-3.5 py-2 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-1 ${
                          langkah.pengalaman === "memahami"
                            ? "bg-blue-50/80 border-blue-200 text-blue-950"
                            : langkah.pengalaman === "mengaplikasi"
                            ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                            : "bg-purple-50/80 border-purple-200 text-purple-950"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-xs font-bold uppercase tracking-wider">
                             Tahap Pengalaman Belajar: {phaseInfo.judul_fase}
                          </span>
                        </div>
                        <span className="text-[11px] opacity-85">
                          {phaseInfo.deskripsi_fase}
                        </span>
                      </div>
                    )}

                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3.5 hover:border-slate-300 transition-colors">
                      {/* Baris Atas: Nomor, Sintaks Selector / Badge, Pengalaman 3M, Durasi, Reset & Hapus */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200/70">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {currentIdx + 1}
                          </span>

                          {/* Jika Kegiatan Inti: Pilihan Sintaks Model */}
                          {tahap === "inti" && (
                            <Select
                              value={String(
                                matchedSintaks?.urutan || parsed.urutanSintaks || 1
                              )}
                              onValueChange={(val) => {
                                if (!val) return;
                                const targetUrutan = parseInt(val, 10);
                                const targetStx = activeSpec.sintaks_list.find(
                                  (s) => s.urutan === targetUrutan
                                );
                                if (targetStx) {
                                  const ctx = buildCurrentContext();
                                  handleUpdateLangkah(currentIdx, {
                                    pengalaman: targetStx.pengalaman_belajar,
                                    prinsip: [...targetStx.prinsip_default],
                                    deskripsi_kegiatan: formatSintaksDeskripsi({
                                      urutanSintaks: targetStx.urutan,
                                      namaSintaks: targetStx.nama_sintaks,
                                      namaInggris: targetStx.nama_inggris,
                                      aktivitasGuru:
                                        guruText || targetStx.buildAktivitasGuru(ctx),
                                      aktivitasMurid:
                                        muridText || targetStx.buildAktivitasMurid(ctx),
                                    }),
                                  });
                                }
                              }}
                            >
                              <SelectTrigger className="h-7 text-xs font-bold bg-emerald-50 border-emerald-300 text-emerald-950 w-auto min-w-[220px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {activeSpec.sintaks_list.map((stx) => (
                                  <SelectItem
                                    key={`stx-opt-${stx.urutan}`}
                                    value={String(stx.urutan)}
                                    className="text-xs"
                                  >
                                    Sintaks {stx.urutan}: {stx.nama_sintaks} (
                                    {stx.nama_inggris})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {/* Pengalaman Belajar Select (3M) */}
                          <Select
                            value={langkah.pengalaman}
                            onValueChange={(val) => {
                              if (val) {
                                handleUpdateLangkah(currentIdx, {
                                  pengalaman: val as PengalamanBelajar,
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="w-[135px] h-7 text-xs font-semibold bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="memahami" className="text-xs">
                                Memahami
                              </SelectItem>
                              <SelectItem value="mengaplikasi" className="text-xs">
                                Mengaplikasi
                              </SelectItem>
                              <SelectItem value="merefleksi" className="text-xs">
                                Merefleksi
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          {/* Durasi Input */}
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              min={1}
                              max={120}
                              value={langkah.durasi_menit}
                              onChange={(e) =>
                                handleUpdateLangkah(currentIdx, {
                                  durasi_menit: parseInt(e.target.value, 10) || 5,
                                })
                              }
                              className="w-16 h-7 text-xs font-bold text-center bg-white"
                            />
                            <span className="text-[11px] text-slate-500">menit</span>
                          </div>
                        </div>

                        {/* Tombol Isi Otomatis Sintaks & Hapus */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleResetSingleStepToModel(
                                currentIdx,
                                matchedSintaks?.urutan
                              )
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-colors cursor-pointer"
                            title="Muat ulang rincian aktivitas Guru & Murid sesuai standar sintaks model ini"
                          >
                            <Sparkles className="w-3 h-3" />
                            Saran Sintaks
                          </button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLangkah(currentIdx)}
                            className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                            title="Hapus langkah ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Panduan Fokus Pedagogis Sintaks (Khusus Kegiatan Inti) */}
                      {tahap === "inti" && matchedSintaks && (
                        <div className="bg-white/90 px-3 py-2 rounded-lg border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                          <div className="text-slate-700">
                            <span className="font-bold text-emerald-900">
                              Fokus Sintaks {matchedSintaks.urutan} ({matchedSintaks.nama_inggris}):{" "}
                            </span>
                            {matchedSintaks.fokus_sintaks}
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                            Output: {matchedSintaks.indikator_keterlaksanaan}
                          </span>
                        </div>
                      )}

                      {/* Format Pengalaman Pembelajaran Terstruktur: Aktivitas Guru & Aktivitas Murid */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {/* Kolom 1: Aktivitas Fasilitasi Guru */}
                        <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200/90">
                          <Label className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Aktivitas Fasilitasi Guru
                            </span>
                            <span className="text-[10px] font-normal text-slate-500">
                              Peran & Scaffolding Guru
                            </span>
                          </Label>
                          <Textarea
                            rows={3}
                            value={guruText}
                            onChange={(e) =>
                              handleStructuredChange(e.target.value, muridText)
                            }
                            placeholder="Uraikan bagaimana guru memantik, memfasilitasi, dan membimbing murid pada tahap sintaks ini..."
                            className="text-xs leading-relaxed bg-slate-50/40"
                          />
                        </div>

                        {/* Kolom 2: Aktivitas Pengalaman Belajar Murid */}
                        <div className="space-y-1.5 bg-white p-3 rounded-lg border border-emerald-200/90">
                          <Label className="text-[11px] font-bold text-emerald-950 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-emerald-700" />
                              Aktivitas Pengalaman Belajar Murid
                            </span>
                            <span className="text-[10px] font-normal text-emerald-700">
                              Aktivitas Inti Murid ({langkah.pengalaman})
                            </span>
                          </Label>
                          <Textarea
                            rows={3}
                            value={muridText}
                            onChange={(e) =>
                              handleStructuredChange(guruText, e.target.value)
                            }
                            placeholder="Uraikan aktivitas belajar aktif murid (mengamati, menanya, berkolaborasi, mengaplikasi, merefleksi)..."
                            className="text-xs leading-relaxed bg-emerald-50/20"
                          />
                        </div>
                      </div>

                      {/* Prinsip Pembelajaran Mendalam Badges & Checkbox Panca Cinta */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500 font-medium">
                            Prinsip Pembelajaran Mendalam:
                          </span>
                          {(
                            ["berkesadaran", "bermakna", "menggembirakan"] as const
                          ).map((pr) => {
                            const isSelected = (langkah.prinsip || []).includes(pr);
                            return (
                              <button
                                key={`p-${pr}-${currentIdx}`}
                                type="button"
                                onClick={() => handleTogglePrinsip(currentIdx, pr)}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                                  isSelected
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {pr}
                              </button>
                            );
                          })}
                        </div>

                        {/* Checkbox Integrasi Panca Cinta */}
                        <label className="flex items-center gap-1.5 text-[11px] text-rose-800 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hasPc}
                            onChange={(e) =>
                              handleUpdateLangkah(currentIdx, {
                                panca_cinta_id: e.target.checked
                                  ? selectedPcList[0]?.id || null
                                  : null,
                                aksi_kbc: e.target.checked
                                  ? matchedSintaks?.buildAksiKbc(
                                      buildCurrentContext(),
                                      selectedPcList[0]?.nama || "Cinta Ilmu"
                                    ) || ""
                                  : null,
                              })
                            }
                            className="rounded text-rose-600 focus:ring-rose-500"
                          />
                          <Heart className="w-3 h-3 text-rose-600" />
                          Integrasi Nilai Panca Cinta
                        </label>
                      </div>

                      {/* Form Input Aksi Panca Cinta jika diaktifkan */}
                      {hasPc && (
                        <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg space-y-2 mt-2">
                          <div className="flex items-center gap-2">
                            <Label className="text-[11px] font-bold text-rose-900 shrink-0">
                              Pilih Topik Cinta:
                            </Label>
                            <Select
                              value={langkah.panca_cinta_id || ""}
                              onValueChange={(val) => {
                                const pcObj = selectedPcList.find(
                                  (p) => p.id === val
                                );
                                handleUpdateLangkah(currentIdx, {
                                  panca_cinta_id: val,
                                  aksi_kbc:
                                    matchedSintaks && pcObj
                                      ? matchedSintaks.buildAksiKbc(
                                          buildCurrentContext(),
                                          pcObj.nama
                                        )
                                      : langkah.aksi_kbc,
                                });
                              }}
                            >
                              <SelectTrigger className="h-7 text-xs bg-white border-rose-300">
                                <SelectValue placeholder="Pilih Topik..." />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedPcList.map((pc) => (
                                  <SelectItem
                                    key={`pc-step-${pc.id}`}
                                    value={pc.id}
                                    className="text-xs"
                                  >
                                    {pc.kode} - {pc.nama}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <Input
                            value={langkah.aksi_kbc || ""}
                            onChange={(e) =>
                              handleUpdateLangkah(currentIdx, {
                                aksi_kbc: e.target.value,
                              })
                            }
                            placeholder="Aksi guru / internalisasi nilai cinta pada tahap sintaks ini..."
                            className="text-xs bg-white h-7 border-rose-200"
                          />
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
