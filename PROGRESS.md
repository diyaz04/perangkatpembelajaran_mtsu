# PROGRESS PENGERJAAN: PERANGKAT AJAR KBC
**MTs KH A Wahab Muhsin, Tasikmalaya, Jawa Barat**  
*Regulasi: KMA 1503 Tahun 2025, Panduan PPA Kemenag (Nov 2025), Kepdirjen Pendis 6077/2025, KMA 512 Tahun 2026*

---

## 📊 Status Tahapan Proyek

| Tahapan | Deskripsi | Status | Keterangan |
|---|---|---|---|
| **Tahap 1** | **Setup Proyek & Fondasi Desain/Arsitektur** | ✅ **SELESAI** | Next.js 15, shadcn/ui "new-york" slate, globals.css putih bersih + emerald-600 tanpa .dark, @supabase/ssr pola resmi, layout (auth)/login & (app)/ dengan shadcn sidebar (Sheet di HP), breadcrumb, profil menu, PageHeader, EmptyState, DataTable generik (paginasi 20 baris, pencarian, sort), ConfirmDialog, PROGRESS.md, README.md. Lint & build lolos 100%. |
| **Tahap 2** | **Skema Database Supabase & TypeScript Types** | ✅ **SELESAI** | 6 Enum, 21 Tabel (Master & Perangkat), Foreign Keys, Cascade Cleanups, Trigger `updated_at` & `handle_new_user`, Helper `app_role()` & `is_staff()`, RLS Policies lengkap (Multi-tenant guru terisolasi, staff read all, admin full CRUD), Seed data KBC (5 Panca Cinta, 8 DPL, 6 Model Sintaks JSON, 16 Mapel MTs KMA 1503/2025, TA 2026/2027), skrip pengujian RLS `scripts/test-rls.mjs`, dan tipe TypeScript lengkap di `src/types/database.ts`. |
| **Tahap 3** | **Autentikasi & Hak Akses** | ✅ **SELESAI** | Login email+password via Supabase Auth tanpa registrasi publik, registrasi ditutup ke publik. Master Data > Pengguna (admin): tambah guru/staf dengan `SUPABASE_SERVICE_ROLE_KEY`, nonaktifkan akun, reset password. Trigger `handle_new_user()` auto-insert ke `profiles`. Double-layer role guards (middleware & server components): guru dicegah buka `/master-data` dan `/validasi` baik di UI maupun akses URL langsung. Halaman Pengaturan profil & ubah password. Lint & Build 100% lolos. |
| **Tahap 4** | **Halaman Master Data (Admin)** | ✅ **SELESAI** | Satu halaman Tabs lengkap: Profil Madrasah (form+upload logo Supabase Storage "public-assets"), Tahun Ajaran (CRUD+switch aktif otomatis), Kalender Pendidikan (grid bulanan Juli-Juni + DataTable kegiatan + Impor CSV format Kanwil Kemenag Jabar), Mata Pelajaran (CRUD 16 mapel KMA 1503/2025 + JP kls 7/8/9), Penugasan Guru (mapping guru-mapel-tingkat-rombel-JP), Capaian Pembelajaran (filter mapel, CRUD elemen, impor teks/CSV), Panca Cinta & Materi KBC (5 topik tetap, edit deskripsi, CRUD materi integrasi), Model Pembelajaran (CRUD + editor sintaks terurut reorderable dengan pengalaman belajar memahami/mengaplikasi/merefleksi). Paginasi 20, sort, search, ConfirmDialog. Lint & Build 100% lolos. |
| **Tahap 6** | **Minggu Efektif & Program Tahunan (Prota)** | ✅ **SELESAI** | Modul Analisis Minggu Efektif (KMA 1503/2025) & Program Tahunan (Prota): Fungsi murni `src/lib/kalender/minggu-efektif.ts` (7/7 Vitest unit test lolos), input tanggal semester TA aktif + kalender pemotong + opsi 5/6 hari belajar madrasah, ambang batas $\ge$ 50% hari terpotong, subtotal semester 1, semester 2, dan total setahun. Halaman `/prota` kartu penugasan dengan metrik alokasi JP. Halaman editor `/prota/[penugasanId]`: tabel analisis minggu efektif, distribusi waktu TP otomatis tersinkron dari ATP, inline edit JP & keterangan, evaluasi real-time JP, freeze snapshot ke `prota.snapshot_minggu_efektif`. Pratinjau dokumen cetak A4/PDF (`/prota/[penugasanId]/preview`). 6/6 test integrasi lolos, lint & build 100% lolos. |
| **Tahap 7** | **Program Semester (Prosem) & Matriks Mingguan** | ✅ **SELESAI** | Modul Program Semester (Prosem): Kartu penugasan per semester di `/prosem`, editor matriks mingguan interaktif `/prosem/[penugasanId]?semester=1|2` dengan kolom TP sticky di desktop/mobile, pengelompokan 6 bulan × minggu 1..5, sel tidak efektif terarsir warna kegiatan kalender (libur, asesmen, MATSAMA, Ramadan, kegiatan madrasah), input JP mingguan dengan validasi batas JP vertikal & horizontal, tombol "Distribusi Otomatis" sekuensial, simpan draf & ajukan validasi. Pratinjau cetak dokumen landscape resmi A4 (`/prosem/[penugasanId]/preview`) lengkap dengan kop madrasah, legenda kalender pendidikan, dan tanda tangan Kepala Madrasah & Guru Pengampu. 6/6 integration test lolos, lint 0 error 0 warning, Next.js build 100% lolos. |
| **Tahap 9** | **Export Dokumen (DOCX & PDF) & Batch ZIP** | ✅ **SELESAI** | Builder docx server-side (ATP, Prota, Prosem Landscape, RPP Tabel 3.5 & 3.6), route handler GET /api/export/[jenis]/[id], POST /api/export/batch (ZIP via JSZip), print stylesheet @media print, watermark status draf, batch export UI di /validasi. 6/6 test passed, build lolos 100%. |
| **Tahap 10** | **Validasi & Dashboard Supervisi KBC** | ✅ **SELESAI** | Siklus status dokumen (draf → diajukan → disetujui / revisi), penguncian dokumen diajukan/disetujui, tombol Buat Revisi (salinan draf), audit trail `riwayat_validasi` & visual timeline, halaman `/validasi` antrian telaah + split screen & checklist 8 butir instrumen Kemenag & KBC, Beranda guru (kartu progres, banner revisi, pintasan kerja) & Beranda staff (KPI supervisi, tabel rekap kelengkapan guru x dokumen), ekspor rekap supervisi/EDM ke Excel (.xlsx via exceljs). Test suite 7/7 lolos, linting 0 error, build lolos 100%. |
| **Tahap 11A** | **Riset Bank Data Fase D (TA 2026/2027)** | ✅ **SELESAI** | Riset kurikulum & CP verbatim 16 mata pelajaran MTs Fase D (KMA 1503/2025, KMA 512/2026, Kepdirjen Pendis 6077/2025). Mengumpulkan 23 berkas JSON ke `data/fase-d/`: manifest, regulasi, struktur kurikulum, panca cinta, materi KBC, DPL, KKO Bloom, dan 16 mapel (311 bab materi kls 7-9 smt 1-2). 100% lolos validasi skema Zod. |
| **Tahap 13B** | **Integrasi Bank Data ke Aplikasi Berjalan** | ✅ **SELESAI** | Integrasi bank data ke aplikasi berjalan secara aditif: migrasi SQL aman, skema Zod & validator CLI (`npm run data:validate`), seeder idempotent (`npm run data:seed`) dengan proteksi data manual/terverifikasi, role guard Waka & Admin pada `/master-data/bank-data`, integrasi form Penugasan, Analisis CP, TP, dan RPP KBC, serta footer metadata CP & versi bank data pada preview dan ekspor DOCX. 16/16 test lolos, lint 0 error, build lolos 100%. |


---

## 🔍 Rincian Pengerjaan Tahap 2 yang Telah Selesai

### 1. Enum Database (Postgres Types)
- `user_role`: `'admin'`, `'kepala'`, `'waka_kurikulum'`, `'guru'`
- `doc_status`: `'draf'`, `'diajukan'`, `'revisi'`, `'disetujui'`
- `jenis_kegiatan_kalender`: `'libur'`, `'asesmen'`, `'matsama'`, `'ramadhan'`, `'kegiatan_madrasah'`, `'lainnya'`
- `tahap_kegiatan`: `'awal'`, `'inti'`, `'penutup'`
- `pengalaman_belajar`: `'memahami'`, `'mengaplikasi'`, `'merefleksi'`
- `versi_rpp`: `'minimum'`, `'lengkap'`

### 2. Tabel Master (11 Tabel)
1. `madrasah`: (id, nama, nsm, npsn, alamat, kabupaten, kepala_nama, kepala_nip, logo_url)
2. `profiles`: (id = auth.users.id, nama_lengkap, nip, gelar, role user_role, aktif bool)
3. `tahun_ajaran`: (id, nama "2026/2027", tgl_mulai, tgl_selesai, smt1_mulai, smt1_selesai, smt2_mulai, smt2_selesai, aktif bool — single active index)
4. `kalender_kegiatan`: (id, tahun_ajaran_id, tgl_mulai, tgl_selesai, jenis, keterangan, memotong_minggu_efektif bool)
5. `mapel`: (id, nama, kode, kelompok: PAI | Bahasa Arab | umum | muatan_lokal, jp_per_minggu_kls7, jp_per_minggu_kls8, jp_per_minggu_kls9)
6. `penugasan`: (id, guru_id -> profiles, mapel_id, tahun_ajaran_id, tingkat_kelas: 7 | 8 | 9, rombel text mis. "7A, 7B")
7. `capaian_pembelajaran`: (id, mapel_id, fase 'D', elemen, deskripsi_cp, sumber_regulasi "KMA 1503/2025")
8. `panca_cinta`: (id, urutan, kode 'PC1'..'PC5', nama, deskripsi)
9. `materi_kbc`: (id, panca_cinta_id, pilar, nilai, deskripsi, integrasi_sains_sosial, indikator_perilaku jsonb)
10. `dimensi_profil_lulusan`: (id, kode 'DPL1'..'DPL8', nama, elemen_kunci text[])
11. `model_pembelajaran`: (id, nama, sintaks jsonb)

