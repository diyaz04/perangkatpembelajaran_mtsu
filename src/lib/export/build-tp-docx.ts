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
import type { TpPreviewData } from "@/app/(app)/atp/actions";
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
  getFontFamily,
  getFontSize,
  STANDARD_TABLE_BORDERS,
} from "./docx-helpers";

export async function buildTpDocx(
  data: TpPreviewData,
  options?: ExportDocxOptions
): Promise<Buffer> {
  const { madrasah, penugasan, items, summary } = data;
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

  // 2. Header Tabel
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
        width: { size: 8, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Kode TP", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 14, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Elemen CP", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 28, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Rumusan Tujuan Pembelajaran (TP)", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 14, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Lingkup Materi", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 16, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Panca Cinta & Profil Lulusan", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Semester", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Alokasi", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
    ],
  });

  // 3. Baris Data
  const dataRows = items.map((item) => {
    const pancaStr = item.panca_cinta?.length > 0 ? item.panca_cinta.join("; ") : "-";
    const dplStr = item.dpl?.length > 0 ? item.dpl.join("; ") : "-";

    return new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: String(item.no), font, size: bodyFontSize })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
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
              children: [new TextRun({ text: item.deskripsi, font, size: bodyFontSize })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: item.lingkup_materi, font, size: bodyFontSize })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "PC: ", bold: true, font, size: bodyFontSize }),
                new TextRun({ text: pancaStr, font, size: bodyFontSize }),
              ],
            }),
            new Paragraph({
              spacing: { before: 40 },
              children: [
                new TextRun({ text: "DPL: ", bold: true, font, size: bodyFontSize }),
                new TextRun({ text: dplStr, font, size: bodyFontSize }),
              ],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: `Smt ${item.semester}`, font, size: bodyFontSize })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: `${item.alokasi_jp} JP`, font, size: bodyFontSize })],
            }),
          ],
        }),
      ],
    });
  });

  // Footer Row Total JP
  const footerRow = new TableRow({
    cantSplit: true,
    children: [
      new TableCell({
        columnSpan: 7,
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({
                text: `Total JP Smt 1: ${summary.totalJpSmt1} JP  |  Total JP Smt 2: ${summary.totalJpSmt2} JP  |  Grand Total: `,
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
                text: `${summary.grandTotalJp} JP`,
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

  const tpTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: STANDARD_TABLE_BORDERS,
    rows: [tableHeaderRow, ...dataRows, footerRow],
  });

  const doc = new Document({
    sections: [
      {
        properties: createPageProperties("landscape", options),
        headers: { default: createDocumentHeader("disetujui", options) },
        footers: { default: createDocumentFooter(madrasah.nama, options) },
        children: [
          ...createKopMadrasah(madrasah, options),
          ...createDocumentTitle(
            "Rumusan Tujuan Pembelajaran (TP) & KKTP",
            "Kurikulum Berbasis Cinta (KBC) • Fase D (Madrasah Tsanawiyah)",
            options
          ),
          createIdentitasTable(identitasItems, options),
          new Paragraph({ spacing: { after: 140 }, children: [] }),
          tpTable,
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
