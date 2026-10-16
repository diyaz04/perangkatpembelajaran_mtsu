import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Baca .env manual
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value.trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes("your-project.supabase.co")) {
  console.error("ERROR: NEXT_PUBLIC_SUPABASE_URL belum diisi dengan URL Supabase asli!");
  process.exit(1);
}

console.log("Menghubungkan ke Supabase:", supabaseUrl);
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey || anonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  const email = "admin@gmail.com";
  const password = "admin123";
  const namaLengkap = "Administrator Madrasah";
  const jabatan = "Administrator";

  console.log("1. Mendaftarkan user ke auth.users...");
  let userId = null;

  // Cek apakah user sudah ada
  const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = listData?.users?.find((u) => u.email === email);

  if (existingUser) {
    console.log("User sudah ada! Memperbarui password dan status admin...");
    userId = existingUser.id;
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      user_metadata: {
        nama_lengkap: namaLengkap,
        role: "admin",
        jabatan: jabatan,
      },
      app_metadata: {
        role: "admin",
      },
    });

    if (updateErr) {
      console.error("Gagal update user:", updateErr.message);
      process.exit(1);
    }
    console.log("Password dan role berhasil diperbarui.");
  } else {
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nama_lengkap: namaLengkap,
        role: "admin",
        jabatan: jabatan,
      },
      app_metadata: {
        role: "admin",
      },
    });

    if (createErr) {
      console.error("Gagal membuat user:", createErr.message);
      process.exit(1);
    }
    userId = newUser.user.id;
    console.log("User baru berhasil dibuat dengan ID:", userId);
  }

  // 2. Simpan/Update ke tabel profiles
  console.log("2. Menyinkronkan profil ke tabel profiles...");
  const { error: profileErr } = await supabaseAdmin.from("profiles").upsert(
    {
      id: userId,
      nama_lengkap: namaLengkap,
      role: "admin",
      aktif: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profileErr) {
    console.warn("Catatan: Tabel profiles belum ada atau RLS blok, tapi user auth sudah siap:", profileErr.message);
  } else {
    console.log("Profil di tabel public.profiles berhasil disimpan sebagai Administrator!");
  }

  // 3. Test sign in
  console.log("3. Menguji autentikasi login...");
  const clientSupabase = createClient(supabaseUrl, anonKey);
  const { data: loginData, error: loginErr } = await clientSupabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginErr) {
    console.error("Uji login gagal:", loginErr.message);
    process.exit(1);
  }

  console.log("✅ UJI LOGIN BERHASIL 100%!");
  console.log("=========================================");
  console.log("Email   : " + email);
  console.log("Password: " + password);
  console.log("Role    : Administrator");
  console.log("Madrasah: MTs KH A Wahab Muhsin");
  console.log("=========================================");
}

main().catch((err) => {
  console.error("Terjadi error tak terduga:", err);
  process.exit(1);
});
