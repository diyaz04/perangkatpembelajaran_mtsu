"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  History,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StatusTimelineItem } from "@/lib/validasi/types";
import { getRiwayatValidasiAction } from "@/lib/validasi/actions";
import type { DokumenTipe } from "@/types/database";

interface StatusTimelineProps {
  dokumenTipe: DokumenTipe;
  dokumenId: string;
  initialItems?: StatusTimelineItem[];
  refreshTrigger?: number;
}

export function StatusTimeline({
  dokumenTipe,
  dokumenId,
  initialItems,
  refreshTrigger,
}: StatusTimelineProps) {
  const [items, setItems] = useState<StatusTimelineItem[]>(initialItems || []);
  const [loading, setLoading] = useState<boolean>(!initialItems);

  useEffect(() => {
    let isMounted = true;
    async function loadTimeline() {
      setLoading(true);
      const res = await getRiwayatValidasiAction(dokumenTipe, dokumenId);
      if (isMounted) {
        if (res.success) {
          setItems(res.data);
        }
        setLoading(false);
      }
    }

    loadTimeline();
    return () => {
      isMounted = false;
    };
  }, [dokumenTipe, dokumenId, refreshTrigger]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "disetujui":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Disetujui
          </Badge>
        );
      case "diajukan":
        return (
          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="w-3 h-3 mr-1" /> Diajukan
          </Badge>
        );
      case "revisi":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-rose-200">
            <AlertCircle className="w-3 h-3 mr-1" /> Perlu Revisi
          </Badge>
        );
      case "draf":
      default:
        return (
          <Badge variant="outline" className="text-slate-600 bg-slate-50 border-slate-200">
            <FileText className="w-3 h-3 mr-1" /> Draf
          </Badge>
        );
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-semibold text-slate-800">Riwayat Status & Validasi</h3>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {items.length} catatan
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-xs text-slate-400 gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Memuat riwayat validasi...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-400">
          <Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p>Belum ada riwayat perubahan status tercatat.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {items.map((item) => {
            const isRevisi = item.status_sesudah === "revisi";
            const isApproved = item.status_sesudah === "disetujui";
            const isSubmitted = item.status_sesudah === "diajukan";

            const dotColor = isApproved
              ? "bg-emerald-500 ring-emerald-100"
              : isRevisi
              ? "bg-rose-500 ring-rose-100"
              : isSubmitted
              ? "bg-blue-500 ring-blue-100"
              : "bg-slate-400 ring-slate-100";

            let dateFormatted = item.tanggal;
            try {
              dateFormatted = format(new Date(item.tanggal), "d MMMM yyyy, HH:mm", {
                locale: localeId,
              });
            } catch {
              // fallback
            }

            return (
              <div key={item.id} className="relative group">
                {/* Dot */}
                <div
                  className={`absolute -left-[19px] top-1 w-3.5 h-3.5 rounded-full ring-4 ${dotColor}`}
                />

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900">
                      {item.validator_nama}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-slate-500">
                      <User className="w-2.5 h-2.5 mr-1" />
                      {getRoleLabel(item.validator_role)}
                    </Badge>
                    <span className="text-[11px] text-slate-400 ml-auto">
                      {dateFormatted}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span>Status:</span>
                    {getStatusBadge(item.status_sebelum)}
                    <span className="text-slate-400">→</span>
                    {getStatusBadge(item.status_sesudah)}
                  </div>

                  {item.catatan && (
                    <div
                      className={`rounded-lg p-2.5 text-xs leading-relaxed border ${
                        isRevisi
                          ? "bg-rose-50/70 border-rose-200 text-rose-800"
                          : isApproved
                          ? "bg-emerald-50/60 border-emerald-200 text-emerald-800"
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      <p className="font-medium mb-0.5 text-[11px]">
                        {isRevisi ? "Catatan Revisi / Perbaikan:" : "Catatan Telaah:"}
                      </p>
                      <p className="whitespace-pre-wrap">{item.catatan}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
