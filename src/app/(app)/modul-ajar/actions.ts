"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import type { Database, DocStatus, VersiRpp, TahapKegiatan, PengalamanBelajar } from "@/types/database";
import {
  generateDefaultKesiapanMurid,
  generateDefaultKarakteristik,
  generateDefaultLampiran,
} from "@/lib/rpp-suggestions";
import {
  generateModelLangkahList,
  getModelPedagogiSpec,
} from "@/lib/rpp-model-pedagogi";

async function getSupabaseClient() {
  if (process.env.TEST_USER_ID) {
    return createAdminClient();
  }
  try {
    return await createClient();
  } catch {
    return createAdminClient();
  }
}

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Diabaikan jika di luar request scope (misal unit test)
  }
}

type RppInsert = Database["public"]["Tables"]["rpp"]["Insert"];
type RppUpdate = Database["public"]["Tables"]["rpp"]["Update"];
type RppLangkahInsert = Database["public"]["Tables"]["rpp_langkah"]["Insert"];

export interface RppCardItem {
  id: string;
  materi_pokok: string;
  versi: VersiRpp;
  status: DocStatus;
  alokasi_waktu: string;
  alokasi_jp: number;
  jumlah_pertemuan: number;
  pertemuan_ke: number;
  mapel: {
    id: string;
    nama: string;
    kode: string;
  };
  tingkat_kelas: 7 | 8 | 9;
  rombel: string;
  guru: {
    id: string;
    nama_lengkap: string;
    nip: string | null;
  };
  tahun_ajaran: {
    id: string;
    nama: string;
  };
  model_pembelajaran_nama: string | null;
  tp_count: number;
  updated_at: string;
}

export interface RppLangkahPayload {
  id?: string;
  rpp_id?: string;
  pertemuan_ke: number;
  tahap: TahapKegiatan;
  pengalaman: PengalamanBelajar;
  deskripsi_kegiatan: string;
  durasi_menit: number;
  urutan: number;
  prinsip: Array<"berkesadaran" | "bermakna" | "menggembirakan">;
  panca_cinta_id: string | null;
  aksi_kbc: string | null;
}

export interface KesiapanMuridData {
  pengetahuan_awal: string;
  minat: string;
  latar_belakang: string;
  kebutuhan: string;
  strategi_asesmen_awal: string;
  tindak_lanjut: string;
}

export interface RubrikKbcLevel {
  level: "MB" | "B" | "C" | "M";
  label: string; // Mulai Berkembang, Berkembang, Cakap, Membudaya
  deskripsi: string;
}

export interface RubrikKbcItem {
  panca_cinta_id: string;
  topik_nama: string;
  indikator: string;
  levels: RubrikKbcLevel[];
}

export interface LampiranData {
  lkpd: string;
  bahan_bacaan: string;
  rubrik_penilaian: string;
  glosarium: string;
  daftar_pustaka: string;
  file_urls?: Array<{ nama: string; url: string }>;
}

export interface RppDetailData {
  rpp: {
    id: string;
    penugasan_id: string;
    atp_id: string | null;
    materi_pokok: string;
    alokasi_waktu: string;
    alokasi_jp: number;
    jumlah_pertemuan: number;
    menit_per_jp: number;
    pertemuan_ke: number;
    versi: VersiRpp;
    model_id: string | null;
    tujuan_pembelajaran_ids: string[];
    dimensi_profil_lulusan_ids: string[];
    panca_cinta_ids: string[];
    materi_kbc_ids: string[];
    karakteristik_materi: string;
    benang_merah_kbc: string;
    materi_kbc_custom: string;
    lintas_disiplin_ilmu: string;
    topik_pembelajaran: string;
    metode_pembelajaran: string[];
    kemitraan_pembelajaran: string;
    lingkungan_belajar_fisik: string;
    lingkungan_belajar_virtual: string;
    budaya_belajar: string;
    pemanfaatan_digital: string;
    tujuan_pembelajaran_teks: string;
    pemahaman_bermakna: string;
    pertanyaan_pemantik: string;
    sarana_prasarana: string;
    diferensiasi_konten: string;
    diferensiasi_proses: string;
    diferensiasi_produk: string;
    asesmen_awal: string;
    asesmen_proses: string;
    asesmen_akhir: string;
    kesiapan_murid: KesiapanMuridData;
    rubrik_kbc: RubrikKbcItem[];
    kktp: string;
    lampiran: LampiranData;
    status: DocStatus;
    catatan_validator: string | null;
  };
  langkahList: RppLangkahPayload[];
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
      tanggal_penetapan_dokumen: string | null;
    };
  };
  madrasah: {
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
  master: {
    dpl: Array<{ id: string; kode: string; nama: string; elemen_kunci?: string[] }>;
    pancaCinta: Array<{ id: string; kode: string; nama: string; deskripsi?: string }>;
    materiKbc: Array<{ id: string; panca_cinta_id: string; pilar: string; nilai: string; deskripsi: string }>;
    models: Array<{
      id: string;
      nama: string;
      sintaks: Array<{ urutan: number; nama_sintaks: string; pengalaman_belajar: PengalamanBelajar }>;
    }>;
    daftarTp: Array<{
      id: string;
      kode_tp: string;
      materi_pokok: string;
      tujuan_pembelajaran_teks: string;
      panca_cinta_ids?: string[];
      dpl_ids?: string[];
      alokasi_jp?: number;
    }>;
    capaianPembelajaran: {
      id: string;
      elemen: string;
      deskripsi_cp: string;
    } | null;
  };
}

/**
 * 1. Mengambil daftar RPP untuk halaman /modul-ajar
 */
