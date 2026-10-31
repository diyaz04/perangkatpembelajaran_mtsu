"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import type { DocStatus, DokumenTipe } from "@/types/database";
import type { StatusTimelineItem } from "./types";
import { duplicateRppAction } from "@/app/(app)/modul-ajar/actions";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // In standalone CLI test scripts or outside request contexts, revalidatePath is ignored safely
  }
}

interface RecordRiwayatParams {
  dokumenTipe: DokumenTipe;
  dokumenId: string;
  validatorId: string;
  statusSebelum: DocStatus;
  statusSesudah: DocStatus;
  catatan?: string | null;
}

/**
 * Menyimpan catatan audit ke tabel riwayat_validasi menggunakan admin client
 */
export async function recordRiwayatValidasi({
  dokumenTipe,
  dokumenId,
  validatorId,
  statusSebelum,
  statusSesudah,
  catatan,
}: RecordRiwayatParams): Promise<boolean> {
  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient.from("riwayat_validasi").insert({
      dokumen_tipe: dokumenTipe,
      dokumen_id: dokumenId,
      validator_id: validatorId,
      status_sebelum: statusSebelum,
      status_sesudah: statusSesudah,
      catatan: catatan || null,
      tanggal: new Date().toISOString(),
    });

    if (error) {
      console.error("Gagal mencatat riwayat validasi:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Kesalahan sistem riwayat validasi:", err);
    return false;
  }
}

/**
 * Mengambil histori riwayat validasi untuk sebuah dokumen
 */
export async function getRiwayatValidasiAction(
  dokumenTipe: DokumenTipe,
  dokumenId: string
): Promise<{ success: boolean; data: StatusTimelineItem[]; error?: string }> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, data: [], error: "Sesi tidak valid." };
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient
      .from("riwayat_validasi")
      .select(`
        id,
        dokumen_tipe,
        dokumen_id,
        validator_id,
        status_sebelum,
        status_sesudah,
        catatan,
        tanggal,
        profiles (
          id,
          nama_lengkap,
          role,
          gelar
        )
      `)
      .eq("dokumen_tipe", dokumenTipe)
      .eq("dokumen_id", dokumenId)
      .order("tanggal", { ascending: false });

    if (error) {
      return { success: false, data: [], error: error.message };
    }

    const timeline: StatusTimelineItem[] = (data || []).map((row) => {
      const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return {
        id: row.id,
        dokumen_tipe: row.dokumen_tipe as DokumenTipe,
        dokumen_id: row.dokumen_id,
        validator_id: row.validator_id,
        validator_nama: p?.nama_lengkap || "Pengguna",
        validator_role: p?.role || "guru",
        validator_gelar: p?.gelar || null,
        status_sebelum: row.status_sebelum as DocStatus,
        status_sesudah: row.status_sesudah as DocStatus,
        catatan: row.catatan,
        tanggal: row.tanggal,
      };
    });

    return { success: true, data: timeline };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, data: [], error: msg };
  }
}

async function updateDokumenStatus(
  adminClient: ReturnType<typeof createAdminClient>,
  tableName: string,
  dokumenId: string,
  status: DocStatus,
  catatanValidator?: string | null
): Promise<{ error: { message: string } | null }> {
  const payload = {
    status,
    updated_at: new Date().toISOString(),
    ...(catatanValidator !== undefined ? { catatan_validator: catatanValidator } : {}),
  };

  if (tableName === "rpp") {
    return await adminClient.from("rpp").update(payload).eq("id", dokumenId);
  }
  if (tableName === "atp") {
    return await adminClient.from("atp").update(payload).eq("id", dokumenId);
  }
  if (tableName === "prota") {
    return await adminClient.from("prota").update(payload).eq("id", dokumenId);
  }
  if (tableName === "prosem") {
    return await adminClient.from("prosem").update(payload).eq("id", dokumenId);
  }
  return { error: { message: "Tipe dokumen tidak valid." } };
}

/**
 * Mengajukan dokumen untuk ditelaah (draf / revisi -> diajukan)
 */
