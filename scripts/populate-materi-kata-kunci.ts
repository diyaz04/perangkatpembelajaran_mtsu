import fs from "fs";
import path from "path";

const mapelDir = path.resolve(process.cwd(), "data/fase-d/mapel");
const files = fs.readdirSync(mapelDir).filter((f) => f.endsWith(".json"));

console.log("================================================================================");
console.log("🏷️  MEMPERBARUI KATA_KUNCI BERKUALITAS TINGGI UNTUK 311 BAB BANK DATA FASE D");
console.log("================================================================================");

const stopWords = new Set([
  "dan", "atau", "yang", "dalam", "pada", "untuk", "dengan", "secara", "sebagai",
  "bagi", "tentang", "lainnya", "keistimewaannya", "bab", "dari", "ke", "di",
  "sebuah", "suatu", "menjadi", "antara", "serta", "terhadap", "atas", "oleh",
  "membangun", "mengembangkan", "membuat", "membentuk", "mencapai", "para", "tokoh", "menggantikan", "mengganti"
]);

function cleanPhrase(text: string): string {
  return text
    .replace(/^[A-Z]\.\s*/i, "")
    .replace(/^(bab|ad-dars|unit|tema|modul)\s*\d+[\:\.]?\s*/i, "")
    .replace(/^(mengenal|memahami|menganalisis|membiasakan|meneladani|menerapkan|mengeksplorasi|merenungkan|menggapai|memperindah|menjaga|pengertian|ketentuan|tata cara|hakikat|fungsi|macam-macam|pembagian|contoh|sejarah|prinsip|alur|peran|kemajuan di bidang|tokoh pendiri dan para|khalifah terkenal)\s+/gi, "")
    .replace(/[^\w\s\-\']/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function generateKeywords(mapelSlug: string, bab: string, subbab: string[] = []): string[] {
  const cleanBabText = bab.replace(/^(bab|ad-dars|unit|tema|modul)\s*\d+[\:\.]?\s*/i, "").trim();
  const keywords = new Set<string>();

  // 1. Ekstrak frasa dari judul bab
  const titleParts = cleanBabText
    .split(/[,:()\/]|(\bdan\b)|(\batau\b)|(\bmembangun\b)|(\bdalam\b)|(\bmenuju\b)|(\bmelalui\b)/i)
    .map(p => (p || "").trim())
    .filter(p => p.length >= 3);

  for (const part of titleParts) {
    const cleaned = cleanPhrase(part);
    if (cleaned.length >= 4 && cleaned.length <= 32 && !stopWords.has(cleaned)) {
      keywords.add(cleaned);
    }
  }

  // 2. Ekstrak konsep penting dari subbab
  for (const sub of subbab) {
    // Pecah subbab berdasarkan titik dua, koma, titik koma, dash, dan kata pemisah
    const parts = sub
      .split(/[:–—\(\),;]|(\bsebagai\b)|(\bmenggantikan\b)|(\bdan\b)|(\bserta\b)/i)
      .map(p => (p || "").trim())
      .filter(p => p.length >= 3);

    for (const p of parts) {
      const cleaned = cleanPhrase(p);
      if (cleaned.length >= 4 && cleaned.length <= 30 && !stopWords.has(cleaned)) {
        const alreadyHas = Array.from(keywords).some(k => k === cleaned || (k.includes(cleaned) && k.length < cleaned.length + 4));
        if (!alreadyHas) {
          keywords.add(cleaned);
        }
      }
      if (keywords.size >= 5) break;
    }
    if (keywords.size >= 5) break;
  }

  // 3. Fallback jika kata kunci kurang dari 3
  if (keywords.size < 3) {
    const fallbackParts = cleanBabText.split(/[\s,]+/);
    for (let i = 0; i < fallbackParts.length - 1; i++) {
      const bigram = `${fallbackParts[i]} ${fallbackParts[i + 1]}`.toLowerCase().replace(/[^\w\s]/g, "").trim();
      const w1 = fallbackParts[i].toLowerCase();
      const w2 = fallbackParts[i + 1].toLowerCase();
      if (!stopWords.has(w1) && !stopWords.has(w2) && bigram.length >= 5) {
        keywords.add(bigram);
      }
      if (keywords.size >= 4) break;
    }
  }

  return Array.from(keywords)
    .map(k => k.trim())
    .filter(k => k.length >= 3 && !stopWords.has(k))
    .slice(0, 5);
}

let totalBabUpdated = 0;

for (const file of files) {
  const filePath = path.join(mapelDir, file);
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);

  let countInMapel = 0;
  for (const m of data.materi) {
    m.kata_kunci = generateKeywords(data.slug, m.bab, m.subbab);
    countInMapel++;
    totalBabUpdated++;
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  console.log(`  ✅ ${file.padEnd(28)} : ${countInMapel} bab diperbarui`);
}

console.log("================================================================================");
console.log(`🎉 Berhasil memperbarui kata kunci pada ${totalBabUpdated} bab di ${files.length} mapel.`);
console.log("================================================================================");
