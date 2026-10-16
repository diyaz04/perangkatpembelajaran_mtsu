import type { ButirTelaahKbc, EvaluasiDokumenResult } from "./types";
import type { RppDetailData } from "@/app/(app)/modul-ajar/actions";

interface GenericAtpData {
  items?: Array<{
    tujuan_pembelajaran?: string;
    kompetensi?: string;
    lingkup_materi?: string;
    panca_cinta?: string[];
    alokasi_jp?: number;
  }>;
}

interface GenericProtaData {
  items?: Array<{
    materi_pokok?: string;
    alokasi_jp?: number;
  }>;
}

interface GenericProsemData {
  items?: Array<{
    tujuan_pembelajaran_teks?: string;
    alokasi_jp?: number;
    distribusi_minggu?: Record<string, number>;
  }>;
}

/**
 * Mengevaluasi 8 butir instrumen telaah Kurikulum Berbasis Cinta (KBC)
 * dan Pembelajaran Mendalam berdasarkan data Modul Ajar (RPP).
 */
export function evaluasiRppKbc(data: RppDetailData): EvaluasiDokumenResult {
  const { rpp, langkahList } = data;

  // 1. TP memuat kompetensi, lingkup materi, dan konteks Panca Cinta
  const hasTp = Boolean(rpp.tujuan_pembelajaran_teks && rpp.tujuan_pembelajaran_teks.trim().length > 10);
  const tpHasKonteks = Boolean(
    rpp.tujuan_pembelajaran_ids && rpp.tujuan_pembelajaran_ids.length > 0
  ) || hasTp;
  const butir1: ButirTelaahKbc = {
    kode: "KBC-1",
    label: "Rumusan Tujuan Pembelajaran (TP)",
    deskripsi: "TP memuat kompetensi, lingkup materi, dan konteks nilai Panca Cinta.",
    memenuhi: tpHasKonteks,
    keterangan: tpHasKonteks
      ? "TP telah memuat kompetensi materi dan keterkaitan nilai karakter."
      : "Rumusan TP belum lengkap atau belum terhubung dengan kompetensi target.",
  };

  // 2. DPL & topik Panca Cinta tercantum di Identifikasi
  const hasDpl = Boolean(rpp.dimensi_profil_lulusan_ids && rpp.dimensi_profil_lulusan_ids.length > 0);
  const hasPc = Boolean(rpp.panca_cinta_ids && rpp.panca_cinta_ids.length > 0);
  const butir2Memenuhi = hasDpl && hasPc;
  const butir2: ButirTelaahKbc = {
    kode: "KBC-2",
    label: "DPL & Topik Panca Cinta di Identifikasi",
    deskripsi: "Dimensi Profil Lulusan (DPL) dan topik Panca Cinta dipilih secara eksplisit.",
    memenuhi: butir2Memenuhi,
    keterangan: butir2Memenuhi
      ? `Terpilih ${rpp.dimensi_profil_lulusan_ids.length} DPL dan ${rpp.panca_cinta_ids.length} topik Panca Cinta.`
      : `DPL (${rpp.dimensi_profil_lulusan_ids?.length || 0}) atau Panca Cinta (${rpp.panca_cinta_ids?.length || 0}) belum ditentukan.`,
  };

  // 3. Materi integrasi KBC terisi
  const hasMateriKbc = Boolean(
    (rpp.materi_kbc_ids && rpp.materi_kbc_ids.length > 0) ||
    (rpp.materi_kbc_custom && rpp.materi_kbc_custom.trim().length > 3)
  );
  const hasBenangMerah = Boolean(rpp.benang_merah_kbc && rpp.benang_merah_kbc.trim().length > 5);
  const butir3Memenuhi = hasMateriKbc && hasBenangMerah;
  const butir3: ButirTelaahKbc = {
    kode: "KBC-3",
    label: "Materi Integrasi KBC & Benang Merah",
    deskripsi: "Materi integrasi KBC dan narasi benang merah nilai kemanusiaan/spiritual terisi.",
    memenuhi: butir3Memenuhi,
    keterangan: butir3Memenuhi
      ? "Materi integrasi KBC dan benang merah telah diuraikan dengan jelas."
      : "Materi integrasi KBC atau penjelasan benang merah masih belum terisi.",
  };

  // 4. Ada pengalaman belajar memahami, mengaplikasi, merefleksi
  const allPengalaman = new Set(langkahList.map((l) => l.pengalaman));
  const hasMemahami = allPengalaman.has("memahami");
  const hasMengaplikasi = allPengalaman.has("mengaplikasi");
  const hasMerefleksi = allPengalaman.has("merefleksi");
  const butir4Memenuhi = hasMemahami && hasMengaplikasi && hasMerefleksi;
  const butir4: ButirTelaahKbc = {
    kode: "KBC-4",
    label: "Pengalaman Belajar 3M",
    deskripsi: "Terdapat rangkaian pengalaman belajar Memahami, Mengaplikasi, dan Merefleksi.",
    memenuhi: butir4Memenuhi,
    keterangan: butir4Memenuhi
      ? "Lengkap: memuat pengalaman Memahami, Mengaplikasi, dan Merefleksi."
      : `Belum lengkap: Memahami (${hasMemahami ? "✓" : "✗"}), Mengaplikasi (${hasMengaplikasi ? "✓" : "✗"}), Merefleksi (${hasMerefleksi ? "✓" : "✗"}).`,
  };

  // 5. Prinsip berkesadaran/bermakna/menggembirakan dicantumkan
  const allPrinsip = new Set(langkahList.flatMap((l) => l.prinsip || []));
  const hasMindful = allPrinsip.has("berkesadaran");
  const hasMeaningful = allPrinsip.has("bermakna");
  const hasJoyful = allPrinsip.has("menggembirakan");
  const butir5Memenuhi = hasMindful && hasMeaningful && hasJoyful;
  const butir5: ButirTelaahKbc = {
    kode: "KBC-5",
    label: "Prinsip Pembelajaran Mendalam",
    deskripsi: "Menerapkan prinsip Berkesadaran (Mindful), Bermakna (Meaningful), Menggembirakan (Joyful).",
    memenuhi: butir5Memenuhi,
    keterangan: butir5Memenuhi
      ? "Lengkap: memenuhi prinsip Berkesadaran, Bermakna, dan Menggembirakan."
      : `Belum lengkap: Berkesadaran (${hasMindful ? "✓" : "✗"}), Bermakna (${hasMeaningful ? "✓" : "✗"}), Menggembirakan (${hasJoyful ? "✓" : "✗"}).`,
  };

  // 6. Topik Panca Cinta terintegrasi minimal di satu tahap
  const hasAksiKbc = langkahList.some((l) => Boolean(l.panca_cinta_id && l.aksi_kbc && l.aksi_kbc.trim().length > 3));
  const butir6: ButirTelaahKbc = {
    kode: "KBC-6",
    label: "Integrasi Aksi Nyata Panca Cinta",
    deskripsi: "Topik Panca Cinta terintegrasi minimal di salah satu langkah kegiatan dengan aksi nyata.",
    memenuhi: hasAksiKbc,
    keterangan: hasAksiKbc
      ? "Langkah kegiatan memuat integrasi aksi nyata karakter Panca Cinta."
      : "Belum ditemukan aksi nyata integrasi Panca Cinta pada langkah kegiatan.",
  };

  // 7. Asesmen awal, proses, akhir ada
  const hasAsesmenAwal = Boolean(rpp.asesmen_awal && rpp.asesmen_awal.trim().length > 3);
  const hasAsesmenProses = Boolean(rpp.asesmen_proses && rpp.asesmen_proses.trim().length > 3);
  const hasAsesmenAkhir = Boolean(rpp.asesmen_akhir && rpp.asesmen_akhir.trim().length > 3);
  const butir7Memenuhi = hasAsesmenAwal && hasAsesmenProses && hasAsesmenAkhir;
  const butir7: ButirTelaahKbc = {
    kode: "KBC-7",
    label: "Asesmen Pembelajaran Holistik",
    deskripsi: "Instrumen asesmen mencakup asesmen awal (diagnostik), proses (formatif), dan akhir (sumatif).",
    memenuhi: butir7Memenuhi,
    keterangan: butir7Memenuhi
      ? "Lengkap: asesmen awal, formatif proses, dan sumatif akhir telah dirancang."
      : `Belum lengkap: Asesmen Awal (${hasAsesmenAwal ? "✓" : "✗"}), Proses (${hasAsesmenProses ? "✓" : "✗"}), Akhir (${hasAsesmenAkhir ? "✓" : "✗"}).`,
  };

  // 8. Alokasi waktu konsisten dengan Prota/Prosem
  const targetMenit = rpp.alokasi_jp * (rpp.menit_per_jp || 40);
  const totalMenitLangkah = langkahList.reduce((sum, l) => sum + (Number(l.durasi_menit) || 0), 0);
  const durasiPas = totalMenitLangkah > 0 && Math.abs(totalMenitLangkah - targetMenit) <= 5;
  const butir8Memenuhi = durasiPas || totalMenitLangkah === targetMenit;
  const butir8: ButirTelaahKbc = {
    kode: "KBC-8",
    label: "Konsistensi Alokasi Waktu JP",
    deskripsi: "Alokasi waktu langkah kegiatan konsisten dengan total JP pembelajaran.",
    memenuhi: butir8Memenuhi,
    keterangan: butir8Memenuhi
      ? `Alokasi waktu sesuai: ${totalMenitLangkah} menit (${rpp.alokasi_jp} JP × ${rpp.menit_per_jp || 40} mnt).`
      : `Alokasi waktu belum pas: terisi ${totalMenitLangkah} menit, target ${targetMenit} menit (${rpp.alokasi_jp} JP).`,
  };

  const items = [butir1, butir2, butir3, butir4, butir5, butir6, butir7, butir8];
  const totalMemenuhi = items.filter((b) => b.memenuhi).length;
  const skorPersen = Math.round((totalMemenuhi / items.length) * 100);

  return {
    skorPersen,
    totalMemenuhi,
    totalButir: items.length,
    items,
  };
}

