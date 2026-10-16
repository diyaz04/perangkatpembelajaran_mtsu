# Perangkat Ajar KBC — MTs KH A Wahab Muhsin

Aplikasi penyusunan perangkat pembelajaran terintegrasi **Kurikulum Berbasis Cinta (KBC)** dan **Pembelajaran Mendalam (Deep Learning)** untuk guru **MTs KH A Wahab Muhsin** (Tasikmalaya, Jawa Barat).

Aplikasi menghasilkan 4 dokumen yang saling terhubung:
1. **Analisis Capaian Pembelajaran (CP) + Alur Tujuan Pembelajaran (ATP)**
2. **Program Tahunan (Prota)**
3. **Program Semester (Prosem)**
4. **RPP / Modul Ajar Pembelajaran Mendalam terintegrasi KBC**

---

## 📜 Landasan Regulasi
- **KMA 1503 Tahun 2025**: Pedoman Kurikulum Madrasah & Capaian Pembelajaran Fase D (Kelas VII, VIII, IX).
- **Panduan Pembelajaran dan Asesmen (PPA) Kemenag (November 2025)**: Asesmen awal, proses, dan akhir (*as/for/of learning*).
- **Kepdirjen Pendis 6077/2025**: Petunjuk Teknis Pembelajaran Mendalam di Madrasah.
- **KMA 512 Tahun 2026**: Integrasi Nilai Karakter Kurikulum Berbasis Cinta (KBC).

---

