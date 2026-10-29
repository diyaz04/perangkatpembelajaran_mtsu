-- ==============================================================================
-- MIGRATION: 20261013111717_initial_schema.sql
-- PERANGKAT AJAR KBC — MTs KH A Wahab Muhsin, Tasikmalaya
-- Sesuai KMA 1503/2025, Panduan PPA Kemenag Nov 2025, Kepdirjen Pendis 6077/2025, KMA 512/2026
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'kepala', 'waka_kurikulum', 'guru');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE doc_status AS ENUM ('draf', 'diajukan', 'revisi', 'disetujui');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE jenis_kegiatan_kalender AS ENUM ('libur', 'asesmen', 'matsama', 'ramadhan', 'kegiatan_madrasah', 'lainnya');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE tahap_kegiatan AS ENUM ('awal', 'inti', 'penutup');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE pengalaman_belajar AS ENUM ('memahami', 'mengaplikasi', 'merefleksi');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE versi_rpp AS ENUM ('minimum', 'lengkap');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2.1 CLEAN UP EXISTING / LEGACY TABLES IF ANY
DROP TABLE IF EXISTS public.riwayat_validasi CASCADE;
DROP TABLE IF EXISTS public.rpp_langkah CASCADE;
DROP TABLE IF EXISTS public.rpp CASCADE;
DROP TABLE IF EXISTS public.prosem_item CASCADE;
DROP TABLE IF EXISTS public.prosem_baris CASCADE;
DROP TABLE IF EXISTS public.prosem CASCADE;
DROP TABLE IF EXISTS public.prota_item CASCADE;
DROP TABLE IF EXISTS public.prota_baris CASCADE;
DROP TABLE IF EXISTS public.prota CASCADE;
DROP TABLE IF EXISTS public.atp CASCADE;
DROP TABLE IF EXISTS public.tujuan_pembelajaran CASCADE;
DROP TABLE IF EXISTS public.analisis_cp CASCADE;
DROP TABLE IF EXISTS public.capaian_pembelajaran CASCADE;
DROP TABLE IF EXISTS public.penugasan CASCADE;
DROP TABLE IF EXISTS public.mapel CASCADE;
DROP TABLE IF EXISTS public.kalender_kegiatan CASCADE;
DROP TABLE IF EXISTS public.tahun_ajaran CASCADE;
DROP TABLE IF EXISTS public.materi_kbc CASCADE;
DROP TABLE IF EXISTS public.panca_cinta CASCADE;
DROP TABLE IF EXISTS public.dimensi_profil_lulusan CASCADE;
DROP TABLE IF EXISTS public.model_pembelajaran CASCADE;
DROP TABLE IF EXISTS public.madrasah CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. TRIGGER FUNCTION FOR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 4. TABEL MASTER
-- ==============================================================================

