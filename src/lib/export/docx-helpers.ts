import {
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  PageOrientation,
  Header,
  Footer,
  PageNumber,
  type ISectionPropertiesOptions,
} from "docx";
import type { ExportDocxOptions, KopMadrasahData, GuruSignData } from "./types";

/**
 * Konversi milimeter ke dxa/twips (1 inch = 72 pt = 1440 dxa = 25.4 mm)
 * 1 mm ≈ 56.7 twips
 * 2 cm = 20 mm ≈ 1134 twips
 */
export const TWIP_PER_MM = 56.7;
export const MARGIN_2CM = 1134; // 20mm * 56.7

export function getFontFamily(options?: ExportDocxOptions): string {
  return options?.fontFamily || "Times New Roman";
}

export function getFontSize(options?: ExportDocxOptions, defaultPt?: number): number {
  if (defaultPt) return defaultPt * 2;
  const basePt = options?.fontSizePt || (options?.fontFamily === "Arial" ? 11 : 12);
  return basePt * 2; // docx menggunakan half-points
}

/**
 * Menghitung ukuran halaman berdasarkan pilihan kertas & orientasi
 */
export function getPageDimensions(
  orientation: "portrait" | "landscape" = "portrait",
  paperSize: "A4" | "F4" = "A4"
) {
  // A4 = 210 x 297 mm -> 11906 x 16838 twips
  // F4/Folio = 215 x 330 mm -> 12189 x 18709 twips
  const isF4 = paperSize === "F4";
  const widthTwips = isF4 ? 12189 : 11906;
  const heightTwips = isF4 ? 18709 : 16838;

  if (orientation === "landscape") {
    return {
      width: heightTwips,
      height: widthTwips,
      orientation: PageOrientation.LANDSCAPE,
    };
  }

  return {
    width: widthTwips,
    height: heightTwips,
    orientation: PageOrientation.PORTRAIT,
  };
}

/**
 * Konfigurasi section properties untuk halaman A4/F4 dengan margin 2cm
 */
export function createPageProperties(
  orientation: "portrait" | "landscape" = "portrait",
  options?: ExportDocxOptions
): ISectionPropertiesOptions {
  const paper = options?.paperSize || "A4";
  const pageDim = getPageDimensions(orientation, paper);

  return {
    page: {
      size: {
        orientation: pageDim.orientation,
        width: pageDim.width,
        height: pageDim.height,
      },
      margin: {
        top: MARGIN_2CM,
        bottom: MARGIN_2CM,
        left: MARGIN_2CM,
        right: MARGIN_2CM,
      },
    },
  };
}

/**
 * Banner / Watermark jika dokumen belum disetujui
 */
export function createWatermarkCallout(
  status: string,
  options?: ExportDocxOptions
): Paragraph[] {
  if (status === "disetujui") return [];

  const font = getFontFamily(options);
  const statusLabel =
    status === "diajukan"
      ? "DIAJUKAN (MENUNGGU VALIDASI)"
      : status === "revisi"
      ? "PERLU REVISI"
      : "DRAF";

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 120 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 8, color: "E11D48" },
        bottom: { style: BorderStyle.SINGLE, size: 8, color: "E11D48" },
        left: { style: BorderStyle.SINGLE, size: 8, color: "E11D48" },
        right: { style: BorderStyle.SINGLE, size: 8, color: "E11D48" },
      },
      children: [
        new TextRun({
          text: `*** DOKUMEN INI MASIH BERSTATUS: ${statusLabel} — BELUM DISETUJUI RESMI ***`,
          bold: true,
          font,
          size: 18,
          color: "E11D48",
        }),
      ],
    }),
  ];
}

/**
 * Header dokumen standar (dengan penanda status draf)
 */
export function createDocumentHeader(
  status: string,
  options?: ExportDocxOptions
): Header {
  const font = getFontFamily(options);
  const isDraft = status !== "disetujui";

  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: isDraft ? "[ DRAF / BELUM DISETUJUI ]" : "",
            font,
            size: 16,
            color: "94A3B8",
            italics: true,
          }),
        ],
      }),
    ],
  });
}

