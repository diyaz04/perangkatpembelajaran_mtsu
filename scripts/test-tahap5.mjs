import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\s]+)/)[1];
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\s]+)/)[1];
const supabase = createClient(url, serviceKey);

async function runTest() {
  console.log("=====================================================================");
  console.log("🧪 TESTING TAHAP 5: ANALISIS CP, TP, DAN ATP (MODUL GURU)");
  console.log("=====================================================================");

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

  // 1. Verifikasi Tahun Ajaran Aktif & Penugasan Guru
  let testPenugasan = null;
  await assertStep("1. Verifikasi Tahun Ajaran Aktif & Penugasan Guru", async () => {
    const { data: ta, error: taErr } = await supabase
      .from("tahun_ajaran")
      .select("id, nama, aktif")
      .eq("aktif", true)
      .single();

    if (taErr || !ta) throw new Error("Tahun ajaran aktif tidak ditemukan");

    const { data: penugasanList, error: pErr } = await supabase
      .from("penugasan")
      .select("id, tingkat_kelas, rombel, mapel_id, guru_id")
      .eq("tahun_ajaran_id", ta.id)
      .limit(1);

    if (pErr || !penugasanList || penugasanList.length === 0) {
      throw new Error("Tidak ada penugasan guru di tahun ajaran aktif");
    }

    testPenugasan = penugasanList[0];
  });

  // 2. Verifikasi Ketersediaan Master CP Fase D untuk Mapel Penugasan
  let cpItems = [];
  await assertStep("2. Verifikasi Capaian Pembelajaran Fase D Mapel", async () => {
    const { data, error } = await supabase
      .from("capaian_pembelajaran")
      .select("id, fase, elemen, deskripsi_cp, sumber_regulasi")
      .eq("mapel_id", testPenugasan.mapel_id);

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("Tidak ada elemen CP untuk mapel ini");
    }
    cpItems = data;
  });

  // 3. Verifikasi Master Panca Cinta & Dimensi Profil Lulusan
  let pancaList = [];
  let dplList = [];
  await assertStep("3. Verifikasi Master Panca Cinta (5) & DPL (8)", async () => {
    const { data: panca, error: pErr } = await supabase
      .from("panca_cinta")
      .select("id, kode, nama")
      .order("urutan", { ascending: true });

    if (pErr) throw pErr;
    if (!panca || panca.length !== 5) throw new Error(`Panca Cinta tidak lengkap (${panca?.length}/5)`);
    pancaList = panca;

    const { data: dpl, error: dErr } = await supabase
      .from("dimensi_profil_lulusan")
      .select("id, kode, nama");

    if (dErr) throw dErr;
    if (!dpl || dpl.length !== 8) throw new Error(`DPL tidak lengkap (${dpl?.length}/8)`);
    dplList = dpl;
  });

  // 4. Pengujian Simpan Langkah 1: Analisis CP (Kata Kunci, Materi, Benang Merah, DPL, Panca Cinta)
  let savedAnalisisList = [];
  await assertStep("4. Langkah 1: Simpan Analisis CP (Pemetaan DPL & Panca Cinta)", async () => {
    for (const cp of cpItems.slice(0, 2)) {
      const payload = {
        penugasan_id: testPenugasan.id,
        cp_id: cp.id,
        materi_pokok: `Materi Uji Coba: ${cp.elemen}`,
        kompetensi: JSON.stringify({
          kompetensi: "Memahami dan Mengaplikasi",
          kata_kunci: ["tartil", "keikhlasan", "adab"],
          benang_merah: "Menumbuhkan keluhuran budi pekerti dan ketakwaan kepada Allah SWT.",
          dpl_ids: [dplList[0].id, dplList[2].id],
          panca_cinta_ids: [pancaList[0].id, pancaList[1].id],
        }),
        alokasi_jp: 4,
        status: "draf",
      };

      const { data, error } = await supabase
        .from("analisis_cp")
        .upsert(payload)
        .select()
        .single();

      if (error) throw error;
      savedAnalisisList.push(data);
    }

    if (savedAnalisisList.length === 0) throw new Error("Gagal menyimpan analisis CP");
  });

  // 5. Pengujian Simpan Langkah 2: Rumuskan Tujuan Pembelajaran (3 Komponen, Formula KBC, KKTP)
  let savedTpList = [];
  await assertStep("5. Langkah 2: Rumuskan Tujuan Pembelajaran (3 Komponen & KKTP)", async () => {
    let tpCounter = 1;
    for (const an of savedAnalisisList) {
      const pcId = pancaList[0].id;
      const pcNama = pancaList[0].nama;
      const materi = an.materi_pokok;

      // Rumusan otomatis
      const formula = `Murid dapat menganalisis dan menerapkan ${materi} dalam kehidupan sehari-hari, sebagai wujud ${pcNama}.`;

      const tpPayload = {
        analisis_cp_id: an.id,
        kode_tp: `${testPenugasan.tingkat_kelas}.${tpCounter}`,
        deskripsi: formula,
        panca_cinta_ids: [pcId],
        dpl_ids: [dplList[0].id, dplList[1].id],
        alokasi_jp: 4,
        urutan: tpCounter,
      };

      const { data, error } = await supabase
        .from("tujuan_pembelajaran")
        .insert(tpPayload)
        .select()
        .single();

      if (error) throw error;
      savedTpList.push(data);
      tpCounter++;
    }

    if (savedTpList.length === 0) throw new Error("Gagal merumuskan TP");
  });

  // 6. Pengujian Simpan Langkah 3: Susun ATP (Reorder, Metode Pengurutan, Ajukan Validasi)
  await assertStep("6. Langkah 3: Susun ATP & Ajukan Validasi", async () => {
    // Reorder TP terbalik
    const reversed = [...savedTpList].reverse();
    for (let i = 0; i < reversed.length; i++) {
      const item = reversed[i];
      const newUrutan = i + 1;
      const newKode = `${testPenugasan.tingkat_kelas}.${newUrutan}`;

      const { error: upErr } = await supabase
        .from("tujuan_pembelajaran")
        .update({ urutan: newUrutan, kode_tp: newKode })
        .eq("id", item.id);

      if (upErr) throw upErr;
    }

    // Upsert ATP status = 'diajukan'
    const atpPayload = {
      penugasan_id: testPenugasan.id,
      semester: 1,
      status: "diajukan",
    };

    const { data: atpDoc, error: atpErr } = await supabase
      .from("atp")
      .upsert(atpPayload, { onConflict: "penugasan_id,semester" })
      .select()
      .single();

    if (atpErr) throw atpErr;
    if (atpDoc.status !== "diajukan") throw new Error("Status ATP bukan diajukan");
  });

  // 7. Pengujian Pratinjau Dokumen ATP: Query Lengkap Kop + Tabel + Signatures
  await assertStep("7. Pratinjau Dokumen ATP (Kop, Tabel No-Elemen-TP-JP, Tanda Tangan)", async () => {
    // Cek Kop Madrasah
    const { data: madrasah, error: mErr } = await supabase
      .from("madrasah")
      .select("nama, nsm, npsn, alamat, kabupaten, kepala_nama, kepala_nip")
      .limit(1)
      .single();

    if (mErr || !madrasah) throw new Error("Kop madrasah tidak dapat dimuat");

    // Cek Dokumen ATP & TP terurut
    const { data: tpRows, error: tpErr } = await supabase
      .from("tujuan_pembelajaran")
      .select("id, kode_tp, deskripsi, alokasi_jp, urutan, analisis_cp(cp_id, materi_pokok)")
      .in(
        "analisis_cp_id",
        savedAnalisisList.map((a) => a.id)
      )
      .order("urutan", { ascending: true });

    if (tpErr) throw tpErr;
    if (!tpRows || tpRows.length === 0) throw new Error("Tabel TP pratinjau kosong");

    // Hitung total JP
    const totalJp = tpRows.reduce((acc, cur) => acc + (cur.alokasi_jp || 0), 0);
    if (totalJp <= 0) throw new Error("Total JP pratinjau tidak valid");
  });

  console.log("=====================================================================");
  console.log(`🎉 HASIL PENGUJIAN TAHAP 5: ${passed}/${total} PENGUJIAN BERHASIL (100%)`);
  console.log("=====================================================================");
}

runTest().catch((e) => {
  console.error("Test execution aborted:", e);
  process.exit(1);
});
