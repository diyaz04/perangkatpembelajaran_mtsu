import React from "react";
import { requireRole } from "@/lib/auth";
import { getBankDataOverviewAction, getBankDataAuxiliaryAction } from "./actions";
import { BankDataClient } from "./bank-data-client";

export const metadata = {
  title: "Bank Data Fase D (Kelas VII–IX MTs) · TA 2026/2027",
  description: "Bank data kurikulum nasional Fase D: 16 mata pelajaran, Capaian Pembelajaran per elemen, materi pokok 311 bab, integrasi Panca Cinta, dan DPL.",
};

export const dynamic = "force-dynamic";

export default async function BankDataPage() {
  // Hanya admin dan waka_kurikulum yang dapat mengakses halaman Bank Data
  const { profile } = await requireRole(["admin", "waka_kurikulum"]);

  const [overviewRes, auxRes] = await Promise.all([
    getBankDataOverviewAction(),
    getBankDataAuxiliaryAction(),
  ]);

  return (
    <BankDataClient
      overview={overviewRes.data}
      auxiliary={auxRes.data}
      userRole={profile.role}
    />
  );
}
