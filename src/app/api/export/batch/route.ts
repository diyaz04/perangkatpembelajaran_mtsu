import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { getCurrentUser } from "@/lib/auth";
import { getAtpPreviewDataAction } from "@/app/(app)/atp/actions";
import { getProtaDetailAction } from "@/app/(app)/prota/actions";
import { getProsemDetailAction } from "@/app/(app)/prosem/actions";
import { getRppDetailAction } from "@/app/(app)/modul-ajar/actions";
import {
  buildAtpDocx,
  buildProtaDocx,
  buildProsemDocx,
  buildRppDocx,
  type ExportDocxOptions,
  type PaperSize,
  type FontFamily,
} from "@/lib/export";

export const runtime = "nodejs";

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "_")
    .replace(/-+/g, "-");
}

function getKelasRomawi(tingkat: number): string {
  if (tingkat === 7) return "VII";
  if (tingkat === 8) return "VIII";
  if (tingkat === 9) return "IX";
  return String(tingkat);
}

interface BatchExportItem {
  jenis: "atp" | "prota" | "prosem" | "rpp" | "modul-ajar";
  id: string;
  semester?: 1 | 2;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { error: "Sesi tidak valid. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const items: BatchExportItem[] = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Daftar dokumen untuk diekspor tidak boleh kosong." },
        { status: 400 }
      );
    }

    const paperParam = body.kertas?.toUpperCase();
    const paperSize: PaperSize = paperParam === "F4" ? "F4" : "A4";

    const fontParam = body.font?.toLowerCase();
    const fontFamily: FontFamily = fontParam === "arial" ? "Arial" : "Times New Roman";

    const exportOptions: ExportDocxOptions = {
      paperSize,
      fontFamily,
    };

    const zip = new JSZip();
    let processedCount = 0;

    for (const item of items) {
      try {
        const jenis = item.jenis.toLowerCase();

        if (jenis === "atp") {
          const res = await getAtpPreviewDataAction(item.id);
          if (res.success && res.data) {
            const { penugasan } = res.data;
            const taNama = penugasan.tahun_ajaran.nama.replace(/\//g, "-");
            const kelasRomawi = getKelasRomawi(penugasan.tingkat_kelas);
            const filename = sanitizeFilename(
              `ATP_${penugasan.mapel.nama}_${kelasRomawi}_${taNama}.docx`
            );
            const buffer = await buildAtpDocx(res.data, exportOptions);
            zip.file(`ATP/${filename}`, buffer);
            processedCount++;
          }
        } else if (jenis === "prota") {
          const res = await getProtaDetailAction(item.id);
          if (res.success && res.data) {
            const { penugasan } = res.data;
            const taNama = penugasan.tahun_ajaran.nama.replace(/\//g, "-");
            const kelasRomawi = getKelasRomawi(penugasan.tingkat_kelas);
            const filename = sanitizeFilename(
              `PROTA_${penugasan.mapel.nama}_${kelasRomawi}_${taNama}.docx`
            );
            const buffer = await buildProtaDocx(res.data, exportOptions);
            zip.file(`PROTA/${filename}`, buffer);
            processedCount++;
          }
        } else if (jenis === "prosem") {
          const sem: 1 | 2 = item.semester === 2 ? 2 : 1;
          const res = await getProsemDetailAction(item.id, sem);
          if (res.success && res.data) {
            const { penugasan } = res.data;
            const taNama = penugasan.tahun_ajaran.nama.replace(/\//g, "-");
            const kelasRomawi = getKelasRomawi(penugasan.tingkat_kelas);
            const filename = sanitizeFilename(
              `PROSEM_${penugasan.mapel.nama}_${kelasRomawi}_Smt${sem}_${taNama}.docx`
            );
            const buffer = await buildProsemDocx(res.data, sem, exportOptions);
            zip.file(`PROSEM/${filename}`, buffer);
            processedCount++;
          }
        } else if (jenis === "rpp" || jenis === "modul-ajar") {
          const res = await getRppDetailAction(item.id);
          if (res.success && res.data) {
            const { penugasan, rpp } = res.data;
            const taNama = penugasan.tahun_ajaran.nama.replace(/\//g, "-");
            const kelasRomawi = getKelasRomawi(penugasan.tingkat_kelas);
            const materiKompak = (rpp.materi_pokok || "Materi")
              .slice(0, 20)
              .replace(/[^a-zA-Z0-9]/g, "_");
            const filename = sanitizeFilename(
              `RPP_${penugasan.mapel.nama}_${kelasRomawi}_${materiKompak}_${taNama}.docx`
            );
            const buffer = await buildRppDocx(res.data, exportOptions);
            zip.file(`RPP/${filename}`, buffer);
            processedCount++;
          }
        }
      } catch (err) {
        console.error(`Gagal memproses item batch export ${item.jenis} ${item.id}:`, err);
      }
    }

    if (processedCount === 0) {
      return NextResponse.json(
        { error: "Tidak ada dokumen yang berhasil diekspor. Periksa kembali ID dokumen." },
        { status: 400 }
      );
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const nowStr = new Date().toISOString().slice(0, 10);
    const zipFilename = `PERANGKAT_AJAR_KBC_${nowStr}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${zipFilename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server saat ekspor batch.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
