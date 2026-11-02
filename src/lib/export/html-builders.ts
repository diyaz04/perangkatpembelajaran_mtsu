import type { PreviewData } from "@/app/(app)/atp/[penugasanId]/preview/preview-client";
import type { ProtaDetailData } from "@/app/(app)/prota/actions";
import type { ProsemDetailData } from "@/app/(app)/prosem/actions";
import type { RppDetailData } from "@/app/(app)/modul-ajar/actions";
import { formatTitimangsa } from "@/lib/format-titimangsa";
import { getModelPedagogiSpec, parseLangkahDeskripsi } from "@/lib/rpp-model-pedagogi";

export interface HtmlExportOptions {
  includeKop?: boolean;
}

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
    font-size: 10.5px;
    line-height: 1.4;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
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
  .rpp-box {
    border: 1.5px solid #0f172a;
    margin-top: 12px;
    margin-bottom: 15px;
  }
  .rpp-section-header {
    background-color: #e2e8f0;
    font-weight: bold;
    font-size: 11px;
    padding: 5px 8px;
    border-top: 1.5px solid #0f172a;
    border-bottom: 1px solid #0f172a;
    text-transform: uppercase;
    color: #0f172a;
  }
  .rpp-section-header:first-child {
    border-top: none;
  }
  .rpp-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0 !important;
  }
  .rpp-table td {
    border: 1px solid #64748b;
    padding: 5px 8px;
    font-size: 10px;
  }
  .rpp-table th {
    border: 1px solid #64748b;
    background-color: #f1f5f9;
    padding: 5px 8px;
    font-size: 9.5px;
  }
  .rpp-label {
    width: 25%;
    font-weight: bold;
    background-color: #f8fafc;
    color: #1e293b;
    border-right: 1px solid #64748b;
  }
