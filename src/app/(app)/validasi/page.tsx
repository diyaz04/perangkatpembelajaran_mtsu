import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBatchExportDataAction } from "./actions";
import { getAntrianValidasiAction } from "@/lib/validasi/actions";
import { BatchExportClient } from "./batch-export-client";
import { AntrianValidasiClient } from "./antrian-validasi-client";
import { FileCheck, DownloadCloud } from "lucide-react";

export const metadata = {
  title: "Validasi & Ekspor Dokumen Pembelajaran | KBC",
  description: "Pusat persetujuan telaah instrumen KBC dan ekspor massal dokumen perangkat ajar madrasah",
};

export const dynamic = "force-dynamic";

export default async function ValidasiPage() {
  // Server-side guard: Guru dilarang mengakses halaman validasi (hanya Kepala, Waka, Admin)
  await requireRole(["admin", "kepala", "waka_kurikulum"]);

  const adminClient = createAdminClient();

  // Load paralel: antrian validasi, batch export items, master mapel, master guru
  const [antrianRes, batchRes, mapelRes, guruRes] = await Promise.all([
    getAntrianValidasiAction(),
    getBatchExportDataAction(),
    adminClient.from("mapel").select("id, nama, kode").order("nama"),
    adminClient.from("profiles").select("id, nama_lengkap").order("nama_lengkap"),
  ]);

  const antrianItems = antrianRes.success ? antrianRes.data : [];
  const batchItems = batchRes.success ? batchRes.data : [];
  const mapelList = mapelRes.data || [];
  const guruList = guruRes.data || [];

  const totalAntrian = antrianItems.filter((i) => i.status === "diajukan").length;

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Validasi & Penjaminan Mutu Dokumen"
        description="Pusat telaah instrumen Kurikulum Berbasis Cinta (KBC) dan ekspor dokumen resmi madrasah"
        badge={
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Khusus Kepala / Waka
          </Badge>
        }
      />

      <Tabs defaultValue="antrian" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 border border-slate-200">
          <TabsTrigger value="antrian" className="text-xs sm:text-sm gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Antrian Validasi</span>
            {totalAntrian > 0 && (
              <Badge className="bg-blue-600 text-white hover:bg-blue-600 text-[10px] px-1.5 py-0">
                {totalAntrian}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="ekspor" className="text-xs sm:text-sm gap-2">
            <DownloadCloud className="w-4 h-4 text-slate-600" />
            <span>Ekspor Massal (.ZIP)</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="antrian" className="space-y-6">
          <AntrianValidasiClient
            initialItems={antrianItems}
            mapelList={mapelList}
            guruList={guruList}
          />
        </TabsContent>

        <TabsContent value="ekspor" className="space-y-6">
          <BatchExportClient items={batchItems} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