-- 4.1. madrasah (satu baris identitas satuan pendidikan)
CREATE TABLE IF NOT EXISTS public.madrasah (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        TEXT NOT NULL,
  nsm         TEXT,
  npsn        TEXT,
  alamat      TEXT,
  kabupaten   TEXT,
  kepala_nama TEXT,
  kepala_nip  TEXT,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4.2. profiles (id = auth.users.id, nama_lengkap, nip, gelar, role user_role, aktif bool)
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_lengkap TEXT NOT NULL,
  nip          TEXT,
  gelar        TEXT,
  role         user_role NOT NULL DEFAULT 'guru',
  aktif        BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4.3. tahun_ajaran (hanya 1 yang aktif)
CREATE TABLE IF NOT EXISTS public.tahun_ajaran (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama        TEXT NOT NULL UNIQUE, -- mis. "2026/2027"
  tgl_mulai   DATE NOT NULL,
  tgl_selesai DATE NOT NULL,
  smt1_mulai  DATE NOT NULL,
  smt1_selesai DATE NOT NULL,
  smt2_mulai  DATE NOT NULL,
  smt2_selesai DATE NOT NULL,
  aktif       BOOLEAN NOT NULL DEFAULT false,
  tanggal_penetapan_dokumen DATE NULL, -- titimangsa dokumen TP/ATP/Prota/Prosem/RPP
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Unique index memastikan hanya ada SATU tahun ajaran yang aktif = true
CREATE UNIQUE INDEX IF NOT EXISTS uq_tahun_ajaran_aktif ON public.tahun_ajaran (aktif) WHERE aktif = true;

-- 4.4. kalender_kegiatan
CREATE TABLE IF NOT EXISTS public.kalender_kegiatan (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tahun_ajaran_id         UUID NOT NULL REFERENCES public.tahun_ajaran(id) ON DELETE CASCADE,
  tgl_mulai               DATE NOT NULL,
  tgl_selesai             DATE NOT NULL,
  jenis                   jenis_kegiatan_kalender NOT NULL,
  keterangan              TEXT NOT NULL,
  memotong_minggu_efektif BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by              UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4.5. mapel (16 Mapel MTs standar KMA 1503/2025)
CREATE TABLE IF NOT EXISTS public.mapel (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama               TEXT NOT NULL,
  kode               TEXT NOT NULL UNIQUE,
  kelompok           TEXT NOT NULL CHECK (kelompok IN ('PAI', 'Bahasa Arab', 'umum', 'muatan_lokal')),
  jp_per_minggu_kls7 INT NOT NULL DEFAULT 2,
  jp_per_minggu_kls8 INT NOT NULL DEFAULT 2,
  jp_per_minggu_kls9 INT NOT NULL DEFAULT 2,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4.6. penugasan
CREATE TABLE IF NOT EXISTS public.penugasan (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guru_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mapel_id        UUID NOT NULL REFERENCES public.mapel(id) ON DELETE CASCADE,
  tahun_ajaran_id UUID NOT NULL REFERENCES public.tahun_ajaran(id) ON DELETE CASCADE,
  tingkat_kelas   INT NOT NULL CHECK (tingkat_kelas IN (7, 8, 9)),
  rombel          TEXT NOT NULL, -- misal "7A, 7B"
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4.7. capaian_pembelajaran
CREATE TABLE IF NOT EXISTS public.capaian_pembelajaran (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapel_id        UUID NOT NULL REFERENCES public.mapel(id) ON DELETE CASCADE,
  fase            TEXT NOT NULL DEFAULT 'D',
  elemen          TEXT NOT NULL,
  deskripsi_cp    TEXT NOT NULL,
  sumber_regulasi TEXT NOT NULL DEFAULT 'KMA 1503/2025',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4.8. panca_cinta
CREATE TABLE IF NOT EXISTS public.panca_cinta (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  urutan     INT NOT NULL,
  kode       TEXT NOT NULL UNIQUE,
  nama       TEXT NOT NULL,
  deskripsi  TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4.9. materi_kbc
CREATE TABLE IF NOT EXISTS public.materi_kbc (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  panca_cinta_id         UUID NOT NULL REFERENCES public.panca_cinta(id) ON DELETE CASCADE,
  pilar                  TEXT NOT NULL,
  nilai                  TEXT NOT NULL,
  deskripsi              TEXT NOT NULL,
  integrasi_sains_sosial TEXT,
  indikator_perilaku     JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by             UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4.10. dimensi_profil_lulusan (DPL1..DPL8)
CREATE TABLE IF NOT EXISTS public.dimensi_profil_lulusan (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode         TEXT NOT NULL UNIQUE, -- 'DPL1'..'DPL8'
  nama         TEXT NOT NULL,
  elemen_kunci TEXT[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4.11. model_pembelajaran
CREATE TABLE IF NOT EXISTS public.model_pembelajaran (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama       TEXT NOT NULL UNIQUE,
  sintaks    JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ==============================================================================
-- 5. TABEL PERANGKAT
-- ==============================================================================

-- 5.1. analisis_cp
CREATE TABLE IF NOT EXISTS public.analisis_cp (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penugasan_id      UUID NOT NULL REFERENCES public.penugasan(id) ON DELETE CASCADE,
  cp_id             UUID NOT NULL REFERENCES public.capaian_pembelajaran(id) ON DELETE CASCADE,
  materi_pokok      TEXT NOT NULL,
  kompetensi        TEXT NOT NULL,
  alokasi_jp        INT NOT NULL DEFAULT 2,
  status            doc_status NOT NULL DEFAULT 'draf',
  catatan_validator TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 5.2. tujuan_pembelajaran
CREATE TABLE IF NOT EXISTS public.tujuan_pembelajaran (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analisis_cp_id  UUID NOT NULL REFERENCES public.analisis_cp(id) ON DELETE CASCADE,
  kode_tp         TEXT NOT NULL,
  deskripsi       TEXT NOT NULL,
  panca_cinta_ids UUID[] NOT NULL DEFAULT '{}',
  dpl_ids         UUID[] NOT NULL DEFAULT '{}',
  alokasi_jp      INT NOT NULL DEFAULT 2,
  urutan          INT NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 5.3. atp
CREATE TABLE IF NOT EXISTS public.atp (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penugasan_id      UUID NOT NULL REFERENCES public.penugasan(id) ON DELETE CASCADE,
  semester          INT NOT NULL CHECK (semester IN (1, 2)),
  status            doc_status NOT NULL DEFAULT 'draf',
  catatan_validator TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_atp_penugasan_semester UNIQUE (penugasan_id, semester)
);

-- 5.4. prota
CREATE TABLE IF NOT EXISTS public.prota (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penugasan_id      UUID NOT NULL REFERENCES public.penugasan(id) ON DELETE CASCADE UNIQUE,
  status            doc_status NOT NULL DEFAULT 'draf',
  total_jp          INT NOT NULL DEFAULT 0,
  catatan_validator TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 5.5. prota_item
CREATE TABLE IF NOT EXISTS public.prota_item (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prota_id     UUID NOT NULL REFERENCES public.prota(id) ON DELETE CASCADE,
  materi_pokok TEXT NOT NULL,
  semester     INT NOT NULL CHECK (semester IN (1, 2)),
  alokasi_jp   INT NOT NULL DEFAULT 2,
  urutan       INT NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 5.6. prosem
CREATE TABLE IF NOT EXISTS public.prosem (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penugasan_id         UUID NOT NULL REFERENCES public.penugasan(id) ON DELETE CASCADE,
  semester             INT NOT NULL CHECK (semester IN (1, 2)),
  status               doc_status NOT NULL DEFAULT 'draf',
  total_minggu_efektif INT NOT NULL DEFAULT 0,
  total_jp             INT NOT NULL DEFAULT 0,
  catatan_validator    TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_prosem_penugasan_semester UNIQUE (penugasan_id, semester)
);

-- 5.7. prosem_item
CREATE TABLE IF NOT EXISTS public.prosem_item (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prosem_id     UUID NOT NULL REFERENCES public.prosem(id) ON DELETE CASCADE,
  prota_item_id UUID NOT NULL REFERENCES public.prota_item(id) ON DELETE CASCADE,
  minggu_ke     INT[] NOT NULL DEFAULT '{}',
  alokasi_jp    INT NOT NULL DEFAULT 2,
  urutan        INT NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 5.8. rpp
CREATE TABLE IF NOT EXISTS public.rpp (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  penugasan_id              UUID NOT NULL REFERENCES public.penugasan(id) ON DELETE CASCADE,
  atp_id                    UUID REFERENCES public.atp(id) ON DELETE SET NULL,
  materi_pokok              TEXT NOT NULL,
  alokasi_waktu             TEXT NOT NULL DEFAULT '2 x 40 menit',
  pertemuan_ke              INT NOT NULL DEFAULT 1,
  versi                     versi_rpp NOT NULL DEFAULT 'minimum',
  model_id                  UUID REFERENCES public.model_pembelajaran(id) ON DELETE SET NULL,
  tujuan_pembelajaran_ids   UUID[] NOT NULL DEFAULT '{}',
  dimensi_profil_lulusan_ids UUID[] NOT NULL DEFAULT '{}',
  panca_cinta_ids           UUID[] NOT NULL DEFAULT '{}',
  materi_kbc_ids            UUID[] NOT NULL DEFAULT '{}',
  pemahaman_bermakna        TEXT,
  pertanyaan_pemantik       TEXT,
  sarana_prasarana          TEXT,
  diferensiasi_konten       TEXT,
  diferensiasi_proses       TEXT,
  diferensiasi_produk       TEXT,
  asesmen_awal              TEXT,
  asesmen_proses            TEXT,
  asesmen_akhir             TEXT,
  status                    doc_status NOT NULL DEFAULT 'draf',
  catatan_validator         TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 5.9. rpp_langkah
CREATE TABLE IF NOT EXISTS public.rpp_langkah (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rpp_id             UUID NOT NULL REFERENCES public.rpp(id) ON DELETE CASCADE,
  tahap              tahap_kegiatan NOT NULL,
  pengalaman         pengalaman_belajar NOT NULL,
  deskripsi_kegiatan TEXT NOT NULL,
  durasi_menit       INT NOT NULL DEFAULT 10,
  urutan             INT NOT NULL DEFAULT 1,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by         UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 5.10. riwayat_validasi
CREATE TABLE IF NOT EXISTS public.riwayat_validasi (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dokumen_tipe   TEXT NOT NULL CHECK (dokumen_tipe IN ('analisis_cp', 'atp', 'prota', 'prosem', 'rpp')),
  dokumen_id     UUID NOT NULL,
  validator_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status_sebelum doc_status NOT NULL,
  status_sesudah doc_status NOT NULL,
  catatan        TEXT,
  tanggal        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ==============================================================================
-- 6. TRIGGERS updated_at & auto-profile
-- ==============================================================================

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'madrasah', 'profiles', 'tahun_ajaran', 'kalender_kegiatan', 'mapel',
        'penugasan', 'capaian_pembelajaran', 'panca_cinta', 'materi_kbc',
        'dimensi_profil_lulusan', 'model_pembelajaran', 'analisis_cp',
        'tujuan_pembelajaran', 'atp', 'prota', 'prota_item', 'prosem',
        'prosem_item', 'rpp', 'rpp_langkah', 'riwayat_validasi'
      )
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_%1$I_updated_at ON public.%1$I;
      CREATE TRIGGER trg_%1$I_updated_at
      BEFORE UPDATE ON public.%1$I
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', tbl);
  END LOOP;
END $$;

-- Trigger auto-create / sync profile saat user register di auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role public.user_role := 'guru';
BEGIN
  IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    BEGIN
      v_role := (NEW.raw_user_meta_data->>'role')::public.user_role;
    EXCEPTION WHEN OTHERS THEN
      v_role := 'guru'::public.user_role;
    END;
  END IF;

  INSERT INTO public.profiles (id, nama_lengkap, role, aktif, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama_lengkap', split_part(COALESCE(NEW.email, 'guru'), '@', 1)),
    v_role,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    nama_lengkap = EXCLUDED.nama_lengkap,
    role = EXCLUDED.role,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 7. SQL HELPER FUNCTIONS FOR RLS (SECURITY DEFINER)
-- ==============================================================================

-- JANGAN pakai current_role karena reserved keyword Postgres
CREATE OR REPLACE FUNCTION public.app_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
  SELECT COALESCE(
    (SELECT role IN ('admin', 'kepala', 'waka_kurikulum') FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.madrasah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tahun_ajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kalender_kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mapel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.penugasan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capaian_pembelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.panca_cinta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materi_kbc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dimensi_profil_lulusan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_pembelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analisis_cp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tujuan_pembelajaran ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prota_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prosem ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prosem_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rpp_langkah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riwayat_validasi ENABLE ROW LEVEL SECURITY;

-- 8.1. MASTER DATA: SELECT authenticated, INSERT/UPDATE/DELETE admin only
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'madrasah', 'tahun_ajaran', 'kalender_kegiatan', 'mapel', 'penugasan',
      'capaian_pembelajaran', 'panca_cinta', 'materi_kbc', 'dimensi_profil_lulusan',
      'model_pembelajaran'
    ])
  LOOP
    EXECUTE format('
      DROP POLICY IF EXISTS "%1$I_select_auth" ON public.%1$I;
      CREATE POLICY "%1$I_select_auth" ON public.%1$I FOR SELECT
        TO authenticated USING (true);

      DROP POLICY IF EXISTS "%1$I_admin_all" ON public.%1$I;
      CREATE POLICY "%1$I_admin_all" ON public.%1$I FOR ALL
        TO authenticated
        USING (public.app_role() = ''admin'')
        WITH CHECK (public.app_role() = ''admin'');
    ', tbl);
  END LOOP;
END $$;

-- 8.2. PROFILES: SELECT all authenticated, user bisa edit miliknya sendiri, admin full CRUD
DROP POLICY IF EXISTS "profiles_select_auth" ON public.profiles;
CREATE POLICY "profiles_select_auth" ON public.profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.app_role() = 'admin')
  WITH CHECK (auth.uid() = id OR public.app_role() = 'admin');

DROP POLICY IF EXISTS "profiles_insert_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_insert_own_or_admin" ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id OR public.app_role() = 'admin');

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;
CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE
  TO authenticated
  USING (public.app_role() = 'admin');

-- 8.3. DOKUMEN: ANALISIS_CP & TUJUAN_PEMBELAJARAN
DROP POLICY IF EXISTS "analisis_cp_select" ON public.analisis_cp;
CREATE POLICY "analisis_cp_select" ON public.analisis_cp FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = analisis_cp.penugasan_id AND p.guru_id = auth.uid())
  );

DROP POLICY IF EXISTS "analisis_cp_insert_guru" ON public.analisis_cp;
CREATE POLICY "analisis_cp_insert_guru" ON public.analisis_cp FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = analisis_cp.penugasan_id AND p.guru_id = auth.uid())
    OR public.app_role() = 'admin'
  );

DROP POLICY IF EXISTS "analisis_cp_update_guru" ON public.analisis_cp;
CREATE POLICY "analisis_cp_update_guru" ON public.analisis_cp FOR UPDATE
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = analisis_cp.penugasan_id AND p.guru_id = auth.uid()) AND status IN ('draf', 'revisi'))
    OR public.is_staff()
  )
  WITH CHECK (
    (EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = analisis_cp.penugasan_id AND p.guru_id = auth.uid()) AND status IN ('draf', 'diajukan'))
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "analisis_cp_delete_guru" ON public.analisis_cp;
CREATE POLICY "analisis_cp_delete_guru" ON public.analisis_cp FOR DELETE
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = analisis_cp.penugasan_id AND p.guru_id = auth.uid()) AND status IN ('draf', 'revisi'))
    OR public.app_role() = 'admin'
  );

DROP POLICY IF EXISTS "tujuan_pembelajaran_select" ON public.tujuan_pembelajaran;
CREATE POLICY "tujuan_pembelajaran_select" ON public.tujuan_pembelajaran FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.analisis_cp a
      JOIN public.penugasan p ON p.id = a.penugasan_id
      WHERE a.id = tujuan_pembelajaran.analisis_cp_id AND p.guru_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "tujuan_pembelajaran_crud_guru" ON public.tujuan_pembelajaran;
CREATE POLICY "tujuan_pembelajaran_crud_guru" ON public.tujuan_pembelajaran FOR ALL
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM public.analisis_cp a
      JOIN public.penugasan p ON p.id = a.penugasan_id
      WHERE a.id = tujuan_pembelajaran.analisis_cp_id AND p.guru_id = auth.uid() AND a.status IN ('draf', 'revisi')
    ))
    OR public.app_role() = 'admin'
  )
  WITH CHECK (
    (EXISTS (
      SELECT 1 FROM public.analisis_cp a
      JOIN public.penugasan p ON p.id = a.penugasan_id
      WHERE a.id = tujuan_pembelajaran.analisis_cp_id AND p.guru_id = auth.uid() AND a.status IN ('draf', 'revisi')
    ))
    OR public.app_role() = 'admin'
  );

-- 8.4. DOKUMEN: ATP
DROP POLICY IF EXISTS "atp_select" ON public.atp;
CREATE POLICY "atp_select" ON public.atp FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = atp.penugasan_id AND p.guru_id = auth.uid())
  );

DROP POLICY IF EXISTS "atp_insert_guru" ON public.atp;
CREATE POLICY "atp_insert_guru" ON public.atp FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = atp.penugasan_id AND p.guru_id = auth.uid())
    OR public.app_role() = 'admin'
  );

DROP POLICY IF EXISTS "atp_update_guru" ON public.atp;
CREATE POLICY "atp_update_guru" ON public.atp FOR UPDATE
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = atp.penugasan_id AND p.guru_id = auth.uid()) AND status IN ('draf', 'revisi'))
    OR public.is_staff()
  )
  WITH CHECK (
    (EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = atp.penugasan_id AND p.guru_id = auth.uid()) AND status IN ('draf', 'diajukan'))
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "atp_delete_guru" ON public.atp;
CREATE POLICY "atp_delete_guru" ON public.atp FOR DELETE
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = atp.penugasan_id AND p.guru_id = auth.uid()) AND status IN ('draf', 'revisi'))
    OR public.app_role() = 'admin'
  );

