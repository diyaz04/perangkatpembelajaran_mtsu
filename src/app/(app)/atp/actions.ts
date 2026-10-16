"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import {
  getAllMapelBankData,
  getBankDataKko,
  getBankDataManifest,
} from "@/lib/bank-data/service";
import {
  hitungMingguEfektif,
  type KalenderKegiatanInput,
} from "@/lib/kalender/minggu-efektif";
import type {
  Database,
  DocStatus,
  MetodePengurutanAtp,
  KktpData,
} from "@/types/database";

export interface TargetJpInfo {
  total: number;
  totalMingguEfektif: number;
  smt1: number;
  smt1MingguEfektif: number;
  smt2: number;
  smt2MingguEfektif: number;
}

export interface WizardMateriItem {
  id?: string;
  tingkat: number;
  semester: number;
  urutan: number;
  bab: string;
  deskripsi?: string;
  kata_kunci?: string[];
  elemen_kode: string[];
  subbab: string[];
  saran_panca_cinta: Array<{ topik_kode: string; alasan: string }>;
  saran_dpl: number[];
}

export interface SaveBabBankDataPayload {
  id?: string;
  bab: string;
  semester: 1 | 2;
  urutan?: number;
  subbab?: string[];
  kata_kunci?: string[];
  deskripsi?: string;
  originalUrutan?: number;
}

type AnalisisCpInsert = Database["public"]["Tables"]["analisis_cp"]["Insert"];
type TujuanPembelajaranInsert = Database["public"]["Tables"]["tujuan_pembelajaran"]["Insert"];
type AtpInsert = Database["public"]["Tables"]["atp"]["Insert"];
type AtpUpdate = Database["public"]["Tables"]["atp"]["Update"];

export interface PenugasanCardItem {
  id: string;
  tingkat_kelas: 7 | 8 | 9;
  rombel: string;
  mapel: {
    id: string;
    nama: string;
    kode: string;
    kelompok: string;
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
    aktif: boolean;
  };
  jumlah_elemen_cp: number;
  jumlah_tp: number;
  total_jp: number;
  terisi_jp_smt1: number;
  terisi_jp_smt2: number;
  target_jp: number;
  total_minggu_efektif: number;
  target_jp_smt1: number;
  target_jp_smt2: number;
  minggu_efektif_smt1: number;
  minggu_efektif_smt2: number;
  atp_status: DocStatus;
  metode_pengurutan: MetodePengurutanAtp;
  atp_id: string | null;
}

export interface AnalisisCpItemPayload {
  id?: string;
  cp_id: string;
  materi_pokok: string;
  kompetensi?: string;
  kata_kunci: string[];
  benang_merah: string;
  dpl_ids: string[];
  panca_cinta_ids: string[];
  alokasi_jp?: number;
  urutan?: number;
}

export interface TujuanPembelajaranPayload {
  id?: string;
  analisis_cp_id: string;
  kode_tp: string;
  deskripsi: string;
  kompetensi?: string;
  lingkup_materi?: string;
  konteks?: string;
  panca_cinta_ids: string[];
  dpl_ids: string[];
  semester: 1 | 2;
  alokasi_jp: number;
  urutan: number;
  kktp?: KktpData;
}

/**
 * 1. Mengambil daftar penugasan guru di tahun ajaran aktif
 */
export async function getPenugasanListAction(): Promise<{
  success: boolean;
  data: PenugasanCardItem[];
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, data: [], error: "Sesi tidak valid. Silakan login." };
    }

    const supabase = await createClient();

    // Dapatkan tahun ajaran aktif beserta tanggal semester
    const { data: activeTa, error: taErr } = await supabase
      .from("tahun_ajaran")
      .select("id, nama, smt1_mulai, smt1_selesai, smt2_mulai, smt2_selesai, aktif")
      .eq("aktif", true)
      .maybeSingle();

    if (taErr || !activeTa) {
      return { success: false, data: [], error: "Tahun ajaran aktif belum ditentukan oleh admin." };
    }

    // Ambil kalender kegiatan pemotong dan data preferensi hari sekolah secara paralel
    const [kalenderRes, madrasahRes] = await Promise.all([
      supabase
        .from("kalender_kegiatan")
        .select("id, tgl_mulai, tgl_selesai, jenis, keterangan, memotong_minggu_efektif")
        .eq("tahun_ajaran_id", activeTa.id),
      supabase
        .from("madrasah")
        .select("hari_sekolah")
        .limit(1)
        .maybeSingle(),
    ]);

    const kalenderRows = kalenderRes.data || [];
    const hariSekolah = (madrasahRes.data?.hari_sekolah === 5 ? 5 : 6) as 5 | 6;

    // Bangun query penugasan
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

    // Jika role guru, hanya tampilkan penugasannya sendiri
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

    // Ambil dokumen ATP dan analisis_cp per penugasan secara paralel
    const [atpRes, analisisRes] = await Promise.all([
      supabase
        .from("atp")
        .select("id, penugasan_id, status, metode_pengurutan")
        .in("penugasan_id", penugasanIds),
      supabase
        .from("analisis_cp")
        .select("id, penugasan_id")
        .in("penugasan_id", penugasanIds),
    ]);

    const atpRows = atpRes.data;
    const analisisRows = analisisRes.data;

    const atpMap = new Map<string, { id: string; status: DocStatus; metode_pengurutan: MetodePengurutanAtp }>();
    atpRows?.forEach((row) => {
      atpMap.set(row.penugasan_id, {
        id: row.id,
        status: (row.status as DocStatus) || "draf",
        metode_pengurutan: (row.metode_pengurutan as MetodePengurutanAtp) || "konkret_ke_abstrak",
      });
    });

    const analisisIds = (analisisRows || []).map((a) => a.id);
    const { data: tpRows } = analisisIds.length > 0
      ? await supabase
          .from("tujuan_pembelajaran")
          .select("id, analisis_cp_id, alokasi_jp, semester")
          .in("analisis_cp_id", analisisIds)
      : { data: [] };

    // Agregasi jumlah elemen CP & TP per penugasan (termasuk breakdown Smt 1 & Smt 2)
    const countMap = new Map<
      string,
      { cpCount: number; tpCount: number; totalJp: number; smt1Jp: number; smt2Jp: number }
    >();
    penugasanIds.forEach((id) =>
      countMap.set(id, { cpCount: 0, tpCount: 0, totalJp: 0, smt1Jp: 0, smt2Jp: 0 })
    );

    const analisisToPenugasan = new Map<string, string>();
    analisisRows?.forEach((a) => {
      analisisToPenugasan.set(a.id, a.penugasan_id);
      const cur = countMap.get(a.penugasan_id) || { cpCount: 0, tpCount: 0, totalJp: 0, smt1Jp: 0, smt2Jp: 0 };
      cur.cpCount += 1;
      countMap.set(a.penugasan_id, cur);
    });

    tpRows?.forEach((tp) => {
      const penId = analisisToPenugasan.get(tp.analisis_cp_id);
      if (penId) {
        const cur = countMap.get(penId) || { cpCount: 0, tpCount: 0, totalJp: 0, smt1Jp: 0, smt2Jp: 0 };
        cur.tpCount += 1;
        const jp = Number(tp.alokasi_jp || 0);
        cur.totalJp += jp;
        if (tp.semester === 1) cur.smt1Jp += jp;
        if (tp.semester === 2) cur.smt2Jp += jp;
        countMap.set(penId, cur);
      }
    });

    // Format hasil kartu dengan perhitungan kalender & target JP efektif
    const result: PenugasanCardItem[] = penugasanRows.map((p) => {
      const mapelData = Array.isArray(p.mapel) ? p.mapel[0] : p.mapel;
      const guruData = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      const taData = Array.isArray(p.tahun_ajaran) ? p.tahun_ajaran[0] : p.tahun_ajaran;
      const atpData = atpMap.get(p.id);
      const counts = countMap.get(p.id) || { cpCount: 0, tpCount: 0, totalJp: 0, smt1Jp: 0, smt2Jp: 0 };

      const jpField =
        p.tingkat_kelas === 7
          ? mapelData?.jp_per_minggu_kls7
          : p.tingkat_kelas === 8
            ? mapelData?.jp_per_minggu_kls8
            : mapelData?.jp_per_minggu_kls9;
      const jpPerMinggu = Number(jpField || 2);

      // Hitung Minggu Efektif & Target JP setelah dipotong libur kegiatan kalender
      const analisis = hitungMingguEfektif({
        tahunAjaran: {
          id: activeTa.id,
          nama: activeTa.nama,
          smt1_mulai: activeTa.smt1_mulai || "2026-07-13",
          smt1_selesai: activeTa.smt1_selesai || "2026-12-19",
          smt2_mulai: activeTa.smt2_mulai || "2027-01-04",
          smt2_selesai: activeTa.smt2_selesai || "2027-06-26",
        },
        kalenderKegiatan: (kalenderRows || []) as KalenderKegiatanInput[],
        jpPerMinggu,
        hariSekolah,
      });

      return {
        id: p.id,
        tingkat_kelas: p.tingkat_kelas as 7 | 8 | 9,
        rombel: p.rombel || "",
        mapel: {
          id: mapelData?.id || "",
          nama: mapelData?.nama || "Mapel",
          kode: mapelData?.kode || "",
          kelompok: mapelData?.kelompok || "umum",
          jp_per_minggu: jpPerMinggu,
        },
        guru: {
          id: guruData?.id || "",
          nama_lengkap: guruData?.nama_lengkap || "Guru",
          nip: guruData?.nip || null,
        },
        tahun_ajaran: {
          id: taData?.id || "",
          nama: taData?.nama || "2026/2027",
          aktif: Boolean(taData?.aktif),
        },
        jumlah_elemen_cp: counts.cpCount,
        jumlah_tp: counts.tpCount,
        total_jp: counts.totalJp,
        terisi_jp_smt1: counts.smt1Jp,
        terisi_jp_smt2: counts.smt2Jp,
        target_jp: analisis.totalTahun.jpEfektif,
        total_minggu_efektif: analisis.totalTahun.totalMingguEfektif,
        target_jp_smt1: analisis.semester1.jpEfektif,
        target_jp_smt2: analisis.semester2.jpEfektif,
        minggu_efektif_smt1: analisis.semester1.totalMingguEfektif,
        minggu_efektif_smt2: analisis.semester2.totalMingguEfektif,
        atp_status: atpData?.status || "draf",
        metode_pengurutan: atpData?.metode_pengurutan || "konkret_ke_abstrak",
        atp_id: atpData?.id || null,
      };
    });

    return { success: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan internal";
    return { success: false, data: [], error: message };
  }
}

/**
 * 2. Mengambil data lengkap Wizard (Langkah 1, 2, 3)
 */
