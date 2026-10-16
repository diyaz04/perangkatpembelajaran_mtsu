import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { getWizardDataAction } from "../src/app/(app)/atp/actions";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWizard() {
  const { data: penugasanList } = await supabase.from("penugasan").select("id, tingkat_kelas, mapel(nama)");
  console.log("Penugasan count:", penugasanList?.length);
  const ski = penugasanList?.find(p => (p.mapel as any)?.nama?.toLowerCase().includes("ski"));
  if (ski) {
    console.log("Penugasan SKI found:", ski.id, "Tingkat:", ski.tingkat_kelas);
    const res = await getWizardDataAction(ski.id);
    if (res.success && res.data) {
      console.log("CP Elements in Wizard:", res.data.cpElements.map(e => ({ id: e.id, elemen: e.elemen, kode: (e as any).kode_elemen })));
      console.log("Materi in Wizard:", res.data.materiPelajaran?.map(m => ({ bab: m.bab, urutan: m.urutan, tingkat: m.tingkat })));
    } else {
      console.log("Error or no data:", res.error);
    }
  }
}

checkWizard();