### 3. Tabel Dokumen Perangkat Ajar (10 Tabel)
12. `analisis_cp`: (id, penugasan_id, cp_id, materi_pokok, kompetensi, alokasi_jp, status doc_status, catatan_validator)
13. `tujuan_pembelajaran`: (id, analisis_cp_id, kode_tp, deskripsi, panca_cinta_ids uuid[], dpl_ids uuid[], alokasi_jp, urutan)
14. `atp`: (id, penugasan_id, semester: 1 | 2, status doc_status, catatan_validator)
15. `prota`: (id, penugasan_id, status doc_status, total_jp, catatan_validator)
16. `prota_item`: (id, prota_id, materi_pokok, semester: 1 | 2, alokasi_jp, urutan)
17. `prosem`: (id, penugasan_id, semester: 1 | 2, status doc_status, total_minggu_efektif, total_jp, catatan_validator)
18. `prosem_item`: (id, prosem_id, prota_item_id, minggu_ke int[], alokasi_jp, urutan)
19. `rpp`: (id, penugasan_id, atp_id, materi_pokok, alokasi_waktu, pertemuan_ke, versi versi_rpp, model_id, tujuan_pembelajaran_ids uuid[], dimensi_profil_lulusan_ids uuid[], panca_cinta_ids uuid[], materi_kbc_ids uuid[], pemahaman_bermakna, pertanyaan_pemantik, sarana_prasarana, diferensiasi_konten, diferensiasi_proses, diferensiasi_produk, asesmen_awal, asesmen_proses, asesmen_akhir, status doc_status, catatan_validator)
20. `rpp_langkah`: (id, rpp_id, tahap tahap_kegiatan, pengalaman pengalaman_belajar, deskripsi_kegiatan, durasi_menit, urutan)
21. `riwayat_validasi`: (id, dokumen_tipe, dokumen_id, validator_id, status_sebelum, status_sesudah, catatan, tanggal)

*Semua tabel dilengkapi kolom audit: `created_at`, `updated_at` (trigger otomatis), dan `created_by`.*

### 4. Security Definer Helper Functions
- `public.app_role()`: Mengambil role pengguna aktif dari tabel `profiles` berdasarkan `auth.uid()` (menghindari reserved keyword `current_role`).
- `public.is_staff()`: Memeriksa apakah `app_role()` berada dalam himpunan `('admin', 'kepala', 'waka_kurikulum')`.

### 5. Kebijakan Row Level Security (RLS)
- **Master Data**: `SELECT` diizinkan untuk semua pengguna `authenticated`; operasi `INSERT`, `UPDATE`, `DELETE` hanya diizinkan untuk `admin`.
- **Profiles**: `SELECT` semua pengguna terautentikasi; pengguna dapat mengupdate profil miliknya sendiri (`auth.uid() = id`); `admin` memiliki akses modifikasi penuh.
- **Perangkat Ajar** (`analisis_cp`, `tujuan_pembelajaran`, `atp`, `prota`, `prota_item`, `prosem`, `prosem_item`, `rpp`, `rpp_langkah`):
  - Guru hanya memiliki akses CRUD pada data penugasan miliknya sendiri (`penugasan.guru_id = auth.uid()`).
  - Guru hanya dapat mengedit dokumen saat berstatus `'draf'` atau `'revisi'`. Dokumen yang sudah diajukan (`'diajukan'`) atau disetujui (`'disetujui'`) bersifat *read-only* bagi guru.
  - Staff (Kepala Madrasah, Waka Kurikulum, Admin) dapat membaca seluruh dokumen perangkat ajar (`SELECT`) dan memperbarui kolom status serta catatan validator.
- **Riwayat Validasi**:
  - Staff dapat menambahkan entri riwayat review (`INSERT`).
  - `SELECT` dapat diakses oleh staff dan guru pemilik dokumen terkait.

### 6. Data Awal (Seed Data `supabase/seed.sql`)
- **Panca Cinta**: 5 nilai terintegrasi (PC1: Cinta Allah dan Rasul, PC2: Cinta Ilmu, PC3: Cinta Lingkungan, PC4: Cinta Tanah Air, PC5: Cinta Diri dan Sesama).
- **Dimensi Profil Lulusan**: 8 DPL Kemenag (DPL1 s.d. DPL8) lengkap dengan elemen kunci.
- **Model Pembelajaran**: 6 model lengkap dengan sintaks JSON dan pemetaan pengalaman belajar (`memahami`, `mengaplikasi`, `merefleksi`): PjBL, PBL, Discovery Learning, Inquiry Learning, Cooperative Learning, dan LOK-R.
- **Mata Pelajaran**: 16 Mapel MTs standar KMA 1503/2025 lengkap dengan kode dan alokasi JP per minggu untuk kelas 7, 8, dan 9.
- **Tahun Ajaran Aktif**: 2026/2027 (`aktif = true`).
- **Madrasah**: Identitas default MTs KH A Wahab Muhsin.

### 7. File Deliverables
- `supabase/migrations/20261013111717_initial_schema.sql`: Migrasi skema database Supabase CLI.
- `supabase/seed.sql`: Data seed master.
- `supabase/schema.sql`: Gabungan migration & seed all-in-one untuk eksekusi di SQL Editor.
- `src/types/database.ts`: Tipe TypeScript strict 100% tersinkronisasi dengan seluruh tabel, relasi, enum, dan konstanta.
- `scripts/test-rls.mjs`: Skrip otomatisasi pengujian isolasi RLS antar-guru.
- `scripts/test-tahap3.mjs`: Skrip pengujian otomatis autentikasi & otorisasi Tahap 3.

---

## 🔐 Rincian Pengerjaan Tahap 3 yang Telah Selesai

### 1. Autentikasi Supabase Tanpa Registrasi Publik
- **Login Email + Password**: Halaman `/login` terhubung Supabase Auth dengan penanganan error komprehensif, feedback status aktivasi akun (`?error=deactivated`), dan proteksi redirect.
- **Registrasi Publik Ditutup**: Rute `/register` dialihkan dan menampilkan kartu informasi resmi bahwa akun hanya dibuat oleh admin madrasah.

### 2. Manajemen Pengguna Master Data (Admin Only)
- **Halaman `/master-data/pengguna`**: DataTable interaktif dengan fitur pencarian nama/NIP/email, filter role, badge role & status aktif, paginasi, dan dialog aksi.
- **Server Action Tambah Pengguna**: Menggunakan `SUPABASE_SERVICE_ROLE_KEY` via `createAdminClient()`. Menangani pembuatan akun di `auth.users` dengan metadata otomatis disinkronkan ke `public.profiles`.
- **Aktivasi & Nonaktifkan Akun**: Mengubah `aktif = true/false` pada profil dan menonaktifkan login pada Supabase Auth (`ban_duration: '876600h'` saat nonaktif, reset ke `'none'` saat diaktifkan).
- **Reset Password**: Admin dapat mereset kata sandi pengguna secara langsung tanpa konfirmasi email.

### 3. Sinkronisasi Profil Otomatis (Trigger Database)
- Fungsi `handle_new_user()` diperbarui di Supabase untuk menyisipkan data profil otomatis dengan role default atau role yang ditentukan saat registrasi admin, lengkap dengan skema `public.user_role` dan `SET search_path = public`.

### 4. Double-Layer Role Guarding & Akses Rute
- **Lapisan 1 (Middleware `src/lib/supabase/middleware.ts`)**:
  - Semua rute di grup `(app)` wajib login; jika belum login otomatis dialihkan ke `/login`.
  - Akun nonaktif (`aktif === false`) otomatis di-sign out dan dialihkan ke `/login?error=deactivated`.
  - Akses `/master-data*` dibatasi eksklusif hanya untuk role `admin`. Guru / role lain langsung dialihkan ke `/?error=unauthorized`.
  - Akses `/validasi*` dibatasi hanya untuk `admin`, `kepala`, dan `waka_kurikulum`. Guru langsung dialihkan ke `/?error=unauthorized`.
- **Lapisan 2 (Server Component & Server Actions)**:
  - Helper `getCurrentUser()` mengembalikan `user`, `profile`, dan `role`.
  - Helper `requireAuth()` dan `requireRole(['admin', ...])` memvalidasi otorisasi di sisi server dan melempar redirect jika tidak berhak.
- **UI Navigasi Dinamis (`AppSidebar`)**:
  - Menu disaring secara reaktif berdasarkan role profil:
    - `guru`: Beranda, CP & ATP, Prota, Prosem, RPP (Modul Ajar), Pengaturan. (Menu Validasi & Master Data tersembunyi total).
    - `waka_kurikulum` & `kepala`: Semua menu guru + Validasi Dokumen. (Menu Master Data tersembunyi total).
    - `admin`: Semua menu + Master Data.

### 5. Halaman Pengaturan Akun (`/pengaturan`)
- Tampilan role badge pengguna aktif.
- Form pembaruan profil (Nama Lengkap, NIP, Gelar) via Server Action terproteksi.
- Form perubahan kata sandi mandiri via Supabase Auth.

---

## 🧪 Hasil Pengujian Kualitas Kode & Verifikasi Sistem
- `npm run lint`: **0 error, 0 warning (LOLOS 100%)**
- `npm run build`: **Kompilasi Next.js 16 (Turbopack) & TypeScript strict lolos 100% tanpa error**
- `node scripts/test-rls.mjs`: **LOLOS 100% (Verifikasi Isolasi RLS Database)**
- `node scripts/test-tahap3.mjs`: **LOLOS 100% (Verifikasi End-to-End Autentikasi & Otorisasi)**
  - Admin membuat user baru (`guru.test.tahap3@madrasah.id`) via Admin API -> Sukses.
  - Trigger auto-create baris `profiles` -> Sukses (`nama_lengkap`, `nip`, `role = guru`, `aktif = true`).
  - Login dengan password awal -> Sukses.
  - Reset password oleh admin (`GuruBaru2026!`) -> Sukses.
  - Login dengan password baru -> Sukses.
  - Nonaktifkan akun pengguna (`aktif = false`, ban auth) -> Sukses.
  - Percobaan login akun nonaktif -> Berhasil ditolak / diblokir.
