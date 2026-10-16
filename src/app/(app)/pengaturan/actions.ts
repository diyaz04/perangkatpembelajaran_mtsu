"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

const updateProfilSchema = z.object({
  nama_lengkap: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  nip: z.string().optional().nullable(),
  gelar: z.string().optional().nullable(),
});

/**
 * Server Action: Pengguna memperbarui profil miliknya sendiri.
 */
export async function updateProfilAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const session = await requireAuth();
    const supabase = await createClient();

    const rawData = {
      nama_lengkap: formData.get("nama_lengkap"),
      nip: formData.get("nip") || null,
      gelar: formData.get("gelar") || null,
    };

    const parsed = updateProfilSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Data yang dimasukkan belum valid",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { nama_lengkap, nip, gelar } = parsed.data;

    const { error } = await supabase
      .from("profiles")
      .update({
        nama_lengkap,
        nip: nip || null,
        gelar: gelar || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    if (error) {
      return {
        success: false,
        message: `Gagal memperbarui profil: ${error.message}`,
      };
    }

    revalidatePath("/pengaturan");
    revalidatePath("/profil");
    revalidatePath("/");

    return {
      success: true,
      message: "Profil Anda berhasil diperbarui.",
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan profil.",
    };
  }
}

const updatePasswordSchema = z
  .object({
    password: z.string().min(6, "Password minimal 6 karakter"),
    konfirmasi_password: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.konfirmasi_password, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["konfirmasi_password"],
  });

/**
 * Server Action: Pengguna mengganti password akun miliknya sendiri.
 */
export async function updatePasswordAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireAuth();
    const supabase = await createClient();

    const rawData = {
      password: formData.get("password"),
      konfirmasi_password: formData.get("konfirmasi_password"),
    };

    const parsed = updatePasswordSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Kata sandi yang dimasukkan belum valid",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { password } = parsed.data;

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return {
        success: false,
        message: `Gagal memperbarui kata sandi: ${error.message}`,
      };
    }

    return {
      success: true,
      message: "Kata sandi Anda berhasil diperbarui.",
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan saat mengganti password.",
    };
  }
}
