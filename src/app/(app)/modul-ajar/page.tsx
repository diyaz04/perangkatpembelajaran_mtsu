import { getCurrentUser } from "@/lib/auth";
import { getRppListAction, getPenugasanAndTpListAction } from "./actions";
import { ModulAjarClient } from "./modul-ajar-client";

export const metadata = {
  title: "RPP / Modul Ajar Pembelajaran Mendalam KBC",
  description: "Penyusunan RPP dan Modul Ajar Pembelajaran Mendalam terintegrasi Kurikulum Berbasis Cinta (KBC)",
};

export default async function ModulAjarPage() {
  const [session, listRes, formRes] = await Promise.all([
    getCurrentUser(),
    getRppListAction(),
    getPenugasanAndTpListAction(),
  ]);

  const isStaff =
    session?.role === "admin" ||
    session?.role === "kepala" ||
    session?.role === "waka_kurikulum";

  return (
    <ModulAjarClient
      initialList={listRes.data || []}
      penugasanList={formRes.data?.penugasanList || []}
      tpListByPenugasan={formRes.data?.tpListByPenugasan || {}}
      isStaff={isStaff}
    />
  );
}