- `node scripts/test-tahap4.mjs`: **LOLOS 100% (Verifikasi End-to-End Master Data 8 Tabs)**
  - Test 1: Profil Madrasah (Query & Update identitas lembaga + pimpinan) -> Sukses.
  - Test 2: Tahun Ajaran (Insert, Switch Aktif otomatis nonaktifkan lainnya, Verifikasi tepat 1 aktif, Delete) -> Sukses.
  - Test 3: Kalender Pendidikan (Insert, Batch CSV Import, Query, Delete) -> Sukses.
  - Test 4: Mata Pelajaran (Insert mapel baru, Validasi alokasi JP kls 7/8/9, Delete) -> Sukses.
  - Test 5: Penugasan Guru (Mapping Guru-Mapel-Tingkat-Rombel, Kalkulasi JP/minggu, Delete) -> Sukses.
  - Test 6: Capaian Pembelajaran (CRUD per Elemen Fase D, Batch Import Elemen, Filter Mapel, Delete) -> Sukses.
  - Test 7: Panca Cinta & Materi KBC (Verifikasi 5 topik tetap, Edit deskripsi topik, CRUD materi integrasi sains-sosial & indikator perilaku, Delete) -> Sukses.
  - Test 8: Model Pembelajaran (Insert model + editor sintaks terurut reorderable dengan pengalaman belajar memahami/mengaplikasi/merefleksi, Delete) -> Sukses.

---

## 🏛️ Rincian Pengerjaan Tahap 4: Master Data Admin

### 1. Profil Madrasah (Tab 1)
- Form tunggal identitas resmi: Nama madrasah, NSM, NPSN, Alamat, Kabupaten, Kepala Madrasah, dan NIP.
- Upload logo ke Supabase Storage bucket `public-assets` dengan preview real-time dan feedback upload.
- Notifikasi informasi kop surat: Data profil otomatis dipakai untuk kop & tanda tangan pada seluruh perangkat pembelajaran.

### 2. Tahun Ajaran (Tab 2)
- DataTable dengan status badge `Aktif Saat Ini`.
- Tombol **"Jadikan Aktif"** yang otomatis mengalihkan status aktif dan menonaktifkan tahun ajaran lainnya.
- Batasan tanggal: Tanggal Mulai TA, Selesai TA, Semester 1 Mulai & Selesai, Semester 2 Mulai & Selesai.
- Dialog form tambah/edit + konfirmasi hapus (`ConfirmDialog`).

### 3. Kalender Pendidikan (Tab 3)
- **Matriks Kalender Bulanan**: Tampilan visual 12 bulan (Juli s.d. Juni) dengan indikator warna per jenis kegiatan.
- **DataTable Kegiatan**: Daftar agenda lengkap dengan badge jenis kegiatan (`libur`, `asesmen`, `matsama`, `ramadhan`, `kegiatan_madrasah`, `lainnya`).
- Indikator pemotongan minggu efektif ("Ya, Potong JP" / "Tidak") yang terintegrasi dengan perhitungan pekan efektif Prosem & Prota.
- Fitur **"Impor dari CSV"** dengan format kolom `tgl_mulai,tgl_selesai,jenis,keterangan,memotong_minggu_efektif` dan catatan regulasi resmi Kanwil Kemenag Jawa Barat.

### 4. Mata Pelajaran (Tab 4)
- Manajemen 16 mata pelajaran madrasah standar KMA 1503 Tahun 2025.
- Pengelompokan: PAI, Bahasa Arab, Umum, dan Muatan Lokal dengan filter dropdown.
- Konfigurasi alokasi JP per minggu untuk Kelas VII, Kelas VIII, dan Kelas IX.

### 5. Penugasan Guru (Tab 5)
- Pemetaan guru pengampu dari pangkalan data profil aktif ke mata pelajaran dan tingkat kelas (Kelas VII / VIII / IX).
- Pilihan rombel fleksibel (bisa pilih cepat tombol badge rombel atau ketik manual misal: "7A, 7B, 7C").
- Kalkulasi otomatis beban JP per minggu (`JP mapel x jumlah rombel`).
- Terhubung dengan filter Tahun Ajaran aktif.

### 6. Capaian Pembelajaran Fase D (Tab 6)
- Filter dropdown dinamis berdasarkan mata pelajaran.
- CRUD per elemen CP: Nama Elemen, Deskripsi Paragraf CP, Fase 'D', dan Sumber Regulasi (default `KMA 1503/2025`).
- Fitur **"Impor / Tempel CP"** dengan format `Elemen | Deskripsi Paragraf CP | Sumber Regulasi` untuk input cepat massal.

### 7. Panca Cinta & Materi KBC (Tab 7)
- 5 Topik Tetap Panca Cinta:
  1. PC1: Cinta Allah dan Rasul
  2. PC2: Cinta Ilmu
  3. PC3: Cinta Lingkungan
  4. PC4: Cinta Tanah Air
  5. PC5: Cinta Diri dan Sesama
- Modal dialog untuk mengedit deskripsi/filosofi masing-masing topik.
- CRUD materi integrasi KBC per topik: Pilar Karakter, Nilai KBC, Deskripsi, Integrasi Sains & Sosial, serta daftar Indikator Perilaku.

### 8. Model Pembelajaran & Editor Sintaks (Tab 8)
- CRUD Model Pembelajaran standar Kurikulum Berbasis Cinta (PjBL, PBL, Discovery, Inquiry, Cooperative, LOK-R, dll).
- **Editor Sintaks Interaktif**: Menambah langkah sintaks, mengatur urutan (tombol panah Naik/Turun), serta menentukan pengalaman belajar default (`memahami`, `mengaplikasi`, `merefleksi`) untuk setiap fase sintaks.

---

## 🧭 Rincian Pengerjaan Tahap 5: Analisis CP, TP, dan ATP (Modul Guru)

### 1. Halaman Daftar Penugasan Guru (`/atp`)
- Kartu interaktif per penugasan guru di tahun ajaran aktif (`2026/2027`), menampilkan Nama Mapel, Tingkat Kelas (VII/VIII/IX), Kelompok Rombel, dan Beban JP/minggu.
- Indikator Status Dokumen ATP (`draf`, `diajukan`, `revisi`, `disetujui`) dengan warna badge kontekstual.
- Statistik ringkas kartu: Jumlah Elemen CP, Jumlah TP yang telah dirumuskan, dan Total Alokasi JP.
- Aksi langsung: Tombol **"Buka Wizard"** (ke `/atp/[penugasanId]`) dan **"Pratinjau"** (ke `/atp/[penugasanId]/preview`).

### 2. Wizard 3 Langkah Penyusunan ATP (`/atp/[penugasanId]`)
- **Stepper Navigasi Interaktif**:
  - Langkah 1: Analisis CP (Pemetaan DPL & Panca Cinta)
  - Langkah 2: Rumuskan Tujuan Pembelajaran (TP)
  - Langkah 3: Susun Alur Tujuan Pembelajaran (ATP)
- **Langkah 1 — Analisis CP**:
  - Elemen Capaian Pembelajaran Fase D ditampilkan dalam panel kartu terpisah (read-only dari master data CP KMA 1503/2025).
  - Input Tag Kata Kunci (Chips UI dengan tombol tambah & hapus).
  - Input Materi Pokok.
  - Textarea "Benang Merah Nilai Luhur": refleksi nilai kemanusiaan, spiritual, adab, dan kelestarian lingkungan hidup.
  - Multi-select 8 Dimensi Profil Lulusan (DPL Kemenag) dengan checkbox interaktif.
  - Multi-select 5 Topik Panca Cinta (PC1 s.d. PC5) dengan warna badge khas.
  - Panel Bantuan Accordion Panduan Kemenag: 5 pertanyaan reflektif untuk memandu guru dalam menganalisis capaian.
- **Langkah 2 — Rumuskan Tujuan Pembelajaran**:
  - Guru merumuskan TP per elemen yang sudah dianalisis.
  - **3 Komponen Wajib TP KBC**:
    1. *Kompetensi*: Dropdown Taksonomi SOLO (Unistructural, Multistructural, Relational, Extended Abstract) & Taksonomi Bloom (KKO C1–C6, Afektif, Psikomotorik).
    2. *Lingkup Materi*: Ruang lingkup keilmuan yang dipelajari.
    3. *Konteks Panca Cinta*: Penghayatan nilai cinta (Allah/Rasul, Ilmu, Lingkungan, Tanah Air, Diri/Sesama).
  - **Generator Kalimat Otomatis**: Menghasilkan rumusan standar *"Murid dapat [kompetensi] [materi] [konteks], sebagai wujud [Panca Cinta]."* dengan satu klik.
  - **Validasi Lunak (Soft-warning)**: Peringatan kuning jika kalimat rumusan belum mencantumkan kata kunci kompetensi atau konteks cinta.
  - Pengaturan Semester (1 atau 2) dan Alokasi JP per TP.
  - **Modal Editor KKTP (Kriteria Ketercapaian Tujuan Pembelajaran)**:
    - Mendukung 3 pendekatan resmi: *Deskripsi Kriteria*, *Rubrik 4 Level (Perlu Bimbingan, Cukup, Baik, Sangat Baik)*, dan *Interval Nilai*.
- **Langkah 3 — Susun Alur Tujuan Pembelajaran (ATP)**:
  - Reorderable List dengan tombol panah Naik dan Turun.
  - Penomoran kode TP otomatis mengikuti tingkat kelas (`7.1`, `7.2`, dst. untuk kelas 7).
  - Dropdown **6 Metode Pengurutan ATP** standar pedagogis:
    1. Pengurutan Konkret ke Abstrak
    2. Pengurutan Deduktif
    3. Pengurutan Mudah ke Sulit
    4. Pengurutan Hierarkis
    5. Pengurutan Prosedural
    6. Scaffolding (Bimbingan Bertahap)
    *Lengkap dengan kotak callout penjelasan pedagogis masing-masing metode.*
  - **Ringkasan Alokasi JP**: Kartu metrik real-time menghitung Total JP Semester 1, Total JP Semester 2, dan Grand Total JP vs JP Mapel yang tersedia di Tahun Ajaran.
  - Tombol Aksi: **"Simpan Draf"** dan **"Ajukan Validasi"** (mengubah status ke `diajukan`).

