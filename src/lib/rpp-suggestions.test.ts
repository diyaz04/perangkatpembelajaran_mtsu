import { describe, it, expect } from "vitest";
import {
  generateDefaultKesiapanMurid,
  generateDefaultKarakteristik,
  generateDefaultLampiran,
} from "./rpp-suggestions";

describe("RPP Suggestions Generator", () => {
  it("generates contextual kesiapan murid based on materi and mapel", () => {
    const res = generateDefaultKesiapanMurid("Hukum Tajwid Al-Qur'an", "Al-Qur'an Hadis");
    expect(res.pengetahuan_awal).toContain("Hukum Tajwid Al-Qur'an");
    expect(res.minat).toContain("Al-Qur'an Hadis");
    expect(res.kebutuhan).toContain("Hukum Tajwid Al-Qur'an");
    expect(res.strategi_asesmen_awal).toBeDefined();
    expect(res.tindak_lanjut).toBeDefined();
  });

  it("generates contextual karakteristik materi and benang merah KBC", () => {
    const res = generateDefaultKarakteristik("Zakat dan Pemberdayaan Umat", "Fikih");
    expect(res.karakteristik_materi).toContain("Zakat dan Pemberdayaan Umat");
    expect(res.benang_merah_kbc).toContain("Panca Cinta");
    expect(res.benang_merah_kbc).toContain("Zakat dan Pemberdayaan Umat");
  });

  it("generates complete and relevant lampiran (LKPD, Bahan Bacaan, Glosarium, Daftar Pustaka)", () => {
    const res = generateDefaultLampiran("Keberagaman Suku dan Budaya", "PPKn", 7);
    expect(res.lkpd).toContain("LEMBAR KERJA PESERTA DIDIK (LKPD)");
    expect(res.lkpd).toContain("Keberagaman Suku dan Budaya");
    expect(res.lkpd).toContain("PPKn");
    expect(res.bahan_bacaan).toContain("BAHAN BACAAN GURU");
    expect(res.bahan_bacaan).toContain("BAHAN BACAAN PESERTA DIDIK");
    expect(res.glosarium).toContain("Keberagaman Suku dan Budaya");
    expect(res.glosarium).toContain("Panca Cinta");
    expect(res.daftar_pustaka).toContain("Buku Teks Siswa PPKn untuk MTs Kelas VII");
    expect(res.daftar_pustaka).toContain("Keputusan Direktur Jenderal Pendidikan Islam Nomor 6077 Tahun 2025");
  });

  it("adapts LKPD format according to selected model pembelajaran", () => {
    const lkpdPjbl = generateDefaultLampiran("Ekosistem Sawah", "IPA", 7, "Project Based Learning (PjBL)").lkpd;
    const lkpdPbl = generateDefaultLampiran("Ekosistem Sawah", "IPA", 7, "Problem Based Learning (PBL)").lkpd;
    const lkpdLokr = generateDefaultLampiran("Ekosistem Sawah", "IPA", 7, "LOK-R (Literasi, Orientasi, Kolaborasi, Refleksi)").lkpd;

    expect(lkpdPjbl).toContain("BERBASIS PROYEK (PjBL)");
    expect(lkpdPjbl).toContain("Essential Question");
    expect(lkpdPbl).toContain("(PBL)");
    expect(lkpdPbl).toContain("Ekosistem Sawah");
    expect(lkpdLokr).toContain("LOK-R");
    expect(lkpdLokr).toContain("LITERASI");
  });
});

import {
  detectModelKode,
  getModelPedagogiSpec,
  generateModelLangkahList,
  parseLangkahDeskripsi,
  isGenericPlaceholderLangkah,
} from "./rpp-model-pedagogi";

