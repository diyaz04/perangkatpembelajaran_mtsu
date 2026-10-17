import { getCurrentUser } from "@/lib/auth";
import { getProtaPenugasanListAction } from "./actions";
import { ProtaPenugasanClient } from "./prota-penugasan-client";

export const metadata = {
  title: "Program Tahunan (Prota) | SIM Perangkat Pembelajaran KBC",
  description: "Analisis Minggu Efektif dan Distribusi Alokasi Waktu Program Tahunan Kurikulum Berbasis Cinta",
};

export default async function ProtaPage() {
  const [session, result] = await Promise.all([
    getCurrentUser(),
    getProtaPenugasanListAction(),
  ]);

  const penugasanList = result.success ? result.data : [];
  const isStaff =
    session?.role === "admin" ||
    session?.role === "kepala" ||
    session?.role === "waka_kurikulum";

  return (
    <ProtaPenugasanClient
      penugasanList={penugasanList}
      isStaff={isStaff}
      error={result.error}
    />
  );
}
