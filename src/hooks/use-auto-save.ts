"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void> | void;
  debounceMs?: number; // default 1500ms sesuai aturan kerja
  enabled?: boolean;
}

/**
 * Hook simpan otomatis draf dengan debounce 1,5 detik (1500ms).
 * Digunakan pada formulir panjang (ATP, Prota, Prosem, Modul Ajar).
 */
export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 1500,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialMount = useRef(true);
  const onSaveRef = useRef(onSave);
  const dataRef = useRef(data);

  useEffect(() => {
    onSaveRef.current = onSave;
    dataRef.current = data;
  });

  const forceSave = useCallback(async () => {
    try {
      setStatus("saving");
      setErrorMessage(null);
      await onSaveRef.current(dataRef.current);
      setStatus("saved");
      setLastSavedAt(new Date());
    } catch (err: unknown) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Gagal menyimpan draf";
      setErrorMessage(msg);
    }
  }, []);

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }

    if (!enabled) return;

    const handler = setTimeout(async () => {
      try {
        setStatus("saving");
        setErrorMessage(null);
        await onSaveRef.current(data);
        setStatus("saved");
        setLastSavedAt(new Date());
      } catch (err: unknown) {
        setStatus("error");
        const msg = err instanceof Error ? err.message : "Gagal menyimpan draf";
        setErrorMessage(msg);
      }
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [data, debounceMs, enabled]);

  return {
    status,
    lastSavedAt,
    errorMessage,
    forceSave,
  };
}
