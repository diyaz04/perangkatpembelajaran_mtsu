-- Migrasi Tahap 8: Skema RPP / Modul Ajar Pembelajaran Mendalam KBC (KMA 1503 Tahun 2025)
-- Tanggal: 2026-10-13

-- 1. Tambah kolom snapshot dan atribut pendukung pada tabel rpp
ALTER TABLE public.rpp 
ADD COLUMN IF NOT EXISTS snapshot_rpp jsonb,
ADD COLUMN IF NOT EXISTS jumlah_pertemuan int DEFAULT 1,
ADD COLUMN IF NOT EXISTS alokasi_jp int DEFAULT 2,
ADD COLUMN IF NOT EXISTS menit_per_jp int DEFAULT 40,
ADD COLUMN IF NOT EXISTS karakteristik_materi text,
ADD COLUMN IF NOT EXISTS benang_merah_kbc text,
ADD COLUMN IF NOT EXISTS materi_kbc_custom text,
ADD COLUMN IF NOT EXISTS lintas_disiplin_ilmu text,
ADD COLUMN IF NOT EXISTS topik_pembelajaran text,
ADD COLUMN IF NOT EXISTS metode_pembelajaran text[],
ADD COLUMN IF NOT EXISTS kemitraan_pembelajaran text,
ADD COLUMN IF NOT EXISTS lingkungan_belajar_fisik text,
ADD COLUMN IF NOT EXISTS lingkungan_belajar_virtual text,
ADD COLUMN IF NOT EXISTS budaya_belajar text,
ADD COLUMN IF NOT EXISTS pemanfaatan_digital text,
ADD COLUMN IF NOT EXISTS tujuan_pembelajaran_teks text,
ADD COLUMN IF NOT EXISTS kesiapan_murid jsonb,
ADD COLUMN IF NOT EXISTS rubrik_kbc jsonb,
ADD COLUMN IF NOT EXISTS kktp text,
ADD COLUMN IF NOT EXISTS lampiran jsonb;

-- 2. Tambah kolom pendukung per langkah kegiatan pada tabel rpp_langkah
ALTER TABLE public.rpp_langkah 
ADD COLUMN IF NOT EXISTS pertemuan_ke int DEFAULT 1,
ADD COLUMN IF NOT EXISTS prinsip text[],
ADD COLUMN IF NOT EXISTS panca_cinta_id uuid REFERENCES public.panca_cinta(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS aksi_kbc text;