-- 8.5. DOKUMEN: PROTA & PROTA_ITEM
DROP POLICY IF EXISTS "prota_select" ON public.prota;
CREATE POLICY "prota_select" ON public.prota FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = prota.penugasan_id AND p.guru_id = auth.uid())
  );

DROP POLICY IF EXISTS "prota_insert_guru" ON public.prota;
CREATE POLICY "prota_insert_guru" ON public.prota FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = prota.penugasan_id AND p.guru_id = auth.uid())
    OR public.app_role() = 'admin'
  );

DROP POLICY IF EXISTS "prota_update_guru" ON public.prota;
CREATE POLICY "prota_update_guru" ON public.prota FOR UPDATE
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = prota.penugasan_id AND p.guru_id = auth.uid()) AND status IN ('draf', 'revisi'))
    OR public.is_staff()
  )
  WITH CHECK (
    (EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = prota.penugasan_id AND p.guru_id = auth.uid()) AND status IN ('draf', 'diajukan'))
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "prota_delete_guru" ON public.prota;
CREATE POLICY "prota_delete_guru" ON public.prota FOR DELETE
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = prota.penugasan_id AND p.guru_id = auth.uid()) AND status IN ('draf', 'revisi'))
    OR public.app_role() = 'admin'
  );

DROP POLICY IF EXISTS "prota_item_select" ON public.prota_item;
CREATE POLICY "prota_item_select" ON public.prota_item FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (SELECT 1 FROM public.prota pr JOIN public.penugasan p ON p.id = pr.penugasan_id WHERE pr.id = prota_item.prota_id AND p.guru_id = auth.uid())
  );

