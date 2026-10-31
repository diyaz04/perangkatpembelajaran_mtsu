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

/**
 * Menghasilkan seluruh perangkat pembelajaran default (ATP, Prota, Prosem Smt 1 & 2, Modul Ajar/RPP)
 * untuk 1 penugasan guru secara otomatis.
 *
 * Sesuai instruksi:
 * Perhitungan JP per elemen di ATP dibagi rata sesuai porsi JP tahun dibagi jumlah elemen.
 */
export async function generateDefaultPerangkatForPenugasan(
  penugasanId: string,
  options?: { autoSubmit?: boolean }
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

    // 2. Ambil Profil Madrasah & Kalender Kegiatan
    const [madrasahRes, kalenderRes] = await Promise.all([
      adminClient.from("madrasah").select("*").limit(1).maybeSingle(),
      adminClient.from("kalender_kegiatan").select("*").eq("tahun_ajaran_id", ta.id),
    ]);

    const madrasah = madrasahRes.data;
    const kalenderRows = (kalenderRes.data || []) as KalenderKegiatanInput[];
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
        // Insert CP elements ke tabel capaian_pembelajaran
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

    // 5. Ambil data master pendukung (Panca Cinta, DPL, Model Pembelajaran)
    const [pancaCintaRes, dplRes, modelRes] = await Promise.all([
      adminClient.from("panca_cinta").select("id, nama, kode").order("urutan", { ascending: true }),
      adminClient.from("dimensi_profil_lulusan").select("id, nama, kode").order("kode", { ascending: true }),
      adminClient.from("model_pembelajaran").select("id, nama, sintaks").limit(1).maybeSingle(),
    ]);

    const allPancaCinta = pancaCintaRes.data || [];
    const allDpl = dplRes.data || [];
    const defaultModel = modelRes.data;

    const defaultPcIds = allPancaCinta.slice(0, 2).map((p) => p.id);
    const defaultDplIds = allDpl.slice(0, 2).map((d) => d.id);

    // 6. Ambil Materi dari Bank Data sesuai kelas
    const slug = findBankDataSlug(mapel.nama, mapel.kode);
    const bankMateri = slug ? getMateriByMapelAndGrade(slug, penugasan.tingkat_kelas) : [];

    // 7. BERSIHKAN DOKUMEN LAMA UNTUK PENUGASAN INI (Cascade clean)
    const { data: existingRpps } = await adminClient
      .from("rpp")
      .select("id")
      .eq("penugasan_id", penugasanId);

    if (existingRpps && existingRpps.length > 0) {
      const rppIds = existingRpps.map((r) => r.id);
      await adminClient.from("rpp_langkah").delete().in("rpp_id", rppIds);
      await adminClient.from("rpp").delete().eq("penugasan_id", penugasanId);
    }

    const { data: existingProsems } = await adminClient
      .from("prosem")
      .select("id")
      .eq("penugasan_id", penugasanId);

    if (existingProsems && existingProsems.length > 0) {
      const prosemIds = existingProsems.map((p) => p.id);
      await adminClient.from("prosem_item").delete().in("prosem_id", prosemIds);
      await adminClient.from("prosem").delete().eq("penugasan_id", penugasanId);
    }

    const { data: existingProta } = await adminClient
      .from("prota")
      .select("id")
      .eq("penugasan_id", penugasanId)
      .maybeSingle();

    if (existingProta) {
      await adminClient.from("prota_item").delete().eq("prota_id", existingProta.id);
      await adminClient.from("prota").delete().eq("penugasan_id", penugasanId);
    }

    const { data: existingAcp } = await adminClient
      .from("analisis_cp")
      .select("id")
      .eq("penugasan_id", penugasanId);

    if (existingAcp && existingAcp.length > 0) {
      const acpIds = existingAcp.map((a) => a.id);
      await adminClient.from("tujuan_pembelajaran").delete().in("analisis_cp_id", acpIds);
      await adminClient.from("analisis_cp").delete().eq("penugasan_id", penugasanId);
    }

    await adminClient.from("atp").delete().eq("penugasan_id", penugasanId);

    // =========================================================================
    // 8. GENERATE ANALISIS CP & TUJUAN PEMBELAJARAN (ATP)
    // =========================================================================
    const midPoint = Math.ceil(N / 2);
    const createdAnalisisRows: Array<{
      id: string;
      elemen: string;
      materi_pokok: string;
      alokasi_jp: number;
      semester: 1 | 2;
    }> = [];

    const createdTpRows: Array<{
      id: string;
      analisis_cp_id: string;
      kode_tp: string;
      materi_pokok: string;
      deskripsi: string;
      panca_cinta_ids: string[];
      dpl_ids: string[];
      semester: 1 | 2;
      alokasi_jp: number;
      urutan: number;
    }> = [];

    for (let i = 0; i < N; i++) {
      const cp = cpElements[i];
      const semester: 1 | 2 = i < midPoint ? 1 : 2;
      const jp = jpPerElemen[i];

      // Tentukan judul materi pokok dari Bank Data jika ada
      const bankItem = bankMateri[i % Math.max(1, bankMateri.length)];
      const materiPokok =
        bankItem?.bab || `${mapel.nama}: Eksplorasi ${cp.elemen}`;

      const { data: acpRow, error: acpErr } = await adminClient
        .from("analisis_cp")
        .insert({
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
        })
        .select("id")
        .single();

      if (acpErr || !acpRow) {
        throw new Error("Gagal membuat baris Analisis CP: " + acpErr?.message);
      }

      createdAnalisisRows.push({
        id: acpRow.id,
        elemen: cp.elemen,
        materi_pokok: materiPokok,
        alokasi_jp: jp,
        semester,
      });

      // Buat 1 atau 2 Tujuan Pembelajaran (TP) per elemen
      // Membagi alokasi JP elemen ke TP
      const tpJp1 = Math.ceil(jp / 2);
      const tpJp2 = Math.floor(jp / 2);

      const subbab1 = bankItem?.subbab?.[0] || `Konsep dasar dan prinsip ${cp.elemen}`;
      const subbab2 = bankItem?.subbab?.[1] || `Aplikasi praktis dan refleksi bermakna ${cp.elemen}`;

      const tp1Desc = `Peserta didik mampu memahami dan menganalisis ${subbab1} dalam konteks ${mapel.nama} dengan penuh rasa cinta ilmu.`;
      const tp2Desc = `Peserta didik mampu mempraktikkan dan menyajikan ${subbab2} sebagai wujud cinta sesama dan lingkungan madrasah.`;

      const tpInserts = [
        {
          analisis_cp_id: acpRow.id,
          kode_tp: `${penugasan.tingkat_kelas}.${i * 2 + 1}`,
          deskripsi: tp1Desc,
          lingkup_materi: materiPokok,
          kompetensi: "Menganalisis dan Memahami",
          panca_cinta_ids: defaultPcIds,
          dpl_ids: defaultDplIds,
          semester,
          alokasi_jp: tpJp1 > 0 ? tpJp1 : jp,
          urutan: i * 2 + 1,
          created_by: penugasan.guru_id,
        },
      ];

      if (tpJp2 > 0) {
        tpInserts.push({
          analisis_cp_id: acpRow.id,
          kode_tp: `${penugasan.tingkat_kelas}.${i * 2 + 2}`,
          deskripsi: tp2Desc,
          lingkup_materi: materiPokok,
          kompetensi: "Menerapkan dan Merefleksikan",
          panca_cinta_ids: defaultPcIds,
          dpl_ids: defaultDplIds,
          semester,
          alokasi_jp: tpJp2,
          urutan: i * 2 + 2,
          created_by: penugasan.guru_id,
        });
      }

      const { data: insertedTps, error: tpErr } = await adminClient
        .from("tujuan_pembelajaran")
        .insert(tpInserts)
        .select("id, analisis_cp_id, kode_tp, deskripsi, lingkup_materi, panca_cinta_ids, dpl_ids, semester, alokasi_jp, urutan");

      if (tpErr || !insertedTps) {
        throw new Error("Gagal membuat Tujuan Pembelajaran: " + tpErr?.message);
      }

      insertedTps.forEach((tp) => {
        createdTpRows.push({
          id: tp.id,
          analisis_cp_id: tp.analisis_cp_id,
          kode_tp: tp.kode_tp,
          materi_pokok: tp.lingkup_materi || materiPokok,
          deskripsi: tp.deskripsi,
          panca_cinta_ids: tp.panca_cinta_ids || defaultPcIds,
          dpl_ids: tp.dpl_ids || defaultDplIds,
          semester: tp.semester as 1 | 2,
          alokasi_jp: Number(tp.alokasi_jp || 2),
          urutan: Number(tp.urutan || 1),
        });
      });
    }

    // Buat record ATP
    const { data: atpDoc, error: atpErr } = await adminClient
      .from("atp")
      .insert({
        penugasan_id: penugasanId,
        status: targetStatus,
        metode_pengurutan: "konkret_ke_abstrak",
        created_by: penugasan.guru_id,
      })
      .select("id")
      .single();

    if (atpErr || !atpDoc) {
      throw new Error("Gagal membuat dokumen ATP: " + atpErr?.message);
    }

    // =========================================================================
    // 9. GENERATE PROGRAM TAHUNAN (PROTA)
    // =========================================================================
    const { data: protaDoc, error: protaErr } = await adminClient
      .from("prota")
      .insert({
        penugasan_id: penugasanId,
        total_jp: targetJpTahun,
        status: targetStatus,
        snapshot_minggu_efektif: analisis as any,
        created_by: penugasan.guru_id,
      })
      .select("id")
      .single();

    if (protaErr || !protaDoc) {
      throw new Error("Gagal membuat dokumen Prota: " + protaErr?.message);
    }

    const protaItemsToInsert = createdTpRows.map((tp, idx) => {
      const pcNama = tp.panca_cinta_ids
        .map((pid) => allPancaCinta.find((p) => p.id === pid)?.nama)
        .filter(Boolean)
        .join(", ");

      return {
        prota_id: protaDoc.id,
        tujuan_pembelajaran_id: tp.id,
        kode_tp: tp.kode_tp,
        materi_pokok: tp.materi_pokok,
        tujuan_pembelajaran_teks: tp.deskripsi,
        panca_cinta_nama: pcNama || "Cinta Ilmu",
        semester: tp.semester,
        alokasi_jp: tp.alokasi_jp,
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
    // 10. GENERATE PROGRAM SEMESTER (PROSEM SMT 1 & SMT 2)
    // =========================================================================
    for (const sem of [1, 2] as const) {
      const semesterData = sem === 1 ? analisis.semester1 : analisis.semester2;
      const targetJpSem = sem === 1 ? targetJpSmt1 : targetJpSmt2;

      // Ambil kunci minggu efektif (hanya minggu yang efektif mengajar)
      const effectiveWeekKeys: string[] = [];
      semesterData.daftarBulan.forEach((b) => {
        b.detailMinggu.forEach((m) => {
          if (m.efektif) {
            effectiveWeekKeys.push(`${b.bulanIndex}_${m.mingguKe}`);
          }
        });
      });

      const protaItemsSem = insertedProtaItems.filter((pi) => pi.semester === sem);

      const { data: prosemDoc, error: psErr } = await adminClient
        .from("prosem")
        .insert({
          penugasan_id: penugasanId,
          semester: sem,
          status: targetStatus,
          total_minggu_efektif: semesterData.totalMingguEfektif,
          total_jp: targetJpSem,
          snapshot_minggu_efektif: semesterData as any,
          created_by: penugasan.guru_id,
        })
        .select("id")
        .single();

      if (psErr || !prosemDoc) {
        throw new Error(`Gagal membuat dokumen Prosem Semester ${sem}: ${psErr?.message}`);
      }

      // Distribusikan alokasi JP per minggu efektif
      let weekCursor = 0;
      const prosemItemsToInsert = protaItemsSem.map((pi, idx) => {
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

        return {
          prosem_id: prosemDoc.id,
          prota_item_id: pi.id,
          kode_tp: pi.kode_tp,
          materi_pokok: pi.materi_pokok,
          tujuan_pembelajaran_teks: pi.tujuan_pembelajaran_teks,
          alokasi_jp: pi.alokasi_jp,
          urutan: idx + 1,
          minggu_ke: Array.from(new Set(weeksAssigned)),
          distribusi_minggu: distribusi,
          created_by: penugasan.guru_id,
        };
      });

      if (prosemItemsToInsert.length > 0) {
        await adminClient.from("prosem_item").insert(prosemItemsToInsert);
      }
    }

    // =========================================================================
    // 11. GENERATE MODUL AJAR (RPP) STANDAR KBC
    //     Dibuat representatif (minimal 2 Modul Ajar: 1 Smt 1 & 1 Smt 2)
    // =========================================================================
    const rppsToCreate = [
      { sem: 1 as const, tpList: createdTpRows.filter((t) => t.semester === 1) },
      { sem: 2 as const, tpList: createdTpRows.filter((t) => t.semester === 2) },
    ];

    let createdRppCount = 0;

    for (const rppGroup of rppsToCreate) {
      if (rppGroup.tpList.length === 0) continue;

      const representativeTp = rppGroup.tpList[0];
      const materiPokok = representativeTp.materi_pokok;
      const defaultPertemuan = 2;
      const defaultTotalJp = jpPerMinggu * defaultPertemuan;

      const defaultKesiapan = generateDefaultKesiapanMurid(materiPokok, mapel.nama);
      const defaultKarakteristik = generateDefaultKarakteristik(materiPokok, mapel.nama);
      const defaultLampiran = generateDefaultLampiran(
        materiPokok,
        mapel.nama,
        penugasan.tingkat_kelas,
        defaultModel?.nama
      );
      const defaultSpec = getModelPedagogiSpec(defaultModel?.nama);

      const uniquePcIds = Array.from(new Set([...defaultPcIds, ...(representativeTp.panca_cinta_ids || [])]));

      const { data: newRpp, error: rppErr } = await adminClient
        .from("rpp")
        .insert({
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
        })
        .select("id")
        .single();

      if (!rppErr && newRpp) {
        createdRppCount++;

        // Buat langkah pembelajaran
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
          mapelNama: mapel.nama,
          tingkatKelas: penugasan.tingkat_kelas,
          jumlahPertemuan: defaultPertemuan,
          alokasiJp: defaultTotalJp,
          menitPerJp: 40,
          pancaCintaIds: uniquePcIds,
          pancaCintaMaster: allPancaCinta,
          modeDistribusi: "utuh_per_pertemuan",
        });

        const langkahInserts = generatedLangkah.map((step) => ({
          rpp_id: newRpp.id,
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
        }));

        if (langkahInserts.length > 0) {
          await adminClient.from("rpp_langkah").insert(langkahInserts);
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
      jumlahTp: createdTpRows.length,
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

    const results: GenerateResult[] = [];
    let accTp = 0;
    let accRpp = 0;

    for (const p of penugasanList) {
      const res = await generateDefaultPerangkatForPenugasan(p.id, options);
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

    for (const p of penugasanList) {
      const res = await generateDefaultPerangkatForPenugasan(p.id, options);
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