/**
 * Footer dokumen dengan nomor halaman dan metadata Bank Data
 */
export function createDocumentFooter(
  madrasahNama: string,
  options?: ExportDocxOptions,
  sumberCp: string = "KMA 1503/2025",
  versiBankData: string = "2026-2027-v1"
): Footer {
  const font = getFontFamily(options);

  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: {
          top: { style: BorderStyle.SINGLE, size: 4, space: 4, color: "CBD5E1" },
        },
        children: [
          new TextRun({
            text: `${madrasahNama} • Sumber CP: ${sumberCp} · Bank data ${versiBankData} • Halaman `,
            font,
            size: 15,
            color: "64748B",
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font,
            size: 15,
            color: "64748B",
          }),
          new TextRun({
            text: " dari ",
            font,
            size: 15,
            color: "64748B",
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            font,
            size: 15,
            color: "64748B",
          }),
        ],
      }),
    ],
  });
}

/**
 * Kop Surat Resmi Madrasah dengan Garis Ganda di Bawah
 */
export function createKopMadrasah(
  madrasah: KopMadrasahData,
  options?: ExportDocxOptions
): Paragraph[] {
  if (options?.includeKop === false) {
    return [];
  }

  const font = getFontFamily(options);

  const kabupatenText = madrasah.kabupaten || "Kabupaten Tasikmalaya";
  const namaMadrasah = (madrasah.nama || "MTs KH A Wahab Muhsin").toUpperCase();
  const nsm = madrasah.nsm || "-";
  const npsn = madrasah.npsn || "-";
  const alamat = madrasah.alamat || "Jl. Sukahideng No. 01 Sukarame";

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 240, after: 20 },
      children: [
        new TextRun({
          text: "KEMENTERIAN AGAMA REPUBLIK INDONESIA",
          bold: true,
          font,
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 240, after: 20 },
      children: [
        new TextRun({
          text: `KANTOR KEMENTERIAN AGAMA ${kabupatenText.toUpperCase()}`,
          bold: true,
          font,
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 260, after: 30 },
      children: [
        new TextRun({
          text: namaMadrasah,
          bold: true,
          font,
          size: 26,
          color: "0F172A",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 220, after: 20 },
      children: [
        new TextRun({
          text: `NSM: ${nsm}  •  NPSN: ${npsn}`,
          font,
          size: 17,
          color: "334155",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 220, after: 120 },
      // Garis bawah ganda resmi (Double Line Border)
      border: {
        bottom: {
          style: BorderStyle.DOUBLE,
          size: 12,
          space: 4,
          color: "000000",
        },
      },
      children: [
        new TextRun({
          text: `${alamat}, ${kabupatenText}`,
          font,
          size: 17,
          color: "334155",
        }),
      ],
    }),
    // Spacer setelah garis ganda
    new Paragraph({
      spacing: { after: 140 },
      children: [],
    }),
  ];
}

/**
 * Judul Dokumen Resmi
 */
export function createDocumentTitle(
  title: string,
  subtitle: string,
  options?: ExportDocxOptions
): Paragraph[] {
  const font = getFontFamily(options);

  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 40 },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          font,
          size: 24,
          color: "0F172A",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
      children: [
        new TextRun({
          text: subtitle,
          bold: true,
          font,
          size: 19,
          color: "047857", // emerald-700
        }),
      ],
    }),
  ];
}

/**
 * Tabel Identitas Dokumen 2 Kolom (Satuan Pendidikan, Mapel, Kelas, dll.)
 */
