import { z } from "zod";

/**
 * Skema Zod untuk Manifest Bank Data Fase D
 */
export const ManifestStatusMapelSchema = z.object({
  nama: z.string().min(1),
  status: z.string().min(1),
  sesi: z.number().int().positive(),
  sumber_regulasi: z.string().min(1),
});

export const ManifestSchema = z.object({
  versi: z.string().min(1),
  tanggal_kumpul: z.string().min(1),
  tahun_ajaran: z.string().min(1),
  fase: z.string().min(1),
  jenjang: z.string().min(1),
  sesi_selesai: z.array(z.string()),
  daftar_file: z.array(z.string()),
  status_per_mapel: z.record(z.string(), ManifestStatusMapelSchema),
});

/**
 * Skema Zod untuk Regulasi
 */
export const RegulasiItemSchema = z.object({
  kode: z.string().min(1),
  judul: z.string().min(1),
  nomor: z.string().min(1),
  tanggal: z.string().min(1),
  url: z.string().url().optional().or(z.string()),
  cakupan: z.string().min(1),
});
export const RegulasiSchema = z.array(RegulasiItemSchema);

/**
 * Skema Zod untuk Struktur Kurikulum MTs
 */
export const StrukturKurikulumItemSchema = z.object({
  mapel_slug: z.string().min(1),
  mapel_nama: z.string().min(1),
  kelompok: z.string().min(1),
  jp_per_minggu: z.record(z.string(), z.number()),
  sumber: z.string().min(1),
});
export const StrukturKurikulumSchema = z.array(StrukturKurikulumItemSchema);

/**
 * Skema Zod untuk Panca Cinta
 */
export const PancaCintaItemSchema = z.object({
  id: z.number().int().positive(),
  kode: z.string().min(1),
  nama: z.string().min(1),
  deskripsi: z.string().min(1),
  nilai_utama: z.array(z.string()),
  sumber: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
});
export const PancaCintaSchema = z.array(PancaCintaItemSchema);

/**
 * Skema Zod untuk Dimensi Profil Lulusan (DPL)
 */
export const DplItemSchema = z.object({
  id: z.number().int().positive(),
  kode: z.string().min(1),
  nama: z.string().min(1),
  deskripsi: z.string().min(1),
  elemen_kunci: z.array(z.string()),
  sumber: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
});
export const DplSchema = z.array(DplItemSchema);

/**
 * Skema Zod untuk Materi KBC
 */
export const MateriKbcItemSchema = z.object({
  id: z.number().int().positive(),
  topik_panca_cinta_id: z.number().int().positive(),
  topik_panca_cinta_kode: z.string().min(1),
  topik_panca_cinta_nama: z.string().min(1),
  judul: z.string().min(1),
  ringkasan: z.string().min(1),
  dalil_hikmah: z.string().min(1),
  aplikasi_pembelajaran: z.array(z.string()),
  sumber: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
});
export const MateriKbcSchema = z.array(MateriKbcItemSchema);

/**
 * Skema Zod untuk Kata Kerja Operasional (KKO)
 */
export const KkoItemSchema = z.object({
  tingkat: z.string().min(1),
  nama: z.string().min(1),
  deskripsi: z.string().min(1),
  kata_kerja: z.array(z.string()),
});
export const KkoSchema = z.object({
  kognitif: z.array(KkoItemSchema),
  afektif: z.array(KkoItemSchema),
  psikomotorik: z.array(KkoItemSchema),
});

/**
 * Skema Zod untuk Entri Sumber
 */
export const SumberItemSchema = z.object({
  buku: z.string().optional(),
  penerbit: z.string().optional(),
  tahun: z.union([z.number(), z.string()]).optional(),
  halaman: z.string().optional(),
  url: z.string().optional(),
  regulasi_kode: z.string().optional(),
  diakses: z.string().optional(),
}).passthrough();

/**
 * Skema Zod untuk Elemen CP
 */
export const ElemenCpSchema = z.object({
  kode: z.string().min(1),
  nama: z.string().min(1),
  deskripsi_cp: z.string().min(1),
});

/**
 * Skema Zod untuk Saran Panca Cinta pada Materi
 */
export const SaranPancaCintaSchema = z.object({
  id: z.number().int().positive(),
  alasan: z.string().min(1),
});

/**
 * Skema Zod untuk Materi Pelajaran
 */
export const MateriPelajaranSchema = z.object({
  tingkat: z.union([z.literal(7), z.literal(8), z.literal(9)]),
  semester: z.union([z.literal(1), z.literal(2)]),
  urutan: z.number().int().positive(),
  bab: z.string().min(1),
  deskripsi: z.string().optional(),
  kata_kunci: z.array(z.string()).optional(),
  subbab: z.array(z.string()).min(1),
  elemen_kode: z.array(z.string()).min(1),
  sumber: SumberItemSchema,
  saran_panca_cinta: z.array(SaranPancaCintaSchema).min(1),
  saran_dpl: z.array(z.number().int().positive()).min(1),
});

/**
 * Skema Zod untuk Berkas Mapel Bank Data
 */
export const MapelBankDataSchema = z.object({
  mapel: z.string().min(1),
  slug: z.string().min(1),
  kelompok: z.string().min(1),
  fase: z.literal("D"),
  sumber_cp: z.object({
    regulasi_kode: z.string().min(1),
    halaman: z.string().optional(),
    url: z.string().optional(),
    diakses: z.string().optional(),
  }),
  rasional: z.string().min(1),
  tujuan_mapel: z.array(z.string()).min(1),
  capaian_umum_fase_d: z.string().min(1),
  elemen: z.array(ElemenCpSchema).min(1),
  materi: z.array(MateriPelajaranSchema).min(1),
  status: z.string().min(1),
  catatan: z.string().optional(),
  diverifikasi_oleh: z.string().nullable().optional(),
  tanggal_verifikasi: z.string().nullable().optional(),
});

export type MapelBankData = z.infer<typeof MapelBankDataSchema>;
export type MateriPelajaranData = z.infer<typeof MateriPelajaranSchema>;
export type ElemenCpData = z.infer<typeof ElemenCpSchema>;
export type KkoData = z.infer<typeof KkoSchema>;
export type MateriKbcData = z.infer<typeof MateriKbcSchema>;

// Aliases for bank data tests & external imports
export const RegulasiBankDataSchema = RegulasiSchema;
export const PancaCintaBankDataSchema = PancaCintaSchema;
export const DplBankDataSchema = DplSchema;
export const MateriKbcBankDataSchema = MateriKbcSchema;
export const KkoBankDataSchema = KkoSchema;

// Service type aliases
export type BankDataManifest = z.infer<typeof ManifestSchema>;
export type RegulasiBankData = z.infer<typeof RegulasiSchema>;
export type StrukturKurikulumItem = z.infer<typeof StrukturKurikulumItemSchema>;
export type PancaCintaItemBankData = z.infer<typeof PancaCintaItemSchema>;
export type DplItemBankData = z.infer<typeof DplItemSchema>;
export type MateriKbcBankData = z.infer<typeof MateriKbcItemSchema>;
export type KkoBankData = z.infer<typeof KkoSchema>;


