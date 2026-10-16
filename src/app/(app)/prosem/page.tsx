import Link from "next/link";
import { getProsemPenugasanListAction } from "./actions";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import {
  LayoutList,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  GraduationCap,
  Calendar,
} from "lucide-react";

export const metadata = {
  title: "Program Semester (Prosem) | SIM Perangkat Pembelajaran KBC",
  description: "Matriks Distribusi Alokasi Waktu Mingguan Program Semester Kurikulum Berbasis Cinta",
};

export default async function ProsemPage() {
  const result = await getProsemPenugasanListAction();
  const penugasanList = result.success ? result.data : [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "disetujui":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3 h-3" />
            Disetujui
          </Badge>
        );
      case "diajukan":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3" />
            Diajukan
          </Badge>
        );
      case "revisi":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 flex items-center gap-1 text-[11px]">
            <AlertCircle className="w-3 h-3" />
            Revisi
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200 text-[11px]">
            Draf
          </Badge>
        );
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Program Semester (Prosem)"
        description="Matriks alokasi waktu mingguan per Tujuan Pembelajaran (TP) berbasis kalender pendidikan dan minggu efektif madrasah"
        actions={
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800 gap-1.5 py-1 px-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Distribusi Matriks Mingguan
          </Badge>
        }
      />

      {penugasanList.length === 0 ? (
        <EmptyState
          icon={LayoutList}
          title="Belum Ada Penugasan Mengajar Aktif"
          description={
            result.error ||
            "Anda belum memiliki penugasan mengajar di tahun ajaran aktif, atau admin madrasah belum mengatur penugasan guru."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {penugasanList.map((item) => {
            return (
              <Card
                key={item.id}
                className="flex flex-col border border-slate-200/90 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white"
              >
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 font-semibold text-xs">
                      Kelas {item.tingkat_kelas} ({item.rombel})
                    </Badge>
                    <span className="text-xs font-mono text-slate-500 font-medium">
                      {item.mapel.jp_per_minggu} JP/minggu
                    </span>
                  </div>
                  <CardTitle className="text-lg font-bold text-slate-900 mt-2 line-clamp-1">
                    {item.mapel.nama}
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.guru.nama_lengkap}</span>
                    {item.guru.nip && <span className="text-slate-400">({item.guru.nip})</span>}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 py-4 space-y-4">
                  {/* Kartu Status Semester 1 */}
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">Semester 1 (Ganjil)</span>
                        <span className="text-[11px] text-slate-500">
                          ({item.semester1.minggu_efektif} mg efektif)
                        </span>
                      </div>
                      {getStatusBadge(item.semester1.status)}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Alokasi Matriks:</span>
                      <span className="font-semibold text-slate-900">
                        {item.semester1.total_jp_terdistribusi} / {item.semester1.total_jp_efektif} JP
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          item.semester1.total_jp_terdistribusi > item.semester1.total_jp_efektif
                            ? "bg-rose-500"
                            : "bg-emerald-600"
                        }`}
                        style={{
                          width: `${
                            item.semester1.total_jp_efektif > 0
                              ? Math.min(
                                  100,
                                  (item.semester1.total_jp_terdistribusi / item.semester1.total_jp_efektif) * 100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Link
                        href={`/prosem/${item.id}/preview?semester=1`}
                        className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Pratinjau Smt 1
                      </Link>
                      <Link
                        href={`/prosem/${item.id}?semester=1`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "xs",
                          className: "text-emerald-700 hover:bg-emerald-50 border-emerald-200 font-medium",
                        })}
                      >
                        Matriks Smt 1 &rarr;
                      </Link>
                    </div>
                  </div>

                  {/* Kartu Status Semester 2 */}
                  <div className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">Semester 2 (Genap)</span>
                        <span className="text-[11px] text-slate-500">
                          ({item.semester2.minggu_efektif} mg efektif)
                        </span>
                      </div>
                      {getStatusBadge(item.semester2.status)}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Alokasi Matriks:</span>
                      <span className="font-semibold text-slate-900">
                        {item.semester2.total_jp_terdistribusi} / {item.semester2.total_jp_efektif} JP
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          item.semester2.total_jp_terdistribusi > item.semester2.total_jp_efektif
                            ? "bg-rose-500"
                            : "bg-emerald-600"
                        }`}
                        style={{
                          width: `${
                            item.semester2.total_jp_efektif > 0
                              ? Math.min(
                                  100,
                                  (item.semester2.total_jp_terdistribusi / item.semester2.total_jp_efektif) * 100
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Link
                        href={`/prosem/${item.id}/preview?semester=2`}
                        className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        Pratinjau Smt 2
                      </Link>
                      <Link
                        href={`/prosem/${item.id}?semester=2`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "xs",
                          className: "text-emerald-700 hover:bg-emerald-50 border-emerald-200 font-medium",
                        })}
                      >
                        Matriks Smt 2 &rarr;
                      </Link>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>TP {item.tahun_ajaran.nama}</span>
                  </div>

                  <Link
                    href={`/prosem/${item.id}?semester=1`}
                    className={buttonVariants({
                      variant: "default",
                      size: "sm",
                      className: "bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs",
                    })}
                  >
                    <span>Buka Editor Prosem</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
