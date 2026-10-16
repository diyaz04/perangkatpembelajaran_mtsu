import fs from "fs";
import path from "path";

const mapelDir = path.resolve(process.cwd(), "data/fase-d/mapel");
const files = fs.readdirSync(mapelDir).filter((f) => f.endsWith(".json"));

console.log("================================================================================");
console.log("📝 MENAMBAHKAN FIELD DESKRIPSI (BENANG MERAH) KE 311 BAB BANK DATA FASE D");
console.log("================================================================================");

let totalBabUpdated = 0;

for (const file of files) {
  const filePath = path.join(mapelDir, file);
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);

  let updatedInMapel = 0;
  for (const m of data.materi) {
    if (!m.deskripsi) {
      // Ambil alasan dari saran_panca_cinta pertama sebagai fondasi benang merah nilai luhur
      const benangMerah = m.saran_panca_cinta?.[0]?.alasan || `Mempelajari ${m.bab} untuk memperdalam pemahaman dan menanamkan nilai-nilai luhur dalam kehidupan sehari-hari.`;
      m.deskripsi = benangMerah;
      updatedInMapel++;
      totalBabUpdated++;
    }
  }

  // Tulis kembali file JSON dengan rapi
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`✅ ${data.mapel.padEnd(35)} : ${data.materi.length} bab diperbarui dengan deskripsi.`);
}

console.log("================================================================================");
console.log(`🎉 Total Bab berhasil ditambahkan deskripsi: ${totalBabUpdated} bab`);
console.log("================================================================================");
