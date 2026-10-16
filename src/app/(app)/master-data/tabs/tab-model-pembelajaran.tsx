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
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  getModelPembelajaranAction,
  createModelPembelajaranAction,
  updateModelPembelajaranAction,
  deleteModelPembelajaranAction,
  type ModelPembelajaranItem,
} from "../actions";
import type { PengalamanBelajar } from "@/types/database";

const PENGALAMAN_CONFIG: Record<
  PengalamanBelajar,
  { label: string; badgeClass: string }
> = {
  memahami: {
    label: "Memahami",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
  },
  mengaplikasi: {
    label: "Mengaplikasi",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  merefleksi: {
    label: "Merefleksi",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
  },
};

interface TabModelPembelajaranProps {
  initialData: ModelPembelajaranItem[];
}

export function TabModelPembelajaran({ initialData }: TabModelPembelajaranProps) {
  const [data, setData] = useState<ModelPembelajaranItem[]>(initialData);
  const [loading, setLoading] = useState(false);

  // Form Dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ModelPembelajaranItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [modelNama, setModelNama] = useState("");
  const [sintaksList, setSintaksList] = useState<
    Array<{
      urutan: number;
      nama_sintaks: string;
      pengalaman_belajar: PengalamanBelajar;
    }>
  >([]);

  // Confirm Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function reloadData() {
    setLoading(true);
    const res = await getModelPembelajaranAction();
    if (res.data) setData(res.data);
    setLoading(false);
  }

  function handleOpenCreate() {
    setEditingItem(null);
    setModelNama("");
    setSintaksList([
      { urutan: 1, nama_sintaks: "Fase 1: Orientasi Masalah", pengalaman_belajar: "memahami" },
      { urutan: 2, nama_sintaks: "Fase 2: Eksplorasi & Investigasi", pengalaman_belajar: "mengaplikasi" },
      { urutan: 3, nama_sintaks: "Fase 3: Evaluasi & Refleksi", pengalaman_belajar: "merefleksi" },
    ]);
    setFormOpen(true);
  }

  function handleOpenEdit(item: ModelPembelajaranItem) {
    setEditingItem(item);
    setModelNama(item.nama);
    const mapped = (item.sintaks || []).map((s, idx) => ({
      urutan: s.urutan || idx + 1,
      nama_sintaks: s.nama_sintaks || "",
      pengalaman_belajar: (s.pengalaman_belajar || "memahami") as PengalamanBelajar,
    }));
    setSintaksList(mapped);
    setFormOpen(true);
  }

  function handleAddSintaks() {
    const nextUrutan = sintaksList.length + 1;
    setSintaksList([
      ...sintaksList,
      {
        urutan: nextUrutan,
        nama_sintaks: `Fase ${nextUrutan}: `,
        pengalaman_belajar: "mengaplikasi",
      },
    ]);
  }

  function handleRemoveSintaks(index: number) {
    const updated = sintaksList
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, urutan: idx + 1 }));
    setSintaksList(updated);
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const items = [...sintaksList];
    const temp = items[index - 1];
    items[index - 1] = items[index];
    items[index] = temp;
    setSintaksList(items.map((it, idx) => ({ ...it, urutan: idx + 1 })));
  }

  function handleMoveDown(index: number) {
    if (index === sintaksList.length - 1) return;
    const items = [...sintaksList];
    const temp = items[index + 1];
    items[index + 1] = items[index];
    items[index] = temp;
    setSintaksList(items.map((it, idx) => ({ ...it, urutan: idx + 1 })));
  }

  function handleUpdateSintaks(
    index: number,
    field: "nama_sintaks" | "pengalaman_belajar",
    value: string
  ) {
    const items = [...sintaksList];
    items[index] = {
      ...items[index],
      [field]: value,
    };
    setSintaksList(items);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!modelNama.trim()) {
      toast.error("Nama model pembelajaran wajib diisi");
      return;
    }
    if (sintaksList.length === 0) {
      toast.error("Tambahkan minimal 1 langkah sintaks");
      return;
    }

    setSaving(true);
    const payload = {
      nama: modelNama.trim(),
      sintaks: sintaksList.map((s, i) => ({
        urutan: i + 1,
        nama_sintaks: s.nama_sintaks.trim(),
        pengalaman_belajar: s.pengalaman_belajar,
      })),
    };

    if (editingItem) {
      const res = await updateModelPembelajaranAction(editingItem.id, payload);
      if (res.success) {
        toast.success("Model pembelajaran berhasil diperbarui");
        setFormOpen(false);
        await reloadData();
      } else {
        toast.error(res.error || "Gagal memperbarui model");
      }
    } else {
      const res = await createModelPembelajaranAction(payload);
      if (res.success) {
        toast.success("Model pembelajaran berhasil ditambahkan");
        setFormOpen(false);
        await reloadData();
      } else {
        toast.error(res.error || "Gagal menambah model");
      }
    }

    setSaving(false);
  }

  async function handleDeleteConfirm() {
    if (!deletingId) return;
    const res = await deleteModelPembelajaranAction(deletingId);
    if (res.success) {
      toast.success("Model pembelajaran berhasil dihapus");
      setDeleteOpen(false);
      setDeletingId(null);
      await reloadData();
    } else {
      toast.error(res.error || "Gagal menghapus model");
    }
  }

  const columns: Column<ModelPembelajaranItem>[] = [
    {
      key: "nama",
      header: "Nama Model Pembelajaran",
      sortable: true,
      className: "w-64",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 text-sm">{item.nama}</span>
          <span className="text-[11px] text-slate-500">
            {item.sintaks.length} Langkah Sintaks
          </span>
        </div>
      ),
    },
    {
      key: "sintaks",
      header: "Rangkaian Sintaks & Pengalaman Belajar",
      render: (item) => (
        <div className="space-y-1 py-1">
          {item.sintaks.length === 0 ? (
            <span className="text-xs text-slate-400 italic">Belum ada langkah sintaks</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {item.sintaks.map((s) => {
                const conf =
                  PENGALAMAN_CONFIG[
                    (s.pengalaman_belajar || "memahami") as PengalamanBelajar
                  ];
                return (
                  <div
                    key={s.urutan}
                    className="inline-flex items-center gap-1.5 border border-slate-200 rounded px-2 py-0.5 text-xs bg-white shadow-2xs"
                  >
                    <span className="font-bold text-slate-700 font-mono">
                      {s.urutan}.
                    </span>
                    <span className="text-slate-800 font-medium">{s.nama_sintaks}</span>
                    <Badge
                      className={`text-[10px] px-1 py-0 ${
                        conf?.badgeClass || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {conf?.label || s.pengalaman_belajar}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
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
            Model Pembelajaran & Editor Sintaks KBC
          </h3>
          <p className="text-xs text-slate-500">
            Pola langkah sintaks model pembelajaran terintegrasi 3 pengalaman belajar KBC: Memahami, Mengaplikasi, dan Merefleksi.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs h-9"
        >
          <Plus className="h-4 w-4" /> Tambah Model Pembelajaran
        </Button>
      </div>

      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        pageSize={20}
        searchPlaceholder="Cari nama model pembelajaran..."
        searchFilter={(item, q) =>
          item.nama.toLowerCase().includes(q.toLowerCase()) ||
          item.sintaks.some((s) => s.nama_sintaks.toLowerCase().includes(q.toLowerCase()))
        }
        emptyTitle="Belum Ada Model Pembelajaran"
        emptyDescription="Silakan tambahkan data model pembelajaran dengan tombol di atas."
      />

      {/* Dialog Form Tambah / Edit Model */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Model Pembelajaran" : "Tambah Model Pembelajaran Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Tentukan nama model pembelajaran dan urutan langkah sintaks berserta pengalaman belajar default.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label htmlFor="model_nama" className="text-xs font-medium">
                  Nama Model Pembelajaran <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="model_nama"
                  value={modelNama}
                  onChange={(e) => setModelNama(e.target.value)}
                  placeholder="Contoh: Project-Based Learning (PjBL)"
                  required
                />
              </div>

              {/* Editor Sintaks Berurutan */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Langkah-Langkah Sintaks ({sintaksList.length})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Gunakan tombol panah untuk mengatur urutan sintaks.
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={handleAddSintaks}
                    className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tambah Langkah
                  </Button>
                </div>

                <div className="space-y-2 mt-2">
                  {sintaksList.map((sintaks, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:border-slate-300 transition"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveUp(idx)}
                          disabled={idx === 0}
                          className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-20"
                          title="Naikkan urutan"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <span className="font-bold font-mono text-xs text-slate-700 w-4 text-center">
                          {sintaks.urutan}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleMoveDown(idx)}
                          disabled={idx === sintaksList.length - 1}
                          className="p-0.5 text-slate-400 hover:text-slate-800 disabled:opacity-20"
                          title="Turunkan urutan"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex-1 space-y-1">
                        <Input
                          value={sintaks.nama_sintaks}
                          onChange={(e) =>
                            handleUpdateSintaks(idx, "nama_sintaks", e.target.value)
                          }
                          placeholder={`Nama sintaks langkah ke-${idx + 1}`}
                          className="h-8 text-xs bg-white"
                          required
                        />
                      </div>

                      <div className="w-36">
                        <Select
                          value={sintaks.pengalaman_belajar}
                          onValueChange={(val) =>
                            handleUpdateSintaks(idx, "pengalaman_belajar", val || "memahami")
                          }
                        >
                          <SelectTrigger className="h-8 text-xs bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="memahami" className="text-xs">
                              Memahami
                            </SelectItem>
                            <SelectItem value="mengaplikasi" className="text-xs">
                              Mengaplikasi
                            </SelectItem>
                            <SelectItem value="merefleksi" className="text-xs">
                              Merefleksi
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        type="button"
                        size="icon-xs"
                        variant="ghost"
                        onClick={() => handleRemoveSintaks(idx)}
                        disabled={sintaksList.length <= 1}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-20"
                        title="Hapus langkah"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
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
                {editingItem ? "Simpan Perubahan" : "Simpan Model Pembelajaran"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog Hapus */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Model Pembelajaran"
        description="Apakah Anda yakin ingin menghapus model pembelajaran ini? Modul ajar yang menggunakan model ini mungkin perlu disesuaikan."
        variant="destructive"
        confirmText="Ya, Hapus"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
