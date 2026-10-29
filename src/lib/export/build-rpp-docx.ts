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
import type { RppDetailData } from "@/app/(app)/modul-ajar/actions";
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
import {
  getModelPedagogiSpec,
  parseLangkahDeskripsi,
} from "@/lib/rpp-model-pedagogi";

export async function buildRppDocx(
  data: RppDetailData,
  options?: ExportDocxOptions
): Promise<Buffer> {
  const { rpp, langkahList, penugasan, madrasah, master } = data;
  const isLengkap = rpp.versi === "lengkap";

  const font = getFontFamily(options);
  const bodyFontSize = getFontSize(options, 9.5);
  const headerFontSize = getFontSize(options, 10);
  const sectionTitleFontSize = getFontSize(options, 11);

  // Cari model pembelajaran
  const modelTerpilih =
    master.models.find((m) => m.id === rpp.model_id) || master.models[0];
  const activeSpec = getModelPedagogiSpec(modelTerpilih?.nama);

  // Cari nama DPL terpilih
  const dplSelected = master.dpl
    .filter((d) => (rpp.dimensi_profil_lulusan_ids || []).includes(d.id))
    .map((d) => `${d.kode}: ${d.nama}`);

  // Cari Panca Cinta terpilih
  const pcSelected = master.pancaCinta
    .filter((pc) => (rpp.panca_cinta_ids || []).includes(pc.id))
    .map((pc) => `${pc.kode}: ${pc.nama}`);

  // 1. Identitas Dokumen
  const totalMenit = rpp.alokasi_jp * (rpp.menit_per_jp || 40);
  const identitasItems = [
    { label: "Satuan Pendidikan", value: madrasah.nama },
    { label: "Tahun Pelajaran", value: penugasan.tahun_ajaran.nama },
    { label: "Mata Pelajaran", value: `${penugasan.mapel.nama} (${penugasan.mapel.kode})` },
    { label: "Fase / Kelas / Smt", value: `Fase D / Kelas ${penugasan.tingkat_kelas} (${penugasan.rombel})` },
    { label: "Materi Pokok", value: rpp.materi_pokok },
    { label: "Alokasi Waktu", value: `${rpp.alokasi_jp} JP (${rpp.jumlah_pertemuan} Pertemuan @ ${totalMenit / rpp.jumlah_pertemuan} menit)` },
    { label: "Model Pembelajaran", value: modelTerpilih?.nama || "Pembelajaran Mendalam" },
    { label: "Versi Modul Ajar", value: isLengkap ? "Versi Lengkap" : "Versi Minimum" },
  ];

  const contentParagraphs: Array<Paragraph | Table> = [];

  // 2. Judul Dokumen
  contentParagraphs.push(
    ...createDocumentTitle(
      "Modul Ajar / Rencana Pelaksanaan Pembelajaran (RPP)",
      "Pembelajaran Mendalam Terintegrasi Kurikulum Berbasis Cinta (KBC)",
      options
    )
  );

  // 3. Tabel Identitas
  contentParagraphs.push(createIdentitasTable(identitasItems, options));
  contentParagraphs.push(new Paragraph({ spacing: { after: 120 }, children: [] }));

  // Helper membuat Heading Bagian
  const createSectionHeader = (title: string) => {
    return new Paragraph({
      spacing: { before: 140, after: 60 },
      children: [
        new TextRun({
          text: title,
          bold: true,
          font,
          size: sectionTitleFontSize,
          color: "0F172A",
        }),
      ],
    });
  };

  // Helper membuat Poin Paragraf
  const createSubItem = (label: string, text: string, italics = false) => {
    return new Paragraph({
      spacing: { line: 220, after: 40 },
      children: [
        new TextRun({ text: `${label}: `, bold: true, font, size: bodyFontSize }),
        new TextRun({ text: text || "-", font, size: bodyFontSize, italics }),
      ],
    });
  };

  // ==========================================
  // BAGIAN 1: IDENTIFIKASI
  // ==========================================
  contentParagraphs.push(createSectionHeader("I. IDENTIFIKASI PEMBELAJARAN"));

  if (isLengkap && rpp.kesiapan_murid) {
    const km = rpp.kesiapan_murid;
    contentParagraphs.push(createSubItem("1. Pengetahuan Awal", km.pengetahuan_awal));
    contentParagraphs.push(createSubItem("2. Minat Murid", km.minat));
    contentParagraphs.push(createSubItem("3. Latar Belakang & Profil", km.latar_belakang));
    contentParagraphs.push(createSubItem("4. Kebutuhan Belajar Khusus", km.kebutuhan));
    contentParagraphs.push(createSubItem("5. Strategi Asesmen Awal (Diagnostik)", km.strategi_asesmen_awal));
  }

  contentParagraphs.push(createSubItem("Karakteristik Materi", rpp.karakteristik_materi || "-"));
  contentParagraphs.push(createSubItem("Dimensi Profil Lulusan (DPL)", dplSelected.join(" • ") || "-"));
  contentParagraphs.push(createSubItem("Topik Panca Cinta", pcSelected.join(" • ") || "-"));
  contentParagraphs.push(
    createSubItem(
      "Benang Merah KBC",
      rpp.benang_merah_kbc || "-",
      true
    )
  );

  // ==========================================
  // BAGIAN 2: DESAIN PEMBELAJARAN
  // ==========================================
  contentParagraphs.push(createSectionHeader("II. DESAIN PEMBELAJARAN"));

  // Rumusan Tujuan Pembelajaran
  const rawTp = rpp.tujuan_pembelajaran_teks;
  const tpList: string[] = Array.isArray(rawTp)
    ? rawTp
    : typeof rawTp === "string" && rawTp
    ? [rawTp]
    : [];
  contentParagraphs.push(
    new Paragraph({
      spacing: { line: 220, after: 40 },
      children: [
        new TextRun({ text: "Tujuan Pembelajaran (TP):", bold: true, font, size: bodyFontSize }),
      ],
    })
  );

  if (tpList.length > 0) {
    tpList.forEach((tp) => {
      contentParagraphs.push(
        new Paragraph({
          spacing: { line: 220, after: 20 },
          bullet: { level: 0 },
          children: [new TextRun({ text: tp, font, size: bodyFontSize })],
        })
      );
    });
  } else {
    contentParagraphs.push(
      new Paragraph({
        spacing: { line: 220, after: 40 },
        children: [new TextRun({ text: rpp.materi_pokok, font, size: bodyFontSize })],
      })
    );
  }

  if (isLengkap && rpp.lintas_disiplin_ilmu) {
    contentParagraphs.push(createSubItem("Pembelajaran Lintas Disiplin Ilmu", rpp.lintas_disiplin_ilmu));
  }

  contentParagraphs.push(createSubItem("Model Pembelajaran", modelTerpilih?.nama || "Pembelajaran Mendalam"));
  if (rpp.metode_pembelajaran && rpp.metode_pembelajaran.length > 0) {
    contentParagraphs.push(createSubItem("Metode Pembelajaran", rpp.metode_pembelajaran.join(", ")));
  }

  if (isLengkap) {
    if (rpp.lingkungan_belajar_fisik || rpp.budaya_belajar) {
      contentParagraphs.push(
        createSubItem(
          "Lingkungan & Budaya Belajar",
          `Fisik: ${rpp.lingkungan_belajar_fisik || "-"} | Budaya: ${rpp.budaya_belajar || "-"}`
        )
      );
    }
    if (rpp.kemitraan_pembelajaran) {
      contentParagraphs.push(createSubItem("Kemitraan Pembelajaran", rpp.kemitraan_pembelajaran));
    }
    if (rpp.pemanfaatan_digital) {
      contentParagraphs.push(createSubItem("Pemanfaatan Teknologi Digital", rpp.pemanfaatan_digital));
    }
  }

  // ==========================================
  // BAGIAN 3: PENGALAMAN BELAJAR (SKENARIO)
  // ==========================================
  contentParagraphs.push(
    createSectionHeader(
      `III. PENGALAMAN BELAJAR — ${activeSpec.nama_resmi.toUpperCase()}`
    )
  );
  contentParagraphs.push(
    createSubItem("Format & Alur Sintaks Model", activeSpec.format_pengalaman_label)
  );

  for (let pKe = 1; pKe <= rpp.jumlah_pertemuan; pKe++) {
    const langkahPertemuan = langkahList.filter((l) => l.pertemuan_ke === pKe);

    contentParagraphs.push(
      new Paragraph({
        spacing: { before: 100, after: 40 },
        children: [
          new TextRun({
            text: `Pertemuan Ke-${pKe} (${activeSpec.singkatan})`,
            bold: true,
            font,
            size: headerFontSize,
            color: "047857",
          }),
        ],
      })
    );

    const stepHeader = new TableRow({
      cantSplit: true,
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 14, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Tahap Kegiatan", bold: true, font, size: headerFontSize })] })],
        }),
        new TableCell({
          width: { size: 48, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Sintaks Model & Rincian Aktivitas (Guru & Murid)", bold: true, font, size: headerFontSize })] })],
        }),
        new TableCell({
          width: { size: 8, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Durasi", bold: true, font, size: headerFontSize })] })],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Pengalaman & Prinsip", bold: true, font, size: headerFontSize })] })],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Aksi Cinta KBC", bold: true, font, size: headerFontSize })] })],
        }),
      ],
    });

    const stepRows: TableRow[] = langkahPertemuan.map((l) => {
      const tahapLabel = l.tahap.toUpperCase();
      const pcObj = master.pancaCinta.find((pc) => pc.id === l.panca_cinta_id);
      const aksiText = l.aksi_kbc ? `${pcObj?.kode ? `[${pcObj.kode}] ` : ""}${l.aksi_kbc}` : "-";
      const parsed = parseLangkahDeskripsi(l.deskripsi_kegiatan);

      const activityParagraphs: Paragraph[] = [];
      if (parsed.sintaksHeader) {
        activityParagraphs.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: parsed.sintaksHeader,
                bold: true,
                font,
                size: bodyFontSize,
                color: "065F46",
              }),
            ],
          })
        );
      }

      if (parsed.aktivitasGuru || parsed.aktivitasMurid) {
        if (parsed.aktivitasGuru) {
          activityParagraphs.push(
            new Paragraph({
              spacing: { line: 220, after: 30 },
              children: [
                new TextRun({
                  text: "• Aktivitas Guru: ",
                  bold: true,
                  font,
                  size: bodyFontSize,
                }),
                new TextRun({
                  text: parsed.aktivitasGuru,
                  font,
                  size: bodyFontSize,
                }),
              ],
            })
          );
        }
        if (parsed.aktivitasMurid) {
          activityParagraphs.push(
            new Paragraph({
              spacing: { line: 220 },
              children: [
                new TextRun({
                  text: "• Aktivitas Murid: ",
                  bold: true,
                  font,
                  size: bodyFontSize,
                }),
                new TextRun({
                  text: parsed.aktivitasMurid,
                  font,
                  size: bodyFontSize,
                }),
              ],
            })
          );
        }
      } else {
        activityParagraphs.push(
          new Paragraph({
            spacing: { line: 220 },
            children: [
              new TextRun({
                text: parsed.isiUtama,
                font,
                size: bodyFontSize,
              }),
            ],
          })
        );
      }

      return new TableRow({
        cantSplit: false,
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: tahapLabel, bold: true, font, size: bodyFontSize })],
              }),
            ],
          }),
          new TableCell({
            children: activityParagraphs,
          }),
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: `${l.durasi_menit}'`, bold: true, font, size: bodyFontSize })],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `• ${l.pengalaman}`, bold: true, font, size: bodyFontSize }),
                  new TextRun({ text: "\n" }),
                  new TextRun({ text: `• ${(l.prinsip || ["bermakna"]).join(", ")}`, font, size: bodyFontSize, italics: true }),
                ],
              }),
            ],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: aksiText,
                    font,
                    size: bodyFontSize,
                    color: l.aksi_kbc ? "065F46" : "64748B",
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    });

    const stepTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: STANDARD_TABLE_BORDERS,
      rows: [stepHeader, ...stepRows],
    });

    contentParagraphs.push(stepTable);
  }

  // ==========================================
  // BAGIAN 4: ASESMEN PEMBELAJARAN
  // ==========================================
  contentParagraphs.push(createSectionHeader("IV. ASESMEN PEMBELAJARAN"));
  contentParagraphs.push(createSubItem("1. Asesmen Awal (Diagnostik)", rpp.asesmen_awal || "Pertanyaan pemantik & kuis apersepsi"));
  contentParagraphs.push(createSubItem("2. Asesmen Formatif (Proses)", rpp.asesmen_proses || "Observasi diskusi, lembar refleksi diri, ceklis partisipasi"));
  contentParagraphs.push(createSubItem("3. Asesmen Sumatif (Akhir)", rpp.asesmen_akhir || "Tes tertulis pemahaman konsep & produk karya / proyek"));

  // Rubrik Sikap KBC
  if (rpp.rubrik_kbc && rpp.rubrik_kbc.length > 0) {
    contentParagraphs.push(
      new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [
          new TextRun({
            text: "Rubrik Penilaian Sikap Terintegrasi Panca Cinta (4 Level Perkembangan):",
            bold: true,
            font,
            size: headerFontSize,
          }),
        ],
      })
    );

    const rubrikHeader = new TableRow({
      cantSplit: true,
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 24, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Topik Panca Cinta", bold: true, font, size: headerFontSize })] })],
        }),
        new TableCell({
          width: { size: 19, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Mulai Berkembang (MB)", bold: true, font, size: headerFontSize })] })],
        }),
        new TableCell({
          width: { size: 19, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Sedang Berkembang (SB)", bold: true, font, size: headerFontSize })] })],
        }),
        new TableCell({
          width: { size: 19, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Berkembang Sesuai (BSH)", bold: true, font, size: headerFontSize })] })],
        }),
        new TableCell({
          width: { size: 19, type: WidthType.PERCENTAGE },
          shading: { fill: "E2E8F0", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Sangat Berkembang (SAB)", bold: true, font, size: headerFontSize })] })],
        }),
      ],
    });

    const rubrikRows: TableRow[] = (rpp.rubrik_kbc || []).map((rb) => {
      const topikText = rb.topik_nama || "Panca Cinta";
      const mbText = rb.levels?.find((l) => l.level === "MB")?.deskripsi || "-";
      const bText = rb.levels?.find((l) => l.level === "B")?.deskripsi || "-";
      const cText = rb.levels?.find((l) => l.level === "C")?.deskripsi || "-";
      const mText = rb.levels?.find((l) => l.level === "M")?.deskripsi || "-";

      return new TableRow({
        cantSplit: false,
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: topikText, bold: true, font, size: bodyFontSize })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: mbText, font, size: bodyFontSize })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: bText, font, size: bodyFontSize })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cText, font, size: bodyFontSize })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: mText, font, size: bodyFontSize })] })] }),
        ],
      });
    });

    const rubrikTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: STANDARD_TABLE_BORDERS,
      rows: [rubrikHeader, ...rubrikRows],
    });

    contentParagraphs.push(rubrikTable);
  }

  // KKTP
  if (rpp.kktp) {
    contentParagraphs.push(createSubItem("Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)", rpp.kktp));
  }

  // ==========================================
  // BAGIAN 5: LAMPIRAN
  // ==========================================
  if (rpp.lampiran) {
    const lp = rpp.lampiran;
    contentParagraphs.push(createSectionHeader("V. LAMPIRAN"));
    if (lp.lkpd) contentParagraphs.push(createSubItem("Lembar Kerja Peserta Didik (LKPD)", lp.lkpd));
    if (lp.bahan_bacaan) contentParagraphs.push(createSubItem("Bahan Bacaan Guru & Murid", lp.bahan_bacaan));
    if (lp.glosarium) contentParagraphs.push(createSubItem("Glosarium", lp.glosarium));
    if (lp.daftar_pustaka) contentParagraphs.push(createSubItem("Daftar Pustaka", lp.daftar_pustaka));
  }

  // Spacer sebelum tanda tangan
  contentParagraphs.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  contentParagraphs.push(
    createSignaturesTable(
      madrasah,
      penugasan.guru,
      options,
      formatTitimangsa(penugasan.tahun_ajaran.tanggal_penetapan_dokumen)
    )
  );

  // Buat Dokumen (A4 Portrait)
  const doc = new Document({
    sections: [
      {
        properties: createPageProperties("portrait", options),
        headers: { default: createDocumentHeader(rpp.status, options) },
        footers: { default: createDocumentFooter(madrasah.nama, options) },
        children: [
          ...createKopMadrasah(madrasah, options),
          ...createWatermarkCallout(rpp.status, options),
          ...contentParagraphs,
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
