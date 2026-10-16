"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import {
  hitungMingguEfektif,
  type KalenderKegiatanInput,
} from "@/lib/kalender/minggu-efektif";
import type { Database, DocStatus, JenisKegiatanKalender } from "@/types/database";

type ProsemInsert = Database["public"]["Tables"]["prosem"]["Insert"];
type ProsemUpdate = Database["public"]["Tables"]["prosem"]["Update"];
type ProsemItemInsert = Database["public"]["Tables"]["prosem_item"]["Insert"];

export interface ProsemCardItem {
  id: string; // penugasan_id
  tingkat_kelas: 7 | 8 | 9;
  rombel: string;
  mapel: {
    id: string;
    nama: string;
    kode: string;
    jp_per_minggu: number;
  };
  guru: {
    id: string;
    nama_lengkap: string;
    nip: string | null;
  };
  tahun_ajaran: {
    id: string;
    nama: string;
  };
  semester1: {
    prosem_id: string | null;
    status: DocStatus;
    total_jp_efektif: number;
    total_jp_terdistribusi: number;
    minggu_efektif: number;
    jumlah_tp: number;
  };
  semester2: {
    prosem_id: string | null;
    status: DocStatus;
    total_jp_efektif: number;
    total_jp_terdistribusi: number;
    minggu_efektif: number;
    jumlah_tp: number;
  };
}

export interface MatriksKolomMinggu {
  key: string; // misal "7_1" (bulan 7 minggu 1)
  bulan: string; // "Juli"
  bulanIndex: number; // 7
  mingguKe: number; // 1
  rentangTanggal: string; // "13 - 18 Juli 2026"
  efektif: boolean;
  kegiatanPemotong: string[];
  jenisKegiatan: JenisKegiatanKalender;
}

export interface ProsemItemPayload {
  id?: string;
  prosem_id?: string;
  prota_item_id?: string | null;
  kode_tp: string;
  materi_pokok: string;
  tujuan_pembelajaran_teks: string;
  alokasi_jp: number; // Target total JP untuk TP ini
  urutan: number;
  distribusi_minggu: Record<string, number>; // { [key_minggu]: jp } misal { "7_3": 3, "7_4": 3 }
}

export interface ProsemDetailData {
  penugasan: {
    id: string;
    tingkat_kelas: 7 | 8 | 9;
    rombel: string;
    mapel: {
      id: string;
      nama: string;
      kode: string;
      jp_per_minggu: number;
    };
    guru: {
      id: string;
      nama_lengkap: string;
      nip: string | null;
      gelar: string | null;
    };
    tahun_ajaran: {
      id: string;
      nama: string;
      smt1_mulai: string;
      smt1_selesai: string;
      smt2_mulai: string;
      smt2_selesai: string;
    };
  };
  madrasah: {
    id: string;
    nama: string;
    nsm: string | null;
    npsn: string | null;
    alamat: string | null;
    kabupaten: string | null;
    kepala_nama: string | null;
    kepala_nip: string | null;
    logo_url: string | null;
    hari_sekolah: 5 | 6;
  };
  semesterAktif: 1 | 2;
  prosem: {
    id: string | null;
    status: DocStatus;
    total_jp: number;
    total_minggu_efektif: number;
    catatan_validator: string | null;
  };
  kolomMinggu: MatriksKolomMinggu[];
  items: ProsemItemPayload[];
  jpEfektifSemester: number;
  mingguEfektifSemester: number;
  adaDataProta: boolean;
}

/**
 * 1. Mengambil daftar penugasan guru untuk kartu halaman /prosem
 */