DROP POLICY IF EXISTS "prota_item_crud_guru" ON public.prota_item;
CREATE POLICY "prota_item_crud_guru" ON public.prota_item FOR ALL
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM public.prota pr JOIN public.penugasan p ON p.id = pr.penugasan_id WHERE pr.id = prota_item.prota_id AND p.guru_id = auth.uid() AND pr.status IN ('draf', 'revisi')))
    OR public.app_role() = 'admin'
  )
  WITH CHECK (
    (EXISTS (SELECT 1 FROM public.prota pr JOIN public.penugasan p ON p.id = pr.penugasan_id WHERE pr.id = prota_item.prota_id AND p.guru_id = auth.uid() AND pr.status IN ('draf', 'revisi')))
    OR public.app_role() = 'admin'
  );

-- 8.6. DOKUMEN: PROSEM & PROSEM_ITEM
DROP POLICY IF EXISTS "prosem_select" ON public.prosem;
CREATE POLICY "prosem_select" ON public.prosem FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = prosem.penugasan_id AND p.guru_id = auth.uid())
  );

DROP POLICY IF EXISTS "prosem_insert_guru" ON public.prosem;
CREATE POLICY "prosem_insert_guru" ON public.prosem FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = prosem.penugasan_id AND p.guru_id = auth.uid())
    OR public.app_role() = 'admin'
  );

