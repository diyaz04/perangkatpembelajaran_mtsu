/**
 * Perhitungan Analisis Minggu Efektif (KMA 1503/2025 & Panduan Kurikulum Madrasah)
 *
 * Fungsi murni (pure function) untuk menghitung:
 * 1. Jumlah minggu kalender per bulan (Juli–Juni)
 * 2. Jumlah minggu efektif dan tidak efektif (ambang batas >= 50% hari belajar terpotong)
 * 3. Keterangan kegiatan pemotong per bulan
 * 4. Subtotal per semester dan grand total tahunan
 * 5. Total JP Efektif berdasarkan jp_per_minggu penugasan
 */

export interface KalenderKegiatanInput {
  id?: string;
  tgl_mulai: string; // YYYY-MM-DD
  tgl_selesai: string; // YYYY-MM-DD
  jenis?: string;
  keterangan: string;
  memotong_minggu_efektif?: boolean;
}

export interface TahunAjaranInput {
  id?: string;
  nama?: string;
  smt1_mulai: string; // YYYY-MM-DD
  smt1_selesai: string; // YYYY-MM-DD
  smt2_mulai: string; // YYYY-MM-DD
  smt2_selesai: string; // YYYY-MM-DD
}

export interface MingguDetail {
  mingguKe: number; // Urutan minggu ke-N di bulan tersebut
  rentangTanggal: string; // contoh "13 - 18 Juli 2026"
  tglMulai: string; // YYYY-MM-DD (Senin)
  tglSelesai: string; // YYYY-MM-DD (Sabtu atau Jumat)
  efektif: boolean;
  hariBelajar: number; // 5 atau 6
  hariTerpotong: number;
  kegiatanPemotong: string[];
}

export interface BulanMingguEfektif {
  bulan: string; // "Juli", "Agustus", ...
  bulanIndex: number; // 7, 8, ... 12, 1, ... 6
  tahun: number; // misal 2026, 2027
  semester: 1 | 2;
  jumlahMinggu: number;
  mingguEfektif: number;
  mingguTidakEfektif: number;
  keterangan: string; // Gabungan unik nama kegiatan pemotong
  detailMinggu: MingguDetail[];
}

export interface SemesterMingguEfektif {
  semester: 1 | 2;
  daftarBulan: BulanMingguEfektif[];
  totalMinggu: number;
  totalMingguEfektif: number;
  totalMingguTidakEfektif: number;
  jpEfektif: number;
}

export interface HasilAnalisisMingguEfektif {
  tahunAjaranId?: string;
  tahunAjaranNama?: string;
  hariSekolahPerMinggu: 5 | 6;
  ambangBatasTidakEfektif: number; // misal 0.5 (50%)
  jpPerMinggu: number;
  semester1: SemesterMingguEfektif;
  semester2: SemesterMingguEfektif;
  totalTahun: {
    totalMinggu: number;
    totalMingguEfektif: number;
    totalMingguTidakEfektif: number;
    jpEfektif: number;
  };
}

export interface HitungMingguEfektifOptions {
  tahunAjaran: TahunAjaranInput;
  kalenderKegiatan: KalenderKegiatanInput[];
  jpPerMinggu?: number;
  hariSekolah?: 5 | 6;
  ambangBatas?: number; // default 0.5 (50%)
}

const NAMA_BULAN = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/**
 * Helper untuk manipulasi tanggal berbasis string UTC murni
 * agar bebas dari perbedaan timezone runtime.
 */
