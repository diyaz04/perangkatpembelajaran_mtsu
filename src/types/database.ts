export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ==============================================================================
// ENUMS RESMI KBC
// ==============================================================================
export type UserRole = "admin" | "kepala" | "waka_kurikulum" | "guru";
export type DocStatus = "draf" | "diajukan" | "revisi" | "disetujui";
export type JenisKegiatanKalender =
  | "libur"
  | "asesmen"
  | "matsama"
  | "ramadhan"
  | "kegiatan_madrasah"
  | "lainnya";
export type TahapKegiatan = "awal" | "inti" | "penutup";
export type PengalamanBelajar = "memahami" | "mengaplikasi" | "merefleksi";
export type VersiRpp = "minimum" | "lengkap";
export type KelompokMapel = "PAI" | "Bahasa Arab" | "umum" | "muatan_lokal";
export type DokumenTipe = "analisis_cp" | "atp" | "prota" | "prosem" | "rpp";
export type MetodePengurutanAtp =
  | "konkret_ke_abstrak"
  | "deduktif"
  | "mudah_ke_sulit"
  | "hierarki"
  | "prosedural"
  | "scaffolding";

export type KktpPendekatan = "deskripsi_kriteria" | "rubrik" | "interval_nilai";

export interface KktpDeskripsiItem {
  kriteria: string;
  memadai?: boolean;
}

export interface KktpRubrikItem {
  aspek: string;
  baru_berkembang: string;
  layak: string;
  cakap: string;
  mahir: string;
}

export interface KktpIntervalItem {
  rentang: string;
  keterangan: string;
  tindak_lanjut: string;
}

export interface KktpData {
  pendekatan: KktpPendekatan;
  deskripsi?: KktpDeskripsiItem[];
  rubrik?: KktpRubrikItem[];
  interval?: KktpIntervalItem[];
}

// ==============================================================================
// JSON INTERFACES
// ==============================================================================
export interface SintaksModelItem {
  urutan: number;
  nama_sintaks: string;
  pengalaman_belajar?: PengalamanBelajar;
}

export interface IndikatorPerilakuKbc {
  indikator: string;
  contoh_penerapan?: string;
}

