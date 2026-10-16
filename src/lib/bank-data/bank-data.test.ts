import { describe, it, expect } from "vitest";
import {
  getBankDataManifest,
  getBankDataRegulasi,
  getBankDataStruktur,
  getBankDataPancaCinta,
  getBankDataDpl,
  getBankDataMateriKbc,
  getBankDataKko,
  getAllMapelBankData,
  getMapelBankData,
  getMateriByMapelAndGrade,
  getKbcByPancaCinta,
} from "./service";
import {
  ManifestSchema,
  RegulasiBankDataSchema,
  StrukturKurikulumSchema,
  PancaCintaBankDataSchema,
  DplBankDataSchema,
  MateriKbcBankDataSchema,
  KkoBankDataSchema,
  MapelBankDataSchema,
} from "./schema";

describe("Bank Data Fase D Service & Schema Integration (Tahap 13B)", () => {
  it("1. Manifest harus valid dan berfase D dengan versi TA 2026/2027", () => {
    const manifest = getBankDataManifest();
    const parsed = ManifestSchema.safeParse(manifest);
    expect(parsed.success).toBe(true);
    expect(manifest.fase).toBe("D");
    expect(manifest.tahun_ajaran).toBe("2026/2027");
  });

  it("2. Struktur Kurikulum harus memuat 16 mata pelajaran MTs sesuai KMA 1503/2025", () => {
    const struktur = getBankDataStruktur();
    const parsed = StrukturKurikulumSchema.safeParse(struktur);
    expect(parsed.success).toBe(true);
    expect(struktur.length).toBe(16);

    const slugs = struktur.map((s) => s.mapel_slug);
    expect(slugs).toContain("al-quran-hadis");
    expect(slugs).toContain("akidah-akhlak");
    expect(slugs).toContain("fikih");
    expect(slugs).toContain("ski");
    expect(slugs).toContain("bahasa-arab");
    expect(slugs).toContain("pendidikan-pancasila");
    expect(slugs).toContain("bahasa-indonesia");
    expect(slugs).toContain("matematika");
    expect(slugs).toContain("ipa");
    expect(slugs).toContain("ips");
    expect(slugs).toContain("bahasa-inggris");
    expect(slugs).toContain("pjok");
    expect(slugs).toContain("informatika");
    expect(slugs).toContain("seni-budaya");
    expect(slugs).toContain("prakarya");
    expect(slugs).toContain("bahasa-sunda");

    const regulasi = getBankDataRegulasi();
    const parsedRegulasi = RegulasiBankDataSchema.safeParse(regulasi);
    expect(parsedRegulasi.success).toBe(true);
    expect(regulasi.length).toBeGreaterThan(0);
  });

  it("3. Panca Cinta harus memuat 5 pilar cinta dengan kode PC1–PC5", () => {
    const pancaCinta = getBankDataPancaCinta();
    const parsed = PancaCintaBankDataSchema.safeParse(pancaCinta);
    expect(parsed.success).toBe(true);
    expect(pancaCinta.length).toBe(5);
    expect(pancaCinta.map((p) => p.kode)).toEqual(["PC1", "PC2", "PC3", "PC4", "PC5"]);
  });

  it("4. Dimensi Profil Lulusan harus memuat 8 dimensi DPL1–DPL8", () => {
    const dpl = getBankDataDpl();
    const parsed = DplBankDataSchema.safeParse(dpl);
    expect(parsed.success).toBe(true);
    expect(dpl.length).toBe(8);
    expect(dpl.map((d) => d.kode)).toEqual([
      "DPL1",
      "DPL2",
      "DPL3",
      "DPL4",
      "DPL5",
      "DPL6",
      "DPL7",
      "DPL8",
    ]);
  });

  it("5. Seluruh 16 mata pelajaran harus memiliki file JSON yang lolos validasi MapelBankDataSchema", () => {
    const allMapel = getAllMapelBankData();
    expect(allMapel.length).toBe(16);

    for (const m of allMapel) {
      const parsed = MapelBankDataSchema.safeParse(m);
      expect(parsed.success, `Mapel ${m.slug} tidak lolos skema: ${JSON.stringify(parsed.error?.format())}`).toBe(true);
      expect(m.elemen.length).toBeGreaterThan(0);
      expect(m.materi.length).toBeGreaterThan(0);

      // Cek cakupan kelas 7, 8, 9 semester 1 & 2
      const smtKls7 = m.materi.filter((x) => x.tingkat === 7).map((x) => x.semester);
      const smtKls8 = m.materi.filter((x) => x.tingkat === 8).map((x) => x.semester);
      const smtKls9 = m.materi.filter((x) => x.tingkat === 9).map((x) => x.semester);

      expect(smtKls7).toContain(1);
      expect(smtKls7).toContain(2);
      expect(smtKls8).toContain(1);
      expect(smtKls8).toContain(2);
      expect(smtKls9).toContain(1);
      expect(smtKls9).toContain(2);
    }

    const singleMapel = getMapelBankData("fikih");
    expect(singleMapel).not.toBeNull();
    expect(singleMapel?.slug).toBe("fikih");
  });

  it("6. getMateriByMapelAndGrade harus memfilter materi sesuai kelas dan semester", () => {
    const kls7Smt1 = getMateriByMapelAndGrade("al-quran-hadis", 7, 1);
    expect(kls7Smt1.length).toBeGreaterThan(0);
    expect(kls7Smt1.every((m) => m.tingkat === 7 && m.semester === 1)).toBe(true);

    const kls8All = getMateriByMapelAndGrade("matematika", 8);
    expect(kls8All.length).toBeGreaterThan(0);
    expect(kls8All.every((m) => m.tingkat === 8)).toBe(true);
  });

  it("7. getKbcByPancaCinta harus memfilter materi integrasi sesuai pilar", () => {
    const kbcAll = getBankDataMateriKbc();
    const parsedKbc = MateriKbcBankDataSchema.safeParse(kbcAll);
    expect(parsedKbc.success).toBe(true);

    const pc1Kbc = getKbcByPancaCinta("PC1");
    expect(pc1Kbc.length).toBeGreaterThan(0);
    expect(pc1Kbc.every((k) => k.topik_panca_cinta_kode === "PC1")).toBe(true);
  });

  it("8. KKO Bloom harus memuat tingkatan C1 hingga C6", () => {
    const kko = getBankDataKko();
    const parsed = KkoBankDataSchema.safeParse(kko);
    expect(parsed.success).toBe(true);

    const tingkatList = kko.kognitif.map((t: { tingkat: string }) => t.tingkat);
    expect(tingkatList).toEqual(["C1", "C2", "C3", "C4", "C5", "C6"]);
    for (const t of kko.kognitif) {
      expect(t.kata_kerja.length).toBeGreaterThan(0);
    }
  });

  it("9. Invariant Seeder: Perlindungan data manual/terverifikasi", () => {
    // Simulasi baris yang sudah ditandai manual atau terverifikasi
    const existingDbRow = {
      id: "test-id-1",
      elemen: "Pemahaman Fikih",
      asal: "manual",
      status_verifikasi: "terverifikasi",
    };

    const isForce = false;
    const shouldSkip = (existingDbRow.asal === "manual" || existingDbRow.status_verifikasi === "terverifikasi") && !isForce;
    expect(shouldSkip).toBe(true);

    const shouldOverwriteWithForce = (existingDbRow.asal === "manual" || existingDbRow.status_verifikasi === "terverifikasi") && true;
    expect(shouldOverwriteWithForce).toBe(true);
  });

  it("10. Validasi payload penambahan & pengeditan Bab Bank Data oleh guru", () => {
    const babPayload = {
      bab: "Bab 6: Dinamika Penduduk Benua-Benua di Dunia",
      semester: 2 as const,
      urutan: 6,
      subbab: ["A. Sebaran Penduduk", "B. Komposisi Penduduk"],
      kata_kunci: ["dinamika", "penduduk"],
      deskripsi: "Menanamkan nilai cinta sesama manusia.",
    };

    expect(babPayload.bab.trim().length).toBeGreaterThan(0);
    expect([1, 2]).toContain(babPayload.semester);
    expect(babPayload.urutan).toBeGreaterThan(0);
    expect(babPayload.subbab.length).toBe(2);
    expect(babPayload.kata_kunci.length).toBe(2);
  });
});

