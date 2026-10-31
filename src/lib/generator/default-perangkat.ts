"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import {
  hitungMingguEfektif,
  type KalenderKegiatanInput,
} from "@/lib/kalender/minggu-efektif";
import {
  getAllMapelBankData,
  getMateriByMapelAndGrade,
} from "@/lib/bank-data/service";
import {
  generateDefaultKesiapanMurid,
  generateDefaultKarakteristik,
  generateDefaultLampiran,
} from "@/lib/rpp-suggestions";
import {
  generateModelLangkahList,
  getModelPedagogiSpec,
} from "@/lib/rpp-model-pedagogi";
import type {
  DocStatus,
  PengalamanBelajar,
  VersiRpp,
} from "@/types/database";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore outside request contexts
  }
}

interface GenerateResult {
  success: boolean;
  penugasanId?: string;
  guruNama?: string;
  mapelNama?: string;
  tingkatKelas?: number;
  totalJp?: number;
  jumlahElemen?: number;
  jumlahTp?: number;
  rppCount?: number;
  error?: string;
}

/**
 * Menemukan slug Bank Data yang paling cocok berdasarkan nama dan kode mapel
 */
function findBankDataSlug(mapelNama: string, mapelKode: string): string | null {
  const allBank = getAllMapelBankData();
  const n = mapelNama.toLowerCase().trim();
  const k = mapelKode.toLowerCase().trim();

  // 1. Cocokkan slug tepat
  const exactSlug = allBank.find((b) => b.slug === k || b.slug === n);
  if (exactSlug) return exactSlug.slug;

  // 2. Cocokkan nama tepat atau kemiripan kata kunci
  const nameMatch = allBank.find((b) => {
    const bn = b.mapel.toLowerCase();
    return bn === n || n.includes(bn) || bn.includes(n);
  });
  if (nameMatch) return nameMatch.slug;

  // 3. Mapping manual fallback kata kunci populer
  if (n.includes("quran") || n.includes("qur'an") || k.includes("qh")) return "al-quran-hadis";
  if (n.includes("akidah") || k.includes("aa")) return "akidah-akhlak";
  if (n.includes("fikih") || k.includes("fiq")) return "fikih";
  if (n.includes("ski") || n.includes("sejarah kebudayaan")) return "ski";
  if (n.includes("arab")) return "bahasa-arab";
  if (n.includes("indonesia") || k.includes("bind")) return "bahasa-indonesia";
  if (n.includes("inggris") || k.includes("bing")) return "bahasa-inggris";
  if (n.includes("matematika") || k.includes("mtk")) return "matematika";
  if (n.includes("ipa") || n.includes("alam")) return "ipa";
  if (n.includes("ips") || n.includes("sosial")) return "ips";
  if (n.includes("pancasila") || n.includes("pkn")) return "pendidikan-pancasila";
  if (n.includes("pjok") || n.includes("olahraga")) return "pjok";
  if (n.includes("informatika") || n.includes("tik")) return "informatika";
  if (n.includes("seni") || n.includes("budaya")) return "seni-budaya";
  if (n.includes("prakarya")) return "prakarya";
  if (n.includes("sunda")) return "bahasa-sunda";

  return null;
}

export interface GeneratorSharedContext {
  madrasah?: any;
  kalenderRows?: KalenderKegiatanInput[];
  allPancaCinta?: Array<{ id: string; nama: string; kode: string }>;
  allDpl?: Array<{ id: string; nama: string; kode: string }>;
  defaultModel?: any;
}

/**
 * Pre-fetch data master pendukung sekali saja untuk digunakan bersama oleh banyak penugasan.
 * Mengurangi puluhan roundtrip database yang redundan.
 */
export async function getGeneratorSharedContext(
  tahunAjaranId: string
): Promise<GeneratorSharedContext> {
  const adminClient = createAdminClient();
  const [madrasahRes, kalenderRes, pancaCintaRes, dplRes, modelRes] = await Promise.all([
    adminClient.from("madrasah").select("*").limit(1).maybeSingle(),
    adminClient.from("kalender_kegiatan").select("*").eq("tahun_ajaran_id", tahunAjaranId),
    adminClient.from("panca_cinta").select("id, nama, kode").order("urutan", { ascending: true }),
    adminClient.from("dimensi_profil_lulusan").select("id, nama, kode").order("kode", { ascending: true }),
    adminClient.from("model_pembelajaran").select("id, nama, sintaks").limit(1).maybeSingle(),
  ]);

  return {
    madrasah: madrasahRes.data,
    kalenderRows: (kalenderRes.data || []) as KalenderKegiatanInput[],
    allPancaCinta: pancaCintaRes.data || [],
    allDpl: dplRes.data || [],
    defaultModel: modelRes.data,
  };
}

