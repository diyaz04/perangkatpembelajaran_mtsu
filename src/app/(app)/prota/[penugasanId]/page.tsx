import { notFound } from "next/navigation";
import { getProtaDetailAction } from "../actions";
import { ProtaClient } from "./prota-client";

interface PageProps {
  params: Promise<{
    penugasanId: string;
  }>;
}

export const metadata = {
  title: "Program Tahunan (Prota) & Analisis Minggu Efektif | KBC",
  description: "Pengelolaan Analisis Minggu Efektif dan Distribusi Alokasi Waktu Program Tahunan Kurikulum Berbasis Cinta",
};

export default async function ProtaDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { penugasanId } = resolvedParams;

  const result = await getProtaDetailAction(penugasanId);

  if (!result.success || !result.data) {
    notFound();
  }

  return <ProtaClient initialData={result.data} penugasanId={penugasanId} />;
}
