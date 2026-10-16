import ExcelJS from "exceljs";
import type { DashboardStaffData } from "@/lib/validasi/actions";

interface ExportExcelParams {
  madrasahNama: string;
  tahunAjaranNama: string;
  data: DashboardStaffData;
}

/**
 * Membangun file Excel (.xlsx) Rekapitulasi Kelengkapan Perangkat Pembelajaran KBC
 * untuk keperluan Supervisi Akademik dan Evaluasi Diri Madrasah (EDM).
 */
export async function buildRekapExcel({
  madrasahNama,
  tahunAjaranNama,
  data,
}: ExportExcelParams): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistem Perangkat Pembelajaran KBC";
  workbook.lastModifiedBy = "Sistem KBC";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Rekap Perangkat Ajar", {
    pageSetup: {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  // 1. Header Judul
  worksheet.mergeCells("A1:L1");
  const titleRow1 = worksheet.getCell("A1");
  titleRow1.value = `REKAPITULASI KELENGKAPAN PERANGKAT PEMBELAJARAN KBC`;
  titleRow1.font = { name: "Arial", size: 14, bold: true, color: { argb: "FF064E3B" } };
  titleRow1.alignment = { horizontal: "center", vertical: "middle" };

  worksheet.mergeCells("A2:L2");
  const titleRow2 = worksheet.getCell("A2");
  titleRow2.value = `${madrasahNama} — TAHUN AJARAN ${tahunAjaranNama.toUpperCase()}`;
  titleRow2.font = { name: "Arial", size: 11, bold: true, color: { argb: "FF334155" } };
  titleRow2.alignment = { horizontal: "center", vertical: "middle" };

  worksheet.mergeCells("A3:L3");
  const titleRow3 = worksheet.getCell("A3");
  titleRow3.value = `Instrumen Supervisi Akademik & Bahan Evaluasi Diri Madrasah (EDM) · Dicetak: ${new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}`;
  titleRow3.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF64748B" } };
  titleRow3.alignment = { horizontal: "center", vertical: "middle" };

  worksheet.addRow([]); // Baris kosong A4

  // Ringkasan Mini
  worksheet.addRow([
    "Total Antrian Validasi:",
    `${data.totalAntrianValidasi} Dokumen`,
    "",
    "Persentase Kelengkapan Madrasah:",
    `${data.persentaseMadrasah}%`,
    "",
    "Total Guru Aktif:",
    `${data.totalGuruAktif} Orang`,
  ]);
  const metaRow = worksheet.getRow(5);
  metaRow.font = { name: "Arial", size: 9, bold: true };

  worksheet.addRow([]); // Baris kosong A6

  // 2. Header Tabel Kolom (Row 7)
  const headers = [
    "No",
    "Nama Guru",
    "NIP",
    "Mata Pelajaran",
    "Kelas",
    "Rombel",
    "Status ATP",
    "Status Prota",
    "Status Prosem 1",
    "Status Prosem 2",
    "RPP Tersusun",
    "Kelengkapan (%)",
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF059669" }, // Emerald 600
    };
    cell.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF047857" } },
      left: { style: "thin", color: { argb: "FF047857" } },
      bottom: { style: "medium", color: { argb: "FF064E3B" } },
      right: { style: "thin", color: { argb: "FF047857" } },
    };
  });

  // Helper formatting status
  const formatStatus = (st: string) => {
    switch (st) {
      case "disetujui":
        return "Disetujui";
      case "diajukan":
        return "Diajukan";
      case "revisi":
        return "Revisi";
      case "draf":
        return "Draf";
      default:
        return "Belum Ada";
    }
  };

  // 3. Isi Data Rekap
  data.rekapGuru.forEach((item, index) => {
    const row = worksheet.addRow([
      index + 1,
      item.guruNama,
      item.guruNip || "-",
      item.mapelNama,
      `Kelas ${item.tingkatKelas}`,
      item.rombel,
      formatStatus(item.atpStatus),
      formatStatus(item.protaStatus),
      formatStatus(item.prosem1Status),
      formatStatus(item.prosem2Status),
      `${item.rppDisetujuiCount} / ${item.rppCount} (Target: ${item.rppTarget})`,
      `${item.persentaseSelesai}%`,
    ]);

    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: "Arial", size: 9 };
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };

      // Alignment per kolom
      if (colNumber === 1 || colNumber === 5 || colNumber === 6) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNumber >= 7 && colNumber <= 10) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        const val = String(cell.value);
        if (val === "Disetujui") {
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF059669" } };
        } else if (val === "Diajukan") {
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF2563EB" } };
        } else if (val === "Revisi") {
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFDC2626" } };
        }
      } else if (colNumber === 11 || colNumber === 12) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        if (colNumber === 12) {
          cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF0F172A" } };
        }
      } else {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
    });
  });

  // Lebar Kolom
  worksheet.getColumn(1).width = 5; // No
  worksheet.getColumn(2).width = 28; // Nama Guru
  worksheet.getColumn(3).width = 22; // NIP
  worksheet.getColumn(4).width = 24; // Mapel
  worksheet.getColumn(5).width = 10; // Kelas
  worksheet.getColumn(6).width = 12; // Rombel
  worksheet.getColumn(7).width = 15; // Status ATP
  worksheet.getColumn(8).width = 15; // Status Prota
  worksheet.getColumn(9).width = 15; // Status Prosem 1
  worksheet.getColumn(10).width = 15; // Status Prosem 2
  worksheet.getColumn(11).width = 20; // RPP
  worksheet.getColumn(12).width = 16; // Kelengkapan %

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
