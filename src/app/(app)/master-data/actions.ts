"use server";

import { revalidatePath } from "next/cache";
import { requireRole, getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parsePenugasanExcel } from "@/lib/import/parse-penugasan-excel";
import type {
  JenisKegiatanKalender,
  KelompokMapel,
  PengalamanBelajar,
  SintaksModelItem,
} from "@/types/database";

// ==============================================================================
// 1. PROFIL MADRASAH
// ==============================================================================

export interface MadrasahData {
  id: string;
  nama: string;
  nsm: string | null;
  npsn: string | null;
  alamat: string | null;
  kabupaten: string | null;
  kepala_nama: string | null;
  kepala_nip: string | null;
  logo_url: string | null;
}

export async function getMadrasahAction(): Promise<{ data: MadrasahData | null; error?: string }> {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("madrasah")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return { data };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Gagal mengambil profil madrasah" };
  }
}

export async function updateMadrasahAction(payload: Partial<MadrasahData>) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    // Cek apakah sudah ada baris
    const { data: existing } = await supabase.from("madrasah").select("id").limit(1).maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("madrasah")
        .update({
          nama: payload.nama ?? "MTs KH A Wahab Muhsin",
          nsm: payload.nsm ?? null,
          npsn: payload.npsn ?? null,
          alamat: payload.alamat ?? null,
          kabupaten: payload.kabupaten ?? null,
          kepala_nama: payload.kepala_nama ?? null,
          kepala_nip: payload.kepala_nip ?? null,
          logo_url: payload.logo_url ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from("madrasah").insert({
        nama: payload.nama ?? "MTs KH A Wahab Muhsin",
        nsm: payload.nsm ?? null,
        npsn: payload.npsn ?? null,
        alamat: payload.alamat ?? null,
        kabupaten: payload.kabupaten ?? null,
        kepala_nama: payload.kepala_nama ?? null,
        kepala_nip: payload.kepala_nip ?? null,
        logo_url: payload.logo_url ?? null,
      });

      if (error) throw error;
    }

    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menyimpan data madrasah" };
  }
}

