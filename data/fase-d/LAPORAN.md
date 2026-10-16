# Laporan Riset Bank Data Fase D (MTs / SMP) TA 2026/2027

> **Status Dokumen:** Seluruh Sesi (Sesi 1, 2, 3, dan 4) SELESAI 100% — Seluruh 16 Mata Pelajaran Lengkap & Tervalidasi  
> **Tanggal Penyelesaian:** 14 Oktober 2026  
> **Versi Bank Data:** `2026-2027-v1`  
> **Penyusun:** Sistem Kurikulum AI Antigravity  

---

## 1. Ringkasan Eksekutif

Tahap **11A (Riset Bank Data Fase D MTs/SMP untuk Tahun Ajaran 2026/2027)** telah berhasil diselesaikan secara tuntas dan menyeluruh. Seluruh bank data kurikulum telah terhimpun secara terstruktur di folder `data/fase-d/` tanpa mengubah kode aplikasi (`src/`).

### Ringkasan Pencapaian:
- **Total Mata Pelajaran:** 16 Mata Pelajaran (100% Lengkap: 5 PAI & Bhs Arab, 5 Mapel Umum Kluster 1, 5 Mapel Umum Kluster 2, 1 Muatan Lokal).
- **Total File Data JSON:** 23 File (Semua berstatus valid JSON & tervalidasi skema mendalam via `data/_tools/validate_json.js`).
- **Total Bab/Materi Terpetakan:** 311 Bab/Materi terstruktur per tingkat (Kelas VII, VIII, IX) dan per semester (Ganjil & Genap).
- **Total Agregat Entri Database:** 363 entri data komprehensif.
- **Integrasi Karakter Kemenag:** Seluruh 311 bab telah dipetakan secara kontekstual dengan pilar **Panca Cinta (KBC)** dan **Dimensi Profil Lulusan (DPL)** Madrasah.

---

## 2. Landasan Regulasi & Kebijakan TA 2026/2027

Riset kurikulum ini berpijak secara ketat dan verbatim pada payung hukum serta regulasi resmi yang berlaku efektif untuk Tahun Ajaran 2026/2027:

| Kode Regulasi | Nomor & Judul Regulasi | Penerbit | Cakupan & Status Berlaku |
|---|---|---|---|
| **BSKAP-046-2025** | Keputusan Kepala BSKAP No. 046/H/KR/2025 tentang Capaian Pembelajaran PAUD, Dikdas, dan Dikmen pada Kurikulum Merdeka (16 Juli 2025) | Kemendikdasmen (BSKAP) | **BERLAKU RESMI**. Standar rujukan Capaian Pembelajaran (CP) utama untuk seluruh mapel umum Fase D (Pancasila, Bhs Indonesia, Matematika, IPA, IPS, Bhs Inggris, PJOK, Seni Budaya, Informatika, Prakarya). |
| **BKPDM-020-2026** | Keputusan Kepala BKPDM No. 020 Tahun 2026 tentang Perubahan atas Keputusan BSKAP No. 046/H/KR/2025 (15 Januari 2026) | Kemendikdasmen | **BERLAKU**. Menegaskan bahwa CP mapel umum Fase D tetap merujuk penuh pada naskah definitif BSKAP 046/H/KR/2025. |
| **SK-DIRJEN-PENDIS-9941-2025** | Keputusan Dirjen Pendis No. 9941 Tahun 2025 tentang Capaian Pembelajaran PAI dan Bahasa Arab pada Madrasah (15 Agustus 2025) | Ditjen Pendis Kemenag RI | **BERLAKU RESMI**. Standar CP definitif untuk seluruh mata pelajaran rumpun PAI (Al-Qur'an Hadis, Akidah Akhlak, Fikih, SKI) dan Bahasa Arab madrasah. |
| **KMA-1503-2025** | Keputusan Menteri Agama RI No. 1503 Tahun 2025 tentang Pedoman Kurikulum Madrasah (30 Juni 2025) | Kementerian Agama RI | **BERLAKU RESMI**. Menetapkan struktur kurikulum, alokasi beban belajar 41 JP/minggu MTs, kalender madrasah, dan 8 Dimensi Profil Lulusan (DPL). |
| **KEPDIRJEN-6077-2025** | Keputusan Dirjen Pendis No. 6077 Tahun 2025 tentang Petunjuk Teknis Implementasi Kurikulum Berbasis Cinta (KBC) pada Madrasah (20 Agustus 2025) | Ditjen Pendis Kemenag RI | **BERLAKU RESMI**. Standar integrasi 5 pilar Panca Cinta ke dalam perencanaan pembelajaran (deep learning), ATP, dan Modul Ajar/RPP. |
| **KMA-512-2026** | Keputusan Menteri Agama RI No. 512 Tahun 2026 tentang Penguatan Karakter Madrasah melalui Nilai Panca Cinta (10 Februari 2026) | Kementerian Agama RI | **BERLAKU RESMI**. Menstandarkan internalisasi nilai-nilai mahabbah/cinta dalam budaya madrasah. |
| **PERGUB-JABAR-173-2014** | Peraturan Gubernur Jawa Barat No. 173 Tahun 2014 tentang Pelaksanaan Muatan Lokal Bahasa dan Sastra Sunda | Pemerintah Provinsi Jawa Barat | **BERLAKU RESMI**. Dasar hukum standar isi dan capaian pembelajaran muatan lokal Bahasa dan Sastra Sunda jenjang SMP/MTs di Jawa Barat. |

---

## 3. Struktur Kurikulum MTs & Beban Belajar (KMA 1503/2025)

Alokasi jam pelajaran (JP) per minggu intrakurikuler jenjang MTs Fase D:

| No | Mata Pelajaran | Kelompok | Kls VII (JP) | Kls VIII (JP) | Kls IX (JP) | Status Riset |
|---|---|---|:---:|:---:|:---:|:---:|
| 1 | **Al-Qur'an Hadis** | PAI | 2 | 2 | 2 | **LENGKAP** (Sesi 2) |
| 2 | **Akidah Akhlak** | PAI | 2 | 2 | 2 | **LENGKAP** (Sesi 2) |
| 3 | **Fikih** | PAI | 2 | 2 | 2 | **LENGKAP** (Sesi 2) |
| 4 | **Sejarah Kebudayaan Islam (SKI)** | PAI | 2 | 2 | 2 | **LENGKAP** (Sesi 2) |
| 5 | **Bahasa Arab** | Bahasa Arab | 3 | 3 | 3 | **LENGKAP** (Sesi 2) |
| 6 | **Pendidikan Pancasila** | Umum | 2 | 2 | 2 | **LENGKAP** (Sesi 3) |
| 7 | **Bahasa Indonesia** | Umum | 5 | 5 | 5 | **LENGKAP** (Sesi 3) |
| 8 | **Matematika** | Umum | 4 | 4 | 4 | **LENGKAP** (Sesi 3) |
| 9 | **Ilmu Pengetahuan Alam (IPA)** | Umum | 4 | 4 | 4 | **LENGKAP** (Sesi 3) |
| 10 | **Ilmu Pengetahuan Sosial (IPS)** | Umum | 3 | 3 | 3 | **LENGKAP** (Sesi 3) |
| 11 | **Bahasa Inggris** | Umum | 3 | 3 | 3 | **LENGKAP** (Sesi 4) |
| 12 | **PJOK** | Umum | 2 | 2 | 2 | **LENGKAP** (Sesi 4) |
| 13 | **Informatika** | Umum | 2 | 2 | 2 | **LENGKAP** (Sesi 4) |
| 14 | **Seni Budaya** | Umum | 2 | 2 | 2 | **LENGKAP** (Sesi 4) |
| 15 | **Prakarya** | Umum | 2 | 2 | 2 | **LENGKAP** (Sesi 4) |
| 16 | **Muatan Lokal (Bahasa Sunda)** | Muatan Lokal | 2 | 2 | 2 | **LENGKAP** (Sesi 4) |
| **Total Beban Belajar Intrakurikuler** | | | **41** | **41** | **41** | **16/16 Selesai** |

---

## 4. Rangkuman Detail Hasil Riset Tiap Mata Pelajaran

### A. Rumpun PAI & Bahasa Arab (Sesi 2)
1. **Al-Qur'an Hadis (`al-quran-hadis.json`):**
   - 3 Elemen: *Ilmu Tajwid*, *Al-Qur'an*, *Hadis*.
   - 18 Bab materi (Tajwid mad far'i/gharib, ayat kauniyah, infak, kelestarian alam, muamalah adil, thalabul ilmi).
   - Sumber: SK Dirjen Pendis No. 9941/2025 & Buku Siswa Kemenag RI.
2. **Akidah Akhlak (`akidah-akhlak.json`):**
   - 4 Elemen: *Akidah*, *Akhlak*, *Adab*, *Kisah Keteladanan*.
   - 29 Bab materi (Rukun iman, sifat Allah, malaikat, hari akhir, qadha-qadar, akhlak karimah, etika bermedia digital, keteladanan nabi & sahabat).
   - Sumber: SK Dirjen Pendis No. 9941/2025 & Buku Siswa Kemenag RI.
3. **Fikih (`fikih.json`):**
   - 2 Elemen Terpadu: *Fikih Ibadah*, *Fikih Muamalah*.
   - 22 Bab materi (Thaharah, shalat, zakat, puasa, haji-umrah, sembelihan kurban/akikah halal, jenazah, muamalah adil bebas riba).
   - Sumber: SK Dirjen Pendis No. 9941/2025 & Buku Siswa Kemenag RI.
4. **Sejarah Kebudayaan Islam (`ski.json`):**
   - 5 Elemen Periodisasi: *Periode Rasulullah*, *Khulafaur Rasyidin*, *Klasik (Umayyah & Abbasiyah)*, *Pertengahan (Ayyubiyah)*, *Islam Nusantara*.
   - 18 Bab materi (Fase Makkah/Madinah, ilmuwan muslim klasik, Walisanga, pesantren, pendiri ormas Islam).
   - Sumber: SK Dirjen Pendis No. 9941/2025 & Buku Siswa Kemenag RI.
5. **Bahasa Arab (`bahasa-arab.json`):**
   - 4 Elemen Kemahiran: *Istimā'*, *Kalām*, *Qirā'ah*, *Kitābah wa 'Ardh*.
   - 18 Dars tematik (Ta'aruf, madrasah, jam, hobi, profesi, tahun baru hijriyah, lingkungan hidup, keindahan alam).
   - Sumber: SK Dirjen Pendis No. 9941/2025 & Buku Siswa Kemenag RI.

### B. Rumpun Mata Pelajaran Umum Kluster 1 (Sesi 3)
6. **Pendidikan Pancasila (`pendidikan-pancasila.json`):**
   - 4 Elemen: *Pancasila*, *UUD NRI 1945*, *Bhinneka Tunggal Ika*, *NKRI*.
   - 16 Bab materi (Sejarah BPUPKI/PPKI, nilai sila, hierarki hukum, konstitusi, kebebasan berpendapat etis, kearifan lokal, bela negara).
   - Sumber: BSKAP No. 046/H/KR/2025 & Buku Siswa Kemendikbudristek.
7. **Bahasa Indonesia (`bahasa-indonesia.json`):**
   - 4 Elemen: *Menyimak*, *Membaca dan Memirsa*, *Berbicara dan Mempresentasikan*, *Menulis*.
   - 18 Bab materi ragam teks (Deskripsi, puisi rakyat, cerita fantasi, prosedur, berita, tanggapan, ulasan, eksposisi, persuasi).
   - Sumber: BSKAP No. 046/H/KR/2025 & Buku Siswa Kemendikbudristek.
8. **Matematika (`matematika.json`):**
   - 5 Elemen: *Bilangan*, *Aljabar*, *Pengukuran*, *Geometri*, *Analisis Data dan Peluang*.
   - 16 Bab materi (Bilangan bulat/rasional, perbandingan, SPLDV, persamaan kuadrat, Pythagoras, lingkaran, transformasi geometri, statistika, peluang).
   - Sumber: BSKAP No. 046/H/KR/2025 & Buku Siswa Kemendikbudristek.
9. **Ilmu Pengetahuan Alam / IPA (`ipa.json`):**
   - 2 Elemen Terpadu: *Pemahaman IPA*, *Keterampilan Proses Sains*.
   - 20 Bab materi (Metode ilmiah, zat dan wujud, gerak dan gaya, suhu dan kalor, sel & organisasi tubuh, ekologi lingkungan, struktur bumi/tata surya, getaran-gelombang-bunyi-cahaya, sistem peredaran darah/pencernaan/ekskresi, pewarisan sifat, bioteknologi ramah lingkungan).
   - Sumber: BSKAP No. 046/H/KR/2025 & Buku Siswa Kemendikbudristek.
10. **Ilmu Pengetahuan Sosial / IPS (`ips.json`):**
    - 2 Elemen Terpadu: *Pemahaman Konsep IPS*, *Keterampilan Proses Inkuiri*.
    - 12 Tema besar terpadu (Keluarga awal kehidupan, keragaman lingkungan alam, potensi ekonomi lingkungan, kemajemukan masyarakat, dinamika kependudukan, pembangunan ekonomi nusantara, perdagangan internasional, revolusi industri & globalisasi).
    - Sumber: BSKAP No. 046/H/KR/2025 & Buku Siswa Kemendikbudristek.

### C. Rumpun Mata Pelajaran Umum Kluster 2 & Mulok (Sesi 4)
11. **Bahasa Inggris (`bahasa-inggris.json`):**
    - 3 Elemen: *Menyimak – Berbicara (Listening – Speaking)*, *Membaca – Memirsa (Reading – Viewing)*, *Menulis – Mempresentasikan (Writing – Presenting)*.
    - 15 Chapters dari buku *English for Nusantara* (About Me, Culinary and Me, Home Sweet Home, School Activities, Independence Day Games, Kindness Stories, Save the Earth, Plastic Waste, Bekantan & Wildlife Report, Taking Trips, Upcycling Materials, Digital Safety & Netiquette).
    - Sumber: BSKAP No. 046/H/KR/2025 & Buku *English for Nusantara* Kemendikbudristek.
12. **PJOK (`pjok.json`):**
    - 4 Elemen Terkini (BSKAP 046/2025): *Terampil Bergerak*, *Belajar Melalui Gerak*, *Bergaya Hidup Aktif*, *Memilih Hidup yang Menyehatkan*.
    - 24 Bab komprehensif (Bola besar, bola kecil, atletik jalan/lari/lompat/lempar, bela diri pencak silat dan seni jurus tunggal baku, kebugaran jasmani sirkuit, senam lantai, aktivitas air & renang gaya dada/bebas, pencegahan NAPZA/rokok, P3K darurat jalan raya, pola makan halal-thayyib).
    - Sumber: BSKAP No. 046/H/KR/2025 & Buku Siswa PJOK Kemendikbudristek.
13. **Seni Budaya (`seni-budaya.json`):**
    - 5 Elemen Artistik: *Mengalami*, *Merefleksikan*, *Berpikir dan Bekerja Artistik*, *Menciptakan*, *Berdampak*.
    - 17 Bab Seni Rupa & Budaya Nusantara (Flora/fauna ciptaan Allah, ragam hias nusantara, batik jumputan/tulis pewarna alami, tipografi & kaligrafi Arab kontemporer, poster ekologis, model anatomi, komik edukatif islami, seni patung, seni grafis cukil/sablon, eco-art instalasi limbah, tata artistik teater tradisi, pameran seni madrasah).
    - Sumber: BSKAP No. 046/H/KR/2025 & Buku Siswa Seni Rupa Kemendikbudristek.
14. **Informatika (`informatika.json`):**
    - 8 Elemen Komputasi Resmi: *Berpikir Komputasional (BK)*, *TIK*, *Sistem Komputer (SK)*, *Jaringan Komputer & Internet (JKI)*, *Analisis Data (AD)*, *Algoritma & Pemrograman (AP)*, *Dampak Sosial Informatika (DSI)*, *Praktik Lintas Bidang (PLB)*.
    - 24 Bab materi (Dekomposisi, pola biner, antrean/tumpukan/graf/pohon, integrasi office kolaboratif, siklus Von Neumann, IP address & enkripsi sederhana, spreadsheet fungsi logika IF/VLOOKUP, pemrograman visual Scratch/Blockly, dasar pemrograman teks Python, IoT sensor mikrokontroler, etika AI dalam Islam, privasi UU PDP, proyek artefak cerdas madrasah hijau).
    - Sumber: BSKAP No. 046/H/KR/2025 & Buku Siswa Informatika Kemendikbudristek.
15. **Prakarya (`prakarya.json`):**
    - 4 Elemen Inti: *Observasi & Eksplorasi*, *Desain/Perencanaan*, *Produksi*, *Refleksi & Evaluasi*.
    - 24 Bab mencakup 4 Aspek Lengkap:
      - *Kerajinan:* Serat alam, limbah lunak organik/anorganik, bahan lunak alami/sabun, limbah keras, kayu/bambu nusantara, media campuran resin.
      - *Rekayasa:* Miniatur rumah adat, penjernih air bertingkat, bel listrik pintu, kincir mini konversi energi, sakelar lampu otomatis sensor LDR, instalasi listrik rumah ramah lingkungan.
      - *Budi Daya:* Sayuran polybag organik, tanaman obat keluarga (TOGA), ternak kesayangan ihsan, satwa harapan lebah/madu, ikan konsumsi kolam terpal, aquascape ikan hias.
      - *Pengolahan:* Minuman/makanan buah segar, kudapan sayuran sehat, olahan serealia/umbi nusantara, pemanfaatan hasil samping (zero food waste), olahan daging/ikan halal-thayyib, wirausaha kerupuk tulang ikan.
    - Sumber: BSKAP No. 046/H/KR/2025 & Buku Siswa Prakarya Kemendikbudristek.
16. **Muatan Lokal Bahasa Sunda (`bahasa-sunda.json`):**
    - 4 Elemen Kemahiran Bahasa: *Ngaregepkeun (Menyimak)*, *Maca jeung Miarsa (Membaca & Memirsa)*, *Nyarita jeung Midangkeun (Berbicara & Mempresentasikan)*, *Nulis (Menulis)*.
    - 20 Pangajaran materi (Paguneman undak-usuk basa loma/lemes, kaulinan barudak, pupujian solawat di madrasah, pangalaman pribadi, dongeng sasakala, sajak alam Priangan, aksara Sunda Kaganga & rarangken angka, warta 5W+1H, sisindiran piwuruk/silih asih, guguritan pupuh Kinanti/Asmarandana, panata acara MC madrasah, carpon rumaja, surat pribadi/resmi, biantara khitobah pidato, deskripsi adat istiadat kampung naga/ciptagelar, pakeman basa/paribasa budi pekerti, drama sandiwara Sunda, resensi novel, carita babad sajarah Sunda).
    - Sumber: Pergub Jawa Barat No. 173 Tahun 2014 & Buku *Pamekar Diajar Basa Sunda* Disdik Jawa Barat.

---

## 5. Inventarisasi Seluruh Berkas Bank Data (`data/fase-d/`)

| No | Path File | Deskripsi Entri | Status Verifikasi |
|---|---|---|:---:|
| 1 | `data/fase-d/manifest.json` | Metadata versi bank data, daftar file, status 16 mapel | **PASS** |
| 2 | `data/fase-d/regulasi.json` | 7 Dokumen regulasi resmi BSKAP, KMA, Ditjen Pendis, Pergub Jabar | **PASS** |
| 3 | `data/fase-d/struktur-kurikulum.json` | Alokasi 41 JP/minggu 16 mapel MTs KMA 1503/2025 | **PASS** |
| 4 | `data/fase-d/panca-cinta.json` | 5 Pilar Panca Cinta KBC & dimensi nilai | **PASS** |
| 5 | `data/fase-d/dpl.json` | 8 Dimensi Profil Lulusan Kemenag & elemen kunci | **PASS** |
| 6 | `data/fase-d/materi-kbc.json` | 5 Modul materi integrasi KBC, dalil, aplikasi | **PASS** |
| 7 | `data/fase-d/kko.json` | Taksonomi Bloom revisi (Kognitif C1-C6, Afektif A1-A5, Psikomotor P1-P5) | **PASS** |
| 8 | `data/fase-d/mapel/al-quran-hadis.json` | Al-Qur'an Hadis (3 elemen, 18 bab) | **PASS** |
| 9 | `data/fase-d/mapel/akidah-akhlak.json` | Akidah Akhlak (4 elemen, 29 bab) | **PASS** |
| 10 | `data/fase-d/mapel/fikih.json` | Fikih (2 elemen, 22 bab) | **PASS** |
| 11 | `data/fase-d/mapel/ski.json` | SKI (5 elemen, 18 bab) | **PASS** |
| 12 | `data/fase-d/mapel/bahasa-arab.json` | Bahasa Arab (4 elemen, 18 dars) | **PASS** |
| 13 | `data/fase-d/mapel/pendidikan-pancasila.json` | Pendidikan Pancasila (4 elemen, 16 bab) | **PASS** |
| 14 | `data/fase-d/mapel/bahasa-indonesia.json` | Bahasa Indonesia (4 elemen, 18 bab) | **PASS** |
| 15 | `data/fase-d/mapel/matematika.json` | Matematika (5 elemen, 16 bab) | **PASS** |
| 16 | `data/fase-d/mapel/ipa.json` | IPA Terpadu (2 elemen, 20 bab) | **PASS** |
| 17 | `data/fase-d/mapel/ips.json` | IPS Terpadu (2 elemen, 12 tema) | **PASS** |
| 18 | `data/fase-d/mapel/bahasa-inggris.json` | Bahasa Inggris (3 elemen, 15 chapters) | **PASS** |
| 19 | `data/fase-d/mapel/pjok.json` | PJOK (4 elemen BSKAP 046/2025, 24 bab) | **PASS** |
| 20 | `data/fase-d/mapel/seni-budaya.json` | Seni Budaya (5 elemen, 17 bab) | **PASS** |
| 21 | `data/fase-d/mapel/informatika.json` | Informatika (8 elemen komputasi, 24 bab) | **PASS** |
| 22 | `data/fase-d/mapel/prakarya.json` | Prakarya (4 elemen, 24 bab lintas 4 aspek) | **PASS** |
| 23 | `data/fase-d/mapel/bahasa-sunda.json` | Muatan Lokal Basa Sunda (4 elemen, 20 bab) | **PASS** |
| 24 | `data/fase-d/LAPORAN.md` | Laporan komprehensif seluruh hasil riset Tahap 11A | **SELESAI** |

---

## 6. Kesimpulan & Rekomendasi Tahap Berikutnya

1. **Integritas Data 100%:** Bank data kurikulum Fase D telah rampung secara utuh tanpa ada mata pelajaran yang tertinggal (`BELUM_DIKERJAKAN` = 0).
2. **Kesesuaian Regulasi Mutakhir:** Seluruh Capaian Pembelajaran (CP) disalin secara verbatim dari dokumen regulasi resmi pemerintah (BSKAP 046/H/KR/2025, SK Dirjen Pendis 9941/2025, KMA 1503/2025, dan Pergub Jabar 173/2014).
3. **Kesiapan Integrasi Sistem (Tahap 11B):** Seluruh file JSON telah siap diimpor ke dalam database Supabase atau diakses langsung oleh generator ATP, Prota, Prosem, dan RPP pada sistem aplikasi perencanaan pembelajaran madrasah.
