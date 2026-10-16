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
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import {
  getMapelAction,
  createMapelAction,
  updateMapelAction,
  deleteMapelAction,
  type MapelItem,
} from "../actions";
import type { KelompokMapel } from "@/types/database";

const KELOMPOK_CONFIG: Record<
  KelompokMapel,
  { label: string; badgeClass: string }
> = {
  PAI: {
    label: "Pendidikan Agama Islam (PAI)",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  "Bahasa Arab": {
    label: "Bahasa Arab",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
  },
  umum: {
    label: "Mata Pelajaran Umum",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
  },
  muatan_lokal: {
    label: "Muatan Lokal (Mulok)",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
  },
};

interface TabMapelProps {
  initialData: MapelItem[];
}

export function TabMapel({ initialData }: TabMapelProps) {
  const [data, setData] = useState<MapelItem[]>(initialData);
  const [loading, setLoading] = useState(false);

  // Filter kelompok
  const [filterKelompok, setFilterKelompok] = useState<string>("all");

  // Dialog Form
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MapelItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<{
    nama: string;
    kode: string;
    kelompok: KelompokMapel;
    jp_per_minggu_kls7: number;
    jp_per_minggu_kls8: number;
    jp_per_minggu_kls9: number;
  }>({
    nama: "",
    kode: "",
    kelompok: "umum",
    jp_per_minggu_kls7: 2,
    jp_per_minggu_kls8: 2,
    jp_per_minggu_kls9: 2,
  });

  // Confirm Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function reloadData() {
    setLoading(true);
    const res = await getMapelAction();
    if (res.data) setData(res.data);
    setLoading(false);
  }

  function handleOpenCreate() {
    setEditingItem(null);
    setForm({
      nama: "",
      kode: "",
      kelompok: "umum",
      jp_per_minggu_kls7: 3,
      jp_per_minggu_kls8: 3,
      jp_per_minggu_kls9: 3,
    });
    setFormOpen(true);
  }

  function handleOpenEdit(item: MapelItem) {
    setEditingItem(item);
    setForm({
      nama: item.nama,
      kode: item.kode,
      kelompok: item.kelompok,
      jp_per_minggu_kls7: item.jp_per_minggu_kls7,
      jp_per_minggu_kls8: item.jp_per_minggu_kls8,
      jp_per_minggu_kls9: item.jp_per_minggu_kls9,
    });
    setFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    if (editingItem) {
      const res = await updateMapelAction(editingItem.id, form);
      if (res.success) {
        toast.success("Mata pelajaran berhasil diperbarui");
        setFormOpen(false);
        await reloadData();
      } else {
        toast.error(res.error || "Gagal memperbarui mapel");
      }
    } else {
      const res = await createMapelAction(form);
      if (res.success) {
        toast.success("Mata pelajaran berhasil ditambahkan");
        setFormOpen(false);
        await reloadData();
      } else {
        toast.error(res.error || "Gagal menambah mapel");
      }
    }

    setSaving(false);
  }

  async function handleDeleteConfirm() {
    if (!deletingId) return;
    const res = await deleteMapelAction(deletingId);
    if (res.success) {
      toast.success("Mata pelajaran berhasil dihapus");
      setDeleteOpen(false);
      setDeletingId(null);
      await reloadData();
    } else {
      toast.error(res.error || "Gagal menghapus mata pelajaran");
    }
  }

  const filteredData = filterKelompok === "all"
    ? data
    : data.filter((d) => d.kelompok === filterKelompok);

  const columns: Column<MapelItem>[] = [
    {
      key: "kode",
      header: "Kode",
      sortable: true,
      className: "w-20",
      render: (item) => (
        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
          {item.kode}
        </span>
      ),
    },
    {
      key: "nama",
      header: "Nama Mata Pelajaran",
      sortable: true,
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 text-sm">{item.nama}</span>
          <span className="text-[11px] text-slate-500">
            {KELOMPOK_CONFIG[item.kelompok]?.label || item.kelompok}
          </span>
        </div>
      ),
    },
    {
      key: "kelompok",
      header: "Kelompok",
      sortable: true,
      render: (item) => {
        const conf = KELOMPOK_CONFIG[item.kelompok];
        return (
          <Badge className={`text-xs ${conf?.badgeClass || "bg-slate-100 text-slate-800"}`}>
            {conf?.label.split(" ")[0] || item.kelompok}
          </Badge>
        );
      },
    },
    {
      key: "jp",
      header: "Alokasi JP per Minggu (Kls 7 / 8 / 9)",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded" title="Kelas VII">
            VII: {item.jp_per_minggu_kls7} JP
          </span>
          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded" title="Kelas VIII">
            VIII: {item.jp_per_minggu_kls8} JP
          </span>
          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded" title="Kelas IX">
            IX: {item.jp_per_minggu_kls9} JP
          </span>
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
            Mata Pelajaran MTs (KMA 1503 Tahun 2025)
          </h3>
          <p className="text-xs text-slate-500">
            Struktur kurikulum madrasah tsanawiyah mencakup PAI, Bahasa Arab, Umum, dan Muatan Lokal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filterKelompok}
            onValueChange={(val) => setFilterKelompok(val || "all")}
          >
            <SelectTrigger className="w-48 h-9 text-xs">
              <SelectValue placeholder="Filter Kelompok" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                Semua Kelompok ({data.length})
              </SelectItem>
              <SelectItem value="PAI" className="text-xs">
                PAI
              </SelectItem>
              <SelectItem value="Bahasa Arab" className="text-xs">
                Bahasa Arab
              </SelectItem>
              <SelectItem value="umum" className="text-xs">
                Mata Pelajaran Umum
              </SelectItem>
              <SelectItem value="muatan_lokal" className="text-xs">
                Muatan Lokal
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs h-9"
          >
            <Plus className="h-4 w-4" /> Tambah Mapel
          </Button>
        </div>
      </div>

      <DataTable
        data={filteredData}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        pageSize={20}
        searchPlaceholder="Cari nama atau kode mapel..."
        searchFilter={(item, q) =>
          item.nama.toLowerCase().includes(q.toLowerCase()) ||
          item.kode.toLowerCase().includes(q.toLowerCase())
        }
        emptyTitle="Belum Ada Mata Pelajaran"
        emptyDescription="Silakan tambahkan data mata pelajaran dengan tombol di atas."
      />

      {/* Dialog Form Tambah / Edit */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Lengkapi nama, kode unik, kelompok kurikulum, dan alokasi JP per minggu.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <Label htmlFor="mapel_nama" className="text-xs font-medium">
                    Nama Mata Pelajaran <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mapel_nama"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    placeholder="Contoh: Matematika"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mapel_kode" className="text-xs font-medium">
                    Kode Unik <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mapel_kode"
                    value={form.kode}
                    onChange={(e) => setForm({ ...form, kode: e.target.value })}
                    placeholder="MTK"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="mapel_kelompok" className="text-xs font-medium">
                  Kelompok Kurikulum <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={form.kelompok}
                  onValueChange={(val) => {
                    if (val) setForm({ ...form, kelompok: val as KelompokMapel });
                  }}
                >
                  <SelectTrigger id="mapel_kelompok" className="text-xs">
                    <SelectValue placeholder="Pilih Kelompok" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAI" className="text-xs">
                      Pendidikan Agama Islam (PAI)
                    </SelectItem>
                    <SelectItem value="Bahasa Arab" className="text-xs">
                      Bahasa Arab
                    </SelectItem>
                    <SelectItem value="umum" className="text-xs">
                      Mata Pelajaran Umum
                    </SelectItem>
                    <SelectItem value="muatan_lokal" className="text-xs">
                      Muatan Lokal (Mulok)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t border-slate-100 pt-2 space-y-2">
                <span className="text-xs font-semibold text-slate-700">
                  Alokasi Jam Pelajaran (JP) per Minggu
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="jp_kls7" className="text-xs text-slate-500">
                      Kelas VII
                    </Label>
                    <Input
                      id="jp_kls7"
                      type="number"
                      min={1}
                      max={10}
                      value={form.jp_per_minggu_kls7}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          jp_per_minggu_kls7: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="jp_kls8" className="text-xs text-slate-500">
                      Kelas VIII
                    </Label>
                    <Input
                      id="jp_kls8"
                      type="number"
                      min={1}
                      max={10}
                      value={form.jp_per_minggu_kls8}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          jp_per_minggu_kls8: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="jp_kls9" className="text-xs text-slate-500">
                      Kelas IX
                    </Label>
                    <Input
                      id="jp_kls9"
                      type="number"
                      min={1}
                      max={10}
                      value={form.jp_per_minggu_kls9}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          jp_per_minggu_kls9: parseInt(e.target.value, 10) || 1,
                        })
                      }
                      required
                    />
                  </div>
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
                {editingItem ? "Simpan Perubahan" : "Tambah Mapel"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog Hapus */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Mata Pelajaran"
        description="Apakah Anda yakin ingin menghapus mata pelajaran ini? Semua data penugasan atau capaian pembelajaran terkait mungkin terpengaruh."
        variant="destructive"
        confirmText="Ya, Hapus"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
