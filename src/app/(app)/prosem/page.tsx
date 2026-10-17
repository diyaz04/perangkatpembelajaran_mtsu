import { getCurrentUser } from "@/lib/auth";
import { getProsemPenugasanListAction } from "./actions";
import { ProsemPenugasanClient } from "./prosem-penugasan-client";

export const metadata = {
  title: "Program Semester (Prosem) | SIM Perangkat Pembelajaran KBC",
  description: "Matriks Distribusi Alokasi Waktu Mingguan Program Semester Kurikulum Berbasis Cinta",
};

export default async function ProsemPage() {
  const [session, result] = await Promise.all([
    getCurrentUser(),
    getProsemPenugasanListAction(),
  ]);

  const penugasanList = result.success ? result.data : [];
  const isStaff =
    session?.role === "admin" ||
    session?.role === "kepala" ||
    session?.role === "waka_kurikulum";

  return (
    <ProsemPenugasanClient
      penugasanList={penugasanList}
      isStaff={isStaff}
      error={result.error}
    />
  );
}
