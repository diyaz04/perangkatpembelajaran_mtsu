import ExcelJS from "exceljs";
import { formatGuruDropdownLabel, formatMapelDropdownLabel, type GuruReference, type MapelReference } from "../export/export-template-penugasan";

export interface ParsedPenugasanRow {
  rowNumber: number;
  rawGuru: string;
  rawMapel: string;
  rawTingkat: string;
  rawRombel: string;
  guru_id: string | null;
  guru_nama: string | null;
  mapel_id: string | null;
  mapel_nama: string | null;
  mapel_kode: string | null;
  tingkat_kelas: 7 | 8 | 9 | null;
  rombel: string;
  keterangan: string | null;
  errors: string[];
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text.trim();
    if ("result" in value && value.result != null) return String(value.result).trim();
    return "";
  }
  return String(value).trim();
}

/**
 * Normalisasi string nama: huruf kecil, hapus gelar akademik umum, hilangkan tanda baca & spasi berlebih
 */
function normalizeName(str: string): string {
  return str
    .toLowerCase()
    .replace(/\b(s\.pd\.?i?|m\.pd\.?i?|s\.si|s\.kom|m\.m\.pd|s\.sos|h\.|ustadz|drs\.|dra\.)\b/gi, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalisasi nama mapel: hilangkan kurung dan tanda baca
 */
function normalizeMapel(str: string): string {
  return str
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parsing tingkat kelas dari berbagai format (7, 8, 9, VII, VIII, IX, "Kelas 7", dll.)
 */
export function parseTingkatKelas(raw: string): 7 | 8 | 9 | null {
  const clean = raw.trim().toUpperCase();
  if (clean === "7" || clean === "VII" || clean.includes("7") || clean.includes("VII")) return 7;
  if (clean === "8" || clean === "VIII" || clean.includes("8") || clean.includes("VIII")) return 8;
  if (clean === "9" || clean === "IX" || clean.includes("9") || clean.includes("IX")) return 9;
  return null;
}

/**
 * Mencocokkan guru dari teks input terhadap daftar referensi pengguna terdaftar
 */
export function findMatchingGuru(raw: string, guruList: GuruReference[]): GuruReference | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  // 1. Cocokkan persis dengan format dropdown: formatGuruDropdownLabel
  for (const g of guruList) {
    if (formatGuruDropdownLabel(g).toLowerCase() === lower) {
      return g;
    }
  }

  // 2. Cocokkan jika string mengandung NIP: "(NIP: 1988...)" atau angka NIP murni
  const nipMatch = trimmed.match(/\b\d{8,}\b/);
  if (nipMatch) {
    const nipFound = nipMatch[0];
    const matchByNip = guruList.find((g) => g.nip && g.nip.replace(/\D/g, "") === nipFound);
    if (matchByNip) return matchByNip;
  }

  // 3. Cocokkan dengan nama_lengkap + gelar ("Diyaz Najib, S.Pd")
  for (const g of guruList) {
    const full = `${g.nama_lengkap}${g.gelar ? `, ${g.gelar}` : ""}`.toLowerCase();
    if (full === lower) return g;
  }

  // 4. Cocokkan dengan nama_lengkap saja
  for (const g of guruList) {
    if (g.nama_lengkap.toLowerCase() === lower) {
      return g;
    }
  }

  // 5. Cocokkan dengan normalisasi nama (tanpa gelar dan tanda baca)
  const normRaw = normalizeName(trimmed);
  if (normRaw.length >= 3) {
    for (const g of guruList) {
      const normG = normalizeName(g.nama_lengkap);
      if (normG === normRaw) return g;
    }
  }

  return null;
}

/**
 * Mencocokkan mapel dari teks input terhadap daftar referensi mapel
 */
export function findMatchingMapel(raw: string, mapelList: MapelReference[]): MapelReference | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  // 1. Cocokkan persis dengan format dropdown: formatMapelDropdownLabel ("[SKI] Sejarah Kebudayaan Islam")
  for (const m of mapelList) {
    if (formatMapelDropdownLabel(m).toLowerCase() === lower) {
      return m;
    }
  }

  // 2. Jika diawali kurung siku "[KODE]" (contoh: "[SKI] Sejarah Kebudayaan Islam")
  const bracketMatch = trimmed.match(/^\[([^\]]+)\]/);
  if (bracketMatch) {
    const kode = bracketMatch[1].trim().toUpperCase();
    const match = mapelList.find((m) => m.kode.toUpperCase() === kode);
    if (match) return match;
  }

  // 3. Cocokkan persis dengan kode mapel (contoh: "SKI", "MAT", "IPA")
  const matchKode = mapelList.find((m) => m.kode.toUpperCase() === trimmed.toUpperCase());
  if (matchKode) return matchKode;

  // 4. Cocokkan persis dengan nama mapel
  const matchNama = mapelList.find((m) => m.nama.toLowerCase() === lower);
  if (matchNama) return matchNama;

  // 5. Cocokkan dengan nama mapel yang dinormalisasi (tanpa singkatan dalam kurung)
  const normRaw = normalizeMapel(trimmed);
  if (normRaw.length >= 3) {
    for (const m of mapelList) {
      const normM = normalizeMapel(m.nama);
      if (normM === normRaw) return m;
    }
  }

  return null;
}

