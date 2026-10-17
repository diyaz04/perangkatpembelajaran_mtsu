import { getCurrentUser } from "@/lib/auth";
import { getPenugasanListAction } from "./actions";
import { AtpPenugasanClient } from "./atp-penugasan-client";

export const metadata = {
  title: "Analisis CP & ATP | SIM Perangkat Pembelajaran KBC",
  description: "Modul Analisis CP, Perumusan TP, dan Penyusunan Alur Tujuan Pembelajaran Berbasis Cinta",
};

export default async function AtpPage() {
  const [session, result] = await Promise.all([
    getCurrentUser(),
    getPenugasanListAction(),
  ]);

  const penugasanList = result.success ? result.data : [];
  const isStaff =
    session?.role === "admin" ||
    session?.role === "kepala" ||
    session?.role === "waka_kurikulum";

  return (
    <AtpPenugasanClient
      penugasanList={penugasanList}
      isStaff={isStaff}
      error={result.error}
    />
  );
}
