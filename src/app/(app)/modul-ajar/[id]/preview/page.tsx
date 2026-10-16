import { notFound } from "next/navigation";
import { getRppDetailAction } from "../../actions";
import { RppPreviewClient } from "./rpp-preview-client";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Pratinjau Dokumen Cetak RPP / Modul Ajar | KBC",
  description: "Format Dokumen Resmi Cetak A4 RPP Pembelajaran Mendalam Kurikulum Berbasis Cinta",
};

export default async function ModulAjarPreviewPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const result = await getRppDetailAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <RppPreviewClient data={result.data} />;
}
