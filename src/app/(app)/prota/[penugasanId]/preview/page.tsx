import { notFound } from "next/navigation";
import { getProtaDetailAction } from "../../actions";
import { ProtaPreviewClient } from "./prota-preview-client";

interface PageProps {
  params: Promise<{
    penugasanId: string;
  }>;
}

export const metadata = {
  title: "Pratinjau Dokumen Program Tahunan (Prota) | KBC",
  description: "Format Cetak Resmi A4 Dokumen Program Tahunan dan Analisis Minggu Efektif Madrasah",
};

export default async function ProtaPreviewPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { penugasanId } = resolvedParams;

  const result = await getProtaDetailAction(penugasanId);

  if (!result.success || !result.data) {
    notFound();
  }

  return <ProtaPreviewClient data={result.data} />;
}
