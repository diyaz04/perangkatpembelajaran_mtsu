import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { parsePenggunaExcel } from "./parse-pengguna-excel";

async function buildWorkbookBuffer(rows: (string | number | null)[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Data Pengguna");
  sheet.addRow(["No", "Nama Lengkap", "NIP", "Gelar", "Email", "Role", "Password"]);
  rows.forEach((row) => sheet.addRow(row));
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

describe("parsePenggunaExcel (src/lib/import/parse-pengguna-excel.ts)", () => {
  it("1. Mem-parsing baris valid dengan role & password lengkap", async () => {
    const buffer = await buildWorkbookBuffer([
      [1, "Ahmad Fauzi", "12345", "S.Pd", "ahmad.fauzi@madrasah.id", "guru", "rahasia123"],
    ]);

    const rows = await parsePenggunaExcel(buffer);
    expect(rows).toHaveLength(1);
    expect(rows[0].errors).toEqual([]);
    expect(rows[0].nama_lengkap).toBe("Ahmad Fauzi");
    expect(rows[0].email).toBe("ahmad.fauzi@madrasah.id");
    expect(rows[0].role).toBe("guru");
    expect(rows[0].password).toBe("rahasia123");
  });

  it("2. Menerima alias role berlabel Indonesia (case-insensitive)", async () => {
    const buffer = await buildWorkbookBuffer([
      [1, "Budi Santoso", null, null, "budi@madrasah.id", "Waka Kurikulum", null],
    ]);

    const rows = await parsePenggunaExcel(buffer);
    expect(rows[0].role).toBe("waka_kurikulum");
    expect(rows[0].errors).toEqual([]);
  });

  it("3. Menandai error ketika nama, email, atau role kosong/tidak valid", async () => {
    const buffer = await buildWorkbookBuffer([
      ["", "A", "", "", "bukan-email", "peran-aneh", ""],
    ]);

    const rows = await parsePenggunaExcel(buffer);
    expect(rows[0].errors).toContain("Nama lengkap wajib diisi (minimal 2 karakter)");
    expect(rows[0].errors.some((e) => e.includes("email"))).toBe(true);
    expect(rows[0].errors.some((e) => e.includes("tidak dikenali"))).toBe(true);
  });

  it("4. Melewati baris yang sepenuhnya kosong", async () => {
    const buffer = await buildWorkbookBuffer([
      [null, null, null, null, null, null, null],
      [2, "Citra Dewi", null, null, "citra@madrasah.id", "admin", null],
    ]);

    const rows = await parsePenggunaExcel(buffer);
    expect(rows).toHaveLength(1);
    expect(rows[0].nama_lengkap).toBe("Citra Dewi");
  });

  it("5. Menandai error password kurang dari 6 karakter", async () => {
    const buffer = await buildWorkbookBuffer([
      [1, "Dedi Kurniawan", null, null, "dedi@madrasah.id", "guru", "123"],
    ]);

    const rows = await parsePenggunaExcel(buffer);
    expect(rows[0].errors.some((e) => e.includes("Password minimal"))).toBe(true);
  });
});
