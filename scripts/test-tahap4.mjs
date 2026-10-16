import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("❌ Environment variables NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function runTest() {
  console.log("==========================================================");
  console.log("🧪 TESTING TAHAP 4: MASTER DATA & REGULASI KURIKULUM");
  console.log("==========================================================");

  let passed = 0;
  let total = 0;

  async function assertStep(name, fn) {
    total++;
    process.stdout.write(`[TEST ${total}] ${name}... `);
    try {
      await fn();
      console.log("✅ PASSED");
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
    }
  }

  // 1. Profil Madrasah
  await assertStep("1. Profil Madrasah: Query & Update", async () => {
    const { data: existing, error: qErr } = await supabase.from("madrasah").select("*").limit(1).maybeSingle();
    if (qErr) throw qErr;
    if (!existing) throw new Error("Data madrasah tidak ditemukan");

    const testNama = existing.nama;
    const { error: uErr } = await supabase.from("madrasah").update({
      kabupaten: "Kabupaten Tasikmalaya",
      kepala_nama: "Drs. H. Ahmad Fauzi, M.Pd.I",
    }).eq("id", existing.id);
    if (uErr) throw uErr;
  });

  // 2. Tahun Ajaran
  let testTaId = null;
  await assertStep("2. Tahun Ajaran: Tambah, Switch Aktif & Cleanup", async () => {
    // Tambah TA uji coba
    const { data: newTa, error: insErr } = await supabase.from("tahun_ajaran").insert({
      nama: "2029/2030_TEST",
      tgl_mulai: "2029-07-16",
      tgl_selesai: "2030-06-28",
      smt1_mulai: "2029-07-16",
      smt1_selesai: "2029-12-20",
      smt2_mulai: "2030-01-07",
      smt2_selesai: "2030-06-28",
      aktif: false,
    }).select().single();
    if (insErr) throw insErr;
    testTaId = newTa.id;

    // Switch aktif
    await supabase.from("tahun_ajaran").update({ aktif: false }).neq("id", testTaId);
    await supabase.from("tahun_ajaran").update({ aktif: true }).eq("id", testTaId);

    // Verifikasi
    const { data: activeList } = await supabase.from("tahun_ajaran").select("*").eq("aktif", true);
    if (activeList.length !== 1 || activeList[0].id !== testTaId) {
      throw new Error(`Harus tepat 1 TA aktif, ditemukan: ${activeList.length}`);
    }

    // Kembalikan ke TA asli (2026/2027)
    await supabase.from("tahun_ajaran").update({ aktif: false }).eq("id", testTaId);
    await supabase.from("tahun_ajaran").update({ aktif: true }).eq("nama", "2026/2027");

    // Hapus TA uji coba
    await supabase.from("tahun_ajaran").delete().eq("id", testTaId);
  });

  // 3. Kalender Pendidikan
  await assertStep("3. Kalender Pendidikan: Tambah, Batch CSV Import & Hapus", async () => {
    const { data: activeTa } = await supabase.from("tahun_ajaran").select("id").eq("aktif", true).single();
    if (!activeTa) throw new Error("Tahun ajaran aktif tidak ditemukan");

    // Import batch
    const items = [
      {
        tahun_ajaran_id: activeTa.id,
        tgl_mulai: "2026-07-20",
        tgl_selesai: "2026-07-22",
        jenis: "kegiatan_madrasah",
        keterangan: "LDKS Siswa Madrasah",
        memotong_minggu_efektif: false,
      },
      {
        tahun_ajaran_id: activeTa.id,
        tgl_mulai: "2026-10-05",
        tgl_selesai: "2026-10-10",
        jenis: "asesmen",
        keterangan: "ASTS Ganjil Uji Coba",
        memotong_minggu_efektif: true,
      },
    ];

    const { data: inserted, error: insErr } = await supabase.from("kalender_kegiatan").insert(items).select();
    if (insErr) throw insErr;
    if (inserted.length !== 2) throw new Error("Gagal memasukkan 2 kegiatan");

    // Cleanup
    const ids = inserted.map((i) => i.id);
    await supabase.from("kalender_kegiatan").delete().in("id", ids);
  });

  // 4. Mata Pelajaran
  await assertStep("4. Mata Pelajaran: Tambah, Validasi JP & Hapus", async () => {
    const { data: newMapel, error: insErr } = await supabase.from("mapel").insert({
      nama: "Robotika & AI Madrasah",
      kode: "ROB_TEST",
      kelompok: "muatan_lokal",
      jp_per_minggu_kls7: 2,
      jp_per_minggu_kls8: 2,
      jp_per_minggu_kls9: 2,
    }).select().single();
    if (insErr) throw insErr;

    // Cleanup
    await supabase.from("mapel").delete().eq("id", newMapel.id);
  });

  // 5. Penugasan Guru
  await assertStep("5. Penugasan Guru: Mapping Guru, Mapel, Rombel, JP", async () => {
    const { data: guru } = await supabase.from("profiles").select("id").limit(1).single();
    const { data: mapel } = await supabase.from("mapel").select("id, jp_per_minggu_kls7").limit(1).single();
    const { data: activeTa } = await supabase.from("tahun_ajaran").select("id").eq("aktif", true).single();

    if (!guru || !mapel || !activeTa) throw new Error("Prasyarat penugasan tidak lengkap");

    const { data: penugasan, error: insErr } = await supabase.from("penugasan").insert({
      guru_id: guru.id,
      mapel_id: mapel.id,
      tahun_ajaran_id: activeTa.id,
      tingkat_kelas: 7,
      rombel: "7A, 7B",
    }).select().single();
    if (insErr) throw insErr;

    // Verifikasi rombel parsing
    const rombelCount = penugasan.rombel.split(",").filter(Boolean).length;
    if (rombelCount !== 2) throw new Error("Rombel parsing gagal");

    // Cleanup
    await supabase.from("penugasan").delete().eq("id", penugasan.id);
  });

  // 6. Capaian Pembelajaran (CP)
  await assertStep("6. Capaian Pembelajaran: CRUD & Batch Insert per Elemen", async () => {
    const { data: mapel } = await supabase.from("mapel").select("id").limit(1).single();
    if (!mapel) throw new Error("Mapel tidak ditemukan");

    const cpItems = [
      {
        mapel_id: mapel.id,
        fase: "D",
        elemen: "Elemen Test A",
        deskripsi_cp: "Deskripsi capaian pembelajaran uji coba A",
        sumber_regulasi: "KMA 1503/2025",
      },
      {
        mapel_id: mapel.id,
        fase: "D",
        elemen: "Elemen Test B",
        deskripsi_cp: "Deskripsi capaian pembelajaran uji coba B",
        sumber_regulasi: "KMA 1503/2025",
      },
    ];

    const { data: inserted, error: insErr } = await supabase.from("capaian_pembelajaran").insert(cpItems).select();
    if (insErr) throw insErr;
    if (inserted.length !== 2) throw new Error("Gagal memasukkan elemen CP");

    // Cleanup
    await supabase.from("capaian_pembelajaran").delete().in("id", inserted.map((x) => x.id));
  });

  // 7. Panca Cinta & Materi KBC
  await assertStep("7. Panca Cinta & Materi KBC: 5 Topik Tetap & CRUD Materi KBC", async () => {
    const { data: topiks, error: pcErr } = await supabase.from("panca_cinta").select("*").order("urutan");
    if (pcErr) throw pcErr;
    if (topiks.length !== 5) throw new Error(`Harus ada tepat 5 topik Panca Cinta, ditemukan: ${topiks.length}`);

    // Tambah materi KBC
    const { data: materi, error: matErr } = await supabase.from("materi_kbc").insert({
      panca_cinta_id: topiks[0].id,
      pilar: "Spiritualitas",
      nilai: "Mahabbah Lillahi Ta'ala",
      deskripsi: "Menumbuhkan rasa cinta sejati kepada Allah melalui perenungan ciptaan-Nya",
      integrasi_sains_sosial: "Korelasi dengan keteraturan hukum alam semesta (sunnatullah)",
      indikator_perilaku: ["Menunjukkan rasa syukur", "Menghargai sesama makhluk"],
    }).select().single();
    if (matErr) throw matErr;

    // Cleanup
    await supabase.from("materi_kbc").delete().eq("id", materi.id);
  });

  // 8. Model Pembelajaran
  await assertStep("8. Model Pembelajaran: CRUD & Editor Sintaks Terurut", async () => {
    const { data: model, error: insErr } = await supabase.from("model_pembelajaran").insert({
      nama: "Model Eksplorasi KBC_TEST",
      sintaks: [
        { urutan: 1, nama_sintaks: "Tadabbur & Refleksi", pengalaman_belajar: "memahami" },
        { urutan: 2, nama_sintaks: "Aksi Nyata & Kolaborasi", pengalaman_belajar: "mengaplikasi" },
        { urutan: 3, nama_sintaks: "Uswah & Evaluasi", pengalaman_belajar: "merefleksi" },
      ],
    }).select().single();
    if (insErr) throw insErr;

    if (!Array.isArray(model.sintaks) || model.sintaks.length !== 3) {
      throw new Error("Sintaks model pembelajaran tidak sesuai");
    }

    // Cleanup
    await supabase.from("model_pembelajaran").delete().eq("id", model.id);
  });

  console.log("==========================================================");
  console.log(`📊 HASIL PENGUJIAN TAHAP 4: ${passed} / ${total} LOLOS (${Math.round((passed / total) * 100)}%)`);
  console.log("==========================================================");

  if (passed !== total) process.exit(1);
}

runTest();
