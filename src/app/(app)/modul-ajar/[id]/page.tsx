import { notFound } from "next/navigation";
import { getRppDetailAction } from "../actions";
import { RppWizardClient } from "./rpp-wizard-client";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Editor RPP / Modul Ajar Pembelajaran Mendalam | KBC",
  description: "Wizard Penyusunan RPP Pembelajaran Mendalam Kurikulum Berbasis Cinta",
};

export default async function ModulAjarDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const result = await getRppDetailAction(id);

  if (!result.success || !result.data) {
    notFound();
  }

  return <RppWizardClient initialData={result.data} rppId={id} />;
}