DROP POLICY IF EXISTS "prosem_update_guru" ON public.prosem;
CREATE POLICY "prosem_update_guru" ON public.prosem FOR UPDATE
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = prosem.penugasan_id AND p.guru_id = auth.uid()) AND status IN ('draf', 'revisi'))
    OR public.is_staff()
  )
  WITH CHECK (
    (EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = prosem.penugasan_id AND p.guru_id = auth.uid()) AND status IN ('draf', 'diajukan'))
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "prosem_delete_guru" ON public.prosem;
CREATE POLICY "prosem_delete_guru" ON public.prosem FOR DELETE
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = prosem.penugasan_id AND p.guru_id = auth.uid()) AND status IN ('draf', 'revisi'))
    OR public.app_role() = 'admin'
  );

DROP POLICY IF EXISTS "prosem_item_select" ON public.prosem_item;
CREATE POLICY "prosem_item_select" ON public.prosem_item FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (SELECT 1 FROM public.prosem ps JOIN public.penugasan p ON p.id = ps.penugasan_id WHERE ps.id = prosem_item.prosem_id AND p.guru_id = auth.uid())
  );

DROP POLICY IF EXISTS "prosem_item_crud_guru" ON public.prosem_item;
CREATE POLICY "prosem_item_crud_guru" ON public.prosem_item FOR ALL
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM public.prosem ps JOIN public.penugasan p ON p.id = ps.penugasan_id WHERE ps.id = prosem_item.prosem_id AND p.guru_id = auth.uid() AND ps.status IN ('draf', 'revisi')))
    OR public.app_role() = 'admin'
  )
  WITH CHECK (
    (EXISTS (SELECT 1 FROM public.prosem ps JOIN public.penugasan p ON p.id = ps.penugasan_id WHERE ps.id = prosem_item.prosem_id AND p.guru_id = auth.uid() AND ps.status IN ('draf', 'revisi')))
    OR public.app_role() = 'admin'
  );

-- 8.7. DOKUMEN: RPP & RPP_LANGKAH
DROP POLICY IF EXISTS "rpp_select" ON public.rpp;
CREATE POLICY "rpp_select" ON public.rpp FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = rpp.penugasan_id AND p.guru_id = auth.uid())
  );

DROP POLICY IF EXISTS "rpp_insert_guru" ON public.rpp;
CREATE POLICY "rpp_insert_guru" ON public.rpp FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = rpp.penugasan_id AND p.guru_id = auth.uid())
    OR public.app_role() = 'admin'
  );

DROP POLICY IF EXISTS "rpp_update_guru" ON public.rpp;
CREATE POLICY "rpp_update_guru" ON public.rpp FOR UPDATE
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = rpp.penugasan_id AND p.guru_id = auth.uid()) AND status IN ('draf', 'revisi'))
    OR public.is_staff()
  )
  WITH CHECK (
    (EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = rpp.penugasan_id AND p.guru_id = auth.uid()) AND status IN ('draf', 'diajukan'))
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "rpp_delete_guru" ON public.rpp;
CREATE POLICY "rpp_delete_guru" ON public.rpp FOR DELETE
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM public.penugasan p WHERE p.id = rpp.penugasan_id AND p.guru_id = auth.uid()) AND status IN ('draf', 'revisi'))
    OR public.app_role() = 'admin'
  );

DROP POLICY IF EXISTS "rpp_langkah_select" ON public.rpp_langkah;
CREATE POLICY "rpp_langkah_select" ON public.rpp_langkah FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR EXISTS (SELECT 1 FROM public.rpp r JOIN public.penugasan p ON p.id = r.penugasan_id WHERE r.id = rpp_langkah.rpp_id AND p.guru_id = auth.uid())
  );

DROP POLICY IF EXISTS "rpp_langkah_crud_guru" ON public.rpp_langkah;
CREATE POLICY "rpp_langkah_crud_guru" ON public.rpp_langkah FOR ALL
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM public.rpp r JOIN public.penugasan p ON p.id = r.penugasan_id WHERE r.id = rpp_langkah.rpp_id AND p.guru_id = auth.uid() AND r.status IN ('draf', 'revisi')))
    OR public.app_role() = 'admin'
  )
  WITH CHECK (
    (EXISTS (SELECT 1 FROM public.rpp r JOIN public.penugasan p ON p.id = r.penugasan_id WHERE r.id = rpp_langkah.rpp_id AND p.guru_id = auth.uid() AND r.status IN ('draf', 'revisi')))
    OR public.app_role() = 'admin'
  );

-- 8.8. RIWAYAT VALIDASI
DROP POLICY IF EXISTS "riwayat_validasi_insert_staff" ON public.riwayat_validasi;
CREATE POLICY "riwayat_validasi_insert_staff" ON public.riwayat_validasi FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "riwayat_validasi_select" ON public.riwayat_validasi;
CREATE POLICY "riwayat_validasi_select" ON public.riwayat_validasi FOR SELECT
  TO authenticated
  USING (
    public.is_staff()
    OR (
      dokumen_tipe = 'analisis_cp' AND EXISTS (
        SELECT 1 FROM public.analisis_cp d
        JOIN public.penugasan p ON p.id = d.penugasan_id
        WHERE d.id = riwayat_validasi.dokumen_id AND p.guru_id = auth.uid()
      )
    )
    OR (
      dokumen_tipe = 'atp' AND EXISTS (
        SELECT 1 FROM public.atp d
        JOIN public.penugasan p ON p.id = d.penugasan_id
        WHERE d.id = riwayat_validasi.dokumen_id AND p.guru_id = auth.uid()
      )
    )
    OR (
      dokumen_tipe = 'prota' AND EXISTS (
        SELECT 1 FROM public.prota d
        JOIN public.penugasan p ON p.id = d.penugasan_id
        WHERE d.id = riwayat_validasi.dokumen_id AND p.guru_id = auth.uid()
      )
    )
    OR (
      dokumen_tipe = 'prosem' AND EXISTS (
        SELECT 1 FROM public.prosem d
        JOIN public.penugasan p ON p.id = d.penugasan_id
        WHERE d.id = riwayat_validasi.dokumen_id AND p.guru_id = auth.uid()
      )
    )
    OR (
      dokumen_tipe = 'rpp' AND EXISTS (
        SELECT 1 FROM public.rpp d
        JOIN public.penugasan p ON p.id = d.penugasan_id
        WHERE d.id = riwayat_validasi.dokumen_id AND p.guru_id = auth.uid()
      )
    )
  );

