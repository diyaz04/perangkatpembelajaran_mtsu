import { requireAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { getDashboardGuruDataAction } from "./dashboard-actions";
import { getRekapKelengkapanAction } from "@/lib/validasi/actions";
import { DashboardGuruClient } from "./dashboard-guru-client";
import { DashboardStaffClient } from "./dashboard-staff-client";

export const metadata = {
  title: "Beranda | Perangkat Pembelajaran KBC",
  description: "Sistem Administrasi Pembelajaran Kurikulum Berbasis Cinta MTs KH A Wahab Muhsin",
};

export const dynamic = "force-dynamic";

export default async function BerandaPage() {
  const session = await requireAuth();
  const role = session.profile.role;
  const namaLengkap = session.profile.nama_lengkap || session.user.email?.split("@")[0] || "Pengguna";

  const isStaff = role === "admin" || role === "kepala" || role === "waka_kurikulum";

  let guruData = null;
  let staffData = null;

  if (isStaff) {
    const staffRes = await getRekapKelengkapanAction();
    staffData = staffRes.success ? staffRes.data : null;
  } else {
    const guruRes = await getDashboardGuruDataAction();
    guruData = guruRes.success ? guruRes.data : null;
  }

  const getRoleLabel = (r: string) => {
    switch (r) {
      case "kepala":
        return "Kepala Madrasah";
      case "waka_kurikulum":
        return "Waka Kurikulum";
      case "admin":
        return "Administrator";
      case "guru":
      default:
        return "Guru Pengampu";
    }
  };

  return (
    <div className="flex-1 p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Beranda */}
      <PageHeader
        title={`Assalamu'alaikum, ${namaLengkap.split(" ")[0]}!`}
        description={`${getRoleLabel(role)} · MTs KH A Wahab Muhsin, Tasikmalaya`}
        badge={
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Fase D · KBC
          </Badge>
        }
      />

      {isStaff && staffData ? (
        <DashboardStaffClient
          data={staffData}
          namaPengguna={namaLengkap}
          role={role}
        />
      ) : (
        guruData && (
          <DashboardGuruClient
            data={guruData}
            namaGuru={namaLengkap}
          />
        )
      )}
    </div>
  );
}
