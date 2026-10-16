-- Migrasi Tahap 6: Skema Prota & Analisis Minggu Efektif
-- Tanggal: 2026-10-13

-- 1. Tambah hari_sekolah di tabel madrasah (5 atau 6 hari kerja madrasah)
ALTER TABLE public.madrasah 
ADD COLUMN IF NOT EXISTS hari_sekolah integer DEFAULT 6;

-- 2. Tambah snapshot_minggu_efektif di tabel prota (freeze perhitungan saat disimpan)
ALTER TABLE public.prota 
ADD COLUMN IF NOT EXISTS snapshot_minggu_efektif jsonb;

-- 3. Tambah kolom detail pada prota_item untuk sinkronisasi otomatis dari ATP
ALTER TABLE public.prota_item 
ADD COLUMN IF NOT EXISTS tujuan_pembelajaran_id uuid REFERENCES public.tujuan_pembelajaran(id) ON DELETE SET NULL;

ALTER TABLE public.prota_item 
ADD COLUMN IF NOT EXISTS kode_tp text;

ALTER TABLE public.prota_item 
ADD COLUMN IF NOT EXISTS tujuan_pembelajaran_teks text;

ALTER TABLE public.prota_item 
ADD COLUMN IF NOT EXISTS panca_cinta_nama text;

ALTER TABLE public.prota_item 
ADD COLUMN IF NOT EXISTS keterangan text;
