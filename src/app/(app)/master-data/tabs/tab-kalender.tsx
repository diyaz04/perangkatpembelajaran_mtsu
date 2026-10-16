"use client";

import React, { useState, useMemo } from "react";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  CalendarDays,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  FileSpreadsheet,
  Info,
} from "lucide-react";
import {
  getKalenderKegiatanAction,
  createKalenderKegiatanAction,
  updateKalenderKegiatanAction,
  deleteKalenderKegiatanAction,
  importKalenderCsvAction,
  type KalenderItem,
  type TahunAjaranItem,
} from "../actions";
import type { JenisKegiatanKalender } from "@/types/database";

const JENIS_OPTIONS: { value: JenisKegiatanKalender; label: string; color: string }[] = [
  { value: "libur", label: "Libur Nasional / Semester", color: "bg-red-100 text-red-800 border-red-300" },
  { value: "asesmen", label: "Asesmen (STS/SAS/SAT)", color: "bg-amber-100 text-amber-800 border-amber-300" },
  { value: "matsama", label: "MATSAMA (Orientasi)", color: "bg-blue-100 text-blue-800 border-blue-300" },
  { value: "ramadhan", label: "Peringatan / Libur Ramadhan", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { value: "kegiatan_madrasah", label: "Kegiatan Madrasah / P5RA", color: "bg-purple-100 text-purple-800 border-purple-300" },
  { value: "lainnya", label: "Lainnya", color: "bg-slate-100 text-slate-800 border-slate-300" },
];

const MONTH_NAMES = [
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  "Januari", "Februari", "Maret", "April", "Mei", "Juni"
];

interface TabKalenderPendidikanProps {
  initialData: KalenderItem[];
  initialTaList: TahunAjaranItem[];
}

export function TabKalenderPendidikan({
  initialData,
  initialTaList,
}: TabKalenderPendidikanProps) {
  const [data, setData] = useState<KalenderItem[]>(initialData);
  const activeTa = initialTaList.find((ta) => ta.aktif) || initialTaList[0];
  const [selectedTaId, setSelectedTaId] = useState<string>(activeTa?.id || "");
  const [loading, setLoading] = useState(false);

  // View switch: 'table' | 'calendar' | 'both'
  const [viewMode, setViewMode] = useState<"both" | "table" | "calendar">("both");

  // Form Dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KalenderItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    tgl_mulai: "2026-07-13",
    tgl_selesai: "2026-07-15",
    jenis: "matsama" as JenisKegiatanKalender,
    keterangan: "Masa Ta'aruf Siswa Madrasah (MATSAMA) Kelas VII",
    memotong_minggu_efektif: true,
  });

  // CSV Import Dialog
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);

  // Confirm Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function reloadKegiatan(taId: string) {
    if (!taId) return;
    setLoading(true);
    const res = await getKalenderKegiatanAction(taId);
    if (res.data) setData(res.data);
    setLoading(false);
  }

  function handleTaChange(taId: string) {
    setSelectedTaId(taId);
    void reloadKegiatan(taId);
  }

  function handleOpenCreate() {
    setEditingItem(null);
    setForm({
      tgl_mulai: "2026-07-13",
      tgl_selesai: "2026-07-15",
      jenis: "matsama",
      keterangan: "",
      memotong_minggu_efektif: false,
    });
    setFormOpen(true);
  }

  function handleOpenEdit(item: KalenderItem) {
    setEditingItem(item);
    setForm({
      tgl_mulai: item.tgl_mulai,
      tgl_selesai: item.tgl_selesai,
      jenis: item.jenis,
      keterangan: item.keterangan,
      memotong_minggu_efektif: item.memotong_minggu_efektif,
    });
    setFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTaId) {
      toast.error("Pilih tahun ajaran terlebih dahulu");
      return;
    }

    setSaving(true);
    if (editingItem) {
      const res = await updateKalenderKegiatanAction(editingItem.id, {
        tahun_ajaran_id: selectedTaId,
        ...form,
      });
      if (res.success) {
        toast.success("Kegiatan kalender berhasil diperbarui");
        setFormOpen(false);
        await reloadKegiatan(selectedTaId);
      } else {
        toast.error(res.error || "Gagal memperbarui kegiatan");
      }
    } else {
      const res = await createKalenderKegiatanAction({
        tahun_ajaran_id: selectedTaId,
        ...form,
      });
      if (res.success) {
        toast.success("Kegiatan baru berhasil ditambahkan");
        setFormOpen(false);
        await reloadKegiatan(selectedTaId);
      } else {
        toast.error(res.error || "Gagal menambah kegiatan");
      }
    }
    setSaving(false);
  }

  async function handleDeleteConfirm() {
    if (!deletingId) return;
    const res = await deleteKalenderKegiatanAction(deletingId);
    if (res.success) {
      toast.success("Kegiatan kalender berhasil dihapus");
      setDeleteOpen(false);
      setDeletingId(null);
      await reloadKegiatan(selectedTaId);
    } else {
      toast.error(res.error || "Gagal menghapus kegiatan");
    }
  }

  async function handleImportCsv() {
    if (!csvText.trim()) {
      toast.error("Masukkan teks data CSV terlebih dahulu");
      return;
    }
    if (!selectedTaId) {
      toast.error("Pilih tahun ajaran");
      return;
    }

    setImporting(true);
    try {
      const lines = csvText.trim().split("\n");
      const parsedItems: Array<{
        tgl_mulai: string;
        tgl_selesai: string;
        jenis: JenisKegiatanKalender;
        keterangan: string;
        memotong_minggu_efektif: boolean;
      }> = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || (i === 0 && line.toLowerCase().includes("tgl_mulai"))) {
          continue;
        }

        const delimiter = line.includes(";") ? ";" : ",";
        const parts = line.split(delimiter).map((p) => p.trim().replace(/^["']|["']$/g, ""));

        if (parts.length >= 4) {
          const tgl_mulai = parts[0];
          const tgl_selesai = parts[1];
          const jenisRaw = parts[2].toLowerCase();
          const keterangan = parts[3];
          const memotongRaw = parts[4]?.toLowerCase();

          let jenis: JenisKegiatanKalender = "lainnya";
          if (["libur", "asesmen", "matsama", "ramadhan", "kegiatan_madrasah"].includes(jenisRaw)) {
            jenis = jenisRaw as JenisKegiatanKalender;
          }

          const memotong =
            memotongRaw === "1" ||
            memotongRaw === "true" ||
            memotongRaw === "ya" ||
            memotongRaw === "y";

          parsedItems.push({
            tgl_mulai,
            tgl_selesai,
            jenis,
            keterangan,
            memotong_minggu_efektif: memotong,
          });
        }
      }

      if (parsedItems.length === 0) {
        throw new Error("Format CSV tidak valid. Gunakan format: tgl_mulai,tgl_selesai,jenis,keterangan");
      }

      const res = await importKalenderCsvAction(selectedTaId, parsedItems);
      if (res.success) {
        toast.success(`Berhasil mengimpor ${res.count} kegiatan kalender!`);
        setCsvOpen(false);
        setCsvText("");
        await reloadKegiatan(selectedTaId);
      } else {
        toast.error(res.error || "Gagal mengimpor");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses data CSV");
    } finally {
      setImporting(false);
    }
  }

  // Pre-calculate active TA year for July–June
  const activeTaObj = initialTaList.find((t) => t.id === selectedTaId);
  const startYear = useMemo(() => {
    if (!activeTaObj?.nama) return 2026;
    const match = activeTaObj.nama.match(/(\d{4})/);
    return match ? parseInt(match[1], 10) : 2026;
  }, [activeTaObj]);

  // Group events by month for the visual 12-month calendar (Juli s.d. Juni)
  const monthlyEvents = useMemo(() => {
    const map: { [monthIdx: number]: KalenderItem[] } = {};
    for (let i = 0; i < 12; i++) map[i] = [];

    data.forEach((item) => {
      const d = new Date(item.tgl_mulai);
      if (isNaN(d.getTime())) return;
      const month = d.getMonth();
      const idx = month >= 6 ? month - 6 : month + 6;
      if (map[idx]) {
        map[idx].push(item);
      }
    });

    return map;
  }, [data]);

  const columns: Column<KalenderItem>[] = [
    {
      key: "rentang",
      header: "Rentang Tanggal",
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs font-medium text-slate-800">
          {item.tgl_mulai} {item.tgl_mulai !== item.tgl_selesai ? `~ ${item.tgl_selesai}` : ""}
        </span>
      ),
    },
    {
      key: "jenis",
      header: "Jenis Kegiatan",
      sortable: true,
      render: (item) => {
        const conf = JENIS_OPTIONS.find((j) => j.value === item.jenis);
        return (
          <Badge className={`text-xs ${conf?.color || "bg-slate-100 text-slate-700"}`}>
            {conf?.label || item.jenis}
          </Badge>
        );
      },
    },
    {
      key: "keterangan",
      header: "Keterangan Agenda",
      render: (item) => (
        <span className="text-xs text-slate-900 font-medium">{item.keterangan}</span>
      ),
    },
    {
      key: "memotong",
      header: "Potong Pekan Efektif?",
      render: (item) => (
        <span
          className={`text-xs px-2 py-0.5 rounded font-medium ${
            item.memotong_minggu_efektif
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-slate-50 text-slate-500"
          }`}
        >
          {item.memotong_minggu_efektif ? "Ya (Memotong)" : "Tidak"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => handleOpenEdit(item)}
            className="text-slate-500 hover:text-slate-800"
            title="Edit"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={() => {
              setDeletingId(item.id);
              setDeleteOpen(true);
            }}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Hapus"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Catatan Regulasi Kanwil Kemenag Jawa Barat */}
      <Alert className="border-amber-200 bg-amber-50/70 text-amber-950">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertTitle className="font-semibold text-amber-900">
          Kalender Pendidikan Madrasah Kanwil Kemenag Jawa Barat
        </AlertTitle>
        <AlertDescription className="text-xs text-amber-800">
          Sesuaikan agenda kegiatan dengan Surat Keputusan Kepala Kanwil Kemenag Provinsi Jawa Barat
          mengenai Pedoman Kalender Pendidikan Madrasah tahun ajaran berjalan. Tanda &quot;Memotong Minggu Efektif&quot;
          akan otomatis mengurangi jumlah pekan efektif pada perhitungan Program Semester (Prosem) dan Prota.
        </AlertDescription>
      </Alert>

      {/* Header bar with Tahun Ajaran selector & actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <Label className="text-xs font-medium text-slate-600 whitespace-nowrap">
            Tahun Ajaran:
          </Label>
          <Select
            value={selectedTaId}
            onValueChange={(val) => handleTaChange(val || "")}
          >
            <SelectTrigger className="w-48 h-9 text-xs">
              <SelectValue placeholder="Pilih Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
              {initialTaList.map((ta) => (
                <SelectItem key={ta.id} value={ta.id} className="text-xs">
                  {ta.nama} {ta.aktif ? "(Aktif)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <div className="border border-slate-200 rounded-lg p-0.5 flex bg-slate-50 text-xs">
            <button
              onClick={() => setViewMode("both")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                viewMode === "both" ? "bg-white shadow-2xs text-emerald-700" : "text-slate-600"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                viewMode === "calendar" ? "bg-white shadow-2xs text-emerald-700" : "text-slate-600"
              }`}
            >
              Kalender
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                viewMode === "table" ? "bg-white shadow-2xs text-emerald-700" : "text-slate-600"
              }`}
            >
              Tabel
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCsvOpen(true)}
            className="text-xs gap-1.5 border-slate-300 text-slate-700"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Impor CSV
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Tambah Kegiatan
          </Button>
        </div>
      </div>

      {/* Visual Monthly Calendar Grid (Juli s.d. Juni) */}
      {(viewMode === "both" || viewMode === "calendar") && (
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                <CalendarDays className="h-4 w-4 text-emerald-600" />
                Matriks Kalender Bulanan (Juli {startYear} – Juni {startYear + 1})
              </CardTitle>
              <div className="flex flex-wrap gap-2 text-xs">
                {JENIS_OPTIONS.map((j) => (
                  <span key={j.value} className="flex items-center gap-1 text-[11px] text-slate-600">
                    <span className={`w-2.5 h-2.5 rounded-full ${j.color.split(" ")[0]}`} />
                    {j.label.split(" ")[0]}
                  </span>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {MONTH_NAMES.map((mName, idx) => {
                const yearNumber = idx < 6 ? startYear : startYear + 1;
                const events = monthlyEvents[idx] || [];
                const isSemester1 = idx < 6;

                return (
                  <div
                    key={mName}
                    className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50 flex flex-col min-h-36 hover:border-emerald-300 transition"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-2">
                      <span className="font-semibold text-xs text-slate-900">
                        {mName} {yearNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {isSemester1 ? "Smt 1" : "Smt 2"}
                      </span>
                    </div>

                    <div className="space-y-1.5 flex-1 overflow-y-auto max-h-40">
                      {events.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">
                          Tidak ada agenda khusus
                        </span>
                      ) : (
                        events.map((ev) => {
                          const conf = JENIS_OPTIONS.find((j) => j.value === ev.jenis);
                          return (
                            <div
                              key={ev.id}
                              className={`p-1.5 rounded text-[11px] border leading-tight ${
                                conf?.color || "bg-white text-slate-700"
                              }`}
                            >
                              <div className="font-semibold font-mono text-[10px]">
                                {ev.tgl_mulai.substring(8, 10)}
                                {ev.tgl_mulai !== ev.tgl_selesai
                                  ? ` - ${ev.tgl_selesai.substring(8, 10)}`
                                  : ""}
                              </div>
                              <div className="line-clamp-2 mt-0.5">{ev.keterangan}</div>
                              {ev.memotong_minggu_efektif && (
                                <span className="inline-block mt-0.5 text-[9px] bg-red-600 text-white px-1 rounded">
                                  Potong JP
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* DataTable Daftar Kegiatan */}
      {(viewMode === "both" || viewMode === "table") && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Daftar Lengkap Kegiatan Kalender Pendidikan
          </h4>
          <DataTable
            data={data}
            columns={columns}
            keyExtractor={(item) => item.id}
            isLoading={loading}
            pageSize={20}
            searchPlaceholder="Cari agenda kegiatan kalender..."
            searchFilter={(item, q) =>
              item.keterangan.toLowerCase().includes(q.toLowerCase()) ||
              item.jenis.toLowerCase().includes(q.toLowerCase()) ||
              item.tgl_mulai.includes(q)
            }
            emptyTitle="Belum Ada Kegiatan Kalender"
            emptyDescription="Tambahkan kegiatan manual atau gunakan fitur 'Impor CSV' di atas."
          />
        </div>
      )}

      {/* Dialog Form Tambah / Edit */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Agenda Kegiatan" : "Tambah Agenda Kegiatan Kalender"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Tentukan rentang tanggal, jenis kegiatan, dan status pemotongan minggu efektif.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="tgl_mulai_keg" className="text-xs font-medium">
                    Tgl Mulai <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tgl_mulai_keg"
                    type="date"
                    value={form.tgl_mulai}
                    onChange={(e) => setForm({ ...form, tgl_mulai: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tgl_selesai_keg" className="text-xs font-medium">
                    Tgl Selesai <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="tgl_selesai_keg"
                    type="date"
                    value={form.tgl_selesai}
                    onChange={(e) => setForm({ ...form, tgl_selesai: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="jenis_keg" className="text-xs font-medium">
                  Jenis Kegiatan <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.jenis}
                  onValueChange={(val) => {
                    if (val) setForm({ ...form, jenis: val as JenisKegiatanKalender });
                  }}
                >
                  <SelectTrigger id="jenis_keg" className="text-xs">
                    <SelectValue placeholder="Pilih Jenis Kegiatan" />
                  </SelectTrigger>
                  <SelectContent>
                    {JENIS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="keterangan_keg" className="text-xs font-medium">
                  Keterangan Agenda <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="keterangan_keg"
                  rows={3}
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  placeholder="Contoh: Asesmen Sumatif Tengah Semester (ASTS) Ganjil"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <Checkbox
                  id="memotong_pekan"
                  checked={form.memotong_minggu_efektif}
                  onCheckedChange={(c) =>
                    setForm({ ...form, memotong_minggu_efektif: !!c })
                  }
                />
                <Label htmlFor="memotong_pekan" className="text-xs cursor-pointer">
                  Memotong Minggu Efektif Pembelajaran (Libur/Asesmen/Kegiatan non-KBM)
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                {editingItem ? "Simpan Perubahan" : "Tambah"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Impor CSV */}
      <Dialog open={csvOpen} onOpenChange={setCsvOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Impor Kalender Pendidikan dari CSV
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tempel data CSV kegiatan kalender pendidikan. Format per baris:
              <br />
              <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono mt-1 inline-block">
                tgl_mulai,tgl_selesai,jenis,keterangan,memotong_minggu_efektif
              </code>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 font-medium">
                Contoh Teks CSV:
              </Label>
              <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[11px] font-mono text-slate-600 select-all">
                2026-07-13,2026-07-15,matsama,MATSAMA Kelas VII,true
                <br />
                2026-08-17,2026-08-17,libur,HUT Kemerdekaan RI Ke-81,true
                <br />
                2026-09-21,2026-09-26,asesmen,Asesmen Sumatif Tengah Semester Ganjil,true
                <br />
                2026-12-21,2027-01-02,libur,Libur Semester Ganjil,true
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="csv_content" className="text-xs font-medium">
                Tempel Isi CSV di Sini:
              </Label>
              <Textarea
                id="csv_content"
                rows={8}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="2026-07-13,2026-07-15,matsama,MATSAMA Kelas VII,true..."
                className="font-mono text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCsvOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleImportCsv}
              disabled={importing || !csvText.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {importing && <Loader2 className="h-4 w-4 animate-spin" />}
              {importing ? "Memproses Impor..." : "Mulai Impor CSV"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog Hapus */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Agenda Kalender"
        description="Apakah Anda yakin ingin menghapus agenda kegiatan kalender pendidikan ini?"
        variant="destructive"
        confirmText="Ya, Hapus"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