export async function getWizardDataAction(penugasanId: string) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi tidak valid." };
    }

    const supabase = await createClient();

    // 1. Ambil Penugasan
    const { data: penugasan, error: pErr } = await supabase
      .from("penugasan")
      .select(`
        id,
        tingkat_kelas,
        rombel,
        guru_id,
        mapel_id,
        tahun_ajaran_id,
        mapel ( id, nama, kode, kelompok, jp_per_minggu_kls7, jp_per_minggu_kls8, jp_per_minggu_kls9 ),
        profiles ( id, nama_lengkap, nip ),
        tahun_ajaran ( id, nama, smt1_mulai, smt1_selesai, smt2_mulai, smt2_selesai, aktif )
      `)
      .eq("id", penugasanId)
      .single();

    if (pErr || !penugasan) {
      return { success: false, error: "Penugasan tidak ditemukan." };
    }

    // Guard: Guru hanya bisa membuka penugasannya sendiri
    if (session.role === "guru" && penugasan.guru_id !== session.user.id) {
      return { success: false, error: "Anda tidak memiliki akses ke penugasan guru lain." };
    }

    const mapelData = Array.isArray(penugasan.mapel) ? penugasan.mapel[0] : penugasan.mapel;

    // 2. Ambil Master Capaian Pembelajaran Fase D untuk mapel ini
    const { data: rawCpElements, error: cpErr } = await supabase
      .from("capaian_pembelajaran")
      .select("id, mapel_id, fase, elemen, kode_elemen, deskripsi_cp, sumber_regulasi")
      .eq("mapel_id", penugasan.mapel_id)
      .order("elemen", { ascending: true });

    if (cpErr) {
      return { success: false, error: "Gagal memuat capaian pembelajaran: " + cpErr.message };
    }

    // 3. Ambil Master Panca Cinta & Dimensi Profil Lulusan
    const { data: pancaCintaList } = await supabase
      .from("panca_cinta")
      .select("id, urutan, kode, nama, deskripsi")
      .order("urutan", { ascending: true });

    const { data: dplList } = await supabase
      .from("dimensi_profil_lulusan")
      .select("id, kode, nama, elemen_kunci")
      .order("kode", { ascending: true });

    // 4. Ambil Analisis CP yang sudah tersimpan untuk penugasan ini
    const { data: analisisRows, error: aErr } = await supabase
      .from("analisis_cp")
      .select("*")
      .eq("penugasan_id", penugasanId);

    if (aErr) {
      return { success: false, error: "Gagal memuat analisis CP: " + aErr.message };
    }

    // Normalisasi fallback jika kolom baru belum diterapkan secara natif
    const parsedAnalisis = (analisisRows || [])
      .map((row, idx) => {
        let kataKunci: string[] = Array.isArray(row.kata_kunci) ? row.kata_kunci : [];
        let benangMerah: string = row.benang_merah || "";
        let dplIds: string[] = Array.isArray(row.dpl_ids) ? row.dpl_ids : [];
        let pancaCintaIds: string[] = Array.isArray(row.panca_cinta_ids) ? row.panca_cinta_ids : [];
        let kompetensiText = row.kompetensi || "";

        // Cek apakah data tersimpan di format JSON di dalam kolom kompetensi
        if (kompetensiText.startsWith("{") && kompetensiText.endsWith("}")) {
          try {
            const parsed = JSON.parse(kompetensiText);
            if (parsed.kata_kunci && kataKunci.length === 0) kataKunci = parsed.kata_kunci;
            if (parsed.benang_merah && !benangMerah) benangMerah = parsed.benang_merah;
            if (parsed.dpl_ids && dplIds.length === 0) dplIds = parsed.dpl_ids;
            if (parsed.panca_cinta_ids && pancaCintaIds.length === 0) pancaCintaIds = parsed.panca_cinta_ids;
            if (parsed.kompetensi) kompetensiText = parsed.kompetensi;
          } catch {
            // ignore
          }
        }

        return {
          id: row.id,
          penugasan_id: row.penugasan_id,
          cp_id: row.cp_id,
          materi_pokok: row.materi_pokok || "",
          kompetensi: kompetensiText,
          kata_kunci: kataKunci,
          benang_merah: benangMerah,
          dpl_ids: dplIds,
          panca_cinta_ids: pancaCintaIds,
          alokasi_jp: row.alokasi_jp || 2,
          urutan: Number((row as any).urutan ?? (idx + 1)),
          status: row.status as DocStatus,
        };
      })
      .sort((a, b) => (a.urutan || 1) - (b.urutan || 1));

    // 5. Ambil Tujuan Pembelajaran (TP)
    const analisisIds = parsedAnalisis.map((a) => a.id);
    let tpList: TujuanPembelajaranPayload[] = [];
    if (analisisIds.length > 0) {
      const { data: tpRows, error: tpErr } = await supabase
        .from("tujuan_pembelajaran")
        .select("*")
        .in("analisis_cp_id", analisisIds)
        .order("urutan", { ascending: true });

      if (tpErr) {
        return { success: false, error: "Gagal memuat TP: " + tpErr.message };
      }

      // Peta urutan analisis CP agar TP otomatis tersusun mengikut urutan CP
      const analisisOrderMap = new Map<string, number>();
      analisisIds.forEach((id, idx) => analisisOrderMap.set(id, idx));

      const analisisDplMap = new Map<string, string[]>();
      const analisisPcMap = new Map<string, string[]>();
      parsedAnalisis.forEach((a) => {
        analisisDplMap.set(a.id, a.dpl_ids || []);
        analisisPcMap.set(a.id, a.panca_cinta_ids || []);
      });

      tpList = (tpRows || [])
        .map((tp) => {
          const semester = tp.semester || 1;
          const kktp = (tp.kktp as unknown as KktpData) || undefined;
          const kompetensi = tp.kompetensi || "";
          const lingkupMateri = tp.lingkup_materi || "";
          const konteks = tp.konteks || "";

          // DPL diisi dari yang telah dicentang di CP jika TP belum terisi
          const effectiveDpls =
            Array.isArray(tp.dpl_ids) && tp.dpl_ids.length > 0
              ? tp.dpl_ids
              : (analisisDplMap.get(tp.analisis_cp_id) || []);

          const effectivePcs =
            Array.isArray(tp.panca_cinta_ids) && tp.panca_cinta_ids.length > 0
              ? tp.panca_cinta_ids
              : (analisisPcMap.get(tp.analisis_cp_id) || []);

          return {
            id: tp.id,
            analisis_cp_id: tp.analisis_cp_id,
            kode_tp: tp.kode_tp,
            deskripsi: tp.deskripsi,
            kompetensi,
            lingkup_materi: lingkupMateri,
            konteks,
            panca_cinta_ids: effectivePcs,
            dpl_ids: effectiveDpls,
            semester: (semester === 2 ? 2 : 1) as 1 | 2,
            alokasi_jp: Number(tp.alokasi_jp || 2),
            urutan: Number(tp.urutan || 1),
            kktp,
          };
        })
        .sort((a, b) => {
          const ordA = analisisOrderMap.has(a.analisis_cp_id) ? analisisOrderMap.get(a.analisis_cp_id)! : 999;
          const ordB = analisisOrderMap.has(b.analisis_cp_id) ? analisisOrderMap.get(b.analisis_cp_id)! : 999;
          if (ordA !== ordB) return ordA - ordB;
          return (a.urutan || 1) - (b.urutan || 1);
        });

      // Hitung akumulasi alokasi_jp per elemen CP (analisis_cp) dari seluruh TP yang ada
      const tpJpByAnalisisId = new Map<string, number>();
      const tpCountByAnalisisId = new Map<string, number>();
      tpList.forEach((tp) => {
        tpJpByAnalisisId.set(
          tp.analisis_cp_id,
          (tpJpByAnalisisId.get(tp.analisis_cp_id) || 0) + Number(tp.alokasi_jp || 0)
        );
        tpCountByAnalisisId.set(
          tp.analisis_cp_id,
          (tpCountByAnalisisId.get(tp.analisis_cp_id) || 0) + 1
        );
      });

      parsedAnalisis.forEach((a) => {
        if ((tpCountByAnalisisId.get(a.id) || 0) > 0) {
          a.alokasi_jp = tpJpByAnalisisId.get(a.id) || 0;
        }
      });
    }

    // 6. Ambil Dokumen ATP
    const { data: atpDoc } = await supabase
      .from("atp")
      .select("*")
      .eq("penugasan_id", penugasanId)
      .maybeSingle();

    // 7. Ambil Bank Data Materi & Verifikasi
    const allBankMapel = getAllMapelBankData();
    const mapelNamaNorm = (mapelData?.nama || "").toLowerCase();
    const mapelRecord = mapelData as { slug?: string | null; status_verifikasi?: string | null } | null;
    const matchedBankMapel = allBankMapel.find(
      (m) =>
        m.slug === mapelRecord?.slug ||
        mapelNamaNorm.includes(m.slug.replace(/-/g, " ")) ||
        m.mapel.toLowerCase().includes(mapelNamaNorm) ||
        mapelNamaNorm.includes(m.mapel.toLowerCase()) ||
        (mapelNamaNorm.includes("ski") && m.slug === "ski") ||
        (mapelNamaNorm.includes("sejarah kebudayaan") && m.slug === "ski")
    );

    let materiList: WizardMateriItem[] = [];
    try {
      const { data: dbMateri } = await supabase
        .from("materi_pelajaran")
        .select("*")
        .eq("mapel_id", penugasan.mapel_id)
        .eq("tingkat", penugasan.tingkat_kelas as 7 | 8 | 9)
        .order("semester")
        .order("urutan");
      if (dbMateri && dbMateri.length > 0) {
        materiList = dbMateri.map((m) => {
          const spcRaw = (m.saran_panca_cinta as unknown as Array<{ id?: number; topik_kode?: string; alasan: string }>) || [];
          const bankMatch = matchedBankMapel?.materi.find(
            (bm) =>
              bm.tingkat === m.tingkat &&
              (bm.urutan === m.urutan ||
                bm.bab.toLowerCase().trim() === m.bab.toLowerCase().trim() ||
                m.bab.toLowerCase().includes(bm.bab.toLowerCase().replace(/^bab\s*\d+:\s*/i, "").trim()) ||
                bm.bab.toLowerCase().includes(m.bab.toLowerCase().replace(/^bab\s*\d+:\s*/i, "").trim()))
          );
          const finalDeskripsi =
            (m as any).deskripsi ||
            bankMatch?.deskripsi ||
            bankMatch?.saran_panca_cinta?.[0]?.alasan ||
            "";

          // Pastikan jika dari DB kata_kunci kosong (array [] default postgres), tetap fallback ke bankMatch
          const dbKataKunci =
            Array.isArray((m as any).kata_kunci) && (m as any).kata_kunci.length > 0
              ? (m as any).kata_kunci
              : null;
          const finalKataKunci = dbKataKunci || bankMatch?.kata_kunci || [];

          return {
            id: m.id,
            tingkat: m.tingkat,
            semester: m.semester,
            urutan: m.urutan,
            bab: m.bab,
            deskripsi: finalDeskripsi,
            kata_kunci: finalKataKunci,
            elemen_kode: bankMatch?.elemen_kode || (m as any).elemen_kode || [],
            subbab: m.subbab || [],
            saran_panca_cinta: spcRaw.map((s) => ({
              topik_kode: s.topik_kode || `PC${s.id}`,
              alasan: s.alasan,
            })),
            saran_dpl: m.saran_dpl || [],
          };
        });
      }
    } catch {
      // ignore
    }

    if (materiList.length === 0 && matchedBankMapel) {
      materiList = matchedBankMapel.materi
        .filter((m) => m.tingkat === penugasan.tingkat_kelas)
        .map((m) => ({
          tingkat: m.tingkat,
          semester: m.semester,
          urutan: m.urutan,
          bab: m.bab,
          deskripsi: m.deskripsi || m.saran_panca_cinta?.[0]?.alasan || "",
          kata_kunci: m.kata_kunci || [],
          elemen_kode: m.elemen_kode || [],
          subbab: m.subbab,
          saran_panca_cinta: m.saran_panca_cinta.map((s) => ({
            topik_kode: `PC${s.id}`,
            alasan: s.alasan,
          })),
          saran_dpl: m.saran_dpl,
        }));
    }

    const isVerified =
      mapelRecord?.status_verifikasi === "terverifikasi" ||
      (!("status_verifikasi" in (mapelData || {})) && matchedBankMapel?.status === "LENGKAP");

    const kkoData = getBankDataKko();
    const manifest = getBankDataManifest();

    // 8. Filter Elemen CP agar HANYA memunculkan elemen yang diajarkan pada tingkat kelas guru (7, 8, atau 9)
    let filteredCpElements = rawCpElements || [];

    if (matchedBankMapel) {
      // a. Ambil materi bab yang diajarkan pada tingkat kelas penugasan guru ini
      const gradeMateri = matchedBankMapel.materi.filter((m) => m.tingkat === penugasan.tingkat_kelas);
      const activeElemenKodes = new Set<string>();
      gradeMateri.forEach((m) => {
        (m.elemen_kode || []).forEach((code) => activeElemenKodes.add(code));
      });

      // b. Ambil elemen bank data kurikulum resmi yang aktif pada tingkat kelas ini
      const activeBankElemen = matchedBankMapel.elemen.filter((e) => activeElemenKodes.has(e.kode));

      // c. Ambil ID elemen yang dirujuk langsung oleh materi_pelajaran tingkat ini di database
      const activeCpIdsFromDb = new Set<string>();
      if (materiList && materiList.length > 0) {
        // jika materiList diambil dari DB atau matchedBankMapel
        const { data: dbMateriAktif } = await supabase
          .from("materi_pelajaran")
          .select("elemen_cp_ids")
          .eq("mapel_id", penugasan.mapel_id)
          .eq("tingkat", penugasan.tingkat_kelas as 7 | 8 | 9);
        dbMateriAktif?.forEach((m) => {
          (m.elemen_cp_ids || []).forEach((id: string) => activeCpIdsFromDb.add(id));
        });
      }

      // d. Simpan CP yang sudah pernah dianalisis sebelumnya oleh guru agar data tersimpan aman
      const alreadyAnalyzedCpIds = new Set(parsedAnalisis.map((a) => a.cp_id));

      const normalizeStr = (str: string) =>
        (str || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();

      // e. Saring rawCpElements dari DB
      filteredCpElements = (rawCpElements || []).filter((cp) => {
        // Jika sudah dianalisis guru di penugasan ini, selalu pertahankan
        if (alreadyAnalyzedCpIds.has(cp.id)) return true;

        // Jika dirujuk langsung oleh materi_pelajaran tingkat ini di DB
        if (activeCpIdsFromDb.has(cp.id)) return true;

        // Jika kode elemen cocok dengan materi tingkat ini
        if (cp.kode_elemen && activeElemenKodes.has(cp.kode_elemen)) return true;

        // Jika nama elemen cocok dengan elemen aktif tingkat ini di bank data kurikulum
        return activeBankElemen.some(
          (abe) =>
            normalizeStr(abe.nama) === normalizeStr(cp.elemen) ||
            cp.elemen.toLowerCase().includes(abe.nama.toLowerCase()) ||
            abe.nama.toLowerCase().includes(cp.elemen.toLowerCase())
        );
      });

      // f. Hilangkan duplikasi jika ada elemen serupa
      const seenElemen = new Set<string>();
      filteredCpElements = filteredCpElements.filter((cp) => {
        const norm = normalizeStr(cp.elemen);
        if (seenElemen.has(norm)) return false;
        seenElemen.add(norm);
        return true;
      });

      // g. Fallback jika tabel DB belum terisi tetapi bank data memiliki elemen aktif tingkat ini
      if (filteredCpElements.length === 0 && activeBankElemen.length > 0) {
        filteredCpElements = activeBankElemen.map((abe) => ({
          id: (rawCpElements || []).find((c) => normalizeStr(c.elemen) === normalizeStr(abe.nama))?.id || `bank-${abe.kode}`,
          mapel_id: penugasan.mapel_id,
          fase: "D",
          elemen: abe.nama,
          kode_elemen: abe.kode,
          deskripsi_cp: abe.deskripsi_cp,
          sumber_regulasi: matchedBankMapel.sumber_cp?.regulasi_kode || "KMA 1503/2025",
        }));
      }
    }

    // Gabungkan seluruh elemen dari DB dan Bank Data untuk mapel ini
    const normalizeStr = (str: string) =>
      (str || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();

    const allCpElements: Array<{
      id: string;
      elemen: string;
      kode_elemen?: string;
      deskripsi_cp: string;
      sumber_regulasi?: string;
    }> = [];

    const addedElemenNorms = new Set<string>();

    (rawCpElements || []).forEach((cp) => {
      const norm = normalizeStr(cp.elemen);
      if (!addedElemenNorms.has(norm)) {
        addedElemenNorms.add(norm);
        allCpElements.push({
          id: cp.id,
          elemen: cp.elemen,
          kode_elemen: cp.kode_elemen || undefined,
          deskripsi_cp: cp.deskripsi_cp,
          sumber_regulasi: cp.sumber_regulasi || undefined,
        });
      }
    });

    if (matchedBankMapel) {
      matchedBankMapel.elemen.forEach((be) => {
        const norm = normalizeStr(be.nama);
        if (!addedElemenNorms.has(norm)) {
          addedElemenNorms.add(norm);
          allCpElements.push({
            id: (rawCpElements || []).find((c) => normalizeStr(c.elemen) === norm)?.id || `bank-${be.kode}`,
            elemen: be.nama,
            kode_elemen: be.kode,
            deskripsi_cp: be.deskripsi_cp,
            sumber_regulasi: matchedBankMapel.sumber_cp?.regulasi_kode || "KMA 1503/2025",
          });
        }
      });
    }

    // Hitung Minggu Efektif & Target JP Kalender untuk penugasan ini
    const taData = Array.isArray(penugasan.tahun_ajaran) ? penugasan.tahun_ajaran[0] : penugasan.tahun_ajaran;
    const jpField =
      penugasan.tingkat_kelas === 7
        ? mapelData?.jp_per_minggu_kls7
        : penugasan.tingkat_kelas === 8
          ? mapelData?.jp_per_minggu_kls8
          : mapelData?.jp_per_minggu_kls9;
    const jpPerMinggu = Number(jpField || 2);

    const [kalenderRes, madrasahRes] = await Promise.all([
      supabase
        .from("kalender_kegiatan")
        .select("id, tgl_mulai, tgl_selesai, jenis, keterangan, memotong_minggu_efektif")
        .eq("tahun_ajaran_id", penugasan.tahun_ajaran_id),
      supabase
        .from("madrasah")
        .select("hari_sekolah")
        .limit(1)
        .maybeSingle(),
    ]);

    const kalenderRows = kalenderRes.data || [];
    const hariSekolah = (madrasahRes.data?.hari_sekolah === 5 ? 5 : 6) as 5 | 6;

    const analisisMinggu = hitungMingguEfektif({
      tahunAjaran: {
        id: taData?.id || penugasan.tahun_ajaran_id,
        nama: taData?.nama,
        smt1_mulai: taData?.smt1_mulai || "2026-07-13",
        smt1_selesai: taData?.smt1_selesai || "2026-12-19",
        smt2_mulai: taData?.smt2_mulai || "2027-01-04",
        smt2_selesai: taData?.smt2_selesai || "2027-06-26",
      },
      kalenderKegiatan: (kalenderRows || []) as KalenderKegiatanInput[],
      jpPerMinggu,
      hariSekolah,
    });

    const targetJp: TargetJpInfo = {
      total: analisisMinggu.totalTahun.jpEfektif,
      totalMingguEfektif: analisisMinggu.totalTahun.totalMingguEfektif,
      smt1: analisisMinggu.semester1.jpEfektif,
      smt1MingguEfektif: analisisMinggu.semester1.totalMingguEfektif,
      smt2: analisisMinggu.semester2.jpEfektif,
      smt2MingguEfektif: analisisMinggu.semester2.totalMingguEfektif,
    };

    return {
      success: true,
      data: {
        penugasan: {
          id: penugasan.id,
          tingkat_kelas: penugasan.tingkat_kelas as 7 | 8 | 9,
          rombel: penugasan.rombel,
          mapel: mapelData,
          guru: penugasan.profiles,
          tahun_ajaran: penugasan.tahun_ajaran,
        },
        cpElements: filteredCpElements,
        allCpElements,
        pancaCintaList: pancaCintaList || [],
        dplList: dplList || [],
        analisisList: parsedAnalisis,
        tpList,
        materiPelajaran: materiList,
        bankDataVerified: Boolean(isVerified),
        kkoList: kkoData.kognitif || [],
        sumberRegulasi: matchedBankMapel?.sumber_cp?.regulasi_kode || "KMA 1503/2025",
        versiBankData: manifest.versi || "2026-2027-v1",
        targetJp,
        atp: atpDoc
          ? {
              id: atpDoc.id,
              status: (atpDoc.status as DocStatus) || "draf",
              metode_pengurutan: (atpDoc.metode_pengurutan as MetodePengurutanAtp) || "konkret_ke_abstrak",
              catatan_validator: atpDoc.catatan_validator || null,
            }
          : {
              id: null,
              status: "draf" as DocStatus,
              metode_pengurutan: "konkret_ke_abstrak" as MetodePengurutanAtp,
              catatan_validator: null,
            },
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem internal";
    return { success: false, error: msg };
  }
}

/**
 * 3. Menyimpan Hasil Langkah 1: Analisis CP (Pemetaan CP, Materi, DPL, Panca Cinta)
 */
export async function saveAnalisisCpAction(
  penugasanId: string,
  items: AnalisisCpItemPayload[],
  deletedIds?: string[]
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi kedaluwarsa. Silakan login kembali." };
    }

    const supabase = await createClient();

    // Verifikasi kepemilikan penugasan
    const { data: pCheck } = await supabase
      .from("penugasan")
      .select("id, guru_id, mapel_id, tingkat_kelas")
      .eq("id", penugasanId)
      .single();

    if (!pCheck) {
      return { success: false, error: "Penugasan tidak ditemukan." };
    }

    if (session.role === "guru" && pCheck.guru_id !== session.user.id) {
      return { success: false, error: "Akses ditolak: bukan penugasan Anda." };
    }

    // 1. Hapus baris yang dihapus guru (jika ada)
    if (deletedIds && deletedIds.length > 0) {
      const validDbDeletedIds = deletedIds.filter(
        (id) => !id.startsWith("card-") && !id.startsWith("temp-") && !id.startsWith("bank-")
      );
      if (validDbDeletedIds.length > 0) {
        await supabase
          .from("analisis_cp")
          .delete()
          .in("id", validDbDeletedIds)
          .eq("penugasan_id", penugasanId);
      }
    }

    // 2. Simpan per item dengan mempertahankan urutan
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemUrutan = item.urutan || i + 1;
      let realCpId = item.cp_id;

      // Jika cp_id merupakan referensi bank data ("bank-E3"), cari atau buat di DB
      if (realCpId.startsWith("bank-")) {
        const kode = realCpId.replace(/^bank-/, "");
        const { data: foundCp } = await supabase
          .from("capaian_pembelajaran")
          .select("id")
          .eq("mapel_id", pCheck.mapel_id)
          .eq("kode_elemen", kode)
          .maybeSingle();

        if (foundCp) {
          realCpId = foundCp.id;
        } else {
          const allBank = getAllMapelBankData();
          const bElemen = allBank.flatMap((m) => m.elemen).find((e) => e.kode === kode);
          if (bElemen) {
            const { data: newCp } = await supabase
              .from("capaian_pembelajaran")
              .insert({
                mapel_id: pCheck.mapel_id,
                fase: "D",
                elemen: bElemen.nama,
                kode_elemen: bElemen.kode,
                deskripsi_cp: bElemen.deskripsi_cp,
                sumber_regulasi: "KMA 1503/2025",
              })
              .select("id")
              .single();
            if (newCp) realCpId = newCp.id;
          }
        }
      }

      const isExistingDbId =
        Boolean(item.id) &&
        !item.id!.startsWith("card-") &&
        !item.id!.startsWith("temp-") &&
        !item.id!.startsWith("bank-");

      const payload: AnalisisCpInsert = {
        penugasan_id: penugasanId,
        cp_id: realCpId,
        materi_pokok: item.materi_pokok || "Materi Pokok Belum Diisi",
        kompetensi: item.kompetensi || "Memahami dan Mengaplikasi",
        alokasi_jp: item.alokasi_jp || 2,
        urutan: itemUrutan,
        status: "draf",
        created_by: session.user.id,
        updated_at: new Date().toISOString(),
      };

      if (isExistingDbId && item.id) {
        payload.id = item.id;
      }

      // Simpan dengan kolom native
      const fullPayload: AnalisisCpInsert = {
        ...payload,
        kata_kunci: item.kata_kunci || [],
        benang_merah: item.benang_merah || "",
        dpl_ids: item.dpl_ids || [],
        panca_cinta_ids: item.panca_cinta_ids || [],
        urutan: itemUrutan,
      };

      let saveErr: any = null;
      if (isExistingDbId) {
        const res = await supabase.from("analisis_cp").upsert(fullPayload);
        saveErr = res.error;
      } else {
        const res = await supabase.from("analisis_cp").insert(fullPayload);
        saveErr = res.error;
      }

      // Jika kolom native belum tersedia di DB, fallback simpan metadata ke JSON dalam kolom kompetensi
      if (saveErr && saveErr.message.includes("column")) {
        const fallbackCompetence = JSON.stringify({
          kompetensi: item.kompetensi || "",
          kata_kunci: item.kata_kunci || [],
          benang_merah: item.benang_merah || "",
          dpl_ids: item.dpl_ids || [],
          panca_cinta_ids: item.panca_cinta_ids || [],
          urutan: itemUrutan,
        });

        payload.kompetensi = fallbackCompetence;
        delete (payload as any).urutan;
        if (isExistingDbId) {
          await supabase.from("analisis_cp").upsert(payload);
        } else {
          await supabase.from("analisis_cp").insert(payload);
        }
      } else if (saveErr) {
        return { success: false, error: "Gagal menyimpan analisis: " + saveErr.message };
      }
    }

    // 3. Sinkronkan urutan dan kode TP di database agar otomatis mengikuti urutan CP baru
    try {
      const savedAnalisisRows = await supabase
        .from("analisis_cp")
        .select("id, cp_id")
        .eq("penugasan_id", penugasanId);

      if (savedAnalisisRows.data && savedAnalisisRows.data.length > 0) {
        const currentCpOrderMap = new Map<string, number>();
        items.forEach((item, idx) => {
          if (item.id) currentCpOrderMap.set(item.id, idx);
          currentCpOrderMap.set(item.cp_id, idx);
        });

        const allAnalisisIds = savedAnalisisRows.data.map((r) => r.id);
        const { data: existingTps } = await supabase
          .from("tujuan_pembelajaran")
          .select("id, analisis_cp_id, urutan, kode_tp, alokasi_jp")
          .in("analisis_cp_id", allAnalisisIds);

        if (existingTps && existingTps.length > 0) {
          // Sinkronkan akumulasi JP per elemen CP dari TP
          const tpJpSumMap = new Map<string, number>();
          existingTps.forEach((tp) => {
            tpJpSumMap.set(
              tp.analisis_cp_id,
              (tpJpSumMap.get(tp.analisis_cp_id) || 0) + (Number(tp.alokasi_jp) || 0)
            );
          });
          for (const [aId, totalJp] of tpJpSumMap.entries()) {
            if (totalJp > 0) {
              await supabase
                .from("analisis_cp")
                .update({ alokasi_jp: totalJp })
                .eq("id", aId);
            }
          }

          const sortedTps = [...existingTps].sort((a, b) => {
            const ordA = currentCpOrderMap.has(a.analisis_cp_id) ? currentCpOrderMap.get(a.analisis_cp_id)! : 999;
            const ordB = currentCpOrderMap.has(b.analisis_cp_id) ? currentCpOrderMap.get(b.analisis_cp_id)! : 999;
            if (ordA !== ordB) return ordA - ordB;
            return (a.urutan || 1) - (b.urutan || 1);
          });

          const tingkat = pCheck.tingkat_kelas || 7;
          for (let i = 0; i < sortedTps.length; i++) {
            const t = sortedTps[i];
            const newUrutan = i + 1;
            const newKodeTp = `${tingkat}.${newUrutan}`;
            if (t.urutan !== newUrutan || t.kode_tp !== newKodeTp) {
              await supabase
                .from("tujuan_pembelajaran")
                .update({ urutan: newUrutan, kode_tp: newKodeTp })
                .eq("id", t.id);
            }
          }
        }
      }
    } catch {
      // Ignore background sync errors if any
    }

    // Ambil data analisis_cp yang baru tersimpan dengan id UUID resmi dari database
    const { data: finalAnalisisRows } = await supabase
      .from("analisis_cp")
      .select("id, cp_id, materi_pokok, kompetensi, kata_kunci, benang_merah, dpl_ids, panca_cinta_ids, alokasi_jp, urutan")
      .eq("penugasan_id", penugasanId)
      .order("urutan", { ascending: true });

    revalidatePath(`/atp/${penugasanId}`);
    return { success: true, data: (finalAnalisisRows || []) as AnalisisCpItemPayload[] };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem";
    return { success: false, error: msg };
  }
}

