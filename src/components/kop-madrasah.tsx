import type { KopMadrasahData } from "@/lib/export/types";

interface KopMadrasahProps {
  madrasah: KopMadrasahData;
  className?: string;
}

export function KopMadrasah({ madrasah, className = "" }: KopMadrasahProps) {
  return (
    <div className={`border-b-4 border-double border-slate-900 pb-4 mb-6 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        {/* Logo Madrasah */}
        <div className="w-24 h-24 flex items-center justify-center shrink-0">
          {madrasah.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={madrasah.logo_url}
              alt="Logo Madrasah"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-emerald-800 text-white flex flex-col items-center justify-center text-center p-1 border-2 border-emerald-900 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-tighter">IKHLAS</span>
              <span className="text-[9px] font-bold">BERAMAL</span>
            </div>
          )}
        </div>

        {/* Teks Kop Resmi */}
        <div className="flex-1 text-center space-y-0.5">
          <h4 className="text-xs md:text-sm font-semibold tracking-wider uppercase text-slate-800">
            Kementerian Agama Republik Indonesia
          </h4>
          <h3 className="text-xs md:text-sm font-semibold tracking-wider uppercase text-slate-800">
            Kantor Kementerian Agama {madrasah.kabupaten || "Kabupaten Tasikmalaya"}
          </h3>
          <h2 className="text-base md:text-xl font-black uppercase text-slate-900 tracking-tight">
            {madrasah.nama}
          </h2>
          <p className="text-[11px] md:text-xs text-slate-600">
            NSM: {madrasah.nsm || "-"} • NPSN: {madrasah.npsn || "-"}
          </p>
          <p className="text-[11px] md:text-xs text-slate-600">
            {madrasah.alamat || "Jl. Sukahideng No. 01 Sukarame"}, {madrasah.kabupaten || "Tasikmalaya"}
          </p>
        </div>

        {/* Spacer penyeimbang kop */}
        <div className="w-24 shrink-0 hidden md:block" />
      </div>
    </div>
  );
}
