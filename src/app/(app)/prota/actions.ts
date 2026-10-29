"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import {
  hitungMingguEfektif,
  type HasilAnalisisMingguEfektif,
  type KalenderKegiatanInput,
} from "@/lib/kalender/minggu-efektif";
import type { Database, DocStatus } from "@/types/database";

type ProtaInsert = Database["public"]["Tables"]["prota"]["Insert"];
type ProtaUpdate = Database["public"]["Tables"]["prota"]["Update"];
type ProtaItemInsert = Database["public"]["Tables"]["prota_item"]["Insert"];

export interface ProtaCardItem {
  id: string; // penugasan_id
  prota_id: string | null;
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
  status: DocStatus;
  total_jp_efektif: number;
  total_jp_terdistribusi: number;
  jp_efektif_smt1: number;
  jp_efektif_smt2: number;
  jp_terpakai_smt1: number;
  jp_terpakai_smt2: number;
  jumlah_item: number;
}

export interface ProtaItemPayload {
  id?: string;
  prota_id?: string;
  tujuan_pembelajaran_id?: string | null;
  kode_tp: string;
  materi_pokok: string;
  tujuan_pembelajaran_teks: string;
  panca_cinta_nama: string;
  semester: 1 | 2;
  alokasi_jp: number;
  urutan: number;
  keterangan: string;
}

export interface ProtaDetailData {
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
      tanggal_penetapan_dokumen: string | null;
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
  prota: {
    id: string | null;
    status: DocStatus;
    total_jp: number;
    catatan_validator: string | null;
    snapshot_minggu_efektif: HasilAnalisisMingguEfektif | null;
  };
  mingguEfektifKini: HasilAnalisisMingguEfektif;
  items: ProtaItemPayload[];
  adaDataAtp: boolean;
}

/**
 * 1. Mengambil daftar penugasan guru untuk kartu halaman /prota
 */