-- Indexes untuk performa optimal
CREATE INDEX IF NOT EXISTS idx_penugasan_guru ON public.penugasan(guru_id);
CREATE INDEX IF NOT EXISTS idx_penugasan_mapel ON public.penugasan(mapel_id);
CREATE INDEX IF NOT EXISTS idx_penugasan_ta ON public.penugasan(tahun_ajaran_id);
CREATE INDEX IF NOT EXISTS idx_cp_mapel ON public.capaian_pembelajaran(mapel_id);
CREATE INDEX IF NOT EXISTS idx_analisis_cp_penugasan ON public.analisis_cp(penugasan_id);
CREATE INDEX IF NOT EXISTS idx_tp_analisis_cp ON public.tujuan_pembelajaran(analisis_cp_id);
CREATE INDEX IF NOT EXISTS idx_atp_penugasan ON public.atp(penugasan_id);
CREATE INDEX IF NOT EXISTS idx_prota_penugasan ON public.prota(penugasan_id);
CREATE INDEX IF NOT EXISTS idx_prota_item_prota ON public.prota_item(prota_id);
CREATE INDEX IF NOT EXISTS idx_prosem_penugasan ON public.prosem(penugasan_id);
CREATE INDEX IF NOT EXISTS idx_prosem_item_prosem ON public.prosem_item(prosem_id);
CREATE INDEX IF NOT EXISTS idx_rpp_penugasan ON public.rpp(penugasan_id);
CREATE INDEX IF NOT EXISTS idx_rpp_langkah_rpp ON public.rpp_langkah(rpp_id);
CREATE INDEX IF NOT EXISTS idx_riwayat_dokumen ON public.riwayat_validasi(dokumen_id);
-- ==============================================================================
-- SEED DATA: supabase/seed.sql
-- PERANGKAT AJAR KBC — MTs KH A Wahab Muhsin, Tasikmalaya
-- ==============================================================================

-- 1. MADRASAH (Satu baris default)
INSERT INTO public.madrasah (
  nama, nsm, npsn, alamat, kabupaten, kepala_nama, kepala_nip, logo_url
) VALUES (
  'MTs KH A Wahab Muhsin',
  '121232060012',
  '20277890',
  'Jl. Sukahideng, Desa Sukarapih, Kec. Sukarame',
  'Kabupaten Tasikmalaya',
  'Drs. H. Ahmad Wahab, M.Pd.I',
  '197001011995031001',
  '/logo-madrasah.png'
)
ON CONFLICT DO NOTHING;

-- 2. PANCA CINTA (5 Nilai Luhur KBC)
INSERT INTO public.panca_cinta (id, urutan, kode, nama, deskripsi) VALUES
  (
    '00000000-0000-0000-0000-000000000001',
    1,
    'PC1',
    'Cinta Allah dan Rasul',
    'Internalisasi nilai keimanan, ketakwaan, ibadah ikhlas kepada Allah SWT, mahabbah serta meneladani akhlak mulia Rasulullah SAW dalam seluruh dimensi kehidupan.'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    2,
    'PC2',
    'Cinta Ilmu',
    'Membangun tradisi ilmiah, nalar kritis, rasa ingin tahu yang mendalam, gemar membaca, serta terbuka terhadap perkembangan sains, teknologi, dan hikmah peradaban.'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    3,
    'PC3',
    'Cinta Lingkungan',
    'Menjaga kelestarian alam, kebersihan madrasah, kepedulian ekologis, hemat energi, serta kesadaran menjaga bumi sebagai amanah khalifah fil ardh.'
  ),
  (
    '00000000-0000-0000-0000-000000000004',
    4,
    'PC4',
    'Cinta Tanah Air',
    'Rasa bangga sebagai bangsa Indonesia, kesetiaan pada NKRI, pengamalan nilai Pancasila, kerukunan dalam kebinekaan, dan komitmen moderasi beragama.'
  ),
  (
    '00000000-0000-0000-0000-000000000005',
    5,
    'PC5',
    'Cinta Diri dan Sesama',
    'Menghargai martabat kemanusiaan, menjaga kesehatan lahir-batin, menumbuhkan empati, ukhuwah islamiyah, saling menolong, toleransi, dan anti-perundungan.'
  )
ON CONFLICT (kode) DO UPDATE SET
  urutan = EXCLUDED.urutan,
  nama = EXCLUDED.nama,
  deskripsi = EXCLUDED.deskripsi;

-- 3. DIMENSI PROFIL LULUSAN (8 DPL Kemenag Sesuai KMA 1503/2025)
INSERT INTO public.dimensi_profil_lulusan (id, kode, nama, elemen_kunci) VALUES
  (
    '00000000-0000-0000-0000-000000000011',
    'DPL1',
    'Keimanan dan Ketakwaan terhadap Tuhan YME',
    ARRAY['Akhlak Beragama', 'Akhlak Pribadi', 'Akhlak kepada Manusia', 'Akhlak kepada Alam', 'Akhlak Bernegara']
  ),
  (
    '00000000-0000-0000-0000-000000000012',
    'DPL2',
    'Kewargaan',
    ARRAY['Kepedulian Sosial', 'Partisipasi Warga Negara', 'Moderasi Beragama', 'Cinta Perdamaian']
  ),
  (
    '00000000-0000-0000-0000-000000000013',
    'DPL3',
    'Penalaran Kritis',
    ARRAY['Memperoleh Informasi Objektif', 'Menganalisis dan Mengevaluasi Penalaran', 'Refleksi Pemikiran dan Proses Berpikir']
  ),
  (
    '00000000-0000-0000-0000-000000000014',
    'DPL4',
    'Kreativitas',
    ARRAY['Menghasilkan Gagasan Orisinal', 'Menghasilkan Karya dan Tindakan Orisinal', 'Keluwesan Berpikir dalam Mencari Solusi']
  ),
  (
    '00000000-0000-0000-0000-000000000015',
    'DPL5',
    'Kolaborasi',
    ARRAY['Kerjasama Sinergis', 'Komunikasi Positif', 'Saling Ketergantungan Positif', 'Koordinasi Sosial']
  ),
  (
    '00000000-0000-0000-0000-000000000016',
    'DPL6',
    'Kemandirian',
    ARRAY['Pemahaman Diri dan Situasi yang Dihadapi', 'Regulasi Diri dan Disiplin', 'Percaya Diri dan Pantang Menyerah']
  ),
  (
    '00000000-0000-0000-0000-000000000017',
    'DPL7',
    'Kesehatan',
    ARRAY['Kebugaran Jasmani', 'Kesehatan Mental-Emosional', 'Pola Hidup Sehat dan Bersih']
  ),
  (
    '00000000-0000-0000-0000-000000000018',
    'DPL8',
    'Komunikasi',
    ARRAY['Menyimak Aktif', 'Menyampaikan Ide dan Perasaan', 'Etika dan Literasi Komunikasi Digital']
  )
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  elemen_kunci = EXCLUDED.elemen_kunci;