describe("RPP Model Pedagogi & Sintaks Pengalaman Pembelajaran", () => {
  const modelsToTest = [
    { nama: "Project Based Learning (PjBL)", expectedKode: "pjbl", expectedSintaksCount: 6 },
    { nama: "Problem Based Learning (PBL)", expectedKode: "pbl", expectedSintaksCount: 5 },
    { nama: "Discovery Learning", expectedKode: "discovery", expectedSintaksCount: 6 },
    { nama: "Inquiry Learning", expectedKode: "inquiry", expectedSintaksCount: 5 },
    { nama: "Cooperative Learning", expectedKode: "cooperative", expectedSintaksCount: 6 },
    { nama: "LOK-R (Literasi, Orientasi, Kolaborasi, Refleksi)", expectedKode: "lokr", expectedSintaksCount: 4 },
  ] as const;

  it.each(modelsToTest)(
    "generates exact syntax structure, zero duration drift, and structured Guru/Murid activities for $nama",
    ({ nama, expectedKode, expectedSintaksCount }) => {
      expect(detectModelKode(nama)).toBe(expectedKode);
      const spec = getModelPedagogiSpec(nama);
      expect(spec.sintaks_list.length).toBe(expectedSintaksCount);
      expect(spec.komponen_khas.length).toBe(3);

      const pancaCintaMaster = [
        { id: "pc-1", nama: "Cinta Allah dan Rasul-Nya" },
        { id: "pc-2", nama: "Cinta Ilmu" },
        { id: "pc-3", nama: "Cinta Lingkungan" },
      ];

      const langkahList = generateModelLangkahList({
        modelNama: nama,
        materiPokok: "Adab Menuntut Ilmu",
        topikPembelajaran: "Adab Menuntut Ilmu di Madrasah",
        mapelNama: "Akidah Akhlak",
        tingkatKelas: 7,
        jumlahPertemuan: 2,
        alokasiJp: 4,
        menitPerJp: 40,
        pancaCintaIds: ["pc-1", "pc-2", "pc-3"],
        pancaCintaMaster,
        modeDistribusi: "utuh_per_pertemuan",
      });

      // Tidak boleh terdeteksi sebagai placeholder generik
      expect(isGenericPlaceholderLangkah(langkahList)).toBe(false);

      // Cek setiap pertemuan
      for (let p = 1; p <= 2; p++) {
        const pSteps = langkahList.filter((l) => l.pertemuan_ke === p);
        // 1 awal + N sintaks inti + 1 penutup
        expect(pSteps.length).toBe(expectedSintaksCount + 2);

        // Total durasi harus persis 80 menit (4 JP / 2 pertemuan * 40 menit)
        const totalDurasi = pSteps.reduce((acc, s) => acc + s.durasi_menit, 0);
        expect(totalDurasi).toBe(80);

        // Harus memiliki keseimbangan 3M (memahami, mengaplikasi, merefleksi)
        expect(pSteps.some((s) => s.pengalaman === "memahami")).toBe(true);
        expect(pSteps.some((s) => s.pengalaman === "mengaplikasi")).toBe(true);
        expect(pSteps.some((s) => s.pengalaman === "merefleksi")).toBe(true);

        // Setiap langkah inti harus memiliki header sintaks, Aktivitas Guru, dan Aktivitas Murid kontekstual
        const intiSteps = pSteps.filter((s) => s.tahap === "inti");
        expect(intiSteps.length).toBe(expectedSintaksCount);
        intiSteps.forEach((step, idx) => {
          const parsed = parseLangkahDeskripsi(step.deskripsi_kegiatan);
          expect(parsed.urutanSintaks).toBe(idx + 1);
          expect(parsed.aktivitasGuru.length).toBeGreaterThan(20);
          expect(parsed.aktivitasMurid.length).toBeGreaterThan(20);
          expect(step.deskripsi_kegiatan).toContain("Adab Menuntut Ilmu");
        });
      }

      // Semua topik Panca Cinta yang dipilih harus terintegrasi dengan aksi_kbc tidak kosong
      const integratedPc = new Set(langkahList.map((l) => l.panca_cinta_id).filter(Boolean));
      expect(integratedPc.has("pc-1")).toBe(true);
      expect(integratedPc.has("pc-2")).toBe(true);
      expect(integratedPc.has("pc-3")).toBe(true);
      langkahList
        .filter((l) => l.panca_cinta_id)
        .forEach((l) => {
          expect(Boolean(l.aksi_kbc && l.aksi_kbc.trim())).toBe(true);
        });
    }
  );

  it("supports berjenjang_lintas_pertemuan distribution mode while preserving 3M and exact duration per meeting", () => {
    const langkahList = generateModelLangkahList({
      modelNama: "Project Based Learning (PjBL)",
      materiPokok: "Energi Terbarukan",
      mapelNama: "IPA",
      tingkatKelas: 8,
      jumlahPertemuan: 2,
      alokasiJp: 4,
      menitPerJp: 40,
      pancaCintaIds: ["pc-1"],
      pancaCintaMaster: [{ id: "pc-1", nama: "Cinta Lingkungan" }],
      modeDistribusi: "berjenjang_lintas_pertemuan",
    });

    for (let p = 1; p <= 2; p++) {
      const pSteps = langkahList.filter((l) => l.pertemuan_ke === p);
      const totalDurasi = pSteps.reduce((acc, s) => acc + s.durasi_menit, 0);
      expect(totalDurasi).toBe(80);
      expect(pSteps.some((s) => s.pengalaman === "memahami")).toBe(true);
      expect(pSteps.some((s) => s.pengalaman === "mengaplikasi")).toBe(true);
      expect(pSteps.some((s) => s.pengalaman === "merefleksi")).toBe(true);
    }
  });
});