export async function getProsemPenugasanListAction(): Promise<{
  success: boolean;
  data: ProsemCardItem[];
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, data: [], error: "Sesi tidak valid. Silakan login." };
    }

    const supabase = await createClient();

    // 1. Dapatkan tahun ajaran aktif
    const { data: activeTa, error: taErr } = await supabase
      .from("tahun_ajaran")
      .select("id, nama, smt1_mulai, smt1_selesai, smt2_mulai, smt2_selesai, aktif")
      .eq("aktif", true)
      .maybeSingle();

    if (taErr || !activeTa) {
      return { success: false, data: [], error: "Tahun ajaran aktif belum ditentukan oleh admin." };
    }

    // 2. Ambil kalender kegiatan & madrasah
    const [kalenderRes, madrasahRes] = await Promise.all([
      supabase
        .from("kalender_kegiatan")
        .select("id, tgl_mulai, tgl_selesai, jenis, keterangan, memotong_minggu_efektif")
        .eq("tahun_ajaran_id", activeTa.id),
      supabase.from("madrasah").select("hari_sekolah").limit(1).maybeSingle(),
    ]);

    const hariSekolah = (madrasahRes.data?.hari_sekolah === 5 ? 5 : 6) as 5 | 6;
    const kalenderKegiatan = (kalenderRes.data || []) as KalenderKegiatanInput[];

    // 3. Query penugasan guru
    let query = supabase
      .from("penugasan")
      .select(`
        id,
        tingkat_kelas,
        rombel,
        mapel_id,
        guru_id,
        tahun_ajaran_id,
        mapel ( id, nama, kode, kelompok, jp_per_minggu_kls7, jp_per_minggu_kls8, jp_per_minggu_kls9 ),
        profiles ( id, nama_lengkap, nip ),
        tahun_ajaran ( id, nama, smt1_mulai, smt1_selesai, smt2_mulai, smt2_selesai, aktif )
      `)
      .eq("tahun_ajaran_id", activeTa.id);

    if (session.role === "guru") {
      query = query.eq("guru_id", session.user.id);
    }

    const { data: penugasanRows, error: pErr } = await query;
    if (pErr) return { success: false, data: [], error: pErr.message };
    if (!penugasanRows || penugasanRows.length === 0) return { success: true, data: [] };

    const penugasanIds = penugasanRows.map((p) => p.id);

    // 4. Query data prosem dan prosem_item
    const [prosemRes, prosemItemRes] = await Promise.all([
      supabase
        .from("prosem")
        .select("id, penugasan_id, semester, status, total_jp, total_minggu_efektif")
        .in("penugasan_id", penugasanIds),
      supabase
        .from("prosem_item")
        .select("id, prosem_id, alokasi_jp, distribusi_minggu"),
    ]);

    const prosemRows = prosemRes.data || [];
    const prosemItemRows = prosemItemRes.data || [];

    // Map prosem per (penugasan_id + semester)
    const prosemMap = new Map<string, { id: string; status: DocStatus; total_jp: number }>();
    const prosemToKey = new Map<string, string>(); // prosem_id -> penugasan_id_semester

    prosemRows.forEach((r) => {
      const key = `${r.penugasan_id}_${r.semester}`;
      prosemMap.set(key, {
        id: r.id,
        status: (r.status as DocStatus) || "draf",
        total_jp: r.total_jp || 0,
      });
      prosemToKey.set(r.id, key);
    });

    // Hitung total JP terdistribusi dari distribusi_minggu
    const prosemDistMap = new Map<string, { totalJp: number; count: number }>();
    prosemItemRows.forEach((item) => {
      const key = prosemToKey.get(item.prosem_id);
      if (key) {
        const cur = prosemDistMap.get(key) || { totalJp: 0, count: 0 };
        cur.count += 1;
        // Hitung sum dari distribusi_minggu
        let sumItem = 0;
        if (item.distribusi_minggu && typeof item.distribusi_minggu === "object") {
          Object.values(item.distribusi_minggu as Record<string, number>).forEach((v) => {
            sumItem += Number(v || 0);
          });
        } else {
          sumItem = Number(item.alokasi_jp || 0);
        }
        cur.totalJp += sumItem;
        prosemDistMap.set(key, cur);
      }
    });

    // 5. Format hasil kartu
    const cardList: ProsemCardItem[] = penugasanRows.map((p) => {
      const mapelData = Array.isArray(p.mapel) ? p.mapel[0] : p.mapel;
      const guruData = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      const taData = Array.isArray(p.tahun_ajaran) ? p.tahun_ajaran[0] : p.tahun_ajaran;

      const jpField =
        p.tingkat_kelas === 7
          ? mapelData?.jp_per_minggu_kls7
          : p.tingkat_kelas === 8
          ? mapelData?.jp_per_minggu_kls8
          : mapelData?.jp_per_minggu_kls9;
      const jpPerMinggu = Number(jpField || 2);

      const analisis = hitungMingguEfektif({
        tahunAjaran: {
          id: taData.id,
          nama: taData.nama,
          smt1_mulai: taData.smt1_mulai,
          smt1_selesai: taData.smt1_selesai,
          smt2_mulai: taData.smt2_mulai,
          smt2_selesai: taData.smt2_selesai,
        },
        kalenderKegiatan,
        jpPerMinggu,
        hariSekolah,
      });

      const pSmt1 = prosemMap.get(`${p.id}_1`);
      const pSmt2 = prosemMap.get(`${p.id}_2`);
      const distSmt1 = prosemDistMap.get(`${p.id}_1`) || { totalJp: 0, count: 0 };
      const distSmt2 = prosemDistMap.get(`${p.id}_2`) || { totalJp: 0, count: 0 };

      return {
        id: p.id,
        tingkat_kelas: p.tingkat_kelas,
        rombel: p.rombel,
        mapel: {
          id: mapelData?.id || "",
          nama: mapelData?.nama || "Mata Pelajaran",
          kode: mapelData?.kode || "",
          jp_per_minggu: jpPerMinggu,
        },
        guru: {
          id: guruData?.id || "",
          nama_lengkap: guruData?.nama_lengkap || "Guru",
          nip: guruData?.nip || null,
        },
        tahun_ajaran: {
          id: taData?.id || "",
          nama: taData?.nama || "",
        },
        semester1: {
          prosem_id: pSmt1?.id || null,
          status: pSmt1?.status || "draf",
          total_jp_efektif: analisis.semester1.jpEfektif,
          total_jp_terdistribusi: distSmt1.totalJp,
          minggu_efektif: analisis.semester1.totalMingguEfektif,
          jumlah_tp: distSmt1.count,
        },
        semester2: {
          prosem_id: pSmt2?.id || null,
          status: pSmt2?.status || "draf",
          total_jp_efektif: analisis.semester2.jpEfektif,
          total_jp_terdistribusi: distSmt2.totalJp,
          minggu_efektif: analisis.semester2.totalMingguEfektif,
          jumlah_tp: distSmt2.count,
        },
      };
    });

    return { success: true, data: cardList };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan saat memuat data Prosem.";
    return { success: false, data: [], error: msg };
  }
}