export async function getProtaPenugasanListAction(): Promise<{
  success: boolean;
  data: ProtaCardItem[];
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

    // 2. Ambil kalender kegiatan pemotong untuk perhitungan JP efektif
    const { data: kalenderRows } = await supabase
      .from("kalender_kegiatan")
      .select("id, tgl_mulai, tgl_selesai, jenis, keterangan, memotong_minggu_efektif")
      .eq("tahun_ajaran_id", activeTa.id);

    // 3. Ambil data madrasah untuk preferensi hari_sekolah (5 atau 6)
    const { data: madrasahData } = await supabase
      .from("madrasah")
      .select("hari_sekolah")
      .limit(1)
      .maybeSingle();

    const hariSekolah = (madrasahData?.hari_sekolah === 5 ? 5 : 6) as 5 | 6;

    // 4. Query penugasan guru di tahun ajaran aktif
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
    if (pErr) {
      return { success: false, data: [], error: pErr.message };
    }

    if (!penugasanRows || penugasanRows.length === 0) {
      return { success: true, data: [] };
    }

    const penugasanIds = penugasanRows.map((p) => p.id);

    // 5. Ambil data prota dan prota_item secara paralel
    const [protaRes, protaItemRes] = await Promise.all([
      supabase
        .from("prota")
        .select("id, penugasan_id, status, total_jp, snapshot_minggu_efektif")
        .in("penugasan_id", penugasanIds),
      supabase
        .from("prota_item")
        .select("id, prota_id, semester, alokasi_jp"),
    ]);

    const protaRows = protaRes.data || [];
    const protaItemRows = protaItemRes.data || [];

    const protaMap = new Map<string, { id: string; status: DocStatus; total_jp: number }>();
    const protaToPenugasan = new Map<string, string>();

    protaRows.forEach((r) => {
      protaMap.set(r.penugasan_id, {
        id: r.id,
        status: (r.status as DocStatus) || "draf",
        total_jp: r.total_jp || 0,
      });
      protaToPenugasan.set(r.id, r.penugasan_id);
    });

    // Agregasi alokasi JP per semester dari prota_item
    const jpDistMap = new Map<
      string,
      { totalJp: number; smt1: number; smt2: number; count: number }
    >();
    penugasanIds.forEach((id) =>
      jpDistMap.set(id, { totalJp: 0, smt1: 0, smt2: 0, count: 0 })
    );

    protaItemRows.forEach((item) => {
      const penId = protaToPenugasan.get(item.prota_id);
      if (penId) {
        const cur = jpDistMap.get(penId) || { totalJp: 0, smt1: 0, smt2: 0, count: 0 };
        const jp = Number(item.alokasi_jp || 0);
        cur.totalJp += jp;
        cur.count += 1;
        if (item.semester === 1) cur.smt1 += jp;
        if (item.semester === 2) cur.smt2 += jp;
        jpDistMap.set(penId, cur);
      }
    });

    // 6. Format hasil kartu
    const cardList: ProtaCardItem[] = penugasanRows.map((p) => {
      const mapelData = Array.isArray(p.mapel) ? p.mapel[0] : p.mapel;
      const guruData = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      const taData = Array.isArray(p.tahun_ajaran) ? p.tahun_ajaran[0] : p.tahun_ajaran;
      const protaData = protaMap.get(p.id);
      const distData = jpDistMap.get(p.id) || { totalJp: 0, smt1: 0, smt2: 0, count: 0 };

      const jpField =
        p.tingkat_kelas === 7
          ? mapelData?.jp_per_minggu_kls7
          : p.tingkat_kelas === 8
          ? mapelData?.jp_per_minggu_kls8
          : mapelData?.jp_per_minggu_kls9;
      const jpPerMinggu = Number(jpField || 2);

      // Hitung minggu efektif
      const analisis = hitungMingguEfektif({
        tahunAjaran: {
          id: taData?.id,
          nama: taData?.nama,
          smt1_mulai: taData?.smt1_mulai,
          smt1_selesai: taData?.smt1_selesai,
          smt2_mulai: taData?.smt2_mulai,
          smt2_selesai: taData?.smt2_selesai,
        },
        kalenderKegiatan: (kalenderRows || []) as KalenderKegiatanInput[],
        jpPerMinggu,
        hariSekolah,
      });

      return {
        id: p.id,
        prota_id: protaData?.id || null,
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
        status: protaData?.status || "draf",
        total_jp_efektif: analisis.totalTahun.jpEfektif,
        total_jp_terdistribusi: distData.totalJp,
        jp_efektif_smt1: analisis.semester1.jpEfektif,
        jp_efektif_smt2: analisis.semester2.jpEfektif,
        jp_terpakai_smt1: distData.smt1,
        jp_terpakai_smt2: distData.smt2,
        jumlah_item: distData.count,
      };
    });

    return { success: true, data: cardList };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan saat mengambil data Prota.";
    return { success: false, data: [], error: msg };
  }
}

/**
 * 2. Mengambil data detail Prota (/prota/[penugasanId]):
 *    - Analisis minggu efektif
 *    - Item distribusi Prota (atau otomatis pre-fill dari ATP jika baru)
 */
