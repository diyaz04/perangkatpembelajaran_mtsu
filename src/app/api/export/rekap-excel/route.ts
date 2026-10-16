import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRekapKelengkapanAction } from "@/lib/validasi/actions";
import { buildRekapExcel } from "@/lib/export/export-rekap-excel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (session.role === "guru") {
      return new NextResponse("Forbidden: Hanya Kepala Madrasah, Waka Kurikulum, atau Admin yang dapat mengunduh rekap.", {
        status: 403,
      });
    }

    const adminClient = createAdminClient();

    // Ambil info madrasah & tahun ajaran aktif
    const [{ data: madrasah }, { data: taAktif }] = await Promise.all([
      adminClient.from("madrasah").select("nama").limit(1).maybeSingle(),
      adminClient.from("tahun_ajaran").select("nama").eq("aktif", true).maybeSingle(),
    ]);

    const madrasahNama = madrasah?.nama || "MTs KH A Wahab Muhsin";
    const taNama = taAktif?.nama || "2026/2027";

    const rekapRes = await getRekapKelengkapanAction();
    if (!rekapRes.success) {
      return new NextResponse(rekapRes.error || "Gagal memproses rekap data.", { status: 500 });
    }

    const buffer = await buildRekapExcel({
      madrasahNama,
      tahunAjaranNama: taNama,
      data: rekapRes.data,
    });

    const safeFilename = `Rekap_Supervisi_EDM_${madrasahNama.replace(/[^a-zA-Z0-9]/g, "_")}_TA_${taNama.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("Gagal ekspor rekap excel:", err);
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return new NextResponse(msg, { status: 500 });
  }
}
