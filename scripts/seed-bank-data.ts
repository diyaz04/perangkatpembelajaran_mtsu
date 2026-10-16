import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";
import type { MapelBankData } from "../src/lib/bank-data/schema";

// 1. Muat environment variable dari .env.local atau .env
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const ef of envFiles) {
    const fullPath = path.resolve(process.cwd(), ef);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const [k, ...v] = trimmed.split("=");
          if (k && v.length > 0) {
            const val = v.join("=").trim().replace(/^["']|["']$/g, "");
            if (!process.env[k.trim()]) {
              process.env[k.trim()] = val;
            }
          }
        }
      });
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ ERROR: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum disetel!");
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Flag parser
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isForce = args.includes("--force");

// Helper normalisasi nama mapel
function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .replace(/\(.*?\)/g, "") // hapus tanda kurung
    .replace(/[^a-z0-9]/g, "") // hanya alfanumerik
    .trim();
}

async function runSeed() {
  console.log("================================================================================");
  console.log(`🌱 SEED BANK DATA FASE D (TA 2026/2027) ${isDryRun ? "[MODE DRY-RUN]" : "[MODE EKSEKUSI]"}`);
  if (isForce) console.log("⚠️  FLAG --force AKTIF: Baris manual / terverifikasi akan ditimpa!");
  console.log("================================================================================\n");

  const manifestPath = path.resolve(process.cwd(), "data/fase-d/manifest.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const versiBankData = manifest.versi || "2026-2027-v1";

  // 1. Ambil data struktur kurikulum
  const strukturPath = path.resolve(process.cwd(), "data/fase-d/struktur-kurikulum.json");
  const strukturList: Array<{
    mapel_slug: string;
    mapel_nama: string;
    kelompok: string;
    jp_per_minggu: Record<string, number>;
  }> = JSON.parse(fs.readFileSync(strukturPath, "utf8"));

  // 2. Ambil data mapel yang ada di database dengan fallback jika kolom slug belum ada
  console.log("1. MENCOCOKKAN MATA PELAJARAN (DATABASE vs STRUKTUR KURIKULUM):");
  let dbMapelList: any[] = [];
  let mapelHasSlugCol = true;

  const initialMapelRes = await (supabase as any)
    .from("mapel")
    .select("id, nama, kode, slug, jp_default");

  if (initialMapelRes.error) {
    if (initialMapelRes.error.message.includes("column") || initialMapelRes.error.code === "42703") {
      mapelHasSlugCol = false;
      const fallbackRes = await (supabase as any).from("mapel").select("id, nama, kode");
      if (fallbackRes.error) {
        console.error("❌ Gagal membaca tabel mapel:", fallbackRes.error.message);
        process.exit(1);
      }
      dbMapelList = (fallbackRes.data || []).map((m: any) => ({ ...m, slug: null, jp_default: null }));
    } else {
      console.error("❌ Gagal membaca tabel mapel:", initialMapelRes.error.message);
      process.exit(1);
    }
  } else {
    dbMapelList = initialMapelRes.data || [];
  }

  const mapelMapBySlug = new Map<string, { id: string; nama: string; kode: string; slug: string | null }>();
  const unmatchedStruktur: string[] = [];

  for (const st of strukturList) {
    const targetNorm = normalizeName(st.mapel_nama);
    // Cari yang cocok
    let matched = dbMapelList.find(
      (m) =>
        (m.slug && m.slug === st.mapel_slug) ||
        normalizeName(m.nama) === targetNorm ||
        m.nama.toLowerCase().includes(st.mapel_slug.replace(/-/g, " ")) ||
        st.mapel_nama.toLowerCase().includes(m.nama.toLowerCase())
    );

    if (matched) {
      mapelMapBySlug.set(st.mapel_slug, matched);
      console.log(`  ✅ Cocok: [${st.mapel_slug.padEnd(22)}] ➔ DB ID: ${matched.id} (${matched.nama})`);

      // Update slug & jp_default jika kolomnya tersedia di database
      if (!isDryRun && mapelHasSlugCol) {
        try {
          await (supabase as any)
            .from("mapel")
            .update({
              slug: st.mapel_slug,
              jp_default: st.jp_per_minggu,
            })
            .eq("id", matched.id);
        } catch {
          // ignore
        }
      }
    } else {
      unmatchedStruktur.push(st.mapel_slug);
      console.log(`  ⚠️ TIDAK COCOK: [${st.mapel_slug}] (${st.mapel_nama}) tidak ditemukan di DB!`);
    }
  }

  if (!mapelHasSlugCol) {
    console.log("  ℹ️  Catatan: Kolom 'slug' dan 'jp_default' pada tabel mapel belum dibuat di database.");
    console.log("     Jalankan migrasi: supabase/migrations/20261014090000_bank_data_schema.sql di Supabase SQL Editor.");
  }

  // 3. Seed Capaian Pembelajaran (capaian_pembelajaran)
  console.log("\n2. SEED CAPAIAN PEMBELAJARAN (PER ELEMEN VERBATIM):");
  const mapelDir = path.resolve(process.cwd(), "data/fase-d/mapel");
  const mapelFiles = fs.readdirSync(mapelDir).filter((f) => f.endsWith(".json"));

  let cpStats = { added: 0, updated: 0, skipped: 0 };
  const seededCpIdsByElemen = new Map<string, Map<string, string>>(); // mapel_id -> (kode_elemen -> cp_id)

  let cpHasNewCols = true;
  const testCp = await (supabase as any).from("capaian_pembelajaran").select("id, kode_elemen").limit(1);
  if (testCp.error && (testCp.error.code === "42703" || testCp.error.message.includes("kode_elemen") || testCp.error.message.includes("schema cache"))) {
    cpHasNewCols = false;
    console.log("  ℹ️  Catatan: Kolom baru pada 'capaian_pembelajaran' belum dibuat. Menggunakan skema standar.");
  }

  for (const f of mapelFiles) {
    const raw = fs.readFileSync(path.join(mapelDir, f), "utf8");
    const mapelData: MapelBankData = JSON.parse(raw);
    const matchedMapel = mapelMapBySlug.get(mapelData.slug);

    if (!matchedMapel) {
      console.log(`  ⚠️ Lewati CP ${mapelData.mapel}: Mapel belum terhubung di DB`);
      continue;
    }

    const mapelId = matchedMapel.id;
    if (!seededCpIdsByElemen.has(mapelId)) {
      seededCpIdsByElemen.set(mapelId, new Map());
    }
    const elemenIdMap = seededCpIdsByElemen.get(mapelId)!;

    // Ambil CP yang sudah ada untuk mapel ini
    let existingCps: any[] = [];
    if (cpHasNewCols) {
      const res = await (supabase as any)
        .from("capaian_pembelajaran")
        .select("id, elemen, kode_elemen, asal, status_verifikasi")
        .eq("mapel_id", mapelId);
      existingCps = res.data || [];
    } else {
      const res = await supabase
        .from("capaian_pembelajaran")
        .select("id, elemen")
        .eq("mapel_id", mapelId);
      existingCps = res.data || [];
    }

    for (const el of mapelData.elemen) {
      const existing = existingCps.find(
        (c) =>
          (c.kode_elemen && c.kode_elemen === el.kode) ||
          normalizeName(c.elemen) === normalizeName(el.nama)
      );

      if (existing) {
        elemenIdMap.set(el.kode, existing.id);

        if ((existing.asal === "manual" || existing.status_verifikasi === "terverifikasi") && !isForce) {
          cpStats.skipped++;
          continue;
        }

        cpStats.updated++;
        if (!isDryRun) {
          if (cpHasNewCols) {
            await (supabase as any)
              .from("capaian_pembelajaran")
              .update({
                kode_elemen: el.kode,
                elemen: el.nama,
                deskripsi_cp: el.deskripsi_cp,
                sumber_regulasi: mapelData.sumber_cp.regulasi_kode,
                sumber: mapelData.sumber_cp,
                versi_bank_data: versiBankData,
                asal: "bank_data",
                status_verifikasi: "terverifikasi",
              })
              .eq("id", existing.id);
          } else {
            await supabase
              .from("capaian_pembelajaran")
              .update({
                elemen: el.nama,
                deskripsi_cp: el.deskripsi_cp,
                sumber_regulasi: mapelData.sumber_cp.regulasi_kode,
              })
              .eq("id", existing.id);
          }
        }
      } else {
        cpStats.added++;
        if (!isDryRun) {
          if (cpHasNewCols) {
            const { data: newCp } = await (supabase as any)
              .from("capaian_pembelajaran")
              .insert({
                mapel_id: mapelId,
                fase: "D",
                elemen: el.nama,
                kode_elemen: el.kode,
                deskripsi_cp: el.deskripsi_cp,
                sumber_regulasi: mapelData.sumber_cp.regulasi_kode,
                sumber: mapelData.sumber_cp,
                versi_bank_data: versiBankData,
                asal: "bank_data",
                status_verifikasi: "terverifikasi",
              })
              .select("id")
              .single();

            if (newCp) {
              elemenIdMap.set(el.kode, newCp.id);
            }
          } else {
            const { data: fallbackCp } = await supabase
              .from("capaian_pembelajaran")
              .insert({
                mapel_id: mapelId,
                fase: "D",
                elemen: el.nama,
                deskripsi_cp: el.deskripsi_cp,
                sumber_regulasi: mapelData.sumber_cp.regulasi_kode,
              })
              .select("id")
              .single();

            if (fallbackCp) {
              elemenIdMap.set(el.kode, fallbackCp.id);
            }
          }
        }
      }
    }
  }

  console.log(`  ➔ CP Selesai: +${cpStats.added} tambah baru, ~${cpStats.updated} diperbarui, =${cpStats.skipped} dilindungi/dilewati.`);

  // 4. Seed Materi Pelajaran (materi_pelajaran)
  console.log("\n3. SEED MATERI PELAJARAN (311 BAB KELAS VII, VIII, IX):");
  let materiStats = { added: 0, updated: 0, skipped: 0 };
  let materiTableAvailable = true;

  const checkMateriRes = await (supabase as any)
    .from("materi_pelajaran")
    .select("id")
    .limit(1);

  if (checkMateriRes.error && (checkMateriRes.error.code === "PGRST205" || checkMateriRes.error.message.includes("schema cache") || checkMateriRes.error.message.includes("does not exist"))) {
    materiTableAvailable = false;
    console.log("  ℹ️  Catatan: Tabel 'materi_pelajaran' belum tersedia di schema cache Supabase.");
    console.log("     Jalankan migrasi di Supabase SQL Editor: supabase/migrations/20261014090000_bank_data_schema.sql");
  }

  for (const f of mapelFiles) {
    const raw = fs.readFileSync(path.join(mapelDir, f), "utf8");
    const mapelData: MapelBankData = JSON.parse(raw);
    const matchedMapel = mapelMapBySlug.get(mapelData.slug);

    if (!matchedMapel) continue;
    const mapelId = matchedMapel.id;
    const elemenIdMap = seededCpIdsByElemen.get(mapelId) || new Map();

    let existingMateriList: any[] = [];
    if (materiTableAvailable) {
      try {
        const { data } = await (supabase as any)
          .from("materi_pelajaran")
          .select("id, tingkat, semester, urutan, asal, status_verifikasi")
          .eq("mapel_id", mapelId);
        existingMateriList = data || [];
      } catch {
        // ignore
      }
    }

    for (const m of mapelData.materi) {
      const existing = existingMateriList.find(
        (em) => em.tingkat === m.tingkat && em.semester === m.semester && em.urutan === m.urutan
      );

      const cpIds: string[] = [];
      for (const ek of m.elemen_kode) {
        const id = elemenIdMap.get(ek);
        if (id) cpIds.push(id);
      }

      if (existing) {
        if ((existing.asal === "manual" || existing.status_verifikasi === "terverifikasi") && !isForce) {
          materiStats.skipped++;
          continue;
        }

        materiStats.updated++;
        if (!isDryRun && materiTableAvailable) {
          await (supabase as any)
            .from("materi_pelajaran")
            .update({
              bab: m.bab,
              deskripsi: m.deskripsi || null,
              kata_kunci: m.kata_kunci || [],
              subbab: m.subbab,
              elemen_cp_ids: cpIds,
              saran_panca_cinta: m.saran_panca_cinta,
              saran_dpl: m.saran_dpl,
              sumber: m.sumber,
              versi_bank_data: versiBankData,
              asal: "bank_data",
              status_verifikasi: "terverifikasi",
            })
            .eq("id", existing.id);
        }
      } else {
        materiStats.added++;
        if (!isDryRun && materiTableAvailable) {
          await (supabase as any).from("materi_pelajaran").insert({
            mapel_id: mapelId,
            tingkat: m.tingkat,
            semester: m.semester,
            urutan: m.urutan,
            bab: m.bab,
            deskripsi: m.deskripsi || null,
            kata_kunci: m.kata_kunci || [],
            subbab: m.subbab,
            elemen_cp_ids: cpIds,
            saran_panca_cinta: m.saran_panca_cinta,
            saran_dpl: m.saran_dpl,
            sumber: m.sumber,
            versi_bank_data: versiBankData,
            asal: "bank_data",
            status_verifikasi: "terverifikasi",
          });
        }
      }
    }
  }

  console.log(`  ➔ Materi Selesai: +${materiStats.added} tambah baru, ~${materiStats.updated} diperbarui, =${materiStats.skipped} dilindungi/dilewati.`);

  // 5. Seed Modul Materi KBC (materi_kbc)
  console.log("\n4. SEED MATERI KBC (5 PILAR INTEGRASI PANCA CINTA):");
  const materiKbcPath = path.resolve(process.cwd(), "data/fase-d/materi-kbc.json");
  const materiKbcList: Array<{
    id: number;
    topik_panca_cinta_id: number;
    topik_panca_cinta_kode: string;
    topik_panca_cinta_nama: string;
    judul: string;
    ringkasan: string;
    dalil_hikmah: string;
    aplikasi_pembelajaran: string[];
    sumber: any;
  }> = JSON.parse(fs.readFileSync(materiKbcPath, "utf8"));

  const { data: dbPcList } = await supabase.from("panca_cinta").select("id, kode, nama");
  let kbcStats = { added: 0, updated: 0, skipped: 0 };

  if (dbPcList && dbPcList.length > 0) {
    let kbcHasNewCols = true;
    const testKbc = await (supabase as any).from("materi_kbc").select("id, kode_elemen").limit(1);
    if (testKbc.error && (testKbc.error.code === "42703" || testKbc.error.message.includes("kode_elemen") || testKbc.error.message.includes("schema cache"))) {
      kbcHasNewCols = false;
    }

    let kbcList: any[] = [];
    if (kbcHasNewCols) {
      const res = await (supabase as any)
        .from("materi_kbc")
        .select("id, panca_cinta_id, pilar, nilai, asal, status_verifikasi");
      kbcList = res.data || [];
    } else {
      const res = await supabase
        .from("materi_kbc")
        .select("id, panca_cinta_id, pilar, nilai");
      kbcList = res.data || [];
    }

    for (const mk of materiKbcList) {
      const pc = dbPcList.find((p) => p.kode === mk.topik_panca_cinta_kode);
      if (!pc) continue;

      const existing = kbcList.find(
        (k) => k.panca_cinta_id === pc.id || k.nilai === mk.judul
      );

      if (existing) {
        if ((existing.asal === "manual" || existing.status_verifikasi === "terverifikasi") && !isForce) {
          kbcStats.skipped++;
          continue;
        }

        kbcStats.updated++;
        if (!isDryRun) {
          if (kbcHasNewCols) {
            await (supabase as any)
              .from("materi_kbc")
              .update({
                pilar: pc.nama,
                nilai: mk.judul,
                deskripsi: `${mk.ringkasan}\n\nDalil/Hikmah: ${mk.dalil_hikmah}`,
                indikator_perilaku: mk.aplikasi_pembelajaran,
                kode_elemen: mk.topik_panca_cinta_kode,
                sumber: mk.sumber,
                versi_bank_data: versiBankData,
                asal: "bank_data",
                status_verifikasi: "terverifikasi",
              })
              .eq("id", existing.id);
          } else {
            await supabase
              .from("materi_kbc")
              .update({
                pilar: pc.nama,
                nilai: mk.judul,
                deskripsi: `${mk.ringkasan}\n\nDalil/Hikmah: ${mk.dalil_hikmah}`,
                indikator_perilaku: mk.aplikasi_pembelajaran as any,
              })
              .eq("id", existing.id);
          }
        }
      } else {
        kbcStats.added++;
        if (!isDryRun) {
          if (kbcHasNewCols) {
            await (supabase as any).from("materi_kbc").insert({
              panca_cinta_id: pc.id,
              pilar: pc.nama,
              nilai: mk.judul,
              deskripsi: `${mk.ringkasan}\n\nDalil/Hikmah: ${mk.dalil_hikmah}`,
              indikator_perilaku: mk.aplikasi_pembelajaran,
              kode_elemen: mk.topik_panca_cinta_kode,
              sumber: mk.sumber,
              versi_bank_data: versiBankData,
              asal: "bank_data",
              status_verifikasi: "terverifikasi",
            });
          } else {
            await supabase.from("materi_kbc").insert({
              panca_cinta_id: pc.id,
              pilar: pc.nama,
              nilai: mk.judul,
              deskripsi: `${mk.ringkasan}\n\nDalil/Hikmah: ${mk.dalil_hikmah}`,
              indikator_perilaku: mk.aplikasi_pembelajaran as any,
            });
          }
        }
      }
    }
  }

  console.log(`  ➔ Materi KBC Selesai: +${kbcStats.added} tambah baru, ~${kbcStats.updated} diperbarui, =${kbcStats.skipped} dilindungi/dilewati.`);

  // Ringkasan Akhir
  console.log("\n================================================================================");
  console.log("🏁 HASIL SEEDING BANK DATA FASE D:");
  console.log("================================================================================");
  console.log(`Mode Operasi           : ${isDryRun ? "DRY-RUN (Simulasi tanpa mutasi)" : "EKSEKUSI PENUH"}`);
  console.log(`Versi Bank Data        : ${versiBankData}`);
  console.log(`Mapel Terhubung        : ${mapelMapBySlug.size} / ${strukturList.length}`);
  console.log(`Capaian Pembelajaran   : +${cpStats.added} Baru | ~${cpStats.updated} Update | =${cpStats.skipped} Dilindungi`);
  console.log(`Materi Pelajaran       : +${materiStats.added} Baru | ~${materiStats.updated} Update | =${materiStats.skipped} Dilindungi`);
  console.log(`Materi KBC Terintegrasi: +${kbcStats.added} Baru | ~${kbcStats.updated} Update | =${kbcStats.skipped} Dilindungi`);
  console.log("================================================================================\n");
}

runSeed().catch((err) => {
  console.error("❌ Terjadi kesalahan fatal saat seeding:", err);
  process.exit(1);
});
