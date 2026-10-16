"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import type { DocStatus, DokumenTipe } from "@/types/database";

export interface PenugasanProgresGuru {
  penugasanId: string;
  mapelNama: string;
  mapelKode: string;
  tingkatKelas: number;
  rombel: string;
  atp: { id: string | null; status: DocStatus | "belum" };
  prota: { id: string | null; status: DocStatus | "belum" };
  prosem1: { id: string | null; status: DocStatus | "belum" };
  prosem2: { id: string | null; status: DocStatus | "belum" };
  rppCount: number;
  rppTarget: number;
  rppDisetujui: number;
  persentaseSelesai: number;
}

export interface DokumenRevisiItem {
  id: string;
  dokumen_tipe: DokumenTipe;
  judul: string;
  mapelNama: string;
  kelas: number;
  catatanValidator: string;
  updatedAt: string;
  editUrl: string;
}

export interface DrafTerakhirItem {
  id: string;
  dokumen_tipe: DokumenTipe;
  judul: string;
  mapelNama: string;
  kelas: number;
  status: DocStatus;
  updatedAt: string;
  editUrl: string;
}

export interface DashboardGuruData {
  penugasanList: PenugasanProgresGuru[];
  dokumenRevisi: DokumenRevisiItem[];
  drafTerakhir: DrafTerakhirItem | null;
  totalPenugasan: number;
}

