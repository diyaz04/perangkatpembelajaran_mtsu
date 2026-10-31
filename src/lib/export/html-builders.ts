import type { PreviewData } from "@/app/(app)/atp/[penugasanId]/preview/preview-client";
import type { ProtaDetailData } from "@/app/(app)/prota/actions";
import type { ProsemDetailData } from "@/app/(app)/prosem/actions";
import type { RppDetailData } from "@/app/(app)/modul-ajar/actions";
import { formatTitimangsa } from "@/lib/format-titimangsa";
import { getModelPedagogiSpec, parseLangkahDeskripsi } from "@/lib/rpp-model-pedagogi";

function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderKop(madrasah: any): string {
  return `
    <div style="border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
      <div style="width: 80px; text-align: center;">
        ${
          madrasah.logo_url
            ? `<img src="${escapeHtml(madrasah.logo_url)}" style="max-width: 75px; max-height: 75px; object-fit: contain;" />`
            : `<div style="width: 70px; height: 70px; border-radius: 50%; background: #065f46; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; margin: 0 auto;"><span>IKHLAS</span><span>BERAMAL</span></div>`
        }
      </div>
      <div style="flex: 1; text-align: center; padding: 0 10px;">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #1e293b;">KEMENTERIAN AGAMA REPUBLIK INDONESIA</div>
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #1e293b;">KANTOR KEMENTERIAN AGAMA ${escapeHtml(madrasah.kabupaten || "KABUPATEN")}</div>
        <div style="font-size: 16px; font-weight: 900; text-transform: uppercase; color: #0f172a; margin: 2px 0;">${escapeHtml(madrasah.nama)}</div>
        <div style="font-size: 10px; color: #475569;">NSM: ${escapeHtml(madrasah.nsm || "-")} • NPSN: ${escapeHtml(madrasah.npsn || "-")}</div>
        <div style="font-size: 10px; color: #475569;">${escapeHtml(madrasah.alamat || "-")}, ${escapeHtml(madrasah.kabupaten || "-")}</div>
      </div>
      <div style="width: 80px;"></div>
    </div>
  `;
}

function renderSignatures(madrasah: any, penugasan: any, tanggalPenetapan?: string | null): string {
  const titimangsa = formatTitimangsa(tanggalPenetapan || null);

  return `
    <div style="margin-top: 35px; page-break-inside: avoid; display: flex; justify-content: space-between; font-size: 11px;">
      <div style="width: 45%; text-align: center;">
        <div>Mengetahui,</div>
        <div style="font-weight: bold;">Kepala Madrasah</div>
        <div style="height: 60px;"></div>
        <div style="font-weight: bold; text-decoration: underline;">${escapeHtml(madrasah.kepala_nama || "....................................")}</div>
        <div>NIP. ${escapeHtml(madrasah.kepala_nip || "-")}</div>
      </div>
      <div style="width: 45%; text-align: center;">
        <div>${escapeHtml(titimangsa)}</div>
        <div style="font-weight: bold;">Guru Mata Pelajaran</div>
        <div style="height: 60px;"></div>
        <div style="font-weight: bold; text-decoration: underline;">${escapeHtml(penugasan.guru.nama_lengkap)}</div>
        <div>NIP. ${escapeHtml(penugasan.guru.nip || "-")}</div>
      </div>
    </div>
  `;
}

const BASE_STYLES = `
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #0f172a;
    margin: 0;
    padding: 0;
    font-size: 11px;
    line-height: 1.4;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
  }
  th, td {
    border: 1px solid #334155;
    padding: 6px 8px;
    vertical-align: top;
  }
  th {
    background-color: #f1f5f9;
    font-weight: bold;
    text-align: center;
  }
  .identitas-table td {
    border: none;
    padding: 2px 4px;
    font-size: 11px;
  }
  .section-title {
    font-size: 12px;
    font-weight: bold;
    color: #0f172a;
    background: #e2e8f0;
    padding: 4px 8px;
    margin-top: 15px;
    margin-bottom: 6px;
    border-left: 4px solid #059669;
  }
`;

