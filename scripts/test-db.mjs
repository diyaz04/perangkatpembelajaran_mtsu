import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env = fs.readFileSync(".env", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\s]+)/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\s]+)/)[1];
const supabase = createClient(url, key);

async function check() {
  const tables = [
    "madrasah",
    "profiles",
    "tahun_ajaran",
    "kalender_kegiatan",
    "mapel",
    "penugasan",
    "capaian_pembelajaran",
    "panca_cinta",
    "materi_kbc",
    "dimensi_profil_lulusan",
    "model_pembelajaran",
    "analisis_cp",
    "tujuan_pembelajaran",
    "atp",
    "prota",
    "prota_item",
    "prosem",
    "prosem_item",
    "rpp",
    "rpp_langkah",
    "riwayat_validasi",
  ];

  console.log("Checking tables against Supabase...");
  for (const t of tables) {
    try {
      const res = await supabase.from(t).select("*").limit(1);
      if (res.error) {
        console.log(`[FAIL] ${t}: ${res.error.message}`);
      } else {
        console.log(`[ OK ] ${t}: ${res.data?.length} row(s)`);
      }
    } catch (e) {
      console.log(`[ERR ] ${t}: ${e.message}`);
    }
  }
}

check().catch(console.error);