export async function submitDokumenAction(
  dokumenTipe: DokumenTipe,
  dokumenId: string,
  catatanGuru?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi tidak valid." };
    }

    const adminClient = createAdminClient();

    // Dapatkan status sebelum
    const tableName = dokumenTipe === "analisis_cp" ? "analisis_cp" : dokumenTipe;
    const { data: existingDoc, error: docErr } = await adminClient
      .from(tableName as "rpp" | "atp" | "prota" | "prosem")
      .select("id, status")
      .eq("id", dokumenId)
      .single();

    if (docErr || !existingDoc) {
      return { success: false, error: "Dokumen tidak ditemukan." };
    }

    const statusSebelum = existingDoc.status as DocStatus;
    if (statusSebelum === "diajukan") {
      return { success: false, error: "Dokumen sudah berada dalam antrian validasi." };
    }

    // Update status ke diajukan
    const { error: upErr } = await updateDokumenStatus(adminClient, tableName, dokumenId, "diajukan");

    if (upErr) {
      return { success: false, error: upErr.message };
    }

    // Catat riwayat validasi
    await recordRiwayatValidasi({
      dokumenTipe,
      dokumenId,
      validatorId: session.user.id,
      statusSebelum,
      statusSesudah: "diajukan",
      catatan: catatanGuru || "Dokumen diajukan oleh guru untuk penelaahan.",
    });

    safeRevalidate("/validasi");
    safeRevalidate("/");
    safeRevalidate(`/${dokumenTipe === "rpp" ? "modul-ajar" : dokumenTipe}`);

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, error: msg };
  }
}

/**
 * Menyetujui dokumen oleh Waka Kurikulum, Kepala Madrasah, atau Admin
 */
export async function approveDokumenAction(
  dokumenTipe: DokumenTipe,
  dokumenId: string,
  catatan?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi tidak valid." };
    }

    if (session.role === "guru") {
      return { success: false, error: "Hanya Waka Kurikulum, Kepala Madrasah, atau Admin yang berhak menyetujui dokumen." };
    }

    const adminClient = createAdminClient();
    const tableName = dokumenTipe === "analisis_cp" ? "analisis_cp" : dokumenTipe;

    const { data: existingDoc, error: docErr } = await adminClient
      .from(tableName as "rpp" | "atp" | "prota" | "prosem")
      .select("id, status")
      .eq("id", dokumenId)
      .single();

    if (docErr || !existingDoc) {
      return { success: false, error: "Dokumen tidak ditemukan." };
    }

    const statusSebelum = existingDoc.status as DocStatus;

    // Update status ke disetujui & simpan catatan validator
    const { error: upErr } = await updateDokumenStatus(
      adminClient,
      tableName,
      dokumenId,
      "disetujui",
      catatan || "Dokumen telah ditelaah dan disetujui sesuai regulasi Kemenag & standar KBC."
    );

    if (upErr) {
      return { success: false, error: upErr.message };
    }

    await recordRiwayatValidasi({
      dokumenTipe,
      dokumenId,
      validatorId: session.user.id,
      statusSebelum,
      statusSesudah: "disetujui",
      catatan: catatan || "Dokumen telah memenuhi seluruh instrumen penelaahan dan disetujui.",
    });

    safeRevalidate("/validasi");
    safeRevalidate("/");
    safeRevalidate(`/${dokumenTipe === "rpp" ? "modul-ajar" : dokumenTipe}`);

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, error: msg };
  }
}

/**
 * Menyetujui sekumpulan dokumen sekaligus (Bulk Approval)
 */