export async function getRppListAction(): Promise<{
  success: boolean;
  data: RppCardItem[];
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, data: [], error: "Sesi tidak valid." };
    }

    const supabase = await getSupabaseClient();

    let query = supabase
      .from("rpp")
      .select(`
        id,
        materi_pokok,
        alokasi_waktu,
        alokasi_jp,
        jumlah_pertemuan,
        pertemuan_ke,
        versi,
        status,
        updated_at,
        tujuan_pembelajaran_ids,
        model_pembelajaran ( id, nama ),
        penugasan (
          id,
          tingkat_kelas,
          rombel,
          guru_id,
          mapel ( id, nama, kode ),
          profiles ( id, nama_lengkap, nip ),
          tahun_ajaran ( id, nama, aktif )
        )
      `)
      .order("updated_at", { ascending: false });

    if (session.role === "guru") {
      query = query.eq("penugasan.guru_id", session.user.id);
    }

    const { data: rows, error: qErr } = await query;
    if (qErr) {
      return { success: false, data: [], error: qErr.message };
    }

    const list: RppCardItem[] = (rows || [])
      .filter((r) => r.penugasan !== null)
      .map((r) => {
        const penugasan = Array.isArray(r.penugasan) ? r.penugasan[0] : r.penugasan;
        const mapel = Array.isArray(penugasan?.mapel) ? penugasan?.mapel[0] : penugasan?.mapel;
        const guru = Array.isArray(penugasan?.profiles) ? penugasan?.profiles[0] : penugasan?.profiles;
        const ta = Array.isArray(penugasan?.tahun_ajaran) ? penugasan?.tahun_ajaran[0] : penugasan?.tahun_ajaran;
        const model = Array.isArray(r.model_pembelajaran) ? r.model_pembelajaran[0] : r.model_pembelajaran;

        return {
          id: r.id,
          materi_pokok: r.materi_pokok,
          versi: (r.versi as VersiRpp) || "minimum",
          status: (r.status as DocStatus) || "draf",
          alokasi_waktu: r.alokasi_waktu || "2 x 40 menit",
          alokasi_jp: Number(r.alokasi_jp || 2),
          jumlah_pertemuan: Number(r.jumlah_pertemuan || 1),
          pertemuan_ke: Number(r.pertemuan_ke || 1),
          mapel: {
            id: mapel?.id || "",
            nama: mapel?.nama || "Mata Pelajaran",
            kode: mapel?.kode || "",
          },
          tingkat_kelas: (penugasan?.tingkat_kelas || 7) as 7 | 8 | 9,
          rombel: penugasan?.rombel || "",
          guru: {
            id: guru?.id || "",
            nama_lengkap: guru?.nama_lengkap || "Guru",
            nip: guru?.nip || null,
          },
          tahun_ajaran: {
            id: ta?.id || "",
            nama: ta?.nama || "",
          },
          model_pembelajaran_nama: model?.nama || null,
          tp_count: (r.tujuan_pembelajaran_ids || []).length,
          updated_at: r.updated_at,
        };
      });

    return { success: true, data: list };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, data: [], error: msg };
  }
}

/**
 * 2. Mengambil penugasan guru & daftar TP untuk dialog "Buat RPP Baru"
 */
export async function getPenugasanAndTpListAction(): Promise<{
  success: boolean;
  data: {
    penugasanList: Array<{
      id: string;
      tingkat_kelas: 7 | 8 | 9;
      rombel: string;
      mapel_nama: string;
      mapel_kode: string;
      jp_per_minggu: number;
    }>;
    tpListByPenugasan: Record<
      string,
      Array<{
        id: string;
        kode_tp: string;
        materi_pokok: string;
        tujuan_pembelajaran_teks: string;
        panca_cinta_ids?: string[];
        dpl_ids?: string[];
        alokasi_jp?: number;
      }>
    >;
  };
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, data: { penugasanList: [], tpListByPenugasan: {} }, error: "Sesi tidak valid." };
    }

    const supabase = await createClient();

    // 1. Dapatkan tahun ajaran aktif
    const { data: activeTa } = await supabase
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .maybeSingle();

    if (!activeTa) {
      return { success: false, data: { penugasanList: [], tpListByPenugasan: {} }, error: "Tahun ajaran aktif belum ditentukan." };
    }

    // 2. Query penugasan
    let pQuery = supabase
      .from("penugasan")
      .select(`
        id,
        tingkat_kelas,
        rombel,
        guru_id,
        mapel ( id, nama, kode, jp_per_minggu_kls7, jp_per_minggu_kls8, jp_per_minggu_kls9 )
      `)
      .eq("tahun_ajaran_id", activeTa.id);

    if (session.role === "guru") {
      pQuery = pQuery.eq("guru_id", session.user.id);
    }

    const { data: pRows, error: pErr } = await pQuery;
    if (pErr) {
      return { success: false, data: { penugasanList: [], tpListByPenugasan: {} }, error: pErr.message };
    }

    const penugasanList = (pRows || []).map((p) => {
      const mapel = Array.isArray(p.mapel) ? p.mapel[0] : p.mapel;
      const jpField =
        p.tingkat_kelas === 7
          ? mapel?.jp_per_minggu_kls7
          : p.tingkat_kelas === 8
          ? mapel?.jp_per_minggu_kls8
          : mapel?.jp_per_minggu_kls9;

      return {
        id: p.id,
        tingkat_kelas: p.tingkat_kelas as 7 | 8 | 9,
        rombel: p.rombel,
        mapel_nama: mapel?.nama || "Mapel",
        mapel_kode: mapel?.kode || "",
        jp_per_minggu: Number(jpField || 2),
      };
    });

    const penugasanIds = penugasanList.map((p) => p.id);
    const tpListByPenugasan: Record<string, Array<{
      id: string;
      kode_tp: string;
      materi_pokok: string;
      tujuan_pembelajaran_teks: string;
      panca_cinta_ids?: string[];
      dpl_ids?: string[];
      alokasi_jp?: number;
    }>> = {};

    if (penugasanIds.length > 0) {
      // Ambil TP dari prota_item via prota atau langsung dari atp
      const { data: protaRows } = await supabase
        .from("prota")
        .select("id, penugasan_id, prota_item ( id, kode_tp, materi_pokok, tujuan_pembelajaran_teks, alokasi_jp, panca_cinta_nama )")
        .in("penugasan_id", penugasanIds);

      (protaRows || []).forEach((pr) => {
        const items = pr.prota_item || [];
        tpListByPenugasan[pr.penugasan_id] = items.map((it) => ({
          id: it.id,
          kode_tp: it.kode_tp || "TP",
          materi_pokok: it.materi_pokok,
          tujuan_pembelajaran_teks: it.tujuan_pembelajaran_teks || it.materi_pokok,
          alokasi_jp: it.alokasi_jp,
        }));
      });

      // Juga periksa analisis_cp -> tujuan_pembelajaran jika prota belum ada
      const { data: acpRows } = await supabase
        .from("analisis_cp")
        .select("id, penugasan_id, materi_pokok, tujuan_pembelajaran ( id, kode_tp, deskripsi, panca_cinta_ids, dpl_ids, alokasi_jp )")
        .in("penugasan_id", penugasanIds);

      (acpRows || []).forEach((acp) => {
        if (!tpListByPenugasan[acp.penugasan_id] || tpListByPenugasan[acp.penugasan_id].length === 0) {
          const tps = acp.tujuan_pembelajaran || [];
          tpListByPenugasan[acp.penugasan_id] = tps.map((t) => ({
            id: t.id,
            kode_tp: t.kode_tp,
            materi_pokok: acp.materi_pokok,
            tujuan_pembelajaran_teks: t.deskripsi,
            panca_cinta_ids: t.panca_cinta_ids || [],
            dpl_ids: t.dpl_ids || [],
            alokasi_jp: t.alokasi_jp,
          }));
        }
      });
    }

    return {
      success: true,
      data: {
        penugasanList,
        tpListByPenugasan,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, data: { penugasanList: [], tpListByPenugasan: {} }, error: msg };
  }
}

