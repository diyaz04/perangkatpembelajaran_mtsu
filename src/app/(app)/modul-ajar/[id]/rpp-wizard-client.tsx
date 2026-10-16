"use client";

import React, { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Save,
  Send,
  Eye,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Clock,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Step1Spesifikasi } from "./steps/step1-spesifikasi";
import { Step2Identifikasi } from "./steps/step2-identifikasi";
import { Step3Desain } from "./steps/step3-desain";
import { Step4Pengalaman } from "./steps/step4-pengalaman";
import { Step5Asesmen } from "./steps/step5-asesmen";
import { Step6Lampiran } from "./steps/step6-lampiran";
import {
  saveRppAction,
  type RppDetailData,
  type RppLangkahPayload,
} from "../actions";
import { createRevisiCopyAction } from "@/lib/validasi/actions";
import type { DocStatus } from "@/types/database";
import {
  generateModelLangkahList,
  isGenericPlaceholderLangkah,
  getModelPedagogiSpec,
  type ModeDistribusiPertemuan,
} from "@/lib/rpp-model-pedagogi";
import { generateDefaultLampiran } from "@/lib/rpp-suggestions";

interface RppWizardClientProps {
  initialData: RppDetailData;
  rppId: string;
}

export function RppWizardClient({ initialData, rppId }: RppWizardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [rppData, setRppData] = useState<RppDetailData["rpp"]>(() => {
    if (
      isGenericPlaceholderLangkah(initialData.langkahList) &&
      !initialData.rpp.model_id &&
      initialData.master.models[0]
    ) {
      const defaultModel = initialData.master.models[0];
      const spec = getModelPedagogiSpec(defaultModel.nama);
      return {
        ...initialData.rpp,
        model_id: defaultModel.id,
        metode_pembelajaran:
          !initialData.rpp.metode_pembelajaran ||
          initialData.rpp.metode_pembelajaran.length === 0
            ? spec.rekomendasi_metode
            : initialData.rpp.metode_pembelajaran,
      };
    }
    return initialData.rpp;
  });

  const [langkahList, setLangkahList] = useState<RppLangkahPayload[]>(() => {
    if (isGenericPlaceholderLangkah(initialData.langkahList)) {
      const targetModelId =
        initialData.rpp.model_id || initialData.master.models[0]?.id;
      const model = initialData.master.models.find(
        (m) => m.id === targetModelId
      );
      if (model) {
        return generateModelLangkahList({
          modelNama: model.nama,
          sintaksDb: model.sintaks,
          materiPokok: initialData.rpp.materi_pokok,
          topikPembelajaran: initialData.rpp.topik_pembelajaran,
          mapelNama: initialData.penugasan.mapel.nama,
          tingkatKelas: initialData.penugasan.tingkat_kelas,
          jumlahPertemuan: initialData.rpp.jumlah_pertemuan || 2,
          alokasiJp: initialData.rpp.alokasi_jp || 4,
          menitPerJp: initialData.rpp.menit_per_jp || 40,
          pancaCintaIds: initialData.rpp.panca_cinta_ids,
          pancaCintaMaster: initialData.master.pancaCinta,
          modeDistribusi: "utuh_per_pertemuan",
        });
      }
    }
    return initialData.langkahList;
  });

  const [modeDistribusiSintaks, setModeDistribusiSintaks] =
    useState<ModeDistribusiPertemuan>("utuh_per_pertemuan");

  const [status, setStatus] = useState<DocStatus>(initialData.rpp.status);
  const [saveStatusMsg, setSaveStatusMsg] = useState<string>("Tersimpan");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<Date>(new Date());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // Update field rppData
  const handleRppChange = (updates: Partial<RppDetailData["rpp"]>) => {
    setRppData((prev) => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  };

  // Update langkahList
  const handleLangkahChange = (updated: RppLangkahPayload[]) => {
    setLangkahList(updated);
    setHasUnsavedChanges(true);
  };

  // Terapkan sintaks model pembelajaran ke Pengalaman Pembelajaran (Awal, Inti bersintaks, Penutup) & LKPD
  const handleApplyModelSyntax = (
    modelId: string,
    modeDistribusi: ModeDistribusiPertemuan = modeDistribusiSintaks
  ) => {
    const model =
      initialData.master.models.find((m) => m.id === modelId) ||
      initialData.master.models[0];
    if (!model) return;

    const spec = getModelPedagogiSpec(model.nama);
    const newLangkahList = generateModelLangkahList({
      modelNama: model.nama,
      sintaksDb: model.sintaks,
      materiPokok: rppData.materi_pokok,
      topikPembelajaran: rppData.topik_pembelajaran,
      mapelNama: initialData.penugasan.mapel.nama,
      tingkatKelas: initialData.penugasan.tingkat_kelas,
      jumlahPertemuan: rppData.jumlah_pertemuan || 2,
      alokasiJp: rppData.alokasi_jp || 4,
      menitPerJp: rppData.menit_per_jp || 40,
      pancaCintaIds: rppData.panca_cinta_ids,
      pancaCintaMaster: initialData.master.pancaCinta,
      modeDistribusi,
    });

    const newDefaultLampiran = generateDefaultLampiran(
      rppData.materi_pokok,
      initialData.penugasan.mapel.nama,
      initialData.penugasan.tingkat_kelas,
      model.nama
    );

    setRppData((prev) => ({
      ...prev,
      model_id: model.id,
      metode_pembelajaran:
        !prev.metode_pembelajaran || prev.metode_pembelajaran.length === 0
          ? spec.rekomendasi_metode
          : prev.metode_pembelajaran,
      lampiran: {
        ...(prev.lampiran || newDefaultLampiran),
        lkpd: newDefaultLampiran.lkpd,
      },
    }));
    setLangkahList(newLangkahList);
    setHasUnsavedChanges(true);
  };

  // Simpan Dokumen (Draf atau Ajukan)
  const handleSave = (targetStatus: DocStatus = "draf") => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setSaveStatusMsg("Menyimpan...");

    startTransition(async () => {
      const res = await saveRppAction(
        rppId,
        {
          rpp: rppData,
          langkahList,
        },
        targetStatus
      );

      if (res.success) {
        setStatus(targetStatus);
        setHasUnsavedChanges(false);
        setLastSavedTime(new Date());
        setSaveStatusMsg("Tersimpan");
        setSuccessMessage(
          targetStatus === "diajukan"
            ? "Dokumen RPP berhasil divalidasi dan diajukan ke Pimpinan/Waka Kurikulum!"
            : "Draf RPP berhasil disimpan."
        );
      } else {
        setSaveStatusMsg("Gagal menyimpan");
        setErrorMessage(res.error || "Gagal menyimpan RPP.");
      }
    });
  };

  const handleBuatRevisi = () => {
    startTransition(async () => {
      const res = await createRevisiCopyAction("rpp", rppId);
      if (res.success && res.newId) {
        router.push(`/modul-ajar/${res.newId}`);
      } else {
        setErrorMessage(res.error || "Gagal membuat revisi RPP.");
      }
    });
  };

  // Timer indikator autosave teks (misal "Tersimpan 10 detik lalu")
  const [secondsAgo, setSecondsAgo] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo(Math.floor((new Date().getTime() - lastSavedTime.getTime()) / 1000));
    }, 5000);
    return () => clearInterval(timer);
  }, [lastSavedTime]);

  // Validasi Kelengkapan Tiap Step (centang hijau)
  const isStep1Complete = Boolean(
    rppData.materi_pokok && (rppData.alokasi_jp || 0) > 0 && (rppData.jumlah_pertemuan || 0) > 0
  );

  const isStep2Complete = Boolean(
    rppData.karakteristik_materi &&
      rppData.dimensi_profil_lulusan_ids.length > 0 &&
      rppData.panca_cinta_ids.length > 0 &&
      rppData.benang_merah_kbc &&
      (rppData.versi !== "lengkap" || rppData.kesiapan_murid?.pengetahuan_awal)
  );

  const isStep3Complete = Boolean(
    rppData.tujuan_pembelajaran_teks &&
      rppData.model_id &&
      rppData.lingkungan_belajar_fisik &&
      (rppData.versi !== "lengkap" || rppData.topik_pembelajaran)
  );

  const isStep4Complete = Boolean(
    langkahList.length > 0 &&
      langkahList.some((l) => l.pengalaman === "memahami") &&
      langkahList.some((l) => l.pengalaman === "mengaplikasi") &&
      langkahList.some((l) => l.pengalaman === "merefleksi")
  );

  const isStep5Complete = Boolean(
    rppData.asesmen_awal || rppData.asesmen_proses || rppData.asesmen_akhir
  );

  const isStep6Complete = Boolean(
    rppData.lampiran?.lkpd || rppData.lampiran?.bahan_bacaan || rppData.lampiran?.glosarium
  );

  const stepsConfig = [
    { num: 1, label: "Spesifikasi", isComplete: isStep1Complete },
    { num: 2, label: "Identifikasi", isComplete: isStep2Complete },
    { num: 3, label: "Desain Pembelajaran", isComplete: isStep3Complete },
    { num: 4, label: "Pengalaman Belajar", isComplete: isStep4Complete },
    { num: 5, label: "Asesmen", isComplete: isStep5Complete },
    { num: 6, label: "Lampiran", isComplete: isStep6Complete },
  ];

  return (
    <div className="flex-1 p-3 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Navigasi & Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            href="/modul-ajar"
            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-emerald-700 transition-colors mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Kembali ke Daftar RPP
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
              {rppData.materi_pokok || "Penyusunan RPP KBC"}
            </h1>
            <Badge
              variant="outline"
              className={
                status === "disetujui"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                  : status === "diajukan"
                  ? "bg-blue-100 text-blue-800 border-blue-300 font-bold"
                  : status === "revisi"
                  ? "bg-amber-100 text-amber-800 border-amber-300 font-bold"
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

            {/* Switcher Versi */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => handleRppChange({ versi: "minimum" })}
                className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                  rppData.versi === "minimum"
                    ? "bg-emerald-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Minimum
              </button>
              <button
                type="button"
                onClick={() => handleRppChange({ versi: "lengkap" })}
                className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                  rppData.versi === "lengkap"
                    ? "bg-purple-600 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Lengkap [L]
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-600 mt-1">
            {initialData.penugasan.mapel.nama} • Kelas{" "}
            {initialData.penugasan.tingkat_kelas} ({initialData.penugasan.rombel}) •{" "}
            {rppData.alokasi_jp} JP ({rppData.jumlah_pertemuan} Pertemuan)
          </p>
        </div>

        {/* Action Buttons & Status Autosave */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mr-1 font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                hasUnsavedChanges ? "bg-amber-500 animate-pulse" : "bg-emerald-500"
              }`}
            />
            <span>
              {hasUnsavedChanges
                ? "Ada perubahan belum disimpan"
                : `${saveStatusMsg} (${secondsAgo < 5 ? "baru saja" : `${secondsAgo} dtk lalu`})`}
            </span>
          </div>

          <Link
            href={`/modul-ajar/${rppId}/preview`}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "border-slate-200 text-slate-700 hover:bg-slate-50 text-xs h-8",
            })}
          >
            <Eye className="w-3.5 h-3.5 mr-1.5" />
            Pratinjau Cetak
          </Link>

          {status === "disetujui" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBuatRevisi}
              disabled={isPending}
              className="border-amber-300 text-amber-800 hover:bg-amber-50 text-xs h-8 font-semibold"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
              Buat Revisi
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave("draf")}
                disabled={isPending || status === "diajukan"}
                className="border-slate-300 text-slate-800 hover:bg-slate-50 text-xs h-8 font-semibold"
              >
                <Save className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                Simpan Draf
              </Button>

              <Button
                size="sm"
                onClick={() => handleSave("diajukan")}
                disabled={isPending || status === "diajukan"}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-bold shadow-xs"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {status === "revisi" ? "Ajukan Ulang Validasi" : "Ajukan Validasi"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Banner Status Lock / Revisi */}
      {status === "diajukan" && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-2 shadow-2xs">
          <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Dokumen Terkunci (Read-Only): </span>
            Dokumen ini telah diajukan dan sedang dalam proses telaah oleh Waka Kurikulum / Kepala Madrasah. Perubahan dikunci.
          </div>
        </div>
      )}
      {status === "disetujui" && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Dokumen Telah Disetujui: </span>
            Dokumen telah divalidasi dan disahkan secara resmi. Klik tombol <strong>&ldquo;Buat Revisi&rdquo;</strong> untuk membuat draf versi baru jika diperlukan perubahan.
          </div>
        </div>
      )}
      {status === "revisi" && initialData.rpp.catatan_validator && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Catatan Perbaikan dari Validator: </span>
            {initialData.rpp.catatan_validator}
          </div>
        </div>
      )}

      {/* Alert Error / Success */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEPPER 6 LANGKAH INTERAKTIF */}
      {/* ========================================================================= */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs overflow-x-auto">
        <div className="flex items-center min-w-[700px] justify-between">
          {stepsConfig.map((s, idx) => {
            const isActive = currentStep === s.num;
            return (
              <React.Fragment key={`step-${s.num}`}>
                <button
                  type="button"
                  onClick={() => setCurrentStep(s.num)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono ${
                      isActive
                        ? "bg-white text-emerald-800"
                        : s.isComplete
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {s.isComplete ? "✓" : s.num}
                  </span>
                  <span>{s.label}</span>
                </button>

                {idx < stepsConfig.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CONTENT STEP AKTIF */}
      {/* ========================================================================= */}
      <div className="transition-opacity duration-200">
        {currentStep === 1 && (
          <Step1Spesifikasi
            data={{ ...initialData, rpp: rppData }}
            onChange={handleRppChange}
          />
        )}
        {currentStep === 2 && (
          <Step2Identifikasi
            data={{ ...initialData, rpp: rppData }}
            onChange={handleRppChange}
          />
        )}
        {currentStep === 3 && (
          <Step3Desain
            data={{ ...initialData, rpp: rppData }}
            onChange={handleRppChange}
            onApplyModelSyntax={handleApplyModelSyntax}
          />
        )}
        {currentStep === 4 && (
          <Step4Pengalaman
            data={{ ...initialData, rpp: rppData }}
            langkahList={langkahList}
            onChangeLangkah={handleLangkahChange}
            onChangeRpp={handleRppChange}
            onApplyModelSyntax={handleApplyModelSyntax}
            modeDistribusiSintaks={modeDistribusiSintaks}
            onChangeModeDistribusi={(mode) => {
              setModeDistribusiSintaks(mode);
              const targetModelId =
                rppData.model_id || initialData.master.models[0]?.id;
              if (targetModelId) {
                handleApplyModelSyntax(targetModelId, mode);
              }
            }}
          />
        )}
        {currentStep === 5 && (
          <Step5Asesmen
            data={{ ...initialData, rpp: rppData }}
            onChange={handleRppChange}
          />
        )}
        {currentStep === 6 && (
          <Step6Lampiran
            data={{ ...initialData, rpp: rppData }}
            onChange={handleRppChange}
          />
        )}
      </div>

      {/* Navigasi Bawah Wizard */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className="text-xs"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Langkah Sebelumnya
        </Button>

        <div className="flex items-center gap-2">
          {currentStep < 6 ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              Langkah Selanjutnya
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => handleSave("diajukan")}
              disabled={isPending}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Selesai & Ajukan Validasi
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
