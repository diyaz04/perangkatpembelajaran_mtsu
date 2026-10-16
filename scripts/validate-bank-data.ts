import fs from "fs";
import path from "path";
import {
  ManifestSchema,
  RegulasiSchema,
  StrukturKurikulumSchema,
  PancaCintaSchema,
  DplSchema,
  MateriKbcSchema,
  KkoSchema,
  MapelBankDataSchema,
} from "../src/lib/bank-data/schema";

interface ValidationResult {
  file: string;
  ok: boolean;
  errors: string[];
}

interface MapelSummary {
  mapel: string;
  slug: string;
  elemenCount: number;
  materiCount: number;
  semesterCoverage: {
    k7s1: number;
    k7s2: number;
    k8s1: number;
    k8s2: number;
    k9s1: number;
    k9s2: number;
  };
  hasValidSources: boolean;
  hasValidElemenCodes: boolean;
  status: string;
}

function runValidation() {
  console.log("================================================================================");
  console.log("📋 VALIDASI BANK DATA FASE D (TA 2026/2027)");
  console.log("================================================================================\n");

  const results: ValidationResult[] = [];
  const mapelSummaries: MapelSummary[] = [];
  let allOk = true;

  // 1. Validasi File Pondasi
  const pondasiFiles = [
    { file: "data/fase-d/manifest.json", schema: ManifestSchema },
    { file: "data/fase-d/regulasi.json", schema: RegulasiSchema },
    { file: "data/fase-d/struktur-kurikulum.json", schema: StrukturKurikulumSchema },
    { file: "data/fase-d/panca-cinta.json", schema: PancaCintaSchema },
    { file: "data/fase-d/dpl.json", schema: DplSchema },
    { file: "data/fase-d/materi-kbc.json", schema: MateriKbcSchema },
    { file: "data/fase-d/kko.json", schema: KkoSchema },
  ];

  console.log("1. MEMERIKSA FILE PONDASI KURIKULUM & REGULASI:");
  for (const item of pondasiFiles) {
    const fullPath = path.resolve(process.cwd(), item.file);
    const errors: string[] = [];
    if (!fs.existsSync(fullPath)) {
      errors.push("File tidak ditemukan!");
    } else {
      try {
        const raw = fs.readFileSync(fullPath, "utf8");
        const json = JSON.parse(raw);
        const parsed = item.schema.safeParse(json);
        if (!parsed.success) {
          errors.push(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
        }
      } catch (e: any) {
        errors.push(`Parse error: ${e.message}`);
      }
    }

    const isOk = errors.length === 0;
    if (!isOk) allOk = false;
    results.push({ file: item.file, ok: isOk, errors });
    console.log(`  ${isOk ? "✅" : "❌"} ${item.file.padEnd(38)} ${isOk ? "[SKEMA VALID]" : "[GAGAL: " + errors.join(", ") + "]"}`);
  }

  // 2. Validasi Seluruh File Mapel di data/fase-d/mapel/
  console.log("\n2. MEMERIKSA BERKAS MATA PELAJARAN (16 MAPEL):");
  const mapelDir = path.resolve(process.cwd(), "data/fase-d/mapel");
  const mapelFiles = fs.readdirSync(mapelDir).filter((f) => f.endsWith(".json"));

  for (const f of mapelFiles) {
    const relativePath = `data/fase-d/mapel/${f}`;
    const fullPath = path.join(mapelDir, f);
    const errors: string[] = [];

    try {
      const raw = fs.readFileSync(fullPath, "utf8");
      const json = JSON.parse(raw);
      const parsed = MapelBankDataSchema.safeParse(json);

      if (!parsed.success) {
        errors.push(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
      } else {
        const data = parsed.data;
        const validElemenCodes = new Set(data.elemen.map((e) => e.kode));

        // Cakupan semester: kls 7 s1/s2, kls 8 s1/s2, kls 9 s1/s2
        const coverage = {
          k7s1: 0,
          k7s2: 0,
          k8s1: 0,
          k8s2: 0,
          k9s1: 0,
          k9s2: 0,
        };

        let hasValidSources = true;
        let hasValidElemenCodes = true;

        for (const m of data.materi) {
          // Cek elemen_kode
          for (const ek of m.elemen_kode) {
            if (!validElemenCodes.has(ek)) {
              hasValidElemenCodes = false;
              errors.push(`Materi '${m.bab}' merujuk kode elemen tidak terdaftar: '${ek}'`);
            }
          }

          // Cek sumber
          const s = m.sumber;
          if (!s || (!s.buku && !s.regulasi_kode)) {
            hasValidSources = false;
            errors.push(`Materi '${m.bab}' tidak memiliki sumber valid!`);
          }

          // Catat coverage
          if (m.tingkat === 7 && m.semester === 1) coverage.k7s1++;
          if (m.tingkat === 7 && m.semester === 2) coverage.k7s2++;
          if (m.tingkat === 8 && m.semester === 1) coverage.k8s1++;
          if (m.tingkat === 8 && m.semester === 2) coverage.k8s2++;
          if (m.tingkat === 9 && m.semester === 1) coverage.k9s1++;
          if (m.tingkat === 9 && m.semester === 2) coverage.k9s2++;
        }

        // Cek kelengkapan semester
        if (coverage.k7s1 === 0) errors.push("Tidak ada materi Kelas 7 Semester 1");
        if (coverage.k7s2 === 0) errors.push("Tidak ada materi Kelas 7 Semester 2");
        if (coverage.k8s1 === 0) errors.push("Tidak ada materi Kelas 8 Semester 1");
        if (coverage.k8s2 === 0) errors.push("Tidak ada materi Kelas 8 Semester 2");
        if (coverage.k9s1 === 0) errors.push("Tidak ada materi Kelas 9 Semester 1");
        if (coverage.k9s2 === 0) errors.push("Tidak ada materi Kelas 9 Semester 2");

        mapelSummaries.push({
          mapel: data.mapel,
          slug: data.slug,
          elemenCount: data.elemen.length,
          materiCount: data.materi.length,
          semesterCoverage: coverage,
          hasValidSources,
          hasValidElemenCodes,
          status: data.status,
        });
      }
    } catch (e: any) {
      errors.push(`Parse error: ${e.message}`);
    }

    const isOk = errors.length === 0;
    if (!isOk) allOk = false;
    results.push({ file: relativePath, ok: isOk, errors });
    console.log(`  ${isOk ? "✅" : "❌"} ${relativePath.padEnd(45)} ${isOk ? "[LENGKAP & VALID]" : "[GAGAL: " + errors.join("; ") + "]"}`);
  }

  // 3. Ringkasan Status per Mapel
  console.log("\n================================================================================");
  console.log("📊 RINGKASAN CAKUPAN MATERI SETIAP MATA PELAJARAN (FASE D)");
  console.log("================================================================================");
  console.log(
    "No".padEnd(4) +
    "Mata Pelajaran".padEnd(36) +
    "Elemen".padEnd(8) +
    "Materi".padEnd(8) +
    "Kls 7 (S1/S2)".padEnd(16) +
    "Kls 8 (S1/S2)".padEnd(16) +
    "Kls 9 (S1/S2)".padEnd(16) +
    "Status"
  );
  console.log("-".repeat(112));

  mapelSummaries.forEach((s, idx) => {
    const k7 = `${s.semesterCoverage.k7s1} / ${s.semesterCoverage.k7s2}`.padEnd(14);
    const k8 = `${s.semesterCoverage.k8s1} / ${s.semesterCoverage.k8s2}`.padEnd(14);
    const k9 = `${s.semesterCoverage.k9s1} / ${s.semesterCoverage.k9s2}`.padEnd(14);
    console.log(
      `${(idx + 1).toString().padEnd(4)}` +
      `${s.mapel.slice(0, 34).padEnd(36)}` +
      `${s.elemenCount.toString().padEnd(8)}` +
      `${s.materiCount.toString().padEnd(8)}` +
      `${k7}  ` +
      `${k8}  ` +
      `${k9}  ` +
      `${s.status}`
    );
  });

  console.log("-".repeat(112));
  console.log(`Total Mapel Tervalidasi : ${mapelSummaries.length} mapel`);
  console.log(`Total Bab / Materi      : ${mapelSummaries.reduce((acc, m) => acc + m.materiCount, 0)} bab`);
  console.log(`Status Keseluruhan      : ${allOk ? "100% LOLOS & MEMENUHI PERSYARATAN" : "DITEMUKAN KESALAHAN"}`);
  console.log("================================================================================\n");

  if (!allOk) {
    process.exit(1);
  }
}

runValidation();