/**
 * 3. Membuat RPP baru dari penugasan dan TP terpilih
 */
export async function createRppAction(params: {
  penugasan_id: string;
  tp_ids: string[];
  versi: VersiRpp;
}): Promise<{
  success: boolean;
  rppId?: string;
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) return { success: false, error: "Sesi tidak valid." };

    const supabase = await getSupabaseClient();

    // 1. Verifikasi penugasan
    const { data: penugasan, error: pErr } = await supabase
      .from("penugasan")
      .select(`
        id,
        guru_id,
        tingkat_kelas,
        rombel,
        mapel ( id, nama, kode, jp_per_minggu_kls7, jp_per_minggu_kls8, jp_per_minggu_kls9 )
      `)
      .eq("id", params.penugasan_id)
      .single();

    if (pErr || !penugasan) return { success: false, error: "Penugasan tidak ditemukan." };
    if (session.role === "guru" && penugasan.guru_id !== session.user.id) {
      return { success: false, error: "Akses ditolak." };
    }

    const mapel = Array.isArray(penugasan.mapel) ? penugasan.mapel[0] : penugasan.mapel;
    const jpField =
      penugasan.tingkat_kelas === 7
        ? mapel?.jp_per_minggu_kls7
        : penugasan.tingkat_kelas === 8
        ? mapel?.jp_per_minggu_kls8
        : mapel?.jp_per_minggu_kls9;
    const defaultJpPerMinggu = Number(jpField || 2);

    // 2. Cari TP terpilih
    let materiPokok = "Materi Pokok Pembelajaran Mendalam";
    let tujuanTeks = "";
    let dplIds: string[] = [];
    let pancaCintaIds: string[] = [];
    let atpId: string | null = null;

    if (params.tp_ids.length > 0) {
      const { data: protaItems } = await supabase
        .from("prota_item")
        .select("id, kode_tp, materi_pokok, tujuan_pembelajaran_teks, alokasi_jp")
        .in("id", params.tp_ids);

      if (protaItems && protaItems.length > 0) {
        materiPokok = protaItems.map((p) => p.materi_pokok).filter((v, i, a) => a.indexOf(v) === i).join(" & ");
        tujuanTeks = protaItems.map((p) => `[${p.kode_tp}] ${p.tujuan_pembelajaran_teks}`).join("\n");
      }

      // Ambil juga dari tujuan_pembelajaran jika ada
      const { data: tpRows } = await supabase
        .from("tujuan_pembelajaran")
        .select("id, kode_tp, deskripsi, panca_cinta_ids, dpl_ids")
        .in("id", params.tp_ids);

      if (tpRows && tpRows.length > 0) {
        tpRows.forEach((t) => {
          if (t.dpl_ids) dplIds.push(...t.dpl_ids);
          if (t.panca_cinta_ids) pancaCintaIds.push(...t.panca_cinta_ids);
        });
      }
    }

    // Default DPL, Panca Cinta & Model Pembelajaran
    const { data: allPcRows } = await supabase.from("panca_cinta").select("id, nama").order("kode");
    if (pancaCintaIds.length === 0) {
      pancaCintaIds = (allPcRows || []).slice(0, 2).map((p) => p.id);
    }
    if (dplIds.length === 0) {
      const { data: dplDefault } = await supabase.from("dimensi_profil_lulusan").select("id").limit(3);
      dplIds = (dplDefault || []).map((d) => d.id);
    }

    const { data: defaultModel } = await supabase
      .from("model_pembelajaran")
      .select("id, nama, sintaks")
      .limit(1)
      .maybeSingle();

    const defaultSpec = getModelPedagogiSpec(defaultModel?.nama);

    // Ambil ATP ID jika ada
    const { data: atpRow } = await supabase
      .from("atp")
      .select("id")
      .eq("penugasan_id", params.penugasan_id)
      .maybeSingle();
    atpId = atpRow?.id || null;

    // 3. Siapkan baris RPP
    const defaultPertemuan = 2;
    const defaultTotalJp = defaultJpPerMinggu * defaultPertemuan;

    const defaultKesiapan = generateDefaultKesiapanMurid(materiPokok, mapel?.nama);
    const defaultKarakteristik = generateDefaultKarakteristik(materiPokok, mapel?.nama);
    const defaultLampiran = generateDefaultLampiran(
      materiPokok,
      mapel?.nama,
      penugasan.tingkat_kelas,
      defaultModel?.nama
    );

    const uniquePcIds = Array.from(new Set(pancaCintaIds));

    const rppPayload: RppInsert = {
      penugasan_id: params.penugasan_id,
      atp_id: atpId,
      model_id: defaultModel?.id || null,
      materi_pokok: materiPokok,
      topik_pembelajaran: materiPokok,
      alokasi_waktu: `${defaultTotalJp} JP (${defaultPertemuan} Pertemuan x ${defaultJpPerMinggu} x 40 menit)`,
      alokasi_jp: defaultTotalJp,
      jumlah_pertemuan: defaultPertemuan,
      menit_per_jp: 40,
      pertemuan_ke: 1,
      versi: params.versi,
      tujuan_pembelajaran_ids: params.tp_ids,
      dimensi_profil_lulusan_ids: Array.from(new Set(dplIds)),
      panca_cinta_ids: uniquePcIds,
      materi_kbc_ids: [],
      metode_pembelajaran: defaultSpec.rekomendasi_metode,
      karakteristik_materi: defaultKarakteristik.karakteristik_materi,
      benang_merah_kbc: defaultKarakteristik.benang_merah_kbc,
      kesiapan_murid: defaultKesiapan as any,
      lampiran: defaultLampiran as any,
      tujuan_pembelajaran_teks: tujuanTeks,
      lingkungan_belajar_fisik: "Ruang kelas yang nyaman, tertata rapi, dan mendukung diskusi kolaboratif.",
      budaya_belajar: "Budaya saling memuliakan, empati, kebebasan berpendapat dengan santun, dan cinta ilmu.",
      status: "draf",
      created_by: session.user.id,
    };

    const { data: insertedRpp, error: insErr } = await supabase
      .from("rpp")
      .insert(rppPayload)
      .select("id")
      .single();

    if (insErr || !insertedRpp) {
      return { success: false, error: "Gagal membuat RPP: " + insErr?.message };
    }

    const rppId = insertedRpp.id;

    // 4. Buat langkah-langkah kegiatan awal, inti bersintaks model, dan penutup per pertemuan
    const generatedLangkah = generateModelLangkahList({
      modelNama: defaultModel?.nama,
      sintaksDb:
        (defaultModel?.sintaks as unknown as Array<{
          urutan: number;
          nama_sintaks: string;
          pengalaman_belajar: PengalamanBelajar;
        }>) || null,
      materiPokok,
      topikPembelajaran: materiPokok,
      mapelNama: mapel?.nama,
      tingkatKelas: penugasan.tingkat_kelas,
      jumlahPertemuan: defaultPertemuan,
      alokasiJp: defaultTotalJp,
      menitPerJp: 40,
      pancaCintaIds: uniquePcIds,
      pancaCintaMaster: allPcRows || [],
      modeDistribusi: "utuh_per_pertemuan",
    });

    const initialLangkah: RppLangkahInsert[] = generatedLangkah.map((step) => ({
      rpp_id: rppId,
      pertemuan_ke: step.pertemuan_ke,
      tahap: step.tahap,
      pengalaman: step.pengalaman,
      deskripsi_kegiatan: step.deskripsi_kegiatan,
      durasi_menit: step.durasi_menit,
      urutan: step.urutan,
      prinsip: step.prinsip,
      panca_cinta_id: step.panca_cinta_id,
      aksi_kbc: step.aksi_kbc,
    }));

    await supabase.from("rpp_langkah").insert(initialLangkah);

    safeRevalidate("/modul-ajar");
    return { success: true, rppId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, error: msg };
  }
}

