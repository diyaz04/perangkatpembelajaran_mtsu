// src/lib/kbc-pedagogi.ts
// Konstanta Pedagogis Panduan Kurikulum Berbasis Cinta (KBC) & Madrasah Maju Bermutu Mendunia

import type { MetodePengurutanAtp } from "@/types/database";

export interface KkoItem {
  kategori: string;
  tingkat: string;
  kataKerja: string[];
}

/**
 * Taksonomi SOLO (Structure of Observed Learning Outcomes)
 * Sangat direkomendasikan dalam perumusan kompetensi mendalam KBC
 */
export const TAKSONOMI_SOLO = [
  {
    tingkat: "Unistruktural",
    deskripsi: "Siswa memahami satu aspek sederhana secara terisolasi.",
    kategori: "Kognitif Awal",
    kko: [
      "Menyebutkan",
      "Mengidentifikasi",
      "Menghafal",
      "Menamai",
      "Mencatat",
      "Menunjukkan",
      "Mendefinisikan",
    ],
  },
  {
    tingkat: "Multistruktural",
    deskripsi: "Siswa memahami beberapa aspek independen tanpa melihat keterkaitannya.",
    kategori: "Kognitif Berkembang",
    kko: [
      "Menguraikan",
      "Mengklasifikasikan",
      "Mendaftar",
      "Menerangkan",
      "Menggabungkan",
      "Membuat bagan",
      "Memilih",
    ],
  },
  {
    tingkat: "Relasional",
    deskripsi: "Siswa mengintegrasikan beberapa aspek dan memahami keterkaitan serta sebab-akibat.",
    kategori: "Kognitif Mendalam",
    kko: [
      "Membandingkan",
      "Mengaitkan",
      "Menganalisis",
      "Menerapkan",
      "Mengintegrasikan",
      "Menjelaskan sebab-akibat",
      "Menghubungkan konsep",
      "Membedakan",
    ],
  },
  {
    tingkat: "Abstrak Meluas",
    deskripsi: "Siswa mampu menggeneralisasi ke konsep baru di luar lingkup yang diajarkan, berefleksi dan mencipta.",
    kategori: "Penalaran Tingkat Tinggi (HOTS)",
    kko: [
      "Menggeneralisasi",
      "Merumuskan hipotesis",
      "Merefleksi",
      "Mencipta gagasan",
      "Mengevaluasi kritis",
      "Memprediksi solusi",
      "Mengonseptualisasikan",
    ],
  },
];

/**
 * Taksonomi Bloom Revisi (Anderson & Krathwohl)
 * Kognitif (C1-C6), Afektif (A1-A5), Psikomotorik (P1-P5)
 */
export const TAKSONOMI_BLOOM = [
  {
    kategori: "Kognitif (C1 Mengingat)",
    kko: ["Mengingat", "Menghafal", "Mengenali", "Menyalin", "Menyatakan kembali"],
  },
  {
    kategori: "Kognitif (C2 Memahami)",
    kko: ["Memahami", "Menjelaskan", "Merangkum", "Menafsirkan", "Memberi contoh"],
  },
  {
    kategori: "Kognitif (C3 Mengaplikasikan)",
    kko: ["Mengaplikasikan", "Mempraktikkan", "Menghitung", "Melaksanakan", "Menggunakan"],
  },
  {
    kategori: "Kognitif (C4 Menganalisis)",
    kko: ["Menganalisis", "Memeriksa", "Membedakan", "Menelaah", "Mengkritisi"],
  },
  {
    kategori: "Kognitif (C5 Mengevaluasi)",
    kko: ["Mengevaluasi", "Menilai", "Menimbang", "Memvalidasi", "Memutuskan"],
  },
  {
    kategori: "Kognitif (C6 Mencipta)",
    kko: ["Mencipta", "Merancang", "Mengonstruksi", "Memproduksi", "Mengembangkan"],
  },
  {
    kategori: "Afektif (Sikap & Nilai)",
    kko: ["Menghayati", "Menerima", "Merespons", "Menghargai", "Membiasakan", "Meneladani"],
  },
  {
    kategori: "Psikomotorik (Keterampilan)",
    kko: ["Menirukan", "Memanipulasi", "Mempresentasikan", "Meragakan", "Menyajikan", "Mendemonstrasikan"],
  },
];

/**
 * 6 Metode Pengurutan ATP sesuai Panduan PPA Madrasah
 */
export interface InfoMetodePengurutan {
  id: MetodePengurutanAtp;
  nama: string;
  ringkasan: string;
  penjelasan: string;
  contoh: string;
}