/**
 * Mem-parsing file Excel (.xlsx) template import penugasan guru menjadi daftar baris
 * yang divalidasi terhadap data pengguna & mata pelajaran terdaftar di sistem.
 */
export async function parsePenugasanExcel(
  buffer: Buffer,
  referenceData: {
    guruList: GuruReference[];
    mapelList: MapelReference[];
  }
): Promise<ParsedPenugasanRow[]> {
  const workbook = new ExcelJS.Workbook();
  // Cast: tipe Buffer ambient exceljs (extends ArrayBuffer) berkonflik dengan tipe Buffer Node.js
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  // Ambil sheet "Penugasan Guru" atau sheet pertama jika nama berbeda
  const sheet =
    workbook.getWorksheet("Penugasan Guru") ||
    workbook.worksheets[0];

  if (!sheet) {
    throw new Error("File Excel tidak memiliki sheet data penugasan.");
  }

  const rows: ParsedPenugasanRow[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Lewati header

    const rawGuru = cellToString(row.getCell(2).value);
    const rawMapel = cellToString(row.getCell(3).value);
    const rawTingkat = cellToString(row.getCell(4).value);
    const rawRombel = cellToString(row.getCell(5).value);
    const keterangan = cellToString(row.getCell(6).value) || null;

    // Lewati baris yang sepenuhnya kosong
    if (!rawGuru && !rawMapel && !rawTingkat && !rawRombel) {
      return;
    }

    const errors: string[] = [];

    // Validasi Guru Pengampu
    let matchedGuru: GuruReference | null = null;
    if (!rawGuru) {
      errors.push("Guru pengampu wajib diisi (pilih dari dropdown pengguna terdaftar)");
    } else {
      matchedGuru = findMatchingGuru(rawGuru, referenceData.guruList);
      if (!matchedGuru) {
        errors.push(
          `Guru '${rawGuru}' tidak ditemukan pada daftar pengguna terdaftar. Pastikan nama sesuai atau pilih dari dropdown.`
        );
      }
    }

    // Validasi Mata Pelajaran
    let matchedMapel: MapelReference | null = null;
    if (!rawMapel) {
      errors.push("Mata pelajaran wajib diisi (pilih dari dropdown)");
    } else {
      matchedMapel = findMatchingMapel(rawMapel, referenceData.mapelList);
      if (!matchedMapel) {
        errors.push(
          `Mata pelajaran '${rawMapel}' tidak dikenali. Pilih dari dropdown atau gunakan kode mapel yang valid (contoh: SKI, MAT, IPA).`
        );
      }
    }

    // Validasi Tingkat Kelas
    let tingkat_kelas: 7 | 8 | 9 | null = null;
    if (!rawTingkat) {
      errors.push("Tingkat kelas wajib diisi (pilih: 7, 8, atau 9)");
    } else {
      tingkat_kelas = parseTingkatKelas(rawTingkat);
      if (!tingkat_kelas) {
        errors.push(`Tingkat kelas '${rawTingkat}' tidak valid (gunakan angka 7, 8, 9 atau Romawi VII, VIII, IX)`);
      }
    }

    // Validasi Rombel
    let cleanedRombel = "";
    if (!rawRombel) {
      errors.push("Rombongan belajar (rombel) wajib diisi (contoh: 7A atau 7A, 7B)");
    } else {
      // Pecah koma/titik koma/garis miring dan bersihkan spasi
      const rombelParts = rawRombel
        .split(/[,;/]+/)
        .map((r) => r.trim())
        .filter(Boolean);

      if (rombelParts.length === 0) {
        errors.push("Rombongan belajar tidak boleh kosong");
      } else {
        cleanedRombel = rombelParts.join(", ");
      }
    }

    rows.push({
      rowNumber,
      rawGuru,
      rawMapel,
      rawTingkat,
      rawRombel,
      guru_id: matchedGuru?.id || null,
      guru_nama: matchedGuru ? `${matchedGuru.nama_lengkap}${matchedGuru.gelar ? `, ${matchedGuru.gelar}` : ""}` : null,
      mapel_id: matchedMapel?.id || null,
      mapel_nama: matchedMapel?.nama || null,
      mapel_kode: matchedMapel?.kode || null,
      tingkat_kelas,
      rombel: cleanedRombel,
      keterangan,
      errors,
    });
  });

  return rows;
}
