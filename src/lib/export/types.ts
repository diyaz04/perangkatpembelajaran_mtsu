export type PaperSize = "A4" | "F4";
export type FontFamily = "Times New Roman" | "Arial";

export interface ExportDocxOptions {
  paperSize?: PaperSize;
  fontFamily?: FontFamily;
  fontSizePt?: number;
  includeKop?: boolean;
}

export interface KopMadrasahData {
  nama: string;
  nsm?: string | null;
  npsn?: string | null;
  alamat?: string | null;
  kabupaten?: string | null;
  kepala_nama?: string | null;
  kepala_nip?: string | null;
  logo_url?: string | null;
}

export interface GuruSignData {
  nama_lengkap: string;
  nip?: string | null;
  gelar?: string | null;
}
