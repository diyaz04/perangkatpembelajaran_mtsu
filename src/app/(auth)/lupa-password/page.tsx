"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

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

const lupaPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid"),
});

type LupaPasswordValues = z.infer<typeof lupaPasswordSchema>;

export default function LupaPasswordPage() {
  const [terkirim, setTerkirim] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LupaPasswordValues>({
    resolver: zodResolver(lupaPasswordSchema),
  });

  async function onSubmit(data: LupaPasswordValues) {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error("Gagal mengirim email", {
        description: "Coba lagi dalam beberapa menit",
      });
      return;
    }

    setTerkirim(true);
  }

  if (terkirim) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">Email Terkirim</CardTitle>
          <CardDescription className="text-slate-500">
            Tautan pengaturan ulang kata sandi telah dikirim ke email Anda.
            Silakan periksa kotak masuk (dan folder spam).
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Halaman Masuk
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-slate-900">Lupa Kata Sandi</CardTitle>
        <CardDescription className="text-slate-500">
          Masukkan email Anda dan kami akan mengirim tautan untuk mengatur ulang
          kata sandi.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-slate-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="guru@mts.sch.id"
              autoComplete="email"
              {...register("email")}
              className={
                errors.email ? "border-red-400 focus-visible:ring-red-300" : ""
              }
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
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
            {isSubmitting ? "Mengirim..." : "Kirim Tautan Reset"}
          </Button>
          <Link href="/login" className="w-full">
            <Button variant="ghost" className="w-full text-slate-500">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Masuk
            </Button>
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
