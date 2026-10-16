"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  School,
  Upload,
  Loader2,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import {
  updateMadrasahAction,
  uploadMadrasahLogoAction,
  type MadrasahData,
} from "../actions";

interface TabProfilMadrasahProps {
  initialData?: MadrasahData | null;
}

export function TabProfilMadrasah({ initialData }: TabProfilMadrasahProps) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<MadrasahData>({
    id: initialData?.id || "",
    nama: initialData?.nama || "MTs KH A Wahab Muhsin",
    nsm: initialData?.nsm || "",
    npsn: initialData?.npsn || "",
    alamat: initialData?.alamat || "",
    kabupaten: initialData?.kabupaten || "Kabupaten Tasikmalaya",
    kepala_nama: initialData?.kepala_nama || "",
    kepala_nip: initialData?.kepala_nip || "",
    logo_url: initialData?.logo_url || null,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await updateMadrasahAction(form);
    setSaving(false);

    if (res.success) {
      toast.success("Profil madrasah berhasil diperbarui!");
    } else {
      toast.error(res.error || "Gagal memperbarui profil");
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    const res = await uploadMadrasahLogoAction(formData);
    setUploading(false);

    if (res.success && res.url) {
      setForm((prev) => ({ ...prev, logo_url: res.url }));
      toast.success("Logo madrasah berhasil diunggah!");
    } else {
      toast.error(res.error || "Gagal mengunggah logo");
    }
  }

  return (
    <div className="space-y-6">
      <Alert className="border-emerald-200 bg-emerald-50/60 text-emerald-950">
        <FileText className="h-4 w-4 text-emerald-600" />
        <AlertTitle className="font-semibold text-emerald-800">
          Kop Surat & Validasi Resmi Dokumen
        </AlertTitle>
        <AlertDescription className="text-xs text-emerald-700">
          Identitas madrasah, logo, dan pimpinan yang diatur di halaman ini akan
          otomatis dipakai di kop surat serta tanda tangan semua dokumen
          perangkat pembelajaran (ATP, Prota, Prosem, dan Modul Ajar).
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kartu Logo Madrasah */}
          <Card className="border-slate-200 shadow-xs lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-emerald-600" />
                Logo Madrasah
              </CardTitle>
              <CardDescription className="text-xs">
                Format PNG/JPG/WEBP, maksimal 3 MB. Disimpan di Supabase Storage
                bucket <code className="font-mono text-emerald-700">public-assets</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 pt-0 space-y-4">
              <div className="relative w-40 h-40 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center bg-slate-50 overflow-hidden group">
                {form.logo_url ? (
                  <Image
                    src={form.logo_url}
                    alt="Logo Madrasah"
                    fill
                    sizes="160px"
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400 text-xs text-center p-4">
                    <School className="h-12 w-12 mb-2 text-slate-300" />
                    <span>Belum ada logo madrasah</span>
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  </div>
                )}
              </div>

              <div className="w-full">
                <Label
                  htmlFor="logo-upload"
                  className="cursor-pointer flex items-center justify-center gap-2 border border-slate-300 hover:border-emerald-600 hover:bg-emerald-50/50 text-slate-700 font-medium py-2 px-4 rounded-lg text-xs transition"
                >
                  <Upload className="h-4 w-4 text-emerald-600" />
                  {uploading ? "Mengunggah..." : "Pilih File Logo"}
                </Label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Detail Madrasah */}
          <Card className="border-slate-200 shadow-xs lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <School className="h-4 w-4 text-emerald-600" />
                Identitas Lembaga
              </CardTitle>
              <CardDescription className="text-xs">
                Identitas resmi madrasah berdasarkan perizinan dan pangkalan data Kemenag / EMIS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nama" className="text-xs font-medium">
                  Nama Madrasah <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nama"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Contoh: MTs KH A Wahab Muhsin"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nsm" className="text-xs font-medium">
                    NSM (Nomor Statistik Madrasah)
                  </Label>
                  <Input
                    id="nsm"
                    value={form.nsm || ""}
                    onChange={(e) => setForm({ ...form, nsm: e.target.value })}
                    placeholder="Contoh: 121232060001"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="npsn" className="text-xs font-medium">
                    NPSN (Nomor Pokok Sekolah Nasional)
                  </Label>
                  <Input
                    id="npsn"
                    value={form.npsn || ""}
                    onChange={(e) => setForm({ ...form, npsn: e.target.value })}
                    placeholder="Contoh: 20277812"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="kabupaten" className="text-xs font-medium">
                  Kabupaten / Kota
                </Label>
                <Input
                  id="kabupaten"
                  value={form.kabupaten || ""}
                  onChange={(e) =>
                    setForm({ ...form, kabupaten: e.target.value })
                  }
                  placeholder="Contoh: Kabupaten Tasikmalaya"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alamat" className="text-xs font-medium">
                  Alamat Lengkap Madrasah
                </Label>
                <Textarea
                  id="alamat"
                  rows={2}
                  value={form.alamat || ""}
                  onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                  placeholder="Contoh: Jl. Sukahideng No. 01, Kec. Sukarame, Kab. Tasikmalaya, Jawa Barat"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Pimpinan Madrasah (Penanda Tangan)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="kepala_nama" className="text-xs font-medium">
                      Nama Kepala Madrasah
                    </Label>
                    <Input
                      id="kepala_nama"
                      value={form.kepala_nama || ""}
                      onChange={(e) =>
                        setForm({ ...form, kepala_nama: e.target.value })
                      }
                      placeholder="Contoh: Drs. H. Ahmad Fauzi, M.Pd.I"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="kepala_nip" className="text-xs font-medium">
                      NIP Kepala Madrasah
                    </Label>
                    <Input
                      id="kepala_nip"
                      value={form.kepala_nip || ""}
                      onChange={(e) =>
                        setForm({ ...form, kepala_nip: e.target.value })
                      }
                      placeholder="Contoh: 197508172005011002 atau -"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {saving ? "Menyimpan Perubahan..." : "Simpan Profil Madrasah"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