/**
 * Menghasilkan seluruh perangkat pembelajaran default (ATP, Prota, Prosem Smt 1 & 2, Modul Ajar/RPP)
 * untuk 1 penugasan guru secara otomatis dengan query ter-batch dan sangat cepat.
 *
 * Sesuai instruksi:
 * Perhitungan JP per elemen di ATP dibagi rata sesuai porsi JP tahun dibagi jumlah elemen.
 */
export async function generateDefaultPerangkatForPenugasan(
  penugasanId: string,
  options?: { autoSubmit?: boolean },
  context?: GeneratorSharedContext
): Promise<GenerateResult> {
  const adminClient = createAdminClient();
  const targetStatus: DocStatus = options?.autoSubmit ? "diajukan" : "draf";

  try {
    // 1. Ambil data penugasan lengkap
    const { data: penugasan, error: pErr } = await adminClient
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

    if (pErr || !penugasan) {
      return { success: false, error: "Penugasan tidak ditemukan." };
    }

    const mapel = Array.isArray(penugasan.mapel) ? penugasan.mapel[0] : penugasan.mapel;
    const guru = Array.isArray(penugasan.profiles) ? penugasan.profiles[0] : penugasan.profiles;
    const ta = Array.isArray(penugasan.tahun_ajaran) ? penugasan.tahun_ajaran[0] : penugasan.tahun_ajaran;

    if (!mapel || !ta) {
      return { success: false, error: "Data mata pelajaran atau tahun ajaran tidak lengkap." };
    }

    // 2. Ambil Profil Madrasah & Kalender Kegiatan (gunakan context jika sudah di-cache)
    let madrasah = context?.madrasah;
    let kalenderRows = context?.kalenderRows;

    if (!madrasah || !kalenderRows) {
      const [madrasahRes, kalenderRes] = await Promise.all([
        adminClient.from("madrasah").select("*").limit(1).maybeSingle(),
        adminClient.from("kalender_kegiatan").select("*").eq("tahun_ajaran_id", ta.id),
      ]);
      madrasah = madrasahRes.data;
      kalenderRows = (kalenderRes.data || []) as KalenderKegiatanInput[];
    }

    const hariSekolah = (madrasah?.hari_sekolah === 5 ? 5 : 6) as 5 | 6;

    const jpField =
      penugasan.tingkat_kelas === 7
        ? mapel.jp_per_minggu_kls7
        : penugasan.tingkat_kelas === 8
        ? mapel.jp_per_minggu_kls8
        : mapel.jp_per_minggu_kls9;
    const jpPerMinggu = Number(jpField || 2);

    // 3. Hitung Analisis Minggu Efektif & Alokasi Target JP
    const analisis = hitungMingguEfektif({
      tahunAjaran: {
        id: ta.id,
        nama: ta.nama,
        smt1_mulai: ta.smt1_mulai || "2026-07-13",
        smt1_selesai: ta.smt1_selesai || "2026-12-19",
        smt2_mulai: ta.smt2_mulai || "2027-01-04",
        smt2_selesai: ta.smt2_selesai || "2027-06-26",
      },
      kalenderKegiatan: kalenderRows,
      jpPerMinggu,
      hariSekolah,
    });

    const targetJpTahun = analisis.totalTahun.jpEfektif;
    const targetJpSmt1 = analisis.semester1.jpEfektif;
    const targetJpSmt2 = analisis.semester2.jpEfektif;

    // 4. Ambil Capaian Pembelajaran (CP) untuk mapel ini
    const { data: rawCpElements } = await adminClient
      .from("capaian_pembelajaran")
      .select("id, mapel_id, fase, elemen, kode_elemen, deskripsi_cp")
      .eq("mapel_id", penugasan.mapel_id)
      .order("elemen", { ascending: true });

    let cpElements = rawCpElements || [];

    // Jika belum ada master CP di database untuk mapel ini, gunakan Bank Data atau buat elemen standar
    if (cpElements.length === 0) {
      const slug = findBankDataSlug(mapel.nama, mapel.kode);
      const bankData = slug ? getAllMapelBankData().find((b) => b.slug === slug) : null;

      if (bankData && bankData.elemen && bankData.elemen.length > 0) {
        const cpInserts = bankData.elemen.map((el, i) => ({
          mapel_id: penugasan.mapel_id,
          fase: "D",
          elemen: el.nama,
          kode_elemen: el.kode || `E${i + 1}`,
          deskripsi_cp: el.deskripsi_cp || `Memahami dan menguasai capaian pembelajaran pada elemen ${el.nama}`,
          sumber_regulasi: "Keputusan Kepala BSKAP No. 032/H/KR/2024",
        }));

        const { data: createdCps } = await adminClient
          .from("capaian_pembelajaran")
          .insert(cpInserts)
          .select("id, mapel_id, fase, elemen, kode_elemen, deskripsi_cp");

        if (createdCps && createdCps.length > 0) {
          cpElements = createdCps;
        }
      }
    }

    // Fallback darurat jika tetap kosong
    if (cpElements.length === 0) {
      const defaultCps = [
        {
          mapel_id: penugasan.mapel_id,
          fase: "D",
          elemen: "Pemahaman Konsep & Karakter KBC",
          kode_elemen: "E1",
          deskripsi_cp: `Peserta didik mampu memahami konsep fundamental ${mapel.nama} berbasis nilai-nilai kasih sayang, panca cinta, dan akhlak mulia.`,
        },
        {
          mapel_id: penugasan.mapel_id,
          fase: "D",
          elemen: "Keterampilan Penerapan & Aksi Nyata",
          kode_elemen: "E2",
          deskripsi_cp: `Peserta didik mampu menerapkan dan mempraktikkan kompetensi ${mapel.nama} dalam kehidupan sehari-hari secara kritis, kreatif, dan kolaboratif.`,
        },
      ];
      const { data: createdCps } = await adminClient
        .from("capaian_pembelajaran")
        .insert(defaultCps)
        .select("id, mapel_id, fase, elemen, kode_elemen, deskripsi_cp");
      cpElements = createdCps || [];
    }

    const N = Math.max(1, cpElements.length);

    // =========================================================================
    // ATURAN PEMBAGIAN JP PER ELEMEN:
    // "adapununtuk perhitungan jp per elemen di atp lo langsung ajah bagi sesuai porsi jp tahun dinbagi jumlah elemen"
    // =========================================================================
    const baseJp = Math.floor(targetJpTahun / N);
    const remainder = targetJpTahun % N;
    const jpPerElemen: number[] = cpElements.map((_, idx) => baseJp + (idx < remainder ? 1 : 0));

    // 5. Master pendukung (Panca Cinta, DPL, Model Pembelajaran)
    let allPancaCinta = context?.allPancaCinta;
    let allDpl = context?.allDpl;
    let defaultModel = context?.defaultModel;

    if (!allPancaCinta || !allDpl || defaultModel === undefined) {
      const [pancaCintaRes, dplRes, modelRes] = await Promise.all([
        adminClient.from("panca_cinta").select("id, nama, kode").order("urutan", { ascending: true }),
        adminClient.from("dimensi_profil_lulusan").select("id, nama, kode").order("kode", { ascending: true }),
        adminClient.from("model_pembelajaran").select("id, nama, sintaks").limit(1).maybeSingle(),
      ]);
      allPancaCinta = pancaCintaRes.data || [];
      allDpl = dplRes.data || [];
      defaultModel = modelRes.data;
    }

    const defaultPcIds = (allPancaCinta || []).slice(0, 2).map((p) => p.id);
    const defaultDplIds = (allDpl || []).slice(0, 2).map((d) => d.id);

    // 6. Ambil Materi dari Bank Data sesuai kelas
    const slug = findBankDataSlug(mapel.nama, mapel.kode);
    const bankMateri = slug ? getMateriByMapelAndGrade(slug, penugasan.tingkat_kelas) : [];

    // 7. BERSIHKAN DOKUMEN LAMA SECARA PARALEL (Mengurangi 80% roundtrip)
    const [existingRppsRes, existingProsemsRes, existingProtaRes, existingAcpRes] = await Promise.all([
      adminClient.from("rpp").select("id").eq("penugasan_id", penugasanId),
      adminClient.from("prosem").select("id").eq("penugasan_id", penugasanId),
      adminClient.from("prota").select("id").eq("penugasan_id", penugasanId),
      adminClient.from("analisis_cp").select("id").eq("penugasan_id", penugasanId),
    ]);

    const rppIds = (existingRppsRes.data || []).map((r) => r.id);
    const prosemIds = (existingProsemsRes.data || []).map((p) => p.id);
    const protaIds = (existingProtaRes.data || []).map((p) => p.id);
    const acpIds = (existingAcpRes.data || []).map((a) => a.id);

    await Promise.all([
      rppIds.length > 0 ? adminClient.from("rpp_langkah").delete().in("rpp_id", rppIds) : Promise.resolve(),
      prosemIds.length > 0 ? adminClient.from("prosem_item").delete().in("prosem_id", prosemIds) : Promise.resolve(),
      protaIds.length > 0 ? adminClient.from("prota_item").delete().in("prota_id", protaIds) : Promise.resolve(),
      acpIds.length > 0 ? adminClient.from("tujuan_pembelajaran").delete().in("analisis_cp_id", acpIds) : Promise.resolve(),
    ]);

    await Promise.all([
      adminClient.from("rpp").delete().eq("penugasan_id", penugasanId),
      adminClient.from("prosem").delete().eq("penugasan_id", penugasanId),
      adminClient.from("prota").delete().eq("penugasan_id", penugasanId),
      adminClient.from("analisis_cp").delete().eq("penugasan_id", penugasanId),
      adminClient.from("atp").delete().eq("penugasan_id", penugasanId),
    ]);

    // =========================================================================
    // 8. BATCH GENERATE ANALISIS CP & TUJUAN PEMBELAJARAN (ATP)
    // =========================================================================
    const midPoint = Math.ceil(N / 2);
    const acpInserts: any[] = [];

    for (let i = 0; i < N; i++) {
      const cp = cpElements[i];
      const jp = jpPerElemen[i];
      const bankItem = bankMateri[i % Math.max(1, bankMateri.length)];
      const materiPokok = bankItem?.bab || `${mapel.nama}: Eksplorasi ${cp.elemen}`;

      acpInserts.push({
        penugasan_id: penugasanId,
        cp_id: cp.id,
        materi_pokok: materiPokok,
        kompetensi: cp.deskripsi_cp.slice(0, 180),
        alokasi_jp: jp,
        dpl_ids: defaultDplIds,
        panca_cinta_ids: defaultPcIds,
        urutan: i + 1,
        status: targetStatus,
        created_by: penugasan.guru_id,
      });
    }

    const { data: insertedAcps, error: acpErr } = await adminClient
      .from("analisis_cp")
      .insert(acpInserts)
      .select("id, urutan, materi_pokok, alokasi_jp");

    if (acpErr || !insertedAcps) {
      throw new Error("Gagal membuat baris Analisis CP: " + acpErr?.message);
    }

    insertedAcps.sort((a, b) => Number(a.urutan || 0) - Number(b.urutan || 0));

    const tpInserts: any[] = [];
    for (let i = 0; i < insertedAcps.length; i++) {
      const acp = insertedAcps[i];
      const iOriginal = Number(acp.urutan || i + 1) - 1;
      const cp = cpElements[iOriginal];
      const semester: 1 | 2 = iOriginal < midPoint ? 1 : 2;
      const jp = Number(acp.alokasi_jp || 2);

      const bankItem = bankMateri[iOriginal % Math.max(1, bankMateri.length)];
      const subbab1 = bankItem?.subbab?.[0] || `Konsep dasar dan prinsip ${cp?.elemen || "materi"}`;
      const subbab2 = bankItem?.subbab?.[1] || `Aplikasi praktis dan refleksi bermakna ${cp?.elemen || "materi"}`;

      const tpJp1 = Math.ceil(jp / 2);
      const tpJp2 = Math.floor(jp / 2);

      tpInserts.push({
        analisis_cp_id: acp.id,
        kode_tp: `${penugasan.tingkat_kelas}.${iOriginal * 2 + 1}`,
        deskripsi: `Peserta didik mampu memahami dan menganalisis ${subbab1} dalam konteks ${mapel.nama} dengan penuh rasa cinta ilmu.`,
        lingkup_materi: acp.materi_pokok,
        kompetensi: "Menganalisis dan Memahami",
        panca_cinta_ids: defaultPcIds,
        dpl_ids: defaultDplIds,
        semester,
        alokasi_jp: tpJp1 > 0 ? tpJp1 : jp,
        urutan: iOriginal * 2 + 1,
        created_by: penugasan.guru_id,
      });

      if (tpJp2 > 0) {
        tpInserts.push({
          analisis_cp_id: acp.id,
          kode_tp: `${penugasan.tingkat_kelas}.${iOriginal * 2 + 2}`,
          deskripsi: `Peserta didik mampu mempraktikkan dan menyajikan ${subbab2} sebagai wujud cinta sesama dan lingkungan madrasah.`,
          lingkup_materi: acp.materi_pokok,
          kompetensi: "Menerapkan dan Merefleksikan",
          panca_cinta_ids: defaultPcIds,
          dpl_ids: defaultDplIds,
          semester,
          alokasi_jp: tpJp2,
          urutan: iOriginal * 2 + 2,
          created_by: penugasan.guru_id,
        });
      }
    }

    const { data: insertedTps, error: tpErr } = await adminClient
      .from("tujuan_pembelajaran")
      .insert(tpInserts)
      .select("id, analisis_cp_id, kode_tp, deskripsi, lingkup_materi, panca_cinta_ids, dpl_ids, semester, alokasi_jp, urutan");

    if (tpErr || !insertedTps) {
      throw new Error("Gagal membuat Tujuan Pembelajaran: " + tpErr?.message);
    }

    insertedTps.sort((a, b) => a.urutan - b.urutan);

    // =========================================================================
    // 9. PARALLEL INSERT: ATP DOKUMEN & PROTA DOKUMEN
    // =========================================================================
    const [atpRes, protaRes] = await Promise.all([
      adminClient
        .from("atp")
        .insert({
          penugasan_id: penugasanId,
          status: targetStatus,
          metode_pengurutan: "konkret_ke_abstrak",
          created_by: penugasan.guru_id,
        })
        .select("id")
        .single(),
      adminClient
        .from("prota")
        .insert({
          penugasan_id: penugasanId,
          total_jp: targetJpTahun,
          status: targetStatus,
          snapshot_minggu_efektif: analisis as any,
          created_by: penugasan.guru_id,
        })
        .select("id")
        .single(),
    ]);

    if (atpRes.error || !atpRes.data) throw new Error("Gagal membuat dokumen ATP: " + atpRes.error?.message);
    if (protaRes.error || !protaRes.data) throw new Error("Gagal membuat dokumen Prota: " + protaRes.error?.message);

    const atpDoc = atpRes.data;
    const protaDoc = protaRes.data;

    const protaItemsToInsert = insertedTps.map((tp, idx) => {
      const pcNama = (tp.panca_cinta_ids || [])
        .map((pid: string) => allPancaCinta?.find((p) => p.id === pid)?.nama)
        .filter(Boolean)
        .join(", ");

      return {
        prota_id: protaDoc.id,
        tujuan_pembelajaran_id: tp.id,
        kode_tp: tp.kode_tp,
        materi_pokok: tp.lingkup_materi || tp.deskripsi || "Materi Pokok",
        tujuan_pembelajaran_teks: tp.deskripsi,
        panca_cinta_nama: pcNama || "Cinta Ilmu",
        semester: (tp.semester as 1 | 2) || 1,
        alokasi_jp: Number(tp.alokasi_jp || 2),
        urutan: idx + 1,
        created_by: penugasan.guru_id,
      };
    });

    const { data: insertedProtaItems, error: piErr } = await adminClient
      .from("prota_item")
      .insert(protaItemsToInsert)
      .select("id, tujuan_pembelajaran_id, semester, alokasi_jp, materi_pokok, kode_tp, tujuan_pembelajaran_teks");

    if (piErr || !insertedProtaItems) {
      throw new Error("Gagal membuat rincian item Prota: " + piErr?.message);
    }

    // =========================================================================
    // 10. GENERATE PROGRAM SEMESTER (PROSEM SMT 1 & 2 DALAM 1 BATCH)
    // =========================================================================
    const { data: insertedProsems, error: psErr } = await adminClient
      .from("prosem")
      .insert([
        {
          penugasan_id: penugasanId,
          semester: 1,
          status: targetStatus,
          total_minggu_efektif: analisis.semester1.totalMingguEfektif,
          total_jp: targetJpSmt1,
          snapshot_minggu_efektif: analisis.semester1 as any,
          created_by: penugasan.guru_id,
        },
        {
          penugasan_id: penugasanId,
          semester: 2,
          status: targetStatus,
          total_minggu_efektif: analisis.semester2.totalMingguEfektif,
          total_jp: targetJpSmt2,
          snapshot_minggu_efektif: analisis.semester2 as any,
          created_by: penugasan.guru_id,
        },
      ])
      .select("id, semester");

    if (psErr || !insertedProsems || insertedProsems.length < 2) {
      throw new Error("Gagal membuat dokumen Prosem: " + psErr?.message);
    }

    const prosemSmt1 = insertedProsems.find((p) => p.semester === 1)!;
    const prosemSmt2 = insertedProsems.find((p) => p.semester === 2)!;

    const prosemItemsToInsert: any[] = [];
    for (const sem of [1, 2] as const) {
      const pDoc = sem === 1 ? prosemSmt1 : prosemSmt2;
      const semesterData = sem === 1 ? analisis.semester1 : analisis.semester2;
      const effectiveWeekKeys: string[] = [];
      semesterData.daftarBulan.forEach((b) => {
        b.detailMinggu.forEach((m) => {
          if (m.efektif) effectiveWeekKeys.push(`${b.bulanIndex}_${m.mingguKe}`);
        });
      });

      const protaItemsSem = insertedProtaItems.filter((pi) => pi.semester === sem);
      let weekCursor = 0;

      protaItemsSem.forEach((pi, idx) => {
        let remainingJp = pi.alokasi_jp;
        const distribusi: Record<string, number> = {};
        const weeksAssigned: number[] = [];

        while (remainingJp > 0 && effectiveWeekKeys.length > 0) {
          const weekKey = effectiveWeekKeys[weekCursor % effectiveWeekKeys.length];
          const jpAlloc = Math.min(remainingJp, jpPerMinggu);
          distribusi[weekKey] = (distribusi[weekKey] || 0) + jpAlloc;
          remainingJp -= jpAlloc;
          weeksAssigned.push((weekCursor % effectiveWeekKeys.length) + 1);
          weekCursor++;
        }

        prosemItemsToInsert.push({
          prosem_id: pDoc.id,
          prota_item_id: pi.id,
          kode_tp: pi.kode_tp,
          materi_pokok: pi.materi_pokok,
          tujuan_pembelajaran_teks: pi.tujuan_pembelajaran_teks,
          alokasi_jp: pi.alokasi_jp,
          urutan: idx + 1,
          minggu_ke: Array.from(new Set(weeksAssigned)),
          distribusi_minggu: distribusi,
          created_by: penugasan.guru_id,
        });
      });
    }

    if (prosemItemsToInsert.length > 0) {
      await adminClient.from("prosem_item").insert(prosemItemsToInsert);
    }

    // =========================================================================
    // 11. GENERATE MODUL AJAR (RPP) STANDAR KBC (BATCH INSERT)
    // =========================================================================
    const defaultPertemuan = 2;
    const defaultTotalJp = jpPerMinggu * defaultPertemuan;
    const rppsToCreate = [
      { sem: 1 as const, tpList: insertedTps.filter((t) => t.semester === 1) },
      { sem: 2 as const, tpList: insertedTps.filter((t) => t.semester === 2) },
    ];

    const rppInserts: any[] = [];
    const rppMeta: Array<{
      tp: any;
      defaultTotalJp: number;
      defaultPertemuan: number;
      uniquePcIds: string[];
      materiPokok: string;
    }> = [];

    for (const rppGroup of rppsToCreate) {
      if (rppGroup.tpList.length === 0) continue;
      const representativeTp = rppGroup.tpList[0];
      const materiPokok = representativeTp.lingkup_materi || representativeTp.deskripsi;
      const defaultKesiapan = generateDefaultKesiapanMurid(materiPokok, mapel.nama);
      const defaultKarakteristik = generateDefaultKarakteristik(materiPokok, mapel.nama);
      const defaultLampiran = generateDefaultLampiran(
        materiPokok,
        mapel.nama,
        penugasan.tingkat_kelas,
        defaultModel?.nama
      );
      const defaultSpec = getModelPedagogiSpec(defaultModel?.nama);
      const uniquePcIds = Array.from(
        new Set([...defaultPcIds, ...((representativeTp.panca_cinta_ids as string[]) || [])])
      );

      rppMeta.push({
        tp: representativeTp,
        defaultTotalJp,
        defaultPertemuan,
        uniquePcIds,
        materiPokok,
      });

      rppInserts.push({
        penugasan_id: penugasanId,
        atp_id: atpDoc.id,
        model_id: defaultModel?.id || null,
        materi_pokok: materiPokok,
        topik_pembelajaran: materiPokok,
        alokasi_waktu: `${defaultTotalJp} JP (${defaultPertemuan} Pertemuan x ${jpPerMinggu} x 40 menit)`,
        alokasi_jp: defaultTotalJp,
        jumlah_pertemuan: defaultPertemuan,
        menit_per_jp: 40,
        pertemuan_ke: 1,
        versi: "lengkap" as VersiRpp,
        tujuan_pembelajaran_ids: [representativeTp.id],
        dimensi_profil_lulusan_ids: defaultDplIds,
        panca_cinta_ids: uniquePcIds,
        materi_kbc_ids: [],
        metode_pembelajaran: defaultSpec.rekomendasi_metode,
        karakteristik_materi: defaultKarakteristik.karakteristik_materi,
        benang_merah_kbc: defaultKarakteristik.benang_merah_kbc,
        kesiapan_murid: defaultKesiapan as any,
        lampiran: defaultLampiran as any,
        tujuan_pembelajaran_teks: representativeTp.deskripsi,
        lingkungan_belajar_fisik: "Ruang kelas yang nyaman, tertata rapi, dan mendukung diskusi kolaboratif.",
        budaya_belajar: "Budaya saling memuliakan, empati, kebebasan berpendapat dengan santun, dan cinta ilmu.",
        status: targetStatus,
        created_by: penugasan.guru_id,
      });
    }

    let createdRppCount = 0;
    if (rppInserts.length > 0) {
      const { data: createdRpps, error: rppErr } = await adminClient
        .from("rpp")
        .insert(rppInserts)
        .select("id");

      if (!rppErr && createdRpps && createdRpps.length > 0) {
        createdRppCount = createdRpps.length;
        const allLangkahInserts: any[] = [];

        for (let i = 0; i < createdRpps.length; i++) {
          const rpp = createdRpps[i];
          const meta = rppMeta[i];
          const generatedLangkah = generateModelLangkahList({
            modelNama: defaultModel?.nama,
            sintaksDb:
              (defaultModel?.sintaks as unknown as Array<{
                urutan: number;
                nama_sintaks: string;
                pengalaman_belajar: PengalamanBelajar;
              }>) || null,
            materiPokok: meta.materiPokok,
            topikPembelajaran: meta.materiPokok,
            mapelNama: mapel.nama,
            tingkatKelas: penugasan.tingkat_kelas,
            jumlahPertemuan: meta.defaultPertemuan,
            alokasiJp: meta.defaultTotalJp,
            menitPerJp: 40,
            pancaCintaIds: meta.uniquePcIds,
            pancaCintaMaster: allPancaCinta || [],
            modeDistribusi: "utuh_per_pertemuan",
          });

          generatedLangkah.forEach((step) => {
            allLangkahInserts.push({
              rpp_id: rpp.id,
              tahap: step.tahap,
              pengalaman: step.pengalaman,
              deskripsi_kegiatan: step.deskripsi_kegiatan,
              durasi_menit: step.durasi_menit,
              urutan: step.urutan,
              pertemuan_ke: step.pertemuan_ke,
              prinsip: step.prinsip,
              panca_cinta_id: step.panca_cinta_id,
              aksi_kbc: step.aksi_kbc,
              created_by: penugasan.guru_id,
            });
          });
        }

        if (allLangkahInserts.length > 0) {
          await adminClient.from("rpp_langkah").insert(allLangkahInserts);
        }
      }
    }

    return {
      success: true,
      penugasanId,
      guruNama: guru?.nama_lengkap || "Guru",
      mapelNama: mapel.nama,
      tingkatKelas: penugasan.tingkat_kelas,
      totalJp: targetJpTahun,
      jumlahElemen: N,
      jumlahTp: insertedTps.length,
      rppCount: createdRppCount,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, error: msg };
  }
}