export async function uploadMadrasahLogoAction(formData: FormData) {
  try {
    await requireRole(["admin"]);
    const file = formData.get("file") as File | null;
    if (!file) throw new Error("File logo tidak ditemukan");

    if (file.size > 3 * 1024 * 1024) {
      throw new Error("Ukuran file maksimal 3 MB");
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const allowedExts = ["png", "jpg", "jpeg", "webp", "svg"];
    if (!allowedExts.includes(ext)) {
      throw new Error("Format file harus berupa PNG, JPG, JPEG, WEBP, atau SVG");
    }

    const supabase = createAdminClient();
    const fileName = `logo-madrasah-${Date.now()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("public-assets")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("public-assets")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Update langsung ke madrasah table
    const { data: existing } = await supabase.from("madrasah").select("id").limit(1).maybeSingle();
    if (existing) {
      await supabase
        .from("madrasah")
        .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    }

    revalidatePath("/master-data");
    return { success: true, url: publicUrl };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengunggah logo" };
  }
}

// ==============================================================================
// 2. TAHUN AJARAN
// ==============================================================================

export interface TahunAjaranItem {
  id: string;
  nama: string;
  tgl_mulai: string;
  tgl_selesai: string;
  smt1_mulai: string;
  smt1_selesai: string;
  smt2_mulai: string;
  smt2_selesai: string;
  aktif: boolean;
  tanggal_penetapan_dokumen: string | null;
}

export async function getTahunAjaranAction(): Promise<{ data: TahunAjaranItem[]; error?: string }> {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tahun_ajaran")
      .select("*")
      .order("nama", { ascending: false });

    if (error) throw error;
    return { data: (data as TahunAjaranItem[]) || [] };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Gagal mengambil data tahun ajaran" };
  }
}

export async function createTahunAjaranAction(payload: {
  nama: string;
  tgl_mulai: string;
  tgl_selesai: string;
  smt1_mulai: string;
  smt1_selesai: string;
  smt2_mulai: string;
  smt2_selesai: string;
  aktif?: boolean;
  tanggal_penetapan_dokumen?: string | null;
}) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    if (payload.aktif) {
      // Nonaktifkan yang lain dulu
      await supabase.from("tahun_ajaran").update({ aktif: false }).neq("id", "00000000-0000-0000-0000-000000000000");
    }

    const { error } = await supabase.from("tahun_ajaran").insert({
      nama: payload.nama,
      tgl_mulai: payload.tgl_mulai,
      tgl_selesai: payload.tgl_selesai,
      smt1_mulai: payload.smt1_mulai,
      smt1_selesai: payload.smt1_selesai,
      smt2_mulai: payload.smt2_mulai,
      smt2_selesai: payload.smt2_selesai,
      aktif: !!payload.aktif,
      tanggal_penetapan_dokumen: payload.tanggal_penetapan_dokumen || null,
    });

    if (error) throw error;
    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal membuat tahun ajaran" };
  }
}

export async function updateTahunAjaranAction(
  id: string,
  payload: {
    nama: string;
    tgl_mulai: string;
    tgl_selesai: string;
    smt1_mulai: string;
    smt1_selesai: string;
    smt2_mulai: string;
    smt2_selesai: string;
    aktif?: boolean;
    tanggal_penetapan_dokumen?: string | null;
  }
) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    if (payload.aktif) {
      await supabase.from("tahun_ajaran").update({ aktif: false }).neq("id", id);
    }

    const { error } = await supabase
      .from("tahun_ajaran")
      .update({
        nama: payload.nama,
        tgl_mulai: payload.tgl_mulai,
        tgl_selesai: payload.tgl_selesai,
        smt1_mulai: payload.smt1_mulai,
        smt1_selesai: payload.smt1_selesai,
        smt2_mulai: payload.smt2_mulai,
        smt2_selesai: payload.smt2_selesai,
        aktif: !!payload.aktif,
        tanggal_penetapan_dokumen: payload.tanggal_penetapan_dokumen || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui tahun ajaran" };
  }
}

export async function setAktifTahunAjaranAction(id: string) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    // 1. Nonaktifkan semua
    await supabase.from("tahun_ajaran").update({ aktif: false }).neq("id", id);

    // 2. Aktifkan ID ini
    const { error } = await supabase
      .from("tahun_ajaran")
      .update({ aktif: true, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengaktifkan tahun ajaran" };
  }
}

export async function deleteTahunAjaranAction(id: string) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase.from("tahun_ajaran").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus tahun ajaran" };
  }
}

// ==============================================================================
// 3. KALENDER PENDIDIKAN
// ==============================================================================

export interface KalenderItem {
  id: string;
  tahun_ajaran_id: string;
  tgl_mulai: string;
  tgl_selesai: string;
  jenis: JenisKegiatanKalender;
  keterangan: string;
  memotong_minggu_efektif: boolean;
  tahun_ajaran_nama?: string;
}

export async function getKalenderKegiatanAction(
  tahunAjaranId?: string
): Promise<{ data: KalenderItem[]; error?: string }> {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    let query = supabase
      .from("kalender_kegiatan")
      .select("*, tahun_ajaran:tahun_ajaran_id(nama)")
      .order("tgl_mulai", { ascending: true });

    if (tahunAjaranId) {
      query = query.eq("tahun_ajaran_id", tahunAjaranId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formatted: KalenderItem[] = (data || []).map((item) => ({
      id: item.id,
      tahun_ajaran_id: item.tahun_ajaran_id,
      tgl_mulai: item.tgl_mulai,
      tgl_selesai: item.tgl_selesai,
      jenis: item.jenis as JenisKegiatanKalender,
      keterangan: item.keterangan,
      memotong_minggu_efektif: !!item.memotong_minggu_efektif,
      tahun_ajaran_nama: (item.tahun_ajaran as { nama: string } | null)?.nama,
    }));

    return { data: formatted };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Gagal memuat kalender kegiatan" };
  }
}

export async function createKalenderKegiatanAction(payload: {
  tahun_ajaran_id: string;
  tgl_mulai: string;
  tgl_selesai: string;
  jenis: JenisKegiatanKalender;
  keterangan: string;
  memotong_minggu_efektif: boolean;
}) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase.from("kalender_kegiatan").insert({
      tahun_ajaran_id: payload.tahun_ajaran_id,
      tgl_mulai: payload.tgl_mulai,
      tgl_selesai: payload.tgl_selesai,
      jenis: payload.jenis,
      keterangan: payload.keterangan,
      memotong_minggu_efektif: payload.memotong_minggu_efektif,
    });

    if (error) throw error;
    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menambah kegiatan kalender" };
  }
}

export async function updateKalenderKegiatanAction(
  id: string,
  payload: {
    tahun_ajaran_id: string;
    tgl_mulai: string;
    tgl_selesai: string;
    jenis: JenisKegiatanKalender;
    keterangan: string;
    memotong_minggu_efektif: boolean;
  }
) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("kalender_kegiatan")
      .update({
        tahun_ajaran_id: payload.tahun_ajaran_id,
        tgl_mulai: payload.tgl_mulai,
        tgl_selesai: payload.tgl_selesai,
        jenis: payload.jenis,
        keterangan: payload.keterangan,
        memotong_minggu_efektif: payload.memotong_minggu_efektif,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui kegiatan kalender" };
  }
}

export async function deleteKalenderKegiatanAction(id: string) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase.from("kalender_kegiatan").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus kegiatan" };
  }
}

export async function importKalenderCsvAction(
  tahunAjaranId: string,
  items: Array<{
    tgl_mulai: string;
    tgl_selesai: string;
    jenis: JenisKegiatanKalender;
    keterangan: string;
    memotong_minggu_efektif?: boolean;
  }>
) {
  try {
    await requireRole(["admin"]);
    if (!items || items.length === 0) throw new Error("Tidak ada data untuk diimpor");

    const supabase = createAdminClient();
    const rows = items.map((it) => ({
      tahun_ajaran_id: tahunAjaranId,
      tgl_mulai: it.tgl_mulai,
      tgl_selesai: it.tgl_selesai,
      jenis: it.jenis,
      keterangan: it.keterangan,
      memotong_minggu_efektif: it.memotong_minggu_efektif ?? false,
    }));

    const { error } = await supabase.from("kalender_kegiatan").insert(rows);
    if (error) throw error;

    revalidatePath("/master-data");
    return { success: true, count: rows.length };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengimpor kegiatan CSV" };
  }
}

// ==============================================================================
// 4. MATA PELAJARAN
// ==============================================================================

export interface MapelItem {
  id: string;
  nama: string;
  kode: string;
  slug?: string | null;
  kelompok: KelompokMapel;
  jp_per_minggu_kls7: number;
  jp_per_minggu_kls8: number;
  jp_per_minggu_kls9: number;
  jp_default?: { [key: string]: number } | null;
  status_verifikasi?: string | null;
}

export async function getMapelAction(): Promise<{ data: MapelItem[]; error?: string }> {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("mapel")
      .select("*")
      .order("kode", { ascending: true });

    if (error) throw error;
    return { data: (data as MapelItem[]) || [] };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Gagal memuat mata pelajaran" };
  }
}

export async function createMapelAction(payload: {
  nama: string;
  kode: string;
  kelompok: KelompokMapel;
  jp_per_minggu_kls7: number;
  jp_per_minggu_kls8: number;
  jp_per_minggu_kls9: number;
}) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase.from("mapel").insert({
      nama: payload.nama,
      kode: payload.kode.toUpperCase(),
      kelompok: payload.kelompok,
      jp_per_minggu_kls7: payload.jp_per_minggu_kls7,
      jp_per_minggu_kls8: payload.jp_per_minggu_kls8,
      jp_per_minggu_kls9: payload.jp_per_minggu_kls9,
    });

    if (error) throw error;
    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menambah mata pelajaran" };
  }
}

export async function updateMapelAction(
  id: string,
  payload: {
    nama: string;
    kode: string;
    kelompok: KelompokMapel;
    jp_per_minggu_kls7: number;
    jp_per_minggu_kls8: number;
    jp_per_minggu_kls9: number;
  }
) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("mapel")
      .update({
        nama: payload.nama,
        kode: payload.kode.toUpperCase(),
        kelompok: payload.kelompok,
        jp_per_minggu_kls7: payload.jp_per_minggu_kls7,
        jp_per_minggu_kls8: payload.jp_per_minggu_kls8,
        jp_per_minggu_kls9: payload.jp_per_minggu_kls9,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui mata pelajaran" };
  }
}

export async function deleteMapelAction(id: string) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase.from("mapel").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus mata pelajaran" };
  }
}

// ==============================================================================
// 5. PENUGASAN GURU
// ==============================================================================

export interface PenugasanItem {
  id: string;
  guru_id: string;
  mapel_id: string;
  tahun_ajaran_id: string;
  tingkat_kelas: 7 | 8 | 9;
  rombel: string;
  guru_nama?: string;
  guru_nip?: string;
  mapel_nama?: string;
  mapel_kode?: string;
  tahun_ajaran_nama?: string;
  jp_per_minggu?: number;
}

export async function getGuruListAction() {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nama_lengkap, nip, gelar, role, aktif")
      .eq("aktif", true)
      .order("nama_lengkap", { ascending: true });

    if (error) throw error;
    return { data: data || [] };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Gagal memuat daftar guru" };
  }
}

export async function getPenugasanAction(
  tahunAjaranId?: string
): Promise<{ data: PenugasanItem[]; error?: string }> {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    let query = supabase
      .from("penugasan")
      .select(
        `*,
        guru:guru_id(nama_lengkap, nip, gelar),
        mapel:mapel_id(nama, kode, jp_per_minggu_kls7, jp_per_minggu_kls8, jp_per_minggu_kls9),
        tahun_ajaran:tahun_ajaran_id(nama)`
      )
      .order("tingkat_kelas", { ascending: true });

    if (tahunAjaranId) {
      query = query.eq("tahun_ajaran_id", tahunAjaranId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formatted: PenugasanItem[] = (data || []).map((row) => {
      const guru = row.guru as { nama_lengkap: string; nip: string | null; gelar: string | null } | null;
      const mapel = row.mapel as {
        nama: string;
        kode: string;
        jp_per_minggu_kls7: number;
        jp_per_minggu_kls8: number;
        jp_per_minggu_kls9: number;
      } | null;
      const ta = row.tahun_ajaran as { nama: string } | null;

      // Hitung JP berdasarkan tingkat kelas & jumlah rombel
      const rombelCount = row.rombel ? row.rombel.split(",").filter(Boolean).length : 1;
      let jpPerRombel = 2;
      if (mapel) {
        if (row.tingkat_kelas === 7) jpPerRombel = mapel.jp_per_minggu_kls7;
        else if (row.tingkat_kelas === 8) jpPerRombel = mapel.jp_per_minggu_kls8;
        else if (row.tingkat_kelas === 9) jpPerRombel = mapel.jp_per_minggu_kls9;
      }

      return {
        id: row.id,
        guru_id: row.guru_id,
        mapel_id: row.mapel_id,
        tahun_ajaran_id: row.tahun_ajaran_id,
        tingkat_kelas: row.tingkat_kelas as 7 | 8 | 9,
        rombel: row.rombel,
        guru_nama: guru ? `${guru.nama_lengkap}${guru.gelar ? `, ${guru.gelar}` : ""}` : "-",
        guru_nip: guru?.nip || "-",
        mapel_nama: mapel?.nama || "-",
        mapel_kode: mapel?.kode || "-",
        tahun_ajaran_nama: ta?.nama || "-",
        jp_per_minggu: jpPerRombel * rombelCount,
      };
    });

    return { data: formatted };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Gagal memuat data penugasan" };
  }
}

export async function createPenugasanAction(payload: {
  guru_id: string;
  mapel_id: string;
  tahun_ajaran_id: string;
  tingkat_kelas: 7 | 8 | 9;
  rombel: string;
}) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase.from("penugasan").insert({
      guru_id: payload.guru_id,
      mapel_id: payload.mapel_id,
      tahun_ajaran_id: payload.tahun_ajaran_id,
      tingkat_kelas: payload.tingkat_kelas,
      rombel: payload.rombel,
    });

    if (error) throw error;
    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menambah penugasan guru" };
  }
}

export async function updatePenugasanAction(
  id: string,
  payload: {
    guru_id: string;
    mapel_id: string;
    tahun_ajaran_id: string;
    tingkat_kelas: 7 | 8 | 9;
    rombel: string;
  }
) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("penugasan")
      .update({
        guru_id: payload.guru_id,
        mapel_id: payload.mapel_id,
        tahun_ajaran_id: payload.tahun_ajaran_id,
        tingkat_kelas: payload.tingkat_kelas,
        rombel: payload.rombel,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui penugasan guru" };
  }
}

export async function deletePenugasanAction(id: string) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase.from("penugasan").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus penugasan" };
  }
}

export interface ImportPenugasanRowResult {
  rowNumber: number;
  guru_nama: string;
  mapel_nama: string;
  tingkat_kelas: string;
  rombel: string;
  status: "berhasil" | "gagal";
  action?: "ditambahkan" | "diperbarui";
  message: string;
}

export interface ImportPenugasanActionResult {
  success: boolean;
  message?: string;
  totalRows?: number;
  berhasilCount?: number;
  gagalCount?: number;
  results?: ImportPenugasanRowResult[];
}

export async function importPenugasanAction(
  formData: FormData
): Promise<ImportPenugasanActionResult> {
  try {
    await requireRole(["admin"]);
    const session = await getCurrentUser();
    const adminClient = createAdminClient();

    const file = formData.get("file") as File | null;
    let tahunAjaranId = formData.get("tahun_ajaran_id") as string | null;

    if (!file || file.size === 0) {
      return { success: false, message: "File Excel tidak ditemukan. Silakan pilih file terlebih dahulu." };
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx") {
      return { success: false, message: "Format file harus berupa .xlsx (gunakan template yang disediakan)." };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, message: "Ukuran file maksimal 5 MB." };
    }

    // Jika tahun_ajaran_id tidak dikirim, gunakan tahun ajaran aktif
    if (!tahunAjaranId) {
      const { data: activeTa } = await adminClient
        .from("tahun_ajaran")
        .select("id")
        .eq("aktif", true)
        .maybeSingle();
      tahunAjaranId = activeTa?.id || null;
    }

    if (!tahunAjaranId) {
      return { success: false, message: "Tahun ajaran belum ditentukan. Pastikan tahun ajaran aktif telah diatur." };
    }

    // Ambil daftar guru terdaftar & mapel
    const [guruRes, mapelRes] = await Promise.all([
      adminClient
        .from("profiles")
        .select("id, nama_lengkap, nip, gelar, role, aktif")
        .eq("aktif", true)
        .order("nama_lengkap", { ascending: true }),
      adminClient
        .from("mapel")
        .select("id, kode, nama")
        .order("kode", { ascending: true }),
    ]);

    const guruList = guruRes.data || [];
    const mapelList = mapelRes.data || [];

    const buffer = Buffer.from(await file.arrayBuffer());

    let parsedRows;
    try {
      parsedRows = await parsePenugasanExcel(buffer, { guruList, mapelList });
    } catch {
      return {
        success: false,
        message: "Gagal membaca file Excel. Pastikan file tidak rusak dan menggunakan format template.",
      };
    }

    if (parsedRows.length === 0) {
      return {
        success: false,
        message: "Tidak ada data pada file. Isi minimal 1 baris data penugasan mulai dari baris ke-2.",
      };
    }

    // Ambil penugasan yang sudah ada di tahun ajaran ini untuk pengecekan upsert
    const { data: existingRows } = await adminClient
      .from("penugasan")
      .select("id, guru_id, mapel_id, tingkat_kelas, tahun_ajaran_id, rombel")
      .eq("tahun_ajaran_id", tahunAjaranId);

    const existingMap = new Map<string, { id: string; rombel: string }>();
    (existingRows || []).forEach((row) => {
      const key = `${row.guru_id}_${row.mapel_id}_${row.tingkat_kelas}`;
      existingMap.set(key, { id: row.id, rombel: row.rombel });
    });

    const results: ImportPenugasanRowResult[] = [];
    let berhasilCount = 0;
    let gagalCount = 0;

    for (const row of parsedRows) {
      const baseResult = {
        rowNumber: row.rowNumber,
        guru_nama: row.guru_nama || row.rawGuru || "-",
        mapel_nama: row.mapel_nama ? `[${row.mapel_kode}] ${row.mapel_nama}` : row.rawMapel || "-",
        tingkat_kelas: row.tingkat_kelas ? `Kelas ${row.tingkat_kelas}` : row.rawTingkat || "-",
        rombel: row.rombel || row.rawRombel || "-",
      };

      if (row.errors.length > 0) {
        gagalCount++;
        results.push({
          ...baseResult,
          status: "gagal",
          message: row.errors.join("; "),
        });
        continue;
      }

      if (!row.guru_id || !row.mapel_id || !row.tingkat_kelas) {
        gagalCount++;
        results.push({
          ...baseResult,
          status: "gagal",
          message: "Data guru, mapel, atau tingkat kelas tidak valid.",
        });
        continue;
      }

      const key = `${row.guru_id}_${row.mapel_id}_${row.tingkat_kelas}`;
      const existing = existingMap.get(key);

      if (existing) {
        // Perbarui rombel yang sudah ada
        const { error: upErr } = await adminClient
          .from("penugasan")
          .update({
            rombel: row.rombel,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (upErr) {
          gagalCount++;
          results.push({
            ...baseResult,
            status: "gagal",
            message: `Gagal memperbarui penugasan: ${upErr.message}`,
          });
        } else {
          berhasilCount++;
          results.push({
            ...baseResult,
            status: "berhasil",
            action: "diperbarui",
            message: "Penugasan guru berhasil diperbarui (rombel diselaraskan).",
          });
        }
      } else {
        // Tambah penugasan baru
        const { data: inserted, error: inErr } = await adminClient
          .from("penugasan")
          .insert({
            guru_id: row.guru_id,
            mapel_id: row.mapel_id,
            tingkat_kelas: row.tingkat_kelas,
            tahun_ajaran_id: tahunAjaranId,
            rombel: row.rombel,
            created_by: session?.user?.id || null,
          })
          .select("id, rombel")
          .single();

        if (inErr || !inserted) {
          gagalCount++;
          results.push({
            ...baseResult,
            status: "gagal",
            message: `Gagal menyimpan penugasan baru: ${inErr?.message || "Kesalahan database"}`,
          });
        } else {
          berhasilCount++;
          existingMap.set(key, { id: inserted.id, rombel: inserted.rombel });
          results.push({
            ...baseResult,
            status: "berhasil",
            action: "ditambahkan",
            message: "Penugasan baru berhasil ditambahkan.",
          });
        }
      }
    }

    revalidatePath("/master-data");
    revalidatePath("/atp");
    revalidatePath("/prota");
    revalidatePath("/prosem");
    revalidatePath("/modul-ajar");
    revalidatePath("/dashboard");

    return {
      success: true,
      totalRows: parsedRows.length,
      berhasilCount,
      gagalCount,
      results,
      message: `Proses import selesai. ${berhasilCount} berhasil (${berhasilCount > 0 ? "ditambahkan/diperbarui" : ""}), ${gagalCount} gagal.`,
    };
  } catch (err: unknown) {
    console.error("Gagal import penugasan:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kesalahan internal saat import penugasan.",
    };
  }
}

// ==============================================================================
// 6. CAPAIAN PEMBELAJARAN (CP)
// ==============================================================================

export interface CapaianPembelajaranItem {
  id: string;
  mapel_id: string;
  fase: string;
  elemen: string;
  deskripsi_cp: string;
  sumber_regulasi: string;
  mapel_nama?: string;
  mapel_kode?: string;
}

export async function getCapaianPembelajaranAction(
  mapelId?: string
): Promise<{ data: CapaianPembelajaranItem[]; error?: string }> {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    let query = supabase
      .from("capaian_pembelajaran")
      .select("*, mapel:mapel_id(nama, kode)")
      .order("elemen", { ascending: true });

    if (mapelId && mapelId !== "all") {
      query = query.eq("mapel_id", mapelId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formatted: CapaianPembelajaranItem[] = (data || []).map((row) => ({
      id: row.id,
      mapel_id: row.mapel_id,
      fase: row.fase,
      elemen: row.elemen,
      deskripsi_cp: row.deskripsi_cp,
      sumber_regulasi: row.sumber_regulasi,
      mapel_nama: (row.mapel as { nama: string } | null)?.nama,
      mapel_kode: (row.mapel as { kode: string } | null)?.kode,
    }));

    return { data: formatted };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Gagal memuat Capaian Pembelajaran" };
  }
}

export async function createCapaianPembelajaranAction(payload: {
  mapel_id: string;
  fase?: string;
  elemen: string;
  deskripsi_cp: string;
  sumber_regulasi?: string;
}) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase.from("capaian_pembelajaran").insert({
      mapel_id: payload.mapel_id,
      fase: payload.fase || "D",
      elemen: payload.elemen,
      deskripsi_cp: payload.deskripsi_cp,
      sumber_regulasi: payload.sumber_regulasi || "KMA 1503/2025",
    });

    if (error) throw error;
    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menambah CP" };
  }
}

export async function updateCapaianPembelajaranAction(
  id: string,
  payload: {
    mapel_id: string;
    fase?: string;
    elemen: string;
    deskripsi_cp: string;
    sumber_regulasi?: string;
  }
) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("capaian_pembelajaran")
      .update({
        mapel_id: payload.mapel_id,
        fase: payload.fase || "D",
        elemen: payload.elemen,
        deskripsi_cp: payload.deskripsi_cp,
        sumber_regulasi: payload.sumber_regulasi || "KMA 1503/2025",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui CP" };
  }
}

export async function deleteCapaianPembelajaranAction(id: string) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase.from("capaian_pembelajaran").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus CP" };
  }
}

export async function importCapaianPembelajaranAction(
  mapelId: string,
  items: Array<{ elemen: string; deskripsi_cp: string; sumber_regulasi?: string }>
) {
  try {
    await requireRole(["admin"]);
    if (!items || items.length === 0) throw new Error("Tidak ada data CP untuk diimpor");

    const supabase = createAdminClient();
    const rows = items.map((it) => ({
      mapel_id: mapelId,
      fase: "D",
      elemen: it.elemen.trim(),
      deskripsi_cp: it.deskripsi_cp.trim(),
      sumber_regulasi: it.sumber_regulasi?.trim() || "KMA 1503/2025",
    }));

    const { error } = await supabase.from("capaian_pembelajaran").insert(rows);
    if (error) throw error;

    revalidatePath("/master-data");
    return { success: true, count: rows.length };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengimpor CP" };
  }
}

// ==============================================================================
// 7. PANCA CINTA & MATERI KBC
// ==============================================================================

export interface PancaCintaItem {
  id: string;
  urutan: number;
  kode: string;
  nama: string;
  deskripsi: string | null;
}

export interface MateriKbcItem {
  id: string;
  panca_cinta_id: string;
  pilar: string;
  nilai: string;
  deskripsi: string;
  integrasi_sains_sosial: string | null;
  indikator_perilaku: string[];
  panca_cinta_nama?: string;
  panca_cinta_kode?: string;
}

export async function getPancaCintaAction(): Promise<{ data: PancaCintaItem[]; error?: string }> {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("panca_cinta")
      .select("*")
      .order("urutan", { ascending: true });

    if (error) throw error;
    return { data: (data as PancaCintaItem[]) || [] };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Gagal memuat Panca Cinta" };
  }
}

export async function updatePancaCintaAction(id: string, deskripsi: string) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("panca_cinta")
      .update({ deskripsi, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui deskripsi Panca Cinta" };
  }
}

export async function getMateriKbcAction(
  pancaCintaId?: string
): Promise<{ data: MateriKbcItem[]; error?: string }> {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    let query = supabase
      .from("materi_kbc")
      .select("*, panca_cinta:panca_cinta_id(nama, kode)")
      .order("created_at", { ascending: true });

    if (pancaCintaId && pancaCintaId !== "all") {
      query = query.eq("panca_cinta_id", pancaCintaId);
    }

    const { data, error } = await query;
    if (error) throw error;

    const formatted: MateriKbcItem[] = (data || []).map((row) => {
      let indikatorArr: string[] = [];
      if (Array.isArray(row.indikator_perilaku)) {
        indikatorArr = row.indikator_perilaku.map((x) =>
          typeof x === "string" ? x : typeof x === "object" && x !== null && "indikator" in x ? String((x as { indikator: unknown }).indikator) : JSON.stringify(x)
        );
      } else if (typeof row.indikator_perilaku === "string") {
        try {
          const parsed = JSON.parse(row.indikator_perilaku);
          if (Array.isArray(parsed)) indikatorArr = parsed.map((x) => String(x));
        } catch {
          indikatorArr = [row.indikator_perilaku];
        }
      }

      return {
        id: row.id,
        panca_cinta_id: row.panca_cinta_id,
        pilar: row.pilar,
        nilai: row.nilai,
        deskripsi: row.deskripsi,
        integrasi_sains_sosial: row.integrasi_sains_sosial,
        indikator_perilaku: indikatorArr,
        panca_cinta_nama: (row.panca_cinta as { nama: string } | null)?.nama,
        panca_cinta_kode: (row.panca_cinta as { kode: string } | null)?.kode,
      };
    });

    return { data: formatted };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Gagal memuat materi KBC" };
  }
}

export async function createMateriKbcAction(payload: {
  panca_cinta_id: string;
  pilar: string;
  nilai: string;
  deskripsi: string;
  integrasi_sains_sosial?: string;
  indikator_perilaku: string[];
}) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase.from("materi_kbc").insert({
      panca_cinta_id: payload.panca_cinta_id,
      pilar: payload.pilar,
      nilai: payload.nilai,
      deskripsi: payload.deskripsi,
      integrasi_sains_sosial: payload.integrasi_sains_sosial || null,
      indikator_perilaku: payload.indikator_perilaku,
    });

    if (error) throw error;
    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menambah materi KBC" };
  }
}

export async function updateMateriKbcAction(
  id: string,
  payload: {
    panca_cinta_id: string;
    pilar: string;
    nilai: string;
    deskripsi: string;
    integrasi_sains_sosial?: string;
    indikator_perilaku: string[];
  }
) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("materi_kbc")
      .update({
        panca_cinta_id: payload.panca_cinta_id,
        pilar: payload.pilar,
        nilai: payload.nilai,
        deskripsi: payload.deskripsi,
        integrasi_sains_sosial: payload.integrasi_sains_sosial || null,
        indikator_perilaku: payload.indikator_perilaku,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui materi KBC" };
  }
}

export async function deleteMateriKbcAction(id: string) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase.from("materi_kbc").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus materi KBC" };
  }
}

// ==============================================================================
// 8. MODEL PEMBELAJARAN
// ==============================================================================

export interface ModelPembelajaranItem {
  id: string;
  nama: string;
  sintaks: SintaksModelItem[];
}

export async function getModelPembelajaranAction(): Promise<{
  data: ModelPembelajaranItem[];
  error?: string;
}> {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("model_pembelajaran")
      .select("*")
      .order("nama", { ascending: true });

    if (error) throw error;

    const formatted: ModelPembelajaranItem[] = (data || []).map((row) => ({
      id: row.id,
      nama: row.nama,
      sintaks: Array.isArray(row.sintaks) ? (row.sintaks as unknown as SintaksModelItem[]) : [],
    }));

    return { data: formatted };
  } catch (err: unknown) {
    return { data: [], error: err instanceof Error ? err.message : "Gagal memuat model pembelajaran" };
  }
}

export async function createModelPembelajaranAction(payload: {
  nama: string;
  sintaks: Array<{
    urutan: number;
    nama_sintaks: string;
    pengalaman_belajar: PengalamanBelajar;
  }>;
}) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase.from("model_pembelajaran").insert({
      nama: payload.nama,
      sintaks: payload.sintaks,
    });

    if (error) throw error;
    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menambah model pembelajaran" };
  }
}

export async function updateModelPembelajaranAction(
  id: string,
  payload: {
    nama: string;
    sintaks: Array<{
      urutan: number;
      nama_sintaks: string;
      pengalaman_belajar: PengalamanBelajar;
    }>;
  }
) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("model_pembelajaran")
      .update({
        nama: payload.nama,
        sintaks: payload.sintaks,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memperbarui model pembelajaran" };
  }
}

export async function deleteModelPembelajaranAction(id: string) {
  try {
    await requireRole(["admin"]);
    const supabase = createAdminClient();

    const { error } = await supabase.from("model_pembelajaran").delete().eq("id", id);
    if (error) throw error;

    revalidatePath("/master-data");
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus model pembelajaran" };
  }
}
