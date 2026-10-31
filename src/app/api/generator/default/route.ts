import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  generateDefaultPerangkatGuruAction,
  generateDefaultPerangkatForPenugasan,
} from "@/lib/generator/default-perangkat";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Izinkan durasi hingga 60 detik untuk operasi berat

export async function POST(req: Request) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ success: false, error: "Sesi tidak valid." }, { status: 401 });
    }

    if (session.role === "guru") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Hanya staf atau admin yang berhak." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { action, guruId, penugasanId, autoSubmit } = body;

    if (action === "penugasan" && penugasanId) {
      const res = await generateDefaultPerangkatForPenugasan(penugasanId, {
        autoSubmit: Boolean(autoSubmit),
      });
      return NextResponse.json(res);
    }

    if (action === "guru" && guruId) {
      const res = await generateDefaultPerangkatGuruAction(guruId, {
        autoSubmit: Boolean(autoSubmit),
      });
      return NextResponse.json(res);
    }

    return NextResponse.json(
      { success: false, error: "Parameter request tidak valid (action, guruId, atau penugasanId)." },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal server.";
    console.error("API /api/generator/default error:", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
