// src/lib/rpp-model-pedagogi.ts
// Riset Komprehensif 6 Model Pembelajaran Mendalam (Deep Learning) & Sintaks Operasional RPP KBC
// Sesuai Panduan Pembelajaran dan Asesmen (PPA) Kemenag, KMA 1503/2025, dan Kepdirjen Pendis 6077/2025

import type { PengalamanBelajar } from "@/types/database";
import type { RppLangkahPayload } from "@/app/(app)/modul-ajar/actions";

export type ModelKode =
  | "pjbl"
  | "pbl"
  | "discovery"
  | "inquiry"
  | "cooperative"
  | "lokr"
  | "custom";

export type ModeDistribusiPertemuan =
  | "utuh_per_pertemuan"
  | "berjenjang_lintas_pertemuan";

export interface SintaksRisetContext {
  materi: string;
  topik: string;
  mapel: string;
  tingkatKelas?: number | string;
  pertemuanKe: number;
  totalPertemuan: number;
}

export interface SintaksRisetItem {
  urutan: number;
  nama_sintaks: string;
  nama_inggris: string;
  pengalaman_belajar: PengalamanBelajar;
  prinsip_default: Array<"berkesadaran" | "bermakna" | "menggembirakan">;
  bobot_durasi: number; // Bobot proporsi waktu di dalam Kegiatan Inti
  fokus_sintaks: string;
  indikator_keterlaksanaan: string;
  buildAktivitasGuru: (ctx: SintaksRisetContext) => string;
  buildAktivitasMurid: (ctx: SintaksRisetContext) => string;
  buildAksiKbc: (ctx: SintaksRisetContext, pcNama: string) => string;
}

export interface FasePengalaman3MInfo {
  judul_fase: string;
  deskripsi_fase: string;
  urutan_sintaks: number[];
}

export interface KomponenKhasModelItem {
  label: string;
  icon_key: "target" | "langkah" | "output";
  getNilaiKontekstual: (materi: string, mapel: string) => string;
}

export interface ModelPedagogiSpec {
  kode: ModelKode;
  nama_resmi: string;
  singkatan: string;
  jumlah_sintaks: number;
  pendekatan_label: string;
  format_pengalaman_label: string;
  ringkasan_riset: string;
  karakteristik_utama: string;
  rekomendasi_metode: string[];
  struktur_3m: {
    memahami: FasePengalaman3MInfo;
    mengaplikasi: FasePengalaman3MInfo;
    merefleksi: FasePengalaman3MInfo;
  };
  komponen_khas: KomponenKhasModelItem[];
  sintaks_list: SintaksRisetItem[];
  buildKegiatanAwal: (ctx: SintaksRisetContext) => {
    aktivitas_guru: string;
    aktivitas_murid: string;
    aksi_kbc: string;
  };
  buildKegiatanPenutup: (ctx: SintaksRisetContext) => {
    aktivitas_guru: string;
    aktivitas_murid: string;
    aksi_kbc: string;
  };
  buildLkpdKhusus: (materi: string, mapel: string, kelasRomawi: string) => string;
}

/**
 * Mengidentifikasi kode model pembelajaran berdasarkan nama model di database
 */
export function detectModelKode(namaModel?: string | null): ModelKode {
  if (!namaModel) return "pjbl";
  const lower = namaModel.toLowerCase();
  if (lower.includes("project") || lower.includes("pjbl")) return "pjbl";
  if (lower.includes("problem") || lower.includes("pbl")) return "pbl";
  if (lower.includes("discovery")) return "discovery";
  if (lower.includes("inquiry") || lower.includes("inkuiri")) return "inquiry";
  if (lower.includes("cooperative") || lower.includes("kooperatif")) return "cooperative";
  if (lower.includes("lok-r") || lower.includes("lokr") || lower.includes("literasi")) return "lokr";
  return "custom";
}

// ============================================================================
// DATABASE RISET 6 MODEL PEMBELAJARAN MENDALAM (DEEP LEARNING & KBC)
// ============================================================================

