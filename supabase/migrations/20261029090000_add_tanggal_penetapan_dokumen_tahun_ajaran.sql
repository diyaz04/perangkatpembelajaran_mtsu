-- Migration: 20261029090000_add_tanggal_penetapan_dokumen_tahun_ajaran.sql
-- Tambah kolom tanggal_penetapan_dokumen pada tahun_ajaran agar admin dapat
-- mengatur titimangsa (tanggal pengesahan) dokumen TP, ATP, Prota, Prosem, dan
-- RPP, alih-alih selalu memakai tanggal hari ini saat dokumen diekspor/dicetak.

ALTER TABLE public.tahun_ajaran
  ADD COLUMN IF NOT EXISTS tanggal_penetapan_dokumen DATE NULL;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
