import fs from "fs";
import path from "path";

const mapelDir = path.resolve(process.cwd(), "data/fase-d/mapel");
const files = fs.readdirSync(mapelDir).filter((f) => f.endsWith(".json"));

function cleanTerm(term) {
  return term
    .replace(/^[A-Z0-9\.\-\:\)]+\s*/i, "")
    .replace(/\b(bab|ad-dars|al-wahdah|unit|tema|modul)\s*\d+[\:\.]?\s*/gi, "")
    .replace(/\b(pengertian|ketentuan|tata cara|memahami|menganalisis|membiasakan|mengenal|sejarah|penerapan|hakikat|fungsi|macam-macam|pembagian)\s+/gi, "")
    .replace(/[^\w\s\-\'\’]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function extractKeywords(bab, subbabs = [], mapel = "") {
  const result = new Set();

  // 1. Bersihkan bab
  const cleanBab = bab.replace(/^(bab|ad-dars|unit)\s*\d+[\:\.]?\s*/i, "").trim();

  // Cek apakah ada pemisah koma atau " dan "
  const splitKeywords = cleanBab
    .split(/,|\bdan\b|\batau\b|\/|&/i)
    .map(cleanTerm)
    .filter(t => t.length >= 3 && t.length <= 25 && !t.startsWith("bab "));

  splitKeywords.forEach(k => result.add(k));

  // 2. Ambil dari subbab
  for (const sub of subbabs) {
    const rawClean = sub.replace(/^[A-Z]\.\s*/i, "").split(/:\s*|,\s*|\s+dan\s+/i)[0];
    const cleaned = cleanTerm(rawClean);
    if (cleaned.length >= 3 && cleaned.length <= 25 && !cleaned.startsWith("bab ")) {
      result.add(cleaned);
    }
  }

  // 3. Jika masih kurang dari 3, tambahkan potongan bermakna dari cleanBab
  if (result.size < 3) {
    const baseBab = cleanTerm(cleanBab);
    if (baseBab.length >= 3 && baseBab.length <= 30) {
      result.add(baseBab);
    }
  }

  // Filter kata-kata umum yang tidak bermakna
  const stopWords = new Set(["yang", "dalam", "pada", "untuk", "dengan", "secara", "sebagai", "bagi", "tentang", "lainnya", "keistimewaannya"]);
  const filtered = Array.from(result).filter(k => !stopWords.has(k) && k.length > 2);

  return filtered.slice(0, 5);
}

for (const f of files.slice(0, 4)) {
  const data = JSON.parse(fs.readFileSync(path.join(mapelDir, f), "utf8"));
  console.log(`\nMapel: ${data.mapel}`);
  data.materi.slice(0, 4).forEach(m => {
    console.log(`  Bab: ${m.bab}`);
    console.log(`  Keywords:`, extractKeywords(m.bab, m.subbab, data.mapel));
  });
}