function parseDateUtc(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDateIso(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysUtc(d: Date, days: number): Date {
  const copy = new Date(d.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

/**
 * Menemukan hari Senin dari minggu kalender yang memuat tanggal tertentu
 */
function getMondayOfDate(d: Date): Date {
  const day = d.getUTCDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  const diff = day === 0 ? -6 : 1 - day;
  return addDaysUtc(d, diff);
}

/**
 * Fungsi Utama: Menghitung Analisis Minggu Efektif
 */
export function hitungMingguEfektif(
  options: HitungMingguEfektifOptions
): HasilAnalisisMingguEfektif {
  const {
    tahunAjaran,
    kalenderKegiatan,
    jpPerMinggu = 0,
    hariSekolah = 6,
    ambangBatas = 0.5,
  } = options;

  // Filter kegiatan yang memotong minggu efektif
  const kegiatanPemotong = kalenderKegiatan.filter(
    (k) => k.memotong_minggu_efektif !== false
  );

  // Ambil tahun mulai dan selesai dari tanggal semester
  const smt1MulaiDate = parseDateUtc(tahunAjaran.smt1_mulai);
  const smt2SelesaiDate = parseDateUtc(tahunAjaran.smt2_selesai);

  const tahunMulai = smt1MulaiDate.getUTCFullYear();
  const tahunSelesai = smt2SelesaiDate.getUTCFullYear();

  // Definisikan 12 bulan dalam tahun pelajaran madrasah:
  // Semester 1: Juli - Desember (tahunMulai)
  // Semester 2: Januari - Juni (tahunSelesai)
  const konfigurasiBulan: Array<{
    bulanIndex: number;
    tahun: number;
    semester: 1 | 2;
  }> = [
    { bulanIndex: 7, tahun: tahunMulai, semester: 1 },
    { bulanIndex: 8, tahun: tahunMulai, semester: 1 },
    { bulanIndex: 9, tahun: tahunMulai, semester: 1 },
    { bulanIndex: 10, tahun: tahunMulai, semester: 1 },
    { bulanIndex: 11, tahun: tahunMulai, semester: 1 },
    { bulanIndex: 12, tahun: tahunMulai, semester: 1 },
    { bulanIndex: 1, tahun: tahunSelesai, semester: 2 },
    { bulanIndex: 2, tahun: tahunSelesai, semester: 2 },
    { bulanIndex: 3, tahun: tahunSelesai, semester: 2 },
    { bulanIndex: 4, tahun: tahunSelesai, semester: 2 },
    { bulanIndex: 5, tahun: tahunSelesai, semester: 2 },
    { bulanIndex: 6, tahun: tahunSelesai, semester: 2 },
  ];

  // Kita iterasi semua minggu kalender dari awal Juli s.d. akhir Juni.
  // Mulai dari Senin pertama yang Kamis-nya berada di bulan Juli
  const awalJuli = new Date(Date.UTC(tahunMulai, 6, 1));
  let curMonday = getMondayOfDate(awalJuli);

  // Jika Kamis dari curMonday masih di bulan Juni, geser ke Senin berikutnya
  const kamisPertama = addDaysUtc(curMonday, 3);
  if (kamisPertama.getUTCMonth() < 6 && kamisPertama.getUTCFullYear() === tahunMulai) {
    curMonday = addDaysUtc(curMonday, 7);
  }

  // Akhir Juni tahun berikutnya
  const akhirJuni = new Date(Date.UTC(tahunSelesai, 5, 30));

  // Kumpulkan seluruh minggu kalender selama 1 tahun pelajaran (52 minggu)
  interface RawWeek {
    monday: Date;
    thursday: Date;
    ownerMonthIndex: number; // 1 - 12
    ownerYear: number;
  }

  const allWeeks: RawWeek[] = [];
  while (curMonday <= akhirJuni || allWeeks.length < 52) {
    const thursday = addDaysUtc(curMonday, 3);
    const ownerMonthIndex = thursday.getUTCMonth() + 1;
    const ownerYear = thursday.getUTCFullYear();

    // Hentikan jika sudah melewati Juni tahun selesai
    if (ownerYear > tahunSelesai || (ownerYear === tahunSelesai && ownerMonthIndex > 6)) {
      break;
    }

    allWeeks.push({
      monday: curMonday,
      thursday,
      ownerMonthIndex,
      ownerYear,
    });

    curMonday = addDaysUtc(curMonday, 7);
  }

  // Evaluasi setiap minggu
  const hasilBulanList: BulanMingguEfektif[] = konfigurasiBulan.map((cfg) => {
    const namaBulan = NAMA_BULAN[cfg.bulanIndex];
    const weeksInMonth = allWeeks.filter(
      (w) => w.ownerMonthIndex === cfg.bulanIndex && w.ownerYear === cfg.tahun
    );

    let countEfektif = 0;
    let countTidakEfektif = 0;
    const allKegiatanSet = new Set<string>();

    const detailMinggu: MingguDetail[] = weeksInMonth.map((w, idx) => {
      const tglSeninStr = formatDateIso(w.monday);
      // Hari belajar: 6 hari (Senin-Sabtu) atau 5 hari (Senin-Jumat)
      const lastStudyDayOffset = hariSekolah === 6 ? 5 : 4;
      const tglAkhirBelajar = addDaysUtc(w.monday, lastStudyDayOffset);
      const tglAkhirStr = formatDateIso(tglAkhirBelajar);

      let hariTerpotong = 0;
      const pemotongMingguIni = new Set<string>();

      // Periksa setiap hari belajar (Senin sampai Sabtu/Jumat)
      for (let dayOffset = 0; dayOffset <= lastStudyDayOffset; dayOffset++) {
        const currentDate = addDaysUtc(w.monday, dayOffset);
        const dateStr = formatDateIso(currentDate);

        // 1. Cek apakah di luar jadwal aktif semester terkait
        let diLuarSemester = false;
        if (cfg.semester === 1) {
          if (dateStr < tahunAjaran.smt1_mulai) {
            diLuarSemester = true;
            pemotongMingguIni.add("Libur Akhir Tahun Pelajaran");
          } else if (dateStr > tahunAjaran.smt1_selesai) {
            diLuarSemester = true;
            pemotongMingguIni.add("Libur Akhir Semester 1");
          }
        } else {
          if (dateStr < tahunAjaran.smt2_mulai) {
            diLuarSemester = true;
            pemotongMingguIni.add("Libur Semester Ganjil");
          } else if (dateStr > tahunAjaran.smt2_selesai) {
            diLuarSemester = true;
            pemotongMingguIni.add("Libur Akhir Tahun Ajaran");
          }
        }

        if (diLuarSemester) {
          hariTerpotong += 1;
          continue;
        }

        // 2. Cek apakah ada kegiatan kalender yang memotong
        let kenaKegiatan = false;
        for (const keg of kegiatanPemotong) {
          if (dateStr >= keg.tgl_mulai && dateStr <= keg.tgl_selesai) {
            hariTerpotong += 1;
            kenaKegiatan = true;
            pemotongMingguIni.add(keg.keterangan || keg.jenis || "Kegiatan Madrasah");
            break;
          }
        }

        if (kenaKegiatan) {
          // Hari sudah dihitung terpotong
        }
      }

      // Hitung rasio hari terpotong
      const rasioTerpotong = hariTerpotong / hariSekolah;
      const isTidakEfektif = rasioTerpotong >= ambangBatas;

      if (isTidakEfektif) {
        countTidakEfektif += 1;
        pemotongMingguIni.forEach((k) => allKegiatanSet.add(k));
      } else {
        countEfektif += 1;
      }

      const rentangTanggalFormatted = `${w.monday.getUTCDate()} - ${tglAkhirBelajar.getUTCDate()} ${namaBulan} ${cfg.tahun}`;

      return {
        mingguKe: idx + 1,
        rentangTanggal: rentangTanggalFormatted,
        tglMulai: tglSeninStr,
        tglSelesai: tglAkhirStr,
        efektif: !isTidakEfektif,
        hariBelajar: hariSekolah,
        hariTerpotong,
        kegiatanPemotong: Array.from(pemotongMingguIni),
      };
    });

    return {
      bulan: namaBulan,
      bulanIndex: cfg.bulanIndex,
      tahun: cfg.tahun,
      semester: cfg.semester,
      jumlahMinggu: detailMinggu.length,
      mingguEfektif: countEfektif,
      mingguTidakEfektif: countTidakEfektif,
      keterangan: Array.from(allKegiatanSet).join(", "),
      detailMinggu,
    };
  });

  // Agregasi Semester 1
  const smt1Bulan = hasilBulanList.filter((b) => b.semester === 1);
  const smt1TotalMinggu = smt1Bulan.reduce((acc, b) => acc + b.jumlahMinggu, 0);
  const smt1TotalEfektif = smt1Bulan.reduce((acc, b) => acc + b.mingguEfektif, 0);
  const smt1TotalTidakEfektif = smt1Bulan.reduce((acc, b) => acc + b.mingguTidakEfektif, 0);

  const semester1: SemesterMingguEfektif = {
    semester: 1,
    daftarBulan: smt1Bulan,
    totalMinggu: smt1TotalMinggu,
    totalMingguEfektif: smt1TotalEfektif,
    totalMingguTidakEfektif: smt1TotalTidakEfektif,
    jpEfektif: smt1TotalEfektif * jpPerMinggu,
  };

  // Agregasi Semester 2
  const smt2Bulan = hasilBulanList.filter((b) => b.semester === 2);
  const smt2TotalMinggu = smt2Bulan.reduce((acc, b) => acc + b.jumlahMinggu, 0);
  const smt2TotalEfektif = smt2Bulan.reduce((acc, b) => acc + b.mingguEfektif, 0);
  const smt2TotalTidakEfektif = smt2Bulan.reduce((acc, b) => acc + b.mingguTidakEfektif, 0);

  const semester2: SemesterMingguEfektif = {
    semester: 2,
    daftarBulan: smt2Bulan,
    totalMinggu: smt2TotalMinggu,
    totalMingguEfektif: smt2TotalEfektif,
    totalMingguTidakEfektif: smt2TotalTidakEfektif,
    jpEfektif: smt2TotalEfektif * jpPerMinggu,
  };

  const totalMingguTahun = smt1TotalMinggu + smt2TotalMinggu;
  const totalEfektifTahun = smt1TotalEfektif + smt2TotalEfektif;
  const totalTidakEfektifTahun = smt1TotalTidakEfektif + smt2TotalTidakEfektif;

  return {
    tahunAjaranId: tahunAjaran.id,
    tahunAjaranNama: tahunAjaran.nama,
    hariSekolahPerMinggu: hariSekolah,
    ambangBatasTidakEfektif: ambangBatas,
    jpPerMinggu,
    semester1,
    semester2,
    totalTahun: {
      totalMinggu: totalMingguTahun,
      totalMingguEfektif: totalEfektifTahun,
      totalMingguTidakEfektif: totalTidakEfektifTahun,
      jpEfektif: totalEfektifTahun * jpPerMinggu,
    },
  };
}