export async function approveBulkDokumenAction(
  items: Array<{ dokumenTipe: DokumenTipe; dokumenId: string }>,
  catatan?: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi tidak valid." };
    }

    if (session.role === "guru") {
      return { success: false, error: "Hanya Waka Kurikulum, Kepala Madrasah, atau Admin yang berhak menyetujui dokumen." };
    }

    if (!items || items.length === 0) {
      return { success: false, error: "Tidak ada dokumen yang dipilih." };
    }

    const adminClient = createAdminClient();
    let approvedCount = 0;
    const defaultCatatan =
      catatan?.trim() || "Dokumen telah ditelaah dan disetujui kolektif sesuai regulasi Kemenag & standar KBC.";

    for (const item of items) {
      const tableName = item.dokumenTipe === "analisis_cp" ? "analisis_cp" : item.dokumenTipe;
      const { data: existingDoc } = await adminClient
        .from(tableName as "rpp" | "atp" | "prota" | "prosem")
        .select("id, status")
        .eq("id", item.dokumenId)
        .single();

      if (!existingDoc) continue;

      const statusSebelum = existingDoc.status as DocStatus;

      const { error: upErr } = await updateDokumenStatus(
        adminClient,
        tableName,
        item.dokumenId,
        "disetujui",
        defaultCatatan
      );

      if (!upErr) {
        approvedCount++;
        await recordRiwayatValidasi({
          dokumenTipe: item.dokumenTipe,
          dokumenId: item.dokumenId,
          validatorId: session.user.id,
          statusSebelum,
          statusSesudah: "disetujui",
          catatan: defaultCatatan,
        });
      }
    }

    safeRevalidate("/validasi");
    safeRevalidate("/");
    safeRevalidate("/dashboard");
    safeRevalidate("/atp");
    safeRevalidate("/prota");
    safeRevalidate("/prosem");
    safeRevalidate("/modul-ajar");

    return { success: true, count: approvedCount };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, error: msg };
  }
}

/**
 * Menyetujui langsung SEMUA berkas ajuan (status 'diajukan') milik satu guru tertentu
 */
export async function approveSemuaAjuanGuruAction(
  guruId: string,
  catatan?: string
): Promise<{
  success: boolean;
  count?: number;
  approvedTitles?: string[];
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi tidak valid." };
    }

    if (session.role === "guru") {
      return { success: false, error: "Hanya Waka Kurikulum, Kepala Madrasah, atau Admin yang berhak menyetujui dokumen." };
    }

    const adminClient = createAdminClient();

    // 1. Ambil tahun ajaran aktif
    const { data: taAktif } = await adminClient
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .maybeSingle();

    if (!taAktif) {
      return { success: false, error: "Tahun ajaran aktif belum ditentukan." };
    }

    // 2. Ambil penugasan guru di tahun ajaran aktif
    const { data: penugasanList, error: pErr } = await adminClient
      .from("penugasan")
      .select("id, tingkat_kelas, mapel(nama, kode)")
      .eq("guru_id", guruId)
      .eq("tahun_ajaran_id", taAktif.id);

    if (pErr || !penugasanList || penugasanList.length === 0) {
      return { success: false, error: "Penugasan guru tidak ditemukan pada tahun ajaran aktif." };
    }

    const penugasanIds = penugasanList.map((p) => p.id);

    // 3. Ambil seluruh dokumen berstatus 'diajukan' untuk penugasan ini
    const [atpRes, protaRes, prosemRes, rppRes] = await Promise.all([
      adminClient.from("atp").select("id, penugasan_id").in("penugasan_id", penugasanIds).eq("status", "diajukan"),
      adminClient.from("prota").select("id, penugasan_id").in("penugasan_id", penugasanIds).eq("status", "diajukan"),
      adminClient.from("prosem").select("id, penugasan_id, semester").in("penugasan_id", penugasanIds).eq("status", "diajukan"),
      adminClient.from("rpp").select("id, penugasan_id, materi_pokok").in("penugasan_id", penugasanIds).eq("status", "diajukan"),
    ]);

    const itemsToApprove: Array<{ dokumenTipe: DokumenTipe; dokumenId: string; judul: string }> = [];
    const penMap = new Map(penugasanList.map((p) => [p.id, p]));

    (atpRes.data || []).forEach((row) => {
      const p = penMap.get(row.penugasan_id);
      const mNama = Array.isArray(p?.mapel) ? p.mapel[0]?.nama : p?.mapel?.nama;
      itemsToApprove.push({
        dokumenTipe: "atp",
        dokumenId: row.id,
        judul: `ATP - ${mNama || "Mapel"} Kelas ${p?.tingkat_kelas || ""}`,
      });
    });

    (protaRes.data || []).forEach((row) => {
      const p = penMap.get(row.penugasan_id);
      const mNama = Array.isArray(p?.mapel) ? p.mapel[0]?.nama : p?.mapel?.nama;
      itemsToApprove.push({
        dokumenTipe: "prota",
        dokumenId: row.id,
        judul: `Prota - ${mNama || "Mapel"} Kelas ${p?.tingkat_kelas || ""}`,
      });
    });

    (prosemRes.data || []).forEach((row) => {
      const p = penMap.get(row.penugasan_id);
      const mNama = Array.isArray(p?.mapel) ? p.mapel[0]?.nama : p?.mapel?.nama;
      itemsToApprove.push({
        dokumenTipe: "prosem",
        dokumenId: row.id,
        judul: `Prosem Smt ${row.semester} - ${mNama || "Mapel"} Kelas ${p?.tingkat_kelas || ""}`,
      });
    });

    (rppRes.data || []).forEach((row) => {
      itemsToApprove.push({
        dokumenTipe: "rpp",
        dokumenId: row.id,
        judul: `Modul Ajar/RPP: ${row.materi_pokok}`,
      });
    });

    if (itemsToApprove.length === 0) {
      return {
        success: false,
        error: "Tidak ada berkas ajuan (berstatus 'diajukan') yang menunggu validasi untuk guru ini.",
      };
    }

    const defaultCatatan =
      catatan?.trim() || "Dokumen telah ditelaah dan disetujui kolektif sesuai regulasi Kemenag & standar KBC.";

    for (const item of itemsToApprove) {
      await updateDokumenStatus(adminClient, item.dokumenTipe, item.dokumenId, "disetujui", defaultCatatan);
      await recordRiwayatValidasi({
        dokumenTipe: item.dokumenTipe,
        dokumenId: item.dokumenId,
        validatorId: session.user.id,
        statusSebelum: "diajukan",
        statusSesudah: "disetujui",
        catatan: defaultCatatan,
      });
    }

    safeRevalidate("/validasi");
    safeRevalidate("/");
    safeRevalidate("/dashboard");
    safeRevalidate("/atp");
    safeRevalidate("/prota");
    safeRevalidate("/prosem");
    safeRevalidate("/modul-ajar");

    return {
      success: true,
      count: itemsToApprove.length,
      approvedTitles: itemsToApprove.map((i) => i.judul),
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, error: msg };
  }
}

