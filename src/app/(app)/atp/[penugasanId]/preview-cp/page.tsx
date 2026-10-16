import { getCpPreviewDataAction } from "@/app/(app)/atp/actions";
import { CpPreviewClient } from "./cp-preview-client";

interface PageProps {
  params: Promise<{ penugasanId: string }>;
}

export const metadata = {
  title: "Pratinjau Dokumen Analisis Capaian Pembelajaran (CP) | SIM KBC",
  description: "Pratinjau resmi dokumen Analisis Capaian Pembelajaran (CP) Kurikulum Berbasis Cinta",
};

export default async function CpPreviewPage({ params }: PageProps) {
  const { penugasanId } = await params;
  const result = await getCpPreviewDataAction(penugasanId);

  if (!result.success || !result.data) {
    return (
      <div className="flex-1 p-8 max-w-4xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-xl space-y-3">
          <h2 className="text-lg font-bold">Gagal Memuat Pratinjau Dokumen Analisis CP</h2>
          <p className="text-sm">{result.error || "Dokumen Analisis CP tidak ditemukan."}</p>
        </div>
      </div>
    );
  }

  return <CpPreviewClient data={result.data} />;
}