-- 4. TAHUN AJARAN (2026/2027 Aktif)
INSERT INTO public.tahun_ajaran (
  nama, tgl_mulai, tgl_selesai, smt1_mulai, smt1_selesai, smt2_mulai, smt2_selesai, aktif
) VALUES (
  '2026/2027',
  '2026-07-13',
  '2027-06-25',
  '2026-07-13',
  '2026-12-19',
  '2027-01-04',
  '2027-06-25',
  true
)
ON CONFLICT (nama) DO UPDATE SET
  tgl_mulai = EXCLUDED.tgl_mulai,
  tgl_selesai = EXCLUDED.tgl_selesai,
  smt1_mulai = EXCLUDED.smt1_mulai,
  smt1_selesai = EXCLUDED.smt1_selesai,
  smt2_mulai = EXCLUDED.smt2_mulai,
  smt2_selesai = EXCLUDED.smt2_selesai,
  aktif = EXCLUDED.aktif;

-- 5. MATA PELAJARAN (16 Mapel MTs standar KMA 1503/2025 lengkap JP kls 7, 8, 9)
INSERT INTO public.mapel (nama, kode, kelompok, jp_per_minggu_kls7, jp_per_minggu_kls8, jp_per_minggu_kls9) VALUES
  ('Al-Qur''an Hadis',               'QH',    'PAI',          2, 2, 2),
  ('Akidah Akhlak',                  'AA',    'PAI',          2, 2, 2),
  ('Fikih',                          'FIKIH', 'PAI',          2, 2, 2),
  ('Sejarah Kebudayaan Islam (SKI)', 'SKI',   'PAI',          2, 2, 2),
  ('Bahasa Arab',                    'ARAB',  'Bahasa Arab',  3, 3, 3),
  ('Pendidikan Pancasila',           'PKN',   'umum',         2, 2, 2),
  ('Bahasa Indonesia',               'BIND',  'umum',         5, 5, 5),
  ('Matematika',                     'MAT',   'umum',         4, 4, 4),
  ('Ilmu Pengetahuan Alam (IPA)',    'IPA',   'umum',         4, 4, 4),
  ('Ilmu Pengetahuan Sosial (IPS)',  'IPS',   'umum',         3, 3, 3),
  ('Bahasa Inggris',                 'BING',  'umum',         3, 3, 3),
  ('Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', 'PJOK', 'umum', 2, 2, 2),
  ('Informatika',                    'INFO',  'umum',         2, 2, 2),
  ('Seni Budaya',                    'SBDP',  'umum',         2, 2, 2),
  ('Prakarya',                       'PRAKAR','umum',         2, 2, 2),
  ('Muatan Lokal (Bahasa Sunda)',    'SUNDA', 'muatan_lokal', 2, 2, 2)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kelompok = EXCLUDED.kelompok,
  jp_per_minggu_kls7 = EXCLUDED.jp_per_minggu_kls7,
  jp_per_minggu_kls8 = EXCLUDED.jp_per_minggu_kls8,
  jp_per_minggu_kls9 = EXCLUDED.jp_per_minggu_kls9;

