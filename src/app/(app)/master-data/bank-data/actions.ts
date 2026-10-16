"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import {
  getAllMapelBankData,
  getMapelBankData,
  getBankDataManifest,
  getBankDataRegulasi,
  getBankDataStruktur,
  getBankDataPancaCinta,
  getBankDataDpl,
  getBankDataMateriKbc,
  getBankDataKko,
} from "@/lib/bank-data/service";
import type { Database } from "@/types/database";

type MapelRow = Database["public"]["Tables"]["mapel"]["Row"];
type CpRow = Database["public"]["Tables"]["capaian_pembelajaran"]["Row"];
type MateriRow = Database["public"]["Tables"]["materi_pelajaran"]["Row"];

export type StatusRiset = "LENGKAP" | "SEBAGIAN" | "TIDAK_DITEMUKAN" | "SEKUNDER_PERLU_CEK";

export interface BankDataMapelSummary {
  slug: string;
  nama: string;
  kelompok: string;
  jp_per_minggu: { [tingkat: string]: number };
  status_riset: StatusRiset;
  sumber_cp: {
    regulasi_kode: string;
    nama: string;
    halaman: string | null;
    status: string;
    catatan?: string;
  };
  cp_count: number;
  materi_count: {
    kls7: number;
    kls8: number;
    kls9: number;
    total: number;
  };
  status_verifikasi: "terverifikasi" | "belum";
  verified_by_nama: string | null;
  verified_at: string | null;
  db_mapel_id?: string;
}

export interface BankDataOverview {
  manifest: {
    versi: string;
    nama: string;
    fase: string;
    tahun_ajaran: string;
    terakhir_diperbarui: string;
  };
  summary: {
    total_mapel: number;
    total_cp: number;
    total_materi: number;
    terverifikasi_count: number;
    belum_verifikasi_count: number;
  };
  mapelList: BankDataMapelSummary[];
}