/**
 * Meminta revisi dokumen oleh Waka Kurikulum, Kepala Madrasah, atau Admin
 */
export async function requestRevisiAction(
  dokumenTipe: DokumenTipe,
  dokumenId: string,
  catatanWajib: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi tidak valid." };
    }

    if (session.role === "guru") {
      return { success: false, error: "Hanya Waka Kurikulum, Kepala Madrasah, atau Admin yang berhak meminta revisi." };
    }

    if (!catatanWajib || catatanWajib.trim().length < 5) {
      return { success: false, error: "Catatan perbaikan / revisi wajib diisi secara jelas." };
    }

    const adminClient = createAdminClient();
    const tableName = dokumenTipe === "analisis_cp" ? "analisis_cp" : dokumenTipe;

    const { data: existingDoc, error: docErr } = await adminClient
      .from(tableName as "rpp" | "atp" | "prota" | "prosem")
      .select("id, status")
      .eq("id", dokumenId)
      .single();

    if (docErr || !existingDoc) {
      return { success: false, error: "Dokumen tidak ditemukan." };
    }

    const statusSebelum = existingDoc.status as DocStatus;

    // Update status ke revisi & simpan catatan validator
    const { error: upErr } = await updateDokumenStatus(
      adminClient,
      tableName,
      dokumenId,
      "revisi",
      catatanWajib.trim()
    );

    if (upErr) {
      return { success: false, error: upErr.message };
    }

    await recordRiwayatValidasi({
      dokumenTipe,
      dokumenId,
      validatorId: session.user.id,
      statusSebelum,
      statusSesudah: "revisi",
      catatan: catatanWajib.trim(),
    });

    safeRevalidate("/validasi");
    safeRevalidate("/");
    safeRevalidate(`/${dokumenTipe === "rpp" ? "modul-ajar" : dokumenTipe}`);

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, error: msg };
  }
}

/**
 * Membuat versi revisi baru dari dokumen yang telah disetujui (membuat salinan draf baru)
 */
