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
import type { ProsemDetailData } from "@/app/(app)/prosem/actions";
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

export async function buildProsemDocx(
  data: ProsemDetailData,
  semester: 1 | 2 = 1,
  options?: ExportDocxOptions
): Promise<Buffer> {
  const {
    madrasah,
    penugasan,
    prosem,
    kolomMinggu,
    items,
    jpEfektifSemester,
    mingguEfektifSemester,
  } = data;

  const font = getFontFamily(options);
  const bodyFontSize = getFontSize(options, 8.5);
  const headerFontSize = getFontSize(options, 9);
  const smallFontSize = getFontSize(options, 8);

  const semesterLabel = semester === 1 ? "1 (Ganjil)" : "2 (Genap)";

  // 1. Identitas Dokumen
  const identitasItems = [
    { label: "Satuan Pendidikan", value: madrasah.nama },
    { label: "Tahun Pelajaran", value: penugasan.tahun_ajaran.nama },
    { label: "Mata Pelajaran", value: `${penugasan.mapel.nama} (${penugasan.mapel.kode})` },
    { label: "Kelas / Rombel", value: `Kelas ${penugasan.tingkat_kelas} (${penugasan.rombel})` },
    { label: "Semester", value: semesterLabel },
    { label: "Beban Jam / Minggu", value: `${penugasan.mapel.jp_per_minggu} JP / Minggu` },
    { label: "Guru Pengampu", value: penugasan.guru.nama_lengkap },
    { label: "Total JP Efektif", value: `${jpEfektifSemester} JP (${mingguEfektifSemester} Minggu Efektif)` },
  ];

  // 2. Kelompokkan kolomMinggu per bulan untuk header dua tingkat
  const bulanGroups: Array<{ namaBulan: string; count: number; mingguList: typeof kolomMinggu }> = [];
  kolomMinggu.forEach((col) => {
    const bNama = col.bulan || "Bulan";
    const existing = bulanGroups.find((g) => g.namaBulan === bNama);
    if (existing) {
      existing.count += 1;
      existing.mingguList.push(col);
    } else {
      bulanGroups.push({ namaBulan: bNama, count: 1, mingguList: [col] });
    }
  });

  // Header Tingkat 1 (Bulan)
  const headerTier1Cells: TableCell[] = [
    new TableCell({
      rowSpan: 2,
      width: { size: 3, type: WidthType.PERCENTAGE },
      shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "No", bold: true, font, size: headerFontSize })] })],
    }),
    new TableCell({
      rowSpan: 2,
      width: { size: 24, type: WidthType.PERCENTAGE },
      shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tujuan Pembelajaran / Materi Pokok", bold: true, font, size: headerFontSize })] })],
    }),
    new TableCell({
      rowSpan: 2,
      width: { size: 4, type: WidthType.PERCENTAGE },
      shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "JP", bold: true, font, size: headerFontSize })] })],
    }),
  ];

  // Tambahkan cell bulan dengan columnSpan
  bulanGroups.forEach((bg) => {
    headerTier1Cells.push(
      new TableCell({
        columnSpan: bg.count,
        shading: { fill: "CBD5E1", type: ShadingType.CLEAR },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: String(bg.namaBulan).toUpperCase(), bold: true, font, size: headerFontSize })],
          }),
        ],
      })
    );
  });

  const headerTier1 = new TableRow({
    cantSplit: true,
    tableHeader: true,
    children: headerTier1Cells,
  });

  // Header Tingkat 2 (Angka Minggu 1..5)
  const headerTier2Cells: TableCell[] = kolomMinggu.map((col) => {
    const isNonEfektif = !col.efektif;
    return new TableCell({
      shading: { fill: isNonEfektif ? "E2E8F0" : "F1F5F9", type: ShadingType.CLEAR },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: String(col.mingguKe),
              bold: true,
              font,
              size: smallFontSize,
              color: isNonEfektif ? "64748B" : "0F172A",
            }),
          ],
        }),
      ],
    });
  });

  const headerTier2 = new TableRow({
    cantSplit: true,
    tableHeader: true,
    children: headerTier2Cells,
  });

  // 3. Baris Data (Per TP)
  const dataRows: TableRow[] = items.map((item, idx) => {
    const itemCells: TableCell[] = [
      new TableCell({
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(idx + 1), font, size: bodyFontSize })] })],
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: item.kode_tp ? `[${item.kode_tp}] ` : "", bold: true, font, size: bodyFontSize, color: "047857" }),
              new TextRun({ text: item.tujuan_pembelajaran_teks || item.materi_pokok, font, size: bodyFontSize }),
            ],
          }),
        ],
      }),
      new TableCell({
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(item.alokasi_jp), bold: true, font, size: bodyFontSize })] })],
      }),
    ];

    // Kolom alokasi per minggu
    kolomMinggu.forEach((col) => {
      const isNonEfektif = !col.efektif;
      const jpVal = item.distribusi_minggu?.[col.key] || 0;

      itemCells.push(
        new TableCell({
          shading: {
            fill: isNonEfektif ? "F1F5F9" : jpVal > 0 ? "ECFDF5" : "FFFFFF",
            type: ShadingType.CLEAR,
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: isNonEfektif ? "×" : jpVal > 0 ? String(jpVal) : "",
                  bold: jpVal > 0,
                  font,
                  size: bodyFontSize,
                  color: isNonEfektif ? "94A3B8" : jpVal > 0 ? "065F46" : "0F172A",
                }),
              ],
            }),
          ],
        })
      );
    });

    return new TableRow({
      cantSplit: true,
      children: itemCells,
    });
  });

  // 4. Baris Footer Total JP Mingguan
  const footerCells: TableCell[] = [
    new TableCell({
      columnSpan: 2,
      shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
      children: [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "JUMLAH JP TERDISTRIBUSI:", bold: true, font, size: headerFontSize })],
        }),
      ],
    }),
    new TableCell({
      shading: { fill: "CBD5E1", type: ShadingType.CLEAR },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: String(prosem.total_jp), bold: true, font, size: headerFontSize })],
        }),
      ],
    }),
  ];

  // Hitung total JP per kolom minggu
  kolomMinggu.forEach((col) => {
    const isNonEfektif = !col.efektif;
    const totalColJp = items.reduce((sum, it) => sum + (it.distribusi_minggu?.[col.key] || 0), 0);

    footerCells.push(
      new TableCell({
        shading: {
          fill: isNonEfektif ? "E2E8F0" : totalColJp > 0 ? "E2E8F0" : "F8FAFC",
          type: ShadingType.CLEAR,
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: isNonEfektif ? "-" : totalColJp > 0 ? String(totalColJp) : "",
                bold: true,
                font,
                size: smallFontSize,
              }),
            ],
          }),
        ],
      })
    );
  });

  const footerRow = new TableRow({
    cantSplit: true,
    children: footerCells,
  });

  const prosemTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: STANDARD_TABLE_BORDERS,
    rows: [headerTier1, headerTier2, ...dataRows, footerRow],
  });

  // 5. Legenda Kegiatan Kalender Pendidikan
  const legendaParagraphs: Paragraph[] = [
    new Paragraph({
      spacing: { before: 100, after: 40 },
      children: [
        new TextRun({
          text: "Keterangan & Catatan Kalender Pendidikan:",
          bold: true,
          font,
          size: smallFontSize,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: "• Tanda (×) dan kolom berarsir abu-abu merupakan Minggu Tidak Efektif KBM (Libur Semester / Asesmen / MATSAMA / Hari Besar).",
          font,
          size: smallFontSize,
          color: "475569",
        }),
      ],
    }),
  ];

  const kegiatanNonEfektifList: Array<{ nama: string; rentang: string }> = [];
  kolomMinggu.forEach((col) => {
    if (!col.efektif && col.kegiatanPemotong && col.kegiatanPemotong.length > 0) {
      col.kegiatanPemotong.forEach((namaKeg) => {
        if (!kegiatanNonEfektifList.some((k) => k.nama === namaKeg)) {
          kegiatanNonEfektifList.push({ nama: namaKeg, rentang: col.rentangTanggal });
        }
      });
    }
  });

  if (kegiatanNonEfektifList.length > 0) {
    const agendaText = kegiatanNonEfektifList
      .slice(0, 8)
      .map((k) => `${k.nama} (${k.rentang})`)
      .join("  |  ");

    legendaParagraphs.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: `• Agenda Terjadwal: ${agendaText}`,
            font,
            size: smallFontSize,
            color: "475569",
            italics: true,
          }),
        ],
      })
    );
  }

  // 6. Buat Dokumen (Orientasi LANDSCAPE)
  const doc = new Document({
    sections: [
      {
        properties: createPageProperties("landscape", options),
        headers: { default: createDocumentHeader(prosem.status, options) },
        footers: { default: createDocumentFooter(madrasah.nama, options) },
        children: [
          ...createKopMadrasah(madrasah, options),
          ...createWatermarkCallout(prosem.status, options),
          ...createDocumentTitle(
            "Program Semester (PROSEM)",
            `Kurikulum Berbasis Cinta (KBC) • Semester ${semesterLabel} • Fase D`,
            options
          ),
          createIdentitasTable(identitasItems, options),
          new Paragraph({ spacing: { after: 100 }, children: [] }),
          prosemTable,
          ...legendaParagraphs,
          new Paragraph({ spacing: { after: 160 }, children: [] }),
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
