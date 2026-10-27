import ExcelJS from "exceljs";
import type { UserRole } from "@/types/database";

const ROLE_ALIASES: Record<string, UserRole> = {
  admin: "admin",
  administrator: "admin",
  kepala: "kepala",
  "kepala madrasah": "kepala",
  waka_kurikulum: "waka_kurikulum",
  "waka kurikulum": "waka_kurikulum",
  wakakurikulum: "waka_kurikulum",
  guru: "guru",
  "guru mata pelajaran": "guru",
};

export interface ParsedPenggunaRow {
  rowNumber: number;
  nama_lengkap: string;
  nip: string | null;
  gelar: string | null;
  email: string;
  role: UserRole | null;
  password: string | null;
  errors: string[];
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    // ExcelJS bisa mengembalikan rich text / hyperlink object
    if ("text" in value && typeof value.text === "string") return value.text.trim();
    if ("result" in value && value.result != null) return String(value.result).trim();
    return "";
  }
  return String(value).trim();
}

/**
 * Mem-parsing file Excel (.xlsx) template import pengguna menjadi daftar baris
 * yang sudah divalidasi secara dasar (format), siap diproses lebih lanjut
 * (pengecekan duplikasi email & pembuatan akun) oleh pemanggil.
 */
export async function parsePenggunaExcel(buffer: Buffer): Promise<ParsedPenggunaRow[]> {
  const workbook = new ExcelJS.Workbook();
  // Cast: tipe Buffer ambient exceljs (extends ArrayBuffer) berkonflik dengan tipe Buffer Node.js.
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new Error("File Excel tidak memiliki sheet data.");
  }

  const rows: ParsedPenggunaRow[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // lewati baris header

    const nama_lengkap = cellToString(row.getCell(2).value);
    const nip = cellToString(row.getCell(3).value) || null;
    const gelar = cellToString(row.getCell(4).value) || null;
    const email = cellToString(row.getCell(5).value).toLowerCase();
    const roleRaw = cellToString(row.getCell(6).value).toLowerCase();
    const password = cellToString(row.getCell(7).value) || null;

    // Lewati baris yang benar-benar kosong
    if (!nama_lengkap && !email && !roleRaw && !nip && !gelar) return;

    const errors: string[] = [];

    if (!nama_lengkap || nama_lengkap.length < 2) {
      errors.push("Nama lengkap wajib diisi (minimal 2 karakter)");
    }

    if (!email) {
      errors.push("Email wajib diisi");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Format email tidak valid");
    }

    const role = ROLE_ALIASES[roleRaw] || null;
    if (!roleRaw) {
      errors.push("Role wajib diisi");
    } else if (!role) {
      errors.push(`Role '${roleRaw}' tidak dikenali (gunakan: admin, kepala, waka_kurikulum, guru)`);
    }

    if (password && password.length < 6) {
      errors.push("Password minimal 6 karakter (atau kosongkan agar dibuat otomatis)");
    }

    rows.push({
      rowNumber,
      nama_lengkap,
      nip,
      gelar,
      email,
      role,
      password,
      errors,
    });
  });

  return rows;
}

/**
 * Membuat password acak sederhana (8 karakter alfanumerik) untuk baris
 * yang tidak menyertakan password awal pada file import.
 */
export function generateRandomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