/**
 * 4. Mengambil detail lengkap RPP untuk Wizard & Dokumen Cetak
 */
export async function getRppDetailAction(rppId: string): Promise<{
  success: boolean;
  data: RppDetailData | null;
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) return { success: false, data: null, error: "Sesi tidak valid." };

    const supabase = await getSupabaseClient();

    // 1. Ambil data RPP
    const { data: rppRow, error: rErr } = await supabase
      .from("rpp")
      .select(`
        id,
        penugasan_id,
        atp_id,
        materi_pokok,
        alokasi_waktu,
        alokasi_jp,
        jumlah_pertemuan,
        menit_per_jp,
        pertemuan_ke,
        versi,
        model_id,
        tujuan_pembelajaran_ids,
        dimensi_profil_lulusan_ids,
        panca_cinta_ids,
        materi_kbc_ids,
        karakteristik_materi,
        benang_merah_kbc,
        materi_kbc_custom,
        lintas_disiplin_ilmu,
        topik_pembelajaran,
        metode_pembelajaran,
        kemitraan_pembelajaran,
        lingkungan_belajar_fisik,
        lingkungan_belajar_virtual,
        budaya_belajar,
        pemanfaatan_digital,
        tujuan_pembelajaran_teks,
        pemahaman_bermakna,
        pertanyaan_pemantik,
        sarana_prasarana,
        diferensiasi_konten,
        diferensiasi_proses,
        diferensiasi_produk,
        asesmen_awal,
        asesmen_proses,
        asesmen_akhir,
        kesiapan_murid,
        rubrik_kbc,
        kktp,
        lampiran,
        status,
        catatan_validator,
        snapshot_rpp,
        penugasan (
          id,
          tingkat_kelas,
          rombel,
          guru_id,
          mapel ( id, nama, kode, jp_per_minggu_kls7, jp_per_minggu_kls8, jp_per_minggu_kls9 ),
          profiles ( id, nama_lengkap, nip, gelar ),
          tahun_ajaran ( id, nama, aktif, tanggal_penetapan_dokumen )
        )
      `)
      .eq("id", rppId)
      .single();

    if (rErr || !rppRow) {
      return { success: false, data: null, error: "Dokumen RPP tidak ditemukan." };
    }

    const penugasan = Array.isArray(rppRow.penugasan) ? rppRow.penugasan[0] : rppRow.penugasan;
    if (session.role === "guru" && penugasan?.guru_id !== session.user.id) {
      return { success: false, data: null, error: "Akses ditolak." };
    }

    const mapel = Array.isArray(penugasan?.mapel) ? penugasan?.mapel[0] : penugasan?.mapel;
    const guru = Array.isArray(penugasan?.profiles) ? penugasan?.profiles[0] : penugasan?.profiles;
    const ta = Array.isArray(penugasan?.tahun_ajaran) ? penugasan?.tahun_ajaran[0] : penugasan?.tahun_ajaran;

    const jpField =
      penugasan?.tingkat_kelas === 7
        ? mapel?.jp_per_minggu_kls7
        : penugasan?.tingkat_kelas === 8
        ? mapel?.jp_per_minggu_kls8
        : mapel?.jp_per_minggu_kls9;
    const jpPerMinggu = Number(jpField || 2);

    // 2. Ambil master data (DPL, Panca Cinta, Materi KBC, Model Pembelajaran, Madrasah)
    const [dplRes, pcRes, kbcRes, modelRes, madrasahRes, langkahRes] = await Promise.all([
      supabase.from("dimensi_profil_lulusan").select("id, kode, nama, elemen_kunci").order("kode"),
      supabase.from("panca_cinta").select("id, kode, nama, deskripsi").order("kode"),
      supabase.from("materi_kbc").select("id, panca_cinta_id, pilar, nilai, deskripsi"),
      supabase.from("model_pembelajaran").select("id, nama, sintaks"),
      supabase.from("madrasah").select("nama, nsm, npsn, alamat, kabupaten, kepala_nama, kepala_nip, logo_url, hari_sekolah").limit(1).maybeSingle(),
      supabase.from("rpp_langkah").select("*").eq("rpp_id", rppId).order("pertemuan_ke", { ascending: true }).order("urutan", { ascending: true }),
    ]);

    // 3. Ambil CP terkait mapel
    let cpRow: { id: string; elemen: string; deskripsi_cp: string } | null = null;
    if (mapel?.id) {
      const { data: cpData } = await supabase
        .from("capaian_pembelajaran")
        .select("id, elemen, deskripsi_cp")
        .eq("mapel_id", mapel.id)
        .eq("fase", "D")
        .limit(1)
        .maybeSingle();
      cpRow = cpData || null;
    }

    // 4. Ambil daftar TP dari penugasan terkait
    let daftarTp: Array<{
      id: string;
      kode_tp: string;
      materi_pokok: string;
      tujuan_pembelajaran_teks: string;
      panca_cinta_ids?: string[];
      dpl_ids?: string[];
      alokasi_jp?: number;
    }> = [];

    const { data: protaItems } = await supabase
      .from("prota_item")
      .select("id, kode_tp, materi_pokok, tujuan_pembelajaran_teks, alokasi_jp")
      .eq("prota.penugasan_id", penugasan.id);

    if (protaItems && protaItems.length > 0) {
      daftarTp = protaItems.map((it) => ({
        id: it.id,
        kode_tp: it.kode_tp || "TP",
        materi_pokok: it.materi_pokok,
        tujuan_pembelajaran_teks: it.tujuan_pembelajaran_teks || it.materi_pokok,
        alokasi_jp: it.alokasi_jp,
      }));
    }

    // Format langkahList
    const langkahList: RppLangkahPayload[] = (langkahRes.data || []).map((l, idx) => ({
      id: l.id,
      rpp_id: l.rpp_id,
      pertemuan_ke: l.pertemuan_ke || 1,
      tahap: l.tahap,
      pengalaman: l.pengalaman,
      deskripsi_kegiatan: l.deskripsi_kegiatan,
      durasi_menit: l.durasi_menit || 10,
      urutan: l.urutan || idx + 1,
      prinsip: (l.prinsip as Array<"berkesadaran" | "bermakna" | "menggembirakan">) || ["berkesadaran"],
      panca_cinta_id: l.panca_cinta_id || null,
      aksi_kbc: l.aksi_kbc || null,
    }));

    // Generate fallback saran jika data RPP masih kosong
    const activeModelRow =
      (modelRes.data || []).find((m) => m.id === rppRow.model_id) ||
      (modelRes.data || [])[0] ||
      null;
    const fallbackKesiapan = generateDefaultKesiapanMurid(rppRow.materi_pokok, mapel?.nama);
    const fallbackKarakteristik = generateDefaultKarakteristik(rppRow.materi_pokok, mapel?.nama);
    const fallbackLampiran = generateDefaultLampiran(
      rppRow.materi_pokok,
      mapel?.nama,
      penugasan?.tingkat_kelas,
      activeModelRow?.nama
    );

    // Parse snapshot fallback jika ada
    let kesiapanMuridParsed: KesiapanMuridData = {
      pengetahuan_awal: fallbackKesiapan.pengetahuan_awal,
      minat: fallbackKesiapan.minat,
      latar_belakang: fallbackKesiapan.latar_belakang,
      kebutuhan: fallbackKesiapan.kebutuhan,
      strategi_asesmen_awal: fallbackKesiapan.strategi_asesmen_awal,
      tindak_lanjut: fallbackKesiapan.tindak_lanjut,
    };
    if (rppRow.kesiapan_murid && typeof rppRow.kesiapan_murid === "object") {
      const existingKm = rppRow.kesiapan_murid as Record<string, string>;
      (Object.keys(kesiapanMuridParsed) as Array<keyof KesiapanMuridData>).forEach((k) => {
        if (existingKm[k] && typeof existingKm[k] === "string" && existingKm[k].trim()) {
          kesiapanMuridParsed[k] = existingKm[k];
        }
      });
    }

    let lampiranParsed: LampiranData = {
      lkpd: fallbackLampiran.lkpd,
      bahan_bacaan: fallbackLampiran.bahan_bacaan,
      rubrik_penilaian: fallbackLampiran.rubrik_penilaian,
      glosarium: fallbackLampiran.glosarium,
      daftar_pustaka: fallbackLampiran.daftar_pustaka,
    };
    if (rppRow.lampiran && typeof rppRow.lampiran === "object") {
      const existingLp = rppRow.lampiran as Record<string, string>;
      (["lkpd", "bahan_bacaan", "rubrik_penilaian", "glosarium", "daftar_pustaka"] as const).forEach((k) => {
        if (existingLp[k] && typeof existingLp[k] === "string" && existingLp[k].trim()) {
          lampiranParsed[k] = existingLp[k];
        }
      });
    }

    const rubrikKbcParsed: RubrikKbcItem[] = Array.isArray(rppRow.rubrik_kbc)
      ? (rppRow.rubrik_kbc as unknown as RubrikKbcItem[])
      : [];

    return {
      success: true,
      data: {
        rpp: {
          id: rppRow.id,
          penugasan_id: rppRow.penugasan_id,
          atp_id: rppRow.atp_id,
          materi_pokok: rppRow.materi_pokok,
          alokasi_waktu: rppRow.alokasi_waktu || "4 JP (2 Pertemuan x 80 menit)",
          alokasi_jp: Number(rppRow.alokasi_jp || 4),
          jumlah_pertemuan: Number(rppRow.jumlah_pertemuan || 2),
          menit_per_jp: Number(rppRow.menit_per_jp || 40),
          pertemuan_ke: Number(rppRow.pertemuan_ke || 1),
          versi: (rppRow.versi as VersiRpp) || "minimum",
          model_id: rppRow.model_id,
          tujuan_pembelajaran_ids: rppRow.tujuan_pembelajaran_ids || [],
          dimensi_profil_lulusan_ids: rppRow.dimensi_profil_lulusan_ids || [],
          panca_cinta_ids: rppRow.panca_cinta_ids || [],
          materi_kbc_ids: rppRow.materi_kbc_ids || [],
          karakteristik_materi: rppRow.karakteristik_materi || fallbackKarakteristik.karakteristik_materi,
          benang_merah_kbc: rppRow.benang_merah_kbc || fallbackKarakteristik.benang_merah_kbc,
          materi_kbc_custom: rppRow.materi_kbc_custom || "",
          lintas_disiplin_ilmu: rppRow.lintas_disiplin_ilmu || "",
          topik_pembelajaran: rppRow.topik_pembelajaran || rppRow.materi_pokok || "",
          metode_pembelajaran: rppRow.metode_pembelajaran || ["Diskusi Kelompok", "Presentasi"],
          kemitraan_pembelajaran: rppRow.kemitraan_pembelajaran || "",
          lingkungan_belajar_fisik: rppRow.lingkungan_belajar_fisik || "Ruang Kelas",
          lingkungan_belajar_virtual: rppRow.lingkungan_belajar_virtual || "",
          budaya_belajar: rppRow.budaya_belajar || "Saling menghargai dan cinta ilmu",
          pemanfaatan_digital: rppRow.pemanfaatan_digital || "",
          tujuan_pembelajaran_teks: rppRow.tujuan_pembelajaran_teks || "",
          pemahaman_bermakna: rppRow.pemahaman_bermakna || "",
          pertanyaan_pemantik: rppRow.pertanyaan_pemantik || "",
          sarana_prasarana: rppRow.sarana_prasarana || "",
          diferensiasi_konten: rppRow.diferensiasi_konten || "",
          diferensiasi_proses: rppRow.diferensiasi_proses || "",
          diferensiasi_produk: rppRow.diferensiasi_produk || "",
          asesmen_awal: rppRow.asesmen_awal || "",
          asesmen_proses: rppRow.asesmen_proses || "",
          asesmen_akhir: rppRow.asesmen_akhir || "",
          kesiapan_murid: kesiapanMuridParsed,
          rubrik_kbc: rubrikKbcParsed,
          kktp: rppRow.kktp || "",
          lampiran: lampiranParsed,
          status: (rppRow.status as DocStatus) || "draf",
          catatan_validator: rppRow.catatan_validator,
        },
        langkahList,
        penugasan: {
          id: penugasan.id,
          tingkat_kelas: (penugasan.tingkat_kelas || 7) as 7 | 8 | 9,
          rombel: penugasan.rombel || "",
          mapel: {
            id: mapel?.id || "",
            nama: mapel?.nama || "Mata Pelajaran",
            kode: mapel?.kode || "",
            jp_per_minggu: jpPerMinggu,
          },
          guru: {
            id: guru?.id || "",
            nama_lengkap: guru?.nama_lengkap || "Guru",
            nip: guru?.nip || null,
            gelar: guru?.gelar || null,
          },
          tahun_ajaran: {
            id: ta?.id || "",
            nama: ta?.nama || "",
            tanggal_penetapan_dokumen: ta?.tanggal_penetapan_dokumen || null,
          },
        },
        madrasah: {
          nama: madrasahRes.data?.nama || "MTs KH A Wahab Muhsin",
          nsm: madrasahRes.data?.nsm || null,
          npsn: madrasahRes.data?.npsn || null,
          alamat: madrasahRes.data?.alamat || "Sukahideng, Sukarame, Tasikmalaya",
          kabupaten: madrasahRes.data?.kabupaten || "Tasikmalaya",
          kepala_nama: madrasahRes.data?.kepala_nama || "Kepala Madrasah",
          kepala_nip: madrasahRes.data?.kepala_nip || null,
          logo_url: madrasahRes.data?.logo_url || null,
          hari_sekolah: (madrasahRes.data?.hari_sekolah === 5 ? 5 : 6) as 5 | 6,
        },
        master: {
          dpl: (dplRes.data || []).map((d) => ({
            id: d.id,
            kode: d.kode,
            nama: d.nama,
            elemen_kunci: d.elemen_kunci || [],
          })),
          pancaCinta: (pcRes.data || []).map((p) => ({
            id: p.id,
            kode: p.kode,
            nama: p.nama,
            deskripsi: p.deskripsi || "",
          })),
          materiKbc: (kbcRes.data || []).map((k) => ({
            id: k.id,
            panca_cinta_id: k.panca_cinta_id,
            pilar: k.pilar,
            nilai: k.nilai,
            deskripsi: k.deskripsi,
          })),
          models: (modelRes.data || []).map((m) => ({
            id: m.id,
            nama: m.nama,
            sintaks: (Array.isArray(m.sintaks) ? m.sintaks : []) as Array<{
              urutan: number;
              nama_sintaks: string;
              pengalaman_belajar: PengalamanBelajar;
            }>,
          })),
          daftarTp,
          capaianPembelajaran: cpRow,
        },
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, data: null, error: msg };
  }
}