/**
 * Membuat seluruh perangkat pembelajaran default untuk SATU GURU (seluruh penugasan kelasnya).
 */
export async function generateDefaultPerangkatGuruAction(
  guruId: string,
  options?: { autoSubmit?: boolean }
): Promise<{
  success: boolean;
  guruNama?: string;
  totalPenugasan?: number;
  totalTp?: number;
  totalRpp?: number;
  details?: GenerateResult[];
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi tidak valid." };
    }

    if (session.role === "guru" && session.user.id !== guruId) {
      return { success: false, error: "Hanya Admin, Kepala Madrasah, atau guru bersangkutan yang berhak membuat perangkat." };
    }

    const adminClient = createAdminClient();

    // 1. Ambil tahun ajaran aktif
    const { data: taAktif } = await adminClient
      .from("tahun_ajaran")
      .select("id, nama")
      .eq("aktif", true)
      .maybeSingle();

    if (!taAktif) {
      return { success: false, error: "Tahun ajaran aktif belum ditentukan." };
    }

    // 2. Ambil penugasan guru di tahun ajaran aktif
    const { data: penugasanList, error: pErr } = await adminClient
      .from("penugasan")
      .select("id, tingkat_kelas, rombel, mapel(nama)")
      .eq("guru_id", guruId)
      .eq("tahun_ajaran_id", taAktif.id);

    if (pErr || !penugasanList || penugasanList.length === 0) {
      return { success: false, error: "Guru ini belum memiliki penugasan mengajar di tahun ajaran aktif." };
    }

    const { data: guruProfile } = await adminClient
      .from("profiles")
      .select("nama_lengkap")
      .eq("id", guruId)
      .single();

    // Ambil shared context sekali saja untuk semua penugasan guru ini
    const sharedCtx = await getGeneratorSharedContext(taAktif.id);

    const results: GenerateResult[] = [];
    let accTp = 0;
    let accRpp = 0;

    for (const p of penugasanList) {
      const res = await generateDefaultPerangkatForPenugasan(p.id, options, sharedCtx);
      results.push(res);
      if (res.success) {
        accTp += res.jumlahTp || 0;
        accRpp += res.rppCount || 0;
      }
    }

    safeRevalidate("/dashboard");
    safeRevalidate("/validasi");
    safeRevalidate("/atp");
    safeRevalidate("/prota");
    safeRevalidate("/prosem");
    safeRevalidate("/modul-ajar");

    return {
      success: true,
      guruNama: guruProfile?.nama_lengkap || "Guru",
      totalPenugasan: penugasanList.length,
      totalTp: accTp,
      totalRpp: accRpp,
      details: results,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, error: msg };
  }
}

