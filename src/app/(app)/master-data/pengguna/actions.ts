"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parsePenggunaExcel, generateRandomPassword } from "@/lib/import/parse-pengguna-excel";
import type { UserRole } from "@/types/database";

const tambahPenggunaSchema = z.object({
  nama_lengkap: z.string().min(2, "Nama lengkap minimal 2 karakter"),
  nip: z.string().optional().nullable(),
  gelar: z.string().optional().nullable(),
  email: z.string().email("Format email tidak valid"),
  role: z.enum(["admin", "kepala", "waka_kurikulum", "guru"]),
  password: z.string().min(6, "Password awal minimal 6 karakter"),
});

export type ActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

/**
 * Server Action: Tambah Pengguna Baru (Guru/Staf) oleh Admin.
 * Menggunakan SUPABASE_SERVICE_ROLE_KEY di sisi server.
 */
export async function tambahPenggunaAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    // 1. Verifikasi role admin
    const session = await requireRole(["admin"]);

    // 2. Parse form data
    const rawData = {
      nama_lengkap: formData.get("nama_lengkap"),
      nip: formData.get("nip") || null,
      gelar: formData.get("gelar") || null,
      email: formData.get("email"),
      role: formData.get("role"),
      password: formData.get("password"),
    };

    const parsed = tambahPenggunaSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Data yang dimasukkan belum valid",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { nama_lengkap, nip, gelar, email, role, password } = parsed.data;

    // 3. Panggil Supabase Admin API
    const adminClient = createAdminClient();

    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nama_lengkap,
        role,
        nip,
        gelar,
      },
    });

    if (createError || !newUser?.user) {
      return {
        success: false,
        message: createError?.message || "Gagal membuat pengguna di auth service",
      };
    }

    // 4. Pastikan tabel profiles tersinkronisasi
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: newUser.user.id,
      nama_lengkap,
      nip: nip || null,
      gelar: gelar || null,
      role: role as UserRole,
      aktif: true,
      created_by: session.user.id,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("Gagal update profiles:", profileError);
    }

    revalidatePath("/master-data/pengguna");
    revalidatePath("/master-data");

    return {
      success: true,
      message: `Pengguna '${nama_lengkap}' (${email}) berhasil didaftarkan sebagai ${role}.`,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan internal server.",
    };
  }
}

/**
 * Server Action: Nonaktifkan / Aktifkan status akun pengguna.
 */
export async function toggleStatusPenggunaAction(
  targetUserId: string,
  currentStatus: boolean
): Promise<ActionState> {
  try {
    const session = await requireRole(["admin"]);

    if (session.user.id === targetUserId) {
      return {
        success: false,
        message: "Anda tidak dapat menonaktifkan akun Anda sendiri.",
      };
    }

    const adminClient = createAdminClient();

    const newStatus = !currentStatus;
    const { error } = await adminClient
      .from("profiles")
      .update({ aktif: newStatus, updated_at: new Date().toISOString() })
      .eq("id", targetUserId);

    if (error) {
      return {
        success: false,
        message: `Gagal memperbarui status pengguna: ${error.message}`,
      };
    }

    revalidatePath("/master-data/pengguna");
    revalidatePath("/master-data");

    return {
      success: true,
      message: `Akun berhasil di-${newStatus ? "aktifkan" : "nonaktifkan"}.`,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengubah status akun.",
    };
  }
}

/**
 * Server Action: Reset Kata Sandi Pengguna oleh Admin.
 */
export async function resetPasswordPenggunaAction(
  targetUserId: string,
  newPassword: string
): Promise<ActionState> {
  try {
    await requireRole(["admin"]);

    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        message: "Password baru minimal 6 karakter.",
      };
    }

    const adminClient = createAdminClient();

    const { error } = await adminClient.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
    });

    if (error) {
      return {
        success: false,
        message: `Gagal me-reset password: ${error.message}`,
      };
    }

    revalidatePath("/master-data/pengguna");

    return {
      success: true,
      message: "Password pengguna berhasil diperbarui.",
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal me-reset kata sandi.",
    };
  }
}