/**
 * 4. Menyimpan Hasil Langkah 2: Tujuan Pembelajaran (TP)
 */
export async function saveTujuanPembelajaranAction(
  penugasanId: string,
  tpList: TujuanPembelajaranPayload[],
  deletedTpIds: string[] = []
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi kedaluwarsa." };
    }

    const supabase = await createClient();

    // Verifikasi penugasan
    const { data: pCheck } = await supabase
      .from("penugasan")
      .select("id, guru_id, mapel_id")
      .eq("id", penugasanId)
      .single();

    if (!pCheck) {
      return { success: false, error: "Penugasan tidak ditemukan." };
    }

    if (session.role === "guru" && pCheck.guru_id !== session.user.id) {
      return { success: false, error: "Akses ditolak." };
    }

    // Hapus TP yang ditandai untuk dihapus (hanya yang memiliki UUID DB valid)
    if (deletedTpIds.length > 0) {
      const validDbDeletedIds = deletedTpIds.filter(
        (id) => !id.startsWith("temp-") && !id.startsWith("card-")
      );
      if (validDbDeletedIds.length > 0) {
        await supabase.from("tujuan_pembelajaran").delete().in("id", validDbDeletedIds);
      }
    }

    // Ambil seluruh data analisis_cp yang ada di database untuk penugasan ini
    let { data: dbAnalisisList } = await supabase
      .from("analisis_cp")
      .select("id, cp_id, urutan, dpl_ids, panca_cinta_ids, kompetensi")
      .eq("penugasan_id", penugasanId)
      .order("urutan", { ascending: true });

    // Fallback darurat: Jika belum ada row di analisis_cp sama sekali
    if (!dbAnalisisList || dbAnalisisList.length === 0) {
      const { data: cpRows } = await supabase
        .from("capaian_pembelajaran")
        .select("id, elemen")
        .eq("mapel_id", pCheck.mapel_id)
        .order("elemen", { ascending: true })
        .limit(1);

      if (cpRows && cpRows.length > 0) {
        const { data: newAnalisis } = await supabase
          .from("analisis_cp")
          .insert({
            penugasan_id: penugasanId,
            cp_id: cpRows[0].id,
            materi_pokok: "Materi Pokok",
            kompetensi: "Memahami dan Menganalisis",
            alokasi_jp: 2,
            urutan: 1,
            status: "draf",
            created_by: session.user.id,
          })
          .select("id, cp_id, urutan, dpl_ids, panca_cinta_ids, kompetensi")
          .single();
        if (newAnalisis) {
          dbAnalisisList = [newAnalisis];
        }
      }
    }

    const aDplMap = new Map<string, string[]>();
    const aPcMap = new Map<string, string[]>();
    (dbAnalisisList || []).forEach((a: any) => {
      let dpls: string[] = Array.isArray(a.dpl_ids) ? a.dpl_ids : [];
      let pcs: string[] = Array.isArray(a.panca_cinta_ids) ? a.panca_cinta_ids : [];
      if (typeof a.kompetensi === "string" && a.kompetensi.startsWith("{") && a.kompetensi.endsWith("}")) {
        try {
          const parsed = JSON.parse(a.kompetensi);
          if (parsed.dpl_ids && dpls.length === 0) dpls = parsed.dpl_ids;
          if (parsed.panca_cinta_ids && pcs.length === 0) pcs = parsed.panca_cinta_ids;
        } catch {
          // ignore
        }
      }
      aDplMap.set(a.id, dpls);
      aPcMap.set(a.id, pcs);
    });

    const validAnalisisMap = new Map<string, string>();
    dbAnalisisList?.forEach((a, idx) => {
      validAnalisisMap.set(a.id, a.id);
      validAnalisisMap.set(`temp-${idx}`, a.id);
      validAnalisisMap.set(a.cp_id, a.id);
    });

    const defaultAnalisisId = dbAnalisisList?.[0]?.id || "";

    // Upsert masing-masing TP
    for (const tp of tpList) {
      // Pastikan analisis_cp_id adalah UUID valid yang merujuk ke tabel analisis_cp
      let resolvedAnalisisCpId = tp.analisis_cp_id;

      if (validAnalisisMap.has(resolvedAnalisisCpId)) {
        resolvedAnalisisCpId = validAnalisisMap.get(resolvedAnalisisCpId)!;
      } else if (resolvedAnalisisCpId?.startsWith("temp-")) {
        const match = resolvedAnalisisCpId.match(/^temp-(\d+)/);
        if (match) {
          const idx = parseInt(match[1], 10);
          resolvedAnalisisCpId = dbAnalisisList?.[idx]?.id || defaultAnalisisId;
        } else {
          resolvedAnalisisCpId = defaultAnalisisId;
        }
      } else {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(resolvedAnalisisCpId)) {
          resolvedAnalisisCpId = defaultAnalisisId;
        }
      }

      if (!resolvedAnalisisCpId) {
        return { success: false, error: "Gagal menyimpan TP: data analisis Capaian Pembelajaran belum ditemukan di database." };
      }

      const fallbackDpls = aDplMap.get(resolvedAnalisisCpId) || [];
      const fallbackPcs = aPcMap.get(resolvedAnalisisCpId) || [];

      const effectiveDpls =
        Array.isArray(tp.dpl_ids) && tp.dpl_ids.length > 0
          ? tp.dpl_ids
          : fallbackDpls;

      const effectivePcs =
        Array.isArray(tp.panca_cinta_ids) && tp.panca_cinta_ids.length > 0
          ? tp.panca_cinta_ids
          : fallbackPcs;

      const basePayload: TujuanPembelajaranInsert = {
        analisis_cp_id: resolvedAnalisisCpId,
        kode_tp: tp.kode_tp,
        deskripsi: tp.deskripsi,
        panca_cinta_ids: effectivePcs,
        dpl_ids: effectiveDpls,
        alokasi_jp: tp.alokasi_jp || 2,
        urutan: tp.urutan || 1,
        created_by: session.user.id,
        updated_at: new Date().toISOString(),
      };

      if (tp.id && !tp.id.startsWith("temp-")) {
        basePayload.id = tp.id;
      }

      // Payload lengkap dengan kolom tambahan
      const fullPayload: TujuanPembelajaranInsert = {
        ...basePayload,
        semester: tp.semester || 1,
        kompetensi: tp.kompetensi || "",
        lingkup_materi: tp.lingkup_materi || "",
        konteks: tp.konteks || "",
        kktp: (tp.kktp as unknown as Database["public"]["Tables"]["tujuan_pembelajaran"]["Insert"]["kktp"]) || null,
      };

      const { error: insErr } = await supabase
        .from("tujuan_pembelajaran")
        .upsert(fullPayload);

      // Fallback jika kolom baru belum ada di tabel remote
      if (insErr && insErr.message.includes("column")) {
        const { error: fallbackErr } = await supabase
          .from("tujuan_pembelajaran")
          .upsert(basePayload);

        if (fallbackErr) {
          return { success: false, error: "Gagal menyimpan TP: " + fallbackErr.message };
        }
      } else if (insErr) {
        return { success: false, error: "Gagal menyimpan TP: " + insErr.message };
      }
    }

    // Sinkronkan alokasi_jp pada analisis_cp berdasarkan akumulasi TP di dalamnya
    const targetAnalisisIds = (dbAnalisisList || []).map((a) => a.id);
    if (targetAnalisisIds.length > 0) {
      const { data: updatedTpRows } = await supabase
        .from("tujuan_pembelajaran")
        .select("analisis_cp_id, alokasi_jp")
        .in("analisis_cp_id", targetAnalisisIds);

      const jpSumMap = new Map<string, number>();
      (updatedTpRows || []).forEach((tp) => {
        jpSumMap.set(
          tp.analisis_cp_id,
          (jpSumMap.get(tp.analisis_cp_id) || 0) + (Number(tp.alokasi_jp) || 0)
        );
      });

      for (const a of dbAnalisisList || []) {
        const totalJp = jpSumMap.get(a.id);
        if (totalJp !== undefined && totalJp > 0) {
          await supabase
            .from("analisis_cp")
            .update({ alokasi_jp: totalJp, updated_at: new Date().toISOString() })
            .eq("id", a.id);
        }
      }
    }

    revalidatePath(`/atp/${penugasanId}`);
    revalidatePath(`/atp/${penugasanId}/preview-cp`);
    revalidatePath(`/atp/${penugasanId}/preview-tp`);
    revalidatePath(`/atp/${penugasanId}/preview`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem";
    return { success: false, error: msg };
  }
}

