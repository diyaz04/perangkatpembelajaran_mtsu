import ExcelJS from "exceljs";

const ROLE_OPTIONS = ["admin", "kepala", "waka_kurikulum", "guru"];
const MAX_TEMPLATE_ROWS = 300;

/**
 * Membangun file Excel (.xlsx) Template Import Pengguna & Guru.
 * Berisi sheet data yang siap diisi admin, serta sheet petunjuk pengisian.
 */
export async function buildPenggunaTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistem Perangkat Pembelajaran KBC";
  workbook.created = new Date();

  // ===== Sheet 1: Data Pengguna (diisi admin) =====
  const sheet = workbook.addWorksheet("Data Pengguna");

  const headers = [
    "No",
    "Nama Lengkap *",
    "NIP (Opsional)",
    "Gelar (Opsional)",
    "Email *",
    "Role *",
    "Password Awal (Opsional)",
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF059669" },
    };
    cell.font = { name: "Arial", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF047857" } },
      left: { style: "thin", color: { argb: "FF047857" } },
      bottom: { style: "medium", color: { argb: "FF064E3B" } },
      right: { style: "thin", color: { argb: "FF047857" } },
    };
  });

  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 28;
  sheet.getColumn(3).width = 20;
  sheet.getColumn(4).width = 18;
  sheet.getColumn(5).width = 28;
  sheet.getColumn(6).width = 16;
  sheet.getColumn(7).width = 22;

  // Baris contoh (nomor 1) — boleh ditimpa / dihapus oleh admin
  const exampleRow = sheet.addRow([
    1,
    "Siti Nurhaliza",
    "198501012010012001",
    "S.Pd.I",
    "siti.nurhaliza@madrasah.id",
    "guru",
    "",
  ]);
  exampleRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 9.5, italic: true, color: { argb: "FF94A3B8" } };
    cell.alignment = { vertical: "middle" };
  });

  // Nomor urut otomatis & validasi dropdown Role untuk baris berikutnya
  for (let r = 3; r <= MAX_TEMPLATE_ROWS + 1; r++) {
    sheet.getCell(`A${r}`).value = r - 1;
    sheet.getCell(`A${r}`).font = { name: "Arial", size: 9.5, color: { argb: "FF94A3B8" } };
  }

  const roleValidation = {
    type: "list" as const,
    allowBlank: false,
    formulae: [`"${ROLE_OPTIONS.join(",")}"`],
    showErrorMessage: true,
    errorStyle: "warning" as const,
    error: "Pilih salah satu: admin, kepala, waka_kurikulum, guru",
  };
  for (let r = 2; r <= MAX_TEMPLATE_ROWS + 1; r++) {
    sheet.getCell(`F${r}`).dataValidation = roleValidation;
  }

  sheet.views = [{ state: "frozen", ySplit: 1 }];

  // ===== Sheet 2: Petunjuk Pengisian =====
  const guideSheet = workbook.addWorksheet("Petunjuk Pengisian");
  guideSheet.getColumn(1).width = 95;

  const guideLines = [
    { text: "PETUNJUK PENGISIAN TEMPLATE IMPORT PENGGUNA & GURU", bold: true, size: 13, color: "FF064E3B" },
    { text: "", },
    { text: "1. Isi data pada sheet 'Data Pengguna', mulai dari baris ke-2 (baris pertama adalah contoh — boleh dihapus/ditimpa).", },
    { text: "2. Kolom bertanda (*) wajib diisi: Nama Lengkap, Email, dan Role.", },
    { text: "3. Kolom Email harus unik dan belum pernah didaftarkan sebelumnya di sistem.", },
    { text: "4. Kolom Role hanya boleh berisi salah satu dari: admin, kepala, waka_kurikulum, guru (pilih dari dropdown).", },
    { text: "   - admin           = Administrator Sistem", },
    { text: "   - kepala          = Kepala Madrasah", },
    { text: "   - waka_kurikulum  = Waka Kurikulum", },
    { text: "   - guru            = Guru Mata Pelajaran", },
    { text: "5. Kolom Password Awal bersifat opsional. Jika dikosongkan, sistem akan membuat password acak otomatis", },
    { text: "   dan menampilkannya pada hasil import agar dapat disampaikan ke guru/staf bersangkutan.", },
    { text: "   Jika diisi manual, password minimal 6 karakter.", },
    { text: "6. Kolom NIP dan Gelar bersifat opsional.", },
    { text: "7. Jangan mengubah urutan atau nama kolom pada baris header (baris 1).", },
    { text: "8. Simpan file dalam format .xlsx, lalu unggah kembali melalui menu Import Excel.", },
  ];

  guideLines.forEach((line) => {
    const row = guideSheet.addRow([line.text]);
    row.getCell(1).font = {
      name: "Arial",
      size: line.size || 10,
      bold: !!line.bold,
      color: { argb: line.color || "FF334155" },
    };
    row.getCell(1).alignment = { wrapText: true, vertical: "middle" };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
