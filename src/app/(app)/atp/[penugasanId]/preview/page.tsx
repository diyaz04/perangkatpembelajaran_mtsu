import { getAtpPreviewDataAction } from "../../actions";
import { PreviewClient } from "./preview-client";

interface PageProps {
  params: Promise<{ penugasanId: string }>;
}

export const metadata = {
  title: "Pratinjau Dokumen Alur Tujuan Pembelajaran (ATP) | SIM KBC",
  description: "Pratinjau resmi dokumen Alur Tujuan Pembelajaran (ATP) MTs KH A Wahab Muhsin",
};

export default async function AtpPreviewPage({ params }: PageProps) {
  const { penugasanId } = await params;
  const result = await getAtpPreviewDataAction(penugasanId);

  if (!result.success || !result.data) {
    return (
      <div className="flex-1 p-8 max-w-4xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-xl space-y-3">
          <h2 className="text-lg font-bold">Gagal Memuat Pratinjau Dokumen ATP</h2>
          <p className="text-sm">{result.error || "Dokumen ATP tidak ditemukan."}</p>
        </div>
      </div>
    );
  }

  return <PreviewClient data={result.data} />;
}
