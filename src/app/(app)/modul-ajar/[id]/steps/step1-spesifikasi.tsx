"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { School, BookOpen, Clock, Calendar } from "lucide-react";
import type { RppDetailData } from "../../actions";

interface Step1Props {
  data: RppDetailData;
  onChange: (updates: Partial<RppDetailData["rpp"]>) => void;
}

export function Step1Spesifikasi({ data, onChange }: Step1Props) {
  const { rpp, penugasan, madrasah } = data;

  const handleMateriChange = (val: string) => {
    onChange({ materi_pokok: val });
  };

  const handleJpChange = (valStr: string) => {
    const jp = Math.max(1, parseInt(valStr, 10) || 1);
    const jmlPertemuan = rpp.jumlah_pertemuan || 1;
    const menitJp = rpp.menit_per_jp || 40;
    const durasiPerPertemuan = Math.round((jp / jmlPertemuan) * menitJp);
    onChange({
      alokasi_jp: jp,
      alokasi_waktu: `${jp} JP (${jmlPertemuan} Pertemuan x ${durasiPerPertemuan} menit)`,
    });
  };

  const handlePertemuanChange = (valStr: string) => {
    const pertemuan = Math.max(1, parseInt(valStr, 10) || 1);
    const jp = rpp.alokasi_jp || 2;
    const menitJp = rpp.menit_per_jp || 40;
    const durasiPerPertemuan = Math.round((jp / pertemuan) * menitJp);
    onChange({
      jumlah_pertemuan: pertemuan,
      alokasi_waktu: `${jp} JP (${pertemuan} Pertemuan x ${durasiPerPertemuan} menit)`,
    });
  };

  const handleMenitJpChange = (valStr: string) => {
    const menit = Math.max(20, parseInt(valStr, 10) || 40);
    const jp = rpp.alokasi_jp || 2;
    const jmlPertemuan = rpp.jumlah_pertemuan || 1;
    const durasiPerPertemuan = Math.round((jp / jmlPertemuan) * menit);
    onChange({
      menit_per_jp: menit,
      alokasi_waktu: `${jp} JP (${jmlPertemuan} Pertemuan x ${durasiPerPertemuan} menit)`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">
          Langkah 1 — Spesifikasi Dokumen
        </h3>
        <p className="text-xs text-slate-600">
          Identitas satuan pendidikan, mata pelajaran, fase/kelas, alokasi waktu jam
          pelajaran, dan jumlah pertemuan.
        </p>
      </div>

      {/* Informasi Otomatis Satuan Pendidikan & Penugasan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200 bg-slate-50/60 shadow-2xs">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase">
              <School className="w-4 h-4" />
              <span>Satuan Pendidikan & Guru Pengampu</span>
            </div>
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-slate-500">Nama Madrasah:</span>{" "}
                <span className="font-bold text-slate-900">{madrasah.nama}</span>
              </div>
              <div>
                <span className="text-slate-500">Alamat:</span>{" "}
                <span className="text-slate-700">
                  {madrasah.alamat || "-"} ({madrasah.kabupaten || "Tasikmalaya"})
                </span>
              </div>
              <div>
                <span className="text-slate-500">Guru Pengampu:</span>{" "}
                <span className="font-bold text-slate-900">
                  {penugasan.guru.nama_lengkap}
                  {penugasan.guru.gelar ? `, ${penugasan.guru.gelar}` : ""}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-50/60 shadow-2xs">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase">
              <BookOpen className="w-4 h-4" />
              <span>Mata Pelajaran & Fase Kelas</span>
            </div>
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-slate-500">Mata Pelajaran:</span>{" "}
                <span className="font-bold text-slate-900">
                  {penugasan.mapel.nama} ({penugasan.mapel.kode})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Fase / Kelas:</span>{" "}
                <Badge variant="outline" className="bg-white font-bold text-slate-800">
                  Fase D • Kelas {penugasan.tingkat_kelas} ({penugasan.rombel})
                </Badge>
              </div>
              <div>
                <span className="text-slate-500">Tahun Pelajaran:</span>{" "}
                <span className="font-semibold text-slate-800">
                  {penugasan.tahun_ajaran.nama}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Input Materi & Alokasi Waktu */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 shadow-2xs">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-800">
            Materi Pokok / Lingkup Materi <span className="text-rose-500">*</span>
          </Label>
          <Input
            value={rpp.materi_pokok}
            onChange={(e) => handleMateriChange(e.target.value)}
            placeholder="Contoh: Hukum Bacaan Mad Thabi'i dan Implementasi dalam Tilawah"
            className="text-xs font-semibold"
          />
          <p className="text-[11px] text-slate-500">
            Topik bahasan utama yang akan dipelajari murid secara mendalam.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Alokasi JP */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              Total Alokasi JP <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="number"
              min={1}
              max={16}
              value={rpp.alokasi_jp}
              onChange={(e) => handleJpChange(e.target.value)}
              className="text-xs font-bold"
            />
            <p className="text-[11px] text-slate-500">Total Jam Pelajaran (JP)</p>
          </div>

          {/* Jumlah Pertemuan */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              Jumlah Pertemuan <span className="text-rose-500">*</span>
            </Label>
            <Input
              type="number"
              min={1}
              max={8}
              value={rpp.jumlah_pertemuan}
              onChange={(e) => handlePertemuanChange(e.target.value)}
              className="text-xs font-bold"
            />
            <p className="text-[11px] text-slate-500">
              Menghasilkan Tab Pertemuan di Langkah 4
            </p>
          </div>

          {/* Menit per JP */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-800">
              Durasi Menit per JP
            </Label>
            <Input
              type="number"
              min={30}
              max={60}
              value={rpp.menit_per_jp}
              onChange={(e) => handleMenitJpChange(e.target.value)}
              className="text-xs"
            />
            <p className="text-[11px] text-slate-500">Standar MTs: 40 menit per JP</p>
          </div>
        </div>

        {/* Ringkasan Durasi Waktu */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center justify-between">
          <div>
            <span className="font-semibold">Format Alokasi Waktu Resmi: </span>
            <span className="font-bold">{rpp.alokasi_waktu}</span>
          </div>
          <Badge className="bg-emerald-600 text-white text-[10px]">
            {Math.round(
              ((rpp.alokasi_jp || 2) / (rpp.jumlah_pertemuan || 1)) *
                (rpp.menit_per_jp || 40)
            )}{" "}
            menit / pertemuan
          </Badge>
        </div>
      </div>
    </div>
  );
}
