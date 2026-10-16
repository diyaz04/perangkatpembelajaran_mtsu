import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCP() {
  const mapelId = "4c9f2b40-6062-4118-a051-3c8c56afd2e4";
  const { data: cpRows } = await supabase
    .from("capaian_pembelajaran")
    .select("id, elemen, kode_elemen, deskripsi_cp")
    .eq("mapel_id", mapelId);

  console.log("CP Rows in DB:", cpRows);
}

checkCP();