export const MODEL_PEDAGOGI_SPECS: Record<Exclude<ModelKode, "custom">, ModelPedagogiSpec> = {
  // --------------------------------------------------------------------------
  // 1. PROJECT BASED LEARNING (PjBL) — 6 SINTAKS (The George Lucas / Buck Institute)
  // --------------------------------------------------------------------------
  pjbl: {
    kode: "pjbl",
    nama_resmi: "Project Based Learning (PjBL)",
    singkatan: "PjBL",
    jumlah_sintaks: 6,
    pendekatan_label: "Pembelajaran Berbasis Proyek & Karya Autentik (6 Sintaks)",
    format_pengalaman_label: "Format Siklus Proyek (Project-Based Learning Experience)",
    ringkasan_riset:
      "Model PjBL (Lucas Educational Research / BIE) mengorganisasikan pengalaman belajar di sekitar pembuatan proyek/produk nyata secara kolaboratif dalam jangka waktu terukur untuk menjawab pertanyaan esensial yang kontekstual.",
    karakteristik_utama:
      "Berpusat pada pertanyaan mendasar (driving question), investigasi konstruktif, otonomi murid dalam merancang jadwal & produk, serta pameran unjuk karya autentik.",
    rekomendasi_metode: [
      "Diskusi Kelompok",
      "Eksperimen / Praktik",
      "Presentasi Murid",
      "Refleksi Terbimbing",
    ],
    struktur_3m: {
      memahami: {
        judul_fase: "Tahap I: Memahami — Konseptualisasi & Perancangan Proyek",
        deskripsi_fase:
          "Murid menggali urgensi konsep melalui pertanyaan mendasar (Sintaks 1) dan menyusun desain perencanaan produk/proyek secara kolaboratif (Sintaks 2).",
        urutan_sintaks: [1, 2],
      },
      mengaplikasi: {
        judul_fase: "Tahap II: Mengaplikasi — Penjadwalan, Produksi & Uji Karya",
        deskripsi_fase:
          "Murid menyepakati lini masa kerja (Sintaks 3), mengeksekusi pembuatan produk dengan monitoring guru (Sintaks 4), dan menguji/mempresentasikan kelayakan karya (Sintaks 5).",
        urutan_sintaks: [3, 4, 5],
      },
      merefleksi: {
        judul_fase: "Tahap III: Merefleksi — Evaluasi Pengalaman & Makna Proyek",
        deskripsi_fase:
          "Murid bersama guru mengevaluasi proses kreatif pengerjaan proyek, kendala yang berhasil diatasi, serta memaknai nilai Panca Cinta dari karya (Sintaks 6).",
        urutan_sintaks: [6],
      },
    },
    komponen_khas: [
      {
        label: "Pertanyaan Mendasar (Essential Question)",
        icon_key: "target",
        getNilaiKontekstual: (materi, mapel) =>
          `Bagaimana kita dapat merancang karya nyata yang kreatif dan bermanfaat untuk mengaplikasikan konsep "${materi}" pada mata pelajaran ${mapel} di lingkungan madrasah/masyarakat?`,
      },
      {
        label: "Fokus Aktivitas Proyek & Kolaborasi",
        icon_key: "langkah",
        getNilaiKontekstual: (materi) =>
          `Perancangan desain produk, penyusunan jadwal kerja (timeline), pembuatan karya kolaboratif tentang ${materi}, dan pameran hasil proyek.`,
      },
      {
        label: "Tagihan Luaran Produk (Project Artifact)",
        icon_key: "output",
        getNilaiKontekstual: (materi) =>
          `Produk karya autentik (infografis kreatif / media kampanye / prototipe / portofolio unjuk kerja) terkait ${materi} yang teruji sesuai rubrik.`,
      },
    ],
    sintaks_list: [
      {
        urutan: 1,
        nama_sintaks: "Penentuan Pertanyaan Mendasar",
        nama_inggris: "Start with the Essential Question",
        pengalaman_belajar: "memahami",
        prinsip_default: ["berkesadaran", "bermakna"],
        bobot_durasi: 15,
        fokus_sintaks:
          "Memantik rasa ingin tahu murid melalui fenomena autentik dan merumuskan pertanyaan esensial (driving question) sebagai pijakan proyek.",
        indikator_keterlaksanaan:
          "Terdapat penyajian fenomena kontekstual dan perumusan pertanyaan mendasar yang menantang murid membuat proyek.",
        buildAktivitasGuru: ({ materi, mapel }) =>
          `Menampilkan tayangan visual/fenomena nyata terkait "${materi}" pada pembelajaran ${mapel}, kemudian melontarkan pertanyaan mendasar (essential question) yang memantik nalar kritis murid tentang bagaimana konsep tersebut dapat diwujudkan menjadi sebuah karya/proyek bermanfaat.`,
        buildAktivitasMurid: ({ materi }) =>
          `Mengamati fenomena kontekstual dengan penuh kesadaran (mindful), mengidentifikasi keterkaitan konsep "${materi}" dengan kehidupan nyata, serta mendiskusikan jawaban awal atas pertanyaan mendasar sebagai landasan proyek.`,
        buildAksiKbc: ({ materi }, pcNama) =>
          `Mengajak murid mengawali eksplorasi proyek "${materi}" dengan niat tulus dan semangat ${pcNama} agar karya yang dibuat membawa kemaslahatan.`,
      },
      {
        urutan: 2,
        nama_sintaks: "Mendesain Perencanaan Proyek",
        nama_inggris: "Design a Plan for the Project",
        pengalaman_belajar: "memahami",
        prinsip_default: ["bermakna", "menggembirakan"],
        bobot_durasi: 15,
        fokus_sintaks:
          "Mengorganisasikan kelompok proyek, merumuskan spesifikasi produk/karya, membagi peran anggota, dan mendata kebutuhan alat/sumber.",
        indikator_keterlaksanaan:
          "Murid bekerja dalam kelompok merancang desain produk, spesifikasi karya, serta pembagian tugas pada LKPD Proyek.",
        buildAktivitasGuru: ({ materi }) =>
          `Memfasilitasi pembentukan kelompok proyek secara heterogen (4–5 murid), membagikan LKPD Perencanaan Proyek "${materi}", serta membimbing murid menentukan jenis produk/karya, spesifikasi kriteria, pembagian peran, dan sumber belajar/bahan yang diperlukan.`,
        buildAktivitasMurid: ({ materi }) =>
          `Berdiskusi secara kolaboratif dan demokratis dalam kelompok untuk menetapkan ide produk/proyek tentang "${materi}", merancang sketsa/kerangka karya pada LKPD, serta membagi tanggung jawab setiap anggota tim.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Menanamkan nilai ${pcNama} melalui sikap saling menghargai ide teman dan musyawarah santun saat merancang desain proyek.`,
      },
      {
        urutan: 3,
        nama_sintaks: "Menyusun Jadwal Pembuatan Proyek",
        nama_inggris: "Create a Schedule",
        pengalaman_belajar: "mengaplikasi",
        prinsip_default: ["berkesadaran", "bermakna"],
        bobot_durasi: 10,
        fokus_sintaks:
          "Menyusun lini masa (timeline) tahapan pengerjaan proyek dan menyepakati tenggat waktu (milestone) penyelesaian produk.",
        indikator_keterlaksanaan:
          "Tersusun jadwal tahapan kerja proyek yang realistis dan disepakati bersama antara guru dan kelompok murid.",
        buildAktivitasGuru: ({ materi }) =>
          `Membimbing setiap kelompok menyusun lini masa (timeline) tahapan pengerjaan proyek "${materi}" secara terukur, menetapkan alokasi waktu per tahap (persiapan, eksekusi, finalisasi), dan menyepakati batas waktu penyelesaian.`,
        buildAktivitasMurid: ({ materi }) =>
          `Menyusun jadwal tahapan pembuatan proyek "${materi}" pada tabel kontrol LKPD, menyepakati target capaian waktu (milestone) tiap tahapan, dan berkomitmen menjaga kedisiplinan kerja tim.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Menguatkan karakter disiplin, amanah, dan menghargai waktu sebagai wujud nyata pengamalan ${pcNama}.`,
      },
      {
        urutan: 4,
        nama_sintaks: "Memonitor Keaktifan dan Perkembangan Proyek",
        nama_inggris: "Monitor the Students and the Progress of the Project",
        pengalaman_belajar: "mengaplikasi",
        prinsip_default: ["bermakna", "menggembirakan"],
        bobot_durasi: 30,
        fokus_sintaks:
          "Pelaksanaan pembuatan karya/proyek oleh murid secara gotong royong disertai pemantauan dan pendampingan (scaffolding) oleh guru.",
        indikator_keterlaksanaan:
          "Murid aktif memproduksi karya proyek sementara guru berkeliling memonitor progres dan memberikan bimbingan.",
        buildAktivitasGuru: ({ materi }) =>
          `Memonitor keaktifan dan perkembangan pembuatan proyek "${materi}" di setiap kelompok secara berkeliling, memberikan bimbingan bertahap (scaffolding) apabila kelompok menemui kendala teknis/konseptual, serta melakukan asesmen formatif observasi kolaborasi.`,
        buildAktivitasMurid: ({ materi }) =>
          `Melaksanakan pembuatan produk/karya proyek "${materi}" sesuai desain dan jadwal yang telah disusun, mengaplikasikan konsep materi secara akurat dan kreatif, serta mencatat progres maupun solusi atas kendala yang dihadapi tim.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Mendorong murid saling menolong, bekerja sama dengan penuh empati, dan menjaga kerapian/kebersihan ruang belajar sebagai wujud ${pcNama}.`,
      },
      {
        urutan: 5,
        nama_sintaks: "Menguji Hasil (Penilaian Produk)",
        nama_inggris: "Assess the Outcome",
        pengalaman_belajar: "mengaplikasi",
        prinsip_default: ["bermakna", "menggembirakan"],
        bobot_durasi: 15,
        fokus_sintaks:
          "Presentasi/pameran produk proyek, pengujian ketercapaian standar karya, dan penilaian unjuk kerja disertai umpan balik.",
        indikator_keterlaksanaan:
          "Kelompok mempresentasikan/memamerkan produk proyek dan dilakukan pengujian/penilaian berdasarkan kriteria rubrik.",
        buildAktivitasGuru: ({ materi }) =>
          `Memfasilitasi sesi presentasi unjuk karya atau pameran belajar (gallery walk) proyek "${materi}", menguji kelayakan dan ketepatan konsep produk menggunakan rubrik penilaian kinerja, serta memandu tanya jawab konstruktif antarkelompok.`,
        buildAktivitasMurid: ({ materi }) =>
          `Mempresentasikan dan mendemonstrasikan hasil karya proyek "${materi}" di depan kelas dengan percaya diri, menjelaskan konsep keilmuan di balik produk, serta memberikan apresiasi dan saran perbaikan yang santun kepada kelompok lain.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Membimbing murid menyampaikan tanggapan dan apresiasi terhadap karya teman dengan tutur kata yang memuliakan sesuai semangat ${pcNama}.`,
      },
      {
        urutan: 6,
        nama_sintaks: "Evaluasi Pengalaman Belajar",
        nama_inggris: "Evaluate the Experience",
        pengalaman_belajar: "merefleksi",
        prinsip_default: ["berkesadaran", "bermakna"],
        bobot_durasi: 15,
        fokus_sintaks:
          "Refleksi menyeluruh atas proses dan hasil proyek, penguatan konsep oleh guru, serta perumusan tindak lanjut perbaikan.",
        indikator_keterlaksanaan:
          "Murid dan guru melakukan refleksi atas pengalaman pembuatan proyek dan menyimpulkan makna pembelajaran.",
        buildAktivitasGuru: ({ materi }) =>
          `Memandu diskusi reflektif mengenai keseluruhan pengalaman menyelesaikan proyek "${materi}", memberikan umpan balik penguatan konsep esensial, serta membimbing murid mengaitkan hikmah proyek dengan karakter Panca Cinta.`,
        buildAktivitasMurid: ({ materi }) =>
          `Merefleksikan pengalaman belajar selama merancang hingga menguji proyek "${materi}", mengungkapkan tantangan yang berhasil diatasi bersama tim, serta merumuskan kesimpulan dan komitmen pengamalan ilmu dalam keseharian.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Mengajak murid mensyukuri keberhasilan karya bersama dan meneguhkan komitmen mengamalkan nilai ${pcNama} dalam kehidupan nyata.`,
      },
    ],
    buildKegiatanAwal: ({ materi, mapel, pertemuanKe }) => ({
      aktivitas_guru: `Membuka pembelajaran ${mapel} Pertemuan ke-${pertemuanKe} dengan salam hangat dan doa bersama, menyapa kabar murid dengan penuh kasih sayang, melakukan pengondisian kesiapan belajar (mindfulness), mengaitkan apersepsi materi "${materi}" dengan proyek kontekstual, serta menyampaikan tujuan pembelajaran dan tahapan Project Based Learning (PjBL).`,
      aktivitas_murid: `Menjawab salam dan berdoa dengan khusyuk, menyiapkan fisik serta fokus batin, merespons pertanyaan apersepsi guru dengan antusias, serta menyimak tujuan dan gambaran proyek "${materi}" yang akan dikerjakan.`,
      aksi_kbc: "Menyapa setiap murid dengan senyum tulus, mendoakan keberkahan ilmu, dan membangun atmosfer kelas yang ramah serta menggembirakan.",
    }),
    buildKegiatanPenutup: ({ materi, pertemuanKe }) => ({
      aktivitas_guru: `Bersama murid merumuskan simpulan akhir atas capaian proyek "${materi}" pada Pertemuan ke-${pertemuanKe}, memberikan apresiasi atas dedikasi seluruh tim proyek, menyampaikan informasi tindak lanjut pertemuan berikutnya, dan menutup pembelajaran dengan hamdalah serta doa.`,
      aktivitas_murid: `Menyimpulkan poin-poin penting pembelajaran hari ini, menuliskan refleksi singkat komitmen diri, merapikan alat/bahan proyek secara tertib, dan berdoa bersama dengan penuh rasa syukur.`,
      aksi_kbc: "Mengapresiasi kerja keras setiap kelompok tanpa membanding-bandingkan dan mengajak murid bersyukur atas karunia ilmu dari Allah SWT.",
    }),
    buildLkpdKhusus: (materi, mapel, kelas) => `A. LEMBAR KERJA PESERTA DIDIK (LKPD) — BERBASIS PROYEK (PjBL)
Mata Pelajaran: ${mapel} | Kelas: ${kelas} | Topik Proyek: ${materi}

1. Pertanyaan Mendasar (Essential Question):
   - Bagaimana kita merancang karya/produk kreatif untuk menjelaskan dan menerapkan "${materi}" secara nyata di lingkungan madrasah?

2. Perencanaan Desain Proyek (Kelompok 4-5 Murid):
   - Nama Produk / Karya Proyek : ..........................................................
   - Alat, Bahan & Sumber Rujukan: ..........................................................
   - Pembagian Peran Anggota Tim : Ketua, Perancang Materi, Desainer Visual, Penyaji.

3. Jadwal & Lini Masa Kerja (Timeline Proyek):
   - Tahap 1 (Perancangan Konsep & Draf) : ........ menit
   - Tahap 2 (Produksi & Penyelesaian Karya): ........ menit
   - Tahap 3 (Uji Hasil & Pameran Karya)    : ........ menit

4. Lembar Monitoring & Uji Hasil Produk:
   - Catatan Progres & Kendala Tim: ........................................................
   - Umpan Balik Kelompok Lain / Guru: .....................................................

5. Refleksi Pengalaman Proyek & Aksi Panca Cinta:
   - Hikmah keilmuan dan karakter Panca Cinta apa yang tumbuh selama menyelesaikan proyek ${materi} ini?`,
  },

  // --------------------------------------------------------------------------
  // 2. PROBLEM BASED LEARNING (PBL) — 5 SINTAKS (Arends)
  // --------------------------------------------------------------------------
  pbl: {
    kode: "pbl",
    nama_resmi: "Problem Based Learning (PBL)",
    singkatan: "PBL",
    jumlah_sintaks: 5,
    pendekatan_label: "Pembelajaran Berbasis Pemecahan Masalah Kontekstual (5 Sintaks)",
    format_pengalaman_label: "Format Investigasi Masalah (Problem-Based Learning Experience)",
    ringkasan_riset:
      "Model PBL (Richard I. Arends) menghadapkan murid pada permasalahan dunia nyata yang autentik dan terbuka (ill-structured problem) sebagai titik tolak untuk menyelidiki konsep, melatih penalaran kritis (HOTS), dan merumuskan solusi bertanggung jawab.",
    karakteristik_utama:
      "Berfokus pada orientasi studi kasus autentik, kolaborasi investigasi literatur/data, pengembangan argumen solusi, dan evaluasi proses pemecahan masalah.",
    rekomendasi_metode: [
      "Studi Kasus Kontekstual",
      "Diskusi Kelompok",
      "Tanya Jawab Interaktif",
      "Presentasi Murid",
    ],
    struktur_3m: {
      memahami: {
        judul_fase: "Tahap I: Memahami — Orientasi Kasus & Organisasi Tugas Belajar",
        deskripsi_fase:
          "Murid mencermati permasalahan kontekstual yang disajikan (Sintaks 1) dan mengorganisasikan tim serta fokus pertanyaan penyelidikan masalah (Sintaks 2).",
        urutan_sintaks: [1, 2],
      },
      mengaplikasi: {
        judul_fase: "Tahap II: Mengaplikasi — Penyelidikan & Penyajian Solusi Masalah",
        deskripsi_fase:
          "Murid melakukan penyelidikan mendalam mengumpulkan fakta/referensi untuk membedah kasus (Sintaks 3) dan menyusun serta mempresentasikan rumusan solusi (Sintaks 4).",
        urutan_sintaks: [3, 4],
      },
      merefleksi: {
        judul_fase: "Tahap III: Merefleksi — Analisis & Evaluasi Proses Pemecahan Masalah",
        deskripsi_fase:
          "Murid bersama guru mengkaji ulang ketepatan solusi, mengevaluasi alur berpikir kritis yang ditempuh, dan merefleksikan nilai Panca Cinta (Sintaks 5).",
        urutan_sintaks: [5],
      },
    },
    komponen_khas: [
      {
        label: "Skenario Kasus / Masalah Kontekstual",
        icon_key: "target",
        getNilaiKontekstual: (materi, mapel) =>
          `Studi kasus nyata dalam kehidupan sehari-hari remaja/masyarakat yang berkaitan erat dengan permasalahan "${materi}" pada mata pelajaran ${mapel}.`,
      },
      {
        label: "Fokus Penyelidikan & Analisis HOTS",
        icon_key: "langkah",
        getNilaiKontekstual: (materi) =>
          `Identifikasi akar masalah, penelusuran bukti/dalil/konsep "${materi}", analisis sebab-akibat, dan perumusan alternatif solusi.`,
      },
      {
        label: "Rumusan Rekomendasi Solusi",
        icon_key: "output",
        getNilaiKontekstual: (materi) =>
          `Laporan pemecahan masalah / peta konsep solusi kontekstual atas kasus "${materi}" yang dipresentasikan dan dievaluasi di kelas.`,
      },
    ],
    sintaks_list: [
      {
        urutan: 1,
        nama_sintaks: "Orientasi Peserta Didik pada Masalah",
        nama_inggris: "Orient Students to the Problem",
        pengalaman_belajar: "memahami",
        prinsip_default: ["berkesadaran", "bermakna"],
        bobot_durasi: 15,
        fokus_sintaks:
          "Menyajikan kasus/permasalahan kontekstual yang memicu empati, kesadaran, dan keingintahuan murid untuk memecahkannya.",
        indikator_keterlaksanaan:
          "Guru menyajikan kasus autentik (wacana/video/berita) dan murid mengidentifikasi pokok masalah yang harus dipecahkan.",
        buildAktivitasGuru: ({ materi, mapel }) =>
          `Menyajikan studi kasus atau permasalahan kontekstual yang relevan dengan "${materi}" dalam kehidupan sehari-hari pada pembelajaran ${mapel} melalui wacana/tayangan visual, lalu memandu murid mengamati dan mengidentifikasi persoalan utama yang muncul.`,
        buildAktivitasMurid: ({ materi }) =>
          `Menyimak dan mengamati sajian kasus terkait "${materi}" secara berkesadaran, mencatat fakta-fakta penting dari permasalahan tersebut, serta mengemukakan tanggapan awal mengenai mengapa masalah itu penting untuk dipecahkan.`,
        buildAksiKbc: ({ materi }, pcNama) =>
          `Menumbuhkan kepekaan empati dan kepedulian murid terhadap permasalahan nyata seputar "${materi}" sebagai cerminan ${pcNama}.`,
      },
      {
        urutan: 2,
        nama_sintaks: "Mengorganisasikan Peserta Didik untuk Belajar",
        nama_inggris: "Organize Students for Study",
        pengalaman_belajar: "memahami",
        prinsip_default: ["berkesadaran", "menggembirakan"],
        bobot_durasi: 15,
        fokus_sintaks:
          "Membentuk kelompok belajar, membagikan LKPD berbasis masalah, dan membantu murid merumuskan fokus pertanyaan kajian.",
        indikator_keterlaksanaan:
          "Murid terorganisasi dalam kelompok, memahami peran masing-masing, dan merumuskan daftar pertanyaan penyelidikan.",
        buildAktivitasGuru: ({ materi }) =>
          `Membagi murid ke dalam kelompok diskusi heterogen (4–5 orang), membagikan LKPD Pemecahan Masalah "${materi}", serta membimbing murid mendefinisikan tugas belajar dan menyusun rumusan pertanyaan penyelidikan untuk membedah kasus.`,
        buildAktivitasMurid: ({ materi }) =>
          `Bergabung dalam kelompok secara tertib, membagi peran kerja tim, menelaah skenario kasus pada LKPD "${materi}", dan menyepakati daftar pertanyaan kunci yang perlu dicari jawabannya melalui penyelidikan.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Membangun semangat ukhuwah dan saling menghormati dalam pembagian peran kelompok selaras dengan nilai ${pcNama}.`,
      },
      {
        urutan: 3,
        nama_sintaks: "Membimbing Penyelidikan Individu maupun Kelompok",
        nama_inggris: "Assist Independent and Group Investigation",
        pengalaman_belajar: "mengaplikasi",
        prinsip_default: ["bermakna", "berkesadaran"],
        bobot_durasi: 30,
        fokus_sintaks:
          "Mengumpulkan data/informasi/referensi, menganalisis akar masalah secara kritis, dan mendiskusikan alternatif solusi.",
        indikator_keterlaksanaan:
          "Murid aktif menggali informasi dari berbagai sumber dan menganalisis solusi kasus dengan bimbingan guru.",
        buildAktivitasGuru: ({ materi }) =>
          `Mendorong dan mendampingi murid melakukan penyelidikan kelompok maupun individu dengan menelusuri buku teks, dalil/sumber rujukan, atau data pendukung terkait "${materi}", serta memfasilitasi diskusi kritis untuk menganalisis penyebab dan alternatif solusi masalah.`,
        buildAktivitasMurid: ({ materi }) =>
          `Melakukan penyelidikan mendalam dengan mengumpulkan informasi/konsep penting tentang "${materi}" dari berbagai sumber belajar, menganalisis keterkaitan data dengan kasus pada LKPD, serta merumuskan solusi pemecahan masalah yang logis dan bertanggung jawab.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Membiasakan kejujuran ilmiah, ketelitian berpikir, dan musyawarah penuh kasih sayang dalam mencari solusi sebagai wujud ${pcNama}.`,
      },
      {
        urutan: 4,
        nama_sintaks: "Mengembangkan dan Menyajikan Hasil Karya",
        nama_inggris: "Develop and Present Artifacts and Exhibits",
        pengalaman_belajar: "mengaplikasi",
        prinsip_default: ["bermakna", "menggembirakan"],
        bobot_durasi: 20,
        fokus_sintaks:
          "Menyusun laporan/media sajian hasil pemecahan masalah dan mempresentasikannya di depan kelas untuk didiskusikan.",
        indikator_keterlaksanaan:
          "Kelompok menuangkan solusi ke dalam laporan/media sajian dan mempresentasikannya secara komunikatif di kelas.",
        buildAktivitasGuru: ({ materi }) =>
          `Membimbing kelompok mengemas hasil pemecahan masalah "${materi}" ke dalam bentuk laporan terstruktur, peta pikiran, atau poster solusi pada LKPD, kemudian memfasilitasi sesi presentasi dan diskusi silang antarkelompok.`,
        buildAktivitasMurid: ({ materi }) =>
          `Menyusun rumusan solusi kasus "${materi}" secara sistematis dan kreatif, mempresentasikan hasil penyelidikan kelompok di depan kelas dengan argumentasi yang jelas, serta menanggapi pertanyaan teman secara santun.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Menumbuhkan adab berbicara yang santun dan menghargai perbedaan sudut pandang saat diskusi kelas sebagai pengamalan ${pcNama}.`,
      },
      {
        urutan: 5,
        nama_sintaks: "Menganalisis dan Mengevaluasi Proses Pemecahan Masalah",
        nama_inggris: "Analyze and Evaluate the Problem-Solving Process",
        pengalaman_belajar: "merefleksi",
        prinsip_default: ["berkesadaran", "bermakna"],
        bobot_durasi: 20,
        fokus_sintaks:
          "Mengevaluasi ketepatan solusi yang diajukan kelompok, meluruskan miskonsepsi, dan merefleksikan proses berpikir kritis.",
        indikator_keterlaksanaan:
          "Guru dan murid bersama-sama mengevaluasi kelayakan solusi dan merefleksikan pembelajaran dari kasus yang dibahas.",
        buildAktivitasGuru: ({ materi }) =>
          `Memandu murid menganalisis dan mengevaluasi ketepatan solusi yang telah disajikan tiap kelompok terkait "${materi}", memberikan konfirmasi keilmuan untuk meluruskan miskonsepsi, serta memfasilitasi refleksi nilai Panca Cinta dari pemecahan masalah tersebut.`,
        buildAktivitasMurid: ({ materi }) =>
          `Mengevaluasi kelebihan dan ketepatan solusi masalah "${materi}" yang telah dirumuskan, merefleksikan proses berpikir kritis yang telah dilalui bersama kelompok, serta menyimpulkan hikmah pembelajaran bagi kehidupan sehari-hari.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Mengajak murid merefleksikan bahwa setiap persoalan hidup harus diselesaikan dengan ilmu, kebijaksanaan, dan semangat ${pcNama}.`,
      },
    ],
    buildKegiatanAwal: ({ materi, mapel, pertemuanKe }) => ({
      aktivitas_guru: `Membuka pembelajaran ${mapel} Pertemuan ke-${pertemuanKe} dengan salam, doa bersama, dan sapaan penuh perhatian (mindful check-in), melakukan apersepsi dengan mengaitkan fenomena aktual di sekitar murid terhadap materi "${materi}", serta menyampaikan tujuan pembelajaran dan alur Problem Based Learning (PBL).`,
      aktivitas_murid: `Menjawab salam dan berdoa dengan khusyuk, menyiapkan kesiapan diri, menyimak apersepsi kontekstual dari guru, serta memahami tujuan pembelajaran dan tahapan pemecahan masalah yang akan dilaksanakan.`,
      aksi_kbc: "Menghadirkan suasana kelas yang penuh empati, aman secara psikologis, dan memotivasi murid untuk berani berpikir kritis.",
    }),
    buildKegiatanPenutup: ({ materi, pertemuanKe }) => ({
      aktivitas_guru: `Memfasilitasi murid menyimpulkan intisari konsep dan solusi atas permasalahan "${materi}" pada Pertemuan ke-${pertemuanKe}, memberikan umpan balik apresiatif atas keaktifan bernalar kritis, menyampaikan agenda pertemuan selanjutnya, dan menutup dengan doa.`,
      aktivitas_murid: `Merumuskan kesimpulan bersama tentang "${materi}", mengisi refleksi singkat pencapaian diri, serta menutup kegiatan belajar dengan mengucap hamdalah dan doa bersama.`,
      aksi_kbc: "Mengajak murid bersyukur atas nikmat akal pikiran dan ilmu pengetahuan serta berkomitmen menjadi pembawa solusi di lingkungan madrasah.",
    }),
    buildLkpdKhusus: (materi, mapel, kelas) => `A. LEMBAR KERJA PESERTA DIDIK (LKPD) — PEMECAHAN MASALAH (PBL)
Mata Pelajaran: ${mapel} | Kelas: ${kelas} | Topik Kasus: ${materi}

1. Orientasi Studi Kasus Kontekstual:
   - Bacalah dan cermati wacana kasus nyata terkait "${materi}" yang disajikan pada lembar stimulus!
   - Fakta-fakta penting yang ditemukan dalam kasus: .......................................

2. Rumusan Masalah & Pertanyaan Penyelidikan:
   - Apa permasalahan utama yang harus dipecahkan dari kasus "${materi}" di atas?
   - Pertanyaan kajian kelompok: 1) .......................... 2) ..........................

3. Hasil Penyelidikan & Analisis Konsep:
   - Konsep/dalil/teori pendukung dari sumber belajar: .....................................
   - Analisis sebab-akibat permasalahan: ...................................................

4. Pengembangan Solusi & Rekomendasi Kelompok:
   - Alternatif solusi yang diusulkan kelompok: ............................................
   - Alasan pemilihan solusi terbaik: ......................................................

5. Evaluasi & Refleksi Nilai Panca Cinta:
   - Pelajaran berharga dan aksi nyata Panca Cinta apa yang dapat kita terapkan dari pemecahan kasus ${materi} ini?`,
  },

  // --------------------------------------------------------------------------
  // 3. DISCOVERY LEARNING — 6 SINTAKS (Jerome Bruner)
  // --------------------------------------------------------------------------
  discovery: {
    kode: "discovery",
    nama_resmi: "Discovery Learning",
    singkatan: "Discovery",
    jumlah_sintaks: 6,
    pendekatan_label: "Pembelajaran Penyingkapan & Penemuan Konsep Terbimbing (6 Sintaks)",
    format_pengalaman_label: "Format Penyingkapan Konsep (Guided Discovery Experience)",
    ringkasan_riset:
      "Model Discovery Learning (Jerome Bruner) mengarahkan murid untuk menemukan sendiri konsep, arti, dan hubungan melalui proses intuitif-analitis (Stimulasi → Identifikasi Masalah → Pengumpulan Data → Pengolahan Data → Pembuktian → Generalisasi) tanpa disajikan dalam bentuk final di awal.",
    karakteristik_utama:
      "Konsep tidak diberikan secara langsung di awal; murid mengamati fenomena/contoh, mengumpulkan dan mengolah data pola, memverifikasi hipotesis, hingga menarik simpulan kaidah/konsep.",
    rekomendasi_metode: [
      "Eksperimen / Praktik",
      "Diskusi Kelompok",
      "Tanya Jawab Interaktif",
      "Demonstrasi",
    ],
    struktur_3m: {
      memahami: {
        judul_fase: "Tahap I: Memahami — Stimulasi Fenomena & Identifikasi Hipotesis",
        deskripsi_fase:
          "Murid mengamati rangsangan/fenomena pemantik (Sintaks 1: Stimulation) dan mengidentifikasi masalah serta merumuskan dugaan/hipotesis awal (Sintaks 2: Problem Statement).",
        urutan_sintaks: [1, 2],
      },
      mengaplikasi: {
        judul_fase: "Tahap II: Mengaplikasi — Eksplorasi Data, Olah Data & Pembuktian",
        deskripsi_fase:
          "Murid mengumpulkan data/fakta eksploratif (Sintaks 3: Data Collection), mengolah & mengklasifikasi pola data (Sintaks 4: Data Processing), serta membuktikan kebenaran hipotesis (Sintaks 5: Verification).",
        urutan_sintaks: [3, 4, 5],
      },
      merefleksi: {
        judul_fase: "Tahap III: Merefleksi — Generalisasi Konsep & Refleksi Hikmah",
        deskripsi_fase:
          "Murid menarik kesimpulan/kaidah umum dari konsep yang berhasil ditemukan secara mandiri dan merefleksikan nilai Panca Cinta (Sintaks 6: Generalization).",
        urutan_sintaks: [6],
      },
    },
    komponen_khas: [
      {
        label: "Stimulus Fenomena & Hipotesis Awal",
        icon_key: "target",
        getNilaiKontekstual: (materi, mapel) =>
          `Penyajian contoh/fenomena menarik tentang "${materi}" (${mapel}) yang memantik rasa ingin tahu dan dugaan sementara (hipotesis) murid.`,
      },
      {
        label: "Eksplorasi, Olah Data & Verifikasi",
        icon_key: "langkah",
        getNilaiKontekstual: (materi) =>
          `Pengumpulan fakta/contoh "${materi}", klasifikasi & analisis pola data pada LKPD, serta pembuktian kebenaran hipotesis terhadap teori sahih.`,
      },
      {
        label: "Generalisasi Konsep / Kaidah Temuan",
        icon_key: "output",
        getNilaiKontekstual: (materi) =>
          `Rumusan prinsip/pengertian/kaidah utuh tentang "${materi}" yang berhasil ditemukan dan disimpulkan sendiri oleh murid.`,
      },
    ],
    sintaks_list: [
      {
        urutan: 1,
        nama_sintaks: "Pemberian Rangsangan (Stimulation)",
        nama_inggris: "Stimulation",
        pengalaman_belajar: "memahami",
        prinsip_default: ["berkesadaran", "menggembirakan"],
        bobot_durasi: 15,
        fokus_sintaks:
          "Menyajikan fenomena, ilustrasi, demonstrasi, atau contoh menarik untuk menimbulkan rasa ingin tahu (curiosity) tanpa langsung memberi tahu rumus/konsep akhir.",
        indikator_keterlaksanaan:
          "Guru menampilkan stimulus/fenomena dan murid mengamati dengan antusias hingga muncul rasa ingin tahu.",
        buildAktivitasGuru: ({ materi, mapel }) =>
          `Memberikan rangsangan (stimulation) berupa tayangan fenomena, ilustrasi contoh nyata, atau demonstrasi menarik terkait "${materi}" pada pembelajaran ${mapel} tanpa menyampaikan definisi final terlebih dahulu, guna memancing rasa ingin tahu dan fokus pengamatan murid.`,
        buildAktivitasMurid: ({ materi }) =>
          `Mengamati stimulus/fenomena terkait "${materi}" dengan penuh perhatian dan rasa ingin tahu (curiosity), mencermati karakteristik contoh yang ditampilkan, serta mengemukakan temuan pengamatan awal.`,
        buildAksiKbc: ({ materi }, pcNama) =>
          `Mengajak murid mengagumi keteraturan ilmu dan fenomena "${materi}" sebagai pintu menumbuhkan ${pcNama}.`,
      },
      {
        urutan: 2,
        nama_sintaks: "Identifikasi Masalah (Problem Statement)",
        nama_inggris: "Problem Statement",
        pengalaman_belajar: "memahami",
        prinsip_default: ["berkesadaran", "bermakna"],
        bobot_durasi: 15,
        fokus_sintaks:
          "Memberi kesempatan murid mengidentifikasi pertanyaan-pertanyaan konseptual dari stimulus dan menyusun hipotesis (jawaban sementara).",
        indikator_keterlaksanaan:
          "Murid merumuskan pertanyaan eksploratif dan menuliskan hipotesis (dugaan sementara) pada LKPD.",
        buildAktivitasGuru: ({ materi }) =>
          `Memberikan kesempatan kepada murid dalam kelompok untuk mengidentifikasi sebanyak mungkin pertanyaan terkait fenomena "${materi}" yang diamati, lalu membimbing mereka memilih dan merumuskannya menjadi pertanyaan masalah beserta hipotesis (dugaan sementara).`,
        buildAktivitasMurid: ({ materi }) =>
          `Mengajukan pertanyaan-pertanyaan kritis dari hasil pengamatan stimulus "${materi}", mendiskusikannya dalam kelompok, dan menuliskan rumusan masalah serta hipotesis awal pada LKPD Penemuan.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Menghargai keberanian setiap murid dalam bertanya dan berpendapat dengan santun sesuai nilai ${pcNama}.`,
      },
      {
        urutan: 3,
        nama_sintaks: "Pengumpulan Data (Data Collection)",
        nama_inggris: "Data Collection",
        pengalaman_belajar: "mengaplikasi",
        prinsip_default: ["bermakna", "menggembirakan"],
        bobot_durasi: 20,
        fokus_sintaks:
          "Mengeksplorasi berbagai sumber belajar, mengamati objek/kasus, atau melakukan percobaan untuk mengumpulkan informasi relevan.",
        indikator_keterlaksanaan:
          "Murid secara aktif mengumpulkan data, contoh, atau informasi dari bahan bacaan/pengamatan untuk menjawab hipotesis.",
        buildAktivitasGuru: ({ materi }) =>
          `Memfasilitasi murid mengumpulkan informasi/data yang relevan sebanyak-banyaknya mengenai "${materi}" melalui membaca literatur buku teks, mengamati objek/contoh tambahan, atau melakukan eksplorasi terarah pada LKPD.`,
        buildAktivitasMurid: ({ materi }) =>
          `Secara aktif dan kolaboratif mengumpulkan data, fakta, serta contoh-contoh penerapan "${materi}" dari buku sumber maupun lembar eksplorasi untuk menguji kebenaran hipotesis awal kelompok.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Menumbuhkan ketekunan, kerja sama yang harmonis, dan semangat mencari kebenaran ilmu sebagai wujud ${pcNama}.`,
      },
      {
        urutan: 4,
        nama_sintaks: "Pengolahan Data (Data Processing)",
        nama_inggris: "Data Processing",
        pengalaman_belajar: "mengaplikasi",
        prinsip_default: ["bermakna", "berkesadaran"],
        bobot_durasi: 20,
        fokus_sintaks:
          "Mengklasifikasikan, menabulasi, membandingkan, dan menafsirkan data yang telah terkumpul untuk menemukan pola/konsep.",
        indikator_keterlaksanaan:
          "Murid mengolah dan menganalisis data pada LKPD hingga menemukan pola atau keterkaitan konsep.",
        buildAktivitasGuru: ({ materi }) =>
          `Membimbing murid dalam kelompok saat mengolah data hasil eksplorasi "${materi}" (mengklasifikasikan ciri/unsur, membandingkan persamaan dan perbedaan, serta mengaitkan fakta-fakta) guna menyingkap pola konsep yang dipelajari.`,
        buildAktivitasMurid: ({ materi }) =>
          `Mengolah, mengelompokkan, dan menganalisis data/informasi tentang "${materi}" yang telah terkumpul melalui diskusi kelompok yang cermat pada tabel olah data LKPD hingga menemukan pola konsepnya.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Melatih kecermatan, kejujuran dalam mengolah fakta, dan saling membantu teman sekelompok memahami materi sesuai ${pcNama}.`,
      },
      {
        urutan: 5,
        nama_sintaks: "Pembuktian (Verification)",
        nama_inggris: "Verification",
        pengalaman_belajar: "mengaplikasi",
        prinsip_default: ["bermakna", "menggembirakan"],
        bobot_durasi: 15,
        fokus_sintaks:
          "Memeriksa secara cermat hasil pengolahan data untuk membuktikan benar atau tidaknya hipotesis awal dan mempresentasikan temuan.",
        indikator_keterlaksanaan:
          "Murid membandingkan hasil olah data dengan hipotesis awal dan literatur, lalu menyajikan hasil pembuktiannya.",
        buildAktivitasGuru: ({ materi }) =>
          `Memandu murid melakukan pemeriksaan cermat (verification) untuk membuktikan apakah hipotesis awal tentang "${materi}" terbukti benar berdasarkan hasil pengolahan data dan rujukan keilmuan, serta memfasilitasi presentasi temuan kelompok.`,
        buildAktivitasMurid: ({ materi }) =>
          `Memverifikasi kesesuaian antara hipotesis awal dengan hasil olah data dan teori pada buku sumber terkait "${materi}", kemudian mempresentasikan hasil penemuan konsep kelompok di depan kelas untuk dikonfirmasi bersama.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Membimbing murid menerima kebenaran ilmiah dengan lapang dada dan mengapresiasi temuan kelompok lain sebagai cerminan ${pcNama}.`,
      },
      {
        urutan: 6,
        nama_sintaks: "Menarik Simpulan/Generalisasi (Generalization)",
        nama_inggris: "Generalization",
        pengalaman_belajar: "merefleksi",
        prinsip_default: ["berkesadaran", "bermakna"],
        bobot_durasi: 15,
        fokus_sintaks:
          "Merumuskan prinsip/kaidah umum (generalisasi) berdasarkan hasil pembuktian konsep dan merefleksikan maknanya.",
        indikator_keterlaksanaan:
          "Murid merumuskan simpulan konsep/kaidah umum secara mandiri dan merefleksikan nilai karakter yang terkandung.",
        buildAktivitasGuru: ({ materi }) =>
          `Membimbing murid merumuskan prinsip atau kaidah umum (generalization) atas konsep "${materi}" yang telah berhasil ditemukan dan dibuktikan, sekaligus memandu refleksi makna spiritual/karakter Panca Cinta dari penemuan tersebut.`,
        buildAktivitasMurid: ({ materi }) =>
          `Menyusun kesimpulan/kaidah umum mengenai "${materi}" dengan kalimat sendiri berdasarkan hasil verifikasi, serta merefleksikan pengalaman menemukan konsep dan cara mengamalkannya dalam kehidupan sehari-hari.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Mengajak murid menghayati bahwa setiap konsep ilmu yang ditemukan semakin menguatkan nilai ${pcNama} dalam diri.`,
      },
    ],
    buildKegiatanAwal: ({ materi, mapel, pertemuanKe }) => ({
      aktivitas_guru: `Membuka pembelajaran ${mapel} Pertemuan ke-${pertemuanKe} dengan salam, doa, dan sapaan kasih sayang, mengondisikan kesiapan belajar (mindfulness), melakukan apersepsi untuk mengaktifkan skemata pengetahuan awal murid tentang "${materi}", serta menyampaikan tujuan pembelajaran dengan model Discovery Learning.`,
      aktivitas_murid: `Menjawab salam dan berdoa dengan khusyuk, memfokuskan perhatian, merespons apersepsi guru, dan bersiap mengikuti petualangan penemuan konsep (discovery) mengenai "${materi}".`,
      aksi_kbc: "Menumbuhkan rasa senang mencari ilmu (Cinta Ilmu) dan kesiapan batin yang tenang sebelum memulai eksplorasi.",
    }),
    buildKegiatanPenutup: ({ materi, pertemuanKe }) => ({
      aktivitas_guru: `Memberikan penguatan akhir terhadap kaidah/konsep "${materi}" yang telah ditemukan murid pada Pertemuan ke-${pertemuanKe}, memandu refleksi kebermaknaan belajar, memberikan apresiasi, menginformasikan materi pertemuan selanjutnya, dan menutup dengan doa.`,
      aktivitas_murid: `Menuliskan poin refleksi atas konsep baru yang ditemukan hari ini, menyimak penguatan guru, dan mengakhiri pembelajaran dengan hamdalah serta doa bersama.`,
      aksi_kbc: "Mengajak murid bersyukur atas kemampuan akal untuk menyingkap ilmu pengetahuan dan mengamalkannya dengan rendah hati.",
    }),
    buildLkpdKhusus: (materi, mapel, kelas) => `A. LEMBAR KERJA PESERTA DIDIK (LKPD) — PENEMUAN KONSEP (DISCOVERY LEARNING)
Mata Pelajaran: ${mapel} | Kelas: ${kelas} | Materi Penemuan: ${materi}

1. Tahap Stimulasi (Pengamatan Fenomena/Contoh):
   - Amatilah contoh/fenomena terkait "${materi}" yang disajikan!
   - Hal menarik / ciri khusus apa yang kalian temukan dari pengamatan awal?

2. Tahap Identifikasi Masalah & Hipotesis:
   - Pertanyaan Penemuan : .................................................................
   - Hipotesis (Dugaan Awal Kelompok): .....................................................

3. Tahap Pengumpulan & Pengolahan Data:
   - Kumpulkan fakta/contoh tentang "${materi}" dari buku sumber/pengamatan, lalu kelompokkan polanya:
     a. Data / Fakta 1 : ...................................................................
     b. Data / Fakta 2 : ...................................................................
     c. Analisis Pola  : ...................................................................

4. Tahap Pembuktian (Verification):
   - Apakah hipotesis awal kelompok kalian terbukti sesuai dengan hasil pengolahan data dan teori? Jelaskan!

5. Tahap Generalisasi (Simpulan Konsep) & Refleksi Panca Cinta:
   - Rumuskan kesimpulan/kaidah umum tentang "${materi}" dan hikmah Panca Cinta yang kalian peroleh!`,
  },

  // --------------------------------------------------------------------------
  // 4. INQUIRY LEARNING — 5 SINTAKS (Sanjaya / Gulo / Suchman)
  // --------------------------------------------------------------------------
  inquiry: {
    kode: "inquiry",
    nama_resmi: "Inquiry Learning",
    singkatan: "Inquiry",
    jumlah_sintaks: 5,
    pendekatan_label: "Pembelajaran Penyelidikan Ilmiah & Pengujian Bukti (5 Sintaks)",
    format_pengalaman_label: "Format Inkuiri Ilmiah (Scientific Inquiry Experience)",
    ringkasan_riset:
      "Model Inquiry Learning menempatkan murid sebagai subjek peneliti aktif yang mencari dan menyelidiki secara sistematis, kritis, logis, dan analitis (Orientasi Masalah → Rumusan Masalah & Hipotesis → Pengumpulan Data → Pengujian Hipotesis → Perumusan Kesimpulan) berbasis bukti (evidence-based).",
    karakteristik_utama:
      "Menekankan keterampilan proses penyelidikan ilmiah, perumusan dan pengujian hipotesis secara rasional menggunakan bukti autentik, serta kejujuran intelektual.",
    rekomendasi_metode: [
      "Eksperimen / Praktik",
      "Tanya Jawab Interaktif",
      "Diskusi Kelompok",
      "Studi Kasus Kontekstual",
    ],
    struktur_3m: {
      memahami: {
        judul_fase: "Tahap I: Memahami — Orientasi Ilmiah & Perumusan Hipotesis",
        deskripsi_fase:
          "Murid membangun iklim kesiapan inkuiri atas fenomena keilmuan (Sintaks 1) serta merumuskan masalah penyelidikan dan hipotesis rasional (Sintaks 2).",
        urutan_sintaks: [1, 2],
      },
      mengaplikasi: {
        judul_fase: "Tahap II: Mengaplikasi — Pengumpulan Bukti & Pengujian Hipotesis",
        deskripsi_fase:
          "Murid melaksanakan penyelidikan sistematis untuk menjaring bukti/data (Sintaks 3) dan menguji tingkat kebenaran hipotesis berdasarkan bukti empiris/literatur (Sintaks 4).",
        urutan_sintaks: [3, 4],
      },
      merefleksi: {
        judul_fase: "Tahap III: Merefleksi — Perumusan Kesimpulan & Refleksi Inkuiri",
        deskripsi_fase:
          "Murid merumuskan temuan/kesimpulan ilmiah akhir dan merefleksikan proses berpikir inkuiri beserta nilai Panca Cinta (Sintaks 5).",
        urutan_sintaks: [5],
      },
    },
    komponen_khas: [
      {
        label: "Pertanyaan Inkuiri & Hipotesis Kerja",
        icon_key: "target",
        getNilaiKontekstual: (materi, mapel) =>
          `Pertanyaan penyelidikan ilmiah seputar "${materi}" (${mapel}) beserta rumusan hipotesis rasional yang akan diuji kebenarannya.`,
      },
      {
        label: "Prosedur Penyelidikan & Uji Bukti",
        icon_key: "langkah",
        getNilaiKontekstual: (materi) =>
          `Penelusuran bukti/data empiris maupun literatur tentang "${materi}" secara sistematis dan pengujian kesesuaian bukti terhadap hipotesis.`,
      },
      {
        label: "Eksplanasi & Simpulan Berbasis Bukti",
        icon_key: "output",
        getNilaiKontekstual: (materi) =>
          `Argumentasi dan kesimpulan ilmiah tentang "${materi}" yang didukung oleh data/bukti valid hasil penyelidikan.`,
      },
    ],
    sintaks_list: [
      {
        urutan: 1,
        nama_sintaks: "Orientasi Masalah",
        nama_inggris: "Orientation to the Inquiry Problem",
        pengalaman_belajar: "memahami",
        prinsip_default: ["berkesadaran", "menggembirakan"],
        bobot_durasi: 15,
        fokus_sintaks:
          "Menciptakan iklim belajar inkuiri yang responsif, memaparkan topik/fenomena keilmuan, dan memotivasi murid melakukan penyelidikan.",
        indikator_keterlaksanaan:
          "Guru mengondisikan suasana inkuiri dan memaparkan fenomena/persoalan keilmuan yang menantang nalar murid.",
        buildAktivitasGuru: ({ materi, mapel }) =>
          `Menciptakan suasana belajar inkuiri yang kondusif dan responsif pada pembelajaran ${mapel}, memaparkan fenomena/persoalan keilmuan yang berkaitan dengan "${materi}", serta menjelaskan prosedur penyelidikan yang akan ditempuh murid.`,
        buildAktivitasMurid: ({ materi }) =>
          `Menyimak orientasi permasalahan "${materi}" dengan penuh kesadaran, mengamati fenomena keilmuan yang disajikan guru, serta menyiapkan kesiapan berpikir kritis untuk melakukan penyelidikan ilmiah.`,
        buildAksiKbc: ({ materi }, pcNama) =>
          `Menumbuhkan kekaguman atas ilmu pengetahuan terkait "${materi}" dan niat tulus meneliti kebenaran sebagai wujud ${pcNama}.`,
      },
      {
        urutan: 2,
        nama_sintaks: "Merumuskan Masalah dan Hipotesis",
        nama_inggris: "Formulating Problem and Hypothesis",
        pengalaman_belajar: "memahami",
        prinsip_default: ["berkesadaran", "bermakna"],
        bobot_durasi: 20,
        fokus_sintaks:
          "Membimbing murid merumuskan pertanyaan penyelidikan (inquiry question) yang terfokus dan menyusun jawaban sementara (hipotesis).",
        indikator_keterlaksanaan:
          "Murid berhasil merumuskan pertanyaan inkuiri yang jelas dan mengajukan hipotesis logis pada LKPD.",
        buildAktivitasGuru: ({ materi }) =>
          `Membimbing murid melalui pertanyaan-pertanyaan pengarah untuk merumuskan masalah penyelidikan tentang "${materi}" secara spesifik, lalu mendorong setiap kelompok mengemukakan hipotesis (jawaban sementara) yang logis dan dapat diuji.`,
        buildAktivitasMurid: ({ materi }) =>
          `Berdiskusi dalam kelompok untuk memetakan inti persoalan "${materi}", menuliskan rumusan masalah inkuiri pada LKPD, serta merumuskan hipotesis berdasarkan penalaran dan pengetahuan awal yang dimiliki.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Membangun sikap terbuka, berpikir positif, dan saling menghargai gagasan saat merumuskan hipotesis sesuai semangat ${pcNama}.`,
      },
      {
        urutan: 3,
        nama_sintaks: "Mengumpulkan Data dan Informasi",
        nama_inggris: "Collecting Data and Evidence",
        pengalaman_belajar: "mengaplikasi",
        prinsip_default: ["bermakna", "menggembirakan"],
        bobot_durasi: 25,
        fokus_sintaks:
          "Melaksanakan penjaringan data, fakta, dalil, atau bukti pengamatan/eksperimen secara sistematis untuk menguji hipotesis.",
        indikator_keterlaksanaan:
          "Murid melakukan aktivitas pengumpulan data/bukti secara sistematis dan mencatatnya pada tabel penyelidikan LKPD.",
        buildAktivitasGuru: ({ materi }) =>
          `Memfasilitasi jalannya penyelidikan kelompok dengan menyediakan sumber rujukan/media eksplorasi "${materi}", serta mendampingi murid mengumpulkan data, fakta, dalil, atau hasil pengamatan yang dibutuhkan untuk menguji hipotesis.`,
        buildAktivitasMurid: ({ materi }) =>
          `Melaksanakan proses pengumpulan data dan informasi mengenai "${materi}" secara sistematis melalui telaah referensi, observasi, atau praktik, lalu mencatat seluruh bukti penting secara jujur dan teliti pada LKPD Inkuiri.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Mengamalkan kejujuran akademik, ketekunan, dan kolaborasi yang saling menguatkan dalam mencari bukti keilmuan sebagai wujud ${pcNama}.`,
      },
      {
        urutan: 4,
        nama_sintaks: "Menguji Hipotesis",
        nama_inggris: "Testing Hypothesis",
        pengalaman_belajar: "mengaplikasi",
        prinsip_default: ["bermakna", "berkesadaran"],
        bobot_durasi: 20,
        fokus_sintaks:
          "Menganalisis bukti yang terkumpul secara rasional untuk menentukan tingkat kebenaran hipotesis dan menyajikan eksplanasi ilmiah.",
        indikator_keterlaksanaan:
          "Murid menganalisis kesesuaian data dengan hipotesis dan mempresentasikan argumentasi berbasis bukti.",
        buildAktivitasGuru: ({ materi }) =>
          `Membimbing murid menganalisis data/bukti yang telah terkumpul untuk menguji kebenaran hipotesis tentang "${materi}", serta memfasilitasi forum diskusi kelas agar setiap kelompok menyajikan eksplanasi berbasis bukti (evidence-based).`,
        buildAktivitasMurid: ({ materi }) =>
          `Menguji dan membandingkan hipotesis awal terhadap bukti-bukti hasil penyelidikan "${materi}" secara objektif dan rasional, menentukan apakah hipotesis diterima atau perlu disempurnakan, serta mempresentasikan hasilnya di depan kelas.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Menanamkan adab berdiskusi ilmiah yang santun, objektif, dan menghormati bukti kebenaran selaras dengan nilai ${pcNama}.`,
      },
      {
        urutan: 5,
        nama_sintaks: "Merumuskan Kesimpulan",
        nama_inggris: "Formulating Conclusion and Reflection",
        pengalaman_belajar: "merefleksi",
        prinsip_default: ["berkesadaran", "bermakna"],
        bobot_durasi: 20,
        fokus_sintaks:
          "Mendeskripsikan temuan akhir yang akurat berdasarkan hasil pengujian hipotesis dan merefleksikan proses inkuiri.",
        indikator_keterlaksanaan:
          "Murid merumuskan kesimpulan ilmiah akhir dan merefleksikan proses penyelidikan serta makna karakter materi.",
        buildAktivitasGuru: ({ materi }) =>
          `Memandu murid merumuskan kesimpulan akurat atas konsep "${materi}" berdasarkan hasil pengujian hipotesis, memberikan konfirmasi dan penguatan konsep, serta mengajak murid merefleksikan proses inkuiri dan nilai Panca Cinta yang dipelajari.`,
        buildAktivitasMurid: ({ materi }) =>
          `Merumuskan kesimpulan akhir tentang "${materi}" berdasarkan bukti yang telah teruji, mengevaluasi langkah-langkah penyelidikan yang telah dilakukan, dan merefleksikan manfaat ilmu tersebut bagi penguatan karakter diri.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Mengajak murid menyadari bahwa kebenaran ilmu mengantarkan pada ketawadukan dan pengamalan ${pcNama} dalam keseharian.`,
      },
    ],
    buildKegiatanAwal: ({ materi, mapel, pertemuanKe }) => ({
      aktivitas_guru: `Membuka pembelajaran ${mapel} Pertemuan ke-${pertemuanKe} dengan salam, doa bersama, dan sapaan hangat, membangkitkan kesadaran penuh (mindfulness), melakukan tanya jawab apersepsi terkait fenomena "${materi}", serta menyampaikan tujuan pembelajaran dengan model Inquiry Learning.`,
      aktivitas_murid: `Menjawab salam dan berdoa dengan khusyuk, menyiapkan fokus belajar, menanggapi pertanyaan apersepsi guru, dan memahami tujuan serta langkah-langkah penyelidikan inkuiri yang akan dilakukan.`,
      aksi_kbc: "Membangun iklim kelas yang menghargai rasa ingin tahu dan meniatkan pencarian ilmu sebagai ibadah.",
    }),
    buildKegiatanPenutup: ({ materi, pertemuanKe }) => ({
      aktivitas_guru: `Bersama murid menegaskan kembali simpulan hasil inkuiri tentang "${materi}" pada Pertemuan ke-${pertemuanKe}, memberikan umpan balik positif atas sikap ilmiah murid, menyampaikan rencana pembelajaran berikutnya, dan menutup kelas dengan doa.`,
      aktivitas_murid: `Menyimpulkan hasil belajar hari ini, melakukan refleksi diri atas proses penyelidikan, dan berdoa bersama dengan penuh syukur.`,
      aksi_kbc: "Mengapresiasi kejujuran dan ketelitian murid selama proses penyelidikan serta mengajak bersyukur kepada Allah SWT.",
    }),
    buildLkpdKhusus: (materi, mapel, kelas) => `A. LEMBAR KERJA PESERTA DIDIK (LKPD) — PENYELIDIKAN ILMIAH (INQUIRY LEARNING)
Mata Pelajaran: ${mapel} | Kelas: ${kelas} | Topik Inkuiri: ${materi}

1. Orientasi Fenomena Keilmuan:
   - Cermati fenomena/fakta seputar "${materi}" yang dipaparkan pada lembar pengantar!

2. Rumusan Masalah & Hipotesis Inkuiri:
   - Rumusan Masalah Penyelidikan : Bagaimanakah ..........................................?
   - Hipotesis (Jawaban Sementara): ........................................................

3. Pengumpulan Data & Bukti Penyelidikan:
   - Catatlah data, fakta, dalil, atau hasil pengamatan terkait "${materi}":
     • Bukti / Data 1: .....................................................................
     • Bukti / Data 2: .....................................................................
     • Bukti / Data 3: .....................................................................

4. Analisis & Pengujian Hipotesis:
   - Berdasarkan bukti di atas, apakah hipotesis kelompok kalian terbukti benar? Jelaskan argumentasi ilmiahnya!

5. Kesimpulan Inkuiri & Refleksi Panca Cinta:
   - Simpulan akhir konsep "${materi}" dan wujud pengamalan nilai Panca Cinta dalam kehidupan sehari-hari.`,
  },

  // --------------------------------------------------------------------------
  // 5. COOPERATIVE LEARNING — 6 SINTAKS (Slavin / Arends)
  // --------------------------------------------------------------------------
  cooperative: {
    kode: "cooperative",
    nama_resmi: "Cooperative Learning",
    singkatan: "Cooperative",
    jumlah_sintaks: 6,
    pendekatan_label: "Pembelajaran Tim Kooperatif & Tutor Sebaya (6 Sintaks)",
    format_pengalaman_label: "Format Tim Kooperatif (Cooperative Team Learning Experience)",
    ringkasan_riset:
      "Model Cooperative Learning (Robert E. Slavin / Arends) mengoptimalkan kerja sama dalam tim kecil yang heterogen dengan prinsip saling ketergantungan positif (positive interdependence), akuntabilitas individu, tutor sebaya (peer teaching), serta rekognisi/penghargaan kelompok.",
    karakteristik_utama:
      "Keberhasilan kelompok ditentukan oleh ketuntasan belajar setiap individu anggota tim melalui saling mengajari (peer tutoring), evaluasi terukur, dan apresiasi bersama.",
    rekomendasi_metode: [
      "Diskusi Kelompok",
      "Tanya Jawab Interaktif",
      "Presentasi Murid",
      "Demonstrasi",
    ],
    struktur_3m: {
      memahami: {
        judul_fase: "Tahap I: Memahami — Motivasi Tujuan & Sajian Informasi Konsep",
        deskripsi_fase:
          "Murid memahami target kompetensi kolektif yang harus dicapai (Sintaks 1) dan menyimak sajian informasi konsep esensial dari guru sebagai modal kerja tim (Sintaks 2).",
        urutan_sintaks: [1, 2],
      },
      mengaplikasi: {
        judul_fase: "Tahap II: Mengaplikasi — Organisasi Tim & Kolaborasi Tutor Sebaya",
        deskripsi_fase:
          "Murid tergabung dalam tim belajar heterogen dengan peran jelas (Sintaks 3) serta berdiskusi menyelesaikan LKPD melalui saling mengajari/peer tutoring (Sintaks 4).",
        urutan_sintaks: [3, 4],
      },
      merefleksi: {
        judul_fase: "Tahap III: Merefleksi — Evaluasi Penguasaan & Penghargaan Tim",
        deskripsi_fase:
          "Murid mempresentasikan hasil dan mengikuti evaluasi penguasaan materi (Sintaks 5), dilanjutkan pemberian penghargaan/apresiasi tim serta refleksi nilai kebersamaan (Sintaks 6).",
        urutan_sintaks: [5, 6],
      },
    },
    komponen_khas: [
      {
        label: "Struktur Tim Heterogen & Pembagian Peran",
        icon_key: "target",
        getNilaiKontekstual: (materi, mapel) =>
          `Pengelompokan murid secara heterogen (4–5 orang) pada pembelajaran ${mapel} untuk menguasai materi "${materi}" dengan peran Ketua, Pencatat, Penyaji, dan Pemeriksa Pemahaman.`,
      },
      {
        label: "Mekanisme Tutor Sebaya (Peer Tutoring)",
        icon_key: "langkah",
        getNilaiKontekstual: (materi) =>
          `Saling mengajari dan berlatih menyelesaikan lembar tugas kooperatif "${materi}" hingga seluruh anggota tim memahami konsep secara merata.`,
      },
      {
        label: "Evaluasi Akuntabilitas & Rekognisi Tim",
        icon_key: "output",
        getNilaiKontekstual: (materi) =>
          `Presentasi tim, kuis evaluasi pemahaman individu/kelompok atas materi "${materi}", dan pemberian predikat apresiasi kelompok.`,
      },
    ],
    sintaks_list: [
      {
        urutan: 1,
        nama_sintaks: "Menyampaikan Tujuan dan Memotivasi Peserta Didik",
        nama_inggris: "Present Goals and Set",
        pengalaman_belajar: "memahami",
        prinsip_default: ["berkesadaran", "menggembirakan"],
        bobot_durasi: 10,
        fokus_sintaks:
          "Menyampaikan indikator tujuan pembelajaran yang harus dicapai bersama dan membangkitkan motivasi kolaboratif murid.",
        indikator_keterlaksanaan:
          "Guru menyampaikan tujuan belajar dan memotivasi murid bahwa kesuksesan tim bergantung pada kepedulian bersama.",
        buildAktivitasGuru: ({ materi, mapel }) =>
          `Menyampaikan tujuan pembelajaran dan target ketuntasan materi "${materi}" pada mata pelajaran ${mapel}, menjelaskan manfaat materi bagi kehidupan, serta membangkitkan motivasi belajar murid untuk saling mendukung dalam tim kooperatif.`,
        buildAktivitasMurid: ({ materi }) =>
          `Menyimak tujuan dan target penguasaan materi "${materi}" dengan penuh kesadaran, membangun semangat belajar positif, serta berkomitmen untuk berpartisipasi aktif dan saling membantu teman sekelas.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Menanamkan niat belajar bersama dengan semangat persaudaraan dan ${pcNama} agar tidak ada satu pun teman yang tertinggal.`,
      },
      {
        urutan: 2,
        nama_sintaks: "Menyajikan Informasi",
        nama_inggris: "Present Information",
        pengalaman_belajar: "memahami",
        prinsip_default: ["berkesadaran", "bermakna"],
        bobot_durasi: 20,
        fokus_sintaks:
          "Menyajikan konsep inti materi secara terstruktur melalui penjelasan ringkas, demonstrasi, atau bahan bacaan/media visual.",
        indikator_keterlaksanaan:
          "Guru menyajikan informasi konsep dasar secara jelas dan murid mencermati serta melakukan tanya jawab klarifikasi.",
        buildAktivitasGuru: ({ materi }) =>
          `Menyajikan informasi konsep esensial mengenai "${materi}" secara sistematis dan menarik menggunakan media visual, peta konsep, atau demonstrasi singkat sebagai fondasi pengetahuan sebelum murid bekerja dalam kelompok.`,
        buildAktivitasMurid: ({ materi }) =>
          `Memperhatikan penjelasan/demonstrasi konsep inti "${materi}" dengan saksama, mencatat poin-poin kunci, serta mengajukan pertanyaan klarifikasi atas bagian konsep yang belum dipahami.`,
        buildAksiKbc: ({ materi }, pcNama) =>
          `Mengajak murid menyimak ilmu "${materi}" dengan adab menghormati guru dan kecintaan pada kebenaran sesuai nilai ${pcNama}.`,
      },
      {
        urutan: 3,
        nama_sintaks: "Mengorganisasikan Peserta Didik ke Kelompok Belajar",
        nama_inggris: "Organize Students into Learning Teams",
        pengalaman_belajar: "mengaplikasi",
        prinsip_default: ["bermakna", "menggembirakan"],
        bobot_durasi: 10,
        fokus_sintaks:
          "Membentuk kelompok belajar kooperatif yang heterogen, membagikan LKPD Tim, dan menetapkan peran tiap anggota.",
        indikator_keterlaksanaan:
          "Murid tergabung dalam kelompok heterogen dengan pembagian peran kooperatif yang jelas.",
        buildAktivitasGuru: ({ materi }) =>
          `Mengorganisasikan murid ke dalam kelompok belajar kooperatif yang heterogen (4–5 orang), membagikan LKPD Kooperatif "${materi}", dan memandu pembagian peran spesifik tiap anggota (fasilitator tim, pencatat, penyaji, dan pemeriksa pemahaman).`,
        buildAktivitasMurid: ({ materi }) =>
          `Bergabung ke dalam kelompok belajar dengan tertib dan gembira tanpa memilih-milih teman, menyepakati pembagian peran tim, serta mencermati instruksi tugas kooperatif tentang "${materi}" pada LKPD.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Menumbuhkan sikap inklusif, merangkul semua teman tanpa membeda-bedakan latar belakang sebagai pengamalan ${pcNama}.`,
      },
      {
        urutan: 4,
        nama_sintaks: "Membimbing Kelompok Bekerja dan Belajar",
        nama_inggris: "Assist Team Work and Study",
        pengalaman_belajar: "mengaplikasi",
        prinsip_default: ["bermakna", "menggembirakan"],
        bobot_durasi: 30,
        fokus_sintaks:
          "Memfasilitasi diskusi kelompok dan mendorong praktik tutor sebaya (peer tutoring) hingga setiap anggota menguasai materi.",
        indikator_keterlaksanaan:
          "Terjadi interaksi tatap muka dan tutor sebaya di dalam kelompok dengan pendampingan aktif dari guru.",
        buildAktivitasGuru: ({ materi }) =>
          `Membimbing kelompok bekerja dan belajar menyelesaikan tugas "${materi}" pada LKPD, mendorong mekanisme tutor sebaya (anggota yang lebih paham menjelaskan kepada temannya dengan sabar), serta memberikan bantuan (scaffolding) saat diperlukan.`,
        buildAktivitasMurid: ({ materi }) =>
          `Berdiskusi secara aktif menyelesaikan persoalan dan latihan konsep "${materi}" pada LKPD, saling menjelaskan dan menguji pemahaman antarteman sekelompok (peer tutoring) hingga seluruh anggota tim benar-benar menguasai materi.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Mengamalkan nilai tolong-menolong, kesabaran dalam mengajari teman, dan empati sosial sesuai pilar ${pcNama}.`,
      },
      {
        urutan: 5,
        nama_sintaks: "Evaluasi",
        nama_inggris: "Test on the Materials / Evaluation",
        pengalaman_belajar: "merefleksi",
        prinsip_default: ["berkesadaran", "bermakna"],
        bobot_durasi: 20,
        fokus_sintaks:
          "Memfasilitasi presentasi hasil kerja kelompok serta mengadakan evaluasi/kuis formatif untuk mengukur ketuntasan pemahaman.",
        indikator_keterlaksanaan:
          "Kelompok mempresentasikan hasil belajar dan murid mengikuti evaluasi pemahaman secara bertanggung jawab.",
        buildAktivitasGuru: ({ materi }) =>
          `Memimpin sesi presentasi hasil kerja kelompok mengenai "${materi}", memberikan konfirmasi konsep, serta menyelenggarakan kuis/evaluasi formatif singkat untuk mengukur penguasaan materi tiap anggota secara akuntabel.`,
        buildAktivitasMurid: ({ materi }) =>
          `Mempresentasikan hasil diskusi kelompok tentang "${materi}" di depan kelas, menanggapi kelompok lain secara santun, serta menjawab pertanyaan kuis evaluasi secara jujur dan mandiri untuk menyumbangkan poin terbaik bagi tim.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Menegakkan kejujuran dan tanggung jawab pribadi dalam evaluasi belajar sebagai perwujudan ${pcNama}.`,
      },
      {
        urutan: 6,
        nama_sintaks: "Memberikan Penghargaan",
        nama_inggris: "Provide Recognition",
        pengalaman_belajar: "merefleksi",
        prinsip_default: ["menggembirakan", "berkesadaran"],
        bobot_durasi: 10,
        fokus_sintaks:
          "Memberikan apresiasi/rekognisi atas capaian dan kekompakan kelompok, disertai refleksi proses kolaborasi.",
        indikator_keterlaksanaan:
          "Guru memberikan penghargaan/apresiasi kepada kelompok dan murid merefleksikan makna kerja sama tim.",
        buildAktivitasGuru: ({ materi }) =>
          `Memberikan penghargaan dan apresiasi (recognition) kepada kelompok atas usaha, kekompakan, dan capaian penguasaan materi "${materi}" (misal predikat Tim Super/Kompak/Inspiratif), lalu memandu refleksi nilai kebersamaan Panca Cinta.`,
        buildAktivitasMurid: ({ materi }) =>
          `Menerima apresiasi dan turut merayakan keberhasilan kelompok sendiri maupun kelompok lain dengan gembira, serta merefleksikan hikmah materi "${materi}" dan kualitas kerja sama yang telah dipraktikkan.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Membudayakan sikap saling mengapresiasi kebaikan dan bersyukur atas keberhasilan bersama dalam bingkai ${pcNama}.`,
      },
    ],
    buildKegiatanAwal: ({ materi, mapel, pertemuanKe }) => ({
      aktivitas_guru: `Membuka pembelajaran ${mapel} Pertemuan ke-${pertemuanKe} dengan salam hangat, doa bersama, dan sapaan kasih sayang, melakukan pengondisian kelas yang menyenangkan, mengaitkan apersepsi materi sebelumnya dengan topik "${materi}", serta menjelaskan alur Cooperative Learning.`,
      aktivitas_murid: `Menjawab salam dan berdoa dengan khusyuk, merespons sapaan dan apersepsi guru dengan antusias, serta menyiapkan buku dan kelengkapan belajar untuk berkolaborasi dalam tim.`,
      aksi_kbc: "Menciptakan iklim persaudaraan kelas yang hangat, suportif, dan bebas dari perundungan.",
    }),
    buildKegiatanPenutup: ({ materi, pertemuanKe }) => ({
      aktivitas_guru: `Bersama murid menyimpulkan poin-poin utama materi "${materi}" pada Pertemuan ke-${pertemuanKe}, menguatkan pesan moral Panca Cinta tentang indahnya berbagi ilmu, menyampaikan materi pertemuan berikutnya, dan menutup dengan doa.`,
      aktivitas_murid: `Merumuskan kesimpulan materi bersama guru, mengucapkan terima kasih kepada rekan satu tim atas kerja samanya hari ini, dan berdoa penutup dengan khusyuk.`,
      aksi_kbc: "Membiasakan murid saling berterima kasih kepada teman sekelompok dan bersyukur kepada Allah SWT.",
    }),
    buildLkpdKhusus: (materi, mapel, kelas) => `A. LEMBAR KERJA PESERTA DIDIK (LKPD) — TIM KOOPERATIF (COOPERATIVE LEARNING)
Mata Pelajaran: ${mapel} | Kelas: ${kelas} | Materi Tim: ${materi}

1. Identitas & Pembagian Peran Tim Belajar:
   - Nama Tim Kooperatif : ................................................................
   - Peran Anggota       : 1) Ketua/Fasilitator  2) Pencatat  3) Penyaji  4) Pemeriksa Pemahaman

2. Ringkasan Informasi & Konsep Kunci:
   - Tuliskan poin-poin konsep utama "${materi}" yang telah kalian simak dan pelajari bersama!

3. Aktivitas Diskusi & Tutor Sebaya (Peer Tutoring):
   - Selesaikan persoalan/studi konsep "${materi}" berikut secara bersama-sama, dan pastikan setiap anggota tim mampu menjelaskannya kembali:
     a. Tugas Pemahaman Konsep : ...........................................................
     b. Tugas Aplikasi Materi  : ...........................................................

4. Ceklis Ketuntasan Anggota (Pemeriksa Pemahaman):
   - [ ] Seluruh anggota tim telah memahami konsep inti "${materi}" dan siap mengikuti kuis/presentasi.

5. Refleksi Kebersamaan & Aksi Panca Cinta:
   - Bagaimana perasaan kalian saling membantu memahami "${materi}" hari ini? Tuliskan aksi nyata Panca Cinta tim kalian!`,
  },

  // --------------------------------------------------------------------------
  // 6. LOK-R (Literasi, Orientasi, Kolaborasi, Refleksi) — 4 SINTAKS (Kemenag RI)
  // --------------------------------------------------------------------------
  lokr: {
    kode: "lokr",
    nama_resmi: "LOK-R (Literasi, Orientasi, Kolaborasi, Refleksi)",
    singkatan: "LOK-R",
    jumlah_sintaks: 4,
    pendekatan_label: "Model Inovatif Berbasis Literasi Multimodal & Karakter Madrasah (4 Sintaks)",
    format_pengalaman_label: "Format Siklus LOK-R (Literacy-Orientation-Collaboration-Reflection)",
    ringkasan_riset:
      "Model LOK-R (Literasi, Orientasi, Kolaborasi, Refleksi) merupakan model pembelajaran khas Kementerian Agama RI yang mengintegrasikan penguatan kecakapan literasi multimodal (AKMI) dengan alur Pembelajaran Mendalam dan penghayatan nilai Panca Cinta (KBC).",
    karakteristik_utama:
      "Diawali telaah teks/stimulus literasi kontekstual (Literasi), pemantapan fokus masalah & nilai kasih sayang (Orientasi), kerja sama pemecahan masalah/karya (Kolaborasi), dan bermuara pada pemaknaan spiritual serta komitmen aksi nyata (Refleksi).",
    rekomendasi_metode: [
      "Studi Kasus Kontekstual",
      "Diskusi Kelompok",
      "Tanya Jawab Interaktif",
      "Refleksi Terbimbing",
    ],
    struktur_3m: {
      memahami: {
        judul_fase: "Tahap I: Memahami — Literasi Multimodal & Orientasi Nilai",
        deskripsi_fase:
          "Murid membaca dan memaknai stimulus literasi kontekstual (Sintaks 1: Literasi) serta memantapkan orientasi masalah dan nilai kasih sayang bersama guru (Sintaks 2: Orientasi).",
        urutan_sintaks: [1, 2],
      },
      mengaplikasi: {
        judul_fase: "Tahap II: Mengaplikasi — Kolaborasi Pemecahan Masalah & Aksi Nyata",
        deskripsi_fase:
          "Murid berkolaborasi dalam kelompok mengolah temuan literasi, memecahkan studi kasus, dan menyajikan karya/solusi aplikatif (Sintaks 3: Kolaborasi).",
        urutan_sintaks: [3],
      },
      merefleksi: {
        judul_fase: "Tahap III: Merefleksi — Refleksi Makna Spiritual & Resolusi Aksi Cinta",
        deskripsi_fase:
          "Murid melakukan evaluasi diri, merenungkan hikmah spiritual/sosial materi, dan merumuskan resolusi aksi nyata Panca Cinta (Sintaks 4: Refleksi).",
        urutan_sintaks: [4],
      },
    },
    komponen_khas: [
      {
        label: "Stimulus Literasi Multimodal & Orientasi",
        icon_key: "target",
        getNilaiKontekstual: (materi, mapel) =>
          `Wacana literasi kontekstual, dalil/kutipan inspiratif, atau infografis tentang "${materi}" (${mapel}) disertai pertanyaan orientasi nilai Panca Cinta.`,
      },
      {
        label: "Kolaborasi Diskusi & Karya Kontekstual",
        icon_key: "langkah",
        getNilaiKontekstual: (materi) =>
          `Kerja sama kelompok pada LKPD LOK-R untuk mengolah informasi teks "${materi}", memecahkan kasus kontekstual, dan menyajikan gagasan solusi.`,
      },
      {
        label: "Refleksi Spiritual & Resolusi Aksi Cinta",
        icon_key: "output",
        getNilaiKontekstual: (materi) =>
          `Perenungan makna mendalam dari materi "${materi}" dan komitmen tertulis habituasi aksi nyata Panca Cinta dalam kehidupan sehari-hari.`,
      },
    ],
    sintaks_list: [
      {
        urutan: 1,
        nama_sintaks: "Literasi (Membaca & Memaknai Konteks)",
        nama_inggris: "Literacy — Reading & Making Meaning",
        pengalaman_belajar: "memahami",
        prinsip_default: ["berkesadaran", "bermakna"],
        bobot_durasi: 20,
        fokus_sintaks:
          "Melibatkan murid secara aktif dalam membaca, mengamati, dan menelaah stimulus literasi multimodal (teks, dalil, infografis, kisah kontekstual) untuk membangun pemahaman awal.",
        indikator_keterlaksanaan:
          "Guru menyajikan bahan literasi kontekstual dan murid membaca/menelaah informasi penting secara berkesadaran.",
        buildAktivitasGuru: ({ materi, mapel }) =>
          `Menyajikan stimulus literasi multimodal (berupa wacana kontekstual, teks keilmuan/keagamaan, infografis, atau kisah inspiratif) terkait "${materi}" pada pembelajaran ${mapel}, serta memandu murid melakukan kegiatan membaca berkesadaran (mindful reading) untuk menggali informasi esensial.`,
        buildAktivitasMurid: ({ materi }) =>
          `Membaca, mengamati, dan menelaah bahan literasi tentang "${materi}" dengan saksama, menandai kata-kata kunci serta fakta penting dari teks/infografis, dan mencatat gagasan pokok yang ditemukan pada lembar literasi.`,
        buildAksiKbc: ({ materi }, pcNama) =>
          `Menumbuhkan budaya gemar membaca dan merenungi makna ilmu "${materi}" dengan penuh penghayatan sebagai wujud ${pcNama}.`,
      },
      {
        urutan: 2,
        nama_sintaks: "Orientasi (Eksplorasi Masalah & Nilai Kasih Sayang)",
        nama_inggris: "Orientation — Exploring Issues & Values",
        pengalaman_belajar: "memahami",
        prinsip_default: ["berkesadaran", "bermakna"],
        bobot_durasi: 20,
        fokus_sintaks:
          "Memantapkan fokus pembelajaran dari hasil literasi, meluruskan miskonsepsi awal, serta mengorientasikan permasalahan utama dan kaitan nilai Panca Cinta.",
        indikator_keterlaksanaan:
          "Terjadi dialog interaktif yang menyamakan persepsi konsep dan memfokuskan masalah serta nilai karakter yang akan dikaji.",
        buildAktivitasGuru: ({ materi }) =>
          `Mengajukan pertanyaan pemantik terarah untuk mengeksplorasi pemahaman murid atas teks literasi "${materi}", meluruskan miskonsepsi awal, serta mengorientasikan fokus permasalahan kontekstual dan benang merah nilai Panca Cinta yang akan dipecahkan bersama.`,
        buildAktivitasMurid: ({ materi }) =>
          `Merespons pertanyaan orientasi guru secara kritis dan santun, mengaitkan informasi dari bacaan "${materi}" dengan fenomena nyata di lingkungan sekitar, serta menyepakati fokus permasalahan yang akan dibahas pada tahap kolaborasi.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Membangun kepekaan hati dan kesadaran bahwa penguasaan materi harus berlandaskan kasih sayang serta nilai ${pcNama}.`,
      },
      {
        urutan: 3,
        nama_sintaks: "Kolaborasi (Aksi Nyata & Pemecahan Masalah)",
        nama_inggris: "Collaboration — Collaborative Action & Problem Solving",
        pengalaman_belajar: "mengaplikasi",
        prinsip_default: ["bermakna", "menggembirakan"],
        bobot_durasi: 35,
        fokus_sintaks:
          "Bekerja sama dalam kelompok heterogen untuk mengolah hasil literasi, memecahkan masalah kontekstual pada LKPD, dan mempresentasikan karya/solusi.",
        indikator_keterlaksanaan:
          "Murid berdiskusi kolaboratif menyelesaikan LKPD LOK-R dan menyajikan hasil pemecahan masalah/karya di kelas.",
        buildAktivitasGuru: ({ materi }) =>
          `Memfasilitasi murid bekerja dalam kelompok kolaboratif menggunakan LKPD LOK-R untuk mengolah informasi "${materi}", memecahkan studi kasus kontekstual, merancang produk/solusi aksi nyata, serta memandu sesi presentasi dan umpan balik antarkelompok.`,
        buildAktivitasMurid: ({ materi }) =>
          `Berdiskusi secara kolaboratif dengan semangat gotong royong dan saling memuliakan untuk menganalisis persoalan "${materi}" pada LKPD, merumuskan solusi/karya aplikatif, serta mempresentasikan hasil kerja kelompok di depan kelas dengan komunikatif.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Mempraktikkan kolaborasi yang penuh empati, menghargai kontribusi setiap teman, dan berlomba-lomba dalam kebaikan sesuai semangat ${pcNama}.`,
      },
      {
        urutan: 4,
        nama_sintaks: "Refleksi (Makna Spiritual & Resolusi Aksi Cinta)",
        nama_inggris: "Reflection — Spiritual Meaning & Love Action Resolution",
        pengalaman_belajar: "merefleksi",
        prinsip_default: ["berkesadaran", "bermakna"],
        bobot_durasi: 25,
        fokus_sintaks:
          "Mengevaluasi penguasaan konsep, merenungkan hikmah spiritual/kemanusiaan dari materi, dan merumuskan komitmen aksi nyata (habituasi).",
        indikator_keterlaksanaan:
          "Murid melakukan refleksi pemahaman konsep dan menuliskan komitmen resolusi aksi cinta dalam kehidupan sehari-hari.",
        buildAktivitasGuru: ({ materi }) =>
          `Memandu murid melakukan evaluasi dan refleksi mendalam atas proses belajar "${materi}", memberikan penguatan konsep esensial, serta membimbing murid menggali makna spiritual/sosial untuk dituangkan menjadi resolusi aksi cinta nyata.`,
        buildAktivitasMurid: ({ materi }) =>
          `Merefleksikan pemahaman baru yang diperoleh tentang "${materi}", mengevaluasi keberhasilan proses belajar diri dan kelompok, serta menuliskan komitmen resolusi aksi nyata Panca Cinta yang akan dipraktikkan di madrasah, rumah, dan masyarakat.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Meneguhkan tekad murid untuk mentransformasikan pemahaman ilmu menjadi akhlak mulia dan habituasi ${pcNama} setiap hari.`,
      },
    ],
    buildKegiatanAwal: ({ materi, mapel, pertemuanKe }) => ({
      aktivitas_guru: `Membuka pembelajaran ${mapel} Pertemuan ke-${pertemuanKe} dengan salam, doa bersama, dan sapaan penuh cinta, memandu jeda hening sejenak (mindfulness) agar hati dan pikiran siap menerima ilmu, melakukan apersepsi kontekstual tentang "${materi}", serta menyampaikan tujuan pembelajaran melalui alur LOK-R (Literasi, Orientasi, Kolaborasi, Refleksi).`,
      aktivitas_murid: `Menjawab salam dan berdoa dengan khusyuk, menenangkan diri dan memfokuskan niat belajar karena Allah SWT, menanggapi apersepsi guru, serta menyimak tujuan dan tahapan pembelajaran LOK-R.`,
      aksi_kbc: "Menyapa murid dengan kehangatan kasih sayang dan menata niat belajar sebagai ibadah serta wujud Cinta Allah dan Rasul.",
    }),
    buildKegiatanPenutup: ({ materi, pertemuanKe }) => ({
      aktivitas_guru: `Bersama murid menyarikan simpulan utuh dan hikmah pembelajaran "${materi}" pada Pertemuan ke-${pertemuanKe}, memberikan apresiasi atas keaktifan literasi dan kolaborasi murid, menyampaikan agenda pertemuan berikutnya, dan menutup pembelajaran dengan doa.`,
      aktivitas_murid: `Menyimpulkan intisari pembelajaran hari ini, meneguhkan komitmen resolusi aksi cinta yang telah ditulis, serta berdoa bersama dengan penuh rasa syukur.`,
      aksi_kbc: "Mengajak murid mensyukuri nikmat ilmu dan persaudaraan serta mendoakan kebaikan bagi orang tua, guru, dan sesama.",
    }),
    buildLkpdKhusus: (materi, mapel, kelas) => `A. LEMBAR KERJA PESERTA DIDIK (LKPD) — MODEL LOK-R (LITERASI, ORIENTASI, KOLABORASI, REFLEKSI)
Mata Pelajaran: ${mapel} | Kelas: ${kelas} | Topik Kajian: ${materi}

1. Tahap L — LITERASI (Membaca & Memaknai Stimulus Kontekstual):
   - Bacalah wacana/teks stimulus dan infografis terkait "${materi}" dengan penuh kesadaran!
   - Kata Kunci & Informasi Penting yang Ditemukan: ........................................

2. Tahap O — ORIENTASI (Eksplorasi Masalah & Nilai Panca Cinta):
   - Apa permasalahan kontekstual utama yang diangkat dalam teks "${materi}" tersebut?
   - Bagaimana kaitan topik tersebut dengan nilai kasih sayang dan Panca Cinta di sekitar kita?

3. Tahap K — KOLABORASI (Analisis Kelompok & Rancangan Solusi/Aksi):
   - Diskusikan bersama kelompok (4-5 murid) untuk menjawab pertanyaan analisis berikut:
     a. Pemecahan Masalah / Kajian Konsep "${materi}": ....................................
     b. Gagasan Karya / Aksi Nyata Kelompok          : ....................................

4. Tahap R — REFLEKSI (Makna Spiritual & Resolusi Aksi Cinta):
   - Pemahaman dan hikmah terpenting yang saya peroleh hari ini: ...........................
   - Resolusi Aksi Cinta (1 tindakan konkret yang akan saya biasakan mulai hari ini): ......`,
  },
};

