import { notFound } from "next/navigation";
import { getProsemDetailAction } from "../actions";
import { ProsemClient } from "./prosem-client";

interface PageProps {
  params: Promise<{
    penugasanId: string;
  }>;
  searchParams: Promise<{
    semester?: string;
  }>;
}

export const metadata = {
  title: "Program Semester (Prosem) & Matriks Mingguan | KBC",
  description: "Editor Matriks Distribusi Alokasi Waktu Mingguan Program Semester Kurikulum Berbasis Cinta",
};

export default async function ProsemDetailPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const { penugasanId } = resolvedParams;
  const semesterNum = resolvedSearchParams.semester === "2" ? 2 : 1;

  const result = await getProsemDetailAction(penugasanId, semesterNum);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <ProsemClient
      initialData={result.data}
      penugasanId={penugasanId}
      semester={semesterNum}
    />
  );
}
