import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { parsePenugasanExcel } from "./parse-penugasan-excel";
import { formatGuruDropdownLabel, formatMapelDropdownLabel, type GuruReference, type MapelReference } from "../export/export-template-penugasan";

const MOCK_GURU_LIST: GuruReference[] = [
  { id: "guru-1", nama_lengkap: "Diyaz Najib", nip: null, gelar: "S.Pd" },
  { id: "guru-2", nama_lengkap: "Ustadz H. Farhan Fadhlullah", nip: "198805122015031002", gelar: "M.Pd.I" },
  { id: "guru-3", nama_lengkap: "Siti Nurhaliza", nip: "199001012015012001", gelar: "M.Pd" },
];

const MOCK_MAPEL_LIST: MapelReference[] = [
  { id: "mapel-1", kode: "SKI", nama: "Sejarah Kebudayaan Islam (SKI)" },
  { id: "mapel-2", kode: "MAT", nama: "Matematika" },
  { id: "mapel-3", kode: "IPA", nama: "Ilmu Pengetahuan Alam (IPA)" },
];

async function buildWorkbookBuffer(rows: (string | number | null)[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Penugasan Guru");
  sheet.addRow(["No", "Guru Pengampu", "Mata Pelajaran", "Tingkat Kelas", "Rombel", "Keterangan"]);
  rows.forEach((row) => sheet.addRow(row));
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

describe("parsePenugasanExcel (src/lib/import/parse-penugasan-excel.ts)", () => {
  it("1. Mem-parsing baris valid dengan format label dropdown persis", async () => {
    const guruLabel = formatGuruDropdownLabel(MOCK_GURU_LIST[0]); // "Diyaz Najib, S.Pd"
    const mapelLabel = formatMapelDropdownLabel(MOCK_MAPEL_LIST[0]); // "[SKI] Sejarah Kebudayaan Islam (SKI)"

    const buffer = await buildWorkbookBuffer([
      [1, guruLabel, mapelLabel, 8, "8A, 8B", "Reguler"],
    ]);

    const rows = await parsePenugasanExcel(buffer, {
      guruList: MOCK_GURU_LIST,
      mapelList: MOCK_MAPEL_LIST,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].errors).toEqual([]);
    expect(rows[0].guru_id).toBe("guru-1");
    expect(rows[0].mapel_id).toBe("mapel-1");
    expect(rows[0].tingkat_kelas).toBe(8);
    expect(rows[0].rombel).toBe("8A, 8B");
    expect(rows[0].keterangan).toBe("Reguler");
  });

  it("2. Mampu mencocokkan guru via NIP dan mapel via kode murni", async () => {
    const buffer = await buildWorkbookBuffer([
      [1, "198805122015031002", "MAT", "VII", "7A; 7B; 7C", null],
    ]);

    const rows = await parsePenugasanExcel(buffer, {
      guruList: MOCK_GURU_LIST,
      mapelList: MOCK_MAPEL_LIST,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].errors).toEqual([]);
    expect(rows[0].guru_id).toBe("guru-2");
    expect(rows[0].mapel_id).toBe("mapel-2");
    expect(rows[0].tingkat_kelas).toBe(7);
    expect(rows[0].rombel).toBe("7A, 7B, 7C");
  });

  it("3. Mampu mencocokkan nama guru tanpa gelar dan nama mapel tanpa kurung", async () => {
    const buffer = await buildWorkbookBuffer([
      [1, "Siti Nurhaliza", "Ilmu Pengetahuan Alam", 9, "9A", null],
    ]);

    const rows = await parsePenugasanExcel(buffer, {
      guruList: MOCK_GURU_LIST,
      mapelList: MOCK_MAPEL_LIST,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].errors).toEqual([]);
    expect(rows[0].guru_id).toBe("guru-3");
    expect(rows[0].mapel_id).toBe("mapel-3");
    expect(rows[0].tingkat_kelas).toBe(9);
    expect(rows[0].rombel).toBe("9A");
  });

  it("4. Menandai error jika guru tidak terdaftar, mapel tidak dikenali, atau tingkat invalid", async () => {
    const buffer = await buildWorkbookBuffer([
      [1, "Guru Hantu", "KIMIA", 12, "", null],
    ]);

    const rows = await parsePenugasanExcel(buffer, {
      guruList: MOCK_GURU_LIST,
      mapelList: MOCK_MAPEL_LIST,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0].guru_id).toBeNull();
    expect(rows[0].mapel_id).toBeNull();
    expect(rows[0].errors.some((e) => e.includes("Guru 'Guru Hantu' tidak ditemukan"))).toBe(true);
    expect(rows[0].errors.some((e) => e.includes("Mata pelajaran 'KIMIA' tidak dikenali"))).toBe(true);
    expect(rows[0].errors.some((e) => e.includes("Tingkat kelas '12' tidak valid"))).toBe(true);
    expect(rows[0].errors.some((e) => e.includes("Rombongan belajar (rombel) wajib diisi"))).toBe(true);
  });

  it("5. Mengabaikan baris yang sepenuhnya kosong", async () => {
    const buffer = await buildWorkbookBuffer([
      [null, null, null, null, null, null],
      ["", "", "", "", "", ""],
    ]);

    const rows = await parsePenugasanExcel(buffer, {
      guruList: MOCK_GURU_LIST,
      mapelList: MOCK_MAPEL_LIST,
    });

    expect(rows).toHaveLength(0);
  });
});
