"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  sortable?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;

  // Pagination (Default 20 baris/halaman)
  pageSize?: number;
  totalCount?: number; // Jika ada, mode server-side pagination aktif
  page?: number;
  onPageChange?: (page: number) => void;

  // Search
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchFilter?: (item: T, query: string) => boolean;

  // Sorting
  sortBy?: string;
  sortDirection?: SortDirection;
  onSortChange?: (key: string, direction: SortDirection) => void;

  // State
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  pageSize = 20,
  totalCount,
  page: controlledPage,
  onPageChange,
  searchPlaceholder = "Cari data...",
  searchQuery: controlledSearchQuery,
  onSearchChange,
  searchFilter,
  sortBy: controlledSortBy,
  sortDirection: controlledSortDirection,
  onSortChange,
  isLoading = false,
  emptyTitle = "Belum ada data",
  emptyDescription = "Data belum tersedia atau tidak ditemukan sesuai pencarian Anda.",
}: DataTableProps<T>) {
  // Internal state jika client-side
  const [internalPage, setInternalPage] = useState(1);
  const [internalQuery, setInternalQuery] = useState("");
  const [internalSortBy, setInternalSortBy] = useState<string | null>(null);
  const [internalSortDirection, setInternalSortDirection] =
    useState<SortDirection>("asc");

  // Controlled vs Uncontrolled
  const isServerPagination = totalCount !== undefined;
  const currentPage = controlledPage ?? internalPage;
  const query = controlledSearchQuery ?? internalQuery;
  const sortBy = controlledSortBy ?? internalSortBy;
  const sortDirection = controlledSortDirection ?? internalSortDirection;

  // Search handler
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    if (onSearchChange) {
      onSearchChange(val);
    } else {
      setInternalQuery(val);
      setInternalPage(1);
    }
  }

  // Sort handler
  function handleSort(colKey: string) {
    let nextDir: SortDirection = "asc";
    if (sortBy === colKey) {
      nextDir = sortDirection === "asc" ? "desc" : "asc";
    }

    if (onSortChange) {
      onSortChange(colKey, nextDir);
    } else {
      setInternalSortBy(colKey);
      setInternalSortDirection(nextDir);
    }
  }

  // Filter client-side
  const filteredData = useMemo(() => {
    if (isServerPagination || !searchFilter || !query.trim()) {
      return data;
    }
    return data.filter((item) => searchFilter(item, query.trim().toLowerCase()));
  }, [data, query, searchFilter, isServerPagination]);

  // Sort client-side
  const sortedData = useMemo(() => {
    if (isServerPagination || !sortBy) {
      return filteredData;
    }
    return [...filteredData].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortBy];
      const bVal = (b as Record<string, unknown>)[sortBy];
      if (aVal === bVal) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc"
        ? (aVal as number) > (bVal as number)
          ? 1
          : -1
        : (aVal as number) < (bVal as number)
        ? 1
        : -1;
    });
  }, [filteredData, sortBy, sortDirection, isServerPagination]);

  // Total pages
  const totalRecords = isServerPagination ? totalCount : sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  // Pagination client-side slice
  const displayData = useMemo(() => {
    if (isServerPagination) {
      return data;
    }
    const start = (safePage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [data, sortedData, safePage, pageSize, isServerPagination]);

  // Change page
  function changePage(newPage: number) {
    const clamped = Math.max(1, Math.min(newPage, totalPages));
    if (onPageChange) {
      onPageChange(clamped);
    } else {
      setInternalPage(clamped);
    }
  }

  const startRecord =
    totalRecords === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endRecord = Math.min(safePage * pageSize, totalRecords);

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      {(onSearchChange || searchFilter) && (
        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={query}
              onChange={handleSearchChange}
              className="pl-9 h-9 text-sm border-slate-200"
            />
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="rounded-lg border border-slate-200 overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                    >
                      {col.header}
                      {sortBy === col.key ? (
                        sortDirection === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-emerald-600" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />
                      )}
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-slate-700">
                      {col.header}
                    </span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-36 text-center text-slate-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                    <span className="text-sm">Memuat data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : displayData.length > 0 ? (
              displayData.map((item, idx) => (
                <TableRow
                  key={keyExtractor(item)}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={cn("text-sm", col.className)}>
                      {col.render
                        ? col.render(item, (safePage - 1) * pageSize + idx)
                        : (item as Record<string, unknown>)[col.key] != null
                        ? String((item as Record<string, unknown>)[col.key])
                        : "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-8">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer (20 baris per halaman) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-600 px-1">
        <div>
          Menampilkan <span className="font-medium text-slate-900">{startRecord}</span> -{" "}
          <span className="font-medium text-slate-900">{endRecord}</span> dari{" "}
          <span className="font-medium text-slate-900">{totalRecords}</span> data
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-slate-200"
            onClick={() => changePage(1)}
            disabled={safePage <= 1 || isLoading}
            title="Halaman pertama"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-slate-200"
            onClick={() => changePage(safePage - 1)}
            disabled={safePage <= 1 || isLoading}
            title="Halaman sebelumnya"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="px-3 text-xs font-medium text-slate-700">
            Halaman {safePage} dari {totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-slate-200"
            onClick={() => changePage(safePage + 1)}
            disabled={safePage >= totalPages || isLoading}
            title="Halaman berikutnya"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-slate-200"
            onClick={() => changePage(totalPages)}
            disabled={safePage >= totalPages || isLoading}
            title="Halaman terakhir"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
