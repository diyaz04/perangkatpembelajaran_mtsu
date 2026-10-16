"use client";

import React, { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  User,
  KeyRound,
  Shield,
  Loader2,
  Mail,
  Award,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { updateProfilAction, updatePasswordAction } from "./actions";
import type { Profile, UserRole } from "@/types/database";

interface PengaturanClientProps {
  profile: Profile;
  userEmail: string;
}

const roleBadgeMap: Record<UserRole, { label: string; className: string }> = {
  admin: { label: "Administrator", className: "bg-purple-50 text-purple-700 border-purple-200" },
  kepala: { label: "Kepala Madrasah", className: "bg-blue-50 text-blue-700 border-blue-200" },
  waka_kurikulum: { label: "Waka Kurikulum", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  guru: { label: "Guru Mata Pelajaran", className: "bg-slate-100 text-slate-700 border-slate-200" },
};

export function PengaturanClient({ profile, userEmail }: PengaturanClientProps) {
  const [isProfilPending, startProfilTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();

  // State Form Profil
  const [profilForm, setProfilForm] = useState({
    nama_lengkap: profile.nama_lengkap || "",
    nip: profile.nip || "",
    gelar: profile.gelar || "",
  });

  // State Form Password
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    konfirmasi_password: "",
  });

  const roleInfo = roleBadgeMap[profile.role] || roleBadgeMap.guru;

  function handleSaveProfil(e: React.FormEvent) {
    e.preventDefault();
    if (!profilForm.nama_lengkap.trim()) {
      toast.error("Nama lengkap wajib diisi.");
      return;
    }

    startProfilTransition(async () => {
      const fd = new FormData();
      fd.append("nama_lengkap", profilForm.nama_lengkap);
      fd.append("nip", profilForm.nip);
      fd.append("gelar", profilForm.gelar);

      const res = await updateProfilAction({}, fd);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  }

  function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (passwordForm.password.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (passwordForm.password !== passwordForm.konfirmasi_password) {
      toast.error("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    startPasswordTransition(async () => {
      const fd = new FormData();
      fd.append("password", passwordForm.password);
      fd.append("konfirmasi_password", passwordForm.konfirmasi_password);

      const res = await updatePasswordAction({}, fd);
      if (res.success) {
        toast.success(res.message);
        setPasswordForm({ password: "", konfirmasi_password: "" });
      } else {
        toast.error(res.message);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Kartu Profil & Identitas */}
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-600" />
                Data Profil Guru / Pengguna
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">
                Informasi identitas ini otomatis dicantumkan pada kop & lembar pengesahan perangkat ajar
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Peran Akun:</span>
              <Badge variant="outline" className={`text-xs ${roleInfo.className}`}>
                <Shield className="h-3 w-3 mr-1" />
                {roleInfo.label}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSaveProfil} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-slate-700">Email Akun (Login)</Label>
                <div className="mt-1 flex items-center gap-2 px-3 h-9 rounded-md border border-slate-200 bg-slate-50 text-sm text-slate-500">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{userEmail}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Email akun dikelola oleh Administrator sistem.
                </p>
              </div>

              <div>
                <Label className="text-xs text-slate-700">Nama Lengkap (Tanpa Gelar) *</Label>
                <Input
                  value={profilForm.nama_lengkap}
                  onChange={(e) => setProfilForm({ ...profilForm, nama_lengkap: e.target.value })}
                  placeholder="misal: Ahmad Dahlan"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-700">NIP (Nomor Induk Pegawai)</Label>
                <Input
                  value={profilForm.nip}
                  onChange={(e) => setProfilForm({ ...profilForm, nip: e.target.value })}
                  placeholder="198001012005011001 atau kosongi jika non-PNS"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-700">Gelar Akademik</Label>
                <Input
                  value={profilForm.gelar}
                  onChange={(e) => setProfilForm({ ...profilForm, gelar: e.target.value })}
                  placeholder="misal: M.Pd.I, S.Ag, M.Ed"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={isProfilPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {isProfilPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <CheckCircle2 className="h-4 w-4" /> Simpan Perubahan Profil
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Kartu Ganti Password */}
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-base text-slate-900 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-emerald-600" />
            Ganti Kata Sandi Akun
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-1">
            Perbarui kata sandi secara berkala untuk menjaga keamanan akses akun madrasah Anda
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSavePassword} className="space-y-4 max-w-md">
            <div>
              <Label className="text-xs text-slate-700">Kata Sandi Baru *</Label>
              <Input
                type="password"
                placeholder="Minimal 6 karakter"
                value={passwordForm.password}
                onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                required
                minLength={6}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-700">Ulangi Kata Sandi Baru *</Label>
              <Input
                type="password"
                placeholder="Masukkan ulang kata sandi baru"
                value={passwordForm.konfirmasi_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, konfirmasi_password: e.target.value })
                }
                required
                minLength={6}
                className="mt-1"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isPasswordPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {isPasswordPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <Award className="h-4 w-4" /> Perbarui Kata Sandi
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