/**
 * Mengambil spesifikasi model pedagogis berdasarkan nama model atau objek model dari database
 */
export function getModelPedagogiSpec(namaModel?: string | null): ModelPedagogiSpec {
  const kode = detectModelKode(namaModel);
  if (kode !== "custom") {
    return MODEL_PEDAGOGI_SPECS[kode];
  }
  return MODEL_PEDAGOGI_SPECS.pjbl;
}

/**
 * Membagi durasi menit Kegiatan Inti secara proporsional berdasarkan bobot sintaks
 * dan menjamin total durasi Kegiatan Inti tepat sama dengan `targetDurasiInti` (0 selisih menit!)
 */
export function distributeSintaksDurations(
  bobotList: number[],
  targetDurasiInti: number
): number[] {
  const count = bobotList.length;
  if (count === 0) return [];
  const safeTarget = Math.max(count * 5, targetDurasiInti);
  const totalBobot = bobotList.reduce((acc, b) => acc + (b > 0 ? b : 10), 0);

  // Hitung alokasi awal dengan pembulatan ke kelipatan 5 menit atau integer terdekat
  const rawDurations = bobotList.map((b) => {
    const weight = b > 0 ? b : 10;
    return Math.max(5, Math.round((weight / totalBobot) * safeTarget));
  });

  // Koreksi selisih agar jumlah total tepat sama dengan safeTarget
  const currentSum = rawDurations.reduce((a, b) => a + b, 0);
  let diff = safeTarget - currentSum;

  // Urutkan indeks berdasarkan bobot terbesar ke terkecil untuk mendistribusikan selisih
  const sortedIndices = bobotList
    .map((b, idx) => ({ b, idx }))
    .sort((a, b) => b.b - a.b)
    .map((item) => item.idx);

  let cursor = 0;
  while (diff !== 0 && cursor < 100) {
    const targetIdx = sortedIndices[cursor % count];
    if (diff > 0) {
      rawDurations[targetIdx] += 1;
      diff -= 1;
    } else if (diff < 0 && rawDurations[targetIdx] > 5) {
      rawDurations[targetIdx] -= 1;
      diff += 1;
    }
    cursor++;
  }

  return rawDurations;
}