/**
 * 2. Mengambil detail Prosem untuk editor matriks (/prosem/[penugasanId]?semester=1|2)
 */
export async function getProsemDetailAction(
  penugasanId: string,
  semester: 1 | 2 = 1
): Promise<{
  success: boolean;
  data: ProsemDetailData | null;
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) return { success: false, data: null, error: "Sesi tidak valid." };

    const supabase = await createClient();

    // 1. Ambil penugasan
    const { data: penugasan, error: pErr } = await supabase
      .from("penugasan")
      .select(`
        id,
        tingkat_kelas,
        rombel,
        mapel_id,
        guru_id,
        tahun_ajaran_id,
        mapel ( id, nama, kode, kelompok, jp_per_minggu_kls7, jp_per_minggu_kls8, jp_per_minggu_kls9 ),
        profiles ( id, nama_lengkap, nip, gelar ),
        tahun_ajaran ( id, nama, smt1_mulai, smt1_selesai, smt2_mulai, smt2_selesai, aktif )
      `)
      .eq("id", penugasanId)
      .single();

    if (pErr || !penugasan) return { success: false, data: null, error: "Penugasan tidak ditemukan." };
    if (session.role === "guru" && penugasan.guru_id !== session.user.id) {
      return { success: false, data: null, error: "Akses ditolak." };
    }

    const mapelData = Array.isArray(penugasan.mapel) ? penugasan.mapel[0] : penugasan.mapel;
    const guruData = Array.isArray(penugasan.profiles) ? penugasan.profiles[0] : penugasan.profiles;
    const taData = Array.isArray(penugasan.tahun_ajaran) ? penugasan.tahun_ajaran[0] : penugasan.tahun_ajaran;

    const jpField =
      penugasan.tingkat_kelas === 7
        ? mapelData?.jp_per_minggu_kls7
        : penugasan.tingkat_kelas === 8
        ? mapelData?.jp_per_minggu_kls8
        : mapelData?.jp_per_minggu_kls9;
    const jpPerMinggu = Number(jpField || 2);

    // 2. Ambil data madrasah dan kalender kegiatan
    const [madrasahRes, kalenderRes] = await Promise.all([
      supabase
        .from("madrasah")
        .select("id, nama, nsm, npsn, alamat, kabupaten, kepala_nama, kepala_nip, logo_url, hari_sekolah")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("kalender_kegiatan")
        .select("id, tgl_mulai, tgl_selesai, jenis, keterangan, memotong_minggu_efektif")
        .eq("tahun_ajaran_id", taData.id),
    ]);

    const madrasah = {
      id: madrasahRes.data?.id || "m-default",
      nama: madrasahRes.data?.nama || "MTs KH A Wahab Muhsin",
      nsm: madrasahRes.data?.nsm || null,
      npsn: madrasahRes.data?.npsn || null,
      alamat: madrasahRes.data?.alamat || null,
      kabupaten: madrasahRes.data?.kabupaten || "Tasikmalaya",
      kepala_nama: madrasahRes.data?.kepala_nama || "Kepala Madrasah",
      kepala_nip: madrasahRes.data?.kepala_nip || null,
      logo_url: madrasahRes.data?.logo_url || null,
      hari_sekolah: (madrasahRes.data?.hari_sekolah === 5 ? 5 : 6) as 5 | 6,
    };

    const kalenderKegiatan = (kalenderRes.data || []) as KalenderKegiatanInput[];

    // 3. Hitung Analisis Minggu Efektif
    const analisis = hitungMingguEfektif({
      tahunAjaran: {
        id: taData.id,
        nama: taData.nama,
        smt1_mulai: taData.smt1_mulai,
        smt1_selesai: taData.smt1_selesai,
        smt2_mulai: taData.smt2_mulai,
        smt2_selesai: taData.smt2_selesai,
      },
      kalenderKegiatan,
      jpPerMinggu,
      hariSekolah: madrasah.hari_sekolah,
    });

    const semesterData = semester === 1 ? analisis.semester1 : analisis.semester2;

    // 4. Bangun daftar kolom minggu untuk semester aktif
    const kolomMinggu: MatriksKolomMinggu[] = [];

    // Helper untuk mendeteksi jenis kegiatan pemotong
    const detectJenisKegiatan = (kegiatanList: string[]): JenisKegiatanKalender => {
      const allText = kegiatanList.join(" ").toLowerCase();
      if (allText.includes("asesmen") || allText.includes("sumatif") || allText.includes("penilaian")) {
        return "asesmen";
      }
      if (allText.includes("matsama") || allText.includes("ta'aruf")) {
        return "matsama";
      }
      if (allText.includes("ramadhan") || allText.includes("idul fitri") || allText.includes("lebaran")) {
        return "ramadhan";
      }
      if (allText.includes("libur")) {
        return "libur";
      }
      if (allText.includes("kemah") || allText.includes("lomba") || allText.includes("madrasah")) {
        return "kegiatan_madrasah";
      }
      return "lainnya";
    };

    semesterData.daftarBulan.forEach((b) => {
      b.detailMinggu.forEach((m) => {
        const key = `${b.bulanIndex}_${m.mingguKe}`;
        const jenis = m.efektif ? ("lainnya" as JenisKegiatanKalender) : detectJenisKegiatan(m.kegiatanPemotong);

        kolomMinggu.push({
          key,
          bulan: b.bulan,
          bulanIndex: b.bulanIndex,
          mingguKe: m.mingguKe,
          rentangTanggal: m.rentangTanggal,
          efektif: m.efektif,
          kegiatanPemotong: m.kegiatanPemotong,
          jenisKegiatan: jenis,
        });
      });
    });

    // 5. Ambil data Prosem yang sudah tersimpan
    const { data: existingProsem } = await supabase
      .from("prosem")
      .select("id, status, total_jp, total_minggu_efektif, catatan_validator")
      .eq("penugasan_id", penugasanId)
      .eq("semester", semester)
      .maybeSingle();

    let items: ProsemItemPayload[] = [];

    if (existingProsem) {
      const { data: prosemItemRows, error: itemErr } = await supabase
        .from("prosem_item")
        .select(`
          id,
          prosem_id,
          prota_item_id,
          kode_tp,
          materi_pokok,
          tujuan_pembelajaran_teks,
          alokasi_jp,
          urutan,
          distribusi_minggu
        `)
        .eq("prosem_id", existingProsem.id)
        .order("urutan", { ascending: true });

      if (!itemErr && prosemItemRows && prosemItemRows.length > 0) {
        items = prosemItemRows.map((it, idx) => ({
          id: it.id,
          prosem_id: it.prosem_id,
          prota_item_id: it.prota_item_id || null,
          kode_tp: it.kode_tp || `${penugasan.tingkat_kelas}.${idx + 1}`,
          materi_pokok: it.materi_pokok || "Materi Pokok",
          tujuan_pembelajaran_teks: it.tujuan_pembelajaran_teks || it.materi_pokok || "",
          alokasi_jp: Number(it.alokasi_jp || 2),
          urutan: it.urutan || idx + 1,
          distribusi_minggu: (it.distribusi_minggu as Record<string, number>) || {},
        }));
      } else if (existingProsem.catatan_validator) {
        // Fallback: ambil snapshot dari catatan_validator jika kolom belum termigrasi
        try {
          const parsed = JSON.parse(existingProsem.catatan_validator);
          if (parsed && Array.isArray(parsed.matrix_items)) {
            items = parsed.matrix_items;
          }
        } catch {
          // Abaikan jika catatan_validator bukan JSON
        }
      }
    }

    // 6. Jika belum ada prosem_item, ambil baris TP dari PROTA untuk semester ini
    const { data: protaData } = await supabase
      .from("prota")
      .select("id")
      .eq("penugasan_id", penugasanId)
      .maybeSingle();

    let protaItemsForSemester: Array<{
      id: string;
      kode_tp?: string | null;
      materi_pokok: string;
      tujuan_pembelajaran_teks?: string | null;
      alokasi_jp: number;
      urutan: number;
    }> = [];

    if (protaData) {
      const { data: pItems } = await supabase
        .from("prota_item")
        .select("id, kode_tp, materi_pokok, tujuan_pembelajaran_teks, alokasi_jp, urutan")
        .eq("prota_id", protaData.id)
        .eq("semester", semester)
        .order("urutan", { ascending: true });

      protaItemsForSemester = pItems || [];
    }

    const adaDataProta = protaItemsForSemester.length > 0;

    // Jika belum tersimpan di prosem_item, pre-fill dari data Prota
    if (items.length === 0 && adaDataProta) {
      items = protaItemsForSemester.map((pIt, idx) => ({
        prota_item_id: pIt.id,
        kode_tp: pIt.kode_tp || `${penugasan.tingkat_kelas}.${idx + 1}`,
        materi_pokok: pIt.materi_pokok,
        tujuan_pembelajaran_teks: pIt.tujuan_pembelajaran_teks || pIt.materi_pokok,
        alokasi_jp: Number(pIt.alokasi_jp || 2),
        urutan: pIt.urutan || idx + 1,
        distribusi_minggu: {},
      }));
    }

    return {
      success: true,
      data: {
        penugasan: {
          id: penugasan.id,
          tingkat_kelas: penugasan.tingkat_kelas,
          rombel: penugasan.rombel,
          mapel: {
            id: mapelData?.id || "",
            nama: mapelData?.nama || "Mata Pelajaran",
            kode: mapelData?.kode || "",
            jp_per_minggu: jpPerMinggu,
          },
          guru: {
            id: guruData?.id || "",
            nama_lengkap: guruData?.nama_lengkap || "Guru Pengampu",
            nip: guruData?.nip || null,
            gelar: guruData?.gelar || null,
          },
          tahun_ajaran: {
            id: taData.id,
            nama: taData.nama,
            smt1_mulai: taData.smt1_mulai,
            smt1_selesai: taData.smt1_selesai,
            smt2_mulai: taData.smt2_mulai,
            smt2_selesai: taData.smt2_selesai,
          },
        },
        madrasah,
        semesterAktif: semester,
        prosem: {
          id: existingProsem?.id || null,
          status: (existingProsem?.status as DocStatus) || "draf",
          total_jp: existingProsem?.total_jp || 0,
          total_minggu_efektif: existingProsem?.total_minggu_efektif || semesterData.totalMingguEfektif,
          catatan_validator: existingProsem?.catatan_validator || null,
        },
        kolomMinggu,
        items,
        jpEfektifSemester: semesterData.jpEfektif,
        mingguEfektifSemester: semesterData.totalMingguEfektif,
        adaDataProta,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan saat memuat detail Prosem.";
    return { success: false, data: null, error: msg };
  }
}

