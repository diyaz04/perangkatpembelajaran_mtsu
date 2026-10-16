"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  School,
  Calendar,
  CalendarDays,
  BookOpen,
  Users,
  Sparkles,
  Heart,
  Layers,
  UserCheck,
} from "lucide-react";

import { TabProfilMadrasah } from "./tabs/tab-profil-madrasah";
import { TabTahunAjaran } from "./tabs/tab-tahun-ajaran";
import { TabKalenderPendidikan } from "./tabs/tab-kalender";
import { TabMapel } from "./tabs/tab-mapel";
import { TabPenugasan } from "./tabs/tab-penugasan";
import { TabCapaianPembelajaran } from "./tabs/tab-capaian-pembelajaran";
import { TabPancaCinta } from "./tabs/tab-panca-cinta";
import { TabModelPembelajaran } from "./tabs/tab-model-pembelajaran";

import type {
  MadrasahData,
  TahunAjaranItem,
  KalenderItem,
  MapelItem,
  PenugasanItem,
  CapaianPembelajaranItem,
  PancaCintaItem,
  MateriKbcItem,
  ModelPembelajaranItem,
} from "./actions";

interface GuruProfile {
  id: string;
  nama_lengkap: string;
  nip: string | null;
  gelar: string | null;
  role: string;
}

interface MasterDataClientProps {
  initialMadrasah: MadrasahData | null;
  initialTahunAjaran: TahunAjaranItem[];
  initialKalender: KalenderItem[];
  initialMapel: MapelItem[];
  initialPenugasan: PenugasanItem[];
  initialGuru: GuruProfile[];
  initialCp: CapaianPembelajaranItem[];
  initialPancaCinta: PancaCintaItem[];
  initialMateriKbc: MateriKbcItem[];
  initialModel: ModelPembelajaranItem[];
}

export function MasterDataClient({
  initialMadrasah,
  initialTahunAjaran,
  initialKalender,
  initialMapel,
  initialPenugasan,
  initialGuru,
  initialCp,
  initialPancaCinta,
  initialMateriKbc,
  initialModel,
}: MasterDataClientProps) {
  const [activeTab, setActiveTab] = useState("profil");

  const tabList = [
    { id: "profil", label: "Profil Madrasah", icon: School },
    { id: "tahun_ajaran", label: "Tahun Ajaran", icon: Calendar },
    { id: "kalender", label: "Kalender Pendidikan", icon: CalendarDays },
    { id: "mapel", label: "Mata Pelajaran", icon: BookOpen },
    { id: "penugasan", label: "Penugasan Guru", icon: Users },
    { id: "capaian_pembelajaran", label: "Capaian Pembelajaran", icon: Sparkles },
    { id: "panca_cinta", label: "Panca Cinta & KBC", icon: Heart },
    { id: "model_pembelajaran", label: "Model Pembelajaran", icon: Layers },
  ];

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6">
      <PageHeader
        title="Master Data & Regulasi Kurikulum"
        description="Kelola seluruh konfigurasi madrasah, kalender pendidikan, mapel, penugasan, CP Fase D, materi KBC, dan model pembelajaran."
        badge={
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            Khusus Admin
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link href="/master-data/bank-data">
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-300 text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100 gap-1.5 text-xs h-9 font-medium"
              >
                <BookOpen className="h-4 w-4 text-emerald-600" />
                Bank Data Fase D (TA 2026/2027)
              </Button>
            </Link>
            <Link href="/master-data/pengguna">
              <Button
                variant="outline"
                size="sm"
                className="border-slate-300 text-slate-700 hover:bg-slate-50 gap-1.5 text-xs h-9"
              >
                <UserCheck className="h-4 w-4 text-emerald-600" />
                Kelola Pengguna & Guru
              </Button>
            </Link>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b border-slate-200 overflow-x-auto pb-px">
          <TabsList className="bg-transparent h-auto p-0 flex gap-1 min-w-max">
            {tabList.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`flex items-center gap-2 py-2.5 px-4 rounded-t-lg border-b-2 text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? "border-emerald-600 text-emerald-800 bg-emerald-50/50 shadow-2xs"
                      : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-emerald-600" : "text-slate-400"
                    }`}
                  />
                  <span>{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        <TabsContent value="profil" className="m-0 focus-visible:outline-none">
          <TabProfilMadrasah initialData={initialMadrasah} />
        </TabsContent>

        <TabsContent value="tahun_ajaran" className="m-0 focus-visible:outline-none">
          <TabTahunAjaran initialData={initialTahunAjaran} />
        </TabsContent>

        <TabsContent value="kalender" className="m-0 focus-visible:outline-none">
          <TabKalenderPendidikan
            initialData={initialKalender}
            initialTaList={initialTahunAjaran}
          />
        </TabsContent>

        <TabsContent value="mapel" className="m-0 focus-visible:outline-none">
          <TabMapel initialData={initialMapel} />
        </TabsContent>

        <TabsContent value="penugasan" className="m-0 focus-visible:outline-none">
          <TabPenugasan
            initialData={initialPenugasan}
            initialGuru={initialGuru}
            initialMapel={initialMapel}
            initialTaList={initialTahunAjaran}
          />
        </TabsContent>

        <TabsContent value="capaian_pembelajaran" className="m-0 focus-visible:outline-none">
          <TabCapaianPembelajaran
            initialData={initialCp}
            initialMapel={initialMapel}
          />
        </TabsContent>

        <TabsContent value="panca_cinta" className="m-0 focus-visible:outline-none">
          <TabPancaCinta
            initialTopik={initialPancaCinta}
            initialMateri={initialMateriKbc}
          />
        </TabsContent>

        <TabsContent value="model_pembelajaran" className="m-0 focus-visible:outline-none">
          <TabModelPembelajaran initialData={initialModel} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
