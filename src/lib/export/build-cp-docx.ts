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
import type { CpPreviewData } from "@/app/(app)/atp/actions";
import type { ExportDocxOptions } from "./types";
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

export async function buildCpDocx(
  data: CpPreviewData,
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
    { label: "Total Beban", value: `${summary.totalJp} JP (${summary.totalElemen} Elemen CP)` },
  ];

  // 2. Header Tabel Analisis CP
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
        width: { size: 24, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Capaian Pembelajaran (CP)", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Materi Pokok", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Kompetensi", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 14, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Kata Kunci & Benang Merah", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 9, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Panca Cinta & DPL", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        width: { size: 5, type: WidthType.PERCENTAGE },
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

  // 3. Data Rows
  const dataRows = items.map((item) => {
    const kataKunciStr = item.kata_kunci?.length > 0 ? item.kata_kunci.join(", ") : "-";
    const pancaCintaStr = item.panca_cinta?.length > 0 ? item.panca_cinta.join("; ") : "-";
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
              children: [new TextRun({ text: item.elemen, bold: true, font, size: bodyFontSize })],
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
              children: [new TextRun({ text: item.kompetensi, font, size: bodyFontSize })],
            }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "Kunci: ", bold: true, font, size: bodyFontSize }),
                new TextRun({ text: kataKunciStr, font, size: bodyFontSize }),
              ],
            }),
            item.benang_merah
              ? new Paragraph({
                  spacing: { before: 40 },
                  children: [
                    new TextRun({ text: "Alur: ", bold: true, font, size: bodyFontSize }),
                    new TextRun({ text: item.benang_merah, font, size: bodyFontSize, italics: true }),
                  ],
                })
              : new Paragraph({ children: [] }),
          ],
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: "PC: ", bold: true, font, size: bodyFontSize }),
                new TextRun({ text: pancaCintaStr, font, size: bodyFontSize }),
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
              children: [new TextRun({ text: String(item.alokasi_jp), font, size: bodyFontSize })],
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
                text: "Total Alokasi Waktu Analisis CP: ",
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
                text: `${summary.totalJp} JP`,
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

  const cpTable = new Table({
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
            "Analisis Capaian Pembelajaran (CP)",
            "Kurikulum Berbasis Cinta (KBC) • Fase D (Madrasah Tsanawiyah)",
            options
          ),
          createIdentitasTable(identitasItems, options),
          new Paragraph({ spacing: { after: 140 }, children: [] }),
          cpTable,
          new Paragraph({ spacing: { after: 200 }, children: [] }),
          createSignaturesTable(madrasah, penugasan.guru, options),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
