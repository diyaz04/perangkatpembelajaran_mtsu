-- Migrasi Tahap 13B: Skema Bank Data Kurikulum Fase D (TA 2026/2027)
-- Bersifat murni ADDITIVE: tidak mengubah / menghapus kolom yang sudah ada

-- 1. Tambah kolom slug, jp_default, dan status_verifikasi pada tabel mapel
ALTER TABLE public.mapel
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS jp_default jsonb DEFAULT '{"7":2,"8":2,"9":2}',
ADD COLUMN IF NOT EXISTS status_verifikasi text DEFAULT 'terverifikasi',
ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- 2. Tambah kolom kode_elemen, sumber, versi_bank_data, asal, status_verifikasi pada capaian_pembelajaran
ALTER TABLE public.capaian_pembelajaran
ADD COLUMN IF NOT EXISTS kode_elemen text,
ADD COLUMN IF NOT EXISTS sumber jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS versi_bank_data text,
ADD COLUMN IF NOT EXISTS asal text DEFAULT 'manual' CHECK (asal IN ('manual', 'bank_data')),
ADD COLUMN IF NOT EXISTS status_verifikasi text DEFAULT 'belum' CHECK (status_verifikasi IN ('belum', 'terverifikasi'));

-- 3. Tambah kolom kode_elemen, sumber, versi_bank_data, asal, status_verifikasi pada materi_kbc
ALTER TABLE public.materi_kbc
ADD COLUMN IF NOT EXISTS kode_elemen text,
ADD COLUMN IF NOT EXISTS sumber jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS versi_bank_data text,
ADD COLUMN IF NOT EXISTS asal text DEFAULT 'manual' CHECK (asal IN ('manual', 'bank_data')),
ADD COLUMN IF NOT EXISTS status_verifikasi text DEFAULT 'belum' CHECK (status_verifikasi IN ('belum', 'terverifikasi'));

-- 4. Buat tabel materi_pelajaran
CREATE TABLE IF NOT EXISTS public.materi_pelajaran (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    mapel_id uuid NOT NULL REFERENCES public.mapel(id) ON DELETE CASCADE,
    tingkat int NOT NULL CHECK (tingkat IN (7, 8, 9)),
    semester int NOT NULL CHECK (semester IN (1, 2)),
    urutan int NOT NULL,
    bab text NOT NULL,
    deskripsi text,
    kata_kunci text[] NOT NULL DEFAULT '{}',
    subbab text[] NOT NULL DEFAULT '{}',
    elemen_cp_ids uuid[] NOT NULL DEFAULT '{}',
    saran_panca_cinta jsonb NOT NULL DEFAULT '[]',
    saran_dpl int[] NOT NULL DEFAULT '{}',
    sumber jsonb NOT NULL DEFAULT '{}',
    versi_bank_data text,
    status_verifikasi text NOT NULL DEFAULT 'belum' CHECK (status_verifikasi IN ('belum', 'terverifikasi')),
    asal text NOT NULL DEFAULT 'bank_data' CHECK (asal IN ('manual', 'bank_data')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    CONSTRAINT uq_materi_pelajaran_urutan UNIQUE (mapel_id, tingkat, semester, urutan)
);

-- Pastikan kolom deskripsi dan kata_kunci ada jika tabel sudah dibuat sebelumnya
ALTER TABLE public.materi_pelajaran ADD COLUMN IF NOT EXISTS deskripsi text;
ALTER TABLE public.materi_pelajaran ADD COLUMN IF NOT EXISTS kata_kunci text[] DEFAULT '{}';

-- Index performa query materi
CREATE INDEX IF NOT EXISTS idx_materi_pelajaran_mapel ON public.materi_pelajaran(mapel_id);
CREATE INDEX IF NOT EXISTS idx_materi_pelajaran_tingkat_semester ON public.materi_pelajaran(mapel_id, tingkat, semester);
CREATE INDEX IF NOT EXISTS idx_materi_pelajaran_verifikasi ON public.materi_pelajaran(status_verifikasi);

-- 5. RLS untuk materi_pelajaran
ALTER TABLE public.materi_pelajaran ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'materi_pelajaran' AND policyname = 'materi_pelajaran_read'
    ) THEN
        CREATE POLICY "materi_pelajaran_read" ON public.materi_pelajaran
        FOR SELECT USING (auth.role() = 'authenticated');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'materi_pelajaran' AND policyname = 'materi_pelajaran_staff_admin'
    ) THEN
        CREATE POLICY "materi_pelajaran_staff_admin" ON public.materi_pelajaran
        FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());
    END IF;
END $$;

-- 6. Helper trigger function & Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_materi_pelajaran_updated_at ON public.materi_pelajaran;
CREATE TRIGGER set_materi_pelajaran_updated_at
BEFORE UPDATE ON public.materi_pelajaran
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

