"use client";

import { useState } from "react";
import Link from "next/link";
import { Step1Analisis } from "./step-1-analisis";
import { Step2Tp } from "./step-2-tp";
import { Step3Atp } from "./step-3-atp";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  Layers,
  Sparkles,
  FileText,
  Eye,
} from "lucide-react";
import type {
  DocStatus,
  MetodePengurutanAtp,
} from "@/types/database";
import type {
  AnalisisCpItemPayload,
  TujuanPembelajaranPayload,
  TargetJpInfo,
} from "../actions";

export interface WizardDataProps {
  targetJp?: TargetJpInfo;
  penugasan: {
    id: string;
    tingkat_kelas: 7 | 8 | 9;
    rombel: string;
    mapel: {
      id: string;
      nama: string;
      kode: string;
      jp_per_minggu?: number;
    };
    guru?: {
      id: string;
      nama_lengkap: string;
      nip?: string | null;
    };
    tahun_ajaran?: {
      id: string;
      nama: string;
    };
  };
  cpElements: Array<{
    id: string;
    elemen: string;
    deskripsi_cp: string;
  }>;
  allCpElements?: Array<{
    id: string;
    elemen: string;
    kode_elemen?: string;
    deskripsi_cp: string;
    sumber_regulasi?: string;
  }>;
  pancaCintaList: Array<{
    id: string;
    urutan: number;
    kode: string;
    nama: string;
  }>;
  dplList: Array<{
    id: string;
    kode: string;
    nama: string;
  }>;
  analisisList: AnalisisCpItemPayload[];
  tpList: TujuanPembelajaranPayload[];
  materiPelajaran?: Array<{
    tingkat: number;
    semester: number;
    urutan: number;
    bab: string;
    deskripsi?: string;
    kata_kunci?: string[];
    elemen_kode?: string[];
    subbab: string[];
    saran_panca_cinta: Array<{ topik_kode: string; alasan: string }>;
    saran_dpl: number[];
  }>;
  bankDataVerified?: boolean;
  kkoList?: Array<{
    tingkat: string;
    nama: string;
    deskripsi: string;
    kata_kerja: string[];
  }>;
  sumberRegulasi?: string;
  versiBankData?: string;
  atp: {
    id: string | null;
    status: DocStatus;
    metode_pengurutan: MetodePengurutanAtp;
  };
}

interface WizardClientProps {
  initialData: WizardDataProps;
}

