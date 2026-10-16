-- Migration: 20261013143000_tahap5_schema.sql
-- Penyesuaian skema tabel untuk Tahap 5: Analisis CP, TP, dan ATP

-- 1. Tambah kolom pendukung di analisis_cp
ALTER TABLE public.analisis_cp
  ADD COLUMN IF NOT EXISTS kata_kunci TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS benang_merah TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS dpl_ids UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS panca_cinta_ids UUID[] NOT NULL DEFAULT '{}';

-- 2. Tambah kolom pendukung di tujuan_pembelajaran
ALTER TABLE public.tujuan_pembelajaran
  ADD COLUMN IF NOT EXISTS semester INT NOT NULL DEFAULT 1 CHECK (semester IN (1, 2)),
  ADD COLUMN IF NOT EXISTS kompetensi TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS lingkup_materi TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS konteks TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS kktp JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 3. Tambah kolom metode_pengurutan di atp
ALTER TABLE public.atp
  ADD COLUMN IF NOT EXISTS metode_pengurutan TEXT NOT NULL DEFAULT 'konkret_ke_abstrak';

-- 4. Pastikan status ATP dapat bernilai doc_status default 'draf'
-- Dan reload schema cache
NOTIFY pgrst, 'reload schema';
