"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  FileCheck,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  BookOpen,
  Calendar,
  LayoutList,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AntrianDokumenItem } from "@/lib/validasi/actions";
import type { DokumenTipe, DocStatus } from "@/types/database";

interface AntrianValidasiClientProps {
  initialItems: AntrianDokumenItem[];
  mapelList: Array<{ id: string; nama: string; kode: string }>;
  guruList: Array<{ id: string; nama_lengkap: string }>;
}

export function AntrianValidasiClient({
  initialItems,
  mapelList,
  guruList,
}: AntrianValidasiClientProps) {
  const items = initialItems;
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState<string>("semua");
  const [filterStatus, setFilterStatus] = useState<string>("diajukan");
  const [filterMapel, setFilterMapel] = useState<string>("semua");
  const [filterGuru, setFilterGuru] = useState<string>("semua");
  const [filterTingkat, setFilterTingkat] = useState<string>("semua");

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Status
      if (filterStatus !== "semua" && item.status !== filterStatus) {
        return false;
      }
      // Jenis
      if (filterJenis !== "semua" && item.dokumen_tipe !== filterJenis) {
        return false;
      }
      // Tingkat
      if (filterTingkat !== "semua" && item.tingkat_kelas !== Number(filterTingkat)) {
        return false;
      }
      // Guru
      if (filterGuru !== "semua" && item.guru_nama !== filterGuru) {
        return false;
      }
      // Mapel
      if (filterMapel !== "semua" && item.mapel_nama !== filterMapel) {
        return false;
      }
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchJudul = item.judul.toLowerCase().includes(q);
        const matchGuru = item.guru_nama.toLowerCase().includes(q);
        const matchMapel = item.mapel_nama.toLowerCase().includes(q);
        const matchRombel = item.rombel.toLowerCase().includes(q);
        return matchJudul || matchGuru || matchMapel || matchRombel;
      }

      return true;
    });
  }, [items, filterStatus, filterJenis, filterTingkat, filterGuru, filterMapel, search]);

  const getDocTypeIcon = (tipe: DokumenTipe) => {
    switch (tipe) {
      case "atp":
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case "prota":
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case "prosem":
        return <LayoutList className="w-4 h-4 text-purple-600" />;
      case "rpp":
      default:
        return <FileText className="w-4 h-4 text-amber-600" />;
    }
  };

  const getDocTypeBadge = (tipe: DokumenTipe) => {
    switch (tipe) {
      case "atp":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            ATP
          </Badge>
        );
      case "prota":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
            Prota
          </Badge>
        );
      case "prosem":
        return (
          <Badge className="bg-purple-50 text-purple-700 border-purple-200">
            Prosem
          </Badge>
        );
      case "rpp":
      default:
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200">
            RPP / Modul Ajar
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: DocStatus) => {
    switch (status) {
      case "disetujui":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Disetujui
          </Badge>
        );
      case "diajukan":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300">
            <Clock className="w-3 h-3 mr-1" /> Diajukan
          </Badge>
        );
      case "revisi":
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300">
            <AlertCircle className="w-3 h-3 mr-1" /> Revisi
          </Badge>
        );
      case "draf":
      default:
        return (
          <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200">
            Draf
          </Badge>
        );
    }
  };

  const totalDiajukan = items.filter((i) => i.status === "diajukan").length;

  return (
    <div className="space-y-6">
      {/* Statistik Banner Mini */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Antrian Menunggu Telaah</p>
            <h4 className="text-2xl font-bold text-blue-700 mt-1">{totalDiajukan} Dokumen</h4>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Dokumen Disetujui</p>
            <h4 className="text-2xl font-bold text-emerald-700 mt-1">
              {items.filter((i) => i.status === "disetujui").length} Dokumen
            </h4>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Dalam Tahap Revisi</p>
            <h4 className="text-2xl font-bold text-rose-700 mt-1">
              {items.filter((i) => i.status === "revisi").length} Dokumen
            </h4>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              placeholder="Cari materi, guru, mapel..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Status */}
          <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val || "semua")}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Status</SelectItem>
              <SelectItem value="diajukan">Diajukan (Antrian)</SelectItem>
              <SelectItem value="revisi">Perlu Revisi</SelectItem>
              <SelectItem value="disetujui">Disetujui</SelectItem>
              <SelectItem value="draf">Draf</SelectItem>
            </SelectContent>
          </Select>

          {/* Jenis Dokumen */}
          <Select value={filterJenis} onValueChange={(val) => setFilterJenis(val || "semua")}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Jenis Dokumen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Jenis</SelectItem>
              <SelectItem value="rpp">RPP / Modul Ajar</SelectItem>
              <SelectItem value="atp">ATP</SelectItem>
              <SelectItem value="prota">Prota</SelectItem>
              <SelectItem value="prosem">Prosem</SelectItem>
            </SelectContent>
          </Select>

          {/* Tingkat */}
          <Select value={filterTingkat} onValueChange={(val) => setFilterTingkat(val || "semua")}>
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Kelas</SelectItem>
              <SelectItem value="7">Kelas VII</SelectItem>
              <SelectItem value="8">Kelas VIII</SelectItem>
              <SelectItem value="9">Kelas IX</SelectItem>
            </SelectContent>
          </Select>

          {/* Mapel */}
          <Select value={filterMapel} onValueChange={(val) => setFilterMapel(val || "semua")}>
            <SelectTrigger className="text-xs truncate">
              <SelectValue placeholder="Mata Pelajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Mapel</SelectItem>
              {mapelList.map((m) => (
                <SelectItem key={m.id} value={m.nama}>
                  {m.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Guru */}
          <Select value={filterGuru} onValueChange={(val) => setFilterGuru(val || "semua")}>
            <SelectTrigger className="text-xs truncate">
              <SelectValue placeholder="Guru Pengampu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semua">Semua Guru</SelectItem>
              {guruList.map((g) => (
                <SelectItem key={g.id} value={g.nama_lengkap}>
                  {g.nama_lengkap}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Daftar Kartu / Tabel Antrian */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <FileCheck className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Tidak ada dokumen dalam antrian</p>
            <p className="text-xs text-slate-400">
              Coba sesuaikan filter status atau pencarian di atas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((item) => {
              let updatedDate = item.updated_at;
              try {
                updatedDate = format(new Date(item.updated_at), "d MMM yyyy, HH:mm", {
                  locale: localeId,
                });
              } catch {
                // fallback
              }

              // Path ke halaman telaah
              const telaahHref = `/validasi/telaah/${item.dokumen_tipe}/${item.id}`;

              return (
                <div
                  key={`${item.dokumen_tipe}-${item.id}`}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-200">
                      {getDocTypeIcon(item.dokumen_tipe)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {getDocTypeBadge(item.dokumen_tipe)}
                        {getStatusBadge(item.status)}
                        <span className="text-xs text-slate-400">· {updatedDate}</span>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900">
                        {item.judul}
                      </h4>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        <span>
                          Guru: <strong>{item.guru_nama}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          {item.mapel_nama} (Kelas {item.tingkat_kelas} - {item.rombel})
                        </span>
                      </div>

                      {item.catatan_validator && (
                        <div className="mt-2 text-xs bg-slate-50 border border-slate-200 rounded p-2 text-slate-600">
                          <span className="font-semibold text-slate-700">Catatan Sebelumnya: </span>
                          {item.catatan_validator}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2 sm:self-center">
                    <Link href={telaahHref}>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        Telaah Dokumen
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
