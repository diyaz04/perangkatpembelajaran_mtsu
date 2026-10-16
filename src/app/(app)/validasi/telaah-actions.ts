"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import type { DokumenTipe, DocStatus } from "@/types/database";
import type { EvaluasiDokumenResult } from "@/lib/validasi/types";
import { evaluasiRppKbc, evaluasiDokumenUmumKbc } from "@/lib/validasi/evaluator";
import { getRppDetailAction, type RppDetailData } from "@/app/(app)/modul-ajar/actions";
import { getAtpPreviewDataAction, type PreviewData as AtpPreviewData } from "@/app/(app)/atp/actions";
import { getProtaDetailAction, type ProtaDetailData } from "@/app/(app)/prota/actions";
import { getProsemDetailAction, type ProsemDetailData } from "@/app/(app)/prosem/actions";

export interface TelaahDataResult {
  dokumenTipe: DokumenTipe;
  dokumenId: string;
  status: DocStatus;
  evaluasi: EvaluasiDokumenResult;
  rppData?: RppDetailData;
  atpData?: AtpPreviewData;
  protaData?: ProtaDetailData;
  prosemData?: ProsemDetailData;
  metadata: {
    guruNama: string;
    guruNip: string | null;
    mapelNama: string;
    tingkatKelas: number;
    rombel: string;
    tahunAjaran: string;
    judul: string;
  };
}

export async function getTelaahDataAction(
  dokumenTipe: DokumenTipe,
  dokumenId: string
): Promise<{ success: boolean; data?: TelaahDataResult; error?: string }> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi tidak valid." };
    }

    const adminClient = createAdminClient();

    if (dokumenTipe === "rpp") {
      const res = await getRppDetailAction(dokumenId);
      if (!res.success || !res.data) {
        return { success: false, error: res.error || "Gagal memuat RPP." };
      }

      const rppData = res.data;
      const evaluasi = evaluasiRppKbc(rppData);

      return {
        success: true,
        data: {
          dokumenTipe: "rpp",
          dokumenId,
          status: rppData.rpp.status,
          evaluasi,
          rppData,
          metadata: {
            guruNama: rppData.penugasan.guru.nama_lengkap,
            guruNip: rppData.penugasan.guru.nip,
            mapelNama: rppData.penugasan.mapel.nama,
            tingkatKelas: rppData.penugasan.tingkat_kelas,
            rombel: rppData.penugasan.rombel,
            tahunAjaran: rppData.penugasan.tahun_ajaran.nama,
            judul: `RPP / Modul Ajar: ${rppData.rpp.materi_pokok}`,
          },
        },
      };
    }

    if (dokumenTipe === "atp") {
      const { data: atpRow } = await adminClient
        .from("atp")
        .select("id, penugasan_id, status")
        .eq("id", dokumenId)
        .single();

      if (!atpRow) {
        return { success: false, error: "Dokumen ATP tidak ditemukan." };
      }

      const atpRes = await getAtpPreviewDataAction(atpRow.penugasan_id);
      if (!atpRes.success || !atpRes.data) {
        return { success: false, error: atpRes.error || "Gagal memuat preview ATP." };
      }

      const atpData = atpRes.data;
      const evaluasi = evaluasiDokumenUmumKbc("atp", {
        items: atpData.items.map((i) => ({
          tujuan_pembelajaran: i.tujuan_pembelajaran,
          panca_cinta: i.panca_cinta,
          alokasi_jp: i.alokasi_jp,
        })),
      });

      return {
        success: true,
        data: {
          dokumenTipe: "atp",
          dokumenId,
          status: atpRow.status as DocStatus,
          evaluasi,
          atpData,
          metadata: {
            guruNama: atpData.penugasan.guru.nama_lengkap,
            guruNip: atpData.penugasan.guru.nip,
            mapelNama: atpData.penugasan.mapel.nama,
            tingkatKelas: atpData.penugasan.tingkat_kelas,
            rombel: atpData.penugasan.rombel,
            tahunAjaran: atpData.penugasan.tahun_ajaran.nama,
            judul: `Alur Tujuan Pembelajaran (ATP) - Kelas ${atpData.penugasan.tingkat_kelas}`,
          },
        },
      };
    }

    if (dokumenTipe === "prota") {
      const { data: protaRow } = await adminClient
        .from("prota")
        .select("id, penugasan_id, status")
        .eq("id", dokumenId)
        .single();

      if (!protaRow) {
        return { success: false, error: "Dokumen Prota tidak ditemukan." };
      }

      const protaRes = await getProtaDetailAction(protaRow.penugasan_id);
      if (!protaRes.success || !protaRes.data) {
        return { success: false, error: protaRes.error || "Gagal memuat data Prota." };
      }

      const protaData = protaRes.data;
      const evaluasi = evaluasiDokumenUmumKbc("prota", {
        items: protaData.items.map((i) => ({
          materi_pokok: i.materi_pokok,
          alokasi_jp: i.alokasi_jp,
        })),
      });

      return {
        success: true,
        data: {
          dokumenTipe: "prota",
          dokumenId,
          status: protaRow.status as DocStatus,
          evaluasi,
          protaData,
          metadata: {
            guruNama: protaData.penugasan.guru.nama_lengkap,
            guruNip: protaData.penugasan.guru.nip,
            mapelNama: protaData.penugasan.mapel.nama,
            tingkatKelas: protaData.penugasan.tingkat_kelas,
            rombel: protaData.penugasan.rombel,
            tahunAjaran: protaData.penugasan.tahun_ajaran.nama,
            judul: `Program Tahunan (Prota) - Kelas ${protaData.penugasan.tingkat_kelas}`,
          },
        },
      };
    }

    if (dokumenTipe === "prosem") {
      const { data: prosemRow } = await adminClient
        .from("prosem")
        .select("id, penugasan_id, semester, status")
        .eq("id", dokumenId)
        .single();

      if (!prosemRow) {
        return { success: false, error: "Dokumen Prosem tidak ditemukan." };
      }

      const sem = (prosemRow.semester === 2 ? 2 : 1) as 1 | 2;
      const prosemRes = await getProsemDetailAction(prosemRow.penugasan_id, sem);
      if (!prosemRes.success || !prosemRes.data) {
        return { success: false, error: prosemRes.error || "Gagal memuat data Prosem." };
      }

      const prosemData = prosemRes.data;
      const evaluasi = evaluasiDokumenUmumKbc("prosem", {
        items: prosemData.items.map((i) => ({
          tujuan_pembelajaran_teks: i.tujuan_pembelajaran_teks,
          alokasi_jp: i.alokasi_jp,
          distribusi_minggu: i.distribusi_minggu,
        })),
      });

      return {
        success: true,
        data: {
          dokumenTipe: "prosem",
          dokumenId,
          status: prosemRow.status as DocStatus,
          evaluasi,
          prosemData,
          metadata: {
            guruNama: prosemData.penugasan.guru.nama_lengkap,
            guruNip: prosemData.penugasan.guru.nip,
            mapelNama: prosemData.penugasan.mapel.nama,
            tingkatKelas: prosemData.penugasan.tingkat_kelas,
            rombel: prosemData.penugasan.rombel,
            tahunAjaran: prosemData.penugasan.tahun_ajaran.nama,
            judul: `Program Semester ${sem} (Prosem) - Kelas ${prosemData.penugasan.tingkat_kelas}`,
          },
        },
      };
    }

    return { success: false, error: `Tipe dokumen ${dokumenTipe} tidak didukung.` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, error: msg };
  }
}