export async function createRevisiCopyAction(
  dokumenTipe: DokumenTipe,
  dokumenId: string
): Promise<{ success: boolean; newId?: string; error?: string }> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi tidak valid." };
    }

    const adminClient = createAdminClient();

    if (dokumenTipe === "rpp") {
      // Untuk RPP, gunakan fungsi duplikasi yang membuat baris baru berstatus draf
      const dupRes = await duplicateRppAction(dokumenId);
      if (!dupRes.success || !dupRes.newId) {
        return { success: false, error: dupRes.error || "Gagal membuat revisi RPP." };
      }

      // Catat log
      await recordRiwayatValidasi({
        dokumenTipe: "rpp",
        dokumenId: dupRes.newId,
        validatorId: session.user.id,
        statusSebelum: "disetujui",
        statusSesudah: "draf",
        catatan: "Membuat salinan versi revisi draf baru dari dokumen yang telah disetujui.",
      });

      safeRevalidate("/modul-ajar");
      return { success: true, newId: dupRes.newId };
    }

    // Untuk ATP, Prota, Prosem: kembalikan status menjadi draf versi revisi
    const tableName = dokumenTipe;
    const { data: existingDoc } = await adminClient
      .from(tableName as "atp" | "prota" | "prosem")
      .select("id, status")
      .eq("id", dokumenId)
      .single();

    if (!existingDoc) {
      return { success: false, error: "Dokumen tidak ditemukan." };
    }

    const statusSebelum = existingDoc.status as DocStatus;
    const { error: upErr } = await updateDokumenStatus(adminClient, tableName, dokumenId, "draf");

    if (upErr) {
      return { success: false, error: upErr.message };
    }

    await recordRiwayatValidasi({
      dokumenTipe,
      dokumenId,
      validatorId: session.user.id,
      statusSebelum,
      statusSesudah: "draf",
      catatan: "Membuka kembali versi revisi (draf) dari dokumen yang telah disetujui.",
    });

    safeRevalidate(`/${dokumenTipe}`);
    return { success: true, newId: dokumenId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, error: msg };
  }
}

export interface AntrianDokumenItem {
  id: string;
  dokumen_tipe: DokumenTipe;
  judul: string;
  penugasan_id: string;
  guru_id: string;
  guru_nama: string;
  guru_nip: string | null;
  mapel_nama: string;
  mapel_kode: string;
  tingkat_kelas: number;
  rombel: string;
  status: DocStatus;
  catatan_validator: string | null;
  updated_at: string;
}

/**
 * Mengambil antrian dokumen untuk telaah dan validasi staff
 */
