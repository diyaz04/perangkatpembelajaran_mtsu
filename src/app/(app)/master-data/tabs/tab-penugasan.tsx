"use client";

import React, { useState } from "react";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Loader2, Clock, FileSpreadsheet, Download, CheckCircle2, AlertCircle, XCircle, Info } from "lucide-react";
import {
  getPenugasanAction,
  createPenugasanAction,
  updatePenugasanAction,
  deletePenugasanAction,
  importPenugasanAction,
  type PenugasanItem,
  type MapelItem,
  type TahunAjaranItem,
  type ImportPenugasanRowResult,
} from "../actions";

interface GuruProfile {
  id: string;
  nama_lengkap: string;
  nip: string | null;
  gelar: string | null;
  role: string;
}

const TINGKAT_MAP: Record<7 | 8 | 9, { roman: string; defaultRombel: string[] }> = {
  7: { roman: "VII", defaultRombel: ["7A", "7B", "7C", "7D"] },
  8: { roman: "VIII", defaultRombel: ["8A", "8B", "8C", "8D"] },
  9: { roman: "IX", defaultRombel: ["9A", "9B", "9C", "9D"] },
};

interface TabPenugasanProps {
  initialData: PenugasanItem[];
  initialGuru: GuruProfile[];
  initialMapel: MapelItem[];
  initialTaList: TahunAjaranItem[];
}

