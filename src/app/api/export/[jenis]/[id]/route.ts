import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getAtpPreviewDataAction,
  getCpPreviewDataAction,
  getTpPreviewDataAction,
} from "@/app/(app)/atp/actions";
import { getProtaDetailAction } from "@/app/(app)/prota/actions";
import { getProsemDetailAction } from "@/app/(app)/prosem/actions";
import { getRppDetailAction } from "@/app/(app)/modul-ajar/actions";
import {
  buildAtpDocx,
  buildCpDocx,
  buildTpDocx,
  buildProtaDocx,
  buildProsemDocx,
  buildRppDocx,
  generateAtpHtml,
  generateProtaHtml,
  generateProsemHtml,
  generateRppHtml,
  generatePdfBufferFromHtml,
  type ExportDocxOptions,
  type PaperSize,
  type FontFamily,
} from "@/lib/export";

export const runtime = "nodejs";

// Helper sanitasi nama file agar valid di OS Windows/Linux
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "-");
}

// Konversi angka kelas Romawi
function getKelasRomawi(tingkat: number): string {
  if (tingkat === 7) return "VII";
  if (tingkat === 8) return "VIII";
  if (tingkat === 9) return "IX";
  return String(tingkat);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jenis: string; id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { error: "Sesi tidak valid. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const { jenis, id } = await params;
    const url = new URL(request.url);
    const semesterQuery = url.searchParams.get("semester");
    const semesterNum: 1 | 2 = semesterQuery === "2" ? 2 : 1;

    const paperParam = url.searchParams.get("kertas")?.toUpperCase();
    const paperSize: PaperSize = paperParam === "F4" ? "F4" : "A4";

    const fontParam = url.searchParams.get("font")?.toLowerCase();
    const fontFamily: FontFamily = fontParam === "arial" ? "Arial" : "Times New Roman";

    const kopParam = url.searchParams.get("kop");
    const includeKop = kopParam === "false" || kopParam === "0" ? false : true;

    const formatParam = url.searchParams.get("format")?.toLowerCase();
    const isPdf = formatParam === "pdf";

    const exportOptions: ExportDocxOptions = {
      paperSize,
      fontFamily,
      includeKop,
    };

    const jenisLower = jenis.toLowerCase();

    // 1. Ekspor ATP
    if (jenisLower === "atp") {
      const result = await getAtpPreviewDataAction(id);
      if (!result.success || !result.data) {
        return NextResponse.json(
          { error: result.error || "Dokumen ATP tidak ditemukan." },
          { status: 404 }
        );
      }

      const { penugasan } = result.data;
      const taNama = penugasan.tahun_ajaran.nama.replace(/\//g, "-");
      const kelasRomawi = getKelasRomawi(penugasan.tingkat_kelas);

      if (isPdf) {
        const pdfFilename = sanitizeFilename(
          `ATP_${penugasan.mapel.nama}_${kelasRomawi}_Smt1-2_${taNama}.pdf`
        );
        const html = generateAtpHtml(result.data);
        const pdfBuffer = await generatePdfBufferFromHtml(html, { paperSize, landscape: true });
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${pdfFilename}"`,
            "Cache-Control": "no-store",
          },
        });
      }

      const filename = sanitizeFilename(
        `ATP_${penugasan.mapel.nama}_${kelasRomawi}_Smt1-2_${taNama}.docx`
      );

      const buffer = await buildAtpDocx(result.data, exportOptions);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // 2. Ekspor Analisis CP
    if (jenisLower === "cp" || jenisLower === "analisis-cp") {
      const result = await getCpPreviewDataAction(id);
      if (!result.success || !result.data) {
        return NextResponse.json(
          { error: result.error || "Dokumen Analisis CP tidak ditemukan." },
          { status: 404 }
        );
      }

      const { penugasan } = result.data;
      const taNama = penugasan.tahun_ajaran.nama.replace(/\//g, "-");
      const kelasRomawi = getKelasRomawi(penugasan.tingkat_kelas);
      const filename = sanitizeFilename(
        `ANALISIS_CP_${penugasan.mapel.nama}_${kelasRomawi}_${taNama}.docx`
      );

      const buffer = await buildCpDocx(result.data, exportOptions);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // 3. Ekspor Tujuan Pembelajaran (TP) & KKTP
    if (jenisLower === "tp" || jenisLower === "tujuan-pembelajaran") {
      const result = await getTpPreviewDataAction(id);
      if (!result.success || !result.data) {
        return NextResponse.json(
          { error: result.error || "Dokumen Tujuan Pembelajaran (TP) tidak ditemukan." },
          { status: 404 }
        );
      }

      const { penugasan } = result.data;
      const taNama = penugasan.tahun_ajaran.nama.replace(/\//g, "-");
      const kelasRomawi = getKelasRomawi(penugasan.tingkat_kelas);
      const filename = sanitizeFilename(
        `TP_${penugasan.mapel.nama}_${kelasRomawi}_${taNama}.docx`
      );

      const buffer = await buildTpDocx(result.data, exportOptions);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // 4. Ekspor PROTA
    if (jenisLower === "prota") {
      const result = await getProtaDetailAction(id);
      if (!result.success || !result.data) {
        return NextResponse.json(
          { error: result.error || "Dokumen Prota tidak ditemukan." },
          { status: 404 }
        );
      }

      const { penugasan } = result.data;
      const taNama = penugasan.tahun_ajaran.nama.replace(/\//g, "-");
      const kelasRomawi = getKelasRomawi(penugasan.tingkat_kelas);

      if (isPdf) {
        const pdfFilename = sanitizeFilename(
          `PROTA_${penugasan.mapel.nama}_${kelasRomawi}_${taNama}.pdf`
        );
        const html = generateProtaHtml(result.data);
        const pdfBuffer = await generatePdfBufferFromHtml(html, { paperSize, landscape: false });
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${pdfFilename}"`,
            "Cache-Control": "no-store",
          },
        });
      }

      const filename = sanitizeFilename(
        `PROTA_${penugasan.mapel.nama}_${kelasRomawi}_${taNama}.docx`
      );

      const buffer = await buildProtaDocx(result.data, exportOptions);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // 5. Ekspor PROSEM
    if (jenisLower === "prosem") {
      const result = await getProsemDetailAction(id, semesterNum);
      if (!result.success || !result.data) {
        return NextResponse.json(
          { error: result.error || "Dokumen Prosem tidak ditemukan." },
          { status: 404 }
        );
      }

      const { penugasan } = result.data;
      const taNama = penugasan.tahun_ajaran.nama.replace(/\//g, "-");
      const kelasRomawi = getKelasRomawi(penugasan.tingkat_kelas);

      if (isPdf) {
        const pdfFilename = sanitizeFilename(
          `PROSEM_${penugasan.mapel.nama}_${kelasRomawi}_Smt${semesterNum}_${taNama}.pdf`
        );
        const html = generateProsemHtml(result.data, semesterNum);
        const pdfBuffer = await generatePdfBufferFromHtml(html, { paperSize, landscape: true });
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${pdfFilename}"`,
            "Cache-Control": "no-store",
          },
        });
      }

      const filename = sanitizeFilename(
        `PROSEM_${penugasan.mapel.nama}_${kelasRomawi}_Smt${semesterNum}_${taNama}.docx`
      );

      const buffer = await buildProsemDocx(result.data, semesterNum, exportOptions);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    // 6. Ekspor RPP / MODUL AJAR
    if (jenisLower === "rpp" || jenisLower === "modul-ajar") {
      const result = await getRppDetailAction(id);
      if (!result.success || !result.data) {
        return NextResponse.json(
          { error: result.error || "Dokumen Modul Ajar / RPP tidak ditemukan." },
          { status: 404 }
        );
      }

      const { penugasan, rpp } = result.data;
      const taNama = penugasan.tahun_ajaran.nama.replace(/\//g, "-");
      const kelasRomawi = getKelasRomawi(penugasan.tingkat_kelas);
      const materiKompak = (rpp.materi_pokok || "Materi")
        .slice(0, 25)
        .replace(/[^a-zA-Z0-9]/g, "_");

      if (isPdf) {
        const pdfFilename = sanitizeFilename(
          `RPP_${penugasan.mapel.nama}_${kelasRomawi}_${materiKompak}_${taNama}.pdf`
        );
        const html = generateRppHtml(result.data);
        const pdfBuffer = await generatePdfBufferFromHtml(html, { paperSize, landscape: false });
        return new NextResponse(new Uint8Array(pdfBuffer), {
          status: 200,
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${pdfFilename}"`,
            "Cache-Control": "no-store",
          },
        });
      }

      const filename = sanitizeFilename(
        `RPP_${penugasan.mapel.nama}_${kelasRomawi}_${materiKompak}_${taNama}.docx`
      );

      const buffer = await buildRppDocx(result.data, exportOptions);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json(
      { error: `Jenis dokumen '${jenis}' tidak dikenali. Pilihan valid: atp, cp, tp, prota, prosem, rpp.` },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server saat ekspor DOCX.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