export async function getAntrianValidasiAction(filter?: {
  status?: string;
  jenis?: string;
  guruId?: string;
  mapelId?: string;
  tingkat?: number;
}): Promise<{ success: boolean; data: AntrianDokumenItem[]; error?: string }> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, data: [], error: "Sesi tidak valid." };
    }

    const adminClient = createAdminClient();

    // 1. Ambil tahun ajaran aktif
    const { data: taAktif } = await adminClient
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .maybeSingle();

    if (!taAktif) {
      return { success: true, data: [] };
    }

    // 2. Ambil penugasan pada tahun ajaran aktif
    const { data: penugasanList } = await adminClient
      .from("penugasan")
      .select(`
        id,
        tingkat_kelas,
        rombel,
        guru_id,
        mapel_id,
        mapel ( id, nama, kode ),
        profiles ( id, nama_lengkap, nip )
      `)
      .eq("tahun_ajaran_id", taAktif.id);

    if (!penugasanList || penugasanList.length === 0) {
      return { success: true, data: [] };
    }

    const penugasanMap = new Map(penugasanList.map((p) => [p.id, p]));
    const penugasanIds = penugasanList.map((p) => p.id);

    // 3. Query dokumen paralel
    const [atpRes, protaRes, prosemRes, rppRes] = await Promise.all([
      adminClient.from("atp").select("id, penugasan_id, status, catatan_validator, updated_at").in("penugasan_id", penugasanIds),
      adminClient.from("prota").select("id, penugasan_id, status, catatan_validator, updated_at").in("penugasan_id", penugasanIds),
      adminClient.from("prosem").select("id, penugasan_id, semester, status, catatan_validator, updated_at").in("penugasan_id", penugasanIds),
      adminClient.from("rpp").select("id, penugasan_id, materi_pokok, status, catatan_validator, updated_at").in("penugasan_id", penugasanIds),
    ]);

    const result: AntrianDokumenItem[] = [];

    // ATP
    (atpRes.data || []).forEach((row) => {
      const p = penugasanMap.get(row.penugasan_id);
      if (!p) return;
      const m = Array.isArray(p.mapel) ? p.mapel[0] : p.mapel;
      const g = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      result.push({
        id: row.id,
        dokumen_tipe: "atp",
        judul: `Alur Tujuan Pembelajaran (ATP) - ${m?.nama || "Mapel"} Kelas ${p.tingkat_kelas}`,
        penugasan_id: p.id,
        guru_id: p.guru_id,
        guru_nama: g?.nama_lengkap || "Guru",
        guru_nip: g?.nip || null,
        mapel_nama: m?.nama || "-",
        mapel_kode: m?.kode || "-",
        tingkat_kelas: p.tingkat_kelas,
        rombel: p.rombel,
        status: row.status as DocStatus,
        catatan_validator: row.catatan_validator,
        updated_at: row.updated_at,
      });
    });

    // Prota
    (protaRes.data || []).forEach((row) => {
      const p = penugasanMap.get(row.penugasan_id);
      if (!p) return;
      const m = Array.isArray(p.mapel) ? p.mapel[0] : p.mapel;
      const g = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      result.push({
        id: row.id,
        dokumen_tipe: "prota",
        judul: `Program Tahunan (Prota) - ${m?.nama || "Mapel"} Kelas ${p.tingkat_kelas}`,
        penugasan_id: p.id,
        guru_id: p.guru_id,
        guru_nama: g?.nama_lengkap || "Guru",
        guru_nip: g?.nip || null,
        mapel_nama: m?.nama || "-",
        mapel_kode: m?.kode || "-",
        tingkat_kelas: p.tingkat_kelas,
        rombel: p.rombel,
        status: row.status as DocStatus,
        catatan_validator: row.catatan_validator,
        updated_at: row.updated_at,
      });
    });

    // Prosem
    (prosemRes.data || []).forEach((row) => {
      const p = penugasanMap.get(row.penugasan_id);
      if (!p) return;
      const m = Array.isArray(p.mapel) ? p.mapel[0] : p.mapel;
      const g = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      result.push({
        id: row.id,
        dokumen_tipe: "prosem",
        judul: `Program Semester ${row.semester} (Prosem) - ${m?.nama || "Mapel"} Kelas ${p.tingkat_kelas}`,
        penugasan_id: p.id,
        guru_id: p.guru_id,
        guru_nama: g?.nama_lengkap || "Guru",
        guru_nip: g?.nip || null,
        mapel_nama: m?.nama || "-",
        mapel_kode: m?.kode || "-",
        tingkat_kelas: p.tingkat_kelas,
        rombel: p.rombel,
        status: row.status as DocStatus,
        catatan_validator: row.catatan_validator,
        updated_at: row.updated_at,
      });
    });

    // RPP
    (rppRes.data || []).forEach((row) => {
      const p = penugasanMap.get(row.penugasan_id);
      if (!p) return;
      const m = Array.isArray(p.mapel) ? p.mapel[0] : p.mapel;
      const g = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      result.push({
        id: row.id,
        dokumen_tipe: "rpp",
        judul: `RPP / Modul Ajar: ${row.materi_pokok}`,
        penugasan_id: p.id,
        guru_id: p.guru_id,
        guru_nama: g?.nama_lengkap || "Guru",
        guru_nip: g?.nip || null,
        mapel_nama: m?.nama || "-",
        mapel_kode: m?.kode || "-",
        tingkat_kelas: p.tingkat_kelas,
        rombel: p.rombel,
        status: row.status as DocStatus,
        catatan_validator: row.catatan_validator,
        updated_at: row.updated_at,
      });
    });

    // Urutkan paling baru diperbarui
    result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    // Filter
    let filtered = result;
    if (filter?.status && filter.status !== "semua") {
      filtered = filtered.filter((item) => item.status === filter.status);
    }
    if (filter?.jenis && filter.jenis !== "semua") {
      filtered = filtered.filter((item) => item.dokumen_tipe === filter.jenis);
    }
    if (filter?.guruId && filter.guruId !== "semua") {
      filtered = filtered.filter((item) => {
        const p = penugasanMap.get(item.penugasan_id);
        return p?.guru_id === filter.guruId;
      });
    }
    if (filter?.mapelId && filter.mapelId !== "semua") {
      filtered = filtered.filter((item) => {
        const p = penugasanMap.get(item.penugasan_id);
        return p?.mapel_id === filter.mapelId;
      });
    }
    if (filter?.tingkat) {
      filtered = filtered.filter((item) => item.tingkat_kelas === Number(filter.tingkat));
    }

    return { success: true, data: filtered };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, data: [], error: msg };
  }
}

