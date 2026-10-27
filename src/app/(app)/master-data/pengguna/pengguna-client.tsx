"use client";

import React, { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  UserPlus,
  KeyRound,
  UserX,
  UserCheck,
  Search,
  Shield,
  Loader2,
  Mail,
  Hash,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import {
  tambahPenggunaAction,
  toggleStatusPenggunaAction,
  resetPasswordPenggunaAction,
  importPenggunaAction,
  type ImportPenggunaRowResult,
} from "./actions";
import type { UserRole } from "@/types/database";

export interface PenggunaRow {
  id: string;
  nama_lengkap: string;
  nip: string | null;
  gelar: string | null;
  email: string;
  role: UserRole;
  aktif: boolean;
  created_at: string;
}

interface PenggunaClientProps {
  initialUsers: PenggunaRow[];
  currentUserId: string;
}

const roleBadgeMap: Record<
  UserRole,
  { label: string; className: string }
> = {
  admin: { label: "Admin", className: "bg-purple-50 text-purple-700 border-purple-200" },
  kepala: { label: "Kepala Madrasah", className: "bg-blue-50 text-blue-700 border-blue-200" },
  waka_kurikulum: { label: "Waka Kurikulum", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  guru: { label: "Guru", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

export function PenggunaClient({ initialUsers, currentUserId }: PenggunaClientProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  // Dialog State: Tambah Pengguna
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    nama_lengkap: "",
    nip: "",
    gelar: "",
    email: "",
    role: "guru" as UserRole,
    password: "",
  });

  // Dialog State: Reset Password
  const [resetTarget, setResetTarget] = useState<PenggunaRow | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Dialog State: Toggle Aktif
  const [toggleTarget, setToggleTarget] = useState<PenggunaRow | null>(null);

  // Dialog State: Import Excel
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportPenggunaRowResult[] | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  // Filtered list
  const filteredUsers = initialUsers.filter((u) => {
    const matchesSearch =
      u.nama_lengkap.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.nip && u.nip.includes(search));
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Handle Tambah Pengguna
  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.nama_lengkap || !addForm.email || !addForm.password) {
      toast.error("Mohon lengkapi nama, email, dan password awal.");
      return;
    }

    startTransition(async () => {
      const fd = new FormData();
      fd.append("nama_lengkap", addForm.nama_lengkap);
      fd.append("nip", addForm.nip);
      fd.append("gelar", addForm.gelar);
      fd.append("email", addForm.email);
      fd.append("role", addForm.role);
      fd.append("password", addForm.password);

      const res = await tambahPenggunaAction({}, fd);
      if (res.success) {
        toast.success(res.message);
        setIsAddOpen(false);
        setAddForm({
          nama_lengkap: "",
          nip: "",
          gelar: "",
          email: "",
          role: "guru",
          password: "",
        });
      } else {
        toast.error(res.message || "Gagal menambahkan pengguna.");
      }
    });
  }

  // Handle Toggle Aktif
  async function handleConfirmToggle() {
    if (!toggleTarget) return;
    const res = await toggleStatusPenggunaAction(toggleTarget.id, toggleTarget.aktif);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
    setToggleTarget(null);
  }

  // Handle Reset Password
  function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget || !newPassword || newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter.");
      return;
    }

    startTransition(async () => {
      const res = await resetPasswordPenggunaAction(resetTarget.id, newPassword);
      if (res.success) {
        toast.success(res.message);
        setResetTarget(null);
        setNewPassword("");
      } else {
        toast.error(res.message);
      }
    });
  }

  // Handle Import Excel
  function handleImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImportFile(file);
    setImportResults(null);
  }

  function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!importFile) {
      toast.error("Pilih file Excel (.xlsx) terlebih dahulu.");
      return;
    }

    const fd = new FormData();
    fd.append("file", importFile);

    setIsImporting(true);
    setImportResults(null);
    startTransition(async () => {
      const res = await importPenggunaAction({}, fd);
      setIsImporting(false);

      if (res.results) {
        setImportResults(res.results);
      }

      if (res.success) {
        toast.success(res.message || "Import berhasil diproses.");
      } else {
        toast.error(res.message || "Gagal memproses import.");
      }
    });
  }

  function closeImportDialog() {
    setIsImportOpen(false);
    setImportFile(null);
    setImportResults(null);
    if (importFileInputRef.current) importFileInputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      {/* Top Bar: Search, Filters & Action Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama, NIP, atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-slate-200"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Semua Peran</option>
            <option value="guru">Guru</option>
            <option value="waka_kurikulum">Waka Kurikulum</option>
            <option value="kepala">Kepala Madrasah</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => setIsImportOpen(true)}
            className="border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Import Excel
          </Button>
          <Button
            onClick={() => setIsAddOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <UserPlus className="h-4 w-4" /> Tambah Pengguna
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Nama & Identitas</th>
                <th className="px-4 py-3">Email Akun</th>
                <th className="px-4 py-3">Peran (Role)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const roleConfig = roleBadgeMap[u.role] || roleBadgeMap.guru;
                  const isSelf = u.id === currentUserId;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {u.nama_lengkap}
                          {u.gelar ? `, ${u.gelar}` : ""}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          <span>NIP: {u.nip || "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {u.email}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-xs ${roleConfig.className}`}>
                          {roleConfig.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {u.aktif ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                            Aktif
                          </Badge>
                        ) : (
                          <Badge className="bg-red-50 text-red-700 border-red-200 text-xs">
                            Nonaktif
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Reset Password */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setResetTarget(u);
                              setNewPassword("");
                            }}
                            className="h-8 px-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1 text-xs"
                          >
                            <KeyRound className="h-3.5 w-3.5" /> Reset Sandi
                          </Button>

                          {/* Toggle Aktif / Nonaktif */}
                          {!isSelf && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setToggleTarget(u)}
                              className={`h-8 px-2 text-xs gap-1 ${
                                u.aktif
                                  ? "text-red-600 hover:text-red-700 hover:bg-red-50"
                                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              }`}
                            >
                              {u.aktif ? (
                                <>
                                  <UserX className="h-3.5 w-3.5" /> Nonaktifkan
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3.5 w-3.5" /> Aktifkan
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-8">
                    <EmptyState
                      icon={Shield}
                      title="Tidak ada data pengguna"
                      description={
                        search
                          ? `Tidak ditemukan pengguna yang cocok dengan kata kunci '${search}'.`
                          : "Belum ada guru atau staf yang terdaftar."
                      }
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog: Tambah Pengguna Baru */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Tambah Pengguna Baru</DialogTitle>
            <DialogDescription>
              Buat akun guru atau staf baru. Akun akan langsung aktif untuk login.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-3.5 pt-2">
            <div>
              <Label className="text-xs text-slate-700">Nama Lengkap *</Label>
              <Input
                placeholder="misal: Siti Nurhaliza"
                value={addForm.nama_lengkap}
                onChange={(e) => setAddForm({ ...addForm, nama_lengkap: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-slate-700">NIP (Opsional)</Label>
                <Input
                  placeholder="19850101..."
                  value={addForm.nip}
                  onChange={(e) => setAddForm({ ...addForm, nip: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-700">Gelar (Opsional)</Label>
                <Input
                  placeholder="misal: S.Pd.I, M.Ag"
                  value={addForm.gelar}
                  onChange={(e) => setAddForm({ ...addForm, gelar: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-slate-700">Alamat Email *</Label>
              <Input
                type="email"
                placeholder="nama@madrasah.id"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-700">Peran / Hak Akses *</Label>
              <select
                value={addForm.role}
                onChange={(e) => setAddForm({ ...addForm, role: e.target.value as UserRole })}
                className="mt-1 w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="guru">Guru Mata Pelajaran</option>
                <option value="waka_kurikulum">Waka Kurikulum</option>
                <option value="kepala">Kepala Madrasah</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <Label className="text-xs text-slate-700">Password Awal *</Label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                required
                minLength={6}
                className="mt-1"
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Simpan & Daftarkan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Reset Password */}
      <Dialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent className="max-w-sm bg-white">
          <DialogHeader>
            <DialogTitle>Reset Password Pengguna</DialogTitle>
            <DialogDescription>
              Atur ulang password untuk akun <strong>{resetTarget?.nama_lengkap}</strong> ({resetTarget?.email}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetSubmit} className="space-y-3 pt-2">
            <div>
              <Label className="text-xs text-slate-700">Password Baru *</Label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1"
                autoFocus
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetTarget(null)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
                Perbarui Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ConfirmDialog: Toggle Aktif / Nonaktif */}
      <ConfirmDialog
        open={!!toggleTarget}
        onOpenChange={(open) => !open && setToggleTarget(null)}
        title={toggleTarget?.aktif ? "Nonaktifkan Akun Pengguna?" : "Aktifkan Akun Pengguna?"}
        description={
          toggleTarget?.aktif
            ? `Pengguna '${toggleTarget?.nama_lengkap}' tidak akan dapat masuk ke sistem setelah dinonaktifkan.`
            : `Pengguna '${toggleTarget?.nama_lengkap}' akan dapat kembali masuk dan menggunakan aplikasi.`
        }
        confirmText={toggleTarget?.aktif ? "Ya, Nonaktifkan" : "Ya, Aktifkan"}
        variant={toggleTarget?.aktif ? "destructive" : "default"}
        onConfirm={handleConfirmToggle}
      />

      {/* Dialog: Import Pengguna dari Excel */}
      <Dialog open={isImportOpen} onOpenChange={(open) => !open && closeImportDialog()}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Import Pengguna & Guru dari Excel</DialogTitle>
            <DialogDescription>
              Unggah file Excel (.xlsx) berisi daftar guru/staf untuk didaftarkan secara massal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <a
              href="/api/master-data/pengguna/template"
              className="flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              <Download className="h-4 w-4" /> Unduh Template Import (.xlsx)
            </a>

            <form onSubmit={handleImportSubmit} className="space-y-3">
              <div>
                <Label className="text-xs text-slate-700">Pilih File Excel (.xlsx) *</Label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    ref={importFileInputRef}
                    type="file"
                    accept=".xlsx"
                    onChange={handleImportFileChange}
                    disabled={isImporting}
                    className="block w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-emerald-50 file:text-emerald-700 file:text-xs file:font-medium hover:file:bg-emerald-100 border border-slate-200 rounded-md"
                  />
                </div>
              </div>

              {importResults && (
                <div className="rounded-md border border-slate-200 max-h-64 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="px-2.5 py-1.5 text-slate-500 font-semibold">Baris</th>
                        <th className="px-2.5 py-1.5 text-slate-500 font-semibold">Nama / Email</th>
                        <th className="px-2.5 py-1.5 text-slate-500 font-semibold">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importResults.map((r) => (
                        <tr key={r.rowNumber}>
                          <td className="px-2.5 py-1.5 text-slate-500">{r.rowNumber}</td>
                          <td className="px-2.5 py-1.5">
                            <div className="font-medium text-slate-800">{r.nama_lengkap}</div>
                            <div className="text-slate-400">{r.email}</div>
                          </td>
                          <td className="px-2.5 py-1.5">
                            <div
                              className={`flex items-center gap-1 font-medium ${
                                r.status === "berhasil" ? "text-emerald-700" : "text-red-600"
                              }`}
                            >
                              {r.status === "berhasil" ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 shrink-0" />
                              )}
                              {r.message}
                            </div>
                            {r.generatedPassword && (
                              <div className="text-slate-500 mt-0.5">
                                Password: <code className="font-mono bg-slate-100 px-1 rounded">{r.generatedPassword}</code>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <DialogFooter className="pt-1">
                <Button type="button" variant="outline" onClick={closeImportDialog} disabled={isImporting}>
                  Tutup
                </Button>
                <Button
                  type="submit"
                  disabled={isImporting || !importFile}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Proses Import
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