export async function getProtaDetailAction(penugasanId: string): Promise<{
  success: boolean;
  data: ProtaDetailData | null;
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, data: null, error: "Sesi tidak valid." };
    }

    const supabase = await createClient();

    // 1. Ambil data penugasan
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
        tahun_ajaran ( id, nama, smt1_mulai, smt1_selesai, smt2_mulai, smt2_selesai, aktif, tanggal_penetapan_dokumen )
      `)
      .eq("id", penugasanId)
      .single();

    if (pErr || !penugasan) {
      return { success: false, data: null, error: "Penugasan tidak ditemukan." };
    }

    if (session.role === "guru" && penugasan.guru_id !== session.user.id) {
      return { success: false, data: null, error: "Akses ditolak: bukan penugasan Anda." };
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

    // 2. Ambil data madrasah dan kalender kegiatan secara paralel
    const [madrasahRes, kalenderRes, pancaCintaRes] = await Promise.all([
      supabase
        .from("madrasah")
        .select("id, nama, nsm, npsn, alamat, kabupaten, kepala_nama, kepala_nip, logo_url, hari_sekolah")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("kalender_kegiatan")
        .select("id, tgl_mulai, tgl_selesai, jenis, keterangan, memotong_minggu_efektif")
        .eq("tahun_ajaran_id", taData.id),
      supabase
        .from("panca_cinta")
        .select("id, nama, kode")
        .order("urutan", { ascending: true }),
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

    const pcMap = new Map<string, string>();
    pancaCintaRes.data?.forEach((pc) => pcMap.set(pc.id, pc.nama));

    // 3. Hitung Analisis Minggu Efektif terkini
    const mingguEfektifKini = hitungMingguEfektif({
      tahunAjaran: {
        id: taData.id,
        nama: taData.nama,
        smt1_mulai: taData.smt1_mulai,
        smt1_selesai: taData.smt1_selesai,
        smt2_mulai: taData.smt2_mulai,
        smt2_selesai: taData.smt2_selesai,
      },
      kalenderKegiatan: (kalenderRes.data || []) as KalenderKegiatanInput[],
      jpPerMinggu,
      hariSekolah: madrasah.hari_sekolah,
    });

    // 4. Ambil data Prota yang tersimpan
    const { data: existingProta } = await supabase
      .from("prota")
      .select("id, status, total_jp, catatan_validator, snapshot_minggu_efektif")
      .eq("penugasan_id", penugasanId)
      .maybeSingle();

    let items: ProtaItemPayload[] = [];

    if (existingProta) {
      // Ambil item dari prota_item
      const { data: protaItemRows } = await supabase
        .from("prota_item")
        .select(`
          id,
          prota_id,
          tujuan_pembelajaran_id,
          kode_tp,
          materi_pokok,
          tujuan_pembelajaran_teks,
          panca_cinta_nama,
          semester,
          alokasi_jp,
          urutan,
          keterangan
        `)
        .eq("prota_id", existingProta.id)
        .order("urutan", { ascending: true });

      if (protaItemRows && protaItemRows.length > 0) {
        items = protaItemRows.map((it, idx) => ({
          id: it.id,
          prota_id: it.prota_id,
          tujuan_pembelajaran_id: it.tujuan_pembelajaran_id || null,
          kode_tp: it.kode_tp || `${penugasan.tingkat_kelas}.${idx + 1}`,
          materi_pokok: it.materi_pokok || "",
          tujuan_pembelajaran_teks: it.tujuan_pembelajaran_teks || it.materi_pokok,
          panca_cinta_nama: it.panca_cinta_nama || "-",
          semester: (it.semester === 2 ? 2 : 1) as 1 | 2,
          alokasi_jp: Number(it.alokasi_jp || 2),
          urutan: it.urutan || idx + 1,
          keterangan: it.keterangan || "",
        }));
      }
    }

    // 5. Cek apakah ada data ATP untuk penugasan ini
    // Jika prota belum memiliki item, sinkronkan otomatis dari ATP!
    const { data: analisisRows } = await supabase
      .from("analisis_cp")
      .select("id, materi_pokok")
      .eq("penugasan_id", penugasanId);

    const analisisIds = (analisisRows || []).map((a) => a.id);
    const analisisMateriMap = new Map<string, string>();
    analisisRows?.forEach((a) => analisisMateriMap.set(a.id, a.materi_pokok));

    let tpFromAtp: Array<{
      id: string;
      analisis_cp_id: string;
      kode_tp: string;
      deskripsi: string;
      lingkup_materi?: string | null;
      panca_cinta_ids?: string[] | null;
      semester?: 1 | 2 | null;
      alokasi_jp: number;
      urutan: number;
    }> = [];

    if (analisisIds.length > 0) {
      const { data: tpRows } = await supabase
        .from("tujuan_pembelajaran")
        .select(`
          id,
          analisis_cp_id,
          kode_tp,
          deskripsi,
          lingkup_materi,
          panca_cinta_ids,
          semester,
          alokasi_jp,
          urutan
        `)
        .in("analisis_cp_id", analisisIds)
        .order("urutan", { ascending: true });

      tpFromAtp = tpRows || [];
    }

    const adaDataAtp = tpFromAtp.length > 0;

    // Jika belum pernah tersimpan item di prota, ambil otomatis dari ATP
    if (items.length === 0 && adaDataAtp) {
      items = tpFromAtp.map((tp, idx) => {
        const pcNamaList = (tp.panca_cinta_ids || [])
          .map((id) => pcMap.get(id))
          .filter(Boolean);

        return {
          tujuan_pembelajaran_id: tp.id,
          kode_tp: tp.kode_tp || `${penugasan.tingkat_kelas}.${idx + 1}`,
          materi_pokok: tp.lingkup_materi || analisisMateriMap.get(tp.analisis_cp_id) || "Materi Pokok",
          tujuan_pembelajaran_teks: tp.deskripsi,
          panca_cinta_nama: pcNamaList.join(", ") || "Panca Cinta",
          semester: (tp.semester === 2 ? 2 : 1) as 1 | 2,
          alokasi_jp: Number(tp.alokasi_jp || 2),
          urutan: tp.urutan || idx + 1,
          keterangan: "",
        };
      });
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
            tanggal_penetapan_dokumen: taData.tanggal_penetapan_dokumen || null,
          },
        },
        madrasah,
        prota: {
          id: existingProta?.id || null,
          status: (existingProta?.status as DocStatus) || "draf",
          total_jp: existingProta?.total_jp || 0,
          catatan_validator: existingProta?.catatan_validator || null,
          snapshot_minggu_efektif:
            (existingProta?.snapshot_minggu_efektif as unknown as HasilAnalisisMingguEfektif) || null,
        },
        mingguEfektifKini,
        items,
        adaDataAtp,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan saat memuat detail Prota.";
    return { success: false, data: null, error: msg };
  }
}

/**
 * 3. Menyimpan Dokumen Prota & Distribusi Alokasi Waktu
 *    - Menyimpan snapshot hasil analisis minggu efektif ke prota.snapshot_minggu_efektif
 *    - Menyimpan seluruh item distribusi
 */
export async function saveProtaAction(
  penugasanId: string,
  items: ProtaItemPayload[],
  newStatus: DocStatus = "draf"
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi tidak valid." };
    }

    const supabase = await createClient();

    // 1. Verifikasi penugasan
    const { data: penugasan } = await supabase
      .from("penugasan")
      .select(`
        id,
        guru_id,
        tingkat_kelas,
        mapel ( id, jp_per_minggu_kls7, jp_per_minggu_kls8, jp_per_minggu_kls9 ),
        tahun_ajaran ( id, nama, smt1_mulai, smt1_selesai, smt2_mulai, smt2_selesai )
      `)
      .eq("id", penugasanId)
      .single();

    if (!penugasan) {
      return { success: false, error: "Penugasan tidak ditemukan." };
    }

    if (session.role === "guru" && penugasan.guru_id !== session.user.id) {
      return { success: false, error: "Akses ditolak." };
    }

    const mapelData = Array.isArray(penugasan.mapel) ? penugasan.mapel[0] : penugasan.mapel;
    const taData = Array.isArray(penugasan.tahun_ajaran) ? penugasan.tahun_ajaran[0] : penugasan.tahun_ajaran;
    const jpField =
      penugasan.tingkat_kelas === 7
        ? mapelData?.jp_per_minggu_kls7
        : penugasan.tingkat_kelas === 8
        ? mapelData?.jp_per_minggu_kls8
        : mapelData?.jp_per_minggu_kls9;
    const jpPerMinggu = Number(jpField || 2);

    // 2. Ambil kalender & madrasah untuk membuat snapshot
    const [madrasahRes, kalenderRes] = await Promise.all([
      supabase.from("madrasah").select("hari_sekolah").limit(1).maybeSingle(),
      supabase
        .from("kalender_kegiatan")
        .select("id, tgl_mulai, tgl_selesai, jenis, keterangan, memotong_minggu_efektif")
        .eq("tahun_ajaran_id", taData.id),
    ]);

    const hariSekolah = (madrasahRes.data?.hari_sekolah === 5 ? 5 : 6) as 5 | 6;

    // Buat snapshot kalkulasi minggu efektif saat ini
    const snapshot = hitungMingguEfektif({
      tahunAjaran: {
        id: taData.id,
        nama: taData.nama,
        smt1_mulai: taData.smt1_mulai,
        smt1_selesai: taData.smt1_selesai,
        smt2_mulai: taData.smt2_mulai,
        smt2_selesai: taData.smt2_selesai,
      },
      kalenderKegiatan: (kalenderRes.data || []) as KalenderKegiatanInput[],
      jpPerMinggu,
      hariSekolah,
    });

    const totalJp = items.reduce((sum, it) => sum + Number(it.alokasi_jp || 0), 0);

    // Gunakan adminDb untuk operasi tulis dokumen setelah autentikasi & otorisasi diverifikasi
    const adminDb = createAdminClient();

    // 3. Simpan baris prota (pertahankan status awal/draf saat menyimpan dokumen induk)
    const { data: existingProta } = await adminDb
      .from("prota")
      .select("id, status")
      .eq("penugasan_id", penugasanId)
      .maybeSingle();

    let protaId = existingProta?.id;

    if (existingProta) {
      const updatePayload: ProtaUpdate = {
        total_jp: totalJp,
        snapshot_minggu_efektif: snapshot as unknown as Database["public"]["Tables"]["prota"]["Update"]["snapshot_minggu_efektif"],
        updated_at: new Date().toISOString(),
      };

      const { error: upErr } = await adminDb
        .from("prota")
        .update(updatePayload)
        .eq("id", existingProta.id);

      if (upErr) {
        // Fallback jika kolom snapshot belum ada
        await adminDb
          .from("prota")
          .update({
            total_jp: totalJp,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingProta.id);
      }
    } else {
      const insertPayload: ProtaInsert = {
        penugasan_id: penugasanId,
        status: "draf",
        total_jp: totalJp,
        snapshot_minggu_efektif: snapshot as unknown as Database["public"]["Tables"]["prota"]["Insert"]["snapshot_minggu_efektif"],
        created_by: session.user.id,
      };

      const { data: inserted, error: inErr } = await adminDb
        .from("prota")
        .insert(insertPayload)
        .select("id")
        .single();

      if (inErr || !inserted) {
        // Fallback tanpa snapshot
        const { data: fallbackIns, error: fbErr } = await adminDb
          .from("prota")
          .insert({
            penugasan_id: penugasanId,
            status: "draf",
            total_jp: totalJp,
            created_by: session.user.id,
          })
          .select("id")
          .single();

        if (fbErr || !fallbackIns) {
          return { success: false, error: "Gagal membuat dokumen Prota: " + (inErr?.message || fbErr?.message) };
        }
        protaId = fallbackIns.id;
      } else {
        protaId = inserted.id;
      }
    }

    if (!protaId) {
      return { success: false, error: "Gagal mendapatkan ID dokumen Prota." };
    }

    // 4. Perbarui baris item di prota_item (Hapus yang lama dan ganti dengan yang baru)
    await adminDb.from("prota_item").delete().eq("prota_id", protaId);

    if (items.length > 0) {
      const itemRows: ProtaItemInsert[] = items.map((it, idx) => ({
        prota_id: protaId as string,
        tujuan_pembelajaran_id: it.tujuan_pembelajaran_id || null,
        kode_tp: it.kode_tp || `${penugasan.tingkat_kelas}.${idx + 1}`,
        materi_pokok: it.materi_pokok || "Materi Pokok",
        tujuan_pembelajaran_teks: it.tujuan_pembelajaran_teks || it.materi_pokok,
        panca_cinta_nama: it.panca_cinta_nama || "-",
        semester: it.semester,
        alokasi_jp: Number(it.alokasi_jp || 2),
        urutan: idx + 1,
        keterangan: it.keterangan || null,
        created_by: session.user.id,
      }));

      const { error: itemErr } = await adminDb
        .from("prota_item")
        .insert(itemRows);

      if (itemErr && itemErr.message.includes("column")) {
        // Fallback jika kolom tambahan belum ada di tabel prota_item
        const fallbackItemRows: ProtaItemInsert[] = items.map((it, idx) => ({
          prota_id: protaId as string,
          materi_pokok: `${it.kode_tp} - ${it.materi_pokok}`,
          semester: it.semester,
          alokasi_jp: Number(it.alokasi_jp || 2),
          urutan: idx + 1,
          created_by: session.user.id,
        }));

        await adminDb.from("prota_item").insert(fallbackItemRows);
      } else if (itemErr) {
        return { success: false, error: "Gagal menyimpan rincian item Prota: " + itemErr.message };
      }
    }

    // 5. Sinkronkan balik alokasi_jp, semester, dan urutan ke tabel tujuan_pembelajaran di ATP
    // agar kalkulasi alokasi JP di ATP dan Prota selalu 100% konsisten
    if (items.length > 0) {
      for (const it of items) {
        if (it.tujuan_pembelajaran_id) {
          await adminDb
            .from("tujuan_pembelajaran")
            .update({
              alokasi_jp: Number(it.alokasi_jp || 2),
              semester: it.semester,
              urutan: it.urutan,
              updated_at: new Date().toISOString(),
            })
            .eq("id", it.tujuan_pembelajaran_id);
        }
      }
    }

    // 6. Setelah seluruh prota_item tersimpan, perbarui status akhir dokumen (misal "diajukan" atau "draf")
    await adminDb
      .from("prota")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", protaId);

    revalidatePath("/prota");
    revalidatePath(`/prota/${penugasanId}`);
    revalidatePath("/atp");
    revalidatePath(`/atp/${penugasanId}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, error: msg };
  }
}