## 🛠️ Tech Stack
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React 19, TypeScript strict)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (gaya *new-york*, warna dasar *slate*, aksen *emerald-600*)
- **Database & Auth**: [Supabase](https://supabase.com/) PostgreSQL + `@supabase/ssr` (Row Level Security aktif)
- **Validasi**: [Zod](https://zod.dev/) + [React Hook Form](https://react-hook-form.com/) (Pesan error Bahasa Indonesia)
- **Ikon**: [Lucide React](https://lucide.dev/)

---

## 🚀 Panduan Setup Lokal

### 1. Prasyarat
- **Node.js** versi 20 atau lebih baru (direkomendasikan Node.js LTS).
- **npm** versi 10 atau lebih baru.
- Akun dan proyek [Supabase](https://supabase.com/).

### 2. Instalasi Dependensi
Clone repository dan jalankan instalasi paket:
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Buka file `.env.local` dan isi kredensial proyek Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=https://[ID_PROYEK].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

### 4. Setup Database Supabase
1. Buka dashboard proyek Supabase Anda di browser.
2. Masuk ke menu **SQL Editor**.
3. Buka file `supabase/schema.sql` di repository ini, salin seluruh kodenya, dan tempelkan ke SQL Editor Supabase.
4. Klik **Run**. Script ini akan membuat seluruh tabel, relasi, Row Level Security (RLS), trigger otomatis profil, serta seed data awal (16 Mata Pelajaran MTs, Fase D, 6 Nilai Dasar KBC, 5 Panca Cinta, 8 Dimensi Profil Lulusan, dan Tahun Ajaran 2025/2026).

### 5. Menjalankan Server Pengembangan
Jalankan server Next.js lokal:
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

### 6. Verifikasi Build & Linter
Untuk memastikan seluruh tipe dan kode valid sebelum deploy:
```bash
npm run lint
npm run build
```

---

## 📁 Struktur Direktori
```text
├── src/
│   ├── app/
│   │   ├── (auth)/             # Halaman login, register, reset kata sandi
│   │   │   ├── layout.tsx      # Layout bersih dengan logo madrasah di tengah
│   │   │   └── login/page.tsx
│   │   ├── (app)/              # Layout utama terproteksi autentikasi
│   │   │   ├── layout.tsx      # Sidebar shadcn (Sheet di mobile) + header breadcrumb
│   │   │   ├── page.tsx        # Beranda & ringkasan dokumen
│   │   │   ├── atp/            # Analisis CP & ATP
│   │   │   ├── prota/          # Program Tahunan
│   │   │   ├── prosem/         # Program Semester
│   │   │   ├── modul-ajar/     # RPP / Modul Ajar Pembelajaran Mendalam
│   │   │   ├── validasi/       # Validasi dokumen (khusus Kepala/Waka)
│   │   │   ├── master-data/    # Master data regulasi (khusus Admin)
│   │   │   ├── profil/         # Profil guru
│   │   │   └── pengaturan/     # Pengaturan sistem
│   │   ├── globals.css         # Tema putih bersih, aksen emerald-600, border slate-200
│   │   └── layout.tsx          # Root layout HTML, font Inter, Toaster sonner
│   ├── components/
│   │   ├── ui/                 # 61 Komponen shadcn/ui (button, dialog, sheet, sidebar, dll.)
│   │   ├── app-sidebar.tsx     # Sidebar shadcn resmi dengan menu KBC lengkap
│   │   ├── app-header.tsx      # Header dengan breadcrumb & menu profil
│   │   ├── page-header.tsx     # Komponen judul, deskripsi & tombol aksi
│   │   ├── empty-state.tsx     # Komponen status kosong
│   │   ├── confirm-dialog.tsx  # Komponen konfirmasi aksi (destructive/default)
│   │   └── data-table.tsx      # DataTable generik (paginasi 20 baris, pencarian, sort)
│   ├── hooks/
│   │   ├── use-auto-save.ts    # Simpan otomatis draf (debounce 1,5 detik)
│   │   └── use-mobile.ts       # Deteksi viewport layar ponsel
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Supabase browser client (@supabase/ssr)
│   │   │   ├── server.ts       # Supabase server client (@supabase/ssr)
│   │   │   └── middleware.ts   # Helper refresh sesi Supabase
│   │   └── utils.ts            # Helper cn (tailwind-merge + clsx)
│   ├── middleware.ts           # Middleware Next.js proteksi rute
│   └── types/
│       └── database.ts         # TypeScript schema & konstanta resmi KBC
├── supabase/
│   └── schema.sql              # Skema SQL PostgreSQL lengkap + RLS + Seed Data
├── PROGRESS.md                 # Catatan perkembangan tahapan pengerjaan
└── README.md                   # Dokumentasi proyek
```

---

## 🎨 Konvensi Desain
- **Warna Latar**: `#FFFFFF` (Putih bersih)
- **Teks**: `slate-900` (`#0F172A`)
- **Aksen Tunggal**: `emerald-600` (`#059669`)
- **Border**: `slate-200` (`#E2E8F0`)
- **Border Radius**: `0.5rem` (`8px`)
- **Tipografi**: Inter (Google Fonts)
- **Tanpa Mode Gelap**, tanpa gradien ramai, ramah perangkat mobile (*mobile-first*).

---

## 📦 Memperbarui Bank Data Tiap Tahun Ajaran

Aplikasi dilengkapi dengan Bank Data Kurikulum Berbasis Cinta (KBC) dan Pembelajaran Mendalam Fase D (Kelas 7–9 MTs) yang terstruktur di folder `data/fase-d/`.

### 1. Struktur Folder Bank Data
- `data/fase-d/manifest.json`: Metadata versi bank data, tanggal kumpul, status kelengkapan 16 mapel, dan daftar berkas.
- `data/fase-d/regulasi.json`: Referensi regulasi resmi (KMA 1503/2025, KMA 512/2026, Kepdirjen Pendis 6077/2025, Panduan PPA Nov 2025, dll.).
- `data/fase-d/struktur-kurikulum.json`: Struktur mata pelajaran MTs dan alokasi JP resmi per minggu sesuai KMA 1503/2025.
- `data/fase-d/panca-cinta.json`: 5 Pilar Panca Cinta (PC1–PC5) beserta nilai utama.
- `data/fase-d/materi-kbc.json`: Bank materi integrasi KBC per pilar Panca Cinta lengkap dengan dalil/hikmah dan aplikasi pembelajaran.
- `data/fase-d/dpl.json`: 8 Dimensi Profil Lulusan (DPL1–DPL8) dan elemen kuncinya.
- `data/fase-d/kko.json`: Kata Kerja Operasional Taksonomi Bloom Revisi (C1–C6), afektif (A1–A5), dan psikomotorik (P1–P5).
- `data/fase-d/mapel/*.json`: 16 file JSON spesifik per mata pelajaran memuat CP elemen verbatim, rasional, tujuan mapel, serta sebaran bab/subbab semester 1 & 2 untuk kelas VII, VIII, dan IX.

### 2. Validasi Kualitas & Integritas Data
Sebelum melakukan sinkronisasi atau setelah memperbarui file JSON bank data, jalankan skrip validasi skema Zod:
```bash
npm run data:validate
```
Skrip ini memverifikasi skema seluruh 23 file JSON, memeriksa konsistensi kode elemen, memastikan setiap mapel memiliki materi lengkap untuk kelas 7, 8, 9 pada semester 1 & 2, serta memastikan setiap materi memiliki sumber rujukan.

### 3. Migrasi Skema Database
Migrasi database bank data bersifat aditif (aman untuk data guru yang sudah berjalan di produksi):
- Berkas migrasi: `supabase/migrations/20261014090000_bank_data_schema.sql`
- Tambahan kolom pada tabel `mapel`: `slug`, `jp_default`, `status_verifikasi`, `verified_by`, `verified_at`.
- Tambahan kolom pada tabel `capaian_pembelajaran`: `kode_elemen`, `sumber`, `versi_bank_data`, `asal`, `status_verifikasi`.
- Tambahan tabel baru `materi_pelajaran` dan kolom pada `materi_kbc`.

### 4. Sinkronisasi (Seeding) ke Database Supabase
Jalankan seeder dengan perlindungan data manual:
```bash
# Simulasi tanpa mengubah database (Dry Run):
npm run data:seed -- --dry-run

# Eksekusi sinkronisasi aman (skip data bertanda manual / terverifikasi):
npm run data:seed

# Eksekusi paksa (timpa semua entri):
npm run data:seed -- --force
```

### 5. Verifikasi oleh Waka Kurikulum
Waka Kurikulum atau Admin dapat memverifikasi keselarasan CP & Materi Bank Data melalui menu **Master Data > Bank Data Fase D** (`/master-data/bank-data`). Halaman ini menyediakan pratinjau CP verbatim, penelusuran materi per kelas/semester, rujukan regulasi, dan tombol "Tandai Terverifikasi Waka".

