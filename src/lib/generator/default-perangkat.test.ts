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
