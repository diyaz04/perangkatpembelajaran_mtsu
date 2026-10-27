import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPenugasanTemplate } from "@/lib/export/export-template-penugasan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireRole(["admin"]);

    const { searchParams } = new URL(request.url);
    const taId = searchParams.get("taId");

    const adminClient = createAdminClient();

    // 1. Ambil daftar pengguna & guru terdaftar yang aktif
    const { data: guruRows, error: guruErr } = await adminClient
      .from("profiles")
      .select("id, nama_lengkap, nip, gelar, role, aktif")
      .eq("aktif", true)
      .order("nama_lengkap", { ascending: true });

    if (guruErr) throw guruErr;

    // 2. Ambil daftar mata pelajaran
    const { data: mapelRows, error: mapelErr } = await adminClient
      .from("mapel")
      .select("id, kode, nama")
      .order("kode", { ascending: true });

    if (mapelErr) throw mapelErr;

    // 3. Ambil tahun ajaran terkait (atau aktif)
    let taQuery = adminClient
      .from("tahun_ajaran")
      .select("id, nama, aktif");

    if (taId) {
      taQuery = taQuery.eq("id", taId);
    } else {
      taQuery = taQuery.eq("aktif", true);
    }

    const { data: taRow } = await taQuery.maybeSingle();

    const buffer = await buildPenugasanTemplate({
      guruList: guruRows || [],
      mapelList: mapelRows || [],
      tahunAjaran: taRow || null,
    });

    const taSanitized = taRow?.nama ? taRow.nama.replace(/[/\\?%*:|"<>]/g, "-") : "Aktif";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Template_Import_Penugasan_Guru_${taSanitized}.xlsx"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("Gagal membuat template import penugasan guru:", err);
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return new NextResponse(msg, { status: 500 });
  }
}