### 3. Pratinjau & Cetak Dokumen ATP Resmi (`/atp/[penugasanId]/preview`)
- Layout standar format cetak dokumen madrasah A4 / PDF via browser (`window.print()`).
- **Kop Surat Madrasah**: Mengambil otomatis dari Profil Madrasah di Master Data (Logo dari Supabase Storage `public-assets`, Nama Lembaga, NSM, NPSN, dan Alamat Lengkap).
- **Identitas Dokumen**: Mata Pelajaran, Fase D, Kelas/Tingkat, Semester, Tahun Ajaran, dan Metode Pengurutan Alur.
- **Tabel 8 Kolom Resmi**:
  1. No / Kode TP (`7.1`, `7.2`, ...)
  2. Elemen Capaian Pembelajaran
  3. Alur Tujuan Pembelajaran (Rumusan TP KBC)
  4. Ruang Lingkup Materi Pokok
  5. Konteks Panca Cinta
  6. Dimensi Profil Lulusan (DPL)
  7. Semester (1 / 2)
  8. Alokasi Waktu (JP)
- Baris Grand Total JP per semester dan tahunan.
- **Kolom Pengesahan Tanda Tangan**:
  - Mengetahui Kepala Madrasah (Nama + NIP).
  - Guru Mata Pelajaran Pengampu (Nama + NIP).

---

## 📅 Rincian Pengerjaan Tahap 6: Analisis Minggu Efektif & Program Tahunan (Prota)

### 1. Fungsi Perhitungan Murni (`src/lib/kalender/minggu-efektif.ts`)
- **Fungsi Murni (Pure Function)**: Bebas dari efek samping dan bebas masalah perbedaan zona waktu runtime (menggunakan manipulasi kalender string UTC).
- **Logika Perhitungan (KMA 1503/2025 & Regulasi Kanwil Kemenag Jawa Barat)**:
  - Input: Tanggal semester 1 & 2 dari tahun ajaran aktif + daftar kalender kegiatan pemotong.
  - Perhitungan hari sekolah: Mendukung opsi 6 hari kerja (Senin–Sabtu) dan 5 hari kerja (Senin–Jumat).
  - Ambang batas ketidakefektifan: Minggu dianggap **Tidak Efektif** bila $\ge 50\%$ hari belajarnya tertutup kegiatan pemotong (ambang batas dapat dikonfigurasi).
  - Output per bulan: Nama bulan (Juli–Juni), jumlah minggu kalender, minggu efektif, minggu tidak efektif, gabungan nama kegiatan pemotong unik, dan array detail minggu.
  - Subtotal per semester: Semester 1 (Juli–Desember), Semester 2 (Januari–Juni), dan Total 1 Tahun (52 minggu).
  - Jam Pelajaran (JP) Efektif: `minggu_efektif x jp_per_minggu` penugasan.
- **Unit Testing Vitest (`src/lib/kalender/minggu-efektif.test.ts`)**:
  - `7/7 unit test passed (100%)`: Menguji kasus tahun ajaran penuh (52 minggu), libur semester sebelum/sesudah tanggal aktif, asesmen sumatif 1 minggu penuh, libur Ramadhan & Idul Fitri 2 minggu, minggu yang terpotong sebagian (< 50% vs $\ge$ 50%), opsi 5 hari belajar, dan penanganan flag `memotong_minggu_efektif = false`.

### 2. Skema Database & Migrasi SQL (`supabase/migrations/20261013153000_tahap6_prota_schema.sql`)
- Menambahkan kolom `hari_sekolah` (integer default 6) pada tabel `madrasah`.
- Menambahkan kolom `snapshot_minggu_efektif` (jsonb) pada tabel `prota` untuk membekukan hasil analisis saat disimpan (dokumen lama tidak terpengaruh jika kalender diedit di kemudian hari).
- Menambahkan kolom `tujuan_pembelajaran_id`, `kode_tp`, `tujuan_pembelajaran_teks`, `panca_cinta_nama`, dan `keterangan` pada tabel `prota_item`.

### 3. Halaman Daftar Penugasan Prota (`/prota`)
- Kartu interaktif per penugasan guru di tahun ajaran aktif (`2026/2027`).
- Menampilkan nama mapel, tingkat kelas, rombel, guru pengampu, dan badge status (`draf`, `diajukan`, `revisi`, `disetujui`).
- Metrik perbandingan: JP Efektif Setahun vs JP Terdistribusi, serta breakdown alokasi Semester 1 & Semester 2.
- Indikator keselarasan alokasi waktu:
  - Merah: Alokasi melebihi JP Efektif.
  - Kuning: Masih terdapat sisa JP &gt; 20% (peringatan untuk alokasi cadangan/asesmen).
  - Hijau: Alokasi seimbang dan sesuai minggu efektif.
- Tombol aksi: "Buka Prota" (ke `/prota/[penugasanId]`) dan "Pratinjau" (ke `/prota/[penugasanId]/preview`).

### 4. Editor Interaktif Prota (`/prota/[penugasanId]`)
- **Bagian I — Analisis Alokasi Waktu & Minggu Efektif**:
  - Tabel 6 kolom: No, Bulan, Jumlah Minggu, Minggu Efektif, Tidak Efektif, Keterangan Kegiatan Pemotong.
  - Baris subtotal Semester 1, Semester 2, dan grand total tahunan.
  - 3 Kotak metrik ringkasan: JP Efektif Smt 1, JP Efektif Smt 2, Total JP Efektif Setahun.
  - Deteksi status: Penanda badge apakah sedang menggunakan *Snapshot Tersimpan* atau *Kalkulasi Kalender Aktif*.
- **Bagian II — Indikator Evaluasi Alokasi Waktu**:
  - Kartu komparasi real-time progress bar alokasi waktu Semester 1 dan Semester 2.
  - Callout Rekomendasi Pedagogis KBC: *"Sisihkan 2–4 JP pada tiap akhir semester untuk pelaksanaan Asesmen Sumatif Akhir Semester dan kegiatan pengayaan/remedial."*
- **Bagian III — Distribusi Alokasi Waktu (Program Tahunan)**:
  - Sinkronisasi otomatis dari ATP: Ketika dokumen pertama kali dibuka, data TP yang telah dirumuskan dan diurutkan di ATP otomatis ditarik menjadi baris distribusi Prota.
  - Filter tab: "Semua", "Semester 1", "Semester 2".
  - Tombol **"Tambah Alokasi Asesmen / Cadangan"**: Memudahkan guru menyisipkan jam cadangan asesmen sumatif.
  - **Inline Editing**: Guru dapat mengubah alokasi JP per TP secara langsung di tabel (input number), memilih semester (dropdown), dan mengisi catatan/keterangan alokasi.
  - Tombol reorder panah Naik/Turun untuk mengatur urutan materi.
  - Tombol **"Sinkronkan Ulang dari ATP"** dengan modal dialog konfirmasi.
  - Floating action bar: Simpan Draf dan Ajukan Validasi.

### 5. Pratinjau & Format Cetak Resmi A4 (`/prota/[penugasanId]/preview`)
- Layout dokumen resmi madrasah siap cetak / simpan PDF (`window.print()`).
- Kop surat resmi MTs KH A Wahab Muhsin dengan logo madrasah dari storage, NSM, NPSN, dan alamat lengkap.
- Identitas lengkap: Satuan Pendidikan, Fase/Kelas, Mata Pelajaran, Alokasi Waktu per minggu, Guru Pengampu, Tahun Pelajaran.
- Tabel Bagian I: Format resmi Analisis Minggu Efektif dengan baris subtotal dan grand total.
- Tabel Bagian II: Format resmi Distribusi Alokasi Waktu Program Tahunan (No, Semester, Kode TP, Tujuan Pembelajaran, Materi Pokok, Topik Panca Cinta, Alokasi JP, Keterangan).
- Lembar pengesahan tanda tangan ganda: Mengetahui Kepala Madrasah (Nama + NIP) dan Guru Mata Pelajaran (Nama + NIP) beserta tempat & tanggal.

---

## 📅 Rincian Pengerjaan Tahap 7 yang Telah Selesai

### 1. Database Schema & Migration (`supabase/migrations/20261013160000_tahap7_prosem_schema.sql`)
- Menambahkan kolom `snapshot_minggu_efektif` (jsonb) dan `snapshot_matriks` (jsonb) pada tabel `prosem`.
- Menambahkan kolom `distribusi_minggu` (jsonb), `kode_tp` (text), `materi_pokok` (text), dan `tujuan_pembelajaran_teks` (text) pada tabel `prosem_item`.
- Menjadikan kolom `prota_item_id` nullable (`DROP NOT NULL`) untuk mendukung pembuatan item Prosem secara langsung.
- Dukungan fallback ganda pada Server Action (`catatan_validator` JSON snapshot) untuk menjamin data tidak hilang saat menunggu refresh skema database.

### 2. Halaman Daftar Penugasan Program Semester (`/prosem`)
- Kartu penugasan per mata pelajaran & rombel di tahun ajaran aktif (`2026/2027`).
- Pemantauan status ganda per kartu: Semester 1 (Ganjil) dan Semester 2 (Genap) secara berdampingan.
- Visual progress bar per semester: Menghitung rasio JP terdistribusi pada matriks terhadap total JP efektif semester.
- Indikator status dokumen: `Draf`, `Diajukan`, `Revisi`, dan `Disetujui`.
- Tombol aksi: "Buka Matriks Smt 1", "Buka Matriks Smt 2", dan "Pratinjau Cetak Landscape".

### 3. Editor Matriks Mingguan Prosem (`/prosem/[penugasanId]?semester=1|2`)
- **Header Identitas & Kontrol**:
  - Switcher tab semester (Semester 1 / Semester 2) tanpa kehilangan state.
  - Ringkasan JP/minggu, total JP efektif semester, dan status dokumen.
