"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileCheck2,
  Heart,
  ClipboardCheck,
  Wand2,
} from "lucide-react";
import type { RppDetailData, RubrikKbcItem } from "../../actions";

interface Step5Props {
  data: RppDetailData;
  onChange: (updates: Partial<RppDetailData["rpp"]>) => void;
}

export function Step5Asesmen({ data, onChange }: Step5Props) {
  const { rpp, master } = data;

  // Topik Panca Cinta terpilih
  const selectedPcList = master.pancaCinta.filter((p) =>
    rpp.panca_cinta_ids.includes(p.id)
  );

  // Generator Rubrik KBC 4 Level (Mulai Berkembang, Berkembang, Cakap, Membudaya)
  const handleGenerateRubrikKbc = () => {
    const generated: RubrikKbcItem[] = selectedPcList.map((pc) => ({
      panca_cinta_id: pc.id,
      topik_nama: pc.nama,
      indikator: `Murid konsisten mengamalkan nilai ${pc.nama} dalam proses pembelajaran dan interaksi kelas.`,
      levels: [
        {
          level: "MB",
          label: "Mulai Berkembang",
          deskripsi: `Murid masih memerlukan bimbingan dan pengingat aktif dalam menunjukkan sikap ${pc.nama}.`,
        },
        {
          level: "B",
          label: "Berkembang",
          deskripsi: `Murid mulai terbiasa menunjukkan sikap ${pc.nama} dengan dorongan sesekali dari guru.`,
        },
        {
          level: "C",
          label: "Cakap",
          deskripsi: `Murid secara mandiri dan konsisten menampilkan sikap ${pc.nama} dalam berinteraksi.`,
        },
        {
          level: "M",
          label: "Membudaya",
          deskripsi: `Murid menjadi teladan dan mampu menginspirasi teman sebaya dalam mengamalkan ${pc.nama}.`,
        },
      ],
    }));

    onChange({ rubrik_kbc: generated });
  };

  const handleUpdateRubrikLevel = (
    itemIndex: number,
    levelIdx: number,
    deskripsi: string
  ) => {
    const copy = [...(rpp.rubrik_kbc || [])];
    const item = { ...copy[itemIndex] };
    const levels = [...item.levels];
    levels[levelIdx] = { ...levels[levelIdx], deskripsi };
    item.levels = levels;
    copy[itemIndex] = item;
    onChange({ rubrik_kbc: copy });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">
          Langkah 5 — Rancangan Asesmen Pembelajaran Mendalam
        </h3>
        <p className="text-xs text-slate-600">
          Asesmen formatif (awal & proses) dan sumatif (akhir), Kriteria
          Ketercapaian Tujuan Pembelajaran (KKTP), serta rubrik observasi nilai Panca
          Cinta KBC.
        </p>
      </div>

      {/* Bagian A: Asesmen Awal & Asesmen Proses */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
              Asesmen Awal (Diagnostik)
            </Label>
            <Textarea
              rows={3}
              value={rpp.asesmen_awal || ""}
              onChange={(e) => onChange({ asesmen_awal: e.target.value })}
              placeholder="Teknik: Kuis singkat / tanya jawab lisan. Instrumen: 3 pertanyaan pemantik pemahaman awal. Tindak lanjut: Pembagian mitra belajar tutor sebaya."
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5 text-emerald-600" />
              Asesmen Proses (Formatif as & for Learning)
            </Label>
            <Textarea
              rows={3}
              value={rpp.asesmen_proses || ""}
              onChange={(e) => onChange({ asesmen_proses: e.target.value })}
              placeholder="As learning: Lembar penilaian diri (self-assessment). For learning: Observasi keaktifan diskusi kelompok dan umpan balik langsung (constructive feedback) oleh guru."
              className="text-xs"
            />
          </div>
        </div>
      </div>

      {/* Bagian B: Asesmen Akhir (Sumatif) & KKTP */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              Asesmen Akhir (Sumatif of Learning)
            </Label>
            <Textarea
              rows={3}
              value={rpp.asesmen_akhir || ""}
              onChange={(e) => onChange({ asesmen_akhir: e.target.value })}
              placeholder="Teknik: Penilaian kinerja produk / tes tertulis berbasis penalaran. Instrumen: Lembar rubrik unjuk kerja tilawah dan soal uraian kontekstual."
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800">
              Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
            </Label>
            <Textarea
              rows={3}
              value={rpp.kktp || ""}
              onChange={(e) => onChange({ kktp: e.target.value })}
              placeholder="Murid mencapai kriteria apabila mampu: 1) Mengidentifikasi hukum bacaan secara benar (minimal 75%), 2) Menerapkan dalam tilawah secara fasih, 3) Merefleksikan makna ayat."
              className="text-xs"
            />
          </div>
        </div>
      </div>

      {/* Bagian C: Rubrik Sikap Panca Cinta KBC (4 Level Perkembangan) */}
      <div className="bg-white p-5 rounded-xl border border-rose-200 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-rose-100">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
            <div>
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                Rubrik Observasi Nilai Panca Cinta (4 Level KBC)
              </h4>
              <p className="text-[11px] text-slate-500">
                Mulai Berkembang (MB) • Berkembang (B) • Cakap (C) • Membudaya (M)
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateRubrikKbc}
            className="text-xs border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100 font-semibold"
          >
            <Wand2 className="w-3.5 h-3.5 mr-1 text-rose-600" />
            Generate Rubrik Otomatis
          </Button>
        </div>

        {(rpp.rubrik_kbc || []).length === 0 ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
            Klik tombol <strong>&ldquo;Generate Rubrik Otomatis&rdquo;</strong> di atas untuk
            menghasilkan instrumen rubrik 4 level berdasarkan nilai Panca Cinta yang
            Anda pilih di Identifikasi.
          </div>
        ) : (
          <div className="space-y-4">
            {(rpp.rubrik_kbc || []).map((item, itmIdx) => (
              <div
                key={`rubrik-item-${itmIdx}`}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                    <Heart className="w-3 h-3 text-rose-600 fill-rose-600" />
                    Topik: {item.topik_nama}
                  </span>
                  <Badge variant="outline" className="bg-white text-[10px]">
                    4 Tingkat Pencapaian
                  </Badge>
                </div>

                <div className="text-xs">
                  <span className="font-semibold text-slate-700">Indikator Sikap: </span>
                  <span className="text-slate-600">{item.indikator}</span>
                </div>

                {/* 4 Level Deskripsi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {item.levels.map((lvl, lvlIdx) => (
                    <div
                      key={`lvl-${lvl.level}`}
                      className="p-2.5 rounded-lg border bg-white border-slate-200 space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span className="text-emerald-800">
                          [{lvl.level}] {lvl.label}
                        </span>
                      </div>
                      <Textarea
                        rows={3}
                        value={lvl.deskripsi}
                        onChange={(e) =>
                          handleUpdateRubrikLevel(itmIdx, lvlIdx, e.target.value)
                        }
                        className="text-[11px] p-2 leading-tight"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
