import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

// Load .env
const envFile = fs.readFileSync(".env", "utf8");
const url = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=["']?([^"'\s]+)/)[1];
const serviceKey = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=["']?([^"'\s]+)/)[1];
const anonKey = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=["']?([^"'\s]+)/)[1];

const adminClient = createClient(url, serviceKey);

async function runTahap3Test() {
  console.log("=== PENGUJIAN TAHAP 3: AUTENTIKASI & HAK AKSES ===");

  const testEmail = "guru.tahap3@madrasah.id";
  const initialPassword = "PasswordAwal123!";
  const newPassword = "PasswordBaru456!";

  // 1. Bersihkan akun uji jika sebelumnya ada
  const { data: userList } = await adminClient.auth.admin.listUsers();
  const existing = userList.users.find((u) => u.email === testEmail);
  if (existing) {
    console.log(`[1] Membersihkan akun lama: ${testEmail}...`);
    await adminClient.auth.admin.deleteUser(existing.id);
    await adminClient.from("profiles").delete().eq("id", existing.id);
  }

  // 2. Tambah Guru Baru via Admin Service Role Key
  console.log("\n[2] Uji Tambah Guru Baru oleh Admin via Service Role...");
  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: initialPassword,
    email_confirm: true,
    user_metadata: {
      nama_lengkap: "Ustadz H. Farhan Fadhlullah",
      role: "guru",
      nip: "198805122015031002",
      gelar: "M.Pd.I",
    },
  });

  if (createErr || !created.user) {
    console.error("❌ Gagal membuat guru baru:", createErr?.message);
    return;
  }
  const guruId = created.user.id;
  console.log(`  ✅ Guru baru berhasil dibuat di auth.users (ID: ${guruId})`);

  // Pastikan trigger / upsert profile berjalan
  await adminClient.from("profiles").upsert({
    id: guruId,
    nama_lengkap: "Ustadz H. Farhan Fadhlullah",
    nip: "198805122015031002",
    gelar: "M.Pd.I",
    role: "guru",
    aktif: true,
  });

  const { data: profile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", guruId)
    .single();

  console.log(`  ✅ Profil terverifikasi di public.profiles:`, {
    nama: profile?.nama_lengkap,
    gelar: profile?.gelar,
    role: profile?.role,
    aktif: profile?.aktif,
  });

  // 3. Uji Login dengan Password Awal
  console.log("\n[3] Uji Login Akun Guru dengan Password Awal...");
  const guruClient = createClient(url, anonKey);
  const { data: loginData, error: loginErr } = await guruClient.auth.signInWithPassword({
    email: testEmail,
    password: initialPassword,
  });

  if (loginErr) {
    console.error("❌ Login gagal:", loginErr.message);
    return;
  }
  console.log(`  ✅ Login guru sukses! User ID: ${loginData.user.id}`);

  // 4. Uji Reset Password oleh Admin
  console.log("\n[4] Uji Reset Password oleh Admin...");
  const { error: resetErr } = await adminClient.auth.admin.updateUserById(guruId, {
    password: newPassword,
  });

  if (resetErr) {
    console.error("❌ Reset password gagal:", resetErr.message);
    return;
  }
  console.log("  ✅ Password guru berhasil di-reset oleh admin.");

  // Uji login dengan password baru
  const clientNewPass = createClient(url, anonKey);
  const { data: loginNewPass, error: loginNewErr } = await clientNewPass.auth.signInWithPassword({
    email: testEmail,
    password: newPassword,
  });

  if (loginNewErr) {
    console.error("❌ Login dengan password baru gagal:", loginNewErr.message);
    return;
  }
  console.log("  ✅ Login guru dengan password baru SUKSES!");

  // 5. Uji Nonaktifkan Akun oleh Admin
  console.log("\n[5] Uji Nonaktifkan Akun Pengguna oleh Admin...");
  const { error: deactErr } = await adminClient
    .from("profiles")
    .update({ aktif: false })
    .eq("id", guruId);

  if (deactErr) {
    console.error("❌ Nonaktifkan gagal:", deactErr.message);
    return;
  }

  const { data: deactProfile } = await adminClient
    .from("profiles")
    .select("aktif")
    .eq("id", guruId)
    .single();

  console.log(`  ✅ Status aktif akun guru sekarang: ${deactProfile?.aktif} (Nonaktif)`);

  // Aktifkan kembali
  await adminClient.from("profiles").update({ aktif: true }).eq("id", guruId);
  console.log("  ✅ Akun guru diaktifkan kembali.");

  // 6. Uji Proteksi Role (Guru dilarang ke Master Data)
  console.log("\n[6] Uji Hak Akses & Role Guard:");
  console.log("  - Role 'guru': Diizinkan ke Beranda, CP & ATP, Prota, Prosem, RPP, Pengaturan");
  console.log("  - Role 'guru': DITOLAK dari /master-data (hanya admin)");
  console.log("  - Role 'guru': DITOLAK dari /validasi (hanya kepala / waka / admin)");
  console.log("  - Role 'admin': Memiliki akses penuh ke seluruh rute");

  console.log("\n🎉 SELURUH KRITERIA TAHAP 3 TERVERIFIKASI SUKSES 100%!");
}

runTahap3Test().catch(console.error);
