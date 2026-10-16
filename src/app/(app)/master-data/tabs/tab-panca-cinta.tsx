"use client";

import React, { useState } from "react";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Heart,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react";
import {
  getPancaCintaAction,
  updatePancaCintaAction,
  getMateriKbcAction,
  createMateriKbcAction,
  updateMateriKbcAction,
  deleteMateriKbcAction,
  type PancaCintaItem,
  type MateriKbcItem,
} from "../actions";

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  PC1: { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  PC2: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-200" },
  PC3: { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-200" },
  PC4: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" },
  PC5: { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
};

interface TabPancaCintaProps {
  initialTopik: PancaCintaItem[];
  initialMateri: MateriKbcItem[];
}

export function TabPancaCinta({ initialTopik, initialMateri }: TabPancaCintaProps) {
  const [topikList, setTopikList] = useState<PancaCintaItem[]>(initialTopik);
  const [materiList, setMateriList] = useState<MateriKbcItem[]>(initialMateri);
  const [selectedTopikId, setSelectedTopikId] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  // Edit Deskripsi Topik
  const [editTopikOpen, setEditTopikOpen] = useState(false);
  const [editingTopik, setEditingTopik] = useState<PancaCintaItem | null>(null);
  const [topikDeskripsi, setTopikDeskripsi] = useState("");
  const [savingTopik, setSavingTopik] = useState(false);

  // CRUD Materi KBC
  const [materiOpen, setMateriOpen] = useState(false);
  const [editingMateri, setEditingMateri] = useState<MateriKbcItem | null>(null);
  const [savingMateri, setSavingMateri] = useState(false);

  const [formMateri, setFormMateri] = useState({
    panca_cinta_id: initialTopik[0]?.id || "",
    pilar: "",
    nilai: "",
    deskripsi: "",
    integrasi_sains_sosial: "",
    indikator_perilaku: "",
  });

  // Confirm Delete Materi
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function reloadMateri(topikId: string) {
    setLoading(true);
    const res = await getMateriKbcAction(topikId);
    if (res.data) setMateriList(res.data);
    setLoading(false);
  }

  function handleFilterTopik(topikId: string) {
    setSelectedTopikId(topikId);
    void reloadMateri(topikId);
  }

  function handleOpenEditTopik(topik: PancaCintaItem) {
    setEditingTopik(topik);
    setTopikDeskripsi(topik.deskripsi || "");
    setEditTopikOpen(true);
  }

  async function handleSaveTopik(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTopik) return;

    setSavingTopik(true);
    const res = await updatePancaCintaAction(editingTopik.id, topikDeskripsi);
    setSavingTopik(false);

    if (res.success) {
      toast.success("Deskripsi Panca Cinta berhasil diperbarui");
      setEditTopikOpen(false);
      const pcRes = await getPancaCintaAction();
      if (pcRes.data) setTopikList(pcRes.data);
    } else {
      toast.error(res.error || "Gagal memperbarui deskripsi");
    }
  }

  function handleOpenCreateMateri() {
    setEditingMateri(null);
    setFormMateri({
      panca_cinta_id: selectedTopikId !== "all" ? selectedTopikId : (topikList[0]?.id || ""),
      pilar: "",
      nilai: "",
      deskripsi: "",
      integrasi_sains_sosial: "",
      indikator_perilaku: "",
    });
    setMateriOpen(true);
  }

  function handleOpenEditMateri(item: MateriKbcItem) {
    setEditingMateri(item);
    setFormMateri({
      panca_cinta_id: item.panca_cinta_id,
      pilar: item.pilar,
      nilai: item.nilai,
      deskripsi: item.deskripsi,
      integrasi_sains_sosial: item.integrasi_sains_sosial || "",
      indikator_perilaku: item.indikator_perilaku.join("\n"),
    });
    setMateriOpen(true);
  }

  async function handleSaveMateri(e: React.FormEvent) {
    e.preventDefault();
    if (!formMateri.panca_cinta_id || !formMateri.nilai || !formMateri.deskripsi) {
      toast.error("Lengkapi topik, nilai, dan deskripsi materi");
      return;
    }

    setSavingMateri(true);
    const indikatorArray = formMateri.indikator_perilaku
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    const payload = {
      panca_cinta_id: formMateri.panca_cinta_id,
      pilar: formMateri.pilar || formMateri.nilai,
      nilai: formMateri.nilai,
      deskripsi: formMateri.deskripsi,
      integrasi_sains_sosial: formMateri.integrasi_sains_sosial || undefined,
      indikator_perilaku: indikatorArray,
    };

    if (editingMateri) {
      const res = await updateMateriKbcAction(editingMateri.id, payload);
      if (res.success) {
        toast.success("Materi integrasi KBC berhasil diperbarui");
        setMateriOpen(false);
        await reloadMateri(selectedTopikId);
      } else {
        toast.error(res.error || "Gagal memperbarui materi");
      }
    } else {
      const res = await createMateriKbcAction(payload);
      if (res.success) {
        toast.success("Materi integrasi KBC berhasil ditambahkan");
        setMateriOpen(false);
        await reloadMateri(selectedTopikId);
      } else {
        toast.error(res.error || "Gagal menambah materi");
      }
    }

    setSavingMateri(false);
  }

  async function handleDeleteMateri() {
    if (!deletingId) return;
    const res = await deleteMateriKbcAction(deletingId);
    if (res.success) {
      toast.success("Materi KBC berhasil dihapus");
      setDeleteOpen(false);
      setDeletingId(null);
      await reloadMateri(selectedTopikId);
    } else {
      toast.error(res.error || "Gagal menghapus materi");
    }
  }

  const columns: Column<MateriKbcItem>[] = [
    {
      key: "topik",
      header: "Topik Panca Cinta",
      sortable: true,
      className: "w-48",
      render: (item) => {
        const col = COLOR_MAP[item.panca_cinta_kode || "PC1"] || {
          bg: "bg-slate-50",
          text: "text-slate-800",
          border: "border-slate-200",
        };
        return (
          <div className="flex flex-col gap-1">
            <Badge className={`${col.bg} ${col.text} ${col.border} text-xs font-semibold`}>
              {item.panca_cinta_kode}: {item.panca_cinta_nama}
            </Badge>
            <span className="text-[11px] text-slate-500 font-medium">
              Pilar: {item.pilar}
            </span>
          </div>
        );
      },
    },
    {
      key: "nilai",
      header: "Nilai & Deskripsi Integrasi KBC",
      render: (item) => (
        <div className="space-y-1">
          <span className="font-semibold text-slate-900 text-sm block">
            {item.nilai}
          </span>
          <p className="text-xs text-slate-700 leading-relaxed">
            {item.deskripsi}
          </p>
          {item.integrasi_sains_sosial && (
            <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-800">Integrasi Sains/Sosial: </span>
              {item.integrasi_sains_sosial}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "indikator",
      header: "Indikator Perilaku",
      render: (item) => (
        <div className="flex flex-col gap-1 max-w-xs">
          {item.indikator_perilaku.length === 0 ? (
            <span className="text-[11px] text-slate-400 italic">Belum ditentukan</span>
          ) : (
            item.indikator_perilaku.slice(0, 3).map((ind, i) => (
              <span
                key={i}
                className="text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded leading-tight"
              >
                • {ind}
              </span>
            ))
          )}
          {item.indikator_perilaku.length > 3 && (
            <span className="text-[10px] text-slate-400">
              +{item.indikator_perilaku.length - 3} indikator lainnya
            </span>
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
            onClick={() => handleOpenEditMateri(item)}
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
      {/* 5 Topik Tetap Panca Cinta */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-emerald-600" />
              5 Topik Tetap Panca Cinta (KBC)
            </h3>
            <p className="text-xs text-slate-500">
              Pondasi karakter Kurikulum Berbasis Cinta (KBC). Topik bersifat tetap, deskripsi dapat disesuaikan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {topikList.map((topik) => {
            const style = COLOR_MAP[topik.kode] || {
              bg: "bg-slate-50",
              text: "text-slate-800",
              border: "border-slate-200",
            };
            return (
              <Card
                key={topik.id}
                className={`border ${style.border} ${style.bg} transition shadow-2xs hover:shadow-xs flex flex-col justify-between`}
              >
                <CardHeader className="p-3 pb-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs font-mono px-1.5 py-0.5 rounded bg-white/70 shadow-2xs text-slate-800">
                      {topik.kode}
                    </span>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => handleOpenEditTopik(topik)}
                      className="text-slate-500 hover:text-slate-900 h-6 w-6"
                      title="Edit Deskripsi"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <CardTitle className={`text-xs font-bold mt-1.5 ${style.text}`}>
                    {topik.nama}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-[11px] text-slate-600 line-clamp-3 leading-relaxed mt-1">
                    {topik.deskripsi || "Belum ada deskripsi"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Materi Integrasi KBC */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Materi Integrasi KBC per Topik
            </h4>
            <p className="text-xs text-slate-500">
              Nilai, pilar, integrasi sains-sosial, dan indikator perilaku yang dapat disematkan ke modul ajar.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={selectedTopikId}
              onValueChange={(val) => handleFilterTopik(val || "all")}
            >
              <SelectTrigger className="w-56 h-9 text-xs">
                <SelectValue placeholder="Filter Topik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">
                  Semua Topik ({materiList.length})
                </SelectItem>
                {topikList.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.kode}: {t.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleOpenCreateMateri}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs h-9"
            >
              <Plus className="h-4 w-4" /> Tambah Materi KBC
            </Button>
          </div>
        </div>

        <DataTable
          data={materiList}
          columns={columns}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          pageSize={20}
          searchPlaceholder="Cari nilai, pilar, atau deskripsi integrasi KBC..."
          searchFilter={(item, q) =>
            item.nilai.toLowerCase().includes(q.toLowerCase()) ||
            item.pilar.toLowerCase().includes(q.toLowerCase()) ||
            item.deskripsi.toLowerCase().includes(q.toLowerCase())
          }
          emptyTitle="Belum Ada Materi Integrasi KBC"
          emptyDescription="Silakan tambahkan data materi integrasi KBC baru dengan tombol di atas."
        />
      </div>

      {/* Dialog Edit Deskripsi Topik Panca Cinta */}
      <Dialog open={editTopikOpen} onOpenChange={setEditTopikOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSaveTopik} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                Edit Deskripsi Topik: {editingTopik?.kode} - {editingTopik?.nama}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Sesuaikan penjelasan dan filosofi nilai topik Panca Cinta untuk madrasah.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2">
              <Label htmlFor="topik_deskripsi" className="text-xs font-medium">
                Deskripsi / Filosofi Topik
              </Label>
              <Textarea
                id="topik_deskripsi"
                rows={5}
                value={topikDeskripsi}
                onChange={(e) => setTopikDeskripsi(e.target.value)}
                placeholder="Tuliskan deskripsi topik..."
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditTopikOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={savingTopik}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {savingTopik && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Form Tambah / Edit Materi KBC */}
      <Dialog open={materiOpen} onOpenChange={setMateriOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSaveMateri} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingMateri ? "Edit Materi Integrasi KBC" : "Tambah Materi Integrasi KBC"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Masukkan nilai, deskripsi, konteks sains/sosial, serta indikator perilaku peserta didik.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="mat_topik" className="text-xs font-medium">
                  Topik Panca Cinta <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formMateri.panca_cinta_id}
                  onValueChange={(val) => {
                    if (val) setFormMateri({ ...formMateri, panca_cinta_id: val });
                  }}
                >
                  <SelectTrigger id="mat_topik" className="text-xs">
                    <SelectValue placeholder="Pilih Topik Panca Cinta" />
                  </SelectTrigger>
                  <SelectContent>
                    {topikList.map((t) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.kode}: {t.nama}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="mat_pilar" className="text-xs font-medium">
                    Pilar Karakter
                  </Label>
                  <Input
                    id="mat_pilar"
                    value={formMateri.pilar}
                    onChange={(e) =>
                      setFormMateri({ ...formMateri, pilar: e.target.value })
                    }
                    placeholder="Contoh: Rukun Iman / Spiritualitas"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="mat_nilai" className="text-xs font-medium">
                    Nilai KBC <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mat_nilai"
                    value={formMateri.nilai}
                    onChange={(e) =>
                      setFormMateri({ ...formMateri, nilai: e.target.value })
                    }
                    placeholder="Contoh: Tauhid & Ketundukan"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="mat_deskripsi" className="text-xs font-medium">
                  Deskripsi Nilai Integrasi <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="mat_deskripsi"
                  rows={3}
                  value={formMateri.deskripsi}
                  onChange={(e) =>
                    setFormMateri({ ...formMateri, deskripsi: e.target.value })
                  }
                  placeholder="Penjelasan bagaimana nilai ini ditanamkan dalam pembelajaran..."
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="mat_sains" className="text-xs font-medium">
                  Integrasi Sains & Realitas Sosial
                </Label>
                <Input
                  id="mat_sains"
                  value={formMateri.integrasi_sains_sosial}
                  onChange={(e) =>
                    setFormMateri({
                      ...formMateri,
                      integrasi_sains_sosial: e.target.value,
                    })
                  }
                  placeholder="Keterkaitan dengan fenomena alam, sains, atau masyarakat..."
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="mat_indikator" className="text-xs font-medium">
                  Indikator Perilaku Peserta Didik (Satu baris per indikator)
                </Label>
                <Textarea
                  id="mat_indikator"
                  rows={3}
                  value={formMateri.indikator_perilaku}
                  onChange={(e) =>
                    setFormMateri({
                      ...formMateri,
                      indikator_perilaku: e.target.value,
                    })
                  }
                  placeholder="Terbiasa memulai aktivitas dengan doa&#10;Menjaga kebersihan madrasah secara ikhlas"
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMateriOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={savingMateri}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {savingMateri && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                {editingMateri ? "Simpan Perubahan" : "Tambah Materi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog Hapus */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Hapus Materi KBC"
        description="Apakah Anda yakin ingin menghapus materi integrasi KBC ini?"
        variant="destructive"
        confirmText="Ya, Hapus"
        onConfirm={handleDeleteMateri}
      />
    </div>
  );
}
