import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\s]+)/)[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\s]+)/)[1];
const supabase = createClient(url, key);

async function seedCp() {
  console.log("Seeding Capaian Pembelajaran Fase D...");

  const { data: mapels, error: mErr } = await supabase.from("mapel").select("id, nama, kode");
  if (mErr) throw mErr;

  const cpByCode = {
    QH: [
      {
        elemen: "Al-Qur'an",
        deskripsi_cp: "Peserta didik mampu memahami dan menganalisis hukum bacaan mad, mad lazim, hukum nun sukun, mim sukun serta menghayati nilai-nilai keagungan Al-Qur'an dan menerapkannya dalam tartil tilawah serta kehidupan beragama sehari-hari.",
        sumber_regulasi: "KMA 1503/2025 - Fase D",
      },
      {
        elemen: "Hadis",
        deskripsi_cp: "Peserta didik mampu membaca, memahami makna tekstual dan kontekstual hadis tentang keikhlasan beramal, toleransi, dan persaudaraan, serta menjadikannya pedoman bersikap luhur dalam pergaulan bermasyarakat.",
        sumber_regulasi: "KMA 1503/2025 - Fase D",
      },
    ],
    AA: [
      {
        elemen: "Akidah",
        deskripsi_cp: "Peserta didik mampu menganalisis sifat-sifat wajib, mustahil, dan jaiz bagi Allah SWT, menghayati asmaul husna, serta memperkokoh tauhid sebagai landasan keteguhan iman dan integritas moral.",
        sumber_regulasi: "KMA 1503/2025 - Fase D",
      },
      {
        elemen: "Akhlak",
        deskripsi_cp: "Peserta didik mampu memahami hakikat akhlak terpuji (ikhlas, tawakal, ikhtiar, sabar, syukur), membiasakannya dalam interaksi harian, serta menghindari akhlak tercela (riya, hasad, nifak, dendam).",
        sumber_regulasi: "KMA 1503/2025 - Fase D",
      },
      {
        elemen: "Adab",
        deskripsi_cp: "Peserta didik mampu mempraktikkan adab mulia kepada orang tua, guru, sesama teman, lingkungan alam, dan media digital sesuai tuntunan syariat Islam.",
        sumber_regulasi: "KMA 1503/2025 - Fase D",
      },
      {
        elemen: "Kisah Keteladanan",
        deskripsi_cp: "Peserta didik mampu meneladani keteguhan iman dan keluhuran akhlak Ulul Azmi, sahabat Nabi, dan ulama Nusantara dalam menghadapi tantangan zaman.",
        sumber_regulasi: "KMA 1503/2025 - Fase D",
      },
    ],
    FIKIH: [
      {
        elemen: "Fikih Ibadah",
        deskripsi_cp: "Peserta didik mampu menganalisis tata cara thaharah, salat fardhu dan sunnah, sujud sahwi, zakat, puasa, serta haji dan umrah secara shahih dan khusyuk.",
        sumber_regulasi: "KMA 1503/2025 - Fase D",
      },
      {
        elemen: "Fikih Muamalah",
        deskripsi_cp: "Peserta didik mampu memahami prinsip keadilan dan kejujuran dalam transaksi jual beli, pinjam meminjam, konsumsi makanan/minuman halal-thayyib, dan penyembelihan hewan.",
        sumber_regulasi: "KMA 1503/2025 - Fase D",
      },
    ],
    SKI: [
      {
        elemen: "Periode Khulafaur Rasyidin & Daulah Islam",
        deskripsi_cp: "Peserta didik mampu menganalisis strategi kepemimpinan Khulafaur Rasyidin, Daulah Umayyah, dan Daulah Abbasiyah dalam pengembangan peradaban dan ilmu pengetahuan.",
        sumber_regulasi: "KMA 1503/2025 - Fase D",
      },
      {
        elemen: "Tradisi Islam Nusantara",
        deskripsi_cp: "Peserta didik mampu menghayati kearifan dakwah Walisongo dan ulama nusantara serta melestarikan tradisi keislaman yang moderat dan toleran di Indonesia.",
        sumber_regulasi: "KMA 1503/2025 - Fase D",
      },
    ],
    ARAB: [
      {
        elemen: "Menyimak & Berbicara",
        deskripsi_cp: "Peserta didik mampu merespons wacana lisan, berdialog sederhana tentang identitas diri, madrasah, hobi, dan lingkungan sekitar menggunakan kaidah tata bahasa Arab dasar.",
        sumber_regulasi: "KMA 1503/2025 - Fase D",
      },
      {
        elemen: "Membaca & Menulis",
        deskripsi_cp: "Peserta didik mampu memahami teks naratif dan deskriptif bahasa Arab sederhana serta memproduksi karangan terbimbing dengan struktur tarkib yang benar.",
        sumber_regulasi: "KMA 1503/2025 - Fase D",
      },
    ],
    BIND: [
      {
        elemen: "Menyimak",
        deskripsi_cp: "Peserta didik mampu mengevaluasi gagasan, perasaan, dan pesan dari berbagai tipe teks lisan (puisi, drama, ceramah, berita) dengan kritis.",
        sumber_regulasi: "BSKAP 032/H/KR/2024 - Fase D",
      },
      {
        elemen: "Membaca dan Memirsa",
        deskripsi_cp: "Peserta didik mampu memahami makna tersurat dan tersirat serta menilai akurasi informasi dari teks fiksi dan teks nonfiksi.",
        sumber_regulasi: "BSKAP 032/H/KR/2024 - Fase D",
      },
      {
        elemen: "Berbicara dan Mempresentasikan",
        deskripsi_cp: "Peserta didik mampu menyampaikan ide dan argumen secara logis, runtut, santun, dan percaya diri dalam diskusi kelompok maupun forum.",
        sumber_regulasi: "BSKAP 032/H/KR/2024 - Fase D",
      },
      {
        elemen: "Menulis",
        deskripsi_cp: "Peserta didik mampu menulis gagasan, pengalaman, dan penelitian sederhana dalam bentuk teks deskripsi, narasi, eksposisi, dan laporan dengan ejaan baku.",
        sumber_regulasi: "BSKAP 032/H/KR/2024 - Fase D",
      },
    ],
    MAT: [
      {
        elemen: "Bilangan",
        deskripsi_cp: "Peserta didik mampu membaca, menulis, dan membandingkan bilangan bulat, bilangan rasional, dan bilangan berpangkat serta menggunakannya dalam menyelesaikan masalah kontekstual.",
        sumber_regulasi: "BSKAP 032/H/KR/2024 - Fase D",
      },
      {
        elemen: "Aljabar",
        deskripsi_cp: "Peserta didik mampu menyajikan, menyederhanakan, dan menyelesaikan sistem persamaan linear satu variabel dan dua variabel serta fungsi linear.",
        sumber_regulasi: "BSKAP 032/H/KR/2024 - Fase D",
      },
      {
        elemen: "Geometri",
        deskripsi_cp: "Peserta didik mampu membuktikan dan menerapkan teorema Pythagoras, menghitung luas dan volume bangun ruang sisi datar dan sisi lengkung.",
        sumber_regulasi: "BSKAP 032/H/KR/2024 - Fase D",
      },
    ],
    IPA: [
      {
        elemen: "Pemahaman IPA",
        deskripsi_cp: "Peserta didik mampu mengidentifikasi sistem organisasi kehidupan, ekologi, zat dan perubahannya, gaya dan gerak, serta tata surya dengan mengintegrasikan nilai keteraturan ciptaan Ilahi.",
        sumber_regulasi: "BSKAP 032/H/KR/2024 - Fase D",
      },
      {
        elemen: "Keterampilan Proses",
        deskripsi_cp: "Peserta didik mampu mengamati, merumuskan hipotesis, merancang percobaan, mengumpulkan dan menganalisis data, serta mengomunikasikan kesimpulan secara ilmiah dan objektif.",
        sumber_regulasi: "BSKAP 032/H/KR/2024 - Fase D",
      },
    ],
  };

  const recordsToInsert = [];
  for (const mapel of mapels) {
    const list = cpByCode[mapel.kode] || [
      {
        elemen: "Pemahaman Materi",
        deskripsi_cp: `Peserta didik mampu memahami konsep fundamental dalam mata pelajaran ${mapel.nama} pada Fase D (Kelas VII-IX) dan mengaitkannya dengan kehidupan sehari-hari.`,
        sumber_regulasi: "Standar Kurikulum Madrasah - Fase D",
      },
      {
        elemen: "Keterampilan & Penerapan",
        deskripsi_cp: `Peserta didik mampu menerapkan dan mengkreasi solusi praktis berbasis kompetensi ${mapel.nama} untuk memecahkan permasalahan nyata dengan landasan akhlak mulia.`,
        sumber_regulasi: "Standar Kurikulum Madrasah - Fase D",
      },
    ];

    for (const item of list) {
      recordsToInsert.push({
        mapel_id: mapel.id,
        fase: "D",
        elemen: item.elemen,
        deskripsi_cp: item.deskripsi_cp,
        sumber_regulasi: item.sumber_regulasi,
      });
    }
  }

  // Cek apakah sudah ada CP
  const { count } = await supabase.from("capaian_pembelajaran").select("*", { count: "exact", head: true });
  if (count && count > 0) {
    console.log(`Sudah ada ${count} data CP.`);
    return;
  }

  const { error } = await supabase.from("capaian_pembelajaran").insert(recordsToInsert);
  if (error) {
    console.error("Gagal seed CP:", error.message);
  } else {
    console.log(`Berhasil menambahkan ${recordsToInsert.length} data CP Fase D.`);
  }
}

seedCp().catch(console.error);
