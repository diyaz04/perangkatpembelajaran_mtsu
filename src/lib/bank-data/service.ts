import fs from "fs";
import path from "path";
import type {
  BankDataManifest,
  RegulasiBankData,
  StrukturKurikulumItem,
  PancaCintaItemBankData,
  DplItemBankData,
  MateriKbcBankData,
  KkoBankData,
  MapelBankData,
} from "./schema";

// Cache in memory for fast server-side access
let manifestCache: BankDataManifest | null = null;
let regulasiCache: RegulasiBankData | null = null;
let strukturCache: StrukturKurikulumItem[] | null = null;
let pancaCintaCache: PancaCintaItemBankData[] | null = null;
let dplCache: DplItemBankData[] | null = null;
let materiKbcCache: MateriKbcBankData[] | null = null;
let kkoCache: KkoBankData | null = null;
const mapelCache = new Map<string, MapelBankData>();

function getFaseDDir(): string {
  return path.resolve(process.cwd(), "data/fase-d");
}

export function getBankDataManifest(): BankDataManifest {
  if (!manifestCache) {
    const raw = fs.readFileSync(path.join(getFaseDDir(), "manifest.json"), "utf8");
    manifestCache = JSON.parse(raw);
  }
  return manifestCache!;
}

export function getBankDataRegulasi(): RegulasiBankData {
  if (!regulasiCache) {
    const raw = fs.readFileSync(path.join(getFaseDDir(), "regulasi.json"), "utf8");
    regulasiCache = JSON.parse(raw);
  }
  return regulasiCache!;
}

export function getBankDataStruktur(): StrukturKurikulumItem[] {
  if (!strukturCache) {
    const raw = fs.readFileSync(path.join(getFaseDDir(), "struktur-kurikulum.json"), "utf8");
    strukturCache = JSON.parse(raw);
  }
  return strukturCache!;
}

export function getBankDataPancaCinta(): PancaCintaItemBankData[] {
  if (!pancaCintaCache) {
    const raw = fs.readFileSync(path.join(getFaseDDir(), "panca-cinta.json"), "utf8");
    pancaCintaCache = JSON.parse(raw);
  }
  return pancaCintaCache!;
}

export function getBankDataDpl(): DplItemBankData[] {
  if (!dplCache) {
    const raw = fs.readFileSync(path.join(getFaseDDir(), "dpl.json"), "utf8");
    dplCache = JSON.parse(raw);
  }
  return dplCache!;
}

export function getBankDataMateriKbc(): MateriKbcBankData[] {
  if (!materiKbcCache) {
    const raw = fs.readFileSync(path.join(getFaseDDir(), "materi-kbc.json"), "utf8");
    materiKbcCache = JSON.parse(raw);
  }
  return materiKbcCache!;
}

export function getBankDataKko(): KkoBankData {
  if (!kkoCache) {
    const raw = fs.readFileSync(path.join(getFaseDDir(), "kko.json"), "utf8");
    kkoCache = JSON.parse(raw);
  }
  return kkoCache!;
}

export function getMapelBankData(slug: string): MapelBankData | null {
  if (process.env.NODE_ENV === "production" && mapelCache.has(slug)) {
    return mapelCache.get(slug)!;
  }

  const filePath = path.join(getFaseDDir(), "mapel", `${slug}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const data: MapelBankData = JSON.parse(raw);
  mapelCache.set(slug, data);
  return data;
}

export function getAllMapelBankData(): MapelBankData[] {
  const mapelDir = path.join(getFaseDDir(), "mapel");
  if (!fs.existsSync(mapelDir)) return [];

  const files = fs.readdirSync(mapelDir).filter((f) => f.endsWith(".json"));
  const result: MapelBankData[] = [];

  for (const f of files) {
    const slug = f.replace(/\.json$/, "");
    const data = getMapelBankData(slug);
    if (data) result.push(data);
  }

  return result;
}

export function getMateriByMapelAndGrade(
  slug: string,
  tingkat: number,
  semester?: number
) {
  const mapel = getMapelBankData(slug);
  if (!mapel) return [];

  return mapel.materi.filter((m) => {
    if (m.tingkat !== tingkat) return false;
    if (semester !== undefined && m.semester !== semester) return false;
    return true;
  });
}

export function getKbcByPancaCinta(pancaCintaKode: string): MateriKbcBankData[] {
  const allKbc = getBankDataMateriKbc();
  return allKbc.filter((k) => k.topik_panca_cinta_kode === pancaCintaKode);
}
