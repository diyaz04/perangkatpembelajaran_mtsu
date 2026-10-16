import { notFound } from "next/navigation";
import { getProsemDetailAction } from "../../actions";
import { ProsemPreviewClient } from "./prosem-preview-client";

interface PageProps {
  params: Promise<{
    penugasanId: string;
  }>;
  searchParams: Promise<{
    semester?: string;
  }>;
}

export const metadata = {
  title: "Pratinjau Program Semester (Prosem) Landscape | KBC",
  description: "Format Cetak Resmi Landscape Program Semester Kurikulum Berbasis Cinta",
};

export default async function ProsemPreviewPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const { penugasanId } = resolvedParams;
  const semesterNum = resolvedSearchParams.semester === "2" ? 2 : 1;

  const result = await getProsemDetailAction(penugasanId, semesterNum);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <ProsemPreviewClient
      data={result.data}
      penugasanId={penugasanId}
      semester={semesterNum}
    />
  );
}