export function WizardClient({ initialData }: WizardClientProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const {
    penugasan,
    cpElements,
    pancaCintaList,
    dplList,
    analisisList: initialAnalisisList,
    tpList: initialTpList,
    materiPelajaran,
    allCpElements,
    bankDataVerified = true,
    kkoList,
    sumberRegulasi,
    versiBankData,
    atp,
  } = initialData;

  const [analisisList, setAnalisisList] = useState<AnalisisCpItemPayload[]>(initialAnalisisList || []);
  const [tpList, setTpList] = useState<TujuanPembelajaranPayload[]>(initialTpList || []);

  // Sinkronkan urutan TP agar selalu otomatis mengikuti urutan analisis CP
  const handleAnalisisUpdated = (updatedAnalisis: AnalisisCpItemPayload[]) => {
    setAnalisisList(updatedAnalisis);

    setTpList((prevTps) => {
      if (!prevTps || prevTps.length === 0) return prevTps;

      // Peta urutan: id atau cp_id -> index urutan baru
      const orderMap = new Map<string, number>();
      updatedAnalisis.forEach((a, idx) => {
        if (a.id) orderMap.set(a.id, idx);
        if (a.cp_id) orderMap.set(a.cp_id, idx);
      });

      // Urutkan TP: pertama berdasarkan urutan analisis_cp_id, kedua berdasarkan urutan asalnya
      const sorted = [...prevTps].sort((a, b) => {
        const orderA = orderMap.has(a.analisis_cp_id) ? orderMap.get(a.analisis_cp_id)! : 9999;
        const orderB = orderMap.has(b.analisis_cp_id) ? orderMap.get(b.analisis_cp_id)! : 9999;
        if (orderA !== orderB) return orderA - orderB;
        return (a.urutan || 1) - (b.urutan || 1);
      });

      // Perbarui urutan numerik (1, 2, 3...) dan kode TP (misal 7.1, 7.2, 7.3...)
      const tingkat = penugasan.tingkat_kelas || 7;
      return sorted.map((tp, idx) => ({
        ...tp,
        urutan: idx + 1,
        kode_tp: `${tingkat}.${idx + 1}`,
      }));
    });
  };

  const handleTpUpdated = (updatedTps: TujuanPembelajaranPayload[]) => {
    setTpList(updatedTps);
  };

  const steps = [
    {
      number: 1,
      title: "Langkah 1: Analisis CP",
      desc: "Pemetaan CP, Materi, DPL & Panca Cinta",
      icon: Sparkles,
    },
    {
      number: 2,
      title: "Langkah 2: Rumuskan TP",
      desc: "Kompetensi SOLO/Bloom, Materi & KKTP",
      icon: FileText,
    },
    {
      number: 3,
      title: "Langkah 3: Susun ATP",
      desc: "Urutan Alur, Metode Pengurutan & JP",
      icon: Layers,
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/atp"
              className="inline-flex items-center gap-1 hover:text-emerald-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Daftar Penugasan
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">{penugasan.mapel?.nama}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {penugasan.mapel?.nama}
            </h1>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
              Kelas {penugasan.tingkat_kelas === 7 ? "VII" : penugasan.tingkat_kelas === 8 ? "VIII" : "IX"}
            </Badge>
            <Badge variant="outline" className="bg-slate-50 text-slate-700">
              Rombel {penugasan.rombel}
            </Badge>
            <Badge variant="outline" className="bg-slate-50 text-slate-700">
              {penugasan.tahun_ajaran?.nama}
            </Badge>
            <Badge variant="secondary" className="uppercase text-[10px] font-bold">
              Status: {atp.status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/atp/${penugasan.id}/preview`}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "border-slate-300",
            })}
          >
            <Eye className="w-4 h-4 mr-1.5 text-slate-600" />
            Pratinjau Dokumen ATP
          </Link>
        </div>
      </div>

      {/* Stepper Wizard Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 md:p-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {steps.map((st) => {
            const isActive = currentStep === st.number;
            const isCompleted = currentStep > st.number;
            const Icon = st.icon;

            return (
              <button
                key={st.number}
                type="button"
                onClick={() => setCurrentStep(st.number as 1 | 2 | 3)}
                className={`flex items-center gap-3.5 p-3 rounded-lg text-left transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-50 border border-emerald-300 ring-1 ring-emerald-500 shadow-xs"
                    : isCompleted
                    ? "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                    : "bg-white border border-transparent text-slate-400 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                    isActive
                      ? "bg-emerald-700 text-white shadow-xs"
                      : isCompleted
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  ) : (
                    <span>{st.number}</span>
                  )}
                </div>

                <div className="space-y-0.5 overflow-hidden flex-1">
                  <div
                    className={`font-semibold text-xs md:text-sm truncate ${
                      isActive
                        ? "text-emerald-950 font-bold"
                        : isCompleted
                        ? "text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    {st.title}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{st.desc}</div>
                </div>

                <Icon className={`w-4 h-4 shrink-0 hidden sm:block ${isActive ? "text-emerald-700" : "text-slate-300"}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Step Content */}
      <div className="pt-2">
        {currentStep === 1 && (
          <Step1Analisis
            penugasanId={penugasan.id}
            tingkatKelas={penugasan.tingkat_kelas}
            cpElements={cpElements}
            allCpElements={allCpElements || cpElements}
            pancaCintaList={pancaCintaList}
            dplList={dplList}
            initialAnalisis={analisisList}
            materiPelajaran={materiPelajaran}
            bankDataVerified={bankDataVerified}
            onAnalisisUpdated={handleAnalisisUpdated}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <Step2Tp
            penugasanId={penugasan.id}
            tingkatKelas={penugasan.tingkat_kelas}
            cpElements={cpElements}
            pancaCintaList={pancaCintaList}
            analisisList={analisisList}
            initialTpList={tpList}
            kkoList={kkoList}
            targetJp={initialData.targetJp}
            onAnalisisUpdated={handleAnalisisUpdated}
            onTpUpdated={handleTpUpdated}
            onPrev={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
          />
        )}

        {currentStep === 3 && (
          <Step3Atp
            penugasanId={penugasan.id}
            tingkatKelas={penugasan.tingkat_kelas}
            mapel={{
              nama: penugasan.mapel?.nama || "Mapel",
              kode: penugasan.mapel?.kode || "",
              jp_per_minggu: penugasan.mapel?.jp_per_minggu || 2,
            }}
            cpElements={cpElements}
            analisisList={analisisList}
            initialTpList={tpList}
            initialMetode={atp.metode_pengurutan}
            initialStatus={atp.status}
            targetJp={initialData.targetJp}
            onTpUpdated={handleTpUpdated}
            onPrev={() => setCurrentStep(2)}
          />
        )}
      </div>

      {/* Footer Info Bank Data */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
        <span>Perangkat Pembelajaran MTs KH A Wahab Muhsin · TA {penugasan.tahun_ajaran?.nama || "2026/2027"}</span>
        <span>Sumber CP: {sumberRegulasi || "KMA 1503/2025"} · Bank data {versiBankData || "2026-2027-v1"}</span>
      </div>
    </div>
  );
}
