"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Loader2,
  FileArchive,
  Search,
  CheckSquare,
  Square,
  FileText,
  Layers,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import type { BatchExportItemData } from "./actions";

interface BatchExportClientProps {
  items: BatchExportItemData[];
}

interface SelectedDoc {
  jenis: "atp" | "prota" | "prosem" | "rpp";
  id: string;
  semester?: 1 | 2;
  label: string;
}

export function BatchExportClient({ items }: BatchExportClientProps) {
  const [selectedDocs, setSelectedDocs] = useState<Map<string, SelectedDoc>>(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTingkat, setFilterTingkat] = useState<string>("all");
  const [paperSize, setPaperSize] = useState<"A4" | "F4">("A4");
  const [fontFamily, setFontFamily] = useState<"Times New Roman" | "Arial">("Times New Roman");
  const [exportFormat, setExportFormat] = useState<"docx" | "pdf">("docx");
  const [isExporting, setIsExporting] = useState(false);
  const [downloadingTeacherId, setDownloadingTeacherId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Unduh ZIP Semua Dokumen Tervalidasi Per Guru (Word / PDF)
  const handleDownloadTeacherZip = async (
    guruId: string,
    guruNama: string,
    format: "docx" | "pdf" = exportFormat
  ) => {
    setDownloadingTeacherId(guruId);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/export/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guruId,
          format,
          kertas: paperSize,
          font: fontFamily,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Gagal mengunduh berkas ZIP guru.");
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = `DOKUMEN_TERVALIDASI_${format.toUpperCase()}_${guruNama.replace(/\s+/g, "_")}.zip`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan saat unduh ZIP.");
    } finally {
      setDownloadingTeacherId(null);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchSearch =
      item.mapelNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.guruNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rombel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTingkat =
      filterTingkat === "all" || String(item.tingkatKelas) === filterTingkat;
    return matchSearch && matchTingkat;
  });

  // Toggle satu dokumen
  const toggleDoc = (key: string, doc: SelectedDoc) => {
    setSelectedDocs((prev) => {
      const next = new Map(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, doc);
      }
      return next;
    });
  };

  // Pilih Semua pada item yang tampil
  const handleSelectAllVisible = () => {
    const next = new Map(selectedDocs);
    filteredItems.forEach((it) => {
      // ATP
      next.set(`atp-${it.penugasanId}`, {
        jenis: "atp",
        id: it.penugasanId,
        label: `ATP ${it.mapelKode} Kls ${it.tingkatKelas}`,
      });
      // Prota
      next.set(`prota-${it.penugasanId}`, {
        jenis: "prota",
        id: it.penugasanId,
        label: `Prota ${it.mapelKode} Kls ${it.tingkatKelas}`,
      });
      // Prosem 1
      next.set(`prosem1-${it.penugasanId}`, {
        jenis: "prosem",
        id: it.penugasanId,
        semester: 1,
        label: `Prosem Smt 1 ${it.mapelKode} Kls ${it.tingkatKelas}`,
      });
      // Prosem 2
      next.set(`prosem2-${it.penugasanId}`, {
        jenis: "prosem",
        id: it.penugasanId,
        semester: 2,
        label: `Prosem Smt 2 ${it.mapelKode} Kls ${it.tingkatKelas}`,
      });
      // RPP
      it.rppList.forEach((r) => {
        next.set(`rpp-${r.id}`, {
          jenis: "rpp",
          id: r.id,
          label: `RPP ${it.mapelKode} - ${r.materi_pokok.slice(0, 15)}`,
        });
      });
    });
    setSelectedDocs(next);
  };

  // Kosongkan semua pilihan
  const handleClearSelection = () => {
    setSelectedDocs(new Map());
  };

  // Eksekusi Unduh ZIP
  const handleDownloadZip = async () => {
    if (selectedDocs.size === 0) return;
    setIsExporting(true);
    setErrorMessage(null);

    try {
      const payloadItems = Array.from(selectedDocs.values()).map((d) => ({
        jenis: d.jenis,
        id: d.id,
        semester: d.semester,
      }));

      const res = await fetch("/api/export/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: payloadItems,
          format: exportFormat,
          kertas: paperSize,
          font: fontFamily,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson.error || "Gagal membuat arsip ZIP di server.");
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = `PERANGKAT_AJAR_${exportFormat.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.zip`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match && match[1]) filename = match[1];
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan saat unduh ZIP.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Kartu Pengaturan Ekspor & Bar Pilihan */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-emerald-700 mb-1">
              <FileArchive className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Export Massal (Staff & Admin)
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Unduh Paket Dokumen Pembelajaran (Format ZIP / Word & PDF)
            </h3>
            <p className="text-xs text-slate-500">
              Pilih dokumen ATP, Prota, Prosem, dan Modul Ajar (RPP) untuk di-generate sekaligus dalam satu file ZIP terstruktur (DOCX atau PDF).
            </p>
          </div>

          {/* Opsi Kertas, Font & Format Dokumen */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Format:</span>
              <Select value={exportFormat} onValueChange={(val) => val && setExportFormat(val as "docx" | "pdf")}>
                <SelectTrigger className="h-8 text-xs w-[120px] font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="docx" className="text-xs font-medium">Word (.docx)</SelectItem>
                  <SelectItem value="pdf" className="text-xs font-medium">PDF (.pdf)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Kertas:</span>
              <Select value={paperSize} onValueChange={(val) => val && setPaperSize(val as "A4" | "F4")}>
                <SelectTrigger className="h-8 text-xs w-[90px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4" className="text-xs">A4</SelectItem>
                  <SelectItem value="F4" className="text-xs">F4 (Folio)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-600">Font:</span>
              <Select value={fontFamily} onValueChange={(val) => val && setFontFamily(val as "Times New Roman" | "Arial")}>
                <SelectTrigger className="h-8 text-xs w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Times New Roman" className="text-xs">Times New Roman</SelectItem>
                  <SelectItem value="Arial" className="text-xs">Arial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Filter & Toolbar Pilihan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Cari guru atau mapel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>

            <Select value={filterTingkat} onValueChange={(val) => val && setFilterTingkat(val)}>
              <SelectTrigger className="h-8 text-xs w-[120px]">
                <SelectValue placeholder="Tingkat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Semua Kelas</SelectItem>
                <SelectItem value="7" className="text-xs">Kelas VII</SelectItem>
                <SelectItem value="8" className="text-xs">Kelas VIII</SelectItem>
                <SelectItem value="9" className="text-xs">Kelas IX</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAllVisible}
              className="h-8 text-xs"
            >
              <CheckSquare className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Pilih Semua
            </Button>

            {selectedDocs.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
                className="h-8 text-xs text-rose-600 hover:text-rose-700"
              >
                <Square className="w-3.5 h-3.5 mr-1" />
                Batal Pilih
              </Button>
            )}
          </div>

          {/* Tombol Eksekusi Unduh ZIP */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-600 text-center sm:text-right">
              {selectedDocs.size} dokumen terpilih
            </span>
            <Button
              disabled={selectedDocs.size === 0 || isExporting}
              onClick={handleDownloadZip}
              className={`h-9 font-medium shadow-sm w-full sm:w-auto ${
                exportFormat === "pdf"
                  ? "bg-rose-700 hover:bg-rose-800 text-white"
                  : "bg-emerald-700 hover:bg-emerald-800 text-white"
              }`}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengompres ZIP ({exportFormat.toUpperCase()})...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Unduh Paket ZIP ({exportFormat.toUpperCase()})
                </>
              )}
            </Button>
          </div>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Grid Tabel Kartu Penugasan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item) => {
          const atpKey = `atp-${item.penugasanId}`;
          const protaKey = `prota-${item.penugasanId}`;
          const prosem1Key = `prosem1-${item.penugasanId}`;
          const prosem2Key = `prosem2-${item.penugasanId}`;

          const isAtpChecked = selectedDocs.has(atpKey);
          const isProtaChecked = selectedDocs.has(protaKey);
          const isProsem1Checked = selectedDocs.has(prosem1Key);
          const isProsem2Checked = selectedDocs.has(prosem2Key);

          return (
            <div
              key={`export-penugasan-${item.penugasanId}`}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
            >
              {/* Header Kartu Penugasan */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] bg-slate-50 font-bold">
                      Kelas {item.tingkatKelas} ({item.rombel})
                    </Badge>
                    <span className="text-xs text-slate-500 font-medium">
                      {item.tahunAjaran}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-1">
                    {item.mapelNama}
                  </h4>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Guru: {item.guruNama}
                  </p>
                </div>

                {item.guruId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          disabled={downloadingTeacherId === item.guruId}
                          className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 self-start sm:self-center shrink-0 cursor-pointer disabled:opacity-50"
                          title="Pilih format unduhan berkas ZIP dokumen milik guru ini"
                        />
                      }
                    >
                      {downloadingTeacherId === item.guruId ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          <span>Mengompres...</span>
                        </>
                      ) : (
                        <>
                          <FileArchive className="w-3.5 h-3.5 text-blue-600" />
                          <span>Unduh ZIP Guru Ini</span>
                          <ChevronDown className="w-3 h-3 text-blue-500 opacity-70 ml-0.5" />
                        </>
                      )}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 p-1.5 bg-white border border-slate-200 shadow-lg rounded-xl z-50">
                      <DropdownMenuItem
                        onClick={() => handleDownloadTeacherZip(item.guruId!, item.guruNama, "docx")}
                        className="flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-md cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <div className="flex flex-col text-left">
                          <span className="font-semibold">Format Word (.docx)</span>
                          <span className="text-[10px] text-slate-400">Arsip ZIP file .docx</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownloadTeacherZip(item.guruId!, item.guruNama, "pdf")}
                        className="flex items-center gap-2 px-2.5 py-2 text-xs text-slate-700 hover:bg-rose-50 hover:text-rose-700 rounded-md cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-rose-600 shrink-0" />
                        <div className="flex flex-col text-left">
                          <span className="font-semibold">Format PDF (.pdf)</span>
                          <span className="text-[10px] text-slate-400">Arsip ZIP file .pdf resmi</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Pilihan Dokumen Perangkat Ajar */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Pilih Dokumen Perangkat:
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* ATP */}
                  <label
                    onClick={() =>
                      toggleDoc(atpKey, {
                        jenis: "atp",
                        id: item.penugasanId,
                        label: `ATP ${item.mapelKode} Kls ${item.tingkatKelas}`,
                      })
                    }
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                      isAtpChecked
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isAtpChecked}
                      readOnly
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                    />
                    <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>ATP Dokumen</span>
                  </label>

                  {/* PROTA */}
                  <label
                    onClick={() =>
                      toggleDoc(protaKey, {
                        jenis: "prota",
                        id: item.penugasanId,
                        label: `Prota ${item.mapelKode} Kls ${item.tingkatKelas}`,
                      })
                    }
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                      isProtaChecked
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isProtaChecked}
                      readOnly
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                    />
                    <FileText className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Program Tahunan</span>
                  </label>

                  {/* PROSEM SMT 1 */}
                  <label
                    onClick={() =>
                      toggleDoc(prosem1Key, {
                        jenis: "prosem",
                        id: item.penugasanId,
                        semester: 1,
                        label: `Prosem Smt 1 ${item.mapelKode} Kls ${item.tingkatKelas}`,
                      })
                    }
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                      isProsem1Checked
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isProsem1Checked}
                      readOnly
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                    />
                    <Layers className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Prosem Smt 1</span>
                  </label>

                  {/* PROSEM SMT 2 */}
                  <label
                    onClick={() =>
                      toggleDoc(prosem2Key, {
                        jenis: "prosem",
                        id: item.penugasanId,
                        semester: 2,
                        label: `Prosem Smt 2 ${item.mapelKode} Kls ${item.tingkatKelas}`,
                      })
                    }
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none transition-colors ${
                      isProsem2Checked
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isProsem2Checked}
                      readOnly
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                    />
                    <Layers className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>Prosem Smt 2</span>
                  </label>
                </div>

                {/* RPP / Modul Ajar Items */}
                {item.rppList.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 block">
                      Modul Ajar / RPP ({item.rppList.length}):
                    </span>
                    <div className="space-y-1">
                      {item.rppList.map((rpp) => {
                        const rppKey = `rpp-${rpp.id}`;
                        const isRppChecked = selectedDocs.has(rppKey);
                        return (
                          <label
                            key={rppKey}
                            onClick={() =>
                              toggleDoc(rppKey, {
                                jenis: "rpp",
                                id: rpp.id,
                                label: `RPP ${item.mapelKode} - ${rpp.materi_pokok}`,
                              })
                            }
                            className={`flex items-center justify-between p-1.5 rounded-lg border text-xs cursor-pointer select-none ${
                              isRppChecked
                                ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <input
                                type="checkbox"
                                checked={isRppChecked}
                                readOnly
                                className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                              />
                              <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">{rpp.materi_pokok}</span>
                            </div>
                            <Badge variant="outline" className="text-[9px] uppercase shrink-0">
                              {rpp.status}
                            </Badge>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
