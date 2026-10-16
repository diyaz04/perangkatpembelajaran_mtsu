import type { KesiapanMuridData, LampiranData } from "@/app/(app)/modul-ajar/actions";
import { getModelPedagogiSpec } from "./rpp-model-pedagogi";

/**
 * Menghasilkan saran teks otomatis untuk Kesiapan & Kebutuhan Murid (Langkah 2)
 * Berdasarkan materi pokok dan mata pelajaran yang sedang dikerjakan.
 */
export function generateDefaultKesiapanMurid(materiPokok: string, mapelNama?: string): KesiapanMuridData {
  const materi = materiPokok?.trim() || "materi ini";
  const mapel = mapelNama?.trim() || "";
  const mapelStr = mapel ? ` pada mata pelajaran ${mapel}` : "";

  return {
    pengetahuan_awal: `Sebagian besar murid telah memiliki pengenalan awal mengenai ${materi}${mapelStr}, namun sebagian lainnya masih memerlukan bimbingan dalam memahami konsep esensial, latar belakang, dan hikmah pembelajarannya secara mendalam.`,
    minat: `Murid memiliki antusiasme dan minat belajar yang tinggi saat materi ${materi}${mapelStr} dieksplorasi melalui media visual, penelusuran studi kasus kontekstual, diskusi interaktif, serta kegiatan kolaboratif yang relevan dengan kehidupan sehari-hari.`,
    kebutuhan: `Terdapat variasi modalitas belajar (visual, auditori, dan kinestetik); membutuhkan diferensiasi proses berupa pendampingan bertahap (scaffolding) bagi murid yang memerlukan penguatan pemahaman ${materi}, serta tantangan penalaran kritis/pengayaan bagi murid yang lebih cepat memahami.`,
    strategi_asesmen_awal: `Melaksanakan asesmen awal diagnostik lisan dan pertanyaan pemantik singkat terkait ${materi} di awal pertemuan. Tindak lanjut: pembentukan kelompok belajar heterogen dengan pendampingan terbimbing dan tutor sebaya.`,
    latar_belakang: `Murid madrasah dengan keragaman latar belakang sosial budaya, memiliki kecenderungan positif terhadap pembelajaran yang mengintegrasikan ilmu pengetahuan dengan keteladanan akhlak dan adab terpuji.`,
    tindak_lanjut: `Pengelompokan murid secara fleksibel berdasarkan kesiapan belajar awal untuk menentukan tingkat dukungan dan pendampingan guru selama proses pembelajaran kolaboratif.`,
  };
}

/**
 * Menghasilkan saran karakteristik materi dan benang merah KBC (Langkah 2)
 */
export function generateDefaultKarakteristik(materiPokok: string, mapelNama?: string) {
  const materi = materiPokok?.trim() || "materi ini";
  const mapel = mapelNama?.trim() || "";
  const mapelStr = mapel ? ` pada mata pelajaran ${mapel}` : "";

  return {
    karakteristik_materi: `Materi ${materi}${mapelStr} memuat dimensi faktual, konseptual, dan aplikatif yang menuntut penalaran kritis, pemahaman mendalam, serta internalisasi nilai-nilai karakter dalam kehidupan sehari-hari murid madrasah.`,
    benang_merah_kbc: `Menghubungkan esensi materi ${materi} dengan penanaman nilai Panca Cinta (Cinta Allah dan Rasul, Cinta Ilmu, Cinta Diri dan Sesama, Cinta Lingkungan, dan Cinta Bangsa) guna menumbuhkan kesadaran spiritual, integritas, dan empati sosial kemanusiaan.`,
  };
}

/**
 * Menghasilkan isian saran lengkap untuk Lampiran Modul Ajar (Langkah 6)
 * Relevan dengan materi, mata pelajaran, tingkat kelas murid, dan model pembelajaran terpilih.
 */
