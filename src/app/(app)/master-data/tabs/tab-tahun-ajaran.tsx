"use client";

import React, { useState } from "react";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  getTahunAjaranAction,
  createTahunAjaranAction,
  updateTahunAjaranAction,
  setAktifTahunAjaranAction,
  deleteTahunAjaranAction,
  type TahunAjaranItem,
} from "../actions";

interface TabTahunAjaranProps {
  initialData: TahunAjaranItem[];
}

export function TabTahunAjaran({ initialData }: TabTahunAjaranProps) {
  const [data, setData] = useState<TahunAjaranItem[]>(initialData);
  const [loading, setLoading] = useState(false);

  // Dialog Form
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TahunAjaranItem | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nama: "2026/2027",
    tgl_mulai: "2026-07-13",
    tgl_selesai: "2027-06-25",
    smt1_mulai: "2026-07-13",
    smt1_selesai: "2026-12-19",
    smt2_mulai: "2027-01-04",
    smt2_selesai: "2027-06-25",
    aktif: false,
  });

  // Confirm Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function reloadData() {
    setLoading(true);
    const res = await getTahunAjaranAction();
    if (res.data) setData(res.data);
    setLoading(false);
  }

  function handleOpenCreate() {
    setEditingItem(null);
    setForm({
      nama: "2027/2028",
      tgl_mulai: "2027-07-12",
      tgl_selesai: "2028-06-23",
      smt1_mulai: "2027-07-12",
      smt1_selesai: "2027-12-18",
      smt2_mulai: "2028-01-03",
      smt2_selesai: "2028-06-23",
      aktif: false,
    });
    setFormOpen(true);
  }

  function handleOpenEdit(item: TahunAjaranItem) {
    setEditingItem(item);
    setForm({
      nama: item.nama,
      tgl_mulai: item.tgl_mulai,
      tgl_selesai: item.tgl_selesai,
      smt1_mulai: item.smt1_mulai,
      smt1_selesai: item.smt1_selesai,
      smt2_mulai: item.smt2_mulai,
      smt2_selesai: item.smt2_selesai,
      aktif: item.aktif,
    });
    setFormOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    if (editingItem) {
      const res = await updateTahunAjaranAction(editingItem.id, form);
      if (res.success) {
        toast.success("Tahun ajaran berhasil diperbarui");
        setFormOpen(false);
        await reloadData();
      } else {
        toast.error(res.error || "Gagal memperbarui tahun ajaran");
      }
    } else {
      const res = await createTahunAjaranAction(form);
      if (res.success) {
        toast.success("Tahun ajaran baru berhasil ditambahkan");
        setFormOpen(false);
        await reloadData();
      } else {
        toast.error(res.error || "Gagal menambah tahun ajaran");
      }
    }

    setSaving(false);
  }

  async function handleSetAktif(id: string) {
    const res = await setAktifTahunAjaranAction(id);
    if (res.success) {
      toast.success("Tahun ajaran aktif berhasil dialihkan!");
      await reloadData();
    } else {
      toast.error(res.error || "Gagal mengaktifkan tahun ajaran");
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingId) return;
    const res = await deleteTahunAjaranAction(deletingId);
    if (res.success) {
      toast.success("Tahun ajaran berhasil dihapus");
      setDeleteOpen(false);
      setDeletingId(null);
      await reloadData();
    } else {
      toast.error(res.error || "Gagal menghapus tahun ajaran");
    }
  }

  const columns: Column<TahunAjaranItem>[] = [
    {
      key: "nama",
      header: "Tahun Ajaran",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">{item.nama}</span>
          {item.aktif && (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-medium">
              Aktif Saat Ini
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "smt1",
      header: "Semester 1 (Ganjil)",
      render: (item) => (
        <span className="text-xs text-slate-600">
          {item.smt1_mulai} s.d. {item.smt1_selesai}
        </span>
      ),
    },
    {
      key: "smt2",
      header: "Semester 2 (Genap)",
      render: (item) => (
        <span className="text-xs text-slate-600">
          {item.smt2_mulai} s.d. {item.smt2_selesai}
        </span>
      ),
    },
    {
      key: "tgl_rentang",
      header: "Rentang Kalender TA",
      render: (item) => (
        <span className="text-xs text-slate-500 font-mono">
          {item.tgl_mulai} ~ {item.tgl_selesai}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      className: "text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          {!item.aktif && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => handleSetAktif(item.id)}
              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 text-xs gap-1"
            >
              <CheckCircle className="h-3.5 w-3.5" /> Jadikan Aktif
            </Button>
          )}
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
            disabled={item.aktif}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30"
            title={item.aktif ? "Tahun ajaran aktif tidak dapat dihapus" : "Hapus"}
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
            Daftar Tahun Ajaran & Rentang Semester
          </h3>
          <p className="text-xs text-slate-500">
            Hanya 1 tahun ajaran yang berstatus aktif. Dokumen perangkat ajar akan
            mengacu ke tahun ajaran yang sedang aktif.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
        >
          <Plus className="h-4 w-4" /> Tambah Tahun Ajaran
        </Button>
      </div>

      <DataTable
        data={data}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        pageSize={20}
        searchPlaceholder="Cari tahun ajaran (contoh: 2026/2027)..."
        searchFilter={(item, q) => item.nama.toLowerCase().includes(q.toLowerCase())}
        emptyTitle="Belum Ada Tahun Ajaran"
        emptyDescription="Silakan tambahkan data tahun ajaran baru dengan tombol di atas."
      />

      {/* Dialog Form Tambah / Edit */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Edit Tahun Ajaran" : "Tambah Tahun Ajaran Baru"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Tentukan nama tahun ajaran dan batas tanggal awal serta akhir semester.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="ta_nama" className="text-xs font-medium">
                  Nama Tahun Ajaran <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ta_nama"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Misal: 2026/2027"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="tgl_mulai" className="text-xs font-medium">
                    Tgl Mulai TA
                  </Label>
                  <Input
                    id="tgl_mulai"
                    type="date"
                    value={form.tgl_mulai}
                    onChange={(e) =>
                      setForm({ ...form, tgl_mulai: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="tgl_selesai" className="text-xs font-medium">
                    Tgl Selesai TA
                  </Label>
                  <Input
                    id="tgl_selesai"
                    type="date"
                    value={form.tgl_selesai}
                    onChange={(e) =>
                      setForm({ ...form, tgl_selesai: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-2 space-y-2">
                <span className="text-xs font-semibold text-slate-700">
                  Semester 1 (Ganjil)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="smt1_mulai" className="text-xs text-slate-500">
                      Mulai
                    </Label>
                    <Input
                      id="smt1_mulai"
                      type="date"
                      value={form.smt1_mulai}
                      onChange={(e) =>
                        setForm({ ...form, smt1_mulai: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="smt1_selesai" className="text-xs text-slate-500">
                      Selesai
                    </Label>
                    <Input
                      id="smt1_selesai"
                      type="date"
                      value={form.smt1_selesai}
                      onChange={(e) =>
                        setForm({ ...form, smt1_selesai: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-2 space-y-2">
                <span className="text-xs font-semibold text-slate-700">
                  Semester 2 (Genap)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="smt2_mulai" className="text-xs text-slate-500">
                      Mulai
                    </Label>
                    <Input
                      id="smt2_mulai"
                      type="date"
                      value={form.smt2_mulai}
                      onChange={(e) =>
                        setForm({ ...form, smt2_mulai: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="smt2_selesai" className="text-xs text-slate-500">
                      Selesai
                    </Label>
                    <Input
                      id="smt2_selesai"
                      type="date"
                      value={form.smt2_selesai}
                      onChange={(e) =>
                        setForm({ ...form, smt2_selesai: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="ta_aktif"
                  checked={form.aktif}
                  onCheckedChange={(c) => setForm({ ...form, aktif: !!c })}
                />
                <Label htmlFor="ta_aktif" className="text-xs cursor-pointer">
                  Jadikan sebagai tahun ajaran aktif sekarang
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

      {/* Confirm Dialog Hapus */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Tahun Ajaran"
        description="Apakah Anda yakin ingin menghapus data tahun ajaran ini? Tindakan ini tidak dapat dibatalkan."
        variant="destructive"
        confirmText="Ya, Hapus"
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