`;

// =============================================================================
// 1. ATP HTML
// =============================================================================
export function generateAtpHtml(data: PreviewData, options?: HtmlExportOptions): string {
  const { madrasah, penugasan, items, summary } = data;
  const includeKop = options?.includeKop !== false;

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
        <td>${escapeHtml((Array.isArray(item.panca_cinta) ? item.panca_cinta : []).join(", "))}</td>
        <td>${escapeHtml((Array.isArray(item.dpl) ? item.dpl : []).join(", "))}</td>
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
        ${includeKop ? renderKop(madrasah) : '<div style="margin-top: 10px;"></div>'}

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
export function generateProtaHtml(data: ProtaDetailData, options?: HtmlExportOptions): string {
  const { madrasah, penugasan, prota, items } = data;
  const includeKop = options?.includeKop !== false;
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
        ${includeKop ? renderKop(madrasah) : '<div style="margin-top: 10px;"></div>'}

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
export function generateProsemHtml(data: ProsemDetailData, semester: 1 | 2, options?: HtmlExportOptions): string {
  const {
    madrasah,
    penugasan,
    prosem,
    kolomMinggu,
    items,
    jpEfektifSemester,
    mingguEfektifSemester,
  } = data;
  const includeKop = options?.includeKop !== false;

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
        ${includeKop ? renderKop(madrasah) : '<div style="margin-top: 10px;"></div>'}

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
// 4. RPP / MODUL AJAR HTML (TABEL BERGARIS RESMI STANDAR KMA 1503 & KBC)
// =============================================================================
export function generateRppHtml(data: RppDetailData, options?: HtmlExportOptions): string {
  const { rpp, langkahList, penugasan, madrasah, master } = data;
  const includeKop = options?.includeKop !== false;
  const models = master?.models || [];
  const modelTerpilih = models.find((m) => m.id === rpp.model_id) || models[0];
  const activeSpec = getModelPedagogiSpec(modelTerpilih?.nama);

  const dplSelected = (master?.dpl || [])
    .filter((d) => (rpp.dimensi_profil_lulusan_ids || []).includes(d.id))
    .map((d) => `${d.kode}: ${d.nama}`);
  const pcSelected = (master?.pancaCinta || [])
    .filter((pc) => (rpp.panca_cinta_ids || []).includes(pc.id))
    .map((pc) => `${pc.kode}: ${pc.nama}`);

  // Kelompokkan langkah per pertemuan
  const rawPertemuan = (langkahList || []).map((l) => l.pertemuan_ke);
  const pertemuanList = Array.from(new Set(rawPertemuan)).sort((a, b) => a - b);
  if (pertemuanList.length === 0) {
    const totalP = rpp.jumlah_pertemuan && rpp.jumlah_pertemuan > 0 ? rpp.jumlah_pertemuan : 1;
    for (let i = 1; i <= totalP; i++) {
      pertemuanList.push(i);
    }
  }

  let langkahPertemuanTables = "";
  pertemuanList.forEach((pNum) => {
    const steps = (langkahList || []).filter((l) => l.pertemuan_ke === pNum);
    const totalMenit = steps.reduce((sum, l) => sum + Number(l.durasi_menit || 0), 0);

    let rowsHtml = "";
    steps.forEach((l, idx) => {
      const pcObj = (master?.pancaCinta || []).find((p) => p.id === l.panca_cinta_id);
      const parsed = parseLangkahDeskripsi(l.deskripsi_kegiatan);

      let aktivitasContent = "";
      if (parsed.sintaksHeader) {
        aktivitasContent += `<div style="margin-bottom: 3px;"><span style="background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 8.5px; font-weight: bold; padding: 1px 4px; border-radius: 3px;">${escapeHtml(parsed.sintaksHeader)}</span></div>`;
      }

      if (parsed.aktivitasGuru || parsed.aktivitasMurid) {
        if (parsed.aktivitasGuru) {
          aktivitasContent += `<div style="margin-bottom: 2px;"><strong style="color: #0f172a;">• Aktivitas Guru:</strong> <span style="color: #334155;">${escapeHtml(parsed.aktivitasGuru)}</span></div>`;
        }
        if (parsed.aktivitasMurid) {
          aktivitasContent += `<div style="margin-bottom: 2px;"><strong style="color: #047857;">• Aktivitas Murid:</strong> <span style="color: #334155;">${escapeHtml(parsed.aktivitasMurid)}</span></div>`;
        }
      } else {
        aktivitasContent += `<div style="white-space: pre-wrap; color: #334155;">${escapeHtml(parsed.isiUtama)}</div>`;
      }

      if (l.aksi_kbc) {
        aktivitasContent += `<div style="font-style: italic; color: #9f1239; font-size: 8.5px; margin-top: 3px;">❤️ <strong>Aksi Cinta Guru:</strong> ${escapeHtml(l.aksi_kbc)}</div>`;
      }

      rowsHtml += `
        <tr style="page-break-inside: avoid;">
          <td style="text-align: center; font-weight: bold; width: 5%;">${idx + 1}</td>
          <td style="width: 14%; text-align: center;">
            <span style="font-weight: bold; font-size: 9px; text-transform: uppercase; color: #047857;">[${escapeHtml(l.tahap)}]</span>
          </td>
          <td style="width: 56%; font-size: 9.5px; line-height: 1.35;">
            ${aktivitasContent}
          </td>
          <td style="width: 15%; text-align: center; font-size: 8.5px;">
            <div style="font-weight: 600; text-transform: capitalize;">${escapeHtml(l.pengalaman || "-")}</div>
            ${pcObj ? `<div style="color: #9f1239; font-weight: bold; margin-top: 2px;">[${escapeHtml(pcObj.kode)}]</div>` : ""}
          </td>
          <td style="text-align: center; font-weight: bold; width: 10%; font-size: 9.5px;">${l.durasi_menit}&apos;</td>
        </tr>
      `;
    });

    langkahPertemuanTables += `
      <div style="margin-top: 8px; page-break-inside: avoid;">
        <div style="background: #f1f5f9; font-weight: bold; font-size: 9.5px; padding: 4px 8px; border: 1px solid #64748b; border-bottom: none; display: flex; justify-content: space-between;">
          <span>PERTEMUAN KE-${pNum} — MODEL: ${escapeHtml((modelTerpilih?.nama || "Pembelajaran Mendalam").toUpperCase())}</span>
          <span>Alokasi Waktu: ${totalMenit} Menit</span>
        </div>
        <table class="rpp-table" style="margin-top: 0; margin-bottom: 6px;">
          <thead>
            <tr>
              <th style="width: 5%;">No</th>
              <th style="width: 14%;">Tahap</th>
              <th style="width: 56%;">Sintaks & Rincian Pengalaman Pembelajaran</th>
              <th style="width: 15%;">Pengalaman (3M)</th>
              <th style="width: 10%;">Durasi</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `<tr><td colspan="5" style="text-align: center; font-style: italic; color: #64748b;">Belum ada langkah kegiatan.</td></tr>`}
          </tbody>
        </table>
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
          @page { size: portrait; margin: 12mm; }
        </style>
      </head>
      <body>
        ${includeKop ? renderKop(madrasah) : '<div style="margin-top: 10px;"></div>'}

        <div style="text-align: center; margin-bottom: 12px;">
          <h2 style="margin: 0; font-size: 14px; text-transform: uppercase; font-weight: 900; letter-spacing: 0.5px;">MODUL AJAR / RENCANA PELAKSANAAN PEMBELAJARAN (RPP)</h2>
          <div style="font-size: 11px; font-weight: bold; color: #047857; margin-top: 2px;">PEMBELAJARAN MENDALAM TERINTEGRASI KURIKULUM BERBASIS CINTA (KBC)</div>
          <div style="font-size: 9px; font-weight: 600; color: #475569; margin-top: 1px;">Standar Regulasi KMA 1503 Tahun 2025 • Format Tabel Resmi</div>
        </div>

        <div class="rpp-box">
          <!-- A. SPESIFIKASI DOKUMEN -->
          <div class="rpp-section-header">A. SPESIFIKASI DOKUMEN / IDENTITAS MODUL</div>
          <table class="rpp-table">
            <tbody>
              <tr>
                <td class="rpp-label">Satuan Pendidikan</td>
                <td style="font-weight: bold; width: 75%;">${escapeHtml(madrasah.nama)}</td>
              </tr>
              <tr>
                <td class="rpp-label">Mata Pelajaran & Kode</td>
                <td style="font-weight: bold;">${escapeHtml(penugasan.mapel.nama)} (${escapeHtml(penugasan.mapel.kode)})</td>
              </tr>
              <tr>
                <td class="rpp-label">Fase / Kelas / Rombel</td>
                <td>Fase D • Kelas ${penugasan.tingkat_kelas} (${escapeHtml(penugasan.rombel)})</td>
              </tr>
              <tr>
                <td class="rpp-label">Lingkup Materi Pokok</td>
                <td style="font-weight: 900; color: #0f172a;">${escapeHtml(rpp.materi_pokok)}</td>
              </tr>
              <tr>
                <td class="rpp-label">Alokasi Waktu</td>
                <td>${escapeHtml(rpp.alokasi_waktu || `${rpp.alokasi_jp} JP (${rpp.jumlah_pertemuan} Pertemuan)`)}</td>
              </tr>
              <tr>
                <td class="rpp-label">Guru Pengampu</td>
                <td>
                  ${escapeHtml(penugasan.guru.nama_lengkap)}${penugasan.guru.gelar ? `, ${escapeHtml(penugasan.guru.gelar)}` : ""}
                  ${penugasan.guru.nip ? ` (NIP. ${escapeHtml(penugasan.guru.nip)})` : ""}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- B. IDENTIFIKASI PEMBELAJARAN -->
          <div class="rpp-section-header">B. IDENTIFIKASI PEMBELAJARAN</div>
          <table class="rpp-table">
            <tbody>
              ${
                rpp.kesiapan_murid?.pengetahuan_awal || rpp.kesiapan_murid?.minat
                  ? `
                <tr>
                  <td class="rpp-label">Kesiapan Belajar Murid</td>
                  <td>
                    ${rpp.kesiapan_murid?.pengetahuan_awal ? `<div><strong>Pengetahuan Awal:</strong> ${escapeHtml(rpp.kesiapan_murid.pengetahuan_awal)}</div>` : ""}
                    ${rpp.kesiapan_murid?.minat ? `<div style="margin-top: 2px;"><strong>Minat Murid:</strong> ${escapeHtml(rpp.kesiapan_murid.minat)}</div>` : ""}
                    ${rpp.kesiapan_murid?.strategi_asesmen_awal ? `<div style="margin-top: 2px;"><strong>Strategi Diagnostik Awal:</strong> ${escapeHtml(rpp.kesiapan_murid.strategi_asesmen_awal)}</div>` : ""}
                  </td>
                </tr>
              `
                  : ""
              }
              <tr>
                <td class="rpp-label">Karakteristik Materi</td>
                <td>${escapeHtml(rpp.karakteristik_materi || "-")}</td>
              </tr>
              <tr>
                <td class="rpp-label">Dimensi Profil Lulusan (DPL)</td>
                <td>${escapeHtml(dplSelected.join("; ") || "-")}</td>
              </tr>
              <tr>
                <td class="rpp-label">Topik Panca Cinta KBC</td>
                <td style="font-weight: bold; color: #9f1239;">${escapeHtml(pcSelected.join("; ") || "-")}</td>
              </tr>
              <tr>
                <td class="rpp-label">Benang Merah Nilai Cinta (KBC)</td>
                <td style="font-style: italic;">${escapeHtml(rpp.benang_merah_kbc || "-")}</td>
              </tr>
            </tbody>
          </table>

          <!-- C. DESAIN PEMBELAJARAN -->
          <div class="rpp-section-header">C. DESAIN PEMBELAJARAN</div>
          <table class="rpp-table">
            <tbody>
              <tr>
                <td class="rpp-label">Tujuan Pembelajaran (TP)</td>
                <td style="white-space: pre-wrap; font-weight: 500;">${escapeHtml(rpp.tujuan_pembelajaran_teks || "-")}</td>
              </tr>
              ${
                rpp.lintas_disiplin_ilmu
                  ? `
                <tr>
                  <td class="rpp-label">Lintas Disiplin Ilmu</td>
                  <td>${escapeHtml(rpp.lintas_disiplin_ilmu)}</td>
                </tr>
              `
                  : ""
              }
              <tr>
                <td class="rpp-label">Model & Metode Pembelajaran</td>
                <td>
                  <strong>Model:</strong> ${escapeHtml(modelTerpilih?.nama || "Pembelajaran Mendalam")}
                  ${rpp.metode_pembelajaran && rpp.metode_pembelajaran.length > 0 ? ` • <strong>Metode:</strong> ${escapeHtml(rpp.metode_pembelajaran.join(", "))}` : ""}
                </td>
              </tr>
              <tr>
                <td class="rpp-label">Lingkungan & Budaya Belajar</td>
                <td>
                  <strong>Fisik:</strong> ${escapeHtml(rpp.lingkungan_belajar_fisik || "-")} • 
                  <strong>Budaya:</strong> ${escapeHtml(rpp.budaya_belajar || "-")}
                  ${rpp.pemanfaatan_digital ? ` • <strong>Teknologi:</strong> ${escapeHtml(rpp.pemanfaatan_digital)}` : ""}
                </td>
              </tr>
            </tbody>
          </table>

          <!-- D. PENGALAMAN BELAJAR -->
          <div class="rpp-section-header">
            D. PENGALAMAN BELAJAR (${escapeHtml(activeSpec.nama_resmi.toUpperCase())})
          </div>
          <div style="padding: 6px 8px; border-bottom: 1px solid #64748b;">
            <div style="font-size: 9.5px; font-weight: bold; color: #047857; margin-bottom: 4px;">
              Alur Pengalaman: ${escapeHtml(activeSpec.format_pengalaman_label)}
            </div>
            ${langkahPertemuanTables}
          </div>

          <!-- E. RANCANGAN ASESMEN -->
          <div class="rpp-section-header">E. RANCANGAN ASESMEN PEMBELAJARAN</div>
          <table class="rpp-table">
            <tbody>
              <tr>
                <td class="rpp-label">Asesmen Awal (Diagnostik)</td>
                <td>${escapeHtml(rpp.asesmen_awal || "Diagnostik kesiapan belajar murid di awal materi.")}</td>
              </tr>
              <tr>
                <td class="rpp-label">Asesmen Proses (Formatif)</td>
                <td>${escapeHtml(rpp.asesmen_proses || "Observasi diskusi, performa unjuk kerja, dan refleksi berkala.")}</td>
              </tr>
              <tr>
                <td class="rpp-label">Asesmen Akhir (Sumatif)</td>
                <td>${escapeHtml(rpp.asesmen_akhir || "Tes tertulis / penilaian produk portofolio.")}</td>
              </tr>
              ${
                rpp.kktp
                  ? `
                <tr>
                  <td class="rpp-label">Kriteria Ketercapaian (KKTP)</td>
                  <td>${escapeHtml(rpp.kktp)}</td>
                </tr>
              `
                  : ""
              }
            </tbody>
          </table>

          <!-- F. LAMPIRAN -->
          ${
            rpp.lampiran?.lkpd || rpp.lampiran?.bahan_bacaan || rpp.lampiran?.glosarium || rpp.lampiran?.daftar_pustaka
              ? `
            <div class="rpp-section-header">F. LAMPIRAN MODUL AJAR</div>
            <table class="rpp-table">
              <tbody>
                ${
                  rpp.lampiran?.lkpd
                    ? `
                  <tr>
                    <td class="rpp-label">Lembar Kerja Murid (LKPD)</td>
                    <td style="white-space: pre-wrap; font-size: 9.5px;">${escapeHtml(rpp.lampiran.lkpd)}</td>
                  </tr>
                `
                    : ""
                }
                ${
                  rpp.lampiran?.bahan_bacaan
                    ? `
                  <tr>
                    <td class="rpp-label">Bahan Bacaan</td>
                    <td style="white-space: pre-wrap; font-size: 9.5px;">${escapeHtml(rpp.lampiran.bahan_bacaan)}</td>
                  </tr>
                `
                    : ""
                }
                ${
                  rpp.lampiran?.glosarium
                    ? `
                  <tr>
                    <td class="rpp-label">Glosarium (Daftar Istilah)</td>
                    <td style="white-space: pre-wrap; font-size: 9.5px;">${escapeHtml(rpp.lampiran.glosarium)}</td>
                  </tr>
                `
                    : ""
                }
                ${
                  rpp.lampiran?.daftar_pustaka
                    ? `
                  <tr>
                    <td class="rpp-label">Daftar Pustaka</td>
                    <td style="white-space: pre-wrap; font-size: 9.5px;">${escapeHtml(rpp.lampiran.daftar_pustaka)}</td>
                  </tr>
                `
                    : ""
                }
              </tbody>
            </table>
          `
              : ""
          }
        </div>

        ${renderSignatures(madrasah, penugasan, penugasan.tahun_ajaran.tanggal_penetapan_dokumen)}
      </body>
    </html>
  `;
}
