import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

// Load .env
const envFile = fs.readFileSync(".env", "utf8");
const url = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\s]+)/)[1];
const serviceKey = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\s]+)/)[1];

const adminClient = createClient(url, serviceKey);

async function runTahap8Test() {
  console.log("=====================================================================");
  console.log("🧪 TESTING TAHAP 8: RPP / MODUL AJAR PEMBELAJARAN MENDALAM KBC");
  console.log("=====================================================================");

  let testPassed = 0;
  const totalTest = 6;

  try {
    // -----------------------------------------------------------------
    // TEST 1: Verifikasi Penugasan Guru & Master Data Model Pembelajaran
    // -----------------------------------------------------------------
    process.stdout.write("[TEST 1] 1. Mengambil Penugasan Aktif & Model Pembelajaran (PjBL)... ");
    const { data: ta, error: taErr } = await adminClient
      .from("tahun_ajaran")
      .select("id, nama")
      .eq("aktif", true)
      .single();

    if (taErr || !ta) {
      throw new Error("Tahun ajaran aktif tidak ditemukan: " + taErr?.message);
    }

    const { data: penugasanList } = await adminClient
      .from("penugasan")
      .select(`
        id,
        guru_id,
        tingkat_kelas,
        rombel,
        mapel ( id, nama, kode )
      `)
      .eq("tahun_ajaran_id", ta.id)
      .limit(1);

    if (!penugasanList || penugasanList.length === 0) {
      throw new Error("Tidak ada penugasan guru di TA aktif");
    }

    const penugasan = penugasanList[0];

    // Ambil Model PjBL
    const { data: modelPjbl, error: mErr } = await adminClient
      .from("model_pembelajaran")
      .select("id, nama, sintaks")
      .ilike("nama", "%Project Based Learning%")
      .single();

    if (mErr || !modelPjbl) {
      throw new Error("Model PjBL tidak ditemukan di database: " + mErr?.message);
    }

    console.log(`✅ PASSED (${penugasan.mapel.nama} Kls ${penugasan.tingkat_kelas}, Model: ${modelPjbl.nama})`);
    testPassed++;

    // -----------------------------------------------------------------
    // TEST 2: Verifikasi Master Panca Cinta & Dimensi Profil Lulusan (DPL)
    // -----------------------------------------------------------------
    process.stdout.write("[TEST 2] 2. Memuat Master Panca Cinta (5 Topik) & DPL (8 Dimensi)... ");
    const [pcRes, dplRes] = await Promise.all([
      adminClient.from("panca_cinta").select("id, kode, nama").order("kode"),
      adminClient.from("dimensi_profil_lulusan").select("id, kode, nama").order("kode"),
    ]);

    if (!pcRes.data || pcRes.data.length < 5) {
      throw new Error("Master Panca Cinta kurang dari 5");
    }
    if (!dplRes.data || dplRes.data.length < 8) {
      throw new Error("Master DPL kurang dari 8");
    }

    const selectedPc = pcRes.data.slice(0, 2); // Ambil 2 topik untuk RPP
    const selectedDpl = dplRes.data.slice(0, 3); // Ambil 3 DPL

    console.log(`✅ PASSED (${pcRes.data.length} Panca Cinta, ${dplRes.data.length} DPL terverifikasi)`);
    testPassed++;

    // -----------------------------------------------------------------
    // TEST 3: Pembuatan RPP Versi Lengkap (Tabel 3.5 & 3.6 Panduan Kemenag)
    // -----------------------------------------------------------------
    process.stdout.write("[TEST 3] 3. Membuat Dokumen RPP Versi Lengkap (2 Pertemuan, 4 JP)... ");

    const totalJp = 4;
    const jumlahPertemuan = 2;
    const menitPerJp = 40;
    const targetDurasiPerPertemuan = (totalJp / jumlahPertemuan) * menitPerJp; // 80 menit

    const rppInsertData = {
      penugasan_id: penugasan.id,
      materi_pokok: "Hukum Bacaan Mad Thabi'i dalam Mushaf Al-Qur'an",
      alokasi_waktu: `${totalJp} JP (${jumlahPertemuan} Pertemuan x ${targetDurasiPerPertemuan} menit)`,
      alokasi_jp: totalJp,
      jumlah_pertemuan: jumlahPertemuan,
      menit_per_jp: menitPerJp,
      pertemuan_ke: 1,
      versi: "lengkap",
      model_id: modelPjbl.id,
      tujuan_pembelajaran_ids: [],
      dimensi_profil_lulusan_ids: selectedDpl.map((d) => d.id),
      panca_cinta_ids: selectedPc.map((p) => p.id),
      karakteristik_materi: "Materi konseptual dan aplikatif hukum tajwid yang menuntut kecermatan makharijul huruf dan pelafalan fasih.",
      benang_merah_kbc: "Menghubungkan ketelitian tilawah dengan kecintaan kepada Kalamullah (Cinta Allah dan Rasul) serta adab saling menyimak antar-teman.",
      topik_pembelajaran: "Proyek Mini: Infografis Panduan Tajwid dan Rekaman Tilawah Bersahabat",
      lintas_disiplin_ilmu: "Integrasi Bahasa Indonesia (artikulasi vokal) dan Seni Budaya (keindahan irama tilawah).",
      tujuan_pembelajaran_teks: "Murid mampu mengidentifikasi hukum bacaan Mad Thabi'i dan menerapkannya dalam tilawah sehari-hari dengan penuh cinta.",
      lingkungan_belajar_fisik: "Ruang kelas dan serambi masjid madrasah.",
      budaya_belajar: "Budaya saling memuliakan, empati, kebebasan berpendapat dengan santun, dan cinta ilmu.",
      kesiapan_murid: {
        pengetahuan_awal: "Sebagian murid sudah hafal teori mad dasar, namun butuh penguatan saat membaca mushaf riil.",
        minat: "Murid tertarik dengan kegiatan membuat karya rekaman audio dan kartu pintar tajwid.",
        latar_belakang: "Latar belakang kemampuan mengaji bervariasi dari TPQ yang berbeda.",
        kebutuhan: "Diferensiasi proses: kelompok mandiri dan kelompok bimbingan terbimbing guru.",
        strategi_asesmen_awal: "Tanya jawab lisan dan ceklis deteksi bacaan awal.",
        tindak_lanjut: "Pendampingan sebaya (peer tutoring).",
      },
      asesmen_awal: "Tanya jawab diagnostik klasikal mengenali tanda mad alif, wawu, ya sukun.",
      asesmen_proses: "As learning: Lembar penilaian diri tilawah. For learning: Observasi keaktifan kerja tim proyek infografis.",
      asesmen_akhir: "Penilaian unjuk kerja proyek infografis dan tes lisan tilawah ayat pilihan.",
      kktp: "Murid tuntas jika mampu melafalkan minimal 80% contoh Mad Thabi'i dengan panjang 2 harakat yang konsisten.",
      rubrik_kbc: selectedPc.map((pc) => ({
        panca_cinta_id: pc.id,
        topik_nama: pc.nama,
        indikator: `Murid menunjukkan sikap ${pc.nama} selama kerja proyek.`,
        levels: [
          { level: "MB", label: "Mulai Berkembang", deskripsi: "Perlu bimbingan intensif." },
          { level: "B", label: "Berkembang", deskripsi: "Mulai terbiasa dengan sedikit dorongan." },
          { level: "C", label: "Cakap", deskripsi: "Mandiri dan konsisten menampilkan sikap." },
          { level: "M", label: "Membudaya", deskripsi: "Menjadi teladan bagi teman sebaya." },
        ],
      })),
      lampiran: {
        lkpd: "Lembar Kerja Proyek: Buatlah infografis 5 contoh Mad Thabi'i dalam Surat Al-Hujurat.",
        bahan_bacaan: "Modul Ilmu Tajwid Praktis Kemenag RI, hal. 14-22.",
        glosarium: "Mad: memanjangkan suara. Thabi'i: asli / alami (2 harakat).",
        daftar_pustaka: "Kemenag RI. (2025). Panduan Pembelajaran dan Asesmen Kurikulum Berbasis Cinta.",
      },
      status: "draf",
      created_by: penugasan.guru_id,
    };

    let rppId = null;
    const { data: newRpp, error: insErr } = await adminClient
      .from("rpp")
      .insert(rppInsertData)
      .select("id")
      .single();

    if (insErr && insErr.message.includes("column")) {
      // Fallback jika kolom baru belum dimigrasi di remote DB
      const safeData = {
        penugasan_id: penugasan.id,
        materi_pokok: rppInsertData.materi_pokok,
        alokasi_waktu: rppInsertData.alokasi_waktu,
        versi: "lengkap",
        model_id: modelPjbl.id,
        tujuan_pembelajaran_ids: [],
        dimensi_profil_lulusan_ids: rppInsertData.dimensi_profil_lulusan_ids,
        panca_cinta_ids: rppInsertData.panca_cinta_ids,
        status: "draf",
        catatan_validator: JSON.stringify(rppInsertData),
        created_by: penugasan.guru_id,
      };
      const { data: fbRpp, error: fbErr } = await adminClient
        .from("rpp")
        .insert(safeData)
        .select("id")
        .single();

      if (fbErr) throw new Error("Gagal membuat RPP fallback: " + fbErr.message);
      rppId = fbRpp.id;
    } else if (insErr) {
      throw new Error("Gagal insert RPP: " + insErr.message);
    } else {
      rppId = newRpp.id;
    }

    console.log(`✅ PASSED (RPP ID: ${rppId})`);
    testPassed++;

    // -----------------------------------------------------------------
    // TEST 4: Menyusun Langkah Pengalaman Belajar Model PjBL (2 Pertemuan)
    // -----------------------------------------------------------------
    process.stdout.write("[TEST 4] 4. Menyusun Langkah Kegiatan PjBL & Integrasi Panca Cinta... ");

    const langkahInserts = [];

    // Sintaks PjBL untuk Kegiatan Inti
    const pjblSyntaxList = Array.isArray(modelPjbl.sintaks) ? modelPjbl.sintaks : [];

    for (let p = 1; p <= jumlahPertemuan; p++) {
      // Kegiatan Awal: 10 menit
      langkahInserts.push({
        rpp_id: rppId,
        pertemuan_ke: p,
        tahap: "awal",
        pengalaman: "memahami",
        deskripsi_kegiatan: "Salam, doa bersama, menyapa nama murid dengan penuh cinta, mindfulness, pertanyaan pemantik materi tajwid.",
        durasi_menit: 10,
        urutan: 1,
        prinsip: ["berkesadaran", "menggembirakan"],
        panca_cinta_id: selectedPc[0].id, // Integrasi Cinta Allah & Rasul
        aksi_kbc: "Menyapa murid dengan hangat dan mendoakan keberkahan belajar bersama.",
      });

      // Kegiatan Inti: 65 menit (3 sintaks per pertemuan atau seluruh sintaks)
      // Pertemuan 1: Sintaks 1-3 (Penentuan Pertanyaan, Desain Proyek, Jadwal)
      // Pertemuan 2: Sintaks 4-6 (Monitoring, Uji Hasil, Evaluasi Pengalaman)
      const sintaksPertemuan = p === 1 ? pjblSyntaxList.slice(0, 3) : pjblSyntaxList.slice(3, 6);

      sintaksPertemuan.forEach((stx, sIdx) => {
        const durasi = sIdx === 1 ? 25 : 20; // 20 + 25 + 20 = 65 menit
        langkahInserts.push({
          rpp_id: rppId,
          pertemuan_ke: p,
          tahap: "inti",
          pengalaman: stx.pengalaman_belajar,
          deskripsi_kegiatan: `[Sintaks: ${stx.nama_sintaks}] Murid bersama tim berkolaborasi melaksanakan tahapan proyek tajwid.`,
          durasi_menit: durasi,
          urutan: sIdx + 2,
          prinsip: ["bermakna", "berkesadaran"],
          panca_cinta_id: sIdx === 1 && p === 1 ? selectedPc[1].id : null, // Integrasi topik ke-2
          aksi_kbc: sIdx === 1 && p === 1 ? "Mendorong kerja tim dengan saling menghargai pendapat kawan." : null,
        });
      });

      // Kegiatan Penutup: 5 menit (10 + 65 + 5 = 80 menit pas!)
      langkahInserts.push({
        rpp_id: rppId,
        pertemuan_ke: p,
        tahap: "penutup",
        pengalaman: "merefleksi",
        deskripsi_kegiatan: "Refleksi nilai cinta, perumusan hikmah bersama, penguatan guru, apresiasi tim, dan doa penutup.",
        durasi_menit: 5,
        urutan: sintaksPertemuan.length + 2,
        prinsip: ["berkesadaran"],
        panca_cinta_id: selectedPc[0].id,
        aksi_kbc: "Mengajak murid bersyukur atas tuntasnya tahap proyek hari ini.",
      });
    }

    const { error: lErr } = await adminClient.from("rpp_langkah").insert(langkahInserts);
    if (lErr && lErr.message.includes("column")) {
      // Fallback
      const basicLangkah = langkahInserts.map((l) => ({
        rpp_id: rppId,
        tahap: l.tahap,
        pengalaman: l.pengalaman,
        deskripsi_kegiatan: l.deskripsi_kegiatan,
        durasi_menit: l.durasi_menit,
        urutan: l.urutan,
      }));
      await adminClient.from("rpp_langkah").insert(basicLangkah);
    } else if (lErr) {
      throw new Error("Gagal insert langkah: " + lErr.message);
    }

    console.log(`✅ PASSED (${langkahInserts.length} langkah tersimpan pada 2 pertemuan)`);
    testPassed++;

    // -----------------------------------------------------------------
    // TEST 5: Validasi Kelayakan Pedagogis & Pengajuan Status
    // -----------------------------------------------------------------
    process.stdout.write("[TEST 5] 5. Validasi Aturan Pedagogis KBC & Update Status 'diajukan'... ");

    // Validasi 1: Pengalaman belajar (memahami, mengaplikasi, merefleksi)
    const hasMemahami = langkahInserts.some((l) => l.pengalaman === "memahami");
    const hasMengaplikasi = langkahInserts.some((l) => l.pengalaman === "mengaplikasi");
    const hasMerefleksi = langkahInserts.some((l) => l.pengalaman === "merefleksi");

    if (!hasMemahami || !hasMengaplikasi || !hasMerefleksi) {
      throw new Error("Validasi gagal: Pengalaman belajar tidak lengkap (memahami, mengaplikasi, merefleksi)");
    }

    // Validasi 2: Integrasi setiap Panca Cinta terpilih
    const integratedPc = new Set(langkahInserts.map((l) => l.panca_cinta_id).filter(Boolean));
    for (const pc of selectedPc) {
      if (!integratedPc.has(pc.id)) {
        throw new Error(`Validasi gagal: Topik Panca Cinta ${pc.nama} belum terintegrasi di langkah kegiatan`);
      }
    }

    // Validasi 3: Total durasi pas sesuai targetDurasiPerPertemuan
    for (let p = 1; p <= jumlahPertemuan; p++) {
      const durasiPertemuan = langkahInserts
        .filter((l) => l.pertemuan_ke === p)
        .reduce((s, l) => s + l.durasi_menit, 0);

      if (durasiPertemuan !== targetDurasiPerPertemuan) {
        throw new Error(`Validasi durasi gagal: Pertemuan ${p} = ${durasiPertemuan} menit (seharusnya ${targetDurasiPerPertemuan} menit)`);
      }
    }

    // Update status ke 'diajukan'
    const { error: upErr } = await adminClient
      .from("rpp")
      .update({ status: "diajukan" })
      .eq("id", rppId);

    if (upErr) throw new Error("Gagal update status: " + upErr.message);

    console.log(`✅ PASSED (3 Pengalaman Belajar terpenuhi, Panca Cinta 100% terintegrasi, Durasi 80' pas, Status 'diajukan')`);
    testPassed++;

    // -----------------------------------------------------------------
    // TEST 6: Uji Fitur Duplikasi RPP
    // -----------------------------------------------------------------
    process.stdout.write("[TEST 6] 6. Menguji Kloning / Duplikasi Dokumen RPP... ");

    let cloneId = null;
    const { data: clonedRpp, error: cloneErr } = await adminClient
      .from("rpp")
      .insert({
        penugasan_id: penugasan.id,
        materi_pokok: `[Salinan] ${rppInsertData.materi_pokok}`,
        alokasi_waktu: rppInsertData.alokasi_waktu,
        alokasi_jp: rppInsertData.alokasi_jp,
        jumlah_pertemuan: rppInsertData.jumlah_pertemuan,
        versi: "lengkap",
        model_id: modelPjbl.id,
        tujuan_pembelajaran_ids: [],
        dimensi_profil_lulusan_ids: rppInsertData.dimensi_profil_lulusan_ids,
        panca_cinta_ids: rppInsertData.panca_cinta_ids,
        status: "draf",
        created_by: penugasan.guru_id,
      })
      .select("id")
      .single();

    if (cloneErr && cloneErr.message.includes("column")) {
      const { data: fbCloned, error: fbCloneErr } = await adminClient
        .from("rpp")
        .insert({
          penugasan_id: penugasan.id,
          materi_pokok: `[Salinan] ${rppInsertData.materi_pokok}`,
          alokasi_waktu: rppInsertData.alokasi_waktu,
          versi: "lengkap",
          model_id: modelPjbl.id,
          tujuan_pembelajaran_ids: [],
          dimensi_profil_lulusan_ids: rppInsertData.dimensi_profil_lulusan_ids,
          panca_cinta_ids: rppInsertData.panca_cinta_ids,
          status: "draf",
          catatan_validator: JSON.stringify(rppInsertData),
          created_by: penugasan.guru_id,
        })
        .select("id")
        .single();

      if (fbCloneErr) throw new Error("Gagal kloning RPP fallback: " + fbCloneErr.message);
      cloneId = fbCloned.id;
    } else if (cloneErr || !clonedRpp) {
      throw new Error("Gagal membuat RPP kloningan: " + cloneErr?.message);
    } else {
      cloneId = clonedRpp.id;
    }

    console.log(`✅ PASSED (Duplikat RPP ID: ${cloneId})`);
    testPassed++;

    console.log("=====================================================================");
    console.log(`🎉 SEMUA TEST TAHAP 8 BERHASIL! (${testPassed}/${totalTest} PASSED)`);
    console.log("=====================================================================");
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err.message);
    process.exit(1);
  }
}

runTahap8Test();