export interface ImportPenggunaRowResult {
  rowNumber: number;
  nama_lengkap: string;
  email: string;
  status: "berhasil" | "gagal";
  message: string;
  generatedPassword?: string;
}

export type ImportPenggunaState = {
  success?: boolean;
  message?: string;
  results?: ImportPenggunaRowResult[];
};

/**
 * Server Action: Import Pengguna/Guru secara massal dari file Excel (.xlsx)
 * yang mengikuti format Template Import Pengguna & Guru.
 */
export async function importPenggunaAction(
  prevState: ImportPenggunaState,
  formData: FormData
): Promise<ImportPenggunaState> {
  try {
    const session = await requireRole(["admin"]);

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return { success: false, message: "File Excel tidak ditemukan. Pilih file terlebih dahulu." };
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx") {
      return { success: false, message: "Format file harus berupa .xlsx (gunakan template yang disediakan)." };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, message: "Ukuran file maksimal 5 MB." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let parsedRows;
    try {
      parsedRows = await parsePenggunaExcel(buffer);
    } catch {
      return {
        success: false,
        message: "Gagal membaca file Excel. Pastikan file tidak rusak dan mengikuti format template.",
      };
    }

    if (parsedRows.length === 0) {
      return {
        success: false,
        message: "Tidak ada data pada file. Isi minimal 1 baris data pengguna mulai dari baris ke-2.",
      };
    }

    const adminClient = createAdminClient();

    // Ambil daftar email yang sudah terdaftar untuk mencegah duplikasi
    const { data: existingUsersRes } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const existingEmails = new Set(
      (existingUsersRes?.users || [])
        .map((u) => u.email?.toLowerCase())
        .filter((e): e is string => !!e)
    );

    const results: ImportPenggunaRowResult[] = [];
    const emailsInFile = new Set<string>();

    for (const row of parsedRows) {
      const baseResult = {
        rowNumber: row.rowNumber,
        nama_lengkap: row.nama_lengkap || "-",
        email: row.email || "-",
      };

      if (row.errors.length > 0) {
        results.push({
          ...baseResult,
          status: "gagal",
          message: row.errors.join("; "),
        });
        continue;
      }

      if (existingEmails.has(row.email) || emailsInFile.has(row.email)) {
        results.push({
          ...baseResult,
          status: "gagal",
          message: "Email sudah terdaftar / duplikat pada file.",
        });
        continue;
      }

      const password = row.password || generateRandomPassword();

      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: row.email,
        password,
        email_confirm: true,
        user_metadata: {
          nama_lengkap: row.nama_lengkap,
          role: row.role,
          nip: row.nip,
          gelar: row.gelar,
        },
      });

      if (createError || !newUser?.user) {
        results.push({
          ...baseResult,
          status: "gagal",
          message: createError?.message || "Gagal membuat akun di auth service.",
        });
        continue;
      }

      const { error: profileError } = await adminClient.from("profiles").upsert({
        id: newUser.user.id,
        nama_lengkap: row.nama_lengkap,
        nip: row.nip,
        gelar: row.gelar,
        role: row.role as UserRole,
        aktif: true,
        created_by: session.user.id,
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error("Gagal upsert profile saat import:", profileError);
      }

      emailsInFile.add(row.email);

      results.push({
        ...baseResult,
        status: "berhasil",
        message: row.password ? "Akun berhasil dibuat." : "Akun berhasil dibuat dengan password otomatis.",
        generatedPassword: row.password ? undefined : password,
      });
    }

    revalidatePath("/master-data/pengguna");
    revalidatePath("/master-data");

    const successCount = results.filter((r) => r.status === "berhasil").length;
    const failCount = results.length - successCount;

    return {
      success: successCount > 0,
      message: `Import selesai: ${successCount} berhasil, ${failCount} gagal dari ${results.length} baris.`,
      results,
    };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan internal server saat import.",
    };
  }
}