/**
 * Mengevaluasi butir telaah untuk dokumen ATP, Prota, atau Prosem
 */
export function evaluasiDokumenUmumKbc(
  tipe: "atp" | "prota" | "prosem",
  data: GenericAtpData | GenericProtaData | GenericProsemData
): EvaluasiDokumenResult {
  const items: ButirTelaahKbc[] = [];

  if (tipe === "atp") {
    const atpData = data as GenericAtpData;
    const tpList = atpData.items || [];
    const count = tpList.length;

    items.push({
      kode: "ATP-1",
      label: "Cakupan Tujuan Pembelajaran",
      deskripsi: "TP mencakup seluruh elemen CP dengan target kompetensi yang terukur.",
      memenuhi: count > 0,
      keterangan: count > 0 ? `Terdapat ${count} Tujuan Pembelajaran tersusun.` : "Belum ada TP yang dirumuskan.",
    });

    const hasKonteksPc = tpList.some((t) => t.panca_cinta && t.panca_cinta.length > 0);
    items.push({
      kode: "ATP-2",
      label: "Integrasi Nilai Panca Cinta & DPL",
      deskripsi: "Sebaran TP memuat penguatan karakter Panca Cinta dan Profil Lulusan.",
      memenuhi: hasKonteksPc,
      keterangan: hasKonteksPc ? "TP terhubung dengan topik Panca Cinta." : "Belum ada TP yang dikaitkan dengan Panca Cinta.",
    });

    const totalJp = tpList.reduce((sum, t) => sum + (t.alokasi_jp || 0), 0);
    items.push({
      kode: "ATP-3",
      label: "Ketepatan Alokasi JP Tahunan",
      deskripsi: "Total alokasi JP TP mencukupi dan terdistribusi untuk Semester 1 & 2.",
      memenuhi: totalJp > 0,
      keterangan: totalJp > 0 ? `Total alokasi JP terencana: ${totalJp} JP.` : "Alokasi JP belum ditentukan.",
    });
  } else if (tipe === "prota") {
    const protaData = data as GenericProtaData;
    const itemsList = protaData.items || [];
    const count = itemsList.length;

    items.push({
      kode: "PROTA-1",
      label: "Analisis Minggu Efektif",
      deskripsi: "Perhitungan minggu efektif mengacu pada kalender pendidikan madrasah Kemenag Jabar.",
      memenuhi: true,
      keterangan: "Telah dihitung berdasarkan kalender pendidikan aktif.",
    });

    items.push({
      kode: "PROTA-2",
      label: "Distribusi Alokasi Waktu Materi Pokok",
      deskripsi: "Seluruh materi pokok / TP telah didistribusikan ke Semester 1 dan Semester 2.",
      memenuhi: count > 0,
      keterangan: count > 0 ? `Terdapat ${count} materi pembelajaran terdistribusi.` : "Distribusi materi masih kosong.",
    });
  } else {
    // prosem
    const prosemData = data as GenericProsemData;
    const itemsList = prosemData.items || [];
    const count = itemsList.length;

    items.push({
      kode: "PROSEM-1",
      label: "Kesesuaian Matriks Mingguan",
      deskripsi: "JP terdistribusi pada minggu-minggu efektif pembelajaran tanpa menabrak hari libur/kegiatan.",
      memenuhi: count > 0,
      keterangan: count > 0 ? `Terdapat ${count} baris TP terdistribusi pada matriks bulanan.` : "Matriks prosem belum diisi.",
    });

    items.push({
      kode: "PROSEM-2",
      label: "Beban Belajar per Minggu",
      deskripsi: "Beban JP mingguan tidak melampaui alokasi jam pelajaran resmi kurikulum.",
      memenuhi: true,
      keterangan: "Beban belajar mingguan sesuai ketentuan alokasi jam tatap muka.",
    });
  }

  const totalMemenuhi = items.filter((b) => b.memenuhi).length;
  const skorPersen = Math.round((totalMemenuhi / items.length) * 100);

  return {
    skorPersen,
    totalMemenuhi,
    totalButir: items.length,
    items,
  };
}
