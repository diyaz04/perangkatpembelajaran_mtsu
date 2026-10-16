import { requireRole } from "@/lib/auth";
import { MasterDataClient } from "./master-data-client";
import {
  getMadrasahAction,
  getTahunAjaranAction,
  getKalenderKegiatanAction,
  getMapelAction,
  getPenugasanAction,
  getGuruListAction,
  getCapaianPembelajaranAction,
  getPancaCintaAction,
  getMateriKbcAction,
  getModelPembelajaranAction,
} from "./actions";

export const metadata = {
  title: "Master Data & Regulasi Kurikulum",
  description: "Pengelolaan Profil Madrasah, Tahun Ajaran, Kalender, Mapel, Penugasan, CP, Panca Cinta, dan Model Pembelajaran",
};

export const dynamic = "force-dynamic";

export default async function MasterDataPage() {
  // Guard di server: Hanya role 'admin' yang dapat mengakses seluruh halaman Master Data
  await requireRole(["admin"]);

  // Fetch initial data secara paralel di server
  const [
    madrasahRes,
    taRes,
    kalenderRes,
    mapelRes,
    penugasanRes,
    guruRes,
    cpRes,
    pcRes,
    materiRes,
    modelRes,
  ] = await Promise.all([
    getMadrasahAction(),
    getTahunAjaranAction(),
    getKalenderKegiatanAction(),
    getMapelAction(),
    getPenugasanAction(),
    getGuruListAction(),
    getCapaianPembelajaranAction("all"),
    getPancaCintaAction(),
    getMateriKbcAction("all"),
    getModelPembelajaranAction(),
  ]);

  return (
    <MasterDataClient
      initialMadrasah={madrasahRes.data}
      initialTahunAjaran={taRes.data || []}
      initialKalender={kalenderRes.data || []}
      initialMapel={mapelRes.data || []}
      initialPenugasan={penugasanRes.data || []}
      initialGuru={guruRes.data || []}
      initialCp={cpRes.data || []}
      initialPancaCinta={pcRes.data || []}
      initialMateriKbc={materiRes.data || []}
      initialModel={modelRes.data || []}
    />
  );
}