/**
 * 3. Menyimpan Matriks Program Semester & Distribusi Mingguan
 */
export async function saveProsemAction(
  penugasanId: string,
  semester: 1 | 2,
  items: ProsemItemPayload[],
  targetStatus: DocStatus = "draf"
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentUser();
    if (!session) return { success: false, error: "Sesi tidak valid." };

    const supabase = await createClient();

    // 1. Verifikasi penugasan
    const { data: penugasan } = await supabase
      .from("penugasan")
      .select("id, guru_id")
      .eq("id", penugasanId)
      .single();

    if (!penugasan) return { success: false, error: "Penugasan tidak ditemukan." };
    if (session.role === "guru" && penugasan.guru_id !== session.user.id) {
      return { success: false, error: "Akses ditolak." };
    }

    // Hitung total JP dari seluruh sel terdistribusi
    let totalJp = 0;
    items.forEach((it) => {
      Object.values(it.distribusi_minggu || {}).forEach((v) => {
        totalJp += Number(v || 0);
      });
    });

    // Gunakan adminDb untuk operasi tulis dokumen setelah autentikasi & otorisasi diverifikasi
    const adminDb = createAdminClient();

    // 2. Simpan / update baris prosem (pertahankan status awal sebelum seluruh item disimpan)
    const { data: existingProsem } = await adminDb
      .from("prosem")
      .select("id, status, catatan_validator")
      .eq("penugasan_id", penugasanId)
      .eq("semester", semester)
      .maybeSingle();

    let prosemId: string | undefined = existingProsem?.id;

    // Snapshot JSON untuk fallback jika kolom baru belum aktif di database
    let snapshotJson = "";
    try {
      snapshotJson = JSON.stringify({ matrix_items: items });
    } catch {
      snapshotJson = "";
    }

    if (existingProsem) {
      const updatePayload: ProsemUpdate = {
        total_jp: totalJp,
        catatan_validator: snapshotJson || existingProsem.catatan_validator,
        updated_at: new Date().toISOString(),
      };

      await adminDb.from("prosem").update(updatePayload).eq("id", existingProsem.id);
    } else {
      const insertPayload: ProsemInsert = {
        penugasan_id: penugasanId,
        semester,
        status: "draf",
        total_jp: totalJp,
        total_minggu_efektif: 18,
        catatan_validator: snapshotJson,
        created_by: session.user.id,
      };

      const { data: inserted, error: inErr } = await adminDb
        .from("prosem")
        .insert(insertPayload)
        .select("id")
        .single();

      if (inErr || !inserted) {
        return { success: false, error: "Gagal membuat dokumen Prosem: " + inErr?.message };
      }
      prosemId = inserted.id;
    }

    if (!prosemId) return { success: false, error: "Gagal memperoleh ID dokumen Prosem." };

    // 3. Simpan baris-baris item prosem_item
    await adminDb.from("prosem_item").delete().eq("prosem_id", prosemId);

    if (items.length > 0) {
      const rowsToInsert: ProsemItemInsert[] = items.map((it, idx) => ({
        prosem_id: prosemId as string,
        prota_item_id: it.prota_item_id || null,
        kode_tp: it.kode_tp,
        materi_pokok: it.materi_pokok,
        tujuan_pembelajaran_teks: it.tujuan_pembelajaran_teks,
        alokasi_jp: it.alokasi_jp,
        urutan: idx + 1,
        minggu_ke: Object.keys(it.distribusi_minggu || {}).map((_, i) => i + 1),
        distribusi_minggu: it.distribusi_minggu,
        created_by: session.user.id,
      }));

      const { error: itemErr } = await adminDb.from("prosem_item").insert(rowsToInsert);

      if (itemErr && itemErr.message.includes("column")) {
        // Fallback jika kolom baru belum ada di remote DB
        const fallbackRows: ProsemItemInsert[] = items.map((it, idx) => ({
          prosem_id: prosemId as string,
          prota_item_id: it.prota_item_id || null,
          alokasi_jp: it.alokasi_jp,
          urutan: idx + 1,
          minggu_ke: [],
          created_by: session.user.id,
        }));
        await adminDb.from("prosem_item").insert(fallbackRows);
      } else if (itemErr) {
        return { success: false, error: "Gagal menyimpan item matriks Prosem: " + itemErr.message };
      }
    }

    // 4. Setelah seluruh prosem_item tersimpan, perbarui status akhir dokumen (misal "diajukan" atau "draf")
    await adminDb
      .from("prosem")
      .update({
        status: targetStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", prosemId);

    revalidatePath("/prosem");
    revalidatePath(`/prosem/${penugasanId}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, error: msg };
  }
}