/**
 * Memformat deskripsi kegiatan langkah inti dengan struktur standar RPP Pembelajaran Mendalam:
 * [Sintaks X: Nama Sintaks (Istilah Inggris)]
 * • Aktivitas Guru: ...
 * • Aktivitas Murid: ...
 */
export function formatSintaksDeskripsi(params: {
  urutanSintaks: number;
  namaSintaks: string;
  namaInggris?: string;
  aktivitasGuru: string;
  aktivitasMurid: string;
}): string {
  const inggrisSuffix =
    params.namaInggris &&
    !params.namaSintaks.toLowerCase().includes(params.namaInggris.toLowerCase())
      ? ` (${params.namaInggris})`
      : "";
  return `[Sintaks ${params.urutanSintaks}: ${params.namaSintaks}${inggrisSuffix}]\n• Aktivitas Guru: ${params.aktivitasGuru.trim()}\n• Aktivitas Murid: ${params.aktivitasMurid.trim()}`;
}

/**
 * Memformat deskripsi kegiatan Awal / Penutup dengan struktur Aktivitas Guru & Aktivitas Murid
 */
export function formatTahapUmumDeskripsi(params: {
  labelTahap: string;
  aktivitasGuru: string;
  aktivitasMurid: string;
}): string {
  return `[${params.labelTahap}]\n• Aktivitas Guru: ${params.aktivitasGuru.trim()}\n• Aktivitas Murid: ${params.aktivitasMurid.trim()}`;
}