-- 6. MODEL PEMBELAJARAN (6 Model dengan Sintaks JSON)
INSERT INTO public.model_pembelajaran (nama, sintaks) VALUES
  (
    'Project Based Learning (PjBL)',
    '[
      {"urutan": 1, "nama_sintaks": "Penentuan Pertanyaan Mendasar", "pengalaman_belajar": "memahami"},
      {"urutan": 2, "nama_sintaks": "Mendesain Perencanaan Proyek", "pengalaman_belajar": "memahami"},
      {"urutan": 3, "nama_sintaks": "Menyusun Jadwal Pembuatan Proyek", "pengalaman_belajar": "mengaplikasi"},
      {"urutan": 4, "nama_sintaks": "Memonitor Keaktifan dan Perkembangan Proyek", "pengalaman_belajar": "mengaplikasi"},
      {"urutan": 5, "nama_sintaks": "Menguji Hasil (Penilaian Produk)", "pengalaman_belajar": "mengaplikasi"},
      {"urutan": 6, "nama_sintaks": "Evaluasi Pengalaman Belajar", "pengalaman_belajar": "merefleksi"}
    ]'::jsonb
  ),
  (
    'Problem Based Learning (PBL)',
    '[
      {"urutan": 1, "nama_sintaks": "Orientasi Peserta Didik pada Masalah", "pengalaman_belajar": "memahami"},
      {"urutan": 2, "nama_sintaks": "Mengorganisasikan Peserta Didik untuk Belajar", "pengalaman_belajar": "memahami"},
      {"urutan": 3, "nama_sintaks": "Membimbing Penyelidikan Individu maupun Kelompok", "pengalaman_belajar": "mengaplikasi"},
      {"urutan": 4, "nama_sintaks": "Mengembangkan dan Menyajikan Hasil Karya", "pengalaman_belajar": "mengaplikasi"},
      {"urutan": 5, "nama_sintaks": "Menganalisis dan Mengevaluasi Proses Pemecahan Masalah", "pengalaman_belajar": "merefleksi"}
    ]'::jsonb
  ),
  (
    'Discovery Learning',
    '[
      {"urutan": 1, "nama_sintaks": "Pemberian Rangsangan (Stimulation)", "pengalaman_belajar": "memahami"},
      {"urutan": 2, "nama_sintaks": "Identifikasi Masalah (Problem Statement)", "pengalaman_belajar": "memahami"},
      {"urutan": 3, "nama_sintaks": "Pengumpulan Data (Data Collection)", "pengalaman_belajar": "mengaplikasi"},
      {"urutan": 4, "nama_sintaks": "Pengolahan Data (Data Processing)", "pengalaman_belajar": "mengaplikasi"},
      {"urutan": 5, "nama_sintaks": "Pembuktian (Verification)", "pengalaman_belajar": "mengaplikasi"},
      {"urutan": 6, "nama_sintaks": "Menarik Simpulan/Generalisasi (Generalization)", "pengalaman_belajar": "merefleksi"}
    ]'::jsonb
  ),
  (
    'Inquiry Learning',
    '[
      {"urutan": 1, "nama_sintaks": "Orientasi Masalah", "pengalaman_belajar": "memahami"},
      {"urutan": 2, "nama_sintaks": "Merumuskan Masalah dan Hipotesis", "pengalaman_belajar": "memahami"},
      {"urutan": 3, "nama_sintaks": "Mengumpulkan Data dan Informasi", "pengalaman_belajar": "mengaplikasi"},
      {"urutan": 4, "nama_sintaks": "Menguji Hipotesis", "pengalaman_belajar": "mengaplikasi"},
      {"urutan": 5, "nama_sintaks": "Merumuskan Kesimpulan", "pengalaman_belajar": "merefleksi"}
    ]'::jsonb
  ),
  (
    'Cooperative Learning',
    '[
      {"urutan": 1, "nama_sintaks": "Menyampaikan Tujuan dan Memotivasi Peserta Didik", "pengalaman_belajar": "memahami"},
      {"urutan": 2, "nama_sintaks": "Menyajikan Informasi", "pengalaman_belajar": "memahami"},
      {"urutan": 3, "nama_sintaks": "Mengorganisasikan Peserta Didik ke Kelompok Belajar", "pengalaman_belajar": "mengaplikasi"},
      {"urutan": 4, "nama_sintaks": "Membimbing Kelompok Bekerja dan Belajar", "pengalaman_belajar": "mengaplikasi"},
      {"urutan": 5, "nama_sintaks": "Evaluasi", "pengalaman_belajar": "merefleksi"},
      {"urutan": 6, "nama_sintaks": "Memberikan Penghargaan", "pengalaman_belajar": "merefleksi"}
    ]'::jsonb
  ),
  (
    'LOK-R (Literasi, Orientasi, Kolaborasi, Refleksi)',
    '[
      {"urutan": 1, "nama_sintaks": "Literasi (Membaca & Memaknai Konteks)", "pengalaman_belajar": "memahami"},
      {"urutan": 2, "nama_sintaks": "Orientasi (Eksplorasi Masalah & Nilai Kasih Sayang)", "pengalaman_belajar": "memahami"},
      {"urutan": 3, "nama_sintaks": "Kolaborasi (Aksi Nyata & Pemecahan Masalah)", "pengalaman_belajar": "mengaplikasi"},
      {"urutan": 4, "nama_sintaks": "Refleksi (Makna Spiritual & Resolusi Aksi Cinta)", "pengalaman_belajar": "merefleksi"}
    ]'::jsonb
  )
ON CONFLICT (nama) DO UPDATE SET
  sintaks = EXCLUDED.sintaks;

-- 7. CAPAIAN PEMBELAJARAN (CP) DAN MATERI KBC
-- Dibiarkan kosong sesuai spesifikasi Tahap 2 (akan diisi di tahap berikutnya)

-- ==============================================================================
-- 8. BANK DATA KURIKULUM FASE D (TA 2026/2027)
-- ==============================================================================

-- 8.1. Kolom tambahan tabel mapel
ALTER TABLE public.mapel
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS jp_default jsonb DEFAULT '{"7":2,"8":2,"9":2}',
ADD COLUMN IF NOT EXISTS status_verifikasi text DEFAULT 'terverifikasi',
ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- 8.2. Kolom tambahan capaian_pembelajaran
ALTER TABLE public.capaian_pembelajaran
ADD COLUMN IF NOT EXISTS kode_elemen text,
ADD COLUMN IF NOT EXISTS sumber jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS versi_bank_data text,
ADD COLUMN IF NOT EXISTS asal text DEFAULT 'manual' CHECK (asal IN ('manual', 'bank_data')),
ADD COLUMN IF NOT EXISTS status_verifikasi text DEFAULT 'belum' CHECK (status_verifikasi IN ('belum', 'terverifikasi'));

-- 8.3. Kolom tambahan materi_kbc
ALTER TABLE public.materi_kbc
ADD COLUMN IF NOT EXISTS kode_elemen text,
ADD COLUMN IF NOT EXISTS sumber jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS versi_bank_data text,
ADD COLUMN IF NOT EXISTS asal text DEFAULT 'manual' CHECK (asal IN ('manual', 'bank_data')),
ADD COLUMN IF NOT EXISTS status_verifikasi text DEFAULT 'belum' CHECK (status_verifikasi IN ('belum', 'terverifikasi'));

-- 8.4. Tabel materi_pelajaran
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

ALTER TABLE public.materi_pelajaran ADD COLUMN IF NOT EXISTS deskripsi text;
ALTER TABLE public.materi_pelajaran ADD COLUMN IF NOT EXISTS kata_kunci text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_materi_pelajaran_mapel ON public.materi_pelajaran(mapel_id);
CREATE INDEX IF NOT EXISTS idx_materi_pelajaran_tingkat_semester ON public.materi_pelajaran(mapel_id, tingkat, semester);
CREATE INDEX IF NOT EXISTS idx_materi_pelajaran_verifikasi ON public.materi_pelajaran(status_verifikasi);

-- 8.5. RLS untuk materi_pelajaran
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

-- 8.6. Trigger updated_at materi_pelajaran
DROP TRIGGER IF EXISTS set_materi_pelajaran_updated_at ON public.materi_pelajaran;
CREATE TRIGGER set_materi_pelajaran_updated_at
BEFORE UPDATE ON public.materi_pelajaran
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

