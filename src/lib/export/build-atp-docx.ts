import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ShadingType,
} from "docx";
import type { PreviewData } from "@/app/(app)/atp/[penugasanId]/preview/preview-client";
import type { ExportDocxOptions } from "./types";
import { formatTitimangsa } from "@/lib/format-titimangsa";
import {
  createPageProperties,
  createKopMadrasah,
  createDocumentTitle,
  createIdentitasTable,
  createSignaturesTable,
  createDocumentHeader,
  createDocumentFooter,
  createWatermarkCallout,
  getFontFamily,
  getFontSize,
  STANDARD_TABLE_BORDERS,
} from "./docx-helpers";

export async function buildAtpDocx(
  data: PreviewData,
  options?: ExportDocxOptions
): Promise<Buffer> {
  const { madrasah, penugasan, atp, items, summary } = data;
  const font = getFontFamily(options);
  const bodyFontSize = getFontSize(options, 9.5);
  const headerFontSize = getFontSize(options, 10);

  // 1. Identitas Dokumen
  const identitasItems = [
    { label: "Satuan Pendidikan", value: madrasah.nama },
    { label: "Tahun Pelajaran", value: penugasan.tahun_ajaran.nama },
    { label: "Mata Pelajaran", value: `${penugasan.mapel.nama} (${penugasan.mapel.kode})` },
    { label: "Fase / Kelas", value: `Fase D / Kelas ${penugasan.tingkat_kelas} (${penugasan.rombel})` },
    { label: "Guru Pengampu", value: penugasan.guru.nama_lengkap },
    { label: "Alokasi Waktu", value: `${summary.grandTotalJp} JP (${summary.totalTp} Tujuan Pembelajaran)` },
  ];

  // 2. Baris Header Tabel
  const tableHeaderRow = new TableRow({
    cantSplit: true,
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 4, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "No", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 9, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Kode TP", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 11, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Elemen CP", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 21, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Capaian Pembelajaran (CP)", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 14, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Materi Pokok", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 21, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Tujuan Pembelajaran (KBC)", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "DPL & Cinta", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 4, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Smt", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 4, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "JP", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
    ],
  });

  // 3. Baris Data Tabel
  const dataRows: TableRow[] = items.map((item, idx) => {
    const dplText = item.dpl.length > 0 ? item.dpl.join(", ") : "-";
    const pcText = item.panca_cinta.length > 0 ? item.panca_cinta.join(", ") : "-";

    return new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: String(idx + 1), font, size: bodyFontSize })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: item.kode_tp, bold: true, font, size: bodyFontSize })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: item.elemen, font, size: bodyFontSize })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: item.deskripsi_cp, font, size: bodyFontSize })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: item.materi_pokok, font, size: bodyFontSize })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: item.tujuan_pembelajaran, font, size: bodyFontSize })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: `DPL: ${dplText}`, font, size: bodyFontSize }),
                new TextRun({ text: "\n" }),
                new TextRun({ text: `Cinta: ${pcText}`, font, size: bodyFontSize, italics: true }),
              ],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: String(item.semester), font, size: bodyFontSize })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: String(item.alokasi_jp), bold: true, font, size: bodyFontSize })],
            }),
          ],
        }),
      ],
    });
  });

  // Footer baris total JP
  const footerRow = new TableRow({
    cantSplit: true,
    children: [
      new TableCell({
        columnSpan: 8,
        shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `Total JP Semester 1: ${summary.totalJpSmt1} JP  |  Total JP Semester 2: ${summary.totalJpSmt2} JP  |  Total Keseluruhan: `,
                bold: true,
                font,
                size: headerFontSize,
              }),
            ],
          }),
        ],
      }),
      new TableCell({
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `${summary.grandTotalJp}`,
                bold: true,
                font,
                size: headerFontSize,
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const atpTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: STANDARD_TABLE_BORDERS,
    rows: [tableHeaderRow, ...dataRows, footerRow],
  });

  // 4. Struktur Dokumen
  const doc = new Document({
    sections: [
      {
        properties: createPageProperties("portrait", options),
        headers: { default: createDocumentHeader(atp.status, options) },
        footers: { default: createDocumentFooter(madrasah.nama, options) },
        children: [
          ...createKopMadrasah(madrasah, options),
          ...createWatermarkCallout(atp.status, options),
          ...createDocumentTitle(
            "Alur Tujuan Pembelajaran (ATP)",
            "Kurikulum Berbasis Cinta (KBC) • Fase D (Madrasah Tsanawiyah)",
            options
          ),
          createIdentitasTable(identitasItems, options),
          new Paragraph({ spacing: { after: 140 }, children: [] }),
          atpTable,
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          createSignaturesTable(
            madrasah,
            penugasan.guru,
            options,
            formatTitimangsa(penugasan.tahun_ajaran.tanggal_penetapan_dokumen)
          ),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