export async function getBankDataOverviewAction(): Promise<{ success: boolean; data?: BankDataOverview; error?: string }> {
  try {
    const supabase = await createClient();
    const manifest = getBankDataManifest();
    const struktur = getBankDataStruktur();
    const allMapel = getAllMapelBankData();

    // Query DB mapel jika ada
    let dbMapelList: MapelRow[] = [];
    try {
      const res = await supabase.from("mapel").select("*");
      dbMapelList = res.data || [];
    } catch {
      // ignore
    }

    // Query profiles untuk verifier
    const verifierIds = dbMapelList
      .map((m) => m.verified_by)
      .filter((id): id is string => Boolean(id));
    const profilesMap = new Map<string, string>();
    if (verifierIds.length > 0) {
      try {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nama_lengkap")
          .in("id", verifierIds);
        for (const p of profiles || []) {
          profilesMap.set(p.id, p.nama_lengkap);
        }
      } catch {
        // ignore
      }
    }

    const mapelSummaries: BankDataMapelSummary[] = [];
    let totalCp = 0;
    let totalMateri = 0;
    let terverifikasiCount = 0;

    for (const st of struktur) {
      const mapelData = allMapel.find((m) => m.slug === st.mapel_slug);
      const matchedDb = dbMapelList.find(
        (m) =>
          m.slug === st.mapel_slug ||
          m.nama.toLowerCase().includes(st.mapel_slug.replace(/-/g, " ")) ||
          st.mapel_nama.toLowerCase().includes(m.nama.toLowerCase())
      );

      const cpCount = mapelData?.elemen?.length || 0;
      const kls7 = mapelData?.materi?.filter((m) => m.tingkat === 7).length || 0;
      const kls8 = mapelData?.materi?.filter((m) => m.tingkat === 8).length || 0;
      const kls9 = mapelData?.materi?.filter((m) => m.tingkat === 9).length || 0;
      const totalMat = kls7 + kls8 + kls9;

      totalCp += cpCount;
      totalMateri += totalMat;

      // Status riset
      let statusRiset: StatusRiset = "LENGKAP";
      const s = mapelData?.status;
      if (s === "TIDAK_DITEMUKAN") {
        statusRiset = "TIDAK_DITEMUKAN";
      } else if (s === "SEKUNDER_PERLU_CEK") {
        statusRiset = "SEKUNDER_PERLU_CEK";
      } else if (s === "SEBAGIAN") {
        statusRiset = "SEBAGIAN";
      }

      // Status verifikasi: default terverifikasi jika dari bank data resmi Kemenag/Kemendikdasmen
      // Dapat diubah manual oleh waka_kurikulum / admin
      const isVerified = matchedDb?.status_verifikasi === "terverifikasi" || (!matchedDb?.status_verifikasi && statusRiset === "LENGKAP");
      if (isVerified) terverifikasiCount++;

      mapelSummaries.push({
        slug: st.mapel_slug,
        nama: st.mapel_nama,
        kelompok: st.kelompok,
        jp_per_minggu: st.jp_per_minggu,
        status_riset: statusRiset,
        sumber_cp: {
          regulasi_kode: mapelData?.sumber_cp?.regulasi_kode || "KMA 1503/2025",
          nama: mapelData?.sumber_cp?.regulasi_kode || "Regulasi Kurikulum MTs",
          halaman: mapelData?.sumber_cp?.halaman || null,
          status: mapelData?.status || statusRiset,
          catatan: mapelData?.catatan,
        },
        cp_count: cpCount,
        materi_count: {
          kls7,
          kls8,
          kls9,
          total: totalMat,
        },
        status_verifikasi: isVerified ? "terverifikasi" : "belum",
        verified_by_nama: matchedDb?.verified_by ? profilesMap.get(matchedDb.verified_by) || "Waka Kurikulum" : (isVerified ? "Sistem (Bank Data)" : null),
        verified_at: matchedDb?.verified_at || (isVerified ? manifest.tanggal_kumpul : null),
        db_mapel_id: matchedDb?.id,
      });
    }

    return {
      success: true,
      data: {
        manifest: {
          versi: manifest.versi,
          nama: `Bank Data Kurikulum Fase D (${manifest.jenjang})`,
          fase: manifest.fase,
          tahun_ajaran: manifest.tahun_ajaran,
          terakhir_diperbarui: manifest.tanggal_kumpul,
        },
        summary: {
          total_mapel: struktur.length,
          total_cp: totalCp,
          total_materi: totalMateri,
          terverifikasi_count: terverifikasiCount,
          belum_verifikasi_count: struktur.length - terverifikasiCount,
        },
        mapelList: mapelSummaries,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengambil data ringkasan bank data" };
  }
}

export async function getBankDataMapelDetailAction(slug: string) {
  try {
    const supabase = await createClient();
    const mapel = getMapelBankData(slug);
    if (!mapel) {
      return { success: false, error: `Mapel dengan slug '${slug}' tidak ditemukan` };
    }

    // Ambil DB CP & DB Materi jika ada
    let dbCps: CpRow[] = [];
    let dbMateri: MateriRow[] = [];

    // Cari DB Mapel
    const { data: dbMapel } = await supabase
      .from("mapel")
      .select("id, nama, status_verifikasi, verified_by, verified_at")
      .or(`slug.eq.${slug},nama.ilike.%${mapel.mapel}%`)
      .maybeSingle();

    if (dbMapel) {
      try {
        const cpRes = await supabase
          .from("capaian_pembelajaran")
          .select("*")
          .eq("mapel_id", dbMapel.id);
        dbCps = (cpRes.data as CpRow[]) || [];
      } catch {
        // ignore
      }

      try {
        const matRes = await supabase
          .from("materi_pelajaran")
          .select("*")
          .eq("mapel_id", dbMapel.id)
          .order("tingkat")
          .order("semester")
          .order("urutan");
        dbMateri = (matRes.data as MateriRow[]) || [];
      } catch {
        // ignore
      }
    }

    return {
      success: true,
      data: {
        bankData: mapel,
        dbMapel: dbMapel || null,
        dbCps,
        dbMateri,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengambil detail mapel bank data" };
  }
}

export async function toggleVerifyMapelAction(slug: string, verified: boolean) {
  try {
    const { user } = await requireRole(["admin", "waka_kurikulum"]);
    const supabase = await createClient();

    // Cari mapel di DB
    const { data: mapel } = await supabase
      .from("mapel")
      .select("id")
      .or(`slug.eq.${slug},nama.ilike.%${slug.replace(/-/g, " ")}%`)
      .maybeSingle();

    if (mapel) {
      try {
        await supabase
          .from("mapel")
          .update({
            status_verifikasi: verified ? "terverifikasi" : "belum",
            verified_by: verified ? user.id : null,
            verified_at: verified ? new Date().toISOString() : null,
          })
          .eq("id", mapel.id);
      } catch {
        // jika kolom belum ada di database, tidak error
      }
    }

    revalidatePath("/master-data/bank-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengubah status verifikasi" };
  }
}

export async function updateCpDeskripsiAction(cpId: string, deskripsiCp: string) {
  try {
    await requireRole(["admin", "waka_kurikulum"]);
    const supabase = await createClient();

    try {
      await supabase
        .from("capaian_pembelajaran")
        .update({
          deskripsi_cp: deskripsiCp,
          asal: "manual",
          updated_at: new Date().toISOString(),
        })
        .eq("id", cpId);
    } catch {
      await supabase
        .from("capaian_pembelajaran")
        .update({
          deskripsi_cp: deskripsiCp,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cpId);
    }

    revalidatePath("/master-data/bank-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui CP" };
  }
}

export async function getBankDataAuxiliaryAction() {
  try {
    const regulasi = getBankDataRegulasi();
    const pancaCinta = getBankDataPancaCinta();
    const dpl = getBankDataDpl();
    const kbc = getBankDataMateriKbc();
    const kko = getBankDataKko();

    return {
      success: true,
      data: {
        regulasi,
        pancaCinta,
        dpl,
        kbc,
        kko,
      },
    };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memuat bank data tambahan" };
  }
}