- **Tabel Matriks Dinamis 6 Bulan × Minggu**:
  - Header tingkat 1: 6 Nama Bulan (Juli–Desember untuk Smt 1 / Januari–Juni untuk Smt 2) dengan `colSpan` dinamis sesuai jumlah minggu kalender.
  - Header tingkat 2: Nomor minggu ke-1 s.d. ke-5 di bawah tiap bulan.
  - Kolom kiri **Sticky**: Kolom No, Kode TP & Materi Pokok, Target JP, dan Total Terisi tetap menempel di sisi kiri layar saat tabel di-scroll horizontal baik di laptop maupun perangkat mobile.
- **Arsiran Sel Kalender Pendidikan**:
  - Sel minggu tidak efektif diarsir dengan kode warna dan tooltip agenda:
    - *Libur*: Rose (`bg-rose-100`)
    - *Asesmen Sumatif*: Ungu (`bg-purple-100`)
    - *MATSAMA*: Biru (`bg-blue-100`)
    - *Ramadan & Idul Fitri*: Emerald (`bg-emerald-100`)
    - *Kegiatan Madrasah*: Amber (`bg-amber-100`)
  - Sel minggu efektif: Input angka JP interaktif (min 0, max `jp_per_minggu`).
- **Algoritma "Distribusi Otomatis"**:
  - Sekali klik tombol "Distribusi Otomatis", sistem mengalokasikan JP seluruh TP semester secara sekuensial ke minggu-minggu efektif pertama sebanyak kapasitas `jp_per_minggu` hingga alokasi TP tuntas.
- **Validasi Real-Time**:
  - Validasi horizontal: Total terisi per baris TP ditandai hijau (pas), kuning (kurang), atau merah (melebihi target).
  - Validasi vertikal: Total seluruh TP pada minggu yang sama tidak boleh melebihi `jp_per_minggu` (ditandai merah dan banner peringatan muncul jika melebihi kapasitas jam).
- **Legenda Warna**: Keterangan warna kalender pendidikan interaktif di bawah matriks.
- **Aksi Dokumen**: Reset matriks, Simpan Draf, dan Ajukan Validasi.

### 4. Pratinjau Dokumen Cetak Landscape Resmi (`/prosem/[penugasanId]/preview?semester=1|2`)
- Format cetak landscape standar A4 (`@page { size: landscape; margin: 8mm; }`).
- Kop resmi Madrasah Tsanawiyah KH A Wahab Muhsin dengan logo, Kemenag RI, Kantor Kemenag Kabupaten Tasikmalaya, NSM, dan NPSN.
- Identitas lengkap: Satuan Pendidikan, Mata Pelajaran, Kelas/Rombel, Semester, Alokasi Waktu (JP/minggu & Total JP Efektif), dan Guru Pengampu.
- Matriks mingguan resmi siap cetak dengan arsiran warna kegiatan kalender dan tanda silang non-efektif.
- Baris footer jumlah JP per minggu dan grand total JP semester.
- Legenda kalender pendidikan dan daftar agenda kegiatan non-efektif yang terjadwal.
- Lembar pengesahan tanda tangan:
  - Kiri: Mengetahui, Kepala Madrasah (Nama + NIP).
  - Kanan: Tempat, Tanggal, Guru Mata Pelajaran (Nama + Gelar + NIP).

### 5. Verifikasi & Pengujian
- **Integration Test (`scripts/test-tahap7.mjs`)**: `6/6 PASSED (100%)`.
- **Vitest Unit Test (`src/lib/kalender/minggu-efektif.test.ts`)**: `7/7 PASSED (100%)`.
- **Linting (`npm run lint`)**: `0 errors, 0 warnings`.
- **Production Build (`npm run build`)**: Turbopack build lolos 100% dan seluruh route `/prosem`, `/prosem/[penugasanId]`, `/prosem/[penugasanId]/preview` terkompilasi optimal.

---

## 📘 Rincian Pengerjaan Tahap 8 yang Telah Selesai

### 1. Fondasi Skema Database & Migrasi (`supabase/migrations/20261013170000_tahap8_rpp_schema.sql`)
- Menyelaraskan tabel `rpp` dan `rpp_langkah` dengan Tabel 3.5 & 3.6 Panduan Pembelajaran dan Asesmen Kemenag (Nov 2025):
  - **Identifikasi & Spesifikasi**: `snapshot_rpp` (jsonb freeze kop dan identitas madrasah), `jumlah_pertemuan` (int), `alokasi_jp` (int), `menit_per_jp` (default 40 menit), `karakteristik_materi` (text), `benang_merah_kbc` (text), `materi_kbc_custom` (text[]).
  - **Desain Pembelajaran**: `lintas_disiplin_ilmu` (text), `topik_pembelajaran` (text), `metode_pembelajaran` (text[]), `kemitraan_pembelajaran` (text), `lingkungan_belajar_fisik` (text), `lingkungan_belajar_virtual` (text), `budaya_belajar` (text), `pemanfaatan_digital` (text), `tujuan_pembelajaran_teks` (text[]).
  - **Kesiapan Murid (Asesmen Diagnostik Awal)**: `kesiapan_murid` (jsonb: pengetahuan_awal, minat, latar_belakang, kebutuhan_belajar, strategi_asesmen_awal).
  - **Asesmen & Rubrik Sikap KBC**: `rubrik_kbc` (jsonb array 4 level perkembangan: Mulai Berkembang / Sedang Berkembang / Berkembang Sesuai Harapan / Sangat Berkembang untuk setiap topik Panca Cinta terpilih), `kktp` (jsonb kriteria ketuntasan tujuan pembelajaran).
  - **Lampiran**: `lampiran` (jsonb: lkpd, bahan_bacaan, glosarium, daftar_pustaka).
  - **Langkah Pembelajaran per Pertemuan (`rpp_langkah`)**: `pertemuan_ke` (int), `prinsip` (enum/text: `'berkesadaran'` | `'bermakna'` | `'menggembirakan'`), `panca_cinta_id` (uuid FK ke `panca_cinta`), `aksi_kbc` (text rincian implementasi cinta).
- Sinkronisasi tipe database TypeScript di `src/types/database.ts` dengan interface `RppRow`, `RppLangkahRow`, `KesiapanMuridData`, `RubrikKbcItem`, `LampiranData`, dll.

### 2. Server Actions Terisolasi (`src/app/(app)/modul-ajar/actions.ts`)
- `getRppListAction()`: Mengambil daftar RPP guru pengampu dengan metadata mapel, rombel, tingkat kelas, jumlah JP, status dokumen, dan jumlah pertemuan. Role isolation terjamin (guru hanya mengakses miliknya).
- `getPenugasanAndTpListAction()`: Mengambil daftar penugasan guru di tahun ajaran aktif beserta TP dari ATP (baik dari database maupun fallback relasi).
- `createRppAction()`: Membuat entitas RPP baru (versi Minimum atau Lengkap) dengan inisialisasi awal 3 blok kegiatan per pertemuan: Awal (10-15 mnt), Inti (sesuai sintaks model terpilih atau alur eksplorasi), dan Penutup (10-15 mnt).
- `getRppDetailAction(id)`: Mengambil RPP lengkap beserta langkah-langkah kegiatan, master DPL (8 dimensi), Panca Cinta (5 topik), materi KBC, daftar Model Pembelajaran dan sintaksnya, serta data profil madrasah & CP.
- `saveRppAction(id, rppData, langkahList, submit)`: Menyimpan draf dan memvalidasi aturan pedagogis KBC secara ketat saat diajukan (`submit = true`):
  - Setiap pertemuan wajib memiliki minimal 1 langkah Berkesadaran, Bermakna, dan Menggembirakan.
  - Setiap pertemuan wajib memiliki minimal 1 pengalaman Memahami, Mengaplikasi, dan Merefleksi.
  - Setiap topik Panca Cinta yang dipilih pada Langkah 2 wajib memiliki minimal satu integrasi aksi nyata di salah satu langkah kegiatan.
  - Total durasi menit per pertemuan wajib tepat sama dengan alokasi target ($JP \times 40$ menit).
- `duplicateRppAction(id)`: Melakukan kloning RPP beserta seluruh konfigurasi dan langkah kegiatan menjadi draf baru independen.
- `deleteRppAction(id)`: Menghapus RPP dan cascade seluruh langkah kegiatannya.

### 3. Antarmuka Manajemen & Wizard 6 Langkah
- **Daftar Modul Ajar (`/modul-ajar`)**:
  - Filter interaktif: Tingkat Kelas (VII/VIII/IX), Status (Draf, Diajukan, Revisi, Disetujui), Versi (Minimum / Lengkap), dan kotak pencarian materi/mapel/rombel.
  - Indikator status berwarna, badge versi dokumen, dan kartu ringkasan JP & jumlah pertemuan.
  - Tombol aksi: Duplikat Modul Ajar, Edit, Pratinjau Cetak Resmi, dan Hapus Dokumen dengan `ConfirmDialog`.
  - Dialog "Buat RPP Baru": Pilihan penugasan aktif, pemilihan TP multi-select dari ATP, dan pemilihan versi dokumen (Minimum / Lengkap).
