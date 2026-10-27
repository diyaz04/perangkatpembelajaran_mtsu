import ExcelJS from "exceljs";

export interface GuruReference {
  id: string;
  nama_lengkap: string;
  nip: string | null;
  gelar: string | null;
}

export interface MapelReference {
  id: string;
  kode: string;
  nama: string;
}

export interface TahunAjaranReference {
  id: string;
  nama: string;
  aktif?: boolean;
}

const MAX_TEMPLATE_ROWS = 300;

/**
 * Format label guru yang tampil pada dropdown dan sheet referensi:
 * Contoh: "Diyaz Najib, S.Pd" atau "Ustadz H. Farhan, M.Pd.I (NIP: 198805122015031002)"
 */
export function formatGuruDropdownLabel(guru: GuruReference): string {
  const namaWithGelar = `${guru.nama_lengkap}${guru.gelar ? `, ${guru.gelar}` : ""}`;
  if (guru.nip) {
    return `${namaWithGelar} (NIP: ${guru.nip})`;
  }
  return namaWithGelar;
}

/**
 * Format label mapel yang tampil pada dropdown dan sheet referensi:
 * Contoh: "[SKI] Sejarah Kebudayaan Islam (SKI)"
 */
export function formatMapelDropdownLabel(mapel: MapelReference): string {
  return `[${mapel.kode}] ${mapel.nama}`;
}

/**
 * Membangun file Excel (.xlsx) Template Import Penugasan Guru.
 * Dilengkapi validasi data interaktif dari daftar pengguna/guru terdaftar dan mata pelajaran terdaftar.
 */