/**
 * 5. Menyimpan RPP (Draf Autosave atau Ajukan Validasi)
 */
export async function saveRppAction(
  rppId: string,
  payload: {
    rpp: Partial<RppDetailData["rpp"]>;
    langkahList: RppLangkahPayload[];
  },
  targetStatus: DocStatus = "draf"
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentUser();
    if (!session) return { success: false, error: "Sesi tidak valid." };

    const supabase = await getSupabaseClient();

    // 1. Validasi keberadaan RPP & hak akses
    const { data: existingRpp, error: checkErr } = await supabase
      .from("rpp")
      .select("id, penugasan_id, penugasan(guru_id)")
      .eq("id", rppId)
      .single();

    if (checkErr || !existingRpp) return { success: false, error: "Dokumen RPP tidak ditemukan." };

    const penugasan = Array.isArray(existingRpp.penugasan) ? existingRpp.penugasan[0] : existingRpp.penugasan;
    if (session.role === "guru" && penugasan?.guru_id !== session.user.id) {
      return { success: false, error: "Akses ditolak." };
    }

    const { rpp: rData, langkahList } = payload;

    // 2. Jika mengajukan validasi, jalankan validasi pedagogis Kemenag & KBC
    if (targetStatus === "diajukan") {
      const jumlahPertemuan = Number(rData.jumlah_pertemuan || 1);
      const alokasiJp = Number(rData.alokasi_jp || 2);
      const menitPerJp = Number(rData.menit_per_jp || 40);
      const targetDurasiPerPertemuan = (alokasiJp / jumlahPertemuan) * menitPerJp;

      // a. Validasi pengalaman belajar minimal: 1 memahami, 1 mengaplikasi, 1 merefleksi
      for (let p = 1; p <= jumlahPertemuan; p++) {
        const langkahPertemuan = langkahList.filter((l) => l.pertemuan_ke === p);
        if (langkahPertemuan.length === 0) {
          return { success: false, error: `Pertemuan ${p} belum memiliki langkah kegiatan.` };
        }

        const hasMemahami = langkahPertemuan.some((l) => l.pengalaman === "memahami");
        const hasMengaplikasi = langkahPertemuan.some((l) => l.pengalaman === "mengaplikasi");
        const hasMerefleksi = langkahPertemuan.some((l) => l.pengalaman === "merefleksi");

        if (!hasMemahami || !hasMengaplikasi || !hasMerefleksi) {
          return {
            success: false,
            error: `Pertemuan ${p} wajib memiliki minimal 1 langkah Memahami, 1 Mengaplikasi, dan 1 Merefleksi.`,
          };
        }

        // Cek total durasi
        const totalDurasi = langkahPertemuan.reduce((s, l) => s + Number(l.durasi_menit || 0), 0);
        if (Math.abs(totalDurasi - targetDurasiPerPertemuan) > 5) {
          return {
            success: false,
            error: `Total durasi Pertemuan ${p} adalah ${totalDurasi} menit. Seharusnya sesuai alokasi ${targetDurasiPerPertemuan} menit (${alokasiJp / jumlahPertemuan} JP x ${menitPerJp} menit).`,
          };
        }
      }

      // b. Validasi integrasi Topik Panca Cinta terpilih
      const selectedPcIds = rData.panca_cinta_ids || [];
      if (selectedPcIds.length === 0) {
        return { success: false, error: "Pilih minimal 1 Topik Panca Cinta di Langkah 2 (Identifikasi)." };
      }

      const integratedPcIds = new Set(
        langkahList
          .map((l) => l.panca_cinta_id)
          .filter((id): id is string => Boolean(id))
      );

      for (const pcId of selectedPcIds) {
        if (!integratedPcIds.has(pcId)) {
          return {
            success: false,
            error: "Setiap Topik Panca Cinta yang dipilih di Identifikasi wajib terintegrasi minimal di 1 langkah kegiatan pembelajaran.",
          };
        }
      }

      // c. Validasi versi Lengkap
      if (rData.versi === "lengkap") {
        if (!rData.kesiapan_murid?.pengetahuan_awal) {
          return { success: false, error: "[Versi Lengkap] Kesiapan murid (pengetahuan awal) wajib diisi." };
        }
        if (!rData.topik_pembelajaran) {
          return { success: false, error: "[Versi Lengkap] Topik pembelajaran wajib diisi di Desain Pembelajaran." };
        }
      }
    }

    // Gunakan adminDb untuk operasi tulis dokumen setelah autentikasi & otorisasi diverifikasi
    const adminDb = createAdminClient();

    // 3. Susun snapshot & update tabel rpp (pertahankan status awal/draf sebelum langkah disimpan)
    const updatePayload: RppUpdate = {
      materi_pokok: rData.materi_pokok || "Materi Pokok",
      alokasi_waktu: rData.alokasi_waktu || "2 x 40 menit",
      alokasi_jp: Number(rData.alokasi_jp || 2),
      jumlah_pertemuan: Number(rData.jumlah_pertemuan || 1),
      menit_per_jp: Number(rData.menit_per_jp || 40),
      pertemuan_ke: Number(rData.pertemuan_ke || 1),
      versi: rData.versi || "minimum",
      model_id: rData.model_id || null,
      tujuan_pembelajaran_ids: rData.tujuan_pembelajaran_ids || [],
      dimensi_profil_lulusan_ids: rData.dimensi_profil_lulusan_ids || [],
      panca_cinta_ids: rData.panca_cinta_ids || [],
      materi_kbc_ids: rData.materi_kbc_ids || [],
      karakteristik_materi: rData.karakteristik_materi || null,
      benang_merah_kbc: rData.benang_merah_kbc || null,
      materi_kbc_custom: rData.materi_kbc_custom || null,
      lintas_disiplin_ilmu: rData.lintas_disiplin_ilmu || null,
      topik_pembelajaran: rData.topik_pembelajaran || null,
      metode_pembelajaran: rData.metode_pembelajaran || null,
      kemitraan_pembelajaran: rData.kemitraan_pembelajaran || null,
      lingkungan_belajar_fisik: rData.lingkungan_belajar_fisik || null,
      lingkungan_belajar_virtual: rData.lingkungan_belajar_virtual || null,
      budaya_belajar: rData.budaya_belajar || null,
      pemanfaatan_digital: rData.pemanfaatan_digital || null,
      tujuan_pembelajaran_teks: rData.tujuan_pembelajaran_teks || null,
      pemahaman_bermakna: rData.pemahaman_bermakna || null,
      pertanyaan_pemantik: rData.pertanyaan_pemantik || null,
      sarana_prasarana: rData.sarana_prasarana || null,
      diferensiasi_konten: rData.diferensiasi_konten || null,
      diferensiasi_proses: rData.diferensiasi_proses || null,
      diferensiasi_produk: rData.diferensiasi_produk || null,
      asesmen_awal: rData.asesmen_awal || null,
      asesmen_proses: rData.asesmen_proses || null,
      asesmen_akhir: rData.asesmen_akhir || null,
      kesiapan_murid: rData.kesiapan_murid ? JSON.parse(JSON.stringify(rData.kesiapan_murid)) : null,
      rubrik_kbc: rData.rubrik_kbc ? JSON.parse(JSON.stringify(rData.rubrik_kbc)) : null,
      kktp: rData.kktp || null,
      lampiran: rData.lampiran ? JSON.parse(JSON.stringify(rData.lampiran)) : null,
      snapshot_rpp: JSON.parse(JSON.stringify({ rpp: rData, langkahList, savedAt: new Date().toISOString() })),
      updated_at: new Date().toISOString(),
    };

    const { error: upErr } = await adminDb.from("rpp").update(updatePayload).eq("id", rppId);
    if (upErr && upErr.message.includes("column")) {
      // Fallback jika kolom skema baru belum aktif di remote DB
      const safeUpdate: RppUpdate = {
        materi_pokok: rData.materi_pokok || "Materi Pokok",
        alokasi_waktu: rData.alokasi_waktu || "2 x 40 menit",
        versi: rData.versi || "minimum",
        model_id: rData.model_id || null,
        tujuan_pembelajaran_ids: rData.tujuan_pembelajaran_ids || [],
        dimensi_profil_lulusan_ids: rData.dimensi_profil_lulusan_ids || [],
        panca_cinta_ids: rData.panca_cinta_ids || [],
        pemahaman_bermakna: rData.pemahaman_bermakna || null,
        pertanyaan_pemantik: rData.pertanyaan_pemantik || null,
        sarana_prasarana: rData.sarana_prasarana || null,
        diferensiasi_konten: rData.diferensiasi_konten || null,
        diferensiasi_proses: rData.diferensiasi_proses || null,
        diferensiasi_produk: rData.diferensiasi_produk || null,
        asesmen_awal: rData.asesmen_awal || null,
        asesmen_proses: rData.asesmen_proses || null,
        asesmen_akhir: rData.asesmen_akhir || null,
        catatan_validator: JSON.stringify({ rpp: rData, langkahList }),
        updated_at: new Date().toISOString(),
      };
      await adminDb.from("rpp").update(safeUpdate).eq("id", rppId);
    } else if (upErr) {
      return { success: false, error: "Gagal menyimpan RPP: " + upErr.message };
    }

    // 4. Simpan langkah kegiatan ke rpp_langkah
    await adminDb.from("rpp_langkah").delete().eq("rpp_id", rppId);

    if (langkahList.length > 0) {
      const langkahInserts: RppLangkahInsert[] = langkahList.map((l, idx) => ({
        rpp_id: rppId,
        pertemuan_ke: l.pertemuan_ke || 1,
        tahap: l.tahap,
        pengalaman: l.pengalaman,
        deskripsi_kegiatan: l.deskripsi_kegiatan,
        durasi_menit: l.durasi_menit,
        urutan: idx + 1,
        prinsip: l.prinsip || ["berkesadaran"],
        panca_cinta_id: l.panca_cinta_id || null,
        aksi_kbc: l.aksi_kbc || null,
        created_by: session.user.id,
      }));

      const { error: lErr } = await adminDb.from("rpp_langkah").insert(langkahInserts);
      if (lErr && lErr.message.includes("column")) {
        // Fallback untuk kolom dasar rpp_langkah
        const basicLangkah = langkahList.map((l, idx) => ({
          rpp_id: rppId,
          tahap: l.tahap,
          pengalaman: l.pengalaman,
          deskripsi_kegiatan: l.deskripsi_kegiatan,
          durasi_menit: l.durasi_menit,
          urutan: idx + 1,
          created_by: session.user.id,
        }));
        await adminDb.from("rpp_langkah").insert(basicLangkah);
      } else if (lErr) {
        return { success: false, error: "Gagal menyimpan langkah kegiatan RPP: " + lErr.message };
      }
    }

    // 5. Perbarui status dokumen akhir (misal "diajukan" atau "draf")
    await adminDb
      .from("rpp")
      .update({
        status: targetStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rppId);

    safeRevalidate("/modul-ajar");
    safeRevalidate(`/modul-ajar/${rppId}`);
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, error: msg };
  }
}