- **Wizard Stepper 6 Langkah Bebas Navigasi (`/modul-ajar/[id]`)**:
  - Stepper atas interaktif dengan indikator centang hijau per langkah selesai, switcher versi dokumen (Minimum/Lengkap) dinamis, tombol Autosave Draf, Simpan Draf manual, dan Ajukan Validasi.
  - **Langkah 1 (Spesifikasi)**: Form identitas otomatis dari penugasan (Madrasah, Mapel, Rombel, Fase D), materi pokok, input Alokasi JP & Jumlah Pertemuan, kalkulator durasi total otomatis ($40$ menit/JP).
  - **Langkah 2 (Identifikasi)**:
    - [Lengkap] Analisis kesiapan murid (5 aspek: pengetahuan awal, minat, latar belakang, kebutuhan belajar, strategi asesmen diagnostik).
    - Karakteristik materi pembelajaran.
    - Dimensi Profil Lulusan (DPL): Multi-select 8 dimensi Profil Lulusan Kemenag.
    - Panca Cinta: Multi-select 5 topik Panca Cinta dengan kartu interaktif.
    - Materi integrasi KBC: Pilihan materi dari master atau custom, disertai input wajib deskripsi "benang merah".
  - **Langkah 3 (Desain Pembelajaran)**:
    - [Lengkap] Capaian Pembelajaran Fase D (read-only) & Pembelajaran Lintas Disiplin Ilmu.
    - Rumusan Tujuan Pembelajaran (bisa diedit khusus konteks RPP).
    - Model Pembelajaran Mendalam: Dropdown 6 model (PjBL, PBL, Discovery, Inquiry, Cooperative, LOK-R) dengan tombol auto-inject sintaks ke Kegiatan Inti Langkah 4.
    - Pilihan metode pembelajaran multi-toggle (Diskusi, Tanya Jawab, Eksperimen, Bermain Peran, dll.).
    - Lingkungan belajar (Fisik, Virtual, Budaya madrasah), Kemitraan pembelajaran, dan Pemanfaatan teknologi digital.
  - **Langkah 4 (Pengalaman Belajar)**:
    - Tab navigasi Pertemuan 1 s.d. $n$.
    - Card rekap durasi real-time: Total menit terisi vs target menit pertemuan ($JP \times 40$ mnt).
    - Tiga blok tetap: Kegiatan Awal, Kegiatan Inti (sintaks model), dan Kegiatan Penutup.
    - Pengalaman belajar: Tag `memahami`, `mengaplikasi`, `merefleksi`.
    - Prinsip pembelajaran mendalam: Tag `berkesadaran`, `bermakna`, `menggembirakan`.
    - Integrasi Panca Cinta per langkah: Switch integrasi Panca Cinta, pemilihan topik cinta, dan input aksi nyata KBC murid.
    - Validasi real-time peringatan jika durasi belum seimbang atau belum mencakup 3 pengalaman belajar.
  - **Langkah 5 (Asesmen)**:
    - Formatif awal (diagnostik), formatif proses (*assessment as/for learning*), dan sumatif akhir (*assessment of learning*).
    - **Generator Otomatis Rubrik Sikap KBC**: Sekali klik tombol "Generate Rubrik dari Panca Cinta", sistem otomatis menyusun tabel rubrik 4 level ketercapaian (Mulai Berkembang, Sedang Berkembang, Berkembang Sesuai Harapan, Sangat Berkembang) untuk setiap topik Panca Cinta yang dipilih pada Langkah 2.
    - Kriteria Ketercapaian Tujuan Pembelajaran (KKTP).
  - **Langkah 6 (Lampiran)**:
    - Editor Lembar Kerja Peserta Didik (LKPD), Bahan Bacaan Guru & Murid, Glosarium istilah penting, dan Daftar Pustaka.

### 4. Pratinjau Dokumen Cetak Format 2 Kolom Kemenag (`/modul-ajar/[id]/preview`)
- Mengikuti format standar Tabel 3.5 & 3.6 Panduan Pembelajaran dan Asesmen Kemenag RI.
- Layout 2 kolom elegan dengan proporsi 35% : 65%:
  - **Kolom Kiri**: Identitas madrasah, alokasi waktu, DPL, Panca Cinta terintegrasi, materi KBC & benang merah, model & metode pembelajaran, serta kesiapan murid.
  - **Kolom Kanan**: Tujuan pembelajaran, skenario pengalaman belajar per pertemuan (Awal, Inti sintaks, Penutup) beranotasi 3 prinsip & aksi cinta, asesmen pembelajaran, rubrik sikap KBC 4 level, dan lampiran LKPD.
- Kop surat resmi madrasah lengkap dengan logo, Kemenag RI, NSM, NPSN, dan alamat.
- Lembar pengesahan tanda tangan resmi Kepala Madrasah dan Guru Pengampu.
- Rute redirect kompatibilitas `/rpp/[id]/preview` menuju `/modul-ajar/[id]/preview`.

### 5. Verifikasi & Pengujian Mutu
- **Integration Test (`scripts/test-tahap8.mjs`)**: `6/6 PASSED (100%)`.
  - Berhasil membuat RPP Versi Lengkap (PjBL 2 pertemuan, 4 JP).
  - Berhasil menyimpan 10 langkah kegiatan lengkap dengan sintaks PjBL dan integrasi Panca Cinta.
  - Berhasil memvalidasi aturan pedagogis KBC (3 pengalaman belajar terpenuhi, seluruh Panca Cinta terintegrasi, durasi tepat 80 menit per pertemuan) dan memperbarui status menjadi `diajukan`.
  - Berhasil menguji duplikasi / kloning dokumen RPP menjadi draf baru.
- **Vitest Unit Test (`src/lib/kalender/minggu-efektif.test.ts`)**: `7/7 PASSED (100%)`.
- **Linting (`npm run lint`)**: `0 errors, 0 warnings`.
- **Production Build (`npm run build`)**: Turbopack build sukses 100% dan seluruh route `/modul-ajar`, `/modul-ajar/[id]`, `/modul-ajar/[id]/preview`, dan `/rpp/[id]/preview` terkompilasi optimal.

---

## 🔍 Rincian Pengerjaan Tahap 9 yang Telah Selesai

### 1. Arsitektur Ekspor Dokumen DOCX & PDF
- **DOCX Generation Server-side (`docx` npm package)**:
  - Diproses di lingkungan Node.js server (`runtime = 'nodejs'`) tanpa ketergantungan Chromium/Puppeteer yang berat, aman untuk fungsi serverless Vercel dan menghasilkan file biner secara instan (< 10 detik).
  - Pilihan ukuran kertas: **A4** (21.0 × 29.7 cm) dan **F4 / Folio** (21.5 × 33.0 cm, standar madrasah Indonesia).
  - Tipografi resmi: **Times New Roman (12 pt)** atau **Arial (11 pt)**, margin 2 cm (1134 twips).
  - Standarisasi kop surat madrasah dengan logo resmi, Kemenag RI, NSM, NPSN, alamat, dan pembatas garis ganda (`BorderStyle.DOUBLE`).
  - Blok tanda tangan 2 kolom: Kepala Madrasah di sebelah kiri dan Guru Pengampu di sebelah kanan, lengkap dengan gelar dan NIP.
  - Nomor halaman dinamis pada footer (`Halaman X dari Y` via `PageNumber.CURRENT` dan `PageNumber.TOTAL_PAGES`).

### 2. Modul Builders (`src/lib/export/`)
- `docx-helpers.ts`: Komponen umum kop madrasah bergaris ganda, identitas tabel rapi, tabel tanda tangan 2 kolom, header/footer, watermark callout draf, dan border standar.
- `build-atp-docx.ts`: Membangun dokumen Alur Tujuan Pembelajaran (ATP) lengkap dengan Capaian Pembelajaran Fase D per elemen, tabel alur tujuan pembelajaran terurut, alokasi JP, dan integrasi Panca Cinta & DPL.
- `build-prota-docx.ts`: Membangun dokumen Program Tahunan (Prota) dengan Bagian I (Analisis Distribusi Minggu Efektif Semester 1 & 2) dan Bagian II (Distribusi Alokasi Waktu per Tujuan Pembelajaran).
- `build-prosem-docx.ts`: Membangun dokumen Program Semester (Prosem) dalam format **Landscape A4/F4**, matriks kalender 6 bulan × minggu 1..5, arsiran sel minggu tidak efektif dengan warna jenis kegiatan, dan legenda kalender pendidikan.
- `build-rpp-docx.ts`: Membangun dokumen RPP / Modul Ajar Mendalam KBC sesuai standar Tabel 3.5 & 3.6 Panduan Kemenag:
  - Identitas dokumen, analisis kesiapan murid, karakteristik materi, DPL, topik Panca Cinta, materi KBC & benang merah.
  - Model & metode pembelajaran, lingkungan & budaya belajar.
  - Desain skenario pengalaman belajar per pertemuan (Awal, Inti sintaks, Penutup) beranotasi 3 prinsip (Berkesadaran, Bermakna, Menggembirakan) dan aksi cinta KBC.
  - Asesmen awal, proses, akhir, tabel rubrik sikap KBC 4 level ketercapaian (MB, B, C, M), KKTP, dan lampiran LKPD.

### 3. Route Handlers & Sanitasi Nama File
- `GET /api/export/[jenis]/[id]?format=docx&paperSize=A4|F4&fontFamily=Times+New+Roman|Arial`:
  - Mendukung jenis dokumen: `atp`, `prota`, `prosem`, dan `rpp`.
  - Autentikasi sesi via Supabase Server Client & verifikasi hak akses (guru pemilik atau waka/kepala/admin).
  - Sanitasi nama file otomatis sesuai standar: `{JENIS}_{Mapel}_{Kelas}_{Semester}_{TahunAjaran}.docx` (misal `RPP_Al-Quran-Hadis_VII_Smt1_2026-2027.docx`).
  - Response binary `new NextResponse(new Uint8Array(buffer), { headers: { 'Content-Disposition': 'attachment; filename=...' } })`.
- `POST /api/export/batch`:
  - Endpoint ekspor massal untuk Waka Kurikulum, Kepala Madrasah, dan Admin.
  - Menerima payload pilihan dokumen (`atp`, `prota`, `prosem_1`, `prosem_2`, `rpp`) untuk satu atau banyak penugasan guru.
  - Menggabungkan seluruh file DOCX ke dalam satu file arsip **ZIP** menggunakan pustaka `jszip`.
  - Nama file arsip: `Perangkat_Ajar_{Madrasah}_{TahunAjaran}.zip`.

### 4. Stylesheet Cetak PDF & Watermark Status
- **Media Print (`@media print`) di `src/app/globals.css`**:
  - Menyembunyikan sidebar, navbar, action bar, dan tombol navigasi saat cetak.
  - Background color diaktifkan (`-webkit-print-color-adjust: exact`).
  - Header tabel (`thead`) berulang otomatis di setiap halaman baru (`display: table-header-group`).
  - Baris tabel (`tr`) dan card (`.print-avoid-break`) dicegah terpotong di tengah halaman (`break-inside: avoid`).
  - Tombol aksi "Cetak / Simpan PDF" di setiap preview memanggil `window.print()`.
