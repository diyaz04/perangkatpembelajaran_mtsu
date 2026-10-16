import { getWizardDataAction } from "../actions";
import { WizardClient } from "./wizard-client";

interface PageProps {
  params: Promise<{ penugasanId: string }>;
}

export const metadata = {
  title: "Wizard Analisis CP & ATP | SIM Perangkat Pembelajaran KBC",
  description: "Pemetaan CP ke DPL dan Panca Cinta, perumusan TP, dan penyusunan ATP",
};

export default async function AtpWizardPage({ params }: PageProps) {
  const { penugasanId } = await params;
  const result = await getWizardDataAction(penugasanId);

  if (!result.success || !result.data) {
    return (
      <div className="flex-1 p-8 max-w-4xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-xl space-y-3">
          <h2 className="text-lg font-bold">Gagal Membuka Wizard ATP</h2>
          <p className="text-sm">{result.error || "Penugasan tidak ditemukan."}</p>
        </div>
      </div>
    );
  }

  return <WizardClient initialData={result.data} />;
}
