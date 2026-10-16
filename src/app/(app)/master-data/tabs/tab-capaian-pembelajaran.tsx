"use client";

import React, { useState } from "react";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import {
  getCapaianPembelajaranAction,
  createCapaianPembelajaranAction,
  updateCapaianPembelajaranAction,
  deleteCapaianPembelajaranAction,
  importCapaianPembelajaranAction,
  type CapaianPembelajaranItem,
  type MapelItem,
} from "../actions";

interface TabCapaianPembelajaranProps {
  initialData: CapaianPembelajaranItem[];
  initialMapel: MapelItem[];
}

export function TabCapaianPembelajaran({
  initialData,
  initialMapel,
}: TabCapaianPembelajaranProps) {
  const [data, setData] = useState<CapaianPembelajaranItem[]>(initialData);
  const [selectedMapelId, setSelectedMapelId] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  // Form Dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CapaianPembelajaranItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    mapel_id: initialMapel[0]?.id || "",
    elemen: "",
    deskripsi_cp: "",
    sumber_regulasi: "KMA 1503/2025",
  });

  // Import Dialog
  const [importOpen, setImportOpen] = useState(false);
  const [importTargetMapelId, setImportTargetMapelId] = useState(initialMapel[0]?.id || "");
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

  // Confirm Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function reloadCp(mapelId: string) {
    setLoading(true);
    const res = await getCapaianPembelajaranAction(mapelId);
    if (res.data) setData(res.data);
    setLoading(false);
  }

  function handleMapelFilterChange(mapelId: string) {
    setSelectedMapelId(mapelId);
    void reloadCp(mapelId);
  }

  function handleOpenCreate() {
    setEditingItem(null);
    setForm({
      mapel_id: selectedMapelId !== "all" ? selectedMapelId : (initialMapel[0]?.id || ""),
      elemen: "",
      deskripsi_cp: "",
      sumber_regulasi: "KMA 1503/2025",
    });
    setFormOpen(true);
  }

  function handleOpenEdit(item: CapaianPembelajaranItem) {
    setEditingItem(item);
    setForm({
      mapel_id: item.mapel_id,
      elemen: item.elemen,
      deskripsi_cp: item.deskripsi_cp,
      sumber_regulasi: item.sumber_regulasi,
    });
    setFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.mapel_id || !form.elemen || !form.deskripsi_cp) {
      toast.error("Lengkapi seluruh field yang wajib diisi");
      return;
    }

    setSaving(true);
    if (editingItem) {
      const res = await updateCapaianPembelajaranAction(editingItem.id, form);
      if (res.success) {
        toast.success("Capaian Pembelajaran berhasil diperbarui");
        setFormOpen(false);
        await reloadCp(selectedMapelId);
      } else {
        toast.error(res.error || "Gagal memperbarui CP");
      }
    } else {
      const res = await createCapaianPembelajaranAction(form);
      if (res.success) {
        toast.success("Capaian Pembelajaran berhasil ditambahkan");
        setFormOpen(false);
        await reloadCp(selectedMapelId);
      } else {
        toast.error(res.error || "Gagal menambah CP");
      }
    }
    setSaving(false);
  }

  async function handleDeleteConfirm() {
    if (!deletingId) return;
    const res = await deleteCapaianPembelajaranAction(deletingId);
    if (res.success) {
      toast.success("Capaian Pembelajaran berhasil dihapus");
      setDeleteOpen(false);
      setDeletingId(null);
      await reloadCp(selectedMapelId);
    } else {
      toast.error(res.error || "Gagal menghapus CP");
    }
  }

  async function handleImport() {
    if (!importTargetMapelId) {
      toast.error("Pilih mata pelajaran tujuan impor");
      return;
    }
    if (!importText.trim()) {
      toast.error("Tempel teks data CP terlebih dahulu");
      return;
    }

    setImporting(true);
    try {
      const lines = importText.trim().split("\n");
      const itemsToImport: Array<{ elemen: string; deskripsi_cp: string; sumber_regulasi?: string }> = [];

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let parts: string[];
        if (trimmed.includes("|")) {
          parts = trimmed.split("|").map((p) => p.trim());
        } else if (trimmed.includes("\t")) {
          parts = trimmed.split("\t").map((p) => p.trim());
        } else {
          parts = trimmed.split(",").map((p) => p.trim());
        }

        if (parts.length >= 2) {
          itemsToImport.push({
            elemen: parts[0],
            deskripsi_cp: parts[1],
            sumber_regulasi: parts[2] || "KMA 1503/2025",
          });
        }
      }

      if (itemsToImport.length === 0) {
        throw new Error("Format tidak valid. Gunakan format 'Elemen | Deskripsi'");
      }

      const res = await importCapaianPembelajaranAction(importTargetMapelId, itemsToImport);
      if (res.success) {
        toast.success(`Berhasil mengimpor ${res.count} elemen CP!`);
        setImportOpen(false);
        setImportText("");
        await reloadCp(selectedMapelId);
      } else {
        toast.error(res.error || "Gagal mengimpor CP");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses impor");
    } finally {
      setImporting(false);
    }
  }

  const columns: Column<CapaianPembelajaranItem>[] = [
    {
      key: "elemen",
      header: "Elemen CP",
      sortable: true,
      className: "w-48",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 text-sm">{item.elemen}</span>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px]">
              Fase {item.fase}
            </Badge>
            <Badge className="bg-slate-100 text-slate-600 font-mono text-[10px]">
              {item.mapel_kode || "MAPEL"}
            </Badge>
          </div>
        </div>
      ),
    },
    {
      key: "deskripsi",
      header: "Deskripsi Capaian Pembelajaran",
      render: (item) => (
        <div className="space-y-1">
          <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
            {item.deskripsi_cp}
          </p>
          <span className="text-[10px] text-slate-400 font-mono block">
            Sumber: {item.sumber_regulasi}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right w-24",
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
            Capaian Pembelajaran (CP) Fase D - KMA 1503/2025
          </h3>
          <p className="text-xs text-slate-500">
            Elemen dan deskripsi capaian pembelajaran per mata pelajaran sebagai rujukan penyusunan TP dan ATP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={selectedMapelId}
            onValueChange={(val) => handleMapelFilterChange(val || "all")}
          >
            <SelectTrigger className="w-52 h-9 text-xs">
              <SelectValue placeholder="Filter Mata Pelajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Semua Mata Pelajaran
              </SelectItem>
              {initialMapel.map((m) => (
                <SelectItem key={m.id} value={m.id} className="text-xs">
                  [{m.kode}] {m.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            className="text-xs gap-1.5 border-slate-300 text-slate-700 h-9"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Impor / Tempel CP
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs h-9"
          >
            <Plus className="h-4 w-4" /> Tambah Elemen CP
          </Button>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        pageSize={20}
        searchPlaceholder="Cari elemen atau kata kunci capaian pembelajaran..."
        searchFilter={(item, q) =>
          item.elemen.toLowerCase().includes(q.toLowerCase()) ||
          item.deskripsi_cp.toLowerCase().includes(q.toLowerCase()) ||
          (item.mapel_nama || "").toLowerCase().includes(q.toLowerCase())
        }
        emptyTitle="Belum Ada Capaian Pembelajaran"
        emptyDescription="Pilih mata pelajaran lain atau gunakan tombol 'Impor / Tempel CP' untuk mengisi elemen CP secara instan."
      />

      {/* Dialog Form Tambah / Edit */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Elemen CP" : "Tambah Elemen Capaian Pembelajaran"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Elemen CP Fase D mengacu pada regulasi KMA 1503 Tahun 2025 atau panduan resmi BSKAP/Kemenag.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="cp_mapel" className="text-xs font-medium">
                  Mata Pelajaran <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.mapel_id}
                  onValueChange={(val) => setForm({ ...form, mapel_id: val || "" })}
                >
                  <SelectTrigger id="cp_mapel" className="text-xs">
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

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="cp_elemen" className="text-xs font-medium">
                    Nama Elemen <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="cp_elemen"
                    value={form.elemen}
                    onChange={(e) => setForm({ ...form, elemen: e.target.value })}
                    placeholder="Contoh: Bilangan, Aljabar, Fikih Ibadah"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cp_regulasi" className="text-xs font-medium">
                    Sumber Regulasi
                  </Label>
                  <Input
                    id="cp_regulasi"
                    value={form.sumber_regulasi}
                    onChange={(e) =>
                      setForm({ ...form, sumber_regulasi: e.target.value })
                    }
                    placeholder="KMA 1503/2025"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="cp_deskripsi" className="text-xs font-medium">
                  Deskripsi Capaian Pembelajaran (Paragraf CP) <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="cp_deskripsi"
                  rows={5}
                  value={form.deskripsi_cp}
                  onChange={(e) =>
                    setForm({ ...form, deskripsi_cp: e.target.value })
                  }
                  placeholder="Pada akhir fase D, peserta didik dapat memahami dan menerapkan..."
                  required
                />
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
                {editingItem ? "Simpan Perubahan" : "Simpan Elemen CP"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Impor / Tempel Teks */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Impor Elemen Capaian Pembelajaran
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tempel daftar elemen dan deskripsi CP. Format satu baris per elemen:
              <br />
              <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono mt-1 inline-block">
                Elemen | Deskripsi Paragraf CP | Sumber Regulasi (opsional)
              </code>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="target_mapel" className="text-xs font-medium">
                Mata Pelajaran Tujuan Impor <span className="text-red-500">*</span>
              </Label>
              <Select
                value={importTargetMapelId}
                onValueChange={(val) => setImportTargetMapelId(val || "")}
              >
                <SelectTrigger id="target_mapel" className="text-xs">
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
              <Label className="text-xs text-slate-500 font-medium">
                Contoh Teks:
              </Label>
              <div className="bg-slate-50 border border-slate-200 rounded p-2 text-[11px] font-mono text-slate-600 select-all">
                Bilangan | Pada akhir fase D peserta didik dapat membaca menulis dan membandingkan bilangan bulat. | KMA 1503/2025
                <br />
                Aljabar | Peserta didik dapat mengenali pola dan menyelesaikan persamaan linear satu variabel. | KMA 1503/2025
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="import_content" className="text-xs font-medium">
                Tempel Konten di Sini:
              </Label>
              <Textarea
                id="import_content"
                rows={8}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Elemen 1 | Deskripsi paragraf CP 1&#10;Elemen 2 | Deskripsi paragraf CP 2"
                className="font-mono text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleImport}
              disabled={importing || !importText.trim() || !importTargetMapelId}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {importing && <Loader2 className="h-4 w-4 animate-spin" />}
              {importing ? "Mengimpor..." : "Mulai Impor CP"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog Hapus */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Capaian Pembelajaran"
        description="Apakah Anda yakin ingin menghapus elemen capaian pembelajaran ini?"
        variant="destructive"
        confirmText="Ya, Hapus"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