export async function buildPenugasanTemplate(options: {
  guruList: GuruReference[];
  mapelList: MapelReference[];
  tahunAjaran?: TahunAjaranReference | null;
}): Promise<Buffer> {
  const { guruList, mapelList, tahunAjaran } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistem Perangkat Pembelajaran KBC";
  workbook.created = new Date();

  const taNama = tahunAjaran?.nama || "Tahun Ajaran Aktif";

  // =========================================================================
  // Sheet 1: Penugasan Guru (diisi admin)
  // =========================================================================
  const sheet = workbook.addWorksheet("Penugasan Guru");

  const headers = [
    "No",
    "Guru Pengampu (Pilih dari Dropdown) *",
    "Mata Pelajaran (Pilih dari Dropdown) *",
    "Tingkat Kelas (7/8/9) *",
    "Rombongan Belajar (Rombel) *",
    "Keterangan (Opsional)",
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF059669" }, // Emerald 600
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

  // Lebar Kolom
  sheet.getColumn(1).width = 6;  // No
  sheet.getColumn(2).width = 44; // Guru Pengampu
  sheet.getColumn(3).width = 38; // Mata Pelajaran
  sheet.getColumn(4).width = 24; // Tingkat Kelas
  sheet.getColumn(5).width = 30; // Rombel
  sheet.getColumn(6).width = 26; // Keterangan

  // Baris Contoh (Nomor 1 & 2) — bisa dihapus atau ditimpa
  const sampleGuru1 = guruList[0] ? formatGuruDropdownLabel(guruList[0]) : "Diyaz Najib, S.Pd";
  const sampleMapel1 = mapelList[0] ? formatMapelDropdownLabel(mapelList[0]) : "[SKI] Sejarah Kebudayaan Islam";

  const sampleGuru2 = guruList[1] ? formatGuruDropdownLabel(guruList[1]) : sampleGuru1;
  const sampleMapel2 = mapelList[1] ? formatMapelDropdownLabel(mapelList[1]) : sampleMapel1;

  const exampleRow1 = sheet.addRow([
    1,
    sampleGuru1,
    sampleMapel1,
    7,
    "7A, 7B",
    "Contoh 1: Dua rombel paralel",
  ]);
  exampleRow1.eachCell((cell) => {
    cell.font = { name: "Arial", size: 9.5, italic: true, color: { argb: "FF64748B" } };
    cell.alignment = { vertical: "middle" };
  });

  const exampleRow2 = sheet.addRow([
    2,
    sampleGuru2,
    sampleMapel2,
    8,
    "8A, 8B, 8C",
    "Contoh 2: Tiga rombel paralel",
  ]);
  exampleRow2.eachCell((cell) => {
    cell.font = { name: "Arial", size: 9.5, italic: true, color: { argb: "FF64748B" } };
    cell.alignment = { vertical: "middle" };
  });

  // Nomor urut otomatis untuk baris-baris berikutnya
  for (let r = 4; r <= MAX_TEMPLATE_ROWS + 1; r++) {
    const noCell = sheet.getCell(`A${r}`);
    noCell.value = r - 1;
    noCell.font = { name: "Arial", size: 9.5, color: { argb: "FF94A3B8" } };
    noCell.alignment = { horizontal: "center", vertical: "middle" };
  }

  // Range Referensi untuk Data Validation
  const guruCount = Math.max(1, guruList.length);
  const mapelCount = Math.max(1, mapelList.length);

  // Validasi Guru Pengampu (Dropdown dari sheet Data Referensi Kolom A)
  const guruValidation: ExcelJS.DataValidation = {
    type: "list",
    allowBlank: false,
    formulae: [`'Data Referensi'!$A$2:$A$${guruCount + 1}`],
    showErrorMessage: true,
    errorTitle: "Guru Pengampu Tidak Valid",
    error: "Pilihlah salah satu nama guru yang terdaftar dari daftar dropdown.",
  };

  // Validasi Mata Pelajaran (Dropdown dari sheet Data Referensi Kolom E)
  const mapelValidation: ExcelJS.DataValidation = {
    type: "list",
    allowBlank: false,
    formulae: [`'Data Referensi'!$E$2:$E$${mapelCount + 1}`],
    showErrorMessage: true,
    errorTitle: "Mata Pelajaran Tidak Valid",
    error: "Pilihlah salah satu mata pelajaran dari daftar dropdown.",
  };

  // Validasi Tingkat Kelas (Dropdown 7, 8, 9)
  const tingkatValidation: ExcelJS.DataValidation = {
    type: "list",
    allowBlank: false,
    formulae: ['"7, 8, 9"'],
    showErrorMessage: true,
    errorTitle: "Tingkat Kelas Tidak Valid",
    error: "Pilihlah tingkat kelas: 7, 8, atau 9.",
  };

  // Pasang validasi ke seluruh baris template (mulai baris 2 s.d MAX_TEMPLATE_ROWS)
  for (let r = 2; r <= MAX_TEMPLATE_ROWS + 1; r++) {
    sheet.getCell(`B${r}`).dataValidation = guruValidation;
    sheet.getCell(`C${r}`).dataValidation = mapelValidation;
    sheet.getCell(`D${r}`).dataValidation = tingkatValidation;
  }

  sheet.views = [{ state: "frozen", ySplit: 1 }];

  // =========================================================================
  // Sheet 2: Data Referensi (Daftar Guru Terdaftar & Mapel Terdaftar)
  // =========================================================================
  const refSheet = workbook.addWorksheet("Data Referensi");

  const refHeaders = [
    "Pilihan Guru (Dropdown)",
    "Nama Lengkap Guru",
    "NIP",
    "Gelar",
    "Pilihan Mapel (Dropdown)",
    "Kode Mapel",
    "Nama Mata Pelajaran",
    "Tingkat",
    "Contoh Format Rombel",
  ];

  const refHeaderRow = refSheet.addRow(refHeaders);
  refHeaderRow.height = 24;
  refHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0284C7" }, // Sky 600
    };
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin", color: { argb: "FF0369A1" } },
      bottom: { style: "medium", color: { argb: "FF075985" } },
    };
  });

  refSheet.getColumn(1).width = 44; // Format Pilihan Guru
  refSheet.getColumn(2).width = 30; // Nama Lengkap
  refSheet.getColumn(3).width = 20; // NIP
  refSheet.getColumn(4).width = 14; // Gelar
  refSheet.getColumn(5).width = 38; // Format Pilihan Mapel
  refSheet.getColumn(6).width = 14; // Kode Mapel
  refSheet.getColumn(7).width = 32; // Nama Mapel
  refSheet.getColumn(8).width = 12; // Tingkat
  refSheet.getColumn(9).width = 24; // Contoh Rombel

  const maxRows = Math.max(guruList.length, mapelList.length, 3);
  const contohRombel = ["7A", "7A, 7B", "8A, 8B, 8C"];
  const tingkats = [7, 8, 9];

  for (let i = 0; i < maxRows; i++) {
    const g = guruList[i];
    const m = mapelList[i];
    const t = tingkats[i] || "";
    const r = contohRombel[i] || "";

    const row = refSheet.addRow([
      g ? formatGuruDropdownLabel(g) : "",
      g ? g.nama_lengkap : "",
      g ? g.nip || "-" : "",
      g ? g.gelar || "-" : "",
      m ? formatMapelDropdownLabel(m) : "",
      m ? m.kode : "",
      m ? m.nama : "",
      t,
      r,
    ]);

    row.eachCell((cell) => {
      cell.font = { name: "Arial", size: 9 };
      cell.alignment = { vertical: "middle" };
    });
  }

  refSheet.views = [{ state: "frozen", ySplit: 1 }];

  // =========================================================================
  // Sheet 3: Petunjuk Pengisian
  // =========================================================================
  const guideSheet = workbook.addWorksheet("Petunjuk Pengisian");
  guideSheet.getColumn(1).width = 105;

  const guideLines = [
    { text: "PETUNJUK PENGISIAN TEMPLATE IMPORT PENUGASAN GURU", bold: true, size: 13, color: "FF064E3B" },
    { text: `Target Tahun Ajaran: ${taNama}`, bold: true, size: 11, color: "FF047857" },
    { text: "" },
    { text: "1. Isi data penugasan pada sheet 'Penugasan Guru' mulai dari baris ke-2 (baris contoh boleh dihapus atau ditimpa).", bold: true },
    { text: "2. Kolom bertanda bintang (*) WAJIB diisi: Guru Pengampu, Mata Pelajaran, Tingkat Kelas, dan Rombel." },
    { text: "3. Kolom 'Guru Pengampu':" },
    { text: "   - Gunakan menu dropdown pada sel untuk memilih guru yang telah terdaftar di sistem." },
    { text: "   - Anda juga dapat mengetik nama guru langsung. Sistem akan mencocokkan nama dengan pengguna terdaftar." },
    { text: "   - Jika guru belum ada pada dropdown, daftarkan terlebih dahulu di menu 'Master Data -> Pengguna'." },
    { text: "4. Kolom 'Mata Pelajaran':" },
    { text: "   - Gunakan menu dropdown untuk memilih mata pelajaran (format: [KODE] Nama Mapel)." },
    { text: "   - Anda juga dapat mengetik kode mapel secara langsung (contoh: SKI, MAT, IPA, BIND)." },
    { text: "5. Kolom 'Tingkat Kelas':" },
    { text: "   - Pilih 7, 8, atau 9 dari dropdown (atau ketik angka 7, 8, 9 / Romawi VII, VIII, IX)." },
    { text: "6. Kolom 'Rombongan Belajar (Rombel)':" },
    { text: "   - Tuliskan nama rombel. Jika mengampu beberapa rombel paralel pada tingkat yang sama, pisahkan dengan koma." },
    { text: "   - Contoh 1 rombel: '7A' atau '8.1'" },
    { text: "   - Contoh beberapa rombel: '7A, 7B' atau '9.1, 9.2, 9.3'" },
    { text: "7. Pembaruan Otomatis (Update):" },
    { text: "   - Jika guru yang sama sudah pernah ditugaskan pada mapel, tingkat, dan tahun ajaran yang sama, sistem akan memperbarui daftar rombelnya tanpa membuat duplikasi penugasan." },
    { text: "8. Setelah selesai mengisi, simpan file ini dan unggah kembali pada aplikasi melalui tombol 'Import Excel'." },
  ];

  guideLines.forEach((line) => {
    const row = guideSheet.addRow([line.text]);
    if (line.bold) {
      row.getCell(1).font = {
        name: "Arial",
        size: line.size || 10,
        bold: true,
        color: { argb: line.color || "FF1E293B" },
      };
    } else {
      row.getCell(1).font = { name: "Arial", size: 9.5, color: { argb: "FF334155" } };
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
