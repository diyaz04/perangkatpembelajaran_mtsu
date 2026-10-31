import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAtpPreviewDataAction } from "@/app/(app)/atp/actions";
import { getProtaDetailAction } from "@/app/(app)/prota/actions";
import { getProsemDetailAction } from "@/app/(app)/prosem/actions";
import { getRppDetailAction } from "@/app/(app)/modul-ajar/actions";
import {
  buildAtpDocx,
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
export const maxDuration = 60;

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

interface ProcessExportParams {
  guruId?: string;
  items?: BatchExportItem[];
  kertas?: string;
  font?: string;
  format?: "docx" | "pdf" | "word";
}

async function processZipExport(params: ProcessExportParams) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json(
      { error: "Sesi tidak valid. Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  const paperParam = params.kertas?.toUpperCase();
  const paperSize: PaperSize = paperParam === "F4" ? "F4" : "A4";

  const fontParam = params.font?.toLowerCase();
  const fontFamily: FontFamily = fontParam === "arial" ? "Arial" : "Times New Roman";

  const exportOptions: ExportDocxOptions = {
    paperSize,
    fontFamily,
  };

  const isPdf = params.format?.toLowerCase() === "pdf";

  const adminClient = createAdminClient();
  let itemsToExport: BatchExportItem[] = params.items || [];
  let zipFilename = `PERANGKAT_AJAR_KBC_${isPdf ? "PDF_" : "WORD_"}${new Date().toISOString().slice(0, 10)}.zip`;

  // JIKA EKSPOR PER GURU (DOKUMEN TERVALIDASI)
  if (params.guruId) {
    // 1. Ambil data guru
    const { data: guruProfile, error: gErr } = await adminClient
      .from("profiles")
      .select("id, nama_lengkap, nip")
      .eq("id", params.guruId)
      .single();

    if (gErr || !guruProfile) {
      return NextResponse.json(
        { error: "Data guru tidak ditemukan." },
        { status: 404 }
      );
    }

    // 2. Ambil tahun ajaran aktif
    const { data: taAktif } = await adminClient
      .from("tahun_ajaran")
      .select("id, nama")
      .eq("aktif", true)
      .maybeSingle();

    if (!taAktif) {
      return NextResponse.json(
        { error: "Tahun ajaran aktif belum ditentukan." },
        { status: 400 }
      );
    }

    // 3. Ambil seluruh penugasan guru di tahun ajaran aktif
    const { data: penugasanList, error: pErr } = await adminClient
      .from("penugasan")
      .select("id, tingkat_kelas, rombel, mapel(nama, kode)")
      .eq("guru_id", params.guruId)
      .eq("tahun_ajaran_id", taAktif.id);

    if (pErr || !penugasanList || penugasanList.length === 0) {
      return NextResponse.json(
        {
          error: `Belum ada penugasan mengajar untuk ${guruProfile.nama_lengkap} pada tahun ajaran ${taAktif.nama}.`,
        },
        { status: 400 }
      );
    }

    const penugasanIds = penugasanList.map((p) => p.id);

    // 4. Ambil semua dokumen yang berstatus 'disetujui' (tervalidasi)
    const [atpRes, protaRes, prosemRes, rppRes] = await Promise.all([
      adminClient
        .from("atp")
        .select("id, penugasan_id")
        .in("penugasan_id", penugasanIds)
        .eq("status", "disetujui"),
      adminClient
        .from("prota")
        .select("id, penugasan_id")
        .in("penugasan_id", penugasanIds)
        .eq("status", "disetujui"),
      adminClient
        .from("prosem")
        .select("id, penugasan_id, semester")
        .in("penugasan_id", penugasanIds)
        .eq("status", "disetujui"),
      adminClient
        .from("rpp")
        .select("id, penugasan_id, materi_pokok")
        .in("penugasan_id", penugasanIds)
        .eq("status", "disetujui"),
    ]);

    const collectedItems: BatchExportItem[] = [];

    (atpRes.data || []).forEach((row) => {
      collectedItems.push({ jenis: "atp", id: row.penugasan_id });
    });

    (protaRes.data || []).forEach((row) => {
      collectedItems.push({ jenis: "prota", id: row.penugasan_id });
    });

    (prosemRes.data || []).forEach((row) => {
      collectedItems.push({
        jenis: "prosem",
        id: row.penugasan_id,
        semester: row.semester as 1 | 2,
      });
    });

    (rppRes.data || []).forEach((row) => {
      collectedItems.push({ jenis: "rpp", id: row.id });
    });

    if (collectedItems.length === 0) {
      return NextResponse.json(
        {
          error: `Guru ${guruProfile.nama_lengkap} belum memiliki berkas yang disetujui (tervalidasi) untuk diekspor. Silakan telaah dan validasi berkas ajuan guru terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    itemsToExport = collectedItems;

    const cleanGuru = sanitizeFilename(guruProfile.nama_lengkap);
    const cleanTa = sanitizeFilename(taAktif.nama.replace(/\//g, "-"));
    zipFilename = `DOKUMEN_TERVALIDASI_${isPdf ? "PDF_" : "WORD_"}${cleanGuru}_${cleanTa}.zip`;
  }

  if (!Array.isArray(itemsToExport) || itemsToExport.length === 0) {
    return NextResponse.json(
      { error: "Daftar dokumen untuk diekspor tidak boleh kosong." },
      { status: 400 }
    );
  }

  const zip = new JSZip();
  const existingZipPaths = new Set<string>();

  function getUniqueZipPath(folder: string, filename: string): string {
    let fullPath = `${folder}/${filename}`;
    if (!existingZipPaths.has(fullPath)) {
      existingZipPaths.add(fullPath);
      return fullPath;
    }
    const dotIdx = filename.lastIndexOf(".");
    const baseName = dotIdx !== -1 ? filename.slice(0, dotIdx) : filename;
    const ext = dotIdx !== -1 ? filename.slice(dotIdx) : "";
    let counter = 2;
    while (existingZipPaths.has(`${folder}/${baseName}_${counter}${ext}`)) {
      counter++;
    }
    fullPath = `${folder}/${baseName}_${counter}${ext}`;
    existingZipPaths.add(fullPath);
    return fullPath;
  }

  let processedCount = 0;
  const itemErrors: string[] = [];

  for (const item of itemsToExport) {
    try {
      const jenis = item.jenis.toLowerCase();

      if (jenis === "atp") {
        const res = await getAtpPreviewDataAction(item.id);
        if (res.success && res.data) {
          const { penugasan } = res.data;
          const taNama = penugasan.tahun_ajaran.nama.replace(/\//g, "-");
          const kelasRomawi = getKelasRomawi(penugasan.tingkat_kelas);

          if (isPdf) {
            const filename = sanitizeFilename(
              `ATP_${penugasan.mapel.nama}_${kelasRomawi}_${taNama}.pdf`
            );
            const html = generateAtpHtml(res.data);
            const buffer = await generatePdfBufferFromHtml(html, { landscape: true, paperSize });
            const zipPath = getUniqueZipPath("ATP", filename);
            zip.file(zipPath, buffer);
          } else {
            const filename = sanitizeFilename(
              `ATP_${penugasan.mapel.nama}_${kelasRomawi}_${taNama}.docx`
            );
            const buffer = await buildAtpDocx(res.data, exportOptions);
            const zipPath = getUniqueZipPath("ATP", filename);
            zip.file(zipPath, buffer);
          }
          processedCount++;
        } else {
          itemErrors.push(`ATP (${res.error || "Data tidak ditemukan"})`);
        }
      } else if (jenis === "prota") {
        const res = await getProtaDetailAction(item.id);
        if (res.success && res.data) {
          const { penugasan } = res.data;
          const taNama = penugasan.tahun_ajaran.nama.replace(/\//g, "-");
          const kelasRomawi = getKelasRomawi(penugasan.tingkat_kelas);

          if (isPdf) {
            const filename = sanitizeFilename(
              `PROTA_${penugasan.mapel.nama}_${kelasRomawi}_${taNama}.pdf`
            );
            const html = generateProtaHtml(res.data);
            const buffer = await generatePdfBufferFromHtml(html, { landscape: false, paperSize });
            const zipPath = getUniqueZipPath("PROTA", filename);
            zip.file(zipPath, buffer);
          } else {
            const filename = sanitizeFilename(
              `PROTA_${penugasan.mapel.nama}_${kelasRomawi}_${taNama}.docx`
            );
            const buffer = await buildProtaDocx(res.data, exportOptions);
            const zipPath = getUniqueZipPath("PROTA", filename);
            zip.file(zipPath, buffer);
          }
          processedCount++;
        } else {
          itemErrors.push(`PROTA (${res.error || "Data tidak ditemukan"})`);
        }
      } else if (jenis === "prosem") {
        const sem: 1 | 2 = item.semester === 2 ? 2 : 1;
        const res = await getProsemDetailAction(item.id, sem);
        if (res.success && res.data) {
          const { penugasan } = res.data;
          const taNama = penugasan.tahun_ajaran.nama.replace(/\//g, "-");
          const kelasRomawi = getKelasRomawi(penugasan.tingkat_kelas);

          if (isPdf) {
            const filename = sanitizeFilename(
              `PROSEM_${penugasan.mapel.nama}_${kelasRomawi}_Smt${sem}_${taNama}.pdf`
            );
            const html = generateProsemHtml(res.data, sem);
            const buffer = await generatePdfBufferFromHtml(html, { landscape: true, paperSize });
            const zipPath = getUniqueZipPath("PROSEM", filename);
            zip.file(zipPath, buffer);
          } else {
            const filename = sanitizeFilename(
              `PROSEM_${penugasan.mapel.nama}_${kelasRomawi}_Smt${sem}_${taNama}.docx`
            );
            const buffer = await buildProsemDocx(res.data, sem, exportOptions);
            const zipPath = getUniqueZipPath("PROSEM", filename);
            zip.file(zipPath, buffer);
          }
          processedCount++;
        } else {
          itemErrors.push(`PROSEM Smt${sem} (${res.error || "Data tidak ditemukan"})`);
        }
      } else if (jenis === "rpp" || jenis === "modul-ajar") {
        const res = await getRppDetailAction(item.id);
        if (res.success && res.data) {
          const { penugasan, rpp } = res.data;
          const taNama = penugasan.tahun_ajaran.nama.replace(/\//g, "-");
          const kelasRomawi = getKelasRomawi(penugasan.tingkat_kelas);
          const materiKompak = (rpp.materi_pokok || "Materi")
            .slice(0, 30)
            .replace(/[^a-zA-Z0-9]/g, "_");

          if (isPdf) {
            const filename = sanitizeFilename(
              `RPP_${penugasan.mapel.nama}_${kelasRomawi}_${materiKompak}_${taNama}.pdf`
            );
            const html = generateRppHtml(res.data);
            const buffer = await generatePdfBufferFromHtml(html, { landscape: false, paperSize });
            const zipPath = getUniqueZipPath("RPP_MODUL_AJAR", filename);
            zip.file(zipPath, buffer);
          } else {
            const filename = sanitizeFilename(
              `RPP_${penugasan.mapel.nama}_${kelasRomawi}_${materiKompak}_${taNama}.docx`
            );
            const buffer = await buildRppDocx(res.data, exportOptions);
            const zipPath = getUniqueZipPath("RPP_MODUL_AJAR", filename);
            zip.file(zipPath, buffer);
          }
          processedCount++;
        } else {
          itemErrors.push(`RPP (${res.error || "Data tidak ditemukan"})`);
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error(`Gagal memproses item batch export ${item.jenis} ${item.id}:`, err);
      itemErrors.push(`${item.jenis.toUpperCase()}: ${errMsg}`);
    }
  }

  if (processedCount === 0) {
    const detail = itemErrors.length > 0 ? ` (${itemErrors.slice(0, 3).join("; ")})` : "";
    return NextResponse.json(
      { error: `Tidak ada dokumen yang berhasil diekspor. Periksa kembali status dokumen.${detail}` },
      { status: 400 }
    );
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(zipBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${zipFilename}"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    return await processZipExport(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server saat ekspor batch.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guruId = searchParams.get("guruId") || undefined;
    const kertas = searchParams.get("kertas") || undefined;
    const font = searchParams.get("font") || undefined;
    const format = (searchParams.get("format") as "docx" | "pdf" | "word") || undefined;

    return await processZipExport({ guruId, kertas, font, format });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan server saat ekspor batch.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
