-- Migrasi Tahap 7: Skema Program Semester (Prosem)
-- Tanggal: 2026-10-13

-- 1. Tambah kolom snapshot di tabel prosem
ALTER TABLE public.prosem 
ADD COLUMN IF NOT EXISTS snapshot_minggu_efektif jsonb;

ALTER TABLE public.prosem 
ADD COLUMN IF NOT EXISTS snapshot_matriks jsonb;

-- 2. Tambah kolom matriks mingguan dan detail TP di tabel prosem_item
ALTER TABLE public.prosem_item 
ADD COLUMN IF NOT EXISTS distribusi_minggu jsonb;

ALTER TABLE public.prosem_item 
ADD COLUMN IF NOT EXISTS kode_tp text;

ALTER TABLE public.prosem_item 
ADD COLUMN IF NOT EXISTS materi_pokok text;

ALTER TABLE public.prosem_item 
ADD COLUMN IF NOT EXISTS tujuan_pembelajaran_teks text;