export interface RekapKelengkapanGuru {
  guruId: string;
  guruNama: string;
  guruNip: string | null;
  mapelNama: string;
  tingkatKelas: number;
  rombel: string;
  penugasanId: string;
  atpStatus: DocStatus | "belum";
  protaStatus: DocStatus | "belum";
  prosem1Status: DocStatus | "belum";
  prosem2Status: DocStatus | "belum";
  rppCount: number;
  rppTarget: number;
  rppDisetujuiCount: number;
  persentaseSelesai: number;
}

export interface DashboardStaffData {
  totalAntrianValidasi: number;
  persentaseMadrasah: number;
  totalDokumenDisetujui: number;
  totalTargetDokumen: number;
  totalGuruAktif: number;
  rekapGuru: RekapKelengkapanGuru[];
}

/**
 * Mengambil data rekap kelengkapan seluruh perangkat untuk Beranda Staff & Ekspor Excel
 */
export async function getRekapKelengkapanAction(): Promise<{
  success: boolean;
  data: DashboardStaffData;
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return {
        success: false,
        data: {
          totalAntrianValidasi: 0,
          persentaseMadrasah: 0,
          totalDokumenDisetujui: 0,
          totalTargetDokumen: 0,
          totalGuruAktif: 0,
          rekapGuru: [],
        },
        error: "Sesi tidak valid.",
      };
    }

    const adminClient = createAdminClient();

    const { data: taAktif } = await adminClient
      .from("tahun_ajaran")
      .select("id, nama")
      .eq("aktif", true)
      .maybeSingle();

    if (!taAktif) {
      return {
        success: true,
        data: {
          totalAntrianValidasi: 0,
          persentaseMadrasah: 0,
          totalDokumenDisetujui: 0,
          totalTargetDokumen: 0,
          totalGuruAktif: 0,
          rekapGuru: [],
        },
      };
    }

    // Ambil penugasan
    const { data: penugasanList } = await adminClient
      .from("penugasan")
      .select(`
        id,
        tingkat_kelas,
        rombel,
        guru_id,
        mapel_id,
        mapel ( id, nama, kode ),
        profiles ( id, nama_lengkap, nip )
      `)
      .eq("tahun_ajaran_id", taAktif.id);

    if (!penugasanList || penugasanList.length === 0) {
      return {
        success: true,
        data: {
          totalAntrianValidasi: 0,
          persentaseMadrasah: 0,
          totalDokumenDisetujui: 0,
          totalTargetDokumen: 0,
          totalGuruAktif: 0,
          rekapGuru: [],
        },
      };
    }

    const penugasanIds = penugasanList.map((p) => p.id);

    const [atpRes, protaRes, prosemRes, rppRes, tpRes] = await Promise.all([
      adminClient.from("atp").select("id, penugasan_id, status").in("penugasan_id", penugasanIds),
      adminClient.from("prota").select("id, penugasan_id, status").in("penugasan_id", penugasanIds),
      adminClient.from("prosem").select("id, penugasan_id, semester, status").in("penugasan_id", penugasanIds),
      adminClient.from("rpp").select("id, penugasan_id, status, tujuan_pembelajaran_ids").in("penugasan_id", penugasanIds),
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

    const rppMap = new Map<string, Array<{ id: string; status: string }>>();
    (rppRes.data || []).forEach((rp) => {
      const cur = rppMap.get(rp.penugasan_id) || [];
      cur.push(rp);
      rppMap.set(rp.penugasan_id, cur);
    });

    // Hitung total TP per penugasan sebagai target RPP
    const tpCountMap = new Map<string, number>();
    (tpRes.data || []).forEach((item) => {
      const pid = (item.analisis_cp as { penugasan_id?: string })?.penugasan_id;
      if (pid) {
        tpCountMap.set(pid, (tpCountMap.get(pid) || 0) + 1);
      }
    });

    let totalAntrianValidasi = 0;
    let totalDokumenDisetujui = 0;
    let totalDokumenBobot = 0;
    const guruSet = new Set<string>();

    const rekapGuru: RekapKelengkapanGuru[] = penugasanList.map((p) => {
      const g = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      const m = Array.isArray(p.mapel) ? p.mapel[0] : p.mapel;
      if (g?.id) guruSet.add(g.id);

      const atp = atpMap.get(p.id);
      const prota = protaMap.get(p.id);
      const prosem1 = prosem1Map.get(p.id);
      const prosem2 = prosem2Map.get(p.id);
      const rpps = rppMap.get(p.id) || [];
      const tpTarget = tpCountMap.get(p.id) || 4; // default minimum 4 TP per mapel jika belum diset

      if (atp?.status === "diajukan") totalAntrianValidasi++;
      if (prota?.status === "diajukan") totalAntrianValidasi++;
      if (prosem1?.status === "diajukan") totalAntrianValidasi++;
      if (prosem2?.status === "diajukan") totalAntrianValidasi++;
      rpps.forEach((r) => {
        if (r.status === "diajukan") totalAntrianValidasi++;
      });

      // Hitung bobot selesai (ATP 20%, Prota 20%, Prosem1 15%, Prosem2 15%, RPP 30%)
      let skorPenugasan = 0;
      if (atp?.status === "disetujui") {
        skorPenugasan += 20;
        totalDokumenDisetujui++;
      }
      if (prota?.status === "disetujui") {
        skorPenugasan += 20;
        totalDokumenDisetujui++;
      }
      if (prosem1?.status === "disetujui") {
        skorPenugasan += 15;
        totalDokumenDisetujui++;
      }
      if (prosem2?.status === "disetujui") {
        skorPenugasan += 15;
        totalDokumenDisetujui++;
      }

      const rppDisetujui = rpps.filter((r) => r.status === "disetujui").length;
      totalDokumenDisetujui += rppDisetujui;

      const rppRatio = tpTarget > 0 ? Math.min(1, rpps.length / tpTarget) : 0;
      skorPenugasan += Math.round(rppRatio * 30);

      totalDokumenBobot += skorPenugasan;

      return {
        guruId: g?.id || p.guru_id,
        guruNama: g?.nama_lengkap || "Guru",
        guruNip: g?.nip || null,
        mapelNama: m?.nama || "Mapel",
        tingkatKelas: p.tingkat_kelas,
        rombel: p.rombel,
        penugasanId: p.id,
        atpStatus: (atp?.status as DocStatus) || "belum",
        protaStatus: (prota?.status as DocStatus) || "belum",
        prosem1Status: (prosem1?.status as DocStatus) || "belum",
        prosem2Status: (prosem2?.status as DocStatus) || "belum",
        rppCount: rpps.length,
        rppTarget: tpTarget,
        rppDisetujuiCount: rppDisetujui,
        persentaseSelesai: Math.min(100, skorPenugasan),
      };
    });

    const totalTarget = penugasanList.length * 100;
    const persentaseMadrasah = totalTarget > 0 ? Math.round((totalDokumenBobot / totalTarget) * 100) : 0;

    return {
      success: true,
      data: {
        totalAntrianValidasi,
        persentaseMadrasah,
        totalDokumenDisetujui,
        totalTargetDokumen: penugasanList.length * 5, // ATP, Prota, Prosem1, Prosem2, RPP rata-rata
        totalGuruAktif: guruSet.size,
        rekapGuru,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return {
      success: false,
      data: {
        totalAntrianValidasi: 0,
        persentaseMadrasah: 0,
        totalDokumenDisetujui: 0,
        totalTargetDokumen: 0,
        totalGuruAktif: 0,
        rekapGuru: [],
      },
      error: msg,
    };
  }
}