/**
 * 5. Menyimpan Hasil Langkah 3: Susun ATP (Urutan, Metode Pengurutan, Simpan Draf / Ajukan Validasi)
 */
export async function saveAtpOrderAndStatusAction(
  penugasanId: string,
  orderedTpItems: Array<{ id: string; urutan: number; kode_tp: string; semester: 1 | 2 }>,
  metodePengurutan: MetodePengurutanAtp,
  newStatus: DocStatus = "draf"
) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi kedaluwarsa." };
    }

    const supabase = await createClient();

    // Verifikasi penugasan
    const { data: pCheck } = await supabase
      .from("penugasan")
      .select("id, guru_id")
      .eq("id", penugasanId)
      .single();

    if (!pCheck) {
      return { success: false, error: "Penugasan tidak ditemukan." };
    }

    if (session.role === "guru" && pCheck.guru_id !== session.user.id) {
      return { success: false, error: "Akses ditolak." };
    }

    // 1. Update urutan, kode_tp, dan semester di tujuan_pembelajaran
    for (const item of orderedTpItems) {
      // Coba update dengan semester
      const { error: upErr } = await supabase
        .from("tujuan_pembelajaran")
        .update({
          urutan: item.urutan,
          kode_tp: item.kode_tp,
          semester: item.semester,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (upErr && upErr.message.includes("column")) {
        // Fallback tanpa kolom semester
        await supabase
          .from("tujuan_pembelajaran")
          .update({
            urutan: item.urutan,
            kode_tp: item.kode_tp,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);
      }
    }

    // 2. Simpan / Perbarui Dokumen ATP
    // Cek apakah sudah ada baris atp untuk penugasan ini
    const { data: existingAtp } = await supabase
      .from("atp")
      .select("id, status")
      .eq("penugasan_id", penugasanId)
      .maybeSingle();

    if (existingAtp) {
      const updateData: AtpUpdate = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        metode_pengurutan: metodePengurutan,
      };

      const { error: atpUpErr } = await supabase
        .from("atp")
        .update(updateData)
        .eq("id", existingAtp.id);

      if (atpUpErr && atpUpErr.message.includes("column")) {
        // Fallback jika metode_pengurutan belum jadi kolom
        await supabase
          .from("atp")
          .update({
            status: newStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingAtp.id);
      }
    } else {
      const insertData: AtpInsert = {
        penugasan_id: penugasanId,
        semester: 1,
        status: newStatus,
        metode_pengurutan: metodePengurutan,
        created_by: session.user.id,
      };

      const { error: atpInsErr } = await supabase
        .from("atp")
        .insert(insertData);

      if (atpInsErr && atpInsErr.message.includes("column")) {
        await supabase
          .from("atp")
          .insert({
            penugasan_id: penugasanId,
            semester: 1,
            status: newStatus,
            created_by: session.user.id,
          });
      }
    }

    revalidatePath("/atp");
    revalidatePath(`/atp/${penugasanId}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem";
    return { success: false, error: msg };
  }
}

/**
 * 6. Mengambil Data Dokumen Lengkap untuk Pratinjau ATP (/atp/[penugasanId]/preview)
 */
export async function getAtpPreviewDataAction(penugasanId: string) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi tidak valid." };
    }

    const supabase = await createClient();

    // 1. Data Profil Madrasah
    const { data: madrasah } = await supabase
      .from("madrasah")
      .select("*")
      .limit(1)
      .maybeSingle();

    // 2. Data Penugasan + Mapel + Guru + Tahun Ajaran (Bisa berupa penugasan.id atau atp.id)
    let actualPenugasanId = penugasanId;
    const { data: initialPenugasan } = await supabase
      .from("penugasan")
      .select(`
        id,
        tingkat_kelas,
        rombel,
        guru_id,
        mapel_id,
        mapel ( id, nama, kode, kelompok, jp_per_minggu_kls7, jp_per_minggu_kls8, jp_per_minggu_kls9 ),
        profiles ( id, nama_lengkap, nip, gelar ),
        tahun_ajaran ( id, nama, aktif )
      `)
      .eq("id", penugasanId)
      .maybeSingle();

    let penugasan = initialPenugasan;

    if (!penugasan) {
      // Coba cek apakah penugasanId adalah ID dari dokumen ATP
      const { data: atpCheck } = await supabase
        .from("atp")
        .select("id, penugasan_id")
        .eq("id", penugasanId)
        .maybeSingle();

      if (atpCheck?.penugasan_id) {
        actualPenugasanId = atpCheck.penugasan_id;
        const res = await supabase
          .from("penugasan")
          .select(`
            id,
            tingkat_kelas,
            rombel,
            guru_id,
            mapel_id,
            mapel ( id, nama, kode, kelompok, jp_per_minggu_kls7, jp_per_minggu_kls8, jp_per_minggu_kls9 ),
            profiles ( id, nama_lengkap, nip, gelar ),
            tahun_ajaran ( id, nama, aktif )
          `)
          .eq("id", actualPenugasanId)
          .maybeSingle();
        penugasan = res.data;
      }
    }

    if (!penugasan) {
      return { success: false, error: "Penugasan atau dokumen ATP tidak ditemukan." };
    }

    const mapelData = Array.isArray(penugasan.mapel) ? penugasan.mapel[0] : penugasan.mapel;
    const guruData = Array.isArray(penugasan.profiles) ? penugasan.profiles[0] : penugasan.profiles;
    const taData = Array.isArray(penugasan.tahun_ajaran) ? penugasan.tahun_ajaran[0] : penugasan.tahun_ajaran;

    // 3. Dokumen ATP
    const { data: atpDoc } = await supabase
      .from("atp")
      .select("*")
      .eq("penugasan_id", actualPenugasanId)
      .maybeSingle();

    // 4. Analisis CP
    const { data: analisisRows } = await supabase
      .from("analisis_cp")
      .select(`
        id,
        cp_id,
        materi_pokok,
        kompetensi,
        kata_kunci,
        benang_merah,
        dpl_ids,
        panca_cinta_ids,
        capaian_pembelajaran ( id, elemen, deskripsi_cp )
      `)
      .eq("penugasan_id", actualPenugasanId);

    const cpMap = new Map<
      string,
      {
        elemen: string;
        deskripsi: string;
        materi_pokok: string;
        dpl_ids: string[];
        panca_cinta_ids: string[];
      }
    >();
    const analisisIds: string[] = [];

    (analisisRows || []).forEach((a: any) => {
      analisisIds.push(a.id);
      const cpItem = Array.isArray(a.capaian_pembelajaran) ? a.capaian_pembelajaran[0] : a.capaian_pembelajaran;

      let dplIds: string[] = Array.isArray(a.dpl_ids) ? a.dpl_ids : [];
      let pcIds: string[] = Array.isArray(a.panca_cinta_ids) ? a.panca_cinta_ids : [];

      if (typeof a.kompetensi === "string" && a.kompetensi.startsWith("{") && a.kompetensi.endsWith("}")) {
        try {
          const parsed = JSON.parse(a.kompetensi);
          if (parsed.dpl_ids && dplIds.length === 0) dplIds = parsed.dpl_ids;
          if (parsed.panca_cinta_ids && pcIds.length === 0) pcIds = parsed.panca_cinta_ids;
        } catch {
          // ignore
        }
      }

      cpMap.set(a.id, {
        elemen: cpItem?.elemen || "Elemen Mapel",
        deskripsi: cpItem?.deskripsi_cp || "",
        materi_pokok: a.materi_pokok || "",
        dpl_ids: dplIds,
        panca_cinta_ids: pcIds,
      });
    });

    // 5. Tujuan Pembelajaran (Urut sesuai urutan ATP)
    interface RawTpItem {
      id: string;
      analisis_cp_id: string;
      kode_tp?: string;
      deskripsi: string;
      panca_cinta_ids?: string[];
      dpl_ids?: string[];
      alokasi_jp?: number;
      urutan?: number;
      semester?: number;
      lingkup_materi?: string;
      kktp?: unknown;
    }

    let tpRows: RawTpItem[] = [];
    if (analisisIds.length > 0) {
      const { data: tpData } = await supabase
        .from("tujuan_pembelajaran")
        .select("*")
        .in("analisis_cp_id", analisisIds)
        .order("urutan", { ascending: true });
      tpRows = (tpData as unknown as RawTpItem[]) || [];
    }

    // 6. Master Panca Cinta & DPL untuk label di tabel
    const { data: pancaCintaList } = await supabase.from("panca_cinta").select("id, nama, kode");
    const { data: dplList } = await supabase.from("dimensi_profil_lulusan").select("id, nama, kode");

    const pancaMap = new Map<string, string>();
    pancaCintaList?.forEach((p) => {
      pancaMap.set(p.id, p.nama);
      pancaMap.set(p.kode, p.nama);
    });

    const dplMap = new Map<string, string>();
    dplList?.forEach((d) => {
      dplMap.set(d.id, d.nama);
      dplMap.set(d.kode, d.nama);
    });

    // Gabungkan baris tabel ATP
    let totalJpSmt1 = 0;
    let totalJpSmt2 = 0;

    const tableItems = tpRows.map((tp, idx) => {
      const cpInfo = cpMap.get(tp.analisis_cp_id);
      const smt = tp.semester === 2 ? 2 : 1;
      const jp = Number(tp.alokasi_jp || 2);

      if (smt === 1) totalJpSmt1 += jp;
      else totalJpSmt2 += jp;

      // Topik Panca Cinta: gunakan TP jika ada, fallback ke CP
      const effectivePcIds =
        Array.isArray(tp.panca_cinta_ids) && tp.panca_cinta_ids.length > 0
          ? tp.panca_cinta_ids
          : cpInfo?.panca_cinta_ids || [];

      const pancaNames = effectivePcIds
        .map((id: string) => pancaMap.get(id))
        .filter(Boolean) as string[];

      // Dimensi Profil Lulusan (DPL): isi dengan yang telah dicentang di CP
      const effectiveDplIds =
        cpInfo?.dpl_ids && cpInfo.dpl_ids.length > 0
          ? cpInfo.dpl_ids
          : (Array.isArray(tp.dpl_ids) && tp.dpl_ids.length > 0 ? tp.dpl_ids : []);

      const dplNames = effectiveDplIds
        .map((id: string) => dplMap.get(id))
        .filter(Boolean) as string[];

      return {
        no: idx + 1,
        id: tp.id,
        kode_tp: tp.kode_tp || `${penugasan.tingkat_kelas}.${idx + 1}`,
        elemen: cpInfo?.elemen || "-",
        deskripsi_cp: cpInfo?.deskripsi || "-",
        tujuan_pembelajaran: tp.deskripsi,
        materi_pokok: tp.lingkup_materi || cpInfo?.materi_pokok || "-",
        panca_cinta: pancaNames,
        dpl: dplNames,
        semester: smt,
        alokasi_jp: jp,
        kktp: tp.kktp,
      };
    });

    return {
      success: true,
      data: {
        madrasah: madrasah || {
          nama: "MTs KH A Wahab Muhsin",
          nsm: "121232060001",
          npsn: "20277890",
          alamat: "Jl. Sukahideng No. 01 Sukarame",
          kabupaten: "Kabupaten Tasikmalaya",
          kepala_nama: "Drs. H. Ahmad Fauzi, M.Pd.I",
          kepala_nip: "197205121998031002",
          logo_url: null,
        },
        penugasan: {
          id: penugasan.id,
          tingkat_kelas: penugasan.tingkat_kelas,
          rombel: penugasan.rombel,
          fase: "D",
          mapel: mapelData,
          guru: guruData,
          tahun_ajaran: taData,
        },
        atp: {
          id: atpDoc?.id || null,
          status: (atpDoc?.status as DocStatus) || "draf",
          metode_pengurutan: (atpDoc?.metode_pengurutan as MetodePengurutanAtp) || "konkret_ke_abstrak",
          updated_at: atpDoc?.updated_at || new Date().toISOString(),
        },
        items: tableItems,
        summary: {
          totalJpSmt1,
          totalJpSmt2,
          grandTotalJp: totalJpSmt1 + totalJpSmt2,
          totalTp: tableItems.length,
        },
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memuat pratinjau ATP";
    return { success: false, error: msg };
  }
}

export type AtpPreviewData = NonNullable<Awaited<ReturnType<typeof getAtpPreviewDataAction>>["data"]>;
export type PreviewData = AtpPreviewData;

/**
 * 7. Mengambil Data Dokumen Lengkap untuk Pratinjau Analisis CP (/atp/[penugasanId]/preview-cp)
 */
export interface CpPreviewItem {
  no: number;
  id: string;
  cp_id: string;
  elemen: string;
  kode_elemen?: string;
  deskripsi_cp: string;
  materi_pokok: string;
  kompetensi: string;
  kata_kunci: string[];
  benang_merah: string;
  dpl: string[];
  panca_cinta: string[];
  alokasi_jp: number;
  urutan: number;
}

export interface CpPreviewData {
  madrasah: {
    nama: string;
    nsm: string | null;
    npsn: string | null;
    alamat: string | null;
    kabupaten: string | null;
    kepala_nama: string | null;
    kepala_nip: string | null;
    logo_url: string | null;
  };
  penugasan: {
    id: string;
    tingkat_kelas: 7 | 8 | 9;
    rombel: string;
    fase: string;
    mapel: {
      id: string;
      nama: string;
      kode: string;
      kelompok?: string;
    };
    guru: {
      nama_lengkap: string;
      nip: string | null;
      gelar?: string | null;
    };
    tahun_ajaran: {
      nama: string;
    };
  };
  items: CpPreviewItem[];
  summary: {
    totalElemen: number;
    totalJp: number;
  };
}

export async function getCpPreviewDataAction(penugasanId: string) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi tidak valid." };
    }

    const supabase = await createClient();

    // 1. Data Profil Madrasah
    const { data: madrasah } = await supabase
      .from("madrasah")
      .select("*")
      .limit(1)
      .maybeSingle();

    // 2. Data Penugasan (Bisa penugasan.id atau atp.id)
    let actualPenugasanId = penugasanId;
    let { data: penugasan } = await supabase
      .from("penugasan")
      .select(`
        id,
        tingkat_kelas,
        rombel,
        guru_id,
        mapel_id,
        mapel ( id, nama, kode, kelompok, jp_per_minggu_kls7, jp_per_minggu_kls8, jp_per_minggu_kls9 ),
        profiles ( id, nama_lengkap, nip, gelar ),
        tahun_ajaran ( id, nama, aktif )
      `)
      .eq("id", penugasanId)
      .maybeSingle();

    if (!penugasan) {
      const { data: atpCheck } = await supabase
        .from("atp")
        .select("id, penugasan_id")
        .eq("id", penugasanId)
        .maybeSingle();

      if (atpCheck?.penugasan_id) {
        actualPenugasanId = atpCheck.penugasan_id;
        const res = await supabase
          .from("penugasan")
          .select(`
            id,
            tingkat_kelas,
            rombel,
            guru_id,
            mapel_id,
            mapel ( id, nama, kode, kelompok, jp_per_minggu_kls7, jp_per_minggu_kls8, jp_per_minggu_kls9 ),
            profiles ( id, nama_lengkap, nip, gelar ),
            tahun_ajaran ( id, nama, aktif )
          `)
          .eq("id", actualPenugasanId)
          .maybeSingle();
        penugasan = res.data;
      }
    }

    if (!penugasan) {
      return { success: false, error: "Penugasan tidak ditemukan." };
    }

    const mapelData = Array.isArray(penugasan.mapel) ? penugasan.mapel[0] : penugasan.mapel;
    const guruData = Array.isArray(penugasan.profiles) ? penugasan.profiles[0] : penugasan.profiles;
    const taData = Array.isArray(penugasan.tahun_ajaran) ? penugasan.tahun_ajaran[0] : penugasan.tahun_ajaran;

    // 3. Ambil Analisis CP untuk penugasan ini
    // Pakai "*" agar tidak gagal jika kolom opsional (mis. urutan) belum dimigrasi
    const { data: analisisRowsRaw, error: analisisErr } = await supabase
      .from("analisis_cp")
      .select(`*, capaian_pembelajaran ( id, elemen, kode_elemen, deskripsi_cp )`)
      .eq("penugasan_id", actualPenugasanId);

    if (analisisErr) {
      return { success: false, error: "Gagal memuat analisis CP: " + analisisErr.message };
    }
    const analisisRows = (analisisRowsRaw || []) as any[];

    // 4. Ambil TP (Tujuan Pembelajaran) untuk menghitung JP per elemen CP dari TP
    const analisisIds = (analisisRows || []).map((r) => r.id);
    const tpJpByAnalisisId = new Map<string, number>();
    const tpCountByAnalisisId = new Map<string, number>();

    if (analisisIds.length > 0) {
      const { data: tpRows } = await supabase
        .from("tujuan_pembelajaran")
        .select("id, analisis_cp_id, alokasi_jp")
        .in("analisis_cp_id", analisisIds);

      (tpRows || []).forEach((tp) => {
        const curJp = tpJpByAnalisisId.get(tp.analisis_cp_id) || 0;
        const curCount = tpCountByAnalisisId.get(tp.analisis_cp_id) || 0;
        tpJpByAnalisisId.set(tp.analisis_cp_id, curJp + (Number(tp.alokasi_jp) || 0));
        tpCountByAnalisisId.set(tp.analisis_cp_id, curCount + 1);
      });
    }

    // 5. Master Panca Cinta & Dimensi Profil Lulusan
    const { data: pancaCintaList } = await supabase.from("panca_cinta").select("id, nama, kode");
    const { data: dplList } = await supabase.from("dimensi_profil_lulusan").select("id, nama, kode");

    const pancaMap = new Map<string, string>();
    pancaCintaList?.forEach((p) => pancaMap.set(p.id, p.nama));

    const dplMap = new Map<string, string>();
    dplList?.forEach((d) => dplMap.set(d.id, d.nama));

    // Normalisasi items dan urutkan
    const sortedAnalisis = (analisisRows || []).map((row, idx) => {
      let kataKunci: string[] = Array.isArray(row.kata_kunci) ? row.kata_kunci : [];
      let benangMerah: string = row.benang_merah || "";
      let dplIds: string[] = Array.isArray(row.dpl_ids) ? row.dpl_ids : [];
      let pancaCintaIds: string[] = Array.isArray(row.panca_cinta_ids) ? row.panca_cinta_ids : [];
      let kompetensiText = row.kompetensi || "";

      if (kompetensiText.startsWith("{") && kompetensiText.endsWith("}")) {
        try {
          const parsed = JSON.parse(kompetensiText);
          if (parsed.kata_kunci && kataKunci.length === 0) kataKunci = parsed.kata_kunci;
          if (parsed.benang_merah && !benangMerah) benangMerah = parsed.benang_merah;
          if (parsed.dpl_ids && dplIds.length === 0) dplIds = parsed.dpl_ids;
          if (parsed.panca_cinta_ids && pancaCintaIds.length === 0) pancaCintaIds = parsed.panca_cinta_ids;
          if (parsed.kompetensi) kompetensiText = parsed.kompetensi;
        } catch {
          // ignore
        }
      }

      const cpItem = Array.isArray(row.capaian_pembelajaran)
        ? row.capaian_pembelajaran[0]
        : row.capaian_pembelajaran;

      // JP per elemen CP mengikuti akumulasi alokasi_jp dari seluruh TP di bawah elemen ini
      const hasTp = (tpCountByAnalisisId.get(row.id) || 0) > 0;
      const computedJp = hasTp
        ? (tpJpByAnalisisId.get(row.id) || 0)
        : Number(row.alokasi_jp || 2);

      return {
        id: row.id,
        cp_id: row.cp_id,
        elemen: cpItem?.elemen || "Elemen Mapel",
        kode_elemen: cpItem?.kode_elemen,
        deskripsi_cp: cpItem?.deskripsi_cp || "-",
        materi_pokok: row.materi_pokok || "-",
        kompetensi: kompetensiText || "Memahami dan Mengaplikasikan",
        kata_kunci: kataKunci,
        benang_merah: benangMerah,
        dpl: dplIds.map((id) => dplMap.get(id)).filter(Boolean) as string[],
        panca_cinta: pancaCintaIds.map((id) => pancaMap.get(id)).filter(Boolean) as string[],
        alokasi_jp: computedJp,
        urutan: Number((row as any).urutan ?? (idx + 1)),
      };
    }).sort((a, b) => a.urutan - b.urutan);

    let totalJp = 0;
    const items: CpPreviewItem[] = sortedAnalisis.map((item, idx) => {
      totalJp += item.alokasi_jp;
      return {
        no: idx + 1,
        ...item,
      };
    });

    return {
      success: true,
      data: {
        madrasah: madrasah || {
          nama: "MTs KH A Wahab Muhsin",
          nsm: "121232060001",
          npsn: "20277890",
          alamat: "Jl. Sukahideng No. 01 Sukarame",
          kabupaten: "Kabupaten Tasikmalaya",
          kepala_nama: "Drs. H. Ahmad Fauzi, M.Pd.I",
          kepala_nip: "197205121998031002",
          logo_url: null,
        },
        penugasan: {
          id: penugasan.id,
          tingkat_kelas: penugasan.tingkat_kelas,
          rombel: penugasan.rombel,
          fase: "D",
          mapel: mapelData,
          guru: guruData,
          tahun_ajaran: taData,
        },
        items,
        summary: {
          totalElemen: items.length,
          totalJp,
        },
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memuat pratinjau CP";
    return { success: false, error: msg };
  }
}

/**
 * 8. Mengambil Data Dokumen Lengkap untuk Pratinjau Tujuan Pembelajaran & KKTP (/atp/[penugasanId]/preview-tp)
 */
export interface TpPreviewItem {
  no: number;
  id: string;
  analisis_cp_id: string;
  kode_tp: string;
  elemen: string;
  deskripsi: string;
  kompetensi?: string;
  lingkup_materi: string;
  konteks?: string;
  panca_cinta: string[];
  dpl: string[];
  semester: number;
  alokasi_jp: number;
  urutan: number;
  kktp?: unknown;
}

export interface TpPreviewData {
  madrasah: {
    nama: string;
    nsm: string | null;
    npsn: string | null;
    alamat: string | null;
    kabupaten: string | null;
    kepala_nama: string | null;
    kepala_nip: string | null;
    logo_url: string | null;
  };
  penugasan: {
    id: string;
    tingkat_kelas: 7 | 8 | 9;
    rombel: string;
    fase: string;
    mapel: {
      id: string;
      nama: string;
      kode: string;
      kelompok?: string;
    };
    guru: {
      nama_lengkap: string;
      nip: string | null;
      gelar?: string | null;
    };
    tahun_ajaran: {
      nama: string;
    };
  };
  items: TpPreviewItem[];
  summary: {
    totalTp: number;
    totalJpSmt1: number;
    totalJpSmt2: number;
    grandTotalJp: number;
  };
}

export async function getTpPreviewDataAction(penugasanId: string) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi tidak valid." };
    }

    const supabase = await createClient();

    // 1. Data Profil Madrasah
    const { data: madrasah } = await supabase
      .from("madrasah")
      .select("*")
      .limit(1)
      .maybeSingle();

    // 2. Data Penugasan
    let actualPenugasanId = penugasanId;
    let { data: penugasan } = await supabase
      .from("penugasan")
      .select(`
        id,
        tingkat_kelas,
        rombel,
        guru_id,
        mapel_id,
        mapel ( id, nama, kode, kelompok, jp_per_minggu_kls7, jp_per_minggu_kls8, jp_per_minggu_kls9 ),
        profiles ( id, nama_lengkap, nip, gelar ),
        tahun_ajaran ( id, nama, aktif )
      `)
      .eq("id", penugasanId)
      .maybeSingle();

    if (!penugasan) {
      const { data: atpCheck } = await supabase
        .from("atp")
        .select("id, penugasan_id")
        .eq("id", penugasanId)
        .maybeSingle();

      if (atpCheck?.penugasan_id) {
        actualPenugasanId = atpCheck.penugasan_id;
        const res = await supabase
          .from("penugasan")
          .select(`
            id,
            tingkat_kelas,
            rombel,
            guru_id,
            mapel_id,
            mapel ( id, nama, kode, kelompok, jp_per_minggu_kls7, jp_per_minggu_kls8, jp_per_minggu_kls9 ),
            profiles ( id, nama_lengkap, nip, gelar ),
            tahun_ajaran ( id, nama, aktif )
          `)
          .eq("id", actualPenugasanId)
          .maybeSingle();
        penugasan = res.data;
      }
    }

    if (!penugasan) {
      return { success: false, error: "Penugasan tidak ditemukan." };
    }

    const mapelData = Array.isArray(penugasan.mapel) ? penugasan.mapel[0] : penugasan.mapel;
    const guruData = Array.isArray(penugasan.profiles) ? penugasan.profiles[0] : penugasan.profiles;
    const taData = Array.isArray(penugasan.tahun_ajaran) ? penugasan.tahun_ajaran[0] : penugasan.tahun_ajaran;

    // 3. Analisis CP untuk memetakan nama elemen
    const { data: analisisRows } = await supabase
      .from("analisis_cp")
      .select(`*, capaian_pembelajaran ( id, elemen, deskripsi_cp )`)
      .eq("penugasan_id", actualPenugasanId);

    const cpMap = new Map<
      string,
      {
        elemen: string;
        deskripsi: string;
        materi_pokok: string;
        dpl_ids: string[];
        panca_cinta_ids: string[];
      }
    >();
    const analisisIds: string[] = [];

    (analisisRows || []).forEach((a: any) => {
      analisisIds.push(a.id);
      const cpItem = Array.isArray(a.capaian_pembelajaran) ? a.capaian_pembelajaran[0] : a.capaian_pembelajaran;

      let dplIds: string[] = Array.isArray(a.dpl_ids) ? a.dpl_ids : [];
      let pcIds: string[] = Array.isArray(a.panca_cinta_ids) ? a.panca_cinta_ids : [];

      if (typeof a.kompetensi === "string" && a.kompetensi.startsWith("{") && a.kompetensi.endsWith("}")) {
        try {
          const parsed = JSON.parse(a.kompetensi);
          if (parsed.dpl_ids && dplIds.length === 0) dplIds = parsed.dpl_ids;
          if (parsed.panca_cinta_ids && pcIds.length === 0) pcIds = parsed.panca_cinta_ids;
        } catch {
          // ignore
        }
      }

      cpMap.set(a.id, {
        elemen: cpItem?.elemen || "Elemen Mapel",
        deskripsi: cpItem?.deskripsi_cp || "",
        materi_pokok: a.materi_pokok || "",
        dpl_ids: dplIds,
        panca_cinta_ids: pcIds,
      });
    });

    // 4. Tujuan Pembelajaran
    let tpRows: any[] = [];
    if (analisisIds.length > 0) {
      const { data: tpData } = await supabase
        .from("tujuan_pembelajaran")
        .select("*")
        .in("analisis_cp_id", analisisIds)
        .order("urutan", { ascending: true });
      tpRows = tpData || [];
    }

    // 5. Master Panca Cinta & DPL
    const { data: pancaCintaList } = await supabase.from("panca_cinta").select("id, nama, kode");
    const { data: dplList } = await supabase.from("dimensi_profil_lulusan").select("id, nama, kode");

    const pancaMap = new Map<string, string>();
    pancaCintaList?.forEach((p) => {
      pancaMap.set(p.id, p.nama);
      pancaMap.set(p.kode, p.nama);
    });

    const dplMap = new Map<string, string>();
    dplList?.forEach((d) => {
      dplMap.set(d.id, d.nama);
      dplMap.set(d.kode, d.nama);
    });

    let totalJpSmt1 = 0;
    let totalJpSmt2 = 0;

    const items: TpPreviewItem[] = tpRows.map((tp, idx) => {
      const cpInfo = cpMap.get(tp.analisis_cp_id);
      const smt = tp.semester === 2 ? 2 : 1;
      const jp = Number(tp.alokasi_jp || 2);

      if (smt === 1) totalJpSmt1 += jp;
      else totalJpSmt2 += jp;

      // Topik Panca Cinta: gunakan TP jika ada, fallback ke CP
      const effectivePcIds =
        Array.isArray(tp.panca_cinta_ids) && tp.panca_cinta_ids.length > 0
          ? tp.panca_cinta_ids
          : cpInfo?.panca_cinta_ids || [];

      const pancaNames = effectivePcIds
        .map((id: string) => pancaMap.get(id))
        .filter(Boolean) as string[];

      // Dimensi Profil Lulusan (DPL): isi dengan yang telah dicentang di CP
      const effectiveDplIds =
        cpInfo?.dpl_ids && cpInfo.dpl_ids.length > 0
          ? cpInfo.dpl_ids
          : (Array.isArray(tp.dpl_ids) && tp.dpl_ids.length > 0 ? tp.dpl_ids : []);

      const dplNames = effectiveDplIds
        .map((id: string) => dplMap.get(id))
        .filter(Boolean) as string[];

      return {
        no: idx + 1,
        id: tp.id,
        analisis_cp_id: tp.analisis_cp_id,
        kode_tp: tp.kode_tp || `${penugasan.tingkat_kelas}.${idx + 1}`,
        elemen: cpInfo?.elemen || "-",
        deskripsi: tp.deskripsi,
        kompetensi: tp.kompetensi,
        lingkup_materi: tp.lingkup_materi || cpInfo?.materi_pokok || "-",
        konteks: tp.konteks,
        panca_cinta: pancaNames,
        dpl: dplNames,
        semester: smt,
        alokasi_jp: jp,
        urutan: Number(tp.urutan || (idx + 1)),
        kktp: tp.kktp,
      };
    });

    return {
      success: true,
      data: {
        madrasah: madrasah || {
          nama: "MTs KH A Wahab Muhsin",
          nsm: "121232060001",
          npsn: "20277890",
          alamat: "Jl. Sukahideng No. 01 Sukarame",
          kabupaten: "Kabupaten Tasikmalaya",
          kepala_nama: "Drs. H. Ahmad Fauzi, M.Pd.I",
          kepala_nip: "197205121998031002",
          logo_url: null,
        },
        penugasan: {
          id: penugasan.id,
          tingkat_kelas: penugasan.tingkat_kelas,
          rombel: penugasan.rombel,
          fase: "D",
          mapel: mapelData,
          guru: guruData,
          tahun_ajaran: taData,
        },
        items,
        summary: {
          totalTp: items.length,
          totalJpSmt1,
          totalJpSmt2,
          grandTotalJp: totalJpSmt1 + totalJpSmt2,
        },
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal memuat pratinjau TP";
    return { success: false, error: msg };
  }
}

/**
 * 12. Menambah atau Mengedit Bab Materi Pelajaran dan Menyimpan Otomatis ke Bank Data
 */
export async function saveBabBankDataAction(
  penugasanId: string,
  payload: SaveBabBankDataPayload
): Promise<{
  success: boolean;
  data?: WizardMateriItem[];
  savedItem?: WizardMateriItem;
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi tidak valid. Silakan login kembali." };
    }

    if (!payload.bab || !payload.bab.trim()) {
      return { success: false, error: "Nama / Judul Bab tidak boleh kosong." };
    }

    const adminSb = createAdminClient();

    // 1. Ambil Penugasan
    const { data: penugasan, error: pErr } = await adminSb
      .from("penugasan")
      .select("id, mapel_id, tingkat_kelas, guru_id, mapel(id, nama, slug)")
      .eq("id", penugasanId)
      .single();

    if (pErr || !penugasan) {
      return { success: false, error: "Penugasan tidak ditemukan." };
    }

    if (session.role === "guru" && penugasan.guru_id !== session.user.id) {
      return { success: false, error: "Anda tidak memiliki akses ke penugasan ini." };
    }

    const mapelId = penugasan.mapel_id;
    const tingkat = penugasan.tingkat_kelas as 7 | 8 | 9;

    // 2. Cek apakah di tabel materi_pelajaran sudah ada data untuk mapel & tingkat ini
    const { data: existingRows } = await adminSb
      .from("materi_pelajaran")
      .select("*")
      .eq("mapel_id", mapelId)
      .eq("tingkat", tingkat);

    const mapelData = Array.isArray(penugasan.mapel) ? penugasan.mapel[0] : penugasan.mapel;
    const allBankMapel = getAllMapelBankData();
    const mapelNamaNorm = (mapelData?.nama || "").toLowerCase();
    const mapelRecord = mapelData as { slug?: string | null } | null;
    const matchedBankMapel = allBankMapel.find(
      (m) =>
        m.slug === mapelRecord?.slug ||
        mapelNamaNorm.includes(m.slug.replace(/-/g, " ")) ||
        m.mapel.toLowerCase().includes(mapelNamaNorm) ||
        mapelNamaNorm.includes(m.mapel.toLowerCase()) ||
        (mapelNamaNorm.includes("ski") && m.slug === "ski")
    );

    // Jika tabel materi_pelajaran untuk mapel & tingkat ini masih kosong,
    // seed terlebih dahulu dari data kurikulum resmi agar bab bawaan tersimpan di DB
    if (!existingRows || existingRows.length === 0) {
      if (matchedBankMapel) {
        const seedRows = matchedBankMapel.materi
          .filter((m) => m.tingkat === tingkat)
          .map((m) => ({
            mapel_id: mapelId,
            tingkat: m.tingkat as 7 | 8 | 9,
            semester: m.semester as 1 | 2,
            urutan: m.urutan,
            bab: m.bab,
            deskripsi: m.deskripsi || m.saran_panca_cinta?.[0]?.alasan || "",
            kata_kunci: m.kata_kunci || [],
            subbab: m.subbab || [],
            elemen_cp_ids: [],
            saran_panca_cinta: m.saran_panca_cinta.map((s) => ({
              topik_kode: `PC${s.id}`,
              alasan: s.alasan,
            })),
            saran_dpl: m.saran_dpl || [],
            sumber: { regulasi: "KMA 1503/2025" },
            versi_bank_data: "2026-2027-v1",
            status_verifikasi: "terverifikasi" as const,
            asal: "bank_data" as const,
          }));

        if (seedRows.length > 0) {
          await adminSb.from("materi_pelajaran").insert(seedRows);
        }
      }
    }

    // 3. Query daftar materi terkini di DB
    const { data: dbMateriNow } = await adminSb
      .from("materi_pelajaran")
      .select("*")
      .eq("mapel_id", mapelId)
      .eq("tingkat", tingkat);

    const currentRows = dbMateriNow || [];
    let savedRowId: string | undefined = payload.id;

    // 4. Proses Simpan / Update
    if (payload.id) {
      const { error: updErr } = await adminSb
        .from("materi_pelajaran")
        .update({
          bab: payload.bab.trim(),
          semester: payload.semester,
          urutan: payload.urutan !== undefined ? payload.urutan : undefined,
          subbab: payload.subbab || [],
          kata_kunci: payload.kata_kunci || [],
          deskripsi: payload.deskripsi?.trim() || null,
          asal: "manual",
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.id);

      if (updErr) {
        return { success: false, error: "Gagal memperbarui bab: " + updErr.message };
      }
    } else {
      // Cek apakah ada bab dengan urutan & semester sama atau nama sama untuk di-update
      const existingMatch = payload.originalUrutan
        ? currentRows.find((r) => r.urutan === payload.originalUrutan && r.semester === payload.semester)
        : currentRows.find((r) => r.bab.toLowerCase().trim() === payload.bab.toLowerCase().trim());

      if (existingMatch) {
        savedRowId = existingMatch.id;
        const { error: updErr } = await adminSb
          .from("materi_pelajaran")
          .update({
            bab: payload.bab.trim(),
            semester: payload.semester,
            urutan: payload.urutan !== undefined ? payload.urutan : existingMatch.urutan,
            subbab: payload.subbab || existingMatch.subbab || [],
            kata_kunci: payload.kata_kunci || existingMatch.kata_kunci || [],
            deskripsi: payload.deskripsi?.trim() ?? existingMatch.deskripsi,
            asal: "manual",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingMatch.id);

        if (updErr) {
          return { success: false, error: "Gagal memperbarui bab: " + updErr.message };
        }
      } else {
        // Hitung urutan bab
        let finalUrutan = payload.urutan;
        if (!finalUrutan || finalUrutan <= 0) {
          const maxUrutan = currentRows.reduce((max, r) => Math.max(max, r.urutan || 0), 0);
          finalUrutan = maxUrutan + 1;
        }

        const { data: newRow, error: insErr } = await adminSb
          .from("materi_pelajaran")
          .insert({
            mapel_id: mapelId,
            tingkat,
            semester: payload.semester,
            urutan: finalUrutan,
            bab: payload.bab.trim(),
            deskripsi: payload.deskripsi?.trim() || null,
            kata_kunci: payload.kata_kunci || [],
            subbab: payload.subbab || [],
            elemen_cp_ids: [],
            saran_panca_cinta: [],
            saran_dpl: [],
            sumber: { regulasi: "KMA 1503/2025", catatan: "Ditambahkan oleh guru di Analisis CP" },
            versi_bank_data: "custom-guru",
            status_verifikasi: "belum",
            asal: "manual",
            created_by: session.user.id,
          })
          .select("id")
          .single();

        if (insErr) {
          return { success: false, error: "Gagal menambahkan bab baru ke Bank Data: " + insErr.message };
        }
        savedRowId = newRow?.id;
      }
    }

    // 5. Ambil semua materi yang sudah diperbarui untuk dikembalikan ke client
    const { data: allUpdatedRows } = await adminSb
      .from("materi_pelajaran")
      .select("*")
      .eq("mapel_id", mapelId)
      .eq("tingkat", tingkat)
      .order("semester", { ascending: true })
      .order("urutan", { ascending: true });

    const formattedList: WizardMateriItem[] = (allUpdatedRows || []).map((m) => {
      const spcRaw = (m.saran_panca_cinta as unknown as Array<{ id?: number; topik_kode?: string; alasan: string }>) || [];
      return {
        id: m.id,
        tingkat: m.tingkat,
        semester: m.semester,
        urutan: m.urutan,
        bab: m.bab,
        deskripsi: m.deskripsi || "",
        kata_kunci: Array.isArray(m.kata_kunci) ? m.kata_kunci : [],
        elemen_kode: Array.isArray((m as any).elemen_kode) ? (m as any).elemen_kode : [],
        subbab: Array.isArray(m.subbab) ? m.subbab : [],
        saran_panca_cinta: spcRaw.map((s) => ({
          topik_kode: s.topik_kode || `PC${s.id}`,
          alasan: s.alasan,
        })),
        saran_dpl: Array.isArray(m.saran_dpl) ? m.saran_dpl : [],
      };
    });

    const savedItem = formattedList.find((m) => m.id === savedRowId);

    revalidatePath(`/atp/${penugasanId}`);
    revalidatePath("/master-data/bank-data");

    return {
      success: true,
      data: formattedList,
      savedItem,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal menyimpan bab ke Bank Data";
    return { success: false, error: msg };
  }
}

/**
 * 13. Menghapus Bab Materi dari Bank Data
 */
export async function deleteBabBankDataAction(
  penugasanId: string,
  babId: string
): Promise<{
  success: boolean;
  data?: WizardMateriItem[];
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi tidak valid." };
    }

    const adminSb = createAdminClient();
    const { data: penugasan } = await adminSb
      .from("penugasan")
      .select("id, mapel_id, tingkat_kelas, guru_id")
      .eq("id", penugasanId)
      .single();

    if (!penugasan) {
      return { success: false, error: "Penugasan tidak ditemukan." };
    }

    if (session.role === "guru" && penugasan.guru_id !== session.user.id) {
      return { success: false, error: "Anda tidak memiliki akses ke penugasan ini." };
    }

    const { error: delErr } = await adminSb
      .from("materi_pelajaran")
      .delete()
      .eq("id", babId)
      .eq("mapel_id", penugasan.mapel_id);

    if (delErr) {
      return { success: false, error: "Gagal menghapus bab: " + delErr.message };
    }

    const { data: allUpdatedRows } = await adminSb
      .from("materi_pelajaran")
      .select("*")
      .eq("mapel_id", penugasan.mapel_id)
      .eq("tingkat", penugasan.tingkat_kelas as 7 | 8 | 9)
      .order("semester", { ascending: true })
      .order("urutan", { ascending: true });

    const formattedList: WizardMateriItem[] = (allUpdatedRows || []).map((m) => {
      const spcRaw = (m.saran_panca_cinta as unknown as Array<{ id?: number; topik_kode?: string; alasan: string }>) || [];
      return {
        id: m.id,
        tingkat: m.tingkat,
        semester: m.semester,
        urutan: m.urutan,
        bab: m.bab,
        deskripsi: m.deskripsi || "",
        kata_kunci: Array.isArray(m.kata_kunci) ? m.kata_kunci : [],
        elemen_kode: Array.isArray((m as any).elemen_kode) ? (m as any).elemen_kode : [],
        subbab: Array.isArray(m.subbab) ? m.subbab : [],
        saran_panca_cinta: spcRaw.map((s) => ({
          topik_kode: s.topik_kode || `PC${s.id}`,
          alasan: s.alasan,
        })),
        saran_dpl: Array.isArray(m.saran_dpl) ? m.saran_dpl : [],
      };
    });

    revalidatePath(`/atp/${penugasanId}`);
    revalidatePath("/master-data/bank-data");

    return { success: true, data: formattedList };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Gagal menghapus bab";
    return { success: false, error: msg };
  }
}