export function generateDefaultLampiran(
  materiPokok: string,
  mapelNama?: string,
  tingkatKelas?: number | string,
  modelNama?: string | null
): LampiranData {
  const materi = materiPokok?.trim() || "Materi Pembelajaran";
  const mapel = mapelNama?.trim() || "Mata Pelajaran";
  const kelas = tingkatKelas
    ? tingkatKelas === 7
      ? "VII"
      : tingkatKelas === 8
      ? "VIII"
      : tingkatKelas === 9
      ? "IX"
      : `Kelas ${tingkatKelas}`
    : "Fase D";

  const lkpdText = modelNama
    ? getModelPedagogiSpec(modelNama).buildLkpdKhusus(materi, mapel, kelas)
    : `A. LEMBAR KERJA PESERTA DIDIK (LKPD) — AKTIVITAS KOLABORATIF
Mata Pelajaran: ${mapel} | Kelas: ${kelas} | Materi: ${materi}

1. Petunjuk Aktivitas:
   a. Berdoalah bersama sebelum memulai kegiatan belajar.
   b. Bentuklah kelompok diskusi yang terdiri dari 4-5 murid secara heterogen.
   c. Cermati sumber bacaan, lembar materi, atau tayangan terkait "${materi}".
   d. Diskusikan pertanyaan pemandu bersama teman sekelompok dengan semangat kerja sama dan saling memuliakan (Panca Cinta).

2. Lembar Analisis & Diskusi:
   - Identifikasi dan jelaskan poin-poin utama yang melandasi materi ${materi}!
   - Bagaimana keterkaitan nilai dan hikmah dari materi ${materi} terhadap pembentukan karakter kita sebagai murid madrasah?
   - Susunlah kesimpulan bersama kelompok dalam bentuk peta konsep (mind map) atau resume kreatif!

3. Lembar Refleksi Individu:
   - Hikmah atau pemahaman baru apa yang saya dapatkan dari pembelajaran materi ${materi} hari ini?
   - Satu aksi konkret yang akan saya lakukan sebagai wujud pengamalan nilai cinta dan ilmu di lingkungan madrasah/keluarga.`;

  return {
    lkpd: lkpdText,
    bahan_bacaan: `A. BAHAN BACAAN GURU:
1. Panduan Pembelajaran dan Asesmen Kurikulum Berbasis Cinta (KBC) — Direktorat Jenderal Pendidikan Islam Kementerian Agama RI.
2. Buku Panduan Guru Mata Pelajaran ${mapel} Kelas ${kelas} MTs, Kementerian Agama RI.
3. Referensi Konseptual & Tematik: Kajian mendalam seputar materi esensial ${materi}, latar belakang historis/teoretis, serta panduan integrasi nilai Panca Cinta KBC dalam pembelajaran mendalam (berkesadaran, bermakna, dan menggembirakan).

B. BAHAN BACAAN PESERTA DIDIK:
1. Buku Teks Utama Siswa ${mapel} Kelas ${kelas} Madrasah Tsanawiyah, Kementerian Agama RI.
2. Ringkasan Materi Pokok ${materi}: Uraian materi esensial, dalil/fakta pendukung, studi kasus kontekstual inspiratif, dan refleksi hikmah kehidupan ramah remaja madrasah.`,

    glosarium: `1. ${materi}: Topik inti materi pembelajaran yang dibahas dan dipelajari dalam modul ajar ini.
2. Panca Cinta: Fondasi nilai Kurikulum Berbasis Cinta yang menumbuhkan rasa cinta kepada Allah & Rasul-Nya, cinta ilmu, cinta diri & sesama, cinta lingkungan, dan cinta bangsa.
3. Dimensi Profil Lulusan (DPL): Profil karakter dan kompetensi utuh murid madrasah meliputi keimanan, penalaran kritis, kreativitas, kemandirian, dan kepedulian sosial.
4. Diferensiasi Pembelajaran: Penyesuaian strategi pembelajaran (konten, proses, produk) berdasarkan keragaman kesiapan, minat, dan profil belajar murid.
5. Asesmen Formatif: Asesmen berkelanjutan untuk memantau proses belajar, memberikan umpan balik perbaikan, dan menguatkan pemahaman murid.`,

    daftar_pustaka: `1. Kementerian Agama Republik Indonesia. (2024). Buku Teks Siswa ${mapel} untuk MTs Kelas ${kelas}. Jakarta: Direktorat KSKK Madrasah, Ditjen Pendis.
2. Kementerian Agama Republik Indonesia. (2025). Panduan Guru: Pembelajaran dan Asesmen Kurikulum Berbasis Cinta (KBC) pada Madrasah Tsanawiyah. Jakarta: Ditjen Pendis.
3. Keputusan Direktur Jenderal Pendidikan Islam Nomor 6077 Tahun 2025 tentang Pedoman Kurikulum Berbasis Cinta pada Madrasah.
4. Portal Pembelajaran dan Sumber Digital Kementerian Agama RI (https://madrasah.kemenag.go.id).`,
    rubrik_penilaian: "",
  };
}
