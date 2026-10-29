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
import type { ProtaDetailData } from "@/app/(app)/prota/actions";
import type { BulanMingguEfektif } from "@/lib/kalender/minggu-efektif";
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

export async function buildProtaDocx(
  data: ProtaDetailData,
  options?: ExportDocxOptions
): Promise<Buffer> {
  const { madrasah, penugasan, prota, items } = data;
  const font = getFontFamily(options);
  const bodyFontSize = getFontSize(options, 9.5);
  const headerFontSize = getFontSize(options, 10);
  const sectionTitleFontSize = getFontSize(options, 11);

  const meData = prota.snapshot_minggu_efektif || data.mingguEfektifKini;

  // 1. Identitas Dokumen
  const identitasItems = [
    { label: "Satuan Pendidikan", value: madrasah.nama },
    { label: "Tahun Pelajaran", value: penugasan.tahun_ajaran.nama },
    { label: "Mata Pelajaran", value: `${penugasan.mapel.nama} (${penugasan.mapel.kode})` },
    { label: "Fase / Kelas", value: `Fase D / Kelas ${penugasan.tingkat_kelas} (${penugasan.rombel})` },
    { label: "Guru Pengampu", value: penugasan.guru.nama_lengkap },
    { label: "Alokasi Waktu / Minggu", value: `${penugasan.mapel.jp_per_minggu} JP / Minggu` },
  ];

  // 2. Tabel Analisis Minggu Efektif (Bagian I)
  const meHeaderRow = new TableRow({
    cantSplit: true,
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 6, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "No", bold: true, font, size: headerFontSize })] })],
      }),
      new TableCell({
        width: { size: 24, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Bulan", bold: true, font, size: headerFontSize })] })],
      }),
      new TableCell({
        width: { size: 16, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Jml Minggu", bold: true, font, size: headerFontSize })] })],
      }),
      new TableCell({
        width: { size: 16, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Minggu Efektif", bold: true, font, size: headerFontSize })] })],
      }),
      new TableCell({
        width: { size: 16, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tidak Efektif", bold: true, font, size: headerFontSize })] })],
      }),
      new TableCell({
        width: { size: 22, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Keterangan", bold: true, font, size: headerFontSize })] })],
      }),
    ],
  });

  const meRows: TableRow[] = [];

  // Semester 1
  if (meData?.semester1) {
    meRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            columnSpan: 6,
            shading: { fill: "F8FAFC", type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "SEMESTER 1 (GANJIL)", bold: true, font, size: headerFontSize, color: "065F46" })],
              }),
            ],
          }),
        ],
      })
    );

    const daftarBulanSmt1 = meData.semester1.daftarBulan || [];
    daftarBulanSmt1.forEach((b: BulanMingguEfektif, idx: number) => {
      meRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1), font, size: bodyFontSize })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: b.bulan || "-", font, size: bodyFontSize })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(b.jumlahMinggu), font, size: bodyFontSize })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(b.mingguEfektif), bold: true, font, size: bodyFontSize })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(b.mingguTidakEfektif), font, size: bodyFontSize })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: b.keterangan || "-", font, size: bodyFontSize })] })] }),
          ],
        })
      );
    });

    meRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({ columnSpan: 2, shading: { fill: "F1F5F9", type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Subtotal Semester 1", bold: true, font, size: bodyFontSize })] })] }),
          new TableCell({ shading: { fill: "F1F5F9", type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(meData.semester1.totalMinggu), bold: true, font, size: bodyFontSize })] })] }),
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(meData.semester1.totalMingguEfektif), bold: true, font, size: bodyFontSize })] })] }),
          new TableCell({ shading: { fill: "F1F5F9", type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(meData.semester1.totalMingguTidakEfektif), bold: true, font, size: bodyFontSize })] })] }),
          new TableCell({ shading: { fill: "F1F5F9", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: `${meData.semester1.jpEfektif || 0} JP Efektif`, bold: true, font, size: bodyFontSize })] })] }),
        ],
      })
    );
  }

  // Semester 2
  if (meData?.semester2) {
    meRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            columnSpan: 6,
            shading: { fill: "F8FAFC", type: ShadingType.CLEAR },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "SEMESTER 2 (GENAP)", bold: true, font, size: headerFontSize, color: "065F46" })],
              }),
            ],
          }),
        ],
      })
    );

    const daftarBulanSmt2 = meData.semester2.daftarBulan || [];
    daftarBulanSmt2.forEach((b: BulanMingguEfektif, idx: number) => {
      meRows.push(
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1), font, size: bodyFontSize })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: b.bulan || "-", font, size: bodyFontSize })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(b.jumlahMinggu), font, size: bodyFontSize })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(b.mingguEfektif), bold: true, font, size: bodyFontSize })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(b.mingguTidakEfektif), font, size: bodyFontSize })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: b.keterangan || "-", font, size: bodyFontSize })] })] }),
          ],
        })
      );
    });

    meRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({ columnSpan: 2, shading: { fill: "F1F5F9", type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Subtotal Semester 2", bold: true, font, size: bodyFontSize })] })] }),
          new TableCell({ shading: { fill: "F1F5F9", type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(meData.semester2.totalMinggu), bold: true, font, size: bodyFontSize })] })] }),
          new TableCell({ shading: { fill: "E2E8F0", type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(meData.semester2.totalMingguEfektif), bold: true, font, size: bodyFontSize })] })] }),
          new TableCell({ shading: { fill: "F1F5F9", type: ShadingType.CLEAR }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(meData.semester2.totalMingguTidakEfektif), bold: true, font, size: bodyFontSize })] })] }),
          new TableCell({ shading: { fill: "F1F5F9", type: ShadingType.CLEAR }, children: [new Paragraph({ children: [new TextRun({ text: `${meData.semester2.jpEfektif || 0} JP Efektif`, bold: true, font, size: bodyFontSize })] })] }),
        ],
      })
    );
  }

  // Grand Total Minggu Efektif
  const totalTahun = meData?.totalTahun;
  if (totalTahun) {
    meRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            columnSpan: 2,
            shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "TOTAL TAHUN AJARAN", bold: true, font, size: headerFontSize })] })],
          }),
          new TableCell({
            shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(totalTahun.totalMinggu), bold: true, font, size: headerFontSize })] })],
          }),
          new TableCell({
            shading: { fill: "CBD5E1", type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(totalTahun.totalMingguEfektif), bold: true, font, size: headerFontSize })] })],
          }),
          new TableCell({
            shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(totalTahun.totalMingguTidakEfektif), bold: true, font, size: headerFontSize })] })],
          }),
          new TableCell({
            shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: `${totalTahun.jpEfektif || 0} JP Total`, bold: true, font, size: headerFontSize })] })],
          }),
        ],
      })
    );
  }

  const tabelMingguEfektif = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: STANDARD_TABLE_BORDERS,
    rows: [meHeaderRow, ...meRows],
  });

  // 3. Tabel Distribusi Alokasi Waktu Prota (Bagian II)
  const protaHeaderRow = new TableRow({
    cantSplit: true,
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 5, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "No", bold: true, font, size: headerFontSize })] })],
      }),
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Smt", bold: true, font, size: headerFontSize })] })],
      }),
      new TableCell({
        width: { size: 27, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Materi Pokok / Lingkup Materi", bold: true, font, size: headerFontSize })] })],
      }),
      new TableCell({
        width: { size: 38, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tujuan Pembelajaran (TP)", bold: true, font, size: headerFontSize })] })],
      }),
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "JP", bold: true, font, size: headerFontSize })] })],
      }),
      new TableCell({
        width: { size: 14, type: WidthType.PERCENTAGE },
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Keterangan", bold: true, font, size: headerFontSize })] })],
      }),
    ],
  });

  let totalJpItems = 0;
  const protaDataRows: TableRow[] = items.map((item, idx) => {
    totalJpItems += item.alokasi_jp;
    const kodeDisplay = item.kode_tp ? `[${item.kode_tp}] ` : "";
    const tpText = `${kodeDisplay}${item.tujuan_pembelajaran_teks || item.materi_pokok}`;

    return new TableRow({
      cantSplit: true,
      children: [
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1), font, size: bodyFontSize })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(item.semester), font, size: bodyFontSize })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.materi_pokok, bold: true, font, size: bodyFontSize })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: tpText, font, size: bodyFontSize })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(item.alokasi_jp), bold: true, font, size: bodyFontSize })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.keterangan || "-", font, size: bodyFontSize })] })] }),
      ],
    });
  });

  const protaFooterRow = new TableRow({
    cantSplit: true,
    children: [
      new TableCell({
        columnSpan: 4,
        shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "TOTAL ALOKASI WAKTU TAHUNAN: ", bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: String(totalJpItems), bold: true, font, size: headerFontSize })],
          }),
        ],
      }),
      new TableCell({
        shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
        children: [new Paragraph({ children: [new TextRun({ text: "JP", bold: true, font, size: headerFontSize })] })],
      }),
    ],
  });

  const tabelProta = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: STANDARD_TABLE_BORDERS,
    rows: [protaHeaderRow, ...protaDataRows, protaFooterRow],
  });

  // 4. Struktur Dokumen
  const doc = new Document({
    sections: [
      {
        properties: createPageProperties("portrait", options),
        headers: { default: createDocumentHeader(prota.status, options) },
        footers: { default: createDocumentFooter(madrasah.nama, options) },
        children: [
          ...createKopMadrasah(madrasah, options),
          ...createWatermarkCallout(prota.status, options),
          ...createDocumentTitle(
            "Program Tahunan (PROTA)",
            "Kurikulum Berbasis Cinta (KBC) • Fase D (Madrasah Tsanawiyah)",
            options
          ),
          createIdentitasTable(identitasItems, options),
          new Paragraph({ spacing: { after: 120 }, children: [] }),

          // Subjudul Bagian I
          new Paragraph({
            spacing: { before: 80, after: 60 },
            children: [
              new TextRun({
                text: "A. ANALISIS ALOKASI WAKTU / MINGGU EFEKTIF",
                bold: true,
                font,
                size: sectionTitleFontSize,
                color: "0F172A",
              }),
            ],
          }),
          tabelMingguEfektif,
          new Paragraph({ spacing: { after: 140 }, children: [] }),

          // Subjudul Bagian II
          new Paragraph({
            spacing: { before: 100, after: 60 },
            children: [
              new TextRun({
                text: "B. DISTRIBUSI ALOKASI WAKTU PROGRAM TAHUNAN",
                bold: true,
                font,
                size: sectionTitleFontSize,
                color: "0F172A",
              }),
            ],
          }),
          tabelProta,
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