export function TabPenugasan({
  initialData,
  initialGuru,
  initialMapel,
  initialTaList,
}: TabPenugasanProps) {
  const [data, setData] = useState<PenugasanItem[]>(initialData);
  const activeTa = initialTaList.find((ta) => ta.aktif) || initialTaList[0];
  const [selectedTaId, setSelectedTaId] = useState<string>(activeTa?.id || "");
  const [loading, setLoading] = useState(false);

  // Dialog Form
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PenugasanItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<{
    guru_id: string;
    mapel_id: string;
    tingkat_kelas: 7 | 8 | 9;
    rombel: string;
  }>({
    guru_id: initialGuru[0]?.id || "",
    mapel_id: initialMapel[0]?.id || "",
    tingkat_kelas: 7,
    rombel: "7A, 7B",
  });

  // Confirm Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Dialog State: Import Excel
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importTaId, setImportTaId] = useState<string>(activeTa?.id || "");
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{
    totalRows: number;
    berhasilCount: number;
    gagalCount: number;
    message?: string;
    results: ImportPenugasanRowResult[];
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  function closeImportDialog() {
    setImportOpen(false);
    setImportFile(null);
    setImportResults(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!importFile) {
      toast.error("Pilih file Excel (.xlsx) terlebih dahulu.");
      return;
    }

    setImporting(true);
    setImportResults(null);

    const formData = new FormData();
    formData.append("file", importFile);
    formData.append("tahun_ajaran_id", importTaId || selectedTaId);

    const res = await importPenugasanAction(formData);
    setImporting(false);

    if (res.success && res.results) {
      setImportResults({
        totalRows: res.totalRows || 0,
        berhasilCount: res.berhasilCount || 0,
        gagalCount: res.gagalCount || 0,
        message: res.message,
        results: res.results,
      });

      if (res.berhasilCount && res.berhasilCount > 0) {
        toast.success(res.message || "Import penugasan berhasil.");
        await reloadPenugasan(selectedTaId);
      } else {
        toast.error(res.message || "Semua baris pada file gagal diimport.");
      }
    } else {
      toast.error(res.message || "Gagal memproses file Excel.");
    }
  }

  async function reloadPenugasan(taId: string) {
    setLoading(true);
    const res = await getPenugasanAction(taId);
    if (res.data) setData(res.data);
    setLoading(false);
  }

  function handleTaChange(taId: string) {
    setSelectedTaId(taId);
    void reloadPenugasan(taId);
  }

  function handleOpenCreate() {
    setEditingItem(null);
    setForm({
      guru_id: initialGuru[0]?.id || "",
      mapel_id: initialMapel[0]?.id || "",
      tingkat_kelas: 7,
      rombel: "7A",
    });
    setFormOpen(true);
  }

  function handleOpenEdit(item: PenugasanItem) {
    setEditingItem(item);
    setForm({
      guru_id: item.guru_id,
      mapel_id: item.mapel_id,
      tingkat_kelas: item.tingkat_kelas,
      rombel: item.rombel,
    });
    setFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.guru_id || !form.mapel_id || !selectedTaId) {
      toast.error("Lengkapi data guru dan mapel");
      return;
    }

    setSaving(true);
    if (editingItem) {
      const res = await updatePenugasanAction(editingItem.id, {
        ...form,
        tahun_ajaran_id: selectedTaId,
      });
      if (res.success) {
        toast.success("Penugasan guru berhasil diperbarui");
        setFormOpen(false);
        await reloadPenugasan(selectedTaId);
      } else {
        toast.error(res.error || "Gagal memperbarui penugasan");
      }
    } else {
      const res = await createPenugasanAction({
        ...form,
        tahun_ajaran_id: selectedTaId,
      });
      if (res.success) {
        toast.success("Penugasan guru berhasil ditambahkan");
        setFormOpen(false);
        await reloadPenugasan(selectedTaId);
      } else {
        toast.error(res.error || "Gagal menambah penugasan");
      }
    }
    setSaving(false);
  }

  async function handleDeleteConfirm() {
    if (!deletingId) return;
    const res = await deletePenugasanAction(deletingId);
    if (res.success) {
      toast.success("Penugasan berhasil dihapus");
      setDeleteOpen(false);
      setDeletingId(null);
      await reloadPenugasan(selectedTaId);
    } else {
      toast.error(res.error || "Gagal menghapus penugasan");
    }
  }

  function toggleRombelOption(rombelCode: string) {
    const currentList = form.rombel
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    let nextList: string[];
    if (currentList.includes(rombelCode)) {
      nextList = currentList.filter((r) => r !== rombelCode);
    } else {
      nextList = [...currentList, rombelCode];
    }

    setForm({ ...form, rombel: nextList.join(", ") });
  }

  const selectedMapel = initialMapel.find((m) => m.id === form.mapel_id);
  const rombelsCount = form.rombel.split(",").filter((r) => r.trim()).length;
  let jpPerRombel = 2;
  if (selectedMapel) {
    if (form.tingkat_kelas === 7) jpPerRombel = selectedMapel.jp_per_minggu_kls7;
    else if (form.tingkat_kelas === 8) jpPerRombel = selectedMapel.jp_per_minggu_kls8;
    else if (form.tingkat_kelas === 9) jpPerRombel = selectedMapel.jp_per_minggu_kls9;
  }
  const totalJpPreview = jpPerRombel * Math.max(1, rombelsCount);

  const columns: Column<PenugasanItem>[] = [
    {
      key: "guru",
      header: "Guru Pengampu",
      sortable: true,
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 text-sm">
            {item.guru_nama}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            NIP: {item.guru_nip}
          </span>
        </div>
      ),
    },
    {
      key: "mapel",
      header: "Mata Pelajaran",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <Badge className="bg-slate-100 text-slate-800 font-mono text-[11px]">
            {item.mapel_kode}
          </Badge>
          <span className="font-medium text-slate-800 text-xs">
            {item.mapel_nama}
          </span>
        </div>
      ),
    },
    {
      key: "tingkat",
      header: "Tingkat",
      sortable: true,
      className: "w-24",
      render: (item) => {
        const roman = TINGKAT_MAP[item.tingkat_kelas]?.roman || item.tingkat_kelas;
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold">
            Kelas {roman}
          </Badge>
        );
      },
    },
    {
      key: "rombel",
      header: "Rombongan Belajar (Rombel)",
      render: (item) => {
        const rombels = item.rombel.split(",").map((r) => r.trim()).filter(Boolean);
        return (
          <div className="flex flex-wrap gap-1">
            {rombels.map((r) => (
              <span
                key={r}
                className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] px-1.5 py-0.5 rounded font-medium"
              >
                {r}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      key: "jp",
      header: "Beban JP / Minggu",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
          <Clock className="h-3.5 w-3.5 text-emerald-600" />
          <span>{item.jp_per_minggu} JP / Minggu</span>
        </div>
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Penugasan Mengajar Guru MTs
          </h3>
          <p className="text-xs text-slate-500">
            Pemetaan guru pengampu ke mata pelajaran, tingkat kelas (VII/VIII/IX), dan rombel untuk tahun ajaran aktif.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={selectedTaId}
            onValueChange={(val) => handleTaChange(val || "")}
          >
            <SelectTrigger className="w-48 h-9 text-xs">
              <SelectValue placeholder="Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
              {initialTaList.map((ta) => (
                <SelectItem key={ta.id} value={ta.id} className="text-xs">
                  {ta.nama} {ta.aktif ? "(Aktif)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setImportOpen(true);
              setImportFile(null);
              setImportResults(null);
              setImportTaId(selectedTaId);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="border-emerald-200 text-emerald-800 hover:bg-emerald-50 gap-1.5 text-xs h-9 font-medium"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Import Excel
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs h-9"
          >
            <Plus className="h-4 w-4" /> Tambah Penugasan
          </Button>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        pageSize={20}
        searchPlaceholder="Cari nama guru, mapel, atau rombel..."
        searchFilter={(item, q) =>
          (item.guru_nama || "").toLowerCase().includes(q.toLowerCase()) ||
          (item.mapel_nama || "").toLowerCase().includes(q.toLowerCase()) ||
          item.rombel.toLowerCase().includes(q.toLowerCase())
        }
        emptyTitle="Belum Ada Penugasan Guru"
        emptyDescription="Silakan tambahkan data penugasan guru dengan tombol di atas."
      />

      {/* Dialog Form Tambah / Edit */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Penugasan Guru" : "Tambah Penugasan Guru Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Pilih guru, mata pelajaran, tingkat kelas, dan rombongan belajar.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="penugasan_guru" className="text-xs font-medium">
                  Guru Pengampu <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.guru_id}
                  onValueChange={(val) => {
                    if (val) setForm({ ...form, guru_id: val });
                  }}
                >
                  <SelectTrigger id="penugasan_guru" className="text-xs">
                    <SelectValue placeholder="Pilih Guru" />
                  </SelectTrigger>
                  <SelectContent>
                    {initialGuru.map((g) => (
                      <SelectItem key={g.id} value={g.id} className="text-xs">
                        {g.nama_lengkap} {g.gelar ? `, ${g.gelar}` : ""} {g.nip ? `(NIP: ${g.nip})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="penugasan_mapel" className="text-xs font-medium">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.mapel_id}
                  onValueChange={(val) => {
                    if (val) setForm({ ...form, mapel_id: val });
                  }}
                >
                  <SelectTrigger id="penugasan_mapel" className="text-xs">
                    <SelectValue placeholder="Pilih Mata Pelajaran" />
                  </SelectTrigger>
                  <SelectContent>
                    {initialMapel.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs">
                        [{m.kode}] {m.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="penugasan_tingkat" className="text-xs font-medium">
                  Tingkat Kelas <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={String(form.tingkat_kelas)}
                  onValueChange={(val) => {
                    if (val) {
                      const t = parseInt(val, 10) as 7 | 8 | 9;
                      setForm({
                        ...form,
                        tingkat_kelas: t,
                        rombel: `${t}A`,
                      });
                    }
                  }}
                >
                  <SelectTrigger id="penugasan_tingkat" className="text-xs">
                    <SelectValue placeholder="Pilih Tingkat" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7" className="text-xs">
                      Kelas VII (Tujuh) - Fase D
                    </SelectItem>
                    <SelectItem value="8" className="text-xs">
                      Kelas VIII (Delapan) - Fase D
                    </SelectItem>
                    <SelectItem value="9" className="text-xs">
                      Kelas IX (Sembilan) - Fase D
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(() => {
                const selectedMapel = initialMapel.find((m) => m.id === form.mapel_id);
                if (!selectedMapel) return null;
                const jpVal =
                  selectedMapel.jp_default?.[String(form.tingkat_kelas)] ||
                  (form.tingkat_kelas === 7
                    ? selectedMapel.jp_per_minggu_kls7
                    : form.tingkat_kelas === 8
                    ? selectedMapel.jp_per_minggu_kls8
                    : selectedMapel.jp_per_minggu_kls9) ||
                  2;
                return (
                  <div className="rounded-lg bg-emerald-50/80 border border-emerald-200 p-2.5 text-xs text-emerald-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-semibold text-emerald-800">Alokasi Waktu Kurikulum Resmi:</span>
                        <span className="text-[11px] text-emerald-600 block">Sesuai KMA 1503/2025 Fase D</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-white text-emerald-700 font-bold border-emerald-300 px-2 py-0.5">
                      {jpVal} JP / Minggu
                    </Badge>
                  </div>
                );
              })()}

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="penugasan_rombel" className="text-xs font-medium">
                    Rombongan Belajar (Rombel) <span className="text-red-500">*</span>
                  </Label>
                  <span className="text-[11px] text-slate-400">
                    Klik opsi di bawah atau ketik manual
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {TINGKAT_MAP[form.tingkat_kelas]?.defaultRombel.map((rc) => {
                    const isSelected = form.rombel
                      .split(",")
                      .map((x) => x.trim())
                      .includes(rc);
                    return (
                      <button
                        key={rc}
                        type="button"
                        onClick={() => toggleRombelOption(rc)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium border transition ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300"
                        }`}
                      >
                        {rc}
                      </button>
                    );
                  })}
                </div>

                <Input
                  id="penugasan_rombel"
                  value={form.rombel}
                  onChange={(e) => setForm({ ...form, rombel: e.target.value })}
                  placeholder="Contoh: 7A, 7B, 7C"
                  required
                />
              </div>

              {/* Preview JP per minggu */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-950 flex items-center justify-between">
                <div>
                  <span className="font-semibold block text-emerald-900">
                    Kalkulasi JP per Minggu
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    {jpPerRombel} JP x {rombelsCount} rombel
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-emerald-700">
                    {totalJpPreview} JP
                  </span>
                  <span className="text-[10px] block text-emerald-600">/ pekan</span>
                </div>
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
                {editingItem ? "Simpan Perubahan" : "Simpan Penugasan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog Hapus */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Penugasan Guru"
        description="Apakah Anda yakin ingin menghapus penugasan guru ini? Dokumen perangkat ajar milik guru yang terikat ke penugasan ini mungkin terpengaruh."
        variant="destructive"
        confirmText="Ya, Hapus"
        onConfirm={handleDeleteConfirm}
      />

      {/* Dialog: Import Penugasan Guru dari Excel */}
      <Dialog open={importOpen} onOpenChange={(open) => !open && closeImportDialog()}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white">
          <DialogHeader className="p-5 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Import Penugasan Guru dari Excel
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">
                  Unggah file Excel penugasan. Template telah terintegrasi validasi dropdown pengguna/guru terdaftar.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Step 1: Download Template */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Download className="h-3.5 w-3.5 text-emerald-600" /> Unduh Template Format Excel
                </span>
                <a
                  href={`/api/master-data/penugasan/template?taId=${importTaId || selectedTaId}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-50 px-2.5 py-1.5 rounded-md shadow-xs transition"
                >
                  <Download className="h-3.5 w-3.5" /> Unduh Template (.xlsx)
                </a>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Template ini secara otomatis menyediakan <strong>dropdown validasi</strong> yang berisi <strong>daftar guru terdaftar</strong> di madrasah, <strong>kode mata pelajaran</strong>, dan <strong>tingkat kelas</strong>.
              </p>
            </div>

            {/* Form Upload */}
            <form id="import-penugasan-form" onSubmit={handleImportSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="import_ta" className="text-xs font-medium text-slate-700">
                  Target Tahun Ajaran <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={importTaId}
                  onValueChange={(val) => {
                    if (val) setImportTaId(val);
                  }}
                  disabled={importing}
                >
                  <SelectTrigger id="import_ta" className="text-xs h-9">
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

              <div className="space-y-1">
                <Label htmlFor="import_penugasan_file" className="text-xs font-medium text-slate-700">
                  Pilih File Excel (.xlsx) <span className="text-red-500">*</span>
                </Label>
                <Input
                  ref={fileInputRef}
                  id="import_penugasan_file"
                  type="file"
                  accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  disabled={importing}
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setImportFile(file);
                    setImportResults(null);
                  }}
                  className="text-xs h-9 cursor-pointer file:cursor-pointer file:text-xs file:font-semibold file:text-emerald-700 file:bg-emerald-50 file:border-0 file:rounded-md file:mr-2"
                />
                <p className="text-[11px] text-slate-500">Maksimal ukuran file: 5 MB.</p>
              </div>
            </form>

            {/* Hasil Import */}
            {importResults && (
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">Hasil Pemrosesan File</h4>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                      Total: {importResults.totalRows}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                      Berhasil: {importResults.berhasilCount}
                    </span>
                    {importResults.gagalCount > 0 && (
                      <span className="bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                        Gagal: {importResults.gagalCount}
                      </span>
                    )}
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-md divide-y divide-slate-100 text-xs">
                  {importResults.results.map((res, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 flex items-start justify-between gap-3 ${
                        res.status === "berhasil" ? "bg-emerald-50/40" : "bg-red-50/50"
                      }`}
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-400">#{res.rowNumber}</span>
                          <span className="font-semibold text-slate-800 truncate">{res.guru_nama}</span>
                          <span className="text-[11px] text-slate-500 font-medium">({res.mapel_nama})</span>
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                            {res.tingkat_kelas} - {res.rombel}
                          </Badge>
                        </div>
                        <p className={`text-[11px] ${res.status === "berhasil" ? "text-emerald-700" : "text-red-600"}`}>
                          {res.message}
                        </p>
                      </div>

                      <div className="shrink-0 pt-0.5">
                        {res.status === "berhasil" ? (
                          <Badge className="bg-emerald-600 text-white text-[10px] gap-1 px-1.5">
                            <CheckCircle2 className="h-3 w-3" />
                            {res.action === "diperbarui" ? "Diperbarui" : "Berhasil"}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] gap-1 px-1.5">
                            <XCircle className="h-3 w-3" /> Gagal
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeImportDialog}
              disabled={importing}
              className="text-xs"
            >
              {importResults ? "Tutup" : "Batal"}
            </Button>
            <Button
              type="submit"
              form="import-penugasan-form"
              size="sm"
              disabled={importing || !importFile}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs font-semibold"
            >
              {importing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Memproses File...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Proses Import Excel
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
