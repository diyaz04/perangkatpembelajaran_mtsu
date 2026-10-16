import type { DocStatus, DokumenTipe } from "@/types/database";

export interface StatusTimelineItem {
  id: string;
  dokumen_tipe: DokumenTipe;
  dokumen_id: string;
  validator_id: string;
  validator_nama: string;
  validator_role: string;
  validator_gelar?: string | null;
  status_sebelum: DocStatus;
  status_sesudah: DocStatus;
  catatan: string | null;
  tanggal: string;
}

export interface ButirTelaahKbc {
  kode: string;
  label: string;
  deskripsi: string;
  memenuhi: boolean;
  keterangan: string;
  catatanValidator?: string;
}

export interface EvaluasiDokumenResult {
  skorPersen: number;
  totalMemenuhi: number;
  totalButir: number;
  items: ButirTelaahKbc[];
}