// =============================================================================
// 1. ATP HTML
// =============================================================================
export function generateAtpHtml(data: PreviewData): string {
  const { madrasah, penugasan, items, summary } = data;

  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="text-align: center;">${item.no}</td>
        <td style="text-align: center; font-weight: bold;">${escapeHtml(item.kode_tp)}</td>
        <td><strong>${escapeHtml(item.elemen)}</strong></td>
        <td>${escapeHtml(item.tujuan_pembelajaran)}</td>
        <td>${escapeHtml(item.materi_pokok)}</td>
        <td style="text-align: center;">${item.alokasi_jp}</td>
        <td style="text-align: center;">${item.semester}</td>
        <td>${escapeHtml(item.panca_cinta.join(", "))}</td>
        <td>${escapeHtml(item.dpl.join(", "))}</td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Alur Tujuan Pembelajaran (ATP)</title>
        <style>
          ${BASE_STYLES}
          @page { size: landscape; margin: 15mm; }
        </style>
      </head>
      <body>
        ${renderKop(madrasah)}

        <div style="text-align: center; margin-bottom: 15px;">
          <h2 style="margin: 0; font-size: 15px; text-transform: uppercase; font-weight: bold;">ALUR TUJUAN PEMBELAJARAN (ATP)</h2>
          <div style="font-size: 12px; font-weight: 600; color: #047857;">KURIKULUM BERBASIS CINTA (KBC)</div>
        </div>

        <table class="identitas-table" style="width: 100%; margin-bottom: 12px;">
          <tr>
            <td style="width: 15%;">Satuan Pendidikan</td>
            <td style="width: 35%;">: <strong>${escapeHtml(madrasah.nama)}</strong></td>
            <td style="width: 15%;">Fase / Kelas</td>
            <td style="width: 35%;">: Fase D / Kelas ${penugasan.tingkat_kelas} (${escapeHtml(penugasan.rombel)})</td>
          </tr>
          <tr>
            <td>Mata Pelajaran</td>
            <td>: <strong>${escapeHtml(penugasan.mapel.nama)} (${escapeHtml(penugasan.mapel.kode)})</strong></td>
            <td>Tahun Pelajaran</td>
            <td>: ${escapeHtml(penugasan.tahun_ajaran.nama)}</td>
          </tr>
          <tr>
            <td>Guru Pengampu</td>
            <td>: ${escapeHtml(penugasan.guru.nama_lengkap)}</td>
            <td>Alokasi Waktu</td>
            <td>: ${summary.grandTotalJp} JP (${summary.totalTp} Tujuan Pembelajaran)</td>
          </tr>
        </table>

        <table>
          <thead>
            <tr>
              <th style="width: 4%;">No</th>
              <th style="width: 8%;">Kode TP</th>
              <th style="width: 12%;">Elemen CP</th>
              <th style="width: 26%;">Tujuan Pembelajaran (TP)</th>
              <th style="width: 18%;">Lingkup Materi</th>
              <th style="width: 5%;">Alokasi JP</th>
              <th style="width: 5%;">Smt</th>
              <th style="width: 11%;">Panca Cinta</th>
              <th style="width: 11%;">Dimensi Profil</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr style="background: #f8fafc; font-weight: bold;">
              <td colspan="5" style="text-align: right;">Total Alokasi Waktu:</td>
              <td style="text-align: center;">${summary.grandTotalJp} JP</td>
              <td colspan="3"></td>
            </tr>
          </tfoot>
        </table>

        ${renderSignatures(madrasah, penugasan, penugasan.tahun_ajaran.tanggal_penetapan_dokumen)}
      </body>
    </html>
  `;
}

// =============================================================================
// 2. PROTA HTML
// =============================================================================
export function generateProtaHtml(data: ProtaDetailData): string {
  const { madrasah, penugasan, prota, items } = data;
  const totalJp = prota?.total_jp ?? items.reduce((sum, it) => sum + (it.alokasi_jp || 0), 0);

  const smt1Items = items.filter((it) => it.semester === 1);
  const smt2Items = items.filter((it) => it.semester === 2);

  const renderSectionRows = (list: typeof items, sem: number) => {
    let rows = `
      <tr style="background: #e2e8f0; font-weight: bold;">
        <td colspan="5" style="text-align: left; padding: 6px 8px;">SEMESTER ${sem} (${sem === 1 ? "GANJIL" : "GENAP"})</td>
      </tr>
    `;
    list.forEach((item, idx) => {
      rows += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: center; font-weight: bold;">${escapeHtml(item.kode_tp || "-")}</td>
          <td><strong>${escapeHtml(item.materi_pokok)}</strong></td>
          <td>${escapeHtml(item.tujuan_pembelajaran_teks || "-")}</td>
          <td style="text-align: center; font-weight: bold;">${item.alokasi_jp} JP</td>
        </tr>
      `;
    });
    const subTotal = list.reduce((a, b) => a + Number(b.alokasi_jp || 0), 0);
    rows += `
      <tr style="background: #f1f5f9; font-weight: bold;">
        <td colspan="4" style="text-align: right;">Jumlah Jam Semester ${sem}:</td>
        <td style="text-align: center;">${subTotal} JP</td>
      </tr>
    `;
    return rows;
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Program Tahunan (PROTA)</title>
        <style>
          ${BASE_STYLES}
          @page { size: portrait; margin: 15mm; }
        </style>
      </head>
      <body>
        ${renderKop(madrasah)}

        <div style="text-align: center; margin-bottom: 15px;">
          <h2 style="margin: 0; font-size: 15px; text-transform: uppercase; font-weight: bold;">PROGRAM TAHUNAN (PROTA)</h2>
          <div style="font-size: 12px; font-weight: 600; color: #047857;">KURIKULUM BERBASIS CINTA (KBC)</div>
        </div>

        <table class="identitas-table" style="width: 100%; margin-bottom: 12px;">
          <tr>
            <td style="width: 20%;">Satuan Pendidikan</td>
            <td style="width: 40%;">: <strong>${escapeHtml(madrasah.nama)}</strong></td>
            <td style="width: 15%;">Kelas</td>
            <td style="width: 25%;">: Kelas ${penugasan.tingkat_kelas} (${escapeHtml(penugasan.rombel)})</td>
          </tr>
          <tr>
            <td>Mata Pelajaran</td>
            <td>: <strong>${escapeHtml(penugasan.mapel.nama)}</strong></td>
            <td>Tahun Pelajaran</td>
            <td>: ${escapeHtml(penugasan.tahun_ajaran.nama)}</td>
          </tr>
          <tr>
            <td>Guru Pengampu</td>
            <td>: ${escapeHtml(penugasan.guru.nama_lengkap)}</td>
            <td>Total JP Tahun</td>
            <td>: <strong>${totalJp} JP</strong></td>
          </tr>
        </table>

        <table>
          <thead>
            <tr>
              <th style="width: 5%;">No</th>
              <th style="width: 10%;">No TP</th>
              <th style="width: 25%;">Materi Pokok</th>
              <th style="width: 45%;">Tujuan Pembelajaran</th>
              <th style="width: 15%;">Alokasi JP</th>
            </tr>
          </thead>
          <tbody>
            ${renderSectionRows(smt1Items, 1)}
            ${renderSectionRows(smt2Items, 2)}
            <tr style="background: #cbd5e1; font-weight: bold; font-size: 12px;">
              <td colspan="4" style="text-align: right;">TOTAL ALOKASI WAKTU 1 TAHUN:</td>
              <td style="text-align: center;">${totalJp} JP</td>
            </tr>
          </tbody>
        </table>

        ${renderSignatures(madrasah, penugasan, penugasan.tahun_ajaran.tanggal_penetapan_dokumen)}
      </body>
    </html>
  `;
}

// =============================================================================
// 3. PROSEM HTML
// =============================================================================
export function generateProsemHtml(data: ProsemDetailData, semester: 1 | 2): string {
  const {
    madrasah,
    penugasan,
    prosem,
    kolomMinggu,
    items,
    jpEfektifSemester,
    mingguEfektifSemester,
  } = data;

  const totalJp = prosem?.total_jp ?? items.reduce((sum, it) => sum + (it.alokasi_jp || 0), 0);

  // Kelompokkan kolomMinggu per bulan untuk header dua tingkat
  const bulanGroups: Array<{ namaBulan: string; count: number; mingguList: typeof kolomMinggu }> = [];
  kolomMinggu.forEach((col) => {
    const bNama = col.bulan || "Bulan";
    const existing = bulanGroups.find((g) => g.namaBulan === bNama);
    if (existing) {
      existing.count += 1;
      existing.mingguList.push(col);
    } else {
      bulanGroups.push({ namaBulan: bNama, count: 1, mingguList: [col] });
    }
  });

  // Generate subheader bulan & minggu
  let headerBulan = "";
  let headerMinggu = "";

  bulanGroups.forEach((bg) => {
    headerBulan += `<th colspan="${bg.count}" style="text-align: center; background: #cbd5e1; font-weight: bold;">${escapeHtml(bg.namaBulan.toUpperCase())}</th>`;
  });

  kolomMinggu.forEach((col) => {
    headerMinggu += `<th style="width: 22px; font-size: 9px; text-align: center; ${col.efektif ? "background: #f1f5f9;" : "background: #e2e8f0; color: #94a3b8;"}">${col.mingguKe}</th>`;
  });

  const rows = items
    .map((item, idx) => {
      let distribusiCells = "";
      kolomMinggu.forEach((col) => {
        const isNonEfektif = !col.efektif;
        const jpVal = item.distribusi_minggu?.[col.key] || 0;
        distribusiCells += `
          <td style="text-align: center; font-size: 9px; font-weight: bold; ${
            isNonEfektif ? "background: #f1f5f9; color: #94a3b8;" : jpVal > 0 ? "background: #ecfdf5; color: #065f46;" : ""
          }">
            ${isNonEfektif ? "×" : jpVal > 0 ? jpVal : ""}
          </td>
        `;
      });

      return `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="text-align: center; font-weight: bold; color: #047857;">${escapeHtml(item.kode_tp || "-")}</td>
          <td>
            <strong>${escapeHtml(item.materi_pokok)}</strong>
            ${item.tujuan_pembelajaran_teks ? `<div style="font-size: 9.5px; color: #475569; margin-top: 2px;">${escapeHtml(item.tujuan_pembelajaran_teks)}</div>` : ""}
          </td>
          <td style="text-align: center; font-weight: bold;">${item.alokasi_jp}</td>
          ${distribusiCells}
        </tr>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Program Semester (PROSEM)</title>
        <style>
          ${BASE_STYLES}
          @page { size: landscape; margin: 12mm; }
        </style>
      </head>
      <body>
        ${renderKop(madrasah)}

        <div style="text-align: center; margin-bottom: 15px;">
          <h2 style="margin: 0; font-size: 15px; text-transform: uppercase; font-weight: bold;">PROGRAM SEMESTER (PROSEM)</h2>
          <div style="font-size: 12px; font-weight: 600; color: #047857;">SEMESTER ${semester} (${semester === 1 ? "GANJIL" : "GENAP"}) - TAHUN AJARAN ${escapeHtml(penugasan.tahun_ajaran.nama)}</div>
        </div>

        <table class="identitas-table" style="width: 100%; margin-bottom: 12px;">
          <tr>
            <td style="width: 15%;">Satuan Pendidikan</td>
            <td style="width: 35%;">: <strong>${escapeHtml(madrasah.nama)}</strong></td>
            <td style="width: 15%;">Kelas / Smt</td>
            <td style="width: 35%;">: Kelas ${penugasan.tingkat_kelas} (${escapeHtml(penugasan.rombel)}) / Semester ${semester}</td>
          </tr>
          <tr>
            <td>Mata Pelajaran</td>
            <td>: <strong>${escapeHtml(penugasan.mapel.nama)}</strong></td>
            <td>Total JP Semester</td>
            <td>: <strong>${totalJp} JP</strong></td>
          </tr>
        </table>

        <table>
          <thead>
            <tr>
              <th rowspan="2" style="width: 4%;">No</th>
              <th rowspan="2" style="width: 8%;">Kode TP</th>
              <th rowspan="2" style="width: 30%;">Materi Pokok / Tujuan Pembelajaran</th>
              <th rowspan="2" style="width: 6%;">JP</th>
              ${headerBulan}
            </tr>
            <tr>
              ${headerMinggu}
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        ${renderSignatures(madrasah, penugasan, penugasan.tahun_ajaran.tanggal_penetapan_dokumen)}
      </body>
    </html>
  `;
}

// =============================================================================
// 4. RPP / MODUL AJAR HTML
// =============================================================================
export function generateRppHtml(data: RppDetailData): string {
  const { rpp, langkahList, penugasan, madrasah, master } = data;
  const modelTerpilih = master.models.find((m) => m.id === rpp.model_id) || master.models[0];
  const dplSelected = master.dpl
    .filter((d) => (rpp.dimensi_profil_lulusan_ids || []).includes(d.id))
    .map((d) => `${d.kode}: ${d.nama}`);
  const pcSelected = master.pancaCinta
    .filter((pc) => (rpp.panca_cinta_ids || []).includes(pc.id))
    .map((pc) => `${pc.kode}: ${pc.nama}`);

  // Render langkah pembelajaran per pertemuan
  const pertemuanMap = new Map<number, typeof langkahList>();
  langkahList.forEach((l) => {
    const list = pertemuanMap.get(l.pertemuan_ke) || [];
    list.push(l);
    pertemuanMap.set(l.pertemuan_ke, list);
  });

  let langkahHtml = "";
  Array.from(pertemuanMap.keys())
    .sort((a, b) => a - b)
    .forEach((pert) => {
      const steps = pertemuanMap.get(pert) || [];
      const awal = steps.filter((s) => s.tahap === "awal");
      const inti = steps.filter((s) => s.tahap === "inti");
      const penutup = steps.filter((s) => s.tahap === "penutup");

      langkahHtml += `
        <div style="margin-top: 15px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; background: #fafafa;">
          <div style="font-weight: bold; font-size: 12px; color: #047857; margin-bottom: 8px;">PERTEMUAN KE-${pert}</div>

          <div style="margin-bottom: 8px;">
            <strong style="color: #1e293b;">A. Kegiatan Pendahuluan</strong>
            <ul style="margin: 4px 0 8px 20px; padding: 0;">
              ${awal.map((s) => `<li>${escapeHtml(s.deskripsi_kegiatan)} (${s.durasi_menit} menit)</li>`).join("")}
            </ul>
          </div>

          <div style="margin-bottom: 8px;">
            <strong style="color: #1e293b;">B. Kegiatan Inti (${escapeHtml(modelTerpilih?.nama || "Sintaks Model")})</strong>
            <ul style="margin: 4px 0 8px 20px; padding: 0;">
              ${inti.map((s) => `<li><strong>[${escapeHtml(s.pengalaman || "Inti")}]</strong> ${escapeHtml(s.deskripsi_kegiatan)} (${s.durasi_menit} menit)</li>`).join("")}
            </ul>
          </div>

          <div>
            <strong style="color: #1e293b;">C. Kegiatan Penutup</strong>
            <ul style="margin: 4px 0 8px 20px; padding: 0;">
              ${penutup.map((s) => `<li>${escapeHtml(s.deskripsi_kegiatan)} (${s.durasi_menit} menit)</li>`).join("")}
            </ul>
          </div>
        </div>
      `;
    });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Modul Ajar - ${escapeHtml(rpp.materi_pokok)}</title>
        <style>
          ${BASE_STYLES}
          @page { size: portrait; margin: 15mm; }
        </style>
      </head>
      <body>
        ${renderKop(madrasah)}

        <div style="text-align: center; margin-bottom: 15px;">
          <h2 style="margin: 0; font-size: 15px; text-transform: uppercase; font-weight: bold;">MODUL AJAR / RENCANA PELAKSANAAN PEMBELAJARAN (RPP)</h2>
          <div style="font-size: 12px; font-weight: 600; color: #047857;">PEMBELAJARAN MENDALAM TERINTEGRASI KURIKULUM BERBASIS CINTA (KBC)</div>
        </div>

        <table class="identitas-table" style="width: 100%; margin-bottom: 12px;">
          <tr>
            <td style="width: 22%;">Satuan Pendidikan</td>
            <td style="width: 40%;">: <strong>${escapeHtml(madrasah.nama)}</strong></td>
            <td style="width: 15%;">Kelas / Smt</td>
            <td style="width: 23%;">: Kelas ${penugasan.tingkat_kelas} (${escapeHtml(penugasan.rombel)})</td>
          </tr>
          <tr>
            <td>Mata Pelajaran</td>
            <td>: <strong>${escapeHtml(penugasan.mapel.nama)}</strong></td>
            <td>Alokasi Waktu</td>
            <td>: ${rpp.alokasi_jp} JP (${rpp.jumlah_pertemuan} Pertemuan)</td>
          </tr>
          <tr>
            <td>Materi Pokok</td>
            <td>: <strong>${escapeHtml(rpp.materi_pokok)}</strong></td>
            <td>Tahun Pelajaran</td>
            <td>: ${escapeHtml(penugasan.tahun_ajaran.nama)}</td>
          </tr>
          <tr>
            <td>Model Pembelajaran</td>
            <td colspan="3">: ${escapeHtml(modelTerpilih?.nama || "Pembelajaran Mendalam")}</td>
          </tr>
        </table>

        <!-- I. INFORMASI UMUM -->
        <div class="section-title">I. INFORMASI UMUM</div>
        <table class="identitas-table" style="width: 100%;">
          <tr>
            <td style="width: 25%; font-weight: bold;">A. Dimensi Profil Lulusan</td>
            <td>: ${escapeHtml(dplSelected.join("; ") || "-")}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">B. Nilai Panca Cinta (KBC)</td>
            <td>: ${escapeHtml(pcSelected.join("; ") || "-")}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">C. Kesiapan Belajar Murid</td>
            <td>: ${escapeHtml(rpp.kesiapan_murid ? JSON.stringify(rpp.kesiapan_murid) : "Terdiferensiasi berdasarkan kesiapan belajar awal.")}</td>
          </tr>
          <tr>
            <td style="font-weight: bold;">D. Sarana & Prasarana</td>
            <td>: ${escapeHtml(rpp.lingkungan_belajar_fisik || "Ruang kelas, buku teks, alat peraga/media.")}</td>
          </tr>
        </table>

        <!-- II. KOMPONEN INTI -->
        <div class="section-title">II. KOMPONEN INTI</div>
        <div style="margin-bottom: 8px;">
          <strong>A. Tujuan Pembelajaran (TP)</strong>
          <div style="white-space: pre-wrap; margin-left: 12px; margin-top: 4px;">${escapeHtml(rpp.tujuan_pembelajaran_teks || "-")}</div>
        </div>
        <div style="margin-bottom: 8px;">
          <strong>B. Karakteristik & Benang Merah KBC</strong>
          <div style="margin-left: 12px; margin-top: 4px;">${escapeHtml(rpp.benang_merah_kbc || rpp.karakteristik_materi || "-")}</div>
        </div>

        <div style="margin-bottom: 8px;">
          <strong>C. Langkah-Langkah Pembelajaran</strong>
          ${langkahHtml}
        </div>

        <div style="margin-bottom: 8px;">
          <strong>D. Asesmen Pembelajaran</strong>
          <div style="margin-left: 12px; margin-top: 4px;">
            1. Asesmen Awal: Diagnostik non-kognitif & kognitif singkat.<br />
            2. Asesmen Formatif: Observasi diskusi, unjuk kerja, dan refleksi berkala.<br />
            3. Asesmen Sumatif: Tes tertulis / penugasan produk akhir materi.
          </div>
        </div>

        ${renderSignatures(madrasah, penugasan, penugasan.tahun_ajaran.tanggal_penetapan_dokumen)}
      </body>
    </html>
  `;
}
