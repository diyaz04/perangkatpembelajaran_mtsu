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