/**
 * 6. Duplikasi RPP
 */
export async function duplicateRppAction(rppId: string): Promise<{
  success: boolean;
  newRppId?: string;
  newId?: string;
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) return { success: false, error: "Sesi tidak valid." };

    const supabase = await getSupabaseClient();

    // 1. Ambil data sumber
    const { data: srcRpp, error: sErr } = await supabase
      .from("rpp")
      .select("*")
      .eq("id", rppId)
      .single();

    if (sErr || !srcRpp) return { success: false, error: "RPP sumber tidak ditemukan." };

    const { data: srcLangkah } = await supabase
      .from("rpp_langkah")
      .select("*")
      .eq("rpp_id", rppId)
      .order("pertemuan_ke", { ascending: true })
      .order("urutan", { ascending: true });

    // 2. Insert RPP baru
    const newRppInsert: RppInsert = {
      ...srcRpp,
      id: undefined,
      materi_pokok: `[Salinan] ${srcRpp.materi_pokok}`,
      status: "draf",
      catatan_validator: null,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    delete (newRppInsert as unknown as { id?: string }).id;

    const { data: newRpp, error: nErr } = await supabase
      .from("rpp")
      .insert(newRppInsert)
      .select("id")
      .single();

    if (nErr || !newRpp) return { success: false, error: "Gagal menggandakan RPP: " + nErr?.message };

    // 3. Kloning langkah kegiatan
    if (srcLangkah && srcLangkah.length > 0) {
      const clonedLangkah = srcLangkah.map((l) => ({
        ...l,
        id: undefined,
        rpp_id: newRpp.id,
        created_by: session.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      await supabase.from("rpp_langkah").insert(clonedLangkah);
    }

    safeRevalidate("/modul-ajar");
    return { success: true, newRppId: newRpp.id, newId: newRpp.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, error: msg };
  }
}

/**
 * 7. Hapus RPP (Hanya jika Draf atau Revisi)
 */
export async function deleteRppAction(rppId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) return { success: false, error: "Sesi tidak valid." };

    const supabase = await getSupabaseClient();

    const { data: rpp, error: cErr } = await supabase
      .from("rpp")
      .select("id, status, penugasan(guru_id)")
      .eq("id", rppId)
      .single();

    if (cErr || !rpp) return { success: false, error: "RPP tidak ditemukan." };

    const penugasan = Array.isArray(rpp.penugasan) ? rpp.penugasan[0] : rpp.penugasan;
    if (session.role === "guru" && penugasan?.guru_id !== session.user.id) {
      return { success: false, error: "Akses ditolak." };
    }

    if (rpp.status === "diajukan" || rpp.status === "disetujui") {
      return { success: false, error: "Dokumen yang berstatus 'diajukan' atau 'disetujui' tidak dapat dihapus." };
    }

    await supabase.from("rpp_langkah").delete().eq("rpp_id", rppId);
    const { error: dErr } = await supabase.from("rpp").delete().eq("id", rppId);

    if (dErr) return { success: false, error: "Gagal menghapus RPP: " + dErr.message };

    safeRevalidate("/modul-ajar");
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, error: msg };
  }
}