- **Watermark DRAF / BELUM DISETUJUI**:
  - Pada DOCX: Header dokumen menampilkan penanda `[ DRAF / BELUM DISETUJUI ]` dan banner callout oranye jika status dokumen belum `disetujui`.
  - Pada PDF / Pratinjau Browser: Lapisan watermark teks diagonal semi-transparan (`.watermark-draf-print`) menutupi halaman jika status belum `disetujui`.

### 5. Antarmuka UI Tombol Ekspor & Batch Hub
- **Tombol Ekspor DOCX di 4 Halaman Pratinjau**:
  - `/atp/[penugasanId]/preview`: Tombol "Unduh DOCX" & "Cetak / Simpan PDF".
  - `/prota/[penugasanId]/preview`: Tombol "Unduh DOCX" & "Cetak / Simpan PDF".
  - `/prosem/[penugasanId]/preview`: Tombol "Unduh DOCX" & "Cetak / Simpan PDF".
  - `/modul-ajar/[id]/preview`: Tombol "Unduh DOCX" & "Cetak / Simpan PDF".
- **Batch Export Hub untuk Staff (`/validasi`)**:
  - Antarmuka interaktif bagi tim kurikulum dan pimpinan madrasah untuk memilih dokumen per guru/mapel.
  - Opsi konfigurasi ukuran kertas (A4 / Folio F4) dan jenis font (Times New Roman / Arial).
  - Indikator progres unduhan dan tombol sekali klik "Unduh Semua Dokumen Terpilih (.ZIP)".

### 6. Verifikasi & Pengujian Mutu
- **Test Suite Tahap 9 (`scripts/test-tahap9.ts`)**: `6/6 PASSED (100%)`.
  - [TEST 1] Pengambilan data penugasan aktif dan profil madrasah: PASSED.
  - [TEST 2] Pembuatan dokumen ATP DOCX (`buildAtpDocx`): PASSED (Buffer 13.1 KB valid).
  - [TEST 3] Pembuatan dokumen PROTA DOCX (`buildProtaDocx`): PASSED (Buffer 13.2 KB valid).
  - [TEST 4] Pembuatan dokumen PROSEM DOCX Landscape (`buildProsemDocx`): PASSED (Buffer 13.1 KB valid).
  - [TEST 5] Pembuatan dokumen RPP DOCX Lengkap (`buildRppDocx`): PASSED (Buffer 14.8 KB valid).
  - [TEST 6] Pembuatan arsip ZIP paket dokumen (`JSZip`): PASSED (Buffer 54.9 KB berisi 4 file docx).
- **Vitest Unit Test (`src/lib/kalender/minggu-efektif.test.ts`)**: `7/7 PASSED (100%)`.
- **Linting (`npm run lint`)**: `0 errors, 0 warnings`.
- **Production Build (`npm run build`)**: Turbopack build sukses 100% (`exit code 0`, 13/13 routes static & dynamic).

---

## 📋 Rincian Pengerjaan Tahap 10 yang Telah Selesai: Validasi & Dashboard

### 1. Alur Status Dokumen & Penguncian Dokumen
- **Siklus Status Standar**:
  `draf` $\rightarrow$ `diajukan` (oleh guru) $\rightarrow$ `disetujui` | `revisi` (oleh waka/kepala) $\rightarrow$ bila revisi, guru memperbaiki lalu ajukan lagi.
- **Penguncian Akses (Locking & Read-Only)**:
  - Dokumen dengan status `diajukan` atau `disetujui` terkunci (*read-only*) bagi guru untuk mencegah manipulasi data saat verifikasi maupun setelah disahkan.
  - Form editor RPP wizard (`rpp-wizard-client.tsx`), ATP, Prota, dan Prosem mengunci input serta menampilkan banner status peninjauan.
- **Fitur "Buat Revisi" (Versioning Salinan Draf)**:
  - Pada dokumen yang telah `disetujui`, disediakan tombol **"Buat Revisi"** yang membuat salinan versi baru berstatus `draf`.
  - Guru dapat mengedit salinan tersebut tanpa menghilangkan rekam jejak dokumen lama yang telah disahkan sebelumnya.

### 2. Audit Trail & Visual Timeline Validasi
- **Tabel `riwayat_validasi`**:
  Setiap transisi status dicatat lengkap: `dokumen_tipe`, `dokumen_id`, `validator_id`, `status_sebelum`, `status_sesudah`, `catatan`, dan `tanggal`.
- **Komponen Visual Timeline (`StatusTimeline`)**:
  - Ditampilkan di bagian bawah pratinjau dokumen (RPP, ATP, Prota, Prosem) dan di panel telaah validator.
  - Menampilkan riwayat transaksi bertingkat, nama dan peran validator/guru, stempel waktu berbahasa Indonesia, badge status berwarna, serta catatan/masukan perbaikan.

### 3. Instrumen Telaah Otomatis 8 Butir (Kemenag & KBC)
- Modul evaluator murni `src/lib/validasi/evaluator.ts` menghitung pemenuhan otomatis 8 indikator pedagogis:
  1. **KBC-1 (Rumusan TP)**: Memuat kompetensi, lingkup materi, dan keterkaitan target.
  2. **KBC-2 (Identifikasi Murid & Nilai)**: Memuat DPL (minimal 1) dan topik Panca Cinta (minimal 1).
  3. **KBC-3 (Integrasi Materi KBC & Benang Merah)**: Materi integrasi KBC dan penjelasan benang merah terisi.
  4. **KBC-4 (Pengalaman Belajar 3M)**: Sintaks memuat pengalaman Memahami, Mengaplikasi, dan Merefleksi.
  5. **KBC-5 (Prinsip Pembelajaran Mendalam)**: Memuat prinsip Berkesadaran, Bermakna, dan Menggembirakan.
  6. **KBC-6 (Aksi Nyata Panca Cinta)**: Sintaks memuat aksi konkret Panca Cinta di kegiatan inti/penutup.
  7. **KBC-7 (Asesmen Holistik)**: Memuat ketiga dimensi asesmen: awal, proses, dan akhir.
  8. **KBC-8 (Konsistensi Alokasi Waktu)**: Durasi langkah kegiatan konsisten dengan alokasi JP penugasan.
- **Panel Telaah (`PanelTelaah`)**:
  - Validator dapat melihat checklist otomatis beserta skor persentase keterpenuhan.
  - Validator dapat memberikan catatan per butir instrumen dan catatan umum telaah.
  - Tombol **"Setujui"** dan **"Minta Revisi"** (wajib mengisi catatan perbaikan).

### 4. Halaman Antrian Validasi (`/validasi`) & Split Screen Telaah
- **Antrian Validasi (`AntrianValidasiClient`)**:
  - Filter interaktif: pencarian teks, status (`semua`, `diajukan`, `revisi`, `disetujui`, `draf`), jenis dokumen (`rpp`, `atp`, `prota`, `prosem`), tingkat kelas (VII/VIII/IX), mata pelajaran, dan guru pengampu.
  - Kartu dokumen ringkas dengan badge status, informasi mapel, rombel, guru, dan tombol **"Telaah Dokumen"**.
- **Split Screen Telaah (`/validasi/telaah/[jenis]/[id]`)**:
  - Sisi kiri: Pratinjau dokumen asli lengkap (tabel & sintaksis format Kemenag).
  - Sisi kanan: Panel telaah 8 butir instrumen KBC + riwayat timeline validasi.

### 5. Beranda Dinamis (Guru vs Staff)
- **Beranda Guru (`/`)**:
  - Banner peringatan dokumen yang perlu revisi beserta catatan perbaikan dari validator.
  - Kartu pintasan **"Lanjutkan Draf Terakhir"** untuk langsung melanjutkan pengerjaan perangkat.
  - Grid kartu progres perangkat per penugasan: status kelengkapan ATP, Prota, Prosem, dan rasio RPP terhadap alokasi TP.
  - Ringkasan integrasi 5 Pilar Panca Cinta KBC.
- **Beranda Staff / Pimpinan (`/`)**:
  - 4 Kartu KPI: Total Antrian Validasi, Persentase Kelengkapan Madrasah, Total Dokumen Disetujui, dan Jumlah Guru Aktif.
  - Tabel rekapitulasi kelengkapan madrasah (Guru $\times$ Jenis Dokumen) dengan badge status visual.
  - Fitur pencarian guru/mapel.
  - Tombol **"Ekspor Rekapitulasi (XLSX)"** untuk supervisi akademik EDM madrasah.

### 6. Ekspor Rekapitulasi Supervisi ke Excel (`exceljs`)
- Generator server-side `src/lib/export/export-rekap-excel.ts` menghasilkan file spreadsheet resmi `.xlsx`.
- Route Handler `GET /api/export/rekap-excel` terproteksi untuk peran staff (`admin`, `kepala`, `waka_kurikulum`).
- Format: Kop resmi madrasah, judul supervisi & EDM, tabel matriks guru $\times$ kelengkapan dokumen dengan warna status (hijau/biru/merah/abu-abu), dan persentase penyelesaian.

### 7. Navigasi & Fitur Logout
- **Header Atas (Pojok Kanan)**: Dropdown menu profil menampilkan email pengguna, peran, tautan Profil Saya, Pengaturan, dan tombol **"Keluar"** (`LogOut`).
- **Sidebar Footer (Bawah Menu)**: Ditambahkan tombol cepat **"Keluar Akun (Logout)"** berikon merah terang yang dapat diakses langsung dengan sekali klik.

### 8. Hasil Pengujian & Verifikasi Mutu
- **Test Suite Tahap 10 (`scripts/test-tahap10.ts`)**: `7/7 PASSED (100%)`.
  - [TEST 1] Penyiapan dokumen sampel RPP: PASSED.
  - [TEST 2] Siklus status: diajukan $\rightarrow$ revisi $\rightarrow$ diajukan $\rightarrow$ disetujui tercatat di timeline audit: PASSED.
  - [TEST 3] Fitur "Buat Revisi" menghasilkan salinan draf baru: PASSED.
  - [TEST 4] Evaluasi otomatis 8 butir instrumen Kemenag & KBC (`evaluasiRppKbc`): PASSED.
  - [TEST 5] Antrian validasi dokumen (`getAntrianValidasiAction`): PASSED (9 dokumen terpantau).
  - [TEST 6] Rekapitulasi kelengkapan madrasah (`getRekapKelengkapanAction`): PASSED.
  - [TEST 7] Ekspor file spreadsheet supervisi EDM (`.xlsx`) via `exceljs`: PASSED (Buffer valid 7.7 KB).
