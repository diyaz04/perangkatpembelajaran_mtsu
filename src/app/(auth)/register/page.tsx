import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Pendaftaran Ditutup",
};

export default function RegisterPage() {
  return (
    <Card className="border-slate-200 shadow-sm text-center">
      <CardHeader className="pb-3 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <CardTitle className="text-lg text-slate-900">
          Registrasi Mandiri Tidak Tersedia
        </CardTitle>
        <CardDescription className="text-slate-500">
          Sesuai kebijakan keamanan madrasah, seluruh akun guru dan staf didaftarkan langsung oleh Administrator.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-slate-600 space-y-2">
        <p>
          Silakan hubungi Waka Kurikulum atau Administrator MTs KH A Wahab Muhsin untuk mendapatkan kredensial akun Anda.
        </p>
      </CardContent>
      <CardFooter className="pt-2 flex justify-center">
        <Link href="/login" className="w-full">
          <Button variant="outline" className="w-full border-slate-200 gap-2">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Halaman Masuk
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