export const METODE_PENGURUTAN_ATP: InfoMetodePengurutan[] = [
  {
    id: "konkret_ke_abstrak",
    nama: "Konkret → Abstrak",
    ringkasan: "Dimulai dari hal nyata di lingkungan murid menuju teori abstrak.",
    penjelasan: "Pengurutan dari hal faktual atau fenomena sehari-hari yang dialami langsung oleh murid, kemudian bergerak perlahan menuju konsep abstrak, teoritis, dan generalisasi.",
    contoh: "Contoh: Mengamati perilaku tolong-menolong di madrasah sebelum mendalami konsep teologis ukhuwah islamiyah.",
  },
  {
    id: "deduktif",
    nama: "Deduktif (Umum → Khusus)",
    ringkasan: "Dimulai dari prinsip/konsep besar lalu diuraikan ke contoh spesifik.",
    penjelasan: "Pendekatan deduktif memperkenalkan kaidah pokok, dalil, atau hukum dasar terlebih dahulu, kemudian peserta didik menguraikannya ke dalam contoh-contoh kasus dan aplikasi praktis.",
    contoh: "Contoh: Mempelajari hakikat hukum thaharah secara umum sebelum merinci tata cara wudu, tayamum, dan mandi wajib.",
  },
  {
    id: "mudah_ke_sulit",
    nama: "Mudah → Sulit",
    ringkasan: "Mulai dari materi sederhana sebelum melangkah ke materi rumit.",
    penjelasan: "Pengurutan pembelajaran diawali dengan keterampilan atau konten yang sederhana dan mendasar, lalu secara bertahap ditingkatkan tingkat kompleksitas dan kedalamannya.",
    contoh: "Contoh: Membaca teks Al-Qur'an tartil ayat pendek sebelum menganalisis hukum tajwid mad lazim pada ayat panjang.",
  },
  {
    id: "hierarki",
    nama: "Hierarki (Prasyarat)",
    ringkasan: "Materi A harus dikuasai sebelum murid bisa mempelajari materi B.",
    penjelasan: "Pengurutan berdasarkan ketergantungan prasyarat logis. Suatu kompetensi tidak dapat dipelajari secara optimal tanpa terlebih dahulu menguasai kompetensi dasar sebelumnya.",
    contoh: "Contoh: Menguasai rukun iman dan tauhid sebelum mengkaji adab dan implementasi sosial akidah.",
  },
  {
    id: "prosedural",
    nama: "Prosedural (Tahapan Kerja)",
    ringkasan: "Langkah demi langkah berurutan sesuai prosedur baku.",
    penjelasan: "Pengurutan yang mengikuti langkah-langkah kerja atau tahapan proses yang berurutan dalam melaksanakan suatu ibadah, karya, atau eksperimen ilmiah.",
    contoh: "Contoh: Tata cara penyelenggaraan jenazah (memandikan → mengafani → menyalatkan → memakamkan).",
  },
  {
    id: "scaffolding",
    nama: "Scaffolding (Dukungan Bertahap)",
    ringkasan: "Dukungan penuh di awal yang dikurangi bertahap seiring kemandirian.",
    penjelasan: "Pendekatan pembelajaran di mana guru memberikan bimbingan intensif pada TP awal, kemudian perlahan membiarkan peserta didik mandiri dan berkolaborasi secara otonom di TP selanjutnya.",
    contoh: "Contoh: Menulis teks deskripsi dengan panduan template terbimbing sebelum membuat tulisan bebas mandiri.",
  },
];

/**
 * Pertanyaan Reflektif Panduan Kemenag untuk Langkah 1 Analisis CP
 */
export const PERTANYAAN_REFLEKTIF = [
  {
    judul: "Kompetensi Inti Murid",
    pertanyaan: "Kompetensi atau kemampuan kunci apa yang paling esensial harus dimiliki murid setelah menuntaskan elemen CP ini?",
    panduan: "Fokuskan pada kemampuan berpikir kritis dan karakter yang bertahan lama dalam kehidupan murid.",
  },
  {
    judul: "Kata Kunci & Ruang Lingkup",
    pertanyaan: "Kata kunci penting dan konsep esensial apa yang menjadi inti materi?",
    panduan: "Pilih 3-6 kata kunci spesifik yang menjadi poros pemahaman materi elemen ini.",
  },
  {
    judul: "Dimensi Profil Lulusan (DPL)",
    pertanyaan: "Dimensi Profil Lulusan mana yang paling relevan dan kuat diasah melalui elemen ini?",
    panduan: "Pilih 2-4 DPL yang secara organik terhubung (misal: Keimanan & Ketakwaan, Penalaran Kritis, Kolaborasi).",
  },
  {
    judul: "Integrasi Nilai Panca Cinta",
    pertanyaan: "Bagaimana materi ini menumbuhkan rasa cinta (Cinta Allah, Ilmu, Lingkungan, Tanah Air, Sesama)?",
    panduan: "Gali pesan cinta dan akhlak mulia yang melekat pada materi, bukan sekadar hafalan teoritis.",
  },
  {
    judul: "Jembatan Pemahaman & Hambatan",
    pertanyaan: "Bagian mana yang berpotensi sulit dipahami murid dan memerlukan jembatan pemahaman?",
    panduan: "Identifikasi miskonsepsi umum murid agar dapat diantisipasi dalam rumusan tujuan pembelajaran.",
  },
];
