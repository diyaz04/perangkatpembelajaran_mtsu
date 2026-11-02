import { describe, it, expect } from "vitest";

describe("Alokasi JP per Elemen ATP (Target Tahun dibagi Jumlah Elemen)", () => {
  it("membagi rata alokasi JP per elemen jika habis dibagi", () => {
    const targetJpTahun = 72; // misal 36 minggu x 2 JP
    const jumlahElemen = 4;
    const baseJp = Math.floor(targetJpTahun / jumlahElemen);
    const remainder = targetJpTahun % jumlahElemen;

    const jpPerElemen = Array.from({ length: jumlahElemen }, (_, i) => baseJp + (i < remainder ? 1 : 0));

    expect(jpPerElemen).toEqual([18, 18, 18, 18]);
    expect(jpPerElemen.reduce((a, b) => a + b, 0)).toBe(targetJpTahun);
  });

  it("mendistribusikan sisa pembagian ke elemen awal dengan total tepat 100%", () => {
    const targetJpTahun = 70;
    const jumlahElemen = 4;
    const baseJp = Math.floor(targetJpTahun / jumlahElemen);
    const remainder = targetJpTahun % jumlahElemen;

    const jpPerElemen = Array.from({ length: jumlahElemen }, (_, i) => baseJp + (i < remainder ? 1 : 0));

    expect(jpPerElemen).toEqual([18, 18, 17, 17]);
    expect(jpPerElemen.reduce((a, b) => a + b, 0)).toBe(targetJpTahun);
  });

  it("berfungsi untuk mapel dengan 2 elemen (misal IPA / Bahasa)", () => {
    const targetJpTahun = 108; // misal 36 minggu x 3 JP
    const jumlahElemen = 2;
    const baseJp = Math.floor(targetJpTahun / jumlahElemen);
    const remainder = targetJpTahun % jumlahElemen;

    const jpPerElemen = Array.from({ length: jumlahElemen }, (_, i) => baseJp + (i < remainder ? 1 : 0));

    expect(jpPerElemen).toEqual([54, 54]);
    expect(jpPerElemen.reduce((a, b) => a + b, 0)).toBe(targetJpTahun);
  });

  it("berfungsi untuk mapel dengan 3 elemen dan angka ganjil", () => {
    const targetJpTahun = 68;
    const jumlahElemen = 3;
    const baseJp = Math.floor(targetJpTahun / jumlahElemen);
    const remainder = targetJpTahun % jumlahElemen;

    const jpPerElemen = Array.from({ length: jumlahElemen }, (_, i) => baseJp + (i < remainder ? 1 : 0));

    expect(jpPerElemen).toEqual([23, 23, 22]);
    expect(jpPerElemen.reduce((a, b) => a + b, 0)).toBe(68);
  });
});

describe("Generator TP: 1 TP per Bab/Elemen", () => {
  it("menghasilkan tepat 1 TP per Bab dengan alokasi JP penuh dan kode_tp berurutan", () => {
    const tingkatKelas = 7;
    const babList = [
      { id: "acp-1", urutan: 1, materi_pokok: "Bab 1: Hakikat Sains", alokasi_jp: 18 },
      { id: "acp-2", urutan: 2, materi_pokok: "Bab 2: Zat dan Perubahannya", alokasi_jp: 18 },
      { id: "acp-3", urutan: 3, materi_pokok: "Bab 3: Suhu dan Kalor", alokasi_jp: 18 },
      { id: "acp-4", urutan: 4, materi_pokok: "Bab 4: Gerak dan Gaya", alokasi_jp: 18 },
    ];

    const tpInserts = babList.map((acp, i) => ({
      analisis_cp_id: acp.id,
      kode_tp: `${tingkatKelas}.${i + 1}`,
      alokasi_jp: acp.alokasi_jp,
      urutan: i + 1,
    }));

    // Harus 1 TP per Bab (panjang array sama dengan jumlah bab)
    expect(tpInserts).toHaveLength(babList.length);

    // Bab 1 harus menjadi 7.1 (bukan 7.1 dan 7.2)
    expect(tpInserts[0].kode_tp).toBe("7.1");
    expect(tpInserts[0].alokasi_jp).toBe(18);

    // Bab 2 harus menjadi 7.2
    expect(tpInserts[1].kode_tp).toBe("7.2");
    expect(tpInserts[1].alokasi_jp).toBe(18);

    // Total JP TP harus sama dengan total JP semua Bab
    const totalJpBab = babList.reduce((acc, b) => acc + b.alokasi_jp, 0);
    const totalJpTp = tpInserts.reduce((acc, t) => acc + t.alokasi_jp, 0);
    expect(totalJpTp).toBe(totalJpBab);
  });
});