export async function getDashboardGuruDataAction(): Promise<{
  success: boolean;
  data: DashboardGuruData;
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return {
        success: false,
        data: { penugasanList: [], dokumenRevisi: [], drafTerakhir: null, totalPenugasan: 0 },
        error: "Sesi tidak valid.",
      };
    }

    const adminClient = createAdminClient();

    // 1. Tahun ajaran aktif
    const { data: taAktif } = await adminClient
      .from("tahun_ajaran")
      .select("id, nama")
      .eq("aktif", true)
      .maybeSingle();

    if (!taAktif) {
      return {
        success: true,
        data: { penugasanList: [], dokumenRevisi: [], drafTerakhir: null, totalPenugasan: 0 },
      };
    }

    // 2. Ambil penugasan guru ini di tahun ajaran aktif
    const { data: penugasanRows } = await adminClient
      .from("penugasan")
      .select(`
        id,
        tingkat_kelas,
        rombel,
        guru_id,
        mapel_id,
        mapel ( id, nama, kode )
      `)
      .eq("guru_id", session.user.id)
      .eq("tahun_ajaran_id", taAktif.id);

    if (!penugasanRows || penugasanRows.length === 0) {
      return {
        success: true,
        data: { penugasanList: [], dokumenRevisi: [], drafTerakhir: null, totalPenugasan: 0 },
      };
    }

    const penugasanIds = penugasanRows.map((p) => p.id);

    // 3. Query dokumen penugasan guru secara paralel
    const [atpRes, protaRes, prosemRes, rppRes, tpRes] = await Promise.all([
      adminClient.from("atp").select("id, penugasan_id, status, catatan_validator, updated_at").in("penugasan_id", penugasanIds),
      adminClient.from("prota").select("id, penugasan_id, status, catatan_validator, updated_at").in("penugasan_id", penugasanIds),
      adminClient.from("prosem").select("id, penugasan_id, semester, status, catatan_validator, updated_at").in("penugasan_id", penugasanIds),
      adminClient.from("rpp").select("id, penugasan_id, materi_pokok, status, catatan_validator, updated_at").in("penugasan_id", penugasanIds),
      adminClient.from("tujuan_pembelajaran").select("id, analisis_cp!inner(penugasan_id)").in("analisis_cp.penugasan_id", penugasanIds),
    ]);

    const atpMap = new Map((atpRes.data || []).map((a) => [a.penugasan_id, a]));
    const protaMap = new Map((protaRes.data || []).map((p) => [p.penugasan_id, p]));

    const prosem1Map = new Map();
    const prosem2Map = new Map();
    (prosemRes.data || []).forEach((ps) => {
      if (ps.semester === 1) prosem1Map.set(ps.penugasan_id, ps);
      if (ps.semester === 2) prosem2Map.set(ps.penugasan_id, ps);
    });

    const rppMap = new Map<string, Array<{ id: string; materi_pokok: string; status: string; catatan_validator: string | null; updated_at: string }>>();
    (rppRes.data || []).forEach((rp) => {
      const cur = rppMap.get(rp.penugasan_id) || [];
      cur.push(rp);
      rppMap.set(rp.penugasan_id, cur);
    });

    const tpCountMap = new Map<string, number>();
    (tpRes.data || []).forEach((item) => {
      const pid = (item.analisis_cp as { penugasan_id?: string })?.penugasan_id;
      if (pid) {
        tpCountMap.set(pid, (tpCountMap.get(pid) || 0) + 1);
      }
    });

    const dokumenRevisiList: DokumenRevisiItem[] = [];
    const allDrafItems: DrafTerakhirItem[] = [];

    // Periksa penugasan & susun progres
    const penugasanList: PenugasanProgresGuru[] = penugasanRows.map((p) => {
      const m = Array.isArray(p.mapel) ? p.mapel[0] : p.mapel;
      const mapelNama = m?.nama || "Mapel";
      const mapelKode = m?.kode || "-";

      const atp = atpMap.get(p.id);
      const prota = protaMap.get(p.id);
      const prosem1 = prosem1Map.get(p.id);
      const prosem2 = prosem2Map.get(p.id);
      const rpps = rppMap.get(p.id) || [];
      const tpTarget = tpCountMap.get(p.id) || 4;

      // Cek dokumen revisi
      if (atp?.status === "revisi") {
        dokumenRevisiList.push({
          id: atp.id,
          dokumen_tipe: "atp",
          judul: `ATP: ${mapelNama} Kelas ${p.tingkat_kelas}`,
          mapelNama,
          kelas: p.tingkat_kelas,
          catatanValidator: atp.catatan_validator || "Perlu revisi sesuai catatan validator.",
          updatedAt: atp.updated_at,
          editUrl: `/atp/${p.id}`,
        });
      }
      if (prota?.status === "revisi") {
        dokumenRevisiList.push({
          id: prota.id,
          dokumen_tipe: "prota",
          judul: `Prota: ${mapelNama} Kelas ${p.tingkat_kelas}`,
          mapelNama,
          kelas: p.tingkat_kelas,
          catatanValidator: prota.catatan_validator || "Perlu revisi sesuai catatan validator.",
          updatedAt: prota.updated_at,
          editUrl: `/prota/${p.id}`,
        });
      }
      if (prosem1?.status === "revisi") {
        dokumenRevisiList.push({
          id: prosem1.id,
          dokumen_tipe: "prosem",
          judul: `Prosem Smt 1: ${mapelNama} Kelas ${p.tingkat_kelas}`,
          mapelNama,
          kelas: p.tingkat_kelas,
          catatanValidator: prosem1.catatan_validator || "Perlu revisi sesuai catatan validator.",
          updatedAt: prosem1.updated_at,
          editUrl: `/prosem/${p.id}?semester=1`,
        });
      }
      if (prosem2?.status === "revisi") {
        dokumenRevisiList.push({
          id: prosem2.id,
          dokumen_tipe: "prosem",
          judul: `Prosem Smt 2: ${mapelNama} Kelas ${p.tingkat_kelas}`,
          mapelNama,
          kelas: p.tingkat_kelas,
          catatanValidator: prosem2.catatan_validator || "Perlu revisi sesuai catatan validator.",
          updatedAt: prosem2.updated_at,
          editUrl: `/prosem/${p.id}?semester=2`,
        });
      }
      rpps.forEach((r) => {
        if (r.status === "revisi") {
          dokumenRevisiList.push({
            id: r.id,
            dokumen_tipe: "rpp",
            judul: `RPP: ${r.materi_pokok}`,
            mapelNama,
            kelas: p.tingkat_kelas,
            catatanValidator: r.catatan_validator || "Perlu revisi sesuai catatan validator.",
            updatedAt: r.updated_at,
            editUrl: `/modul-ajar/${r.id}`,
          });
        }
      });

      // Kumpulkan kandidat draf terakhir
      if (atp && (atp.status === "draf" || atp.status === "revisi")) {
        allDrafItems.push({
          id: atp.id,
          dokumen_tipe: "atp",
          judul: `Alur Tujuan Pembelajaran (${mapelNama} Kelas ${p.tingkat_kelas})`,
          mapelNama,
          kelas: p.tingkat_kelas,
          status: atp.status as DocStatus,
          updatedAt: atp.updated_at,
          editUrl: `/atp/${p.id}`,
        });
      }
      if (prota && (prota.status === "draf" || prota.status === "revisi")) {
        allDrafItems.push({
          id: prota.id,
          dokumen_tipe: "prota",
          judul: `Program Tahunan (${mapelNama} Kelas ${p.tingkat_kelas})`,
          mapelNama,
          kelas: p.tingkat_kelas,
          status: prota.status as DocStatus,
          updatedAt: prota.updated_at,
          editUrl: `/prota/${p.id}`,
        });
      }
      if (prosem1 && (prosem1.status === "draf" || prosem1.status === "revisi")) {
        allDrafItems.push({
          id: prosem1.id,
          dokumen_tipe: "prosem",
          judul: `Program Semester 1 (${mapelNama} Kelas ${p.tingkat_kelas})`,
          mapelNama,
          kelas: p.tingkat_kelas,
          status: prosem1.status as DocStatus,
          updatedAt: prosem1.updated_at,
          editUrl: `/prosem/${p.id}?semester=1`,
        });
      }
      rpps.forEach((r) => {
        if (r.status === "draf" || r.status === "revisi") {
          allDrafItems.push({
            id: r.id,
            dokumen_tipe: "rpp",
            judul: `RPP: ${r.materi_pokok}`,
            mapelNama,
            kelas: p.tingkat_kelas,
            status: r.status as DocStatus,
            updatedAt: r.updated_at,
            editUrl: `/modul-ajar/${r.id}`,
          });
        }
      });

      // Hitung persentase progres selesai
      let skor = 0;
      if (atp?.status === "disetujui") skor += 20;
      else if (atp?.status === "diajukan") skor += 10;

      if (prota?.status === "disetujui") skor += 20;
      else if (prota?.status === "diajukan") skor += 10;

      if (prosem1?.status === "disetujui") skor += 15;
      else if (prosem1?.status === "diajukan") skor += 8;

      if (prosem2?.status === "disetujui") skor += 15;
      else if (prosem2?.status === "diajukan") skor += 8;

      const rppDisetujui = rpps.filter((r) => r.status === "disetujui").length;
      const rppRatio = tpTarget > 0 ? Math.min(1, rpps.length / tpTarget) : 0;
      skor += Math.round(rppRatio * 30);

      return {
        penugasanId: p.id,
        mapelNama,
        mapelKode,
        tingkatKelas: p.tingkat_kelas,
        rombel: p.rombel,
        atp: { id: atp?.id || null, status: (atp?.status as DocStatus) || "belum" },
        prota: { id: prota?.id || null, status: (prota?.status as DocStatus) || "belum" },
        prosem1: { id: prosem1?.id || null, status: (prosem1?.status as DocStatus) || "belum" },
        prosem2: { id: prosem2?.id || null, status: (prosem2?.status as DocStatus) || "belum" },
        rppCount: rpps.length,
        rppTarget: tpTarget,
        rppDisetujui,
        persentaseSelesai: Math.min(100, skor),
      };
    });

    // Urutkan kandidat draf terakhir berdasarkan updated_at paling baru
    allDrafItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const drafTerakhir = allDrafItems.length > 0 ? allDrafItems[0] : null;

    return {
      success: true,
      data: {
        penugasanList,
        dokumenRevisi: dokumenRevisiList,
        drafTerakhir,
        totalPenugasan: penugasanList.length,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return {
      success: false,
      data: { penugasanList: [], dokumenRevisi: [], drafTerakhir: null, totalPenugasan: 0 },
      error: msg,
    };
  }
}
