import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { buildPenggunaTemplate } from "@/lib/export/export-template-pengguna";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireRole(["admin"]);

    const buffer = await buildPenggunaTemplate();

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Template_Import_Pengguna_Guru.xlsx"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    console.error("Gagal membuat template import pengguna:", err);
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return new NextResponse(msg, { status: 500 });
  }
}
