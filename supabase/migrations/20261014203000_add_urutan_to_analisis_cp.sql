-- Migration: 20261014203000_add_urutan_to_analisis_cp.sql
-- Tambah kolom urutan pada analisis_cp untuk mendukung pengurutan CP secara eksplisit

ALTER TABLE public.analisis_cp
  ADD COLUMN IF NOT EXISTS urutan INT NOT NULL DEFAULT 1;

-- Pastikan indeks dibuat untuk performa query
CREATE INDEX IF NOT EXISTS idx_analisis_cp_penugasan_urutan 
  ON public.analisis_cp(penugasan_id, urutan);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