/**
 * Mengurai (parse) string deskripsi_kegiatan menjadi komponen terstruktur
 * Mendukung format baru ([Sintaks X: ...] + • Aktivitas Guru + • Aktivitas Murid)
 * maupun format lama ([Sintaks: ...] teks bebas)
 */
export interface ParsedLangkahDeskripsi {
  headerLabel: string | null;
  sintaksHeader: string | null;
  sintaksNomor: number | null;
  urutanSintaks: number | null;
  sintaksNama: string | null;
  namaSintaks: string | null;
  istilahInggris: string | null;
  aktivitasGuru: string;
  aktivitasMurid: string;
  isiUtama: string;
  isStructured: boolean;
  rawText: string;
}

export function parseLangkahDeskripsi(raw: string): ParsedLangkahDeskripsi {
  const text = (raw || "").trim();
  let headerLabel: string | null = null;
  let sintaksNomor: number | null = null;
  let sintaksNama: string | null = null;
  let istilahInggris: string | null = null;
  let body = text;

  const headerMatch = text.match(/^\[([^\]]+)\]\s*/);
  if (headerMatch) {
    headerLabel = headerMatch[1].trim();
    body = text.slice(headerMatch[0].length).trim();

    const stxNumMatch = headerLabel.match(/^Sintaks\s*(\d+)\s*:\s*(.+)$/i);
    if (stxNumMatch) {
      sintaksNomor = parseInt(stxNumMatch[1], 10);
      const rawTitle = stxNumMatch[2].trim();
      const parenMatch = rawTitle.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      if (parenMatch) {
        sintaksNama = parenMatch[1].trim();
        istilahInggris = parenMatch[2].trim();
      } else {
        sintaksNama = rawTitle;
      }
    } else {
      const stxOldMatch = headerLabel.match(/^Sintaks\s*:\s*(.+)$/i);
      if (stxOldMatch) {
        sintaksNama = stxOldMatch[1].trim();
      }
    }
  }

  const guruMatch = body.match(/•\s*Aktivitas Guru\s*:\s*([\s\S]*?)(?=•\s*Aktivitas Murid\s*:|$)/i);
  const muridMatch = body.match(/•\s*Aktivitas Murid\s*:\s*([\s\S]*?)$/i);

  if (guruMatch && muridMatch) {
    return {
      headerLabel,
      sintaksHeader: headerLabel,
      sintaksNomor,
      urutanSintaks: sintaksNomor,
      sintaksNama,
      namaSintaks: sintaksNama,
      istilahInggris,
      aktivitasGuru: guruMatch[1].trim(),
      aktivitasMurid: muridMatch[1].trim(),
      isiUtama: body,
      isStructured: true,
      rawText: text,
    };
  }

  return {
    headerLabel,
    sintaksHeader: headerLabel,
    sintaksNomor,
    urutanSintaks: sintaksNomor,
    sintaksNama,
    namaSintaks: sintaksNama,
    istilahInggris,
    aktivitasGuru: "",
    aktivitasMurid: body,
    isiUtama: body || text,
    isStructured: false,
    rawText: text,
  };
}

