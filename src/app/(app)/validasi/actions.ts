"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";

export interface BatchExportItemData {
  penugasanId: string;
  guruId: string;
  guruNama: string;
  guruNip: string | null;
  mapelNama: string;
  mapelKode: string;
  tingkatKelas: number;
  rombel: string;
  tahunAjaran: string;
  atp: { id: string | null; status: string } | null;
  prota: { id: string | null; status: string } | null;
  prosem1: { id: string | null; status: string } | null;
  prosem2: { id: string | null; status: string } | null;
  rppList: Array<{ id: string; materi_pokok: string; status: string }>;
}

export async function getBatchExportDataAction(): Promise<{
  success: boolean;
  data: BatchExportItemData[];
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, data: [], error: "Sesi tidak valid." };
    }

    const supabase = await createClient();

    // 1. Ambil tahun ajaran aktif
    const { data: taAktif } = await supabase
      .from("tahun_ajaran")
      .select("id, nama")
      .eq("aktif", true)
      .limit(1)
      .maybeSingle();

    if (!taAktif) {
      return { success: false, data: [], error: "Tahun ajaran aktif belum ditentukan." };
    }

    // 2. Ambil penugasan
    const { data: penugasanList, error: pErr } = await supabase
      .from("penugasan")
      .select(`
        id,
        tingkat_kelas,
        rombel,
        guru_id,
        mapel_id,
        mapel ( id, nama, kode ),
        profiles ( id, nama_lengkap, nip, gelar ),
        tahun_ajaran ( id, nama )
      `)
      .eq("tahun_ajaran_id", taAktif.id);

    if (pErr || !penugasanList) {
      return { success: false, data: [], error: pErr?.message || "Gagal memuat penugasan." };
    }

    const penugasanIds = penugasanList.map((p) => p.id);
    if (penugasanIds.length === 0) {
      return { success: true, data: [] };
    }

    // 3. Ambil data ATP, Prota, Prosem, RPP secara paralel
    const [atpRes, protaRes, prosemRes, rppRes] = await Promise.all([
      supabase.from("atp").select("id, penugasan_id, status").in("penugasan_id", penugasanIds),
      supabase.from("prota").select("id, penugasan_id, status").in("penugasan_id", penugasanIds),
      supabase.from("prosem").select("id, penugasan_id, semester, status").in("penugasan_id", penugasanIds),
      supabase.from("rpp").select("id, penugasan_id, materi_pokok, status").in("penugasan_id", penugasanIds),
    ]);

    // Map dokumen
    const atpMap = new Map((atpRes.data || []).map((a) => [a.penugasan_id, a]));
    const protaMap = new Map((protaRes.data || []).map((p) => [p.penugasan_id, p]));

    const prosem1Map = new Map();
    const prosem2Map = new Map();
    (prosemRes.data || []).forEach((ps) => {
      if (ps.semester === 1) prosem1Map.set(ps.penugasan_id, ps);
      if (ps.semester === 2) prosem2Map.set(ps.penugasan_id, ps);
    });

    const rppMap = new Map<string, Array<{ id: string; materi_pokok: string; status: string }>>();
    (rppRes.data || []).forEach((rp) => {
      const cur = rppMap.get(rp.penugasan_id) || [];
      cur.push(rp);
      rppMap.set(rp.penugasan_id, cur);
    });

    const result: BatchExportItemData[] = penugasanList.map((p) => {
      const mapelData = Array.isArray(p.mapel) ? p.mapel[0] : p.mapel;
      const guruData = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      const taData = Array.isArray(p.tahun_ajaran) ? p.tahun_ajaran[0] : p.tahun_ajaran;

      return {
        penugasanId: p.id,
        guruId: p.guru_id,
        guruNama: guruData?.nama_lengkap || "Guru",
        guruNip: guruData?.nip || null,
        mapelNama: mapelData?.nama || "Mata Pelajaran",
        mapelKode: mapelData?.kode || "",
        tingkatKelas: p.tingkat_kelas,
        rombel: p.rombel || "",
        tahunAjaran: taData?.nama || taAktif.nama,
        atp: atpMap.get(p.id) || null,
        prota: protaMap.get(p.id) || null,
        prosem1: prosem1Map.get(p.id) || null,
        prosem2: prosem2Map.get(p.id) || null,
        rppList: rppMap.get(p.id) || [],
      };
    });

    return { success: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal";
    return { success: false, data: [], error: message };
  }
}
