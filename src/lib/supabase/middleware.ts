import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database, UserRole } from "@/types/database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  // 1. Tanpa registrasi publik: redirect rute /register ke /login
  if (pathname.startsWith("/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Rute publik yang diizinkan tanpa autentikasi
  const publicRoutes = ["/login", "/lupa-password", "/reset-password"];
  const isPublicRoute = pathname === "/" || publicRoutes.some((route) => pathname.startsWith(route));

  // Cek apakah ada cookie session Supabase
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.includes("auth-token")
  );

  // Fast-path: jika tidak ada cookie autentikasi sama sekali
  if (!hasAuthCookie) {
    if (!isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // 2. Verifikasi user via Supabase Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect ke /login jika pengguna belum login dan mengakses rute terlindungi
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect ke /dashboard jika pengguna sudah login dan mengakses rute auth publik
  if (user && isPublicRoute && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 3. Guard rute berdasarkan Role HANYA untuk rute restricted (/master-data & /validasi)
  // Untuk rute umum (/, /atp, /prota, /prosem, /modul-ajar, /pengaturan), tidak perlu query DB profil di middleware
  const isBankData = pathname.startsWith("/master-data/bank-data");
  const isMasterData = pathname.startsWith("/master-data") && !isBankData;
  const isValidasi = pathname.startsWith("/validasi");

  if (user && (isBankData || isMasterData || isValidasi)) {
    let role = (user.user_metadata?.role as UserRole) || null;

    // Jika role belum ada di metadata atau bukan admin/waka saat buka restricted route, verifikasi ke DB
    if (!role || (isMasterData && role !== "admin") || (isBankData && !["admin", "waka_kurikulum"].includes(role))) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, aktif")
        .eq("id", user.id)
        .maybeSingle();

      if (profile && !profile.aktif) {
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("error", "deactivated");
        return NextResponse.redirect(url);
      }

      role = profile?.role ?? "guru";
    }

    if (isBankData && !["admin", "waka_kurikulum"].includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }

    if (isMasterData && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }

    if (isValidasi && !["admin", "kepala", "waka_kurikulum"].includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