// ==============================================================================
// SUPABASE DATABASE TYPE DEFINITION
// ==============================================================================
export interface Database {
  public: {
    Tables: {
      madrasah: {
        Row: {
          id: string;
          nama: string;
          nsm: string | null;
          npsn: string | null;
          alamat: string | null;
          kabupaten: string | null;
          kepala_nama: string | null;
          kepala_nip: string | null;
          logo_url: string | null;
          hari_sekolah?: number;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          nama: string;
          nsm?: string | null;
          npsn?: string | null;
          alamat?: string | null;
          kabupaten?: string | null;
          kepala_nama?: string | null;
          kepala_nip?: string | null;
          logo_url?: string | null;
          hari_sekolah?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["madrasah"]["Insert"]>;
        Relationships: [];
      };

      profiles: {
        Row: {
          id: string;
          nama_lengkap: string;
          nip: string | null;
          gelar: string | null;
          role: UserRole;
          aktif: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id: string;
          nama_lengkap: string;
          nip?: string | null;
          gelar?: string | null;
          role?: UserRole;
          aktif?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };

      tahun_ajaran: {
        Row: {
          id: string;
          nama: string;
          tgl_mulai: string;
          tgl_selesai: string;
          smt1_mulai: string;
          smt1_selesai: string;
          smt2_mulai: string;
          smt2_selesai: string;
          aktif: boolean;
          tanggal_penetapan_dokumen: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          nama: string;
          tgl_mulai: string;
          tgl_selesai: string;
          smt1_mulai: string;
          smt1_selesai: string;
          smt2_mulai: string;
          smt2_selesai: string;
          aktif?: boolean;
          tanggal_penetapan_dokumen?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tahun_ajaran"]["Insert"]>;
        Relationships: [];
      };

      kalender_kegiatan: {
        Row: {
          id: string;
          tahun_ajaran_id: string;
          tgl_mulai: string;
          tgl_selesai: string;
          jenis: JenisKegiatanKalender;
          keterangan: string;
          memotong_minggu_efektif: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          tahun_ajaran_id: string;
          tgl_mulai: string;
          tgl_selesai: string;
          jenis: JenisKegiatanKalender;
          keterangan: string;
          memotong_minggu_efektif?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["kalender_kegiatan"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "kalender_kegiatan_tahun_ajaran_id_fkey";
            columns: ["tahun_ajaran_id"];
            isOneToOne: false;
            referencedRelation: "tahun_ajaran";
            referencedColumns: ["id"];
          },
        ];
      };

      mapel: {
        Row: {
          id: string;
          nama: string;
          kode: string;
          slug: string | null;
          kelompok: KelompokMapel;
          jp_per_minggu_kls7: number;
          jp_per_minggu_kls8: number;
          jp_per_minggu_kls9: number;
          jp_default: { [key: string]: number } | null;
          status_verifikasi: string | null;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          nama: string;
          kode: string;
          slug?: string | null;
          kelompok: KelompokMapel;
          jp_per_minggu_kls7?: number;
          jp_per_minggu_kls8?: number;
          jp_per_minggu_kls9?: number;
          jp_default?: { [key: string]: number } | null;
          status_verifikasi?: string | null;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["mapel"]["Insert"]>;
        Relationships: [];
      };

      penugasan: {
        Row: {
          id: string;
          guru_id: string;
          mapel_id: string;
          tahun_ajaran_id: string;
          tingkat_kelas: 7 | 8 | 9;
          rombel: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          guru_id: string;
          mapel_id: string;
          tahun_ajaran_id: string;
          tingkat_kelas: 7 | 8 | 9;
          rombel: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["penugasan"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "penugasan_guru_id_fkey";
            columns: ["guru_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "penugasan_mapel_id_fkey";
            columns: ["mapel_id"];
            isOneToOne: false;
            referencedRelation: "mapel";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "penugasan_tahun_ajaran_id_fkey";
            columns: ["tahun_ajaran_id"];
            isOneToOne: false;
            referencedRelation: "tahun_ajaran";
            referencedColumns: ["id"];
          },
        ];
      };

      capaian_pembelajaran: {
        Row: {
          id: string;
          mapel_id: string;
          fase: string;
          elemen: string;
          kode_elemen: string | null;
          deskripsi_cp: string;
          sumber_regulasi: string;
          sumber: Json | null;
          versi_bank_data: string | null;
          asal: "manual" | "bank_data";
          status_verifikasi: "belum" | "terverifikasi";
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          mapel_id: string;
          fase?: string;
          elemen: string;
          kode_elemen?: string | null;
          deskripsi_cp: string;
          sumber_regulasi?: string;
          sumber?: Json | null;
          versi_bank_data?: string | null;
          asal?: "manual" | "bank_data";
          status_verifikasi?: "belum" | "terverifikasi";
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["capaian_pembelajaran"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "capaian_pembelajaran_mapel_id_fkey";
            columns: ["mapel_id"];
            isOneToOne: false;
            referencedRelation: "mapel";
            referencedColumns: ["id"];
          },
        ];
      };

      panca_cinta: {
        Row: {
          id: string;
          urutan: number;
          kode: string;
          nama: string;
          deskripsi: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          urutan: number;
          kode: string;
          nama: string;
          deskripsi?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["panca_cinta"]["Insert"]>;
        Relationships: [];
      };

      materi_kbc: {
        Row: {
          id: string;
          panca_cinta_id: string;
          pilar: string;
          nilai: string;
          deskripsi: string;
          integrasi_sains_sosial: string | null;
          indikator_perilaku: Json;
          kode_elemen: string | null;
          sumber: Json | null;
          versi_bank_data: string | null;
          asal: "manual" | "bank_data";
          status_verifikasi: "belum" | "terverifikasi";
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          panca_cinta_id: string;
          pilar: string;
          nilai: string;
          deskripsi: string;
          integrasi_sains_sosial?: string | null;
          indikator_perilaku?: Json;
          kode_elemen?: string | null;
          sumber?: Json | null;
          versi_bank_data?: string | null;
          asal?: "manual" | "bank_data";
          status_verifikasi?: "belum" | "terverifikasi";
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["materi_kbc"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "materi_kbc_panca_cinta_id_fkey";
            columns: ["panca_cinta_id"];
            isOneToOne: false;
            referencedRelation: "panca_cinta";
            referencedColumns: ["id"];
          },
        ];
      };

      materi_pelajaran: {
        Row: {
          id: string;
          mapel_id: string;
          tingkat: 7 | 8 | 9;
          semester: 1 | 2;
          urutan: number;
          bab: string;
          deskripsi: string | null;
          kata_kunci: string[];
          subbab: string[];
          elemen_cp_ids: string[];
          saran_panca_cinta: Json;
          saran_dpl: number[];
          sumber: Json;
          versi_bank_data: string | null;
          status_verifikasi: "belum" | "terverifikasi";
          asal: "manual" | "bank_data";
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          mapel_id: string;
          tingkat: 7 | 8 | 9;
          semester: 1 | 2;
          urutan: number;
          bab: string;
          deskripsi?: string | null;
          kata_kunci?: string[];
          subbab?: string[];
          elemen_cp_ids?: string[];
          saran_panca_cinta?: Json;
          saran_dpl?: number[];
          sumber?: Json;
          versi_bank_data?: string | null;
          status_verifikasi?: "belum" | "terverifikasi";
          asal?: "manual" | "bank_data";
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["materi_pelajaran"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "materi_pelajaran_mapel_id_fkey";
            columns: ["mapel_id"];
            isOneToOne: false;
            referencedRelation: "mapel";
            referencedColumns: ["id"];
          },
        ];
      };

      dimensi_profil_lulusan: {
        Row: {
          id: string;
          kode: string;
          nama: string;
          elemen_kunci: string[];
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          kode: string;
          nama: string;
          elemen_kunci?: string[];
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["dimensi_profil_lulusan"]["Insert"]>;
        Relationships: [];
      };

      model_pembelajaran: {
        Row: {
          id: string;
          nama: string;
          sintaks: Json;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          nama: string;
          sintaks?: Json;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["model_pembelajaran"]["Insert"]>;
        Relationships: [];
      };

      analisis_cp: {
        Row: {
          id: string;
          penugasan_id: string;
          cp_id: string;
          materi_pokok: string;
          kompetensi: string;
          alokasi_jp: number;
          status: DocStatus;
          catatan_validator: string | null;
          kata_kunci?: string[];
          benang_merah?: string;
          dpl_ids?: string[];
          panca_cinta_ids?: string[];
          urutan?: number;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          penugasan_id: string;
          cp_id: string;
          materi_pokok: string;
          kompetensi: string;
          alokasi_jp?: number;
          status?: DocStatus;
          catatan_validator?: string | null;
          kata_kunci?: string[];
          benang_merah?: string;
          dpl_ids?: string[];
          panca_cinta_ids?: string[];
          urutan?: number;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["analisis_cp"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "analisis_cp_penugasan_id_fkey";
            columns: ["penugasan_id"];
            isOneToOne: false;
            referencedRelation: "penugasan";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "analisis_cp_cp_id_fkey";
            columns: ["cp_id"];
            isOneToOne: false;
            referencedRelation: "capaian_pembelajaran";
            referencedColumns: ["id"];
          },
        ];
      };

      tujuan_pembelajaran: {
        Row: {
          id: string;
          analisis_cp_id: string;
          kode_tp: string;
          deskripsi: string;
          panca_cinta_ids: string[];
          dpl_ids: string[];
          alokasi_jp: number;
          urutan: number;
          semester?: 1 | 2;
          kompetensi?: string;
          lingkup_materi?: string;
          konteks?: string;
          kktp?: Json;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          analisis_cp_id: string;
          kode_tp: string;
          deskripsi: string;
          panca_cinta_ids?: string[];
          dpl_ids?: string[];
          alokasi_jp?: number;
          urutan?: number;
          semester?: 1 | 2;
          kompetensi?: string;
          lingkup_materi?: string;
          konteks?: string;
          kktp?: Json;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tujuan_pembelajaran"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "tujuan_pembelajaran_analisis_cp_id_fkey";
            columns: ["analisis_cp_id"];
            isOneToOne: false;
            referencedRelation: "analisis_cp";
            referencedColumns: ["id"];
          },
        ];
      };

      atp: {
        Row: {
          id: string;
          penugasan_id: string;
          semester: 1 | 2;
          status: DocStatus;
          catatan_validator: string | null;
          metode_pengurutan?: MetodePengurutanAtp;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          penugasan_id: string;
          semester?: 1 | 2;
          status?: DocStatus;
          catatan_validator?: string | null;
          metode_pengurutan?: MetodePengurutanAtp;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["atp"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "atp_penugasan_id_fkey";
            columns: ["penugasan_id"];
            isOneToOne: false;
            referencedRelation: "penugasan";
            referencedColumns: ["id"];
          },
        ];
      };

      prota: {
        Row: {
          id: string;
          penugasan_id: string;
          status: DocStatus;
          total_jp: number;
          catatan_validator: string | null;
          snapshot_minggu_efektif?: Json | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          penugasan_id: string;
          status?: DocStatus;
          total_jp?: number;
          catatan_validator?: string | null;
          snapshot_minggu_efektif?: Json | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["prota"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "prota_penugasan_id_fkey";
            columns: ["penugasan_id"];
            isOneToOne: false;
            referencedRelation: "penugasan";
            referencedColumns: ["id"];
          },
        ];
      };

      prota_item: {
        Row: {
          id: string;
          prota_id: string;
          materi_pokok: string;
          semester: 1 | 2;
          alokasi_jp: number;
          urutan: number;
          tujuan_pembelajaran_id?: string | null;
          kode_tp?: string | null;
          tujuan_pembelajaran_teks?: string | null;
          panca_cinta_nama?: string | null;
          keterangan?: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          prota_id: string;
          materi_pokok: string;
          semester: 1 | 2;
          alokasi_jp?: number;
          urutan?: number;
          tujuan_pembelajaran_id?: string | null;
          kode_tp?: string | null;
          tujuan_pembelajaran_teks?: string | null;
          panca_cinta_nama?: string | null;
          keterangan?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["prota_item"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "prota_item_prota_id_fkey";
            columns: ["prota_id"];
            isOneToOne: false;
            referencedRelation: "prota";
            referencedColumns: ["id"];
          },
        ];
      };

      prosem: {
        Row: {
          id: string;
          penugasan_id: string;
          semester: 1 | 2;
          status: DocStatus;
          total_minggu_efektif: number;
          total_jp: number;
          catatan_validator: string | null;
          snapshot_minggu_efektif?: Json | null;
          snapshot_matriks?: Json | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          penugasan_id: string;
          semester: 1 | 2;
          status?: DocStatus;
          total_minggu_efektif?: number;
          total_jp?: number;
          catatan_validator?: string | null;
          snapshot_minggu_efektif?: Json | null;
          snapshot_matriks?: Json | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["prosem"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "prosem_penugasan_id_fkey";
            columns: ["penugasan_id"];
            isOneToOne: false;
            referencedRelation: "penugasan";
            referencedColumns: ["id"];
          },
        ];
      };

      prosem_item: {
        Row: {
          id: string;
          prosem_id: string;
          prota_item_id?: string | null;
          minggu_ke: number[];
          alokasi_jp: number;
          urutan: number;
          distribusi_minggu?: Json | null;
          kode_tp?: string | null;
          materi_pokok?: string | null;
          tujuan_pembelajaran_teks?: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          prosem_id: string;
          prota_item_id?: string | null;
          minggu_ke?: number[];
          alokasi_jp?: number;
          urutan?: number;
          distribusi_minggu?: Json | null;
          kode_tp?: string | null;
          materi_pokok?: string | null;
          tujuan_pembelajaran_teks?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["prosem_item"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "prosem_item_prosem_id_fkey";
            columns: ["prosem_id"];
            isOneToOne: false;
            referencedRelation: "prosem";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prosem_item_prota_item_id_fkey";
            columns: ["prota_item_id"];
            isOneToOne: false;
            referencedRelation: "prota_item";
            referencedColumns: ["id"];
          },
        ];
      };

      rpp: {
        Row: {
          id: string;
          penugasan_id: string;
          atp_id: string | null;
          materi_pokok: string;
          alokasi_waktu: string;
          pertemuan_ke: number;
          versi: VersiRpp;
          model_id: string | null;
          tujuan_pembelajaran_ids: string[];
          dimensi_profil_lulusan_ids: string[];
          panca_cinta_ids: string[];
          materi_kbc_ids: string[];
          pemahaman_bermakna: string | null;
          pertanyaan_pemantik: string | null;
          sarana_prasarana: string | null;
          diferensiasi_konten: string | null;
          diferensiasi_proses: string | null;
          diferensiasi_produk: string | null;
          asesmen_awal: string | null;
          asesmen_proses: string | null;
          asesmen_akhir: string | null;
          status: DocStatus;
          catatan_validator: string | null;
          snapshot_rpp?: Json | null;
          jumlah_pertemuan?: number;
          alokasi_jp?: number;
          menit_per_jp?: number;
          karakteristik_materi?: string | null;
          benang_merah_kbc?: string | null;
          materi_kbc_custom?: string | null;
          lintas_disiplin_ilmu?: string | null;
          topik_pembelajaran?: string | null;
          metode_pembelajaran?: string[] | null;
          kemitraan_pembelajaran?: string | null;
          lingkungan_belajar_fisik?: string | null;
          lingkungan_belajar_virtual?: string | null;
          budaya_belajar?: string | null;
          pemanfaatan_digital?: string | null;
          tujuan_pembelajaran_teks?: string | null;
          kesiapan_murid?: Json | null;
          rubrik_kbc?: Json | null;
          kktp?: string | null;
          lampiran?: Json | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          penugasan_id: string;
          atp_id?: string | null;
          materi_pokok: string;
          alokasi_waktu?: string;
          pertemuan_ke?: number;
          versi?: VersiRpp;
          model_id?: string | null;
          tujuan_pembelajaran_ids?: string[];
          dimensi_profil_lulusan_ids?: string[];
          panca_cinta_ids?: string[];
          materi_kbc_ids?: string[];
          pemahaman_bermakna?: string | null;
          pertanyaan_pemantik?: string | null;
          sarana_prasarana?: string | null;
          diferensiasi_konten?: string | null;
          diferensiasi_proses?: string | null;
          diferensiasi_produk?: string | null;
          asesmen_awal?: string | null;
          asesmen_proses?: string | null;
          asesmen_akhir?: string | null;
          status?: DocStatus;
          catatan_validator?: string | null;
          snapshot_rpp?: Json | null;
          jumlah_pertemuan?: number;
          alokasi_jp?: number;
          menit_per_jp?: number;
          karakteristik_materi?: string | null;
          benang_merah_kbc?: string | null;
          materi_kbc_custom?: string | null;
          lintas_disiplin_ilmu?: string | null;
          topik_pembelajaran?: string | null;
          metode_pembelajaran?: string[] | null;
          kemitraan_pembelajaran?: string | null;
          lingkungan_belajar_fisik?: string | null;
          lingkungan_belajar_virtual?: string | null;
          budaya_belajar?: string | null;
          pemanfaatan_digital?: string | null;
          tujuan_pembelajaran_teks?: string | null;
          kesiapan_murid?: Json | null;
          rubrik_kbc?: Json | null;
          kktp?: string | null;
          lampiran?: Json | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["rpp"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "rpp_penugasan_id_fkey";
            columns: ["penugasan_id"];
            isOneToOne: false;
            referencedRelation: "penugasan";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rpp_atp_id_fkey";
            columns: ["atp_id"];
            isOneToOne: false;
            referencedRelation: "atp";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rpp_model_id_fkey";
            columns: ["model_id"];
            isOneToOne: false;
            referencedRelation: "model_pembelajaran";
            referencedColumns: ["id"];
          },
        ];
      };

      rpp_langkah: {
        Row: {
          id: string;
          rpp_id: string;
          tahap: TahapKegiatan;
          pengalaman: PengalamanBelajar;
          deskripsi_kegiatan: string;
          durasi_menit: number;
          urutan: number;
          pertemuan_ke?: number;
          prinsip?: string[];
          panca_cinta_id?: string | null;
          aksi_kbc?: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          rpp_id: string;
          tahap: TahapKegiatan;
          pengalaman: PengalamanBelajar;
          deskripsi_kegiatan: string;
          durasi_menit?: number;
          urutan?: number;
          pertemuan_ke?: number;
          prinsip?: string[];
          panca_cinta_id?: string | null;
          aksi_kbc?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["rpp_langkah"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "rpp_langkah_rpp_id_fkey";
            columns: ["rpp_id"];
            isOneToOne: false;
            referencedRelation: "rpp";
            referencedColumns: ["id"];
          },
        ];
      };

      riwayat_validasi: {
        Row: {
          id: string;
          dokumen_tipe: DokumenTipe;
          dokumen_id: string;
          validator_id: string;
          status_sebelum: DocStatus;
          status_sesudah: DocStatus;
          catatan: string | null;
          tanggal: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          dokumen_tipe: DokumenTipe;
          dokumen_id: string;
          validator_id: string;
          status_sebelum: DocStatus;
          status_sesudah: DocStatus;
          catatan?: string | null;
          tanggal?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["riwayat_validasi"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "riwayat_validasi_validator_id_fkey";
            columns: ["validator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      app_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
      is_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      doc_status: DocStatus;
      jenis_kegiatan_kalender: JenisKegiatanKalender;
      tahap_kegiatan: TahapKegiatan;
      pengalaman_belajar: PengalamanBelajar;
      versi_rpp: VersiRpp;
    };
  };
}

// ==============================================================================
// TYPE ALIASES / SHORTHANDS
// ==============================================================================
export type Madrasah = Database["public"]["Tables"]["madrasah"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type TahunAjaran = Database["public"]["Tables"]["tahun_ajaran"]["Row"];
export type KalenderKegiatan = Database["public"]["Tables"]["kalender_kegiatan"]["Row"];
export type Mapel = Database["public"]["Tables"]["mapel"]["Row"];
export type Penugasan = Database["public"]["Tables"]["penugasan"]["Row"];
export type CapaianPembelajaran = Database["public"]["Tables"]["capaian_pembelajaran"]["Row"];
export type PancaCinta = Database["public"]["Tables"]["panca_cinta"]["Row"];
export type MateriKbc = Database["public"]["Tables"]["materi_kbc"]["Row"];
export type MateriPelajaran = Database["public"]["Tables"]["materi_pelajaran"]["Row"];
export type DimensiProfilLulusan = Database["public"]["Tables"]["dimensi_profil_lulusan"]["Row"];
export type ModelPembelajaran = Database["public"]["Tables"]["model_pembelajaran"]["Row"];
export type AnalisisCp = Database["public"]["Tables"]["analisis_cp"]["Row"];
export type TujuanPembelajaran = Database["public"]["Tables"]["tujuan_pembelajaran"]["Row"];
export type Atp = Database["public"]["Tables"]["atp"]["Row"];
export type Prota = Database["public"]["Tables"]["prota"]["Row"];
export type ProtaItem = Database["public"]["Tables"]["prota_item"]["Row"];
export type Prosem = Database["public"]["Tables"]["prosem"]["Row"];
export type ProsemItem = Database["public"]["Tables"]["prosem_item"]["Row"];
export type Rpp = Database["public"]["Tables"]["rpp"]["Row"];
export type RppLangkah = Database["public"]["Tables"]["rpp_langkah"]["Row"];
export type RiwayatValidasi = Database["public"]["Tables"]["riwayat_validasi"]["Row"];

// ==============================================================================
// KBC & PPA CONSTANTS
// ==============================================================================
export const PANCA_CINTA_KODE = ["PC1", "PC2", "PC3", "PC4", "PC5"] as const;
export const DIMENSI_PROFIL_LULUSAN_KODE = [
  "DPL1",
  "DPL2",
  "DPL3",
  "DPL4",
  "DPL5",
  "DPL6",
  "DPL7",
  "DPL8",
] as const;

export const PENGALAMAN_BELAJAR_LABELS: Record<PengalamanBelajar, string> = {
  memahami: "Memahami (Deeper Understanding)",
  mengaplikasi: "Mengaplikasi (Authentic Application)",
  merefleksi: "Merefleksi (Meaningful Reflection)",
};

export const DOC_STATUS_LABELS: Record<DocStatus, { label: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" }> = {
  draf: { label: "Draf", badgeVariant: "secondary" },
  diajukan: { label: "Diajukan", badgeVariant: "outline" },
  revisi: { label: "Perlu Revisi", badgeVariant: "destructive" },
  disetujui: { label: "Disetujui", badgeVariant: "default" },
};