/**
 * Membuat seluruh perangkat pembelajaran default secara MASSAL untuk semua guru yang progresnya masih rendah
 */
export async function generateDefaultPerangkatMassalAction(
  guruIds?: string[],
  options?: { autoSubmit?: boolean }
): Promise<{
  success: boolean;
  guruCount?: number;
  penugasanCount?: number;
  error?: string;
}> {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return { success: false, error: "Sesi tidak valid." };
    }

    if (session.role === "guru") {
      return { success: false, error: "Hanya Admin, Kepala Madrasah, atau Waka Kurikulum yang berhak menjalankan pembuatan massal." };
    }

    const adminClient = createAdminClient();

    const { data: taAktif } = await adminClient
      .from("tahun_ajaran")
      .select("id")
      .eq("aktif", true)
      .maybeSingle();

    if (!taAktif) {
      return { success: false, error: "Tahun ajaran aktif belum ditentukan." };
    }

    let query = adminClient
      .from("penugasan")
      .select("id, guru_id")
      .eq("tahun_ajaran_id", taAktif.id);

    if (guruIds && guruIds.length > 0) {
      query = query.in("guru_id", guruIds);
    }

    const { data: penugasanList, error: pErr } = await query;
    if (pErr || !penugasanList || penugasanList.length === 0) {
      return { success: false, error: "Tidak ada penugasan guru yang memenuhi kriteria." };
    }

    let pCount = 0;
    const processedGurus = new Set<string>();
    const sharedCtx = await getGeneratorSharedContext(taAktif.id);

    for (const p of penugasanList) {
      const res = await generateDefaultPerangkatForPenugasan(p.id, options, sharedCtx);
      if (res.success) {
        pCount++;
        processedGurus.add(p.guru_id);
      }
    }

    safeRevalidate("/dashboard");
    safeRevalidate("/validasi");
    safeRevalidate("/atp");
    safeRevalidate("/prota");
    safeRevalidate("/prosem");
    safeRevalidate("/modul-ajar");

    return {
      success: true,
      guruCount: processedGurus.size,
      penugasanCount: pCount,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Kesalahan sistem.";
    return { success: false, error: msg };
  }
}