export function createIdentitasTable(
  items: Array<{ label: string; value: string }>,
  options?: ExportDocxOptions
): Table {
  const font = getFontFamily(options);
  const fontSize = getFontSize(options, 10.5);

  const rows: TableRow[] = [];

  // Bagi items jadi pasangan 2 kolom jika panjang
  for (let i = 0; i < items.length; i += 2) {
    const left = items[i];
    const right = items[i + 1];

    const leftCell = new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
      },
      children: [
        new Paragraph({
          spacing: { line: 220, after: 20 },
          children: [
            new TextRun({ text: `${left.label.padEnd(22, " ")}: `, bold: true, font, size: fontSize }),
            new TextRun({ text: left.value, font, size: fontSize }),
          ],
        }),
      ],
    });

    const rightCell = new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "auto" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
        left: { style: BorderStyle.NONE, size: 0, color: "auto" },
        right: { style: BorderStyle.NONE, size: 0, color: "auto" },
      },
      children: right
        ? [
            new Paragraph({
              spacing: { line: 220, after: 20 },
              children: [
                new TextRun({ text: `${right.label.padEnd(22, " ")}: `, bold: true, font, size: fontSize }),
                new TextRun({ text: right.value, font, size: fontSize }),
              ],
            }),
          ]
        : [new Paragraph({ children: [] })],
    });

    rows.push(
      new TableRow({
        children: [leftCell, rightCell],
      })
    );
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "auto" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
    },
    rows,
  });
}

/**
 * Blok Tanda Tangan Resmi 2 Kolom (Kiri: Kepala Madrasah, Kanan: Guru Pengampu)
 */
export function createSignaturesTable(
  madrasah: KopMadrasahData,
  guru: GuruSignData,
  options?: ExportDocxOptions,
  tglFormatted?: string
): Table {
  const font = getFontFamily(options);
  const fontSize = getFontSize(options, 11);
  const kabupaten = madrasah.kabupaten || "Tasikmalaya";
  const tanggal = tglFormatted || new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const kepalaNama = madrasah.kepala_nama || "Kepala Madrasah";
  const kepalaNip = madrasah.kepala_nip ? `NIP. ${madrasah.kepala_nip}` : "NIP. -";

  const guruGelar = guru.gelar ? `, ${guru.gelar}` : "";
  const guruNama = `${guru.nama_lengkap}${guruGelar}`;
  const guruNip = guru.nip ? `NIP. ${guru.nip}` : "NIP. -";

  const emptySpaceLines = [
    new Paragraph({ spacing: { after: 120 }, children: [] }),
    new Paragraph({ spacing: { after: 120 }, children: [] }),
    new Paragraph({ spacing: { after: 120 }, children: [] }),
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "auto" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
      left: { style: BorderStyle.NONE, size: 0, color: "auto" },
      right: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "auto" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "auto" },
    },
    rows: [
      new TableRow({
        children: [
          // Kolom Kiri: Kepala Madrasah
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                spacing: { line: 240 },
                children: [new TextRun({ text: "Mengetahui,", font, size: fontSize })],
              }),
              new Paragraph({
                spacing: { line: 240, after: 80 },
                children: [new TextRun({ text: "Kepala Madrasah,", bold: true, font, size: fontSize })],
              }),
              ...emptySpaceLines,
              new Paragraph({
                spacing: { line: 240 },
                children: [
                  new TextRun({
                    text: kepalaNama,
                    bold: true,
                    underline: {},
                    font,
                    size: fontSize,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { line: 240 },
                children: [new TextRun({ text: kepalaNip, font, size: fontSize })],
              }),
            ],
          }),

          // Kolom Kanan: Guru Pengampu
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                spacing: { line: 240 },
                children: [new TextRun({ text: `${kabupaten}, ${tanggal}`, font, size: fontSize })],
              }),
              new Paragraph({
                spacing: { line: 240, after: 80 },
                children: [new TextRun({ text: "Guru Mata Pelajaran,", bold: true, font, size: fontSize })],
              }),
              ...emptySpaceLines,
              new Paragraph({
                spacing: { line: 240 },
                children: [
                  new TextRun({
                    text: guruNama,
                    bold: true,
                    underline: {},
                    font,
                    size: fontSize,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { line: 240 },
                children: [new TextRun({ text: guruNip, font, size: fontSize })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Standard table borders (thin black border)
 */
export const STANDARD_TABLE_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: "CBD5E1" },
};