/**
 * Mengecek apakah daftar langkah masih menggunakan teks placeholder generik lama
 */
export function isGenericPlaceholderLangkah(langkahList: RppLangkahPayload[]): boolean {
  if (!langkahList || langkahList.length === 0) return true;
  return langkahList.some(
    (l) =>
      l.deskripsi_kegiatan.includes(
        "Murid bersama guru melaksanakan aktivitas pembelajaran sesuai tahapan model"
      ) ||
      l.deskripsi_kegiatan.includes(
        "Murid mengeksplorasi materi melalui stimulus kontekstual, membaca literatur, dan mengidentifikasi pertanyaan-pertanyaan mendasar terkait materi ajar."
      )
  );
}

/**
 * Generator Utama Skenario Pengalaman Belajar (Langkah 4) Berdasarkan Model Pembelajaran yang Dipilih
 */
export function generateModelLangkahList(params: {
  model?: {
    id?: string;
    nama: string;
    sintaks?: Array<{
      urutan: number;
      nama_sintaks: string;
      pengalaman_belajar: PengalamanBelajar;
    }>;
  };
  modelNama?: string | null;
  sintaksDb?: Array<{
    urutan: number;
    nama_sintaks: string;
    pengalaman_belajar: PengalamanBelajar;
  }> | null;
  materiPokok: string;
  topikPembelajaran?: string;
  mapelNama?: string;
  tingkatKelas?: number | string;
  jumlahPertemuan: number;
  alokasiJp: number;
  menitPerJp: number;
  pancaCintaIds: string[];
  masterPancaCinta?: Array<{ id: string; kode?: string; nama: string }>;
  pancaCintaMaster?: Array<{ id: string; kode?: string; nama: string }>;
  modeDistribusi?: ModeDistribusiPertemuan;
}): RppLangkahPayload[] {
  const {
    model,
    modelNama,
    sintaksDb,
    materiPokok,
    topikPembelajaran,
    mapelNama,
    tingkatKelas,
    jumlahPertemuan = 2,
    alokasiJp = 4,
    menitPerJp = 40,
    pancaCintaIds = [],
    masterPancaCinta,
    pancaCintaMaster,
    modeDistribusi = "utuh_per_pertemuan",
  } = params;

  const resolvedModelNama = model?.nama || modelNama || "Project Based Learning (PjBL)";
  const resolvedSintaksDb = model?.sintaks || sintaksDb || [];
  const resolvedMasterPc = masterPancaCinta || pancaCintaMaster || [];

  const materi = (topikPembelajaran || materiPokok || "materi pembelajaran").trim();
  const mapel = (mapelNama || "Mata Pelajaran").trim();
  const spec = getModelPedagogiSpec(resolvedModelNama);
  const isCustomModel = detectModelKode(resolvedModelNama) === "custom";

  const targetDurasiPerPertemuan = Math.max(
    30,
    Math.round((alokasiJp / Math.max(1, jumlahPertemuan)) * menitPerJp)
  );

  // Alokasi waktu Kegiatan Awal & Penutup proporsional terhadap total durasi pertemuan
  const durasiAwal = targetDurasiPerPertemuan >= 70 ? 10 : Math.max(5, Math.round(targetDurasiPerPertemuan * 0.12));
  const durasiPenutup = targetDurasiPerPertemuan >= 70 ? 10 : Math.max(5, Math.round(targetDurasiPerPertemuan * 0.12));
  const targetDurasiInti = Math.max(15, targetDurasiPerPertemuan - durasiAwal - durasiPenutup);

  // Helper mencari nama Panca Cinta dari ID
  const getPcNama = (pcId: string | null): string => {
    if (!pcId) return "Panca Cinta";
    const found = resolvedMasterPc.find((p) => p.id === pcId);
    return found ? (found.kode ? `${found.nama} (${found.kode})` : found.nama) : "Panca Cinta";
  };

  // Siapkan daftar sintaks yang akan dipakai
  const allSintaksRiset: SintaksRisetItem[] = isCustomModel && resolvedSintaksDb.length > 0
    ? resolvedSintaksDb.map((s, idx) => ({
        urutan: s.urutan || idx + 1,
        nama_sintaks: s.nama_sintaks,
        nama_inggris: `Phase ${idx + 1}`,
        pengalaman_belajar: s.pengalaman_belajar || "mengaplikasi",
        prinsip_default:
          s.pengalaman_belajar === "memahami"
            ? ["berkesadaran", "bermakna"]
            : s.pengalaman_belajar === "mengaplikasi"
            ? ["bermakna", "menggembirakan"]
            : ["berkesadaran", "bermakna"],
        bobot_durasi: Math.round(100 / Math.max(1, resolvedSintaksDb.length)),
        fokus_sintaks: `Pelaksanaan tahapan sintaks ${s.nama_sintaks} pada model ${resolvedModelNama}.`,
        indikator_keterlaksanaan: `Terlaksananya aktivitas guru dan murid pada sintaks ${s.nama_sintaks}.`,
        buildAktivitasGuru: ({ materi: m, mapel: mp }) =>
          `Memfasilitasi dan membimbing murid melaksanakan tahapan "${s.nama_sintaks}" terkait materi "${m}" pada pembelajaran ${mp} secara interaktif dan terstruktur.`,
        buildAktivitasMurid: ({ materi: m }) =>
          `Berpartisipasi aktif melaksanakan kegiatan "${s.nama_sintaks}" untuk mendalami dan menguasai materi "${m}" bersama kelompok belajar.`,
        buildAksiKbc: (_ctx, pcNama) =>
          `Mengintegrasikan nilai ${pcNama} melalui sikap santun, kolaboratif, dan penuh kesadaran selama tahapan ${s.nama_sintaks}.`,
      }))
    : spec.sintaks_list.map((sr, idx) => {
        // Sinkronkan nama_sintaks & pengalaman_belajar jika admin mengubahnya di Master Data
        const dbStx = resolvedSintaksDb[idx];
        return {
          ...sr,
          nama_sintaks: dbStx?.nama_sintaks || sr.nama_sintaks,
          pengalaman_belajar: dbStx?.pengalaman_belajar || sr.pengalaman_belajar,
        };
      });

  const result: RppLangkahPayload[] = [];

  for (let p = 1; p <= jumlahPertemuan; p++) {
    const ctx: SintaksRisetContext = {
      materi,
      topik: materi,
      mapel,
      tingkatKelas,
      pertemuanKe: p,
      totalPertemuan: jumlahPertemuan,
    };

    const pcAwalId = pancaCintaIds[0] || null;
    const pcPenutupId = pancaCintaIds[pancaCintaIds.length - 1] || pancaCintaIds[0] || null;

    // 1. KEGIATAN AWAL
    const awalContent = spec.buildKegiatanAwal(ctx);
    result.push({
      pertemuan_ke: p,
      tahap: "awal",
      pengalaman: "memahami",
      deskripsi_kegiatan: formatTahapUmumDeskripsi({
        labelTahap: `Orientasi, Apersepsi & Motivasi Awal — Model ${spec.singkatan}`,
        aktivitasGuru: awalContent.aktivitas_guru,
        aktivitasMurid: awalContent.aktivitas_murid,
      }),
      durasi_menit: durasiAwal,
      urutan: 1,
      prinsip: ["berkesadaran", "menggembirakan"],
      panca_cinta_id: pcAwalId,
      aksi_kbc: awalContent.aksi_kbc,
    });

    // Tentukan sintaks yang dijalankan pada pertemuan ke-p
    let sintaksPertemuan: SintaksRisetItem[] = allSintaksRiset;

    if (
      modeDistribusi === "berjenjang_lintas_pertemuan" &&
      jumlahPertemuan > 1 &&
      allSintaksRiset.length >= 4
    ) {
      // Bagi sintaks lintas pertemuan secara proporsional, namun pastikan setiap pertemuan tetap punya Memahami, Mengaplikasi, Merefleksi
      const totalStx = allSintaksRiset.length;
      const chunkSize = Math.max(2, Math.ceil(totalStx / jumlahPertemuan));
      const startIdx = Math.min(totalStx - 2, (p - 1) * Math.floor(totalStx / jumlahPertemuan));
      const endIdx = p === jumlahPertemuan ? totalStx : Math.min(totalStx, startIdx + chunkSize);
      const sliced = allSintaksRiset.slice(startIdx, endIdx);

      // Pastikan minimal ada 1 memahami, 1 mengaplikasi, 1 merefleksi di pertemuan ini
      const hasMemahami = sliced.some((s) => s.pengalaman_belajar === "memahami");
      const hasMengaplikasi = sliced.some((s) => s.pengalaman_belajar === "mengaplikasi");
      const hasMerefleksi = sliced.some((s) => s.pengalaman_belajar === "merefleksi");

      const enriched = [...sliced];
      if (!hasMemahami && allSintaksRiset[0]) {
        enriched.unshift(allSintaksRiset[0]);
      }
      if (!hasMengaplikasi) {
        const appStx = allSintaksRiset.find((s) => s.pengalaman_belajar === "mengaplikasi");
        if (appStx) enriched.push(appStx);
      }
      if (!hasMerefleksi) {
        const refStx = allSintaksRiset[allSintaksRiset.length - 1];
        if (refStx) enriched.push(refStx);
      }
      sintaksPertemuan = enriched;
    }

    // 2. KEGIATAN INTI (Sesuai Sintaks Model & Distribusi Durasi Presisi)
    const bobotInti = sintaksPertemuan.map((s) => s.bobot_durasi);
    const durasiIntiList = distributeSintaksDurations(bobotInti, targetDurasiInti);

    sintaksPertemuan.forEach((stx, sIdx) => {
      // Distribusikan seluruh Panca Cinta yang dipilih agar 100% terintegrasi di langkah kegiatan
      let stepPcId: string | null = null;
      if (pancaCintaIds.length > 0) {
        // Pastikan setiap Panca Cinta terpilih muncul minimal di salah satu sintaks inti
        if (sIdx < pancaCintaIds.length) {
          stepPcId = pancaCintaIds[sIdx];
        } else if (stx.pengalaman_belajar === "mengaplikasi" || stx.pengalaman_belajar === "merefleksi") {
          stepPcId = pancaCintaIds[(sIdx + p) % pancaCintaIds.length];
        }
      }

      const pcNama = getPcNama(stepPcId);
      const aktivitasGuru = stx.buildAktivitasGuru(ctx);
      const aktivitasMurid = stx.buildAktivitasMurid(ctx);

      result.push({
        pertemuan_ke: p,
        tahap: "inti",
        pengalaman: stx.pengalaman_belajar,
        deskripsi_kegiatan: formatSintaksDeskripsi({
          urutanSintaks: stx.urutan,
          namaSintaks: stx.nama_sintaks,
          namaInggris: stx.nama_inggris,
          aktivitasGuru,
          aktivitasMurid,
        }),
        durasi_menit: durasiIntiList[sIdx] || 10,
        urutan: sIdx + 2,
        prinsip: stx.prinsip_default,
        panca_cinta_id: stepPcId,
        aksi_kbc: stepPcId ? stx.buildAksiKbc(ctx, pcNama) : null,
      });
    });

    // 3. KEGIATAN PENUTUP
    const penutupContent = spec.buildKegiatanPenutup(ctx);
    result.push({
      pertemuan_ke: p,
      tahap: "penutup",
      pengalaman: "merefleksi",
      deskripsi_kegiatan: formatTahapUmumDeskripsi({
        labelTahap: `Refleksi Cinta, Konfirmasi & Penutup — Model ${spec.singkatan}`,
        aktivitasGuru: penutupContent.aktivitas_guru,
        aktivitasMurid: penutupContent.aktivitas_murid,
      }),
      durasi_menit: durasiPenutup,
      urutan: sintaksPertemuan.length + 2,
      prinsip: ["berkesadaran", "bermakna"],
      panca_cinta_id: pcPenutupId,
      aksi_kbc: penutupContent.aksi_kbc,
    });
  }

  return result;
}
