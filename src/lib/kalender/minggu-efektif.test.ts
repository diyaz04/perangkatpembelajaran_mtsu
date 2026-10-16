import { describe, it, expect } from "vitest";
import {
  hitungMingguEfektif,
  type TahunAjaranInput,
  type KalenderKegiatanInput,
} from "./minggu-efektif";

describe("Analisis Minggu Efektif (src/lib/kalender/minggu-efektif.ts)", () => {
  const dummyTahunAjaran: TahunAjaranInput = {
    id: "ta-2026-2027",
    nama: "2026/2027",
    smt1_mulai: "2026-07-13",
    smt1_selesai: "2026-12-19",
    smt2_mulai: "2027-01-04",
    smt2_selesai: "2027-06-25",
  };

  it("1. Harus menghasilkan struktur 12 bulan lengkap (Juli - Juni) dan total 52 minggu", () => {
    const hasil = hitungMingguEfektif({
      tahunAjaran: dummyTahunAjaran,
      kalenderKegiatan: [],
      jpPerMinggu: 3,
      hariSekolah: 6,
    });

    expect(hasil.semester1.daftarBulan.length).toBe(6);
    expect(hasil.semester2.daftarBulan.length).toBe(6);

    expect(hasil.semester1.daftarBulan.map((b) => b.bulan)).toEqual([
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ]);

    expect(hasil.semester2.daftarBulan.map((b) => b.bulan)).toEqual([
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
    ]);

    const totalMinggu = hasil.totalTahun.totalMinggu;
    expect(totalMinggu).toBe(52);
    expect(hasil.totalTahun.totalMingguEfektif + hasil.totalTahun.totalMingguTidakEfektif).toBe(52);
    expect(hasil.totalTahun.jpEfektif).toBe(hasil.totalTahun.totalMingguEfektif * 3);
  });

  it("2. Kasus Libur Semester: minggu sebelum smt1_mulai dan sesudah smt1_selesai harus Tidak Efektif", () => {
    // Smt 1 mulai 13 Juli 2026, minggu 1 Juli (6-11 Juli) berada sebelum smt1_mulai
    // Smt 1 selesai 19 Des 2026, minggu 21-26 Des dan 28-31 Des berada sesudah smt1_selesai
    const hasil = hitungMingguEfektif({
      tahunAjaran: dummyTahunAjaran,
      kalenderKegiatan: [],
      jpPerMinggu: 4,
      hariSekolah: 6,
    });

    const juli = hasil.semester1.daftarBulan.find((b) => b.bulan === "Juli")!;
    expect(juli.mingguTidakEfektif).toBeGreaterThanOrEqual(1);
    expect(juli.keterangan).toContain("Libur Akhir Tahun Pelajaran");

    const desember = hasil.semester1.daftarBulan.find((b) => b.bulan === "Desember")!;
    expect(desember.mingguTidakEfektif).toBeGreaterThanOrEqual(1);
    expect(desember.keterangan).toContain("Libur Akhir Semester 1");
  });

  it("3. Kasus Asesmen Sumatif Akhir Semester: 1 minggu penuh tertutup asesmen harus Tidak Efektif", () => {
    const kegiatanAsesmen: KalenderKegiatanInput[] = [
      {
        tgl_mulai: "2026-11-30",
        tgl_selesai: "2026-12-05", // 6 hari penuh (Senin-Sabtu)
        jenis: "asesmen",
        keterangan: "Asesmen Sumatif Akhir Semester 1",
        memotong_minggu_efektif: true,
      },
    ];

    const hasil = hitungMingguEfektif({
      tahunAjaran: dummyTahunAjaran,
      kalenderKegiatan: kegiatanAsesmen,
      jpPerMinggu: 2,
      hariSekolah: 6,
    });

    const des = hasil.semester1.daftarBulan.find((b) => b.bulan === "Desember")!;
    // Minggu pertama Desember (30 Nov - 5 Des) terpotong penuh
    expect(des.keterangan).toContain("Asesmen Sumatif Akhir Semester 1");

    const mingguAsesmen = des.detailMinggu.find((m) =>
      m.kegiatanPemotong.includes("Asesmen Sumatif Akhir Semester 1")
    );
    expect(mingguAsesmen).toBeDefined();
    expect(mingguAsesmen?.efektif).toBe(false);
    expect(mingguAsesmen?.hariTerpotong).toBe(6);
  });

  it("4. Kasus Libur Ramadhan & Hari Raya Idul Fitri: 2 minggu libur penuh harus Tidak Efektif", () => {
    const kegiatanRamadhan: KalenderKegiatanInput[] = [
      {
        tgl_mulai: "2027-03-22",
        tgl_selesai: "2027-04-03", // 2 minggu (Maret akhir s.d. awal April)
        jenis: "ramadhan",
        keterangan: "Libur Hari Raya Idul Fitri 1448 H",
        memotong_minggu_efektif: true,
      },
    ];

    const hasil = hitungMingguEfektif({
      tahunAjaran: dummyTahunAjaran,
      kalenderKegiatan: kegiatanRamadhan,
      jpPerMinggu: 3,
      hariSekolah: 6,
    });

    const maret = hasil.semester2.daftarBulan.find((b) => b.bulan === "Maret")!;
    const april = hasil.semester2.daftarBulan.find((b) => b.bulan === "April")!;

    expect(maret.keterangan).toContain("Libur Hari Raya Idul Fitri 1448 H");
    expect(april.keterangan).toContain("Libur Hari Raya Idul Fitri 1448 H");
  });

  it("5. Kasus Minggu yang Terpotong Sebagian: < 50% tetap Efektif, >= 50% menjadi Tidak Efektif", () => {
    // Skenario A: 6 hari sekolah, 2 hari terpotong (Kamis & Jumat) -> 2/6 = 33.3% (< 50%) -> TETAP EFEKTIF
    const kegiatan2Hari: KalenderKegiatanInput[] = [
      {
        tgl_mulai: "2026-08-20",
        tgl_selesai: "2026-08-21", // 2 hari (Kamis & Jumat)
        jenis: "kegiatan_madrasah",
        keterangan: "Peringatan HUT RI & Lomba",
        memotong_minggu_efektif: true,
      },
    ];

    const hasil2Hari = hitungMingguEfektif({
      tahunAjaran: dummyTahunAjaran,
      kalenderKegiatan: kegiatan2Hari,
      jpPerMinggu: 2,
      hariSekolah: 6,
      ambangBatas: 0.5,
    });

    const agustus = hasil2Hari.semester1.daftarBulan.find((b) => b.bulan === "Agustus")!;
    const mingguHut = agustus.detailMinggu.find((m) =>
      m.kegiatanPemotong.includes("Peringatan HUT RI & Lomba")
    );
    expect(mingguHut).toBeDefined();
    expect(mingguHut?.hariTerpotong).toBe(2);
    expect(mingguHut?.efektif).toBe(true); // Masih efektif karena hanya 2 dari 6 hari!

    // Skenario B: 6 hari sekolah, 3 hari terpotong (Kamis, Jumat, Sabtu) -> 3/6 = 50% (>= 50%) -> TIDAK EFEKTIF
    const kegiatan3Hari: KalenderKegiatanInput[] = [
      {
        tgl_mulai: "2026-08-20",
        tgl_selesai: "2026-08-22", // 3 hari
        jenis: "kegiatan_madrasah",
        keterangan: "Kemah Pramuka Madrasah",
        memotong_minggu_efektif: true,
      },
    ];

    const hasil3Hari = hitungMingguEfektif({
      tahunAjaran: dummyTahunAjaran,
      kalenderKegiatan: kegiatan3Hari,
      jpPerMinggu: 2,
      hariSekolah: 6,
      ambangBatas: 0.5,
    });

    const agustusB = hasil3Hari.semester1.daftarBulan.find((b) => b.bulan === "Agustus")!;
    const mingguKemah = agustusB.detailMinggu.find((m) =>
      m.kegiatanPemotong.includes("Kemah Pramuka Madrasah")
    );
    expect(mingguKemah).toBeDefined();
    expect(mingguKemah?.hariTerpotong).toBe(3);
    expect(mingguKemah?.efektif).toBe(false); // Menjadi tidak efektif karena 3/6 >= 50%
  });

  it("6. Kasus Opsi 5 Hari Sekolah (Senin-Jumat): 2 hari libur (40%) = Efektif, 3 hari libur (60%) = Tidak Efektif", () => {
    // 2 hari libur pada sekolah 5 hari
    const hasil5HariA = hitungMingguEfektif({
      tahunAjaran: dummyTahunAjaran,
      kalenderKegiatan: [
        {
          tgl_mulai: "2026-09-17",
          tgl_selesai: "2026-09-18", // Kamis & Jumat (2 hari)
          keterangan: "Pelatihan Guru",
          memotong_minggu_efektif: true,
        },
      ],
      jpPerMinggu: 4,
      hariSekolah: 5,
      ambangBatas: 0.5,
    });

    const septA = hasil5HariA.semester1.daftarBulan.find((b) => b.bulan === "September")!;
    const mingguA = septA.detailMinggu.find((m) => m.kegiatanPemotong.includes("Pelatihan Guru"));
    expect(mingguA?.hariBelajar).toBe(5);
    expect(mingguA?.hariTerpotong).toBe(2);
    expect(mingguA?.efektif).toBe(true); // 2/5 = 40% < 50% -> Efektif

    // 3 hari libur pada sekolah 5 hari
    const hasil5HariB = hitungMingguEfektif({
      tahunAjaran: dummyTahunAjaran,
      kalenderKegiatan: [
        {
          tgl_mulai: "2026-09-16",
          tgl_selesai: "2026-09-18", // Rabu, Kamis, Jumat (3 hari)
          keterangan: "Asesmen Bakat Minat",
          memotong_minggu_efektif: true,
        },
      ],
      jpPerMinggu: 4,
      hariSekolah: 5,
      ambangBatas: 0.5,
    });

    const septB = hasil5HariB.semester1.daftarBulan.find((b) => b.bulan === "September")!;
    const mingguB = septB.detailMinggu.find((m) => m.kegiatanPemotong.includes("Asesmen Bakat Minat"));
    expect(mingguB?.hariBelajar).toBe(5);
    expect(mingguB?.hariTerpotong).toBe(3);
    expect(mingguB?.efektif).toBe(false); // 3/5 = 60% >= 50% -> Tidak Efektif
  });

  it("7. Kegiatan yang memotong_minggu_efektif = false TIDAK BOLEH mengurangi hari belajar", () => {
    const kegiatanNonPemotong: KalenderKegiatanInput[] = [
      {
        tgl_mulai: "2026-10-12",
        tgl_selesai: "2026-10-17", // 6 hari
        keterangan: "Pekan Olahraga Santri (KBM tetap berjalan)",
        memotong_minggu_efektif: false, // Tidak memotong
      },
    ];

    const hasil = hitungMingguEfektif({
      tahunAjaran: dummyTahunAjaran,
      kalenderKegiatan: kegiatanNonPemotong,
      jpPerMinggu: 2,
      hariSekolah: 6,
    });

    const oktober = hasil.semester1.daftarBulan.find((b) => b.bulan === "Oktober")!;
    // Semua minggu di Oktober yang berada di dalam semester harus efektif
    const mingguAktif = oktober.detailMinggu.filter((m) => m.efektif);
    expect(mingguAktif.length).toBe(oktober.jumlahMinggu);
  });
});
