import { getTpPreviewDataAction } from "@/app/(app)/atp/actions";
import { TpPreviewClient } from "./tp-preview-client";

interface PageProps {
  params: Promise<{ penugasanId: string }>;
}

export const metadata = {
  title: "Pratinjau Dokumen Tujuan Pembelajaran (TP) & KKTP | SIM KBC",
  description: "Pratinjau resmi dokumen Tujuan Pembelajaran (TP) dan KKTP Kurikulum Berbasis Cinta",
};

export default async function TpPreviewPage({ params }: PageProps) {
  const { penugasanId } = await params;
  const result = await getTpPreviewDataAction(penugasanId);

  if (!result.success || !result.data) {
    return (
      <div className="flex-1 p-8 max-w-4xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-xl space-y-3">
          <h2 className="text-lg font-bold">Gagal Memuat Pratinjau Dokumen TP</h2>
          <p className="text-sm">{result.error || "Dokumen Tujuan Pembelajaran tidak ditemukan."}</p>
        </div>
      </div>
    );
  }

  return <TpPreviewClient data={result.data} />;
}
