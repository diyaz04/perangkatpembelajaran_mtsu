import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import type { DokumenTipe } from "@/types/database";
import { getTelaahDataAction } from "@/app/(app)/validasi/telaah-actions";
import { TelaahClient } from "./telaah-client";

export const metadata = {
  title: "Telaah Dokumen Perangkat Ajar | KBC",
  description: "Penelaahan instrumen Kemenag dan Kurikulum Berbasis Cinta (KBC)",
};

export const dynamic = "force-dynamic";

interface TelaahPageProps {
  params: Promise<{
    jenis: string;
    id: string;
  }>;
}

export default async function TelaahPage({ params }: TelaahPageProps) {
  await requireRole(["admin", "kepala", "waka_kurikulum"]);

  const { jenis, id } = await params;
  const validJenis = ["atp", "prota", "prosem", "rpp"];

  if (!validJenis.includes(jenis)) {
    notFound();
  }

  const res = await getTelaahDataAction(jenis as DokumenTipe, id);
  if (!res.success || !res.data) {
    notFound();
  }

  return <TelaahClient data={res.data} />;
}
