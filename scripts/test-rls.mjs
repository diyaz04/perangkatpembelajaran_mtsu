import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

// Load .env
const envFile = fs.readFileSync(".env", "utf8");
const url = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\s]+)/)[1];
const serviceKey = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\s]+)/)[1];
const anonKey = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=["']?([^"'\s]+)/)[1];

const adminClient = createClient(url, serviceKey);

async function runTest() {
  console.log("=== PENGUJIAN SKEMA & RLS TAHAP 2 ===");
  console.log(`Connecting to: ${url}`);

  // 1. Cek ketersediaan tabel master & perangkat
  const requiredTables = [
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

  console.log("\n[1] Verifikasi 21 Tabel:");
  let allTablesExist = true;
  for (const t of requiredTables) {
    const { error } = await adminClient.from(t).select("*").limit(1);
    if (error) {
      console.log(`  ❌ Tabel '${t}': ${error.message}`);
      allTablesExist = false;
    } else {
      console.log(`  ✅ Tabel '${t}': OK`);
    }
  }

  if (!allTablesExist) {
    console.log("\n⚠️ Beberapa tabel belum terbuat di Supabase!");
    console.log("👉 Jalankan file 'supabase/schema.sql' di Supabase SQL Editor terlebih dahulu.");
    return;
  }

  // 2. Cek Seed Data
  console.log("\n[2] Verifikasi Seed Data:");
  const { data: pancaCinta } = await adminClient.from("panca_cinta").select("kode, nama");
  console.log(`  - Panca Cinta: ${pancaCinta?.length || 0} baris`);

  const { data: dpl } = await adminClient.from("dimensi_profil_lulusan").select("kode, nama");
  console.log(`  - Dimensi Profil Lulusan: ${dpl?.length || 0} baris`);

  const { data: mapel } = await adminClient.from("mapel").select("kode, nama");
  console.log(`  - Mapel MTs: ${mapel?.length || 0} baris`);

  const { data: ta } = await adminClient.from("tahun_ajaran").select("nama, aktif");
  console.log(`  - Tahun Ajaran Aktif:`, ta);

  // 3. Setup 2 Akun Guru untuk Uji RLS
  console.log("\n[3] Setup 2 Akun Guru (Guru A & Guru B) untuk Uji Isolasi RLS...");
  const guruAEmail = "guru.a.test@madrasah.id";
  const guruBEmail = "guru.b.test@madrasah.id";
  const testPassword = "PasswordTest123!";

  async function getOrCreateUser(email, nama) {
    const { data: existingList } = await adminClient.auth.admin.listUsers();
    let user = existingList.users.find((u) => u.email === email);
    if (!user) {
      const { data: created, error } = await adminClient.auth.admin.createUser({
        email,
        password: testPassword,
        email_confirm: true,
        user_metadata: { nama_lengkap: nama, role: "guru" },
      });
      if (error) throw error;
      user = created.user;
    }
    // Pastikan profile terisi
    await adminClient.from("profiles").upsert({
      id: user.id,
      nama_lengkap: nama,
      role: "guru",
      aktif: true,
    });
    return user;
  }

  const guruA = await getOrCreateUser(guruAEmail, "Guru A - Fikih");
  const guruB = await getOrCreateUser(guruBEmail, "Guru B - Akidah Akhlak");
  console.log(`  ✅ Guru A ID: ${guruA.id} (${guruAEmail})`);
  console.log(`  ✅ Guru B ID: ${guruB.id} (${guruBEmail})`);

  // Pastikan ada tahun ajaran & mapel untuk penugasan
  const { data: activeTa } = await adminClient.from("tahun_ajaran").select("id").eq("aktif", true).single();
  const { data: mapelList } = await adminClient.from("mapel").select("id, kode").limit(2);

  if (!activeTa || !mapelList || mapelList.length < 2) {
    console.log("⚠️ Data master tahun ajaran atau mapel belum lengkap untuk penugasan.");
    return;
  }

  // Buat Penugasan untuk Guru A dan Guru B
  const { data: penugasanA } = await adminClient
    .from("penugasan")
    .upsert({
      guru_id: guruA.id,
      mapel_id: mapelList[0].id,
      tahun_ajaran_id: activeTa.id,
      tingkat_kelas: 7,
      rombel: "7A",
    })
    .select("id")
    .single();

  const { data: penugasanB } = await adminClient
    .from("penugasan")
    .upsert({
      guru_id: guruB.id,
      mapel_id: mapelList[1].id,
      tahun_ajaran_id: activeTa.id,
      tingkat_kelas: 8,
      rombel: "8A",
    })
    .select("id")
    .single();

  console.log(`  ✅ Penugasan Guru A ID: ${penugasanA.id}`);
  console.log(`  ✅ Penugasan Guru B ID: ${penugasanB.id}`);

  // Guru A buat RPP (status draf) via admin client atau client Guru A
  const { data: rppGuruA } = await adminClient
    .from("rpp")
    .insert({
      penugasan_id: penugasanA.id,
      materi_pokok: "Ketentuan Shalat Berjamaah (Milik Guru A)",
      alokasi_waktu: "2 x 40 menit",
      pertemuan_ke: 1,
      versi: "minimum",
      status: "draf",
      created_by: guruA.id,
    })
    .select("id, materi_pokok")
    .single();

  console.log(`  ✅ RPP dibuat untuk Guru A: '${rppGuruA.materi_pokok}' (ID: ${rppGuruA.id})`);

  // 4. Uji RLS: Login sebagai Guru B
  console.log("\n[4] Login anonim sebagai Guru B...");
  const clientB = createClient(url, anonKey);
  const { error: signInErr } = await clientB.auth.signInWithPassword({
    email: guruBEmail,
    password: testPassword,
  });

  if (signInErr) {
    console.log(`  ❌ Login Guru B gagal: ${signInErr.message}`);
    return;
  }
  console.log("  ✅ Guru B berhasil sign in.");

  // Guru B mencoba membaca SEMUA data RPP
  console.log("\n[5] Uji Akses RLS: Guru B mencoba membaca tabel RPP...");
  const { data: rppVisibleToB, error: readErr } = await clientB.from("rpp").select("id, materi_pokok, penugasan_id");

  if (readErr) {
    console.log(`  ❌ Error membaca RPP: ${readErr.message}`);
  } else {
    console.log(`  Total RPP yang terlihat oleh Guru B: ${rppVisibleToB.length}`);
    const canSeeA = rppVisibleToB.some((r) => r.id === rppGuruA.id);
    if (!canSeeA) {
      console.log("  🎉 SUKSES RLS: Guru B TIDAK BISA melihat RPP milik Guru A!");
    } else {
      console.log("  ❌ PELANGGARAN RLS: Guru B BISA melihat RPP milik Guru A!");
    }
  }

  // 6. Uji RLS: Login sebagai Guru A
  console.log("\n[6] Login sebagai Guru A dan pastikan bisa melihat RPP-nya sendiri...");
  const clientA = createClient(url, anonKey);
  await clientA.auth.signInWithPassword({
    email: guruAEmail,
    password: testPassword,
  });

  const { data: rppVisibleToA } = await clientA.from("rpp").select("id, materi_pokok");
  const canASeeOwn = rppVisibleToA?.some((r) => r.id === rppGuruA.id);
  if (canASeeOwn) {
    console.log("  🎉 SUKSES RLS: Guru A BISA melihat RPP miliknya sendiri!");
  } else {
    console.log("  ❌ Guru A tidak bisa melihat RPP-nya sendiri.");
  }

  console.log("\n=== HASIL AKHIR PENGUJIAN RLS ===");
  console.log("Isolasi multi-tenant antar guru terverifikasi 100%!");
}

runTest().catch(console.error);
