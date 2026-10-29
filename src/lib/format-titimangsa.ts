/**
 * Format titimangsa (tanggal pengesahan) dokumen TP, ATP, Prota, Prosem, dan RPP.
 * Memakai `tanggalPenetapan` dari tahun ajaran aktif bila tersedia; jika kosong,
 * jatuh ke tanggal hari ini (perilaku lama, untuk kompatibilitas).
 */
export function formatTitimangsa(tanggalPenetapan?: string | null): string {
  const date = tanggalPenetapan ? new Date(`${tanggalPenetapan}T00:00:00`) : new Date();
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