/**
 * 4. Sinkronkan Ulang dari ATP
 *    Mengambil TP terkini dari tabel tujuan_pembelajaran dan merefresh item distribusi Prota.
 */
export async function syncProtaFromAtpAction(penugasanId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi tidak valid." };
    }

    const supabase = await createClient();

    // 1. Ambil data penugasan
    const { data: penugasan } = await supabase
      .from("penugasan")
      .select("id, tingkat_kelas, guru_id")
      .eq("id", penugasanId)
      .single();

    if (!penugasan) return { success: false, error: "Penugasan tidak ditemukan." };
    if (session.role === "guru" && penugasan.guru_id !== session.user.id) {
      return { success: false, error: "Akses ditolak." };
    }

    // 2. Ambil master panca cinta
    const { data: pcRows } = await supabase.from("panca_cinta").select("id, nama");
    const pcMap = new Map<string, string>();
    pcRows?.forEach((pc) => pcMap.set(pc.id, pc.nama));

    // 3. Ambil analisis_cp dan TP
    const { data: analisisRows } = await supabase
      .from("analisis_cp")
      .select("id, materi_pokok")
      .eq("penugasan_id", penugasanId);

    const analisisIds = (analisisRows || []).map((a) => a.id);
    const materiMap = new Map<string, string>();
    analisisRows?.forEach((a) => materiMap.set(a.id, a.materi_pokok));

    if (analisisIds.length === 0) {
      return { success: false, error: "Belum ada Analisis CP & ATP untuk penugasan ini." };
    }

    const { data: tpRows } = await supabase
      .from("tujuan_pembelajaran")
      .select(`
        id,
        analisis_cp_id,
        kode_tp,
        deskripsi,
        lingkup_materi,
        panca_cinta_ids,
        semester,
        alokasi_jp,
        urutan
      `)
      .in("analisis_cp_id", analisisIds)
      .order("urutan", { ascending: true });

    if (!tpRows || tpRows.length === 0) {
      return { success: false, error: "Belum ada Tujuan Pembelajaran yang dirumuskan di ATP." };
    }

    // Bentuk item Prota baru dari ATP
    const newItems: ProtaItemPayload[] = tpRows.map((tp, idx) => {
      const pcNamaList = (tp.panca_cinta_ids || [])
        .map((id) => pcMap.get(id))
        .filter(Boolean);

      return {
        tujuan_pembelajaran_id: tp.id,
        kode_tp: tp.kode_tp || `${penugasan.tingkat_kelas}.${idx + 1}`,
        materi_pokok: tp.lingkup_materi || materiMap.get(tp.analisis_cp_id) || "Materi Pokok",
        tujuan_pembelajaran_teks: tp.deskripsi,
        panca_cinta_nama: pcNamaList.join(", ") || "-",
        semester: (tp.semester === 2 ? 2 : 1) as 1 | 2,
        alokasi_jp: Number(tp.alokasi_jp || 2),
        urutan: tp.urutan || idx + 1,
        keterangan: "",
      };
    });

    // Simpan ke database
    return await saveProtaAction(penugasanId, newItems, "draf");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, error: msg };
  }
}
