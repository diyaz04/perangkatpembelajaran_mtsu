"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Kata sandi minimal 8 karakter")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Kata sandi harus mengandung huruf besar, huruf kecil, dan angka"
      ),
    konfirmasi_password: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
  })
  .refine((data) => data.password === data.konfirmasi_password, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["konfirmasi_password"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  async function onSubmit(data: ResetPasswordValues) {
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      toast.error("Gagal mengubah kata sandi", {
        description: error.message || "Tautan mungkin telah kedaluwarsa",
      });
      return;
    }

    toast.success("Kata sandi berhasil diperbarui!", {
      description: "Silakan masuk dengan kata sandi baru Anda.",
    });
    router.push("/login");
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-slate-900">Perbarui Kata Sandi</CardTitle>
        <CardDescription className="text-slate-500">
          Masukkan kata sandi baru untuk akun Anda
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-slate-700">
              Kata Sandi Baru
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 karakter"
                autoComplete="new-password"
                {...register("password")}
                className={
                  errors.password
                    ? "border-red-400 focus-visible:ring-red-300 pr-10"
                    : "pr-10"
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? "Sembunyikan" : "Tampilkan"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="konfirmasi_password" className="text-slate-700">
              Konfirmasi Kata Sandi Baru
            </Label>
            <div className="relative">
              <Input
                id="konfirmasi_password"
                type={showKonfirmasi ? "text" : "password"}
                placeholder="Ulangi kata sandi baru"
                autoComplete="new-password"
                {...register("konfirmasi_password")}
                className={
                  errors.konfirmasi_password
                    ? "border-red-400 focus-visible:ring-red-300 pr-10"
                    : "pr-10"
                }
              />
              <button
                type="button"
                onClick={() => setShowKonfirmasi(!showKonfirmasi)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showKonfirmasi ? "Sembunyikan" : "Tampilkan"}
              >
                {showKonfirmasi ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.konfirmasi_password && (
              <p className="text-xs text-red-500">
                {errors.konfirmasi_password.message}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Menyimpan..." : "Simpan Kata Sandi Baru"}
          </Button>
          <Link href="/login" className="w-full text-center text-sm text-slate-500 hover:underline">
            Kembali ke Masuk
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