- **Vitest Unit Test (`minggu-efektif.test.ts`)**: `7/7 PASSED (100%)`.
- **Linting (`npm run lint`)**: `0 errors, 0 warnings`.
- **Production Build (`npm run build`)**: Next.js Turbopack build sukses 100% (`exit code 0`, 28 routes compiled).

---

## 🏛️ Rincian Pengerjaan Tahap 13B yang Telah Selesai: Integrasi Bank Data Fase D

### 1. Validasi Bank Data & Skema Zod
- **Skema Zod (`src/lib/bank-data/schema.ts`)**:
  - Skema komprehensif untuk `ManifestSchema`, `RegulasiSchema`, `StrukturKurikulumSchema`, `PancaCintaSchema`, `DplSchema`, `MateriKbcSchema`, `KkoSchema`, dan `MapelBankDataSchema`.
  - Memvalidasi elemen CP verbatim, bab materi, subbab, alokasi tingkat (7/8/9) dan semester (1/2), serta rujukan sumber regulasi/buku.
- **CLI Validator (`scripts/validate-bank-data.ts` - `npm run data:validate`)**:
  - Memeriksa keabsahan seluruh 23 file bank data (`data/fase-d/`).
  - Memastikan seluruh 16 mapel memiliki materi lengkap untuk semester 1 dan 2 pada setiap jenjang kelas VII, VIII, dan IX (total 311 bab materi).
  - Menghasilkan tabel rekapitulasi status kelengkapan per mata pelajaran dengan status 100% LOLOS.

### 2. Migrasi Database Aditif & Keamanan Data
- **File Migrasi (`supabase/migrations/20261014090000_bank_data_schema.sql`)**:
  - Kolom baru pada tabel `mapel`: `slug` (text unique), `jp_default` (jsonb alokasi resmi KMA 1503/2025), `status_verifikasi` (draft/terverifikasi), `verified_by`, `verified_at`.
  - Kolom baru pada tabel `capaian_pembelajaran`: `kode_elemen`, `sumber`, `versi_bank_data`, `asal` ('bank_data' | 'manual'), `status_verifikasi`.
  - Kolom baru pada tabel `materi_kbc`: `ringkasan`, `dalil_hikmah`, `aplikasi_pembelajaran`, `sumber`.
  - Tabel baru `materi_pelajaran`: Menyimpan 311 materi kurikulum (tingkat, semester, bab, subbab, elemen_kode, saran_panca_cinta, saran_dpl, sumber, asal, status_verifikasi).
  - Kebijakan Row Level Security (RLS) diaktifkan: Read untuk semua authenticated user, Write khusus admin dan waka_kurikulum.
  - Trigger otomatis `set_updated_at` untuk pembaharuan stempel waktu.
- **Tipe TypeScript (`src/types/database.ts`)**:
  - Seluruh antarmuka database diperbarui secara konsisten mendukung kolom-kolom baru bank data.

### 3. Skrip Seeder Idempotent & Proteksi Data Pengguna
- **CLI Seeder (`scripts/seed-bank-data.ts` - `npm run data:seed`)**:
  - Mode eksekusi ganda: Simulasi `--dry-run` dan live execution.
  - **Prinsip Keamanan Invariant**: Tidak pernah menimpa atau menghapus data yang bertanda `asal = 'manual'` atau `status_verifikasi = 'terverifikasi'` milik pengguna/guru, kecuali diberikan bendera `--force`.
  - Upfront schema detection: Mendeteksi ketersediaan kolom dan tabel di database secara otomatis agar tidak terjadi runtime failure berulang.
  - Berhasil menyemai 63 elemen CP verbatim resmi dan materi KBC ke Supabase remote.

### 4. Service Layer & Rute Server Bank Data
- **Service Caching (`src/lib/bank-data/service.ts`)**:
  - Lookup data super cepat dengan caching memori in-process.
  - Fungsi bantuan terisolasi: `getBankDataManifest()`, `getBankDataRegulasi()`, `getBankDataStruktur()`, `getBankDataPancaCinta()`, `getBankDataDpl()`, `getBankDataMateriKbc()`, `getBankDataKko()`, `getMapelBankData()`, `getMateriByMapelAndGrade()`, `getKbcByPancaCinta()`.
  - Graceful fallback: Apabila tabel database belum sepenuhnya termigrasi, layanan otomatis membaca data fallback dari folder lokal `data/fase-d/`.
- **Server Actions (`src/app/(app)/master-data/bank-data/actions.ts`)**:
  - `getBankDataOverviewAction`: Mengambil statistik kelengkapan riset dan status verifikasi 16 mapel.
  - `getBankDataMapelDetailAction`: Memuat detail CP, daftar materi, dan referensi regulasi.
  - `toggleVerifyMapelAction`: Aksi verifikasi kurikulum oleh Waka Kurikulum/Admin.
  - `updateCpDeskripsiAction`: Penyuntingan inline deskripsi CP oleh admin/waka (otomatis mengubah status `asal` menjadi `'manual'`).

### 5. Antarmuka Manajemen Bank Data (`/master-data/bank-data`)
- **Akses Ganda (Admin & Waka Kurikulum)**:
  - Middleware Next.js (`src/lib/supabase/middleware.ts`) diperbarui memberikan hak akses khusus rute `/master-data/bank-data` kepada peran `waka_kurikulum` selain `admin`.
  - Menu sidebar (`src/components/app-sidebar.tsx`) menampilkan tautan "Bank Data Fase D" bagi Admin dan Waka Kurikulum.
- **Halaman UI Lengkap (`bank-data-client.tsx`)**:
  - 4 Kartu Ringkasan: Total Mapel (16), Total Elemen CP (63), Total Materi (311 Bab), dan Status Verifikasi Waka.
  - Filter interaktif: Pencarian teks, filter kelompok mapel (PAI, Bahasa Arab, Umum, Muatan Lokal), filter status riset, dan filter status verifikasi.
  - Tabel 16 Mata Pelajaran dengan badge riset (`LENGKAP`, `SEKUNDER_PERLU_CEK`, `TIDAK_DITEMUKAN`, `SEBAGIAN`).
  - Sheet / Modal Detail Mapel: Pratinjau CP verbatim dengan tombol edit inline, penjelajah materi ber-tab kelas (7/8/9) dan semester (1/2), rujukan sumber regulasi, dan tombol verifikasi Waka.
  - 4 Tab Pendukung: Tab Regulasi Resmi, Tab Panca Cinta & KBC, Tab 8 Dimensi DPL, dan Tab Taksonomi Bloom (KKO C1–C6).

### 6. Integrasi Terhadap Form Guru & Dokumen Perangkat
- **Master Data Penugasan (`src/app/(app)/master-data/tabs/tab-penugasan.tsx`)**:
  - Menampilkan alokasi standar jam pelajaran resmi per minggu (`jp_default`) sesuai KMA 1503/2025 saat membuat penugasan kelas 7, 8, atau 9.
- **ATP Wizard - Analisis CP (`src/app/(app)/atp/[penugasanId]/step-1-analisis.tsx`)**:
  - Banner peringatan informatif jika mata pelajaran belum diverifikasi oleh Waka Kurikulum.
  - Combobox/pilihan materi pokok langsung dari daftar bab Bank Data Fase D.
  - Rekomendasi otomatis Panca Cinta & DPL saat materi dipilih, dilengkapi badge tooltip alasan pedagogis.
- **ATP Wizard - Rumusan TP (`src/app/(app)/atp/[penugasanId]/step-2-tp.tsx`)**:
  - Pembantu Kata Kerja Operasional (KKO) Taksonomi Bloom Revisi C1 s.d. C6.
  - Memilih KKO otomatis mengisi kolom kompetensi dan menyelaraskan kata kerja pertama pada kalimat Tujuan Pembelajaran.
- **RPP Wizard - Langkah 2 Identifikasi (`src/app/(app)/modul-ajar/[id]/steps/step2-identifikasi.tsx`)**:
  - Checklist materi integrasi KBC tersaring secara otomatis berdasarkan pilar Panca Cinta yang dipilih guru.
- **Footer Metadata Dokumen**:
  - Preview dokumen (`/atp/preview`, `/modul-ajar/preview`, `/prota/preview`, `/prosem/preview`) dan footer ekspor Word (`src/lib/export/docx-helpers.ts`) mencantumkan rujukan resmi:
    *`Sumber CP: KMA 1503/2025 · Bank data TA 2026/2027 v1.0.0`*.

### 7. Pengujian & Verifikasi Mutu
- **Bank Data Vitest Test Suite (`src/lib/bank-data/bank-data.test.ts`)**: `9/9 PASSED (100%)`.
  - [TEST 1] Manifest valid & berfase D TA 2026/2027: PASSED.
  - [TEST 2] Struktur Kurikulum 16 mata pelajaran MTs: PASSED.
  - [TEST 3] Panca Cinta 5 pilar (PC1–PC5): PASSED.
  - [TEST 4] Dimensi Profil Lulusan 8 dimensi (DPL1–DPL8): PASSED.
  - [TEST 5] 16 berkas JSON mapel lolos skema MapelBankDataSchema: PASSED.
  - [TEST 6] getMateriByMapelAndGrade pemfilteran tingkat & semester: PASSED.
  - [TEST 7] getKbcByPancaCinta pemfilteran materi KBC: PASSED.
  - [TEST 8] KKO Bloom tingkatan C1 hingga C6: PASSED.
  - [TEST 9] Invariant Seeder: Perlindungan data manual/terverifikasi: PASSED.
- **Full Test Suite (`npm run test`)**: `16/16 PASSED (100%)`.
- **Validasi Data (`npm run data:validate`)**: `100% LOLOS (23 berkas, 16 mapel, 311 materi)`.
- **Dokumentasi (`README.md`)**: Penambahan panduan pembaharuan bank data tahun ajaran baru.



