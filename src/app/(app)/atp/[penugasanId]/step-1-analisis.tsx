"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  saveAnalisisCpAction,
  saveBabBankDataAction,
  deleteBabBankDataAction,
  type AnalisisCpItemPayload,
  type WizardMateriItem,
  type SaveBabBankDataPayload,
} from "../actions";
import { PERTANYAAN_REFLEKTIF } from "@/lib/kbc-pedagogi";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  HelpCircle,
  Save,
  ArrowRight,
  Plus,
  X,
  BookOpen,
  Heart,
  CheckCircle2,
  Tag,
  Loader2,
  AlertTriangle,
  Trash2,
  ListPlus,
  ArrowUp,
  ArrowDown,
  FileText,
  Pencil,
} from "lucide-react";

export interface Step1Props {
  penugasanId: string;
  tingkatKelas?: 7 | 8 | 9;
  cpElements: Array<{
    id: string;
    elemen: string;
    deskripsi_cp: string;
    sumber_regulasi?: string;
    kode_elemen?: string;
  }>;
  allCpElements?: Array<{
    id: string;
    elemen: string;
    deskripsi_cp: string;
    sumber_regulasi?: string;
    kode_elemen?: string;
  }>;
  pancaCintaList: Array<{
    id: string;
    urutan: number;
    kode: string;
    nama: string;
    deskripsi?: string | null;
  }>;
  dplList: Array<{
    id: string;
    kode: string;
    nama: string;
    elemen_kunci?: string[];
  }>;
  initialAnalisis: AnalisisCpItemPayload[];
  materiPelajaran?: Array<{
    tingkat: number;
    semester: number;
    urutan: number;
    bab: string;
    deskripsi?: string;
    kata_kunci?: string[];
    elemen_kode?: string[];
    subbab: string[];
    saran_panca_cinta: Array<{ topik_kode: string; alasan: string }>;
    saran_dpl: number[];
  }>;
  bankDataVerified?: boolean;
  onNext: () => void;
  onAnalisisUpdated?: (updatedList: AnalisisCpItemPayload[]) => void;
}

export interface AnalisisCardItem {
  cardId: string;
  analisisId?: string;
  cp_id: string;
  elemen: string;
  kode_elemen?: string;
  deskripsi_cp: string;
  sumber_regulasi?: string;
  materiIdx?: number | null;
  isAddedManually?: boolean;
}

export function Step1Analisis({
  penugasanId,
  tingkatKelas,
  cpElements,
  allCpElements,
  pancaCintaList,
  dplList,
  initialAnalisis,
  materiPelajaran,
  bankDataVerified = true,
  onNext,
  onAnalisisUpdated,
}: Step1Props) {
  const poolCp = allCpElements && allCpElements.length > 0 ? allCpElements : cpElements;

  // State materi kurikulum dari Bank Data (dapat diedit / ditambah oleh guru dan tersimpan ke DB)
  const [materiList, setMateriList] = useState<WizardMateriItem[]>(
    () => (materiPelajaran as WizardMateriItem[]) || []
  );

  useEffect(() => {
    if (materiPelajaran && materiPelajaran.length > 0) {
      setMateriList(materiPelajaran as WizardMateriItem[]);
    }
  }, [materiPelajaran]);

  // State Modal Tambah / Edit Bab Bank Data
  interface BabModalState {
    isOpen: boolean;
    mode: "add" | "edit";
    cardId?: string;
    id?: string;
    bab: string;
    semester: 1 | 2;
    urutan: number;
    subbabText: string;
    kataKunciText: string;
    deskripsi: string;
    originalUrutan?: number;
  }

  const [babModal, setBabModal] = useState<BabModalState>({
    isOpen: false,
    mode: "add",
    bab: "",
    semester: 1,
    urutan: 1,
    subbabText: "",
    kataKunciText: "",
    deskripsi: "",
  });
  const [isSavingBab, setIsSavingBab] = useState(false);
  const [isDeletingBab, setIsDeletingBab] = useState(false);

  const handleOpenAddBabModal = (cardId?: string) => {
    const maxUrutan = materiList.reduce((max, m) => Math.max(max, m.urutan || 0), 0);
    const nextUrutan = maxUrutan + 1;
    setBabModal({
      isOpen: true,
      mode: "add",
      cardId,
      bab: `Bab ${nextUrutan}: `,
      semester: 1,
      urutan: nextUrutan,
      subbabText: "",
      kataKunciText: "",
      deskripsi: "",
    });
  };

  const handleOpenEditBabModal = (cardId: string, materiIdx: number) => {
    const item = materiList[materiIdx];
    if (!item) return;

    setBabModal({
      isOpen: true,
      mode: "edit",
      cardId,
      id: item.id,
      bab: item.bab,
      semester: (item.semester === 2 ? 2 : 1) as 1 | 2,
      urutan: item.urutan,
      subbabText: (item.subbab || []).join("\n"),
      kataKunciText: (item.kata_kunci || []).join(", "),
      deskripsi: item.deskripsi || "",
      originalUrutan: item.urutan,
    });
  };

  // 1. Inisialisasi daftar card analisis
  const [cards, setCards] = useState<AnalisisCardItem[]>(() => {
    const list: AnalisisCardItem[] = [];

    // Jika ada initialAnalisis yang sudah tersimpan di database
    if (initialAnalisis && initialAnalisis.length > 0) {
      initialAnalisis.forEach((a, idx) => {
        const foundCp = poolCp.find((c) => c.id === a.cp_id) ||
          cpElements[idx % cpElements.length] ||
          poolCp[0];

        let matchIdx: number | null = null;
        if (a.materi_pokok && materiPelajaran && materiPelajaran.length > 0) {
          const mIdx = materiPelajaran.findIndex((m) =>
            a.materi_pokok.toLowerCase().includes(m.bab.toLowerCase()) ||
            m.bab.toLowerCase().includes(a.materi_pokok.toLowerCase())
          );
          if (mIdx !== -1) matchIdx = mIdx;
        }

        const cardId = a.id || `card-init-${idx + 1}`;
        list.push({
          cardId,
          analisisId: a.id,
          cp_id: a.cp_id || foundCp?.id || `bank-E1`,
          elemen: foundCp?.elemen || "Capaian Pembelajaran",
          kode_elemen: foundCp?.kode_elemen,
          deskripsi_cp: foundCp?.deskripsi_cp || "",
          sumber_regulasi: foundCp?.sumber_regulasi,
          materiIdx: matchIdx,
        });
      });
    }

    // Jika belum ada analisis awal, buat card dari elemen tingkat kelas ini
    if (list.length === 0 && cpElements.length > 0) {
      cpElements.forEach((cp, idx) => {
        // Cari bab materi awal yang cocok dengan elemen ini jika ada
        let initialMateriIdx: number | null = null;
        if (materiPelajaran && materiPelajaran.length > 0) {
          const mIdx = materiPelajaran.findIndex((m) =>
            cp.kode_elemen && m.elemen_kode?.includes(cp.kode_elemen)
          );
          if (mIdx !== -1) initialMateriIdx = mIdx;
        }

        list.push({
          cardId: `card-${cp.id}-${idx}`,
          cp_id: cp.id,
          elemen: cp.elemen,
          kode_elemen: cp.kode_elemen,
          deskripsi_cp: cp.deskripsi_cp,
          sumber_regulasi: cp.sumber_regulasi,
          materiIdx: initialMateriIdx,
        });
      });
    }

    return list;
  });

  // 2. Inisialisasi materi terpilih per card
  const [selectedMateriIndex, setSelectedMateriIndex] = useState<Record<string, number | null>>(() => {
    const initIdx: Record<string, number | null> = {};
    cards.forEach((card) => {
      if (card.materiIdx !== null && card.materiIdx !== undefined) {
        initIdx[card.cardId] = card.materiIdx;
      }
    });
    return initIdx;
  });

  // 3. Inisialisasi peta form analisis per card
  const [analisisMap, setAnalisisMap] = useState<Record<string, AnalisisCpItemPayload>>(() => {
    const map: Record<string, AnalisisCpItemPayload> = {};

    cards.forEach((card) => {
      const existing = initialAnalisis.find(
        (a) => (card.analisisId && a.id === card.analisisId) || a.cp_id === card.cp_id
      );

      if (existing) {
        let initialKeywords = existing.kata_kunci || [];
        if (
          initialKeywords.length === 0 &&
          materiPelajaran &&
          card.materiIdx !== null &&
          card.materiIdx !== undefined &&
          materiPelajaran[card.materiIdx]?.kata_kunci
        ) {
          initialKeywords = [...(materiPelajaran[card.materiIdx]?.kata_kunci || [])];
        }

        map[card.cardId] = {
          ...existing,
          cp_id: card.cp_id,
          kata_kunci: initialKeywords,
        };
      } else {
        // Pre-populate jika card memiliki bab materi bawaan
        let matPokok = "";
        let benangMerah = "";
        let kataKunci: string[] = [];
        const pcIds: string[] = [];
        const dplIds: string[] = [];

        if (card.materiIdx !== null && card.materiIdx !== undefined && materiPelajaran?.[card.materiIdx]) {
          const mat = materiPelajaran[card.materiIdx];
          matPokok = mat.bab + (mat.subbab?.length ? ` (${mat.subbab.join(", ")})` : "");
          benangMerah = mat.deskripsi || mat.saran_panca_cinta?.[0]?.alasan || "";
          kataKunci = mat.kata_kunci ? [...mat.kata_kunci] : [];

          mat.saran_panca_cinta?.forEach((spc) => {
            const foundPc = pancaCintaList.find((p) => p.kode === spc.topik_kode);
            if (foundPc) pcIds.push(foundPc.id);
          });
          mat.saran_dpl?.forEach((dplNum) => {
            const foundDpl = dplList.find((d) => d.kode === `DPL${dplNum}`);
            if (foundDpl) dplIds.push(foundDpl.id);
          });
        }

        map[card.cardId] = {
          id: card.analisisId,
          cp_id: card.cp_id,
          materi_pokok: matPokok,
          kompetensi: "Memahami dan Mengaplikasi",
          kata_kunci: kataKunci,
          benang_merah: benangMerah,
          dpl_ids: dplIds,
          panca_cinta_ids: pcIds,
          alokasi_jp: 2,
        };
      }
    });

    return map;
  });

  const [deletedAnalisisIds, setDeletedAnalisisIds] = useState<string[]>([]);
  const [tagInputMap, setTagInputMap] = useState<Record<string, string>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper perubahan field per card
  const updateField = <K extends keyof AnalisisCpItemPayload>(
    cardId: string,
    field: K,
    value: AnalisisCpItemPayload[K]
  ) => {
    setAnalisisMap((prev) => ({
      ...prev,
      [cardId]: {
        ...prev[cardId],
        [field]: value,
      },
    }));
    setSaveSuccess(false);
  };

  // Tag kata kunci handlers
  const handleAddTag = (cardId: string) => {
    const text = (tagInputMap[cardId] || "").trim();
    if (!text) return;

    const currentTags = analisisMap[cardId]?.kata_kunci || [];
    if (!currentTags.includes(text)) {
      updateField(cardId, "kata_kunci", [...currentTags, text]);
    }

    setTagInputMap((prev) => ({ ...prev, [cardId]: "" }));
  };

  const handleRemoveTag = (cardId: string, tagToRemove: string) => {
    const currentTags = analisisMap[cardId]?.kata_kunci || [];
    updateField(
      cardId,
      "kata_kunci",
      currentTags.filter((t) => t !== tagToRemove)
    );
  };

  // Handler pemilihan materi dari bank data dalam suatu card
  const handleSelectBankDataMateri = (
    cardId: string,
    materiIdx: number,
    customList?: WizardMateriItem[]
  ) => {
    const list = customList || materiList;
    const mat = (list || [])[materiIdx];
    if (!mat) return;

    const materiText = mat.bab + (mat.subbab && mat.subbab.length > 0 ? ` (${mat.subbab.join(", ")})` : "");

    const recommendedPcIds: string[] = [];
    mat.saran_panca_cinta?.forEach((spc) => {
      const foundPc = pancaCintaList.find((p) => p.kode === spc.topik_kode);
      if (foundPc) recommendedPcIds.push(foundPc.id);
    });

    const recommendedDplIds: string[] = [];
    mat.saran_dpl?.forEach((dplNum) => {
      const dplKode = `DPL${dplNum}`;
      const foundDpl = dplList.find((d) => d.kode === dplKode);
      if (foundDpl) recommendedDplIds.push(foundDpl.id);
    });

    setAnalisisMap((prev) => {
      const current = prev[cardId] || {
        cp_id: "",
        materi_pokok: "",
        kompetensi: "",
        kata_kunci: [],
        benang_merah: "",
        dpl_ids: [],
        panca_cinta_ids: [],
      };

      const mergedPc = Array.from(new Set([...current.panca_cinta_ids, ...recommendedPcIds]));
      const mergedDpl = Array.from(new Set([...current.dpl_ids, ...recommendedDplIds]));

      const nextBenangMerah = !current.benang_merah?.trim() && mat.deskripsi
        ? mat.deskripsi
        : current.benang_merah;

      const nextKataKunci =
        current.kata_kunci.length === 0 && mat.kata_kunci && mat.kata_kunci.length > 0
          ? [...mat.kata_kunci]
          : current.kata_kunci;

      return {
        ...prev,
        [cardId]: {
          ...current,
          materi_pokok: materiText,
          kata_kunci: nextKataKunci,
          benang_merah: nextBenangMerah,
          panca_cinta_ids: mergedPc,
          dpl_ids: mergedDpl,
        },
      };
    });

    setSelectedMateriIndex((prev) => ({ ...prev, [cardId]: materiIdx }));
  };

  // Handler simpan modal Bab ke Bank Data
  const handleSaveBabModal = async () => {
    if (!babModal.bab.trim()) {
      toast.error("Nama / Judul Bab tidak boleh kosong");
      return;
    }

    setIsSavingBab(true);
    try {
      const subbabArr = babModal.subbabText
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const kataKunciArr = babModal.kataKunciText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: SaveBabBankDataPayload = {
        id: babModal.id,
        bab: babModal.bab.trim(),
        semester: babModal.semester,
        urutan: Number(babModal.urutan || 1),
        subbab: subbabArr,
        kata_kunci: kataKunciArr,
        deskripsi: babModal.deskripsi.trim() || undefined,
        originalUrutan: babModal.originalUrutan,
      };

      const res = await saveBabBankDataAction(penugasanId, payload);
      if (!res.success || !res.data) {
        toast.error(res.error || "Gagal menyimpan bab ke Bank Data");
        return;
      }

      setMateriList(res.data);
      toast.success(
        babModal.mode === "edit"
          ? `Bab "${babModal.bab}" berhasil diperbarui di Bank Data!`
          : `Bab baru "${babModal.bab}" berhasil ditambahkan dan disimpan ke Bank Data!`
      );

      // Jika ada cardId, auto-select bab ini di card tersebut
      if (babModal.cardId) {
        const newIdx = res.data.findIndex((m) =>
          m.id && res.savedItem?.id
            ? m.id === res.savedItem.id
            : m.bab.toLowerCase().trim() === babModal.bab.toLowerCase().trim()
        );
        if (newIdx !== -1) {
          handleSelectBankDataMateri(babModal.cardId, newIdx, res.data);
        }
      }

      setBabModal((prev) => ({ ...prev, isOpen: false }));
    } catch {
      toast.error("Terjadi kesalahan saat menyimpan bab ke Bank Data");
    } finally {
      setIsSavingBab(false);
    }
  };

  // Handler hapus bab dari modal edit
  const handleDeleteBabModal = async () => {
    if (!babModal.id) {
      toast.error("Bab bawaan awal belum memiliki ID di database untuk dihapus.");
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus "${babModal.bab}" dari Bank Data?`)) {
      return;
    }

    setIsDeletingBab(true);
    try {
      const res = await deleteBabBankDataAction(penugasanId, babModal.id);
      if (!res.success || !res.data) {
        toast.error(res.error || "Gagal menghapus bab dari Bank Data");
        return;
      }

      setMateriList(res.data);
      toast.success("Bab berhasil dihapus dari Bank Data.");

      // Reset selection pada card
      setSelectedMateriIndex((prev) => {
        const updated: Record<string, number | null> = {};
        Object.keys(prev).forEach((k) => {
          updated[k] = null;
        });
        return updated;
      });

      setBabModal((prev) => ({ ...prev, isOpen: false }));
    } catch {
      toast.error("Gagal menghapus bab");
    } finally {
      setIsDeletingBab(false);
    }
  };

  // Toggle DPL checkbox
  const toggleDpl = (cardId: string, dplId: string) => {
    const current = analisisMap[cardId]?.dpl_ids || [];
    const next = current.includes(dplId)
      ? current.filter((id) => id !== dplId)
      : [...current, dplId];
    updateField(cardId, "dpl_ids", next);
  };

  // Toggle Panca Cinta checkbox
  const togglePancaCinta = (cardId: string, pcId: string) => {
    const current = analisisMap[cardId]?.panca_cinta_ids || [];
    const next = current.includes(pcId)
      ? current.filter((id) => id !== pcId)
      : [...current, pcId];
    updateField(cardId, "panca_cinta_ids", next);
  };

  // 4. Kalkulasi Bab Selanjutnya dari Bank Data yang belum terpakai di card
  const usedMateriIndexes = new Set<number>();
  cards.forEach((c) => {
    const sIdx = selectedMateriIndex[c.cardId];
    if (sIdx !== null && sIdx !== undefined) {
      usedMateriIndexes.add(sIdx);
    } else {
      const pokok = analisisMap[c.cardId]?.materi_pokok?.toLowerCase() || "";
      if (pokok && materiList) {
        const found = materiList.findIndex(
          (m) => pokok.includes(m.bab.toLowerCase()) || m.bab.toLowerCase().includes(pokok)
        );
        if (found !== -1) usedMateriIndexes.add(found);
      }
    }
  });

  const nextMateriIndex = (materiList || []).findIndex((_, idx) => !usedMateriIndexes.has(idx));
  const nextMateri = nextMateriIndex !== -1 ? (materiList || [])[nextMateriIndex] : null;

  const relevantCpForNextMateri = (() => {
    if (!nextMateri) return null;
    const kodeElemen = nextMateri.elemen_kode?.[0];
    if (kodeElemen) {
      const match = poolCp.find((c) => c.kode_elemen === kodeElemen);
      if (match) return match;
    }
    return poolCp.find((c) =>
      nextMateri.bab.toLowerCase().includes(c.elemen.toLowerCase()) ||
      c.elemen.toLowerCase().includes(nextMateri.bab.toLowerCase())
    ) || poolCp[0] || null;
  })();

  // 5. Tambah card baru berdasarkan Bab Kurikulum dari Bank Data
  const handleAddCardFromMateri = (materiIdx: number) => {
    if (!materiList || !materiList[materiIdx]) return;
    const mat = materiList[materiIdx];

    // Deteksi Elemen CP yang relevan dengan bab ini dari Bank Data
    const kode = mat.elemen_kode?.[0];
    let matchedCp = kode ? poolCp.find((c) => c.kode_elemen === kode) : null;
    if (!matchedCp) {
      matchedCp = poolCp.find((c) =>
        mat.bab.toLowerCase().includes(c.elemen.toLowerCase()) ||
        c.elemen.toLowerCase().includes(mat.bab.toLowerCase())
      ) || poolCp[0];
    }

    const cardId = `card-manual-${Date.now()}`;
    const materiText = mat.bab + (mat.subbab?.length ? ` (${mat.subbab.join(", ")})` : "");
    const benangMerah = mat.deskripsi || mat.saran_panca_cinta?.[0]?.alasan || "";
    const kataKunci = mat.kata_kunci ? [...mat.kata_kunci] : [];

    const recommendedPcIds: string[] = [];
    mat.saran_panca_cinta?.forEach((spc) => {
      const foundPc = pancaCintaList.find((p) => p.kode === spc.topik_kode);
      if (foundPc) recommendedPcIds.push(foundPc.id);
    });

    const recommendedDplIds: string[] = [];
    mat.saran_dpl?.forEach((dplNum) => {
      const foundDpl = dplList.find((d) => d.kode === `DPL${dplNum}`);
      if (foundDpl) recommendedDplIds.push(foundDpl.id);
    });

    const newCard: AnalisisCardItem = {
      cardId,
      cp_id: matchedCp ? matchedCp.id : `bank-${kode || "E1"}`,
      elemen: matchedCp?.elemen || "Capaian Pembelajaran",
      kode_elemen: matchedCp?.kode_elemen || kode,
      deskripsi_cp: matchedCp?.deskripsi_cp || "",
      sumber_regulasi: matchedCp?.sumber_regulasi,
      materiIdx,
      isAddedManually: true,
    };

    setCards((prev) => [...prev, newCard]);
    setSelectedMateriIndex((prev) => ({ ...prev, [cardId]: materiIdx }));
    setAnalisisMap((prev) => ({
      ...prev,
      [cardId]: {
        cp_id: newCard.cp_id,
        materi_pokok: materiText,
        kompetensi: "Memahami dan Mengaplikasi",
        kata_kunci: kataKunci,
        benang_merah: benangMerah,
        dpl_ids: recommendedDplIds,
        panca_cinta_ids: recommendedPcIds,
        alokasi_jp: 2,
      },
    }));

    setIsAddModalOpen(false);
  };

  // Tambah card manual berdasarkan CP tertentu
  const handleAddCardFromCp = (cpId: string) => {
    const targetCp = poolCp.find((c) => c.id === cpId);
    if (!targetCp) return;

    const cardId = `card-manual-${Date.now()}`;
    const newCard: AnalisisCardItem = {
      cardId,
      cp_id: targetCp.id,
      elemen: targetCp.elemen,
      kode_elemen: targetCp.kode_elemen,
      deskripsi_cp: targetCp.deskripsi_cp,
      sumber_regulasi: targetCp.sumber_regulasi,
      materiIdx: null,
      isAddedManually: true,
    };

    setCards((prev) => [...prev, newCard]);
    setAnalisisMap((prev) => ({
      ...prev,
      [cardId]: {
        cp_id: targetCp.id,
        materi_pokok: "",
        kompetensi: "Memahami dan Mengaplikasi",
        kata_kunci: [],
        benang_merah: "",
        dpl_ids: [],
        panca_cinta_ids: [],
        alokasi_jp: 2,
      },
    }));

    setIsAddModalOpen(false);
  };

  // Hapus card
  const handleRemoveCard = (cardId: string) => {
    const cardToRemove = cards.find((c) => c.cardId === cardId);
    if (cardToRemove?.analisisId) {
      setDeletedAnalisisIds((prev) => [...prev, cardToRemove.analisisId!]);
    }
    const updatedCards = cards.filter((c) => c.cardId !== cardId);
    setCards(updatedCards);
    setAnalisisMap((prev) => {
      const copy = { ...prev };
      delete copy[cardId];
      return copy;
    });

    if (onAnalisisUpdated) {
      const remainingPayload: AnalisisCpItemPayload[] = updatedCards.map((c, i) => {
        const item = analisisMap[c.cardId] || {
          cp_id: c.cp_id,
          materi_pokok: "",
          kompetensi: "Memahami dan Mengaplikasi",
          kata_kunci: [],
          benang_merah: "",
          dpl_ids: [],
          panca_cinta_ids: [],
          alokasi_jp: 2,
        };
        return {
          id: c.analisisId || (item.id && !item.id.startsWith("card-") ? item.id : undefined),
          cp_id: c.cp_id,
          materi_pokok: item.materi_pokok,
          kompetensi: item.kompetensi || "Memahami dan Mengaplikasi",
          kata_kunci: item.kata_kunci,
          benang_merah: item.benang_merah,
          dpl_ids: item.dpl_ids,
          panca_cinta_ids: item.panca_cinta_ids,
          alokasi_jp: item.alokasi_jp || 2,
          urutan: i + 1,
        };
      });
      onAnalisisUpdated(remainingPayload);
    }
  };

  // Geser urutan kartu CP ke atas atau ke bawah
  const moveCard = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cards.length) return;

    const copy = [...cards];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    setCards(copy);
    setSaveSuccess(false);

    if (onAnalisisUpdated) {
      const reorderedPayload: AnalisisCpItemPayload[] = copy.map((c, i) => {
        const item = analisisMap[c.cardId] || {
          cp_id: c.cp_id,
          materi_pokok: "",
          kompetensi: "Memahami dan Mengaplikasi",
          kata_kunci: [],
          benang_merah: "",
          dpl_ids: [],
          panca_cinta_ids: [],
          alokasi_jp: 2,
        };
        return {
          id: c.analisisId || (item.id && !item.id.startsWith("card-") ? item.id : undefined),
          cp_id: c.cp_id,
          materi_pokok: item.materi_pokok,
          kompetensi: item.kompetensi || "Memahami dan Mengaplikasi",
          kata_kunci: item.kata_kunci,
          benang_merah: item.benang_merah,
          dpl_ids: item.dpl_ids,
          panca_cinta_ids: item.panca_cinta_ids,
          alokasi_jp: item.alokasi_jp || 2,
          urutan: i + 1,
        };
      });
      onAnalisisUpdated(reorderedPayload);
    }
  };

  // 6. Menyimpan Analisis CP ke Database
  const handleSave = async (proceedNext = false) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      if (cards.length === 0) {
        setErrorMessage("Belum ada analisis CP yang ditambahkan.");
        setIsSaving(false);
        return;
      }

      for (const card of cards) {
        const item = analisisMap[card.cardId];
        if (!item || !item.materi_pokok?.trim()) {
          setErrorMessage(`Materi pokok untuk "${card.elemen}" wajib diisi.`);
          setIsSaving(false);
          return;
        }
        if (!item.kata_kunci || item.kata_kunci.length === 0) {
          setErrorMessage(`Kata kunci penting untuk "${card.elemen}" wajib diisi.`);
          setIsSaving(false);
          return;
        }
        if (!item.benang_merah?.trim()) {
          setErrorMessage(`Benang merah nilai luhur untuk "${card.elemen}" wajib diisi.`);
          setIsSaving(false);
          return;
        }
      }

      const payloadList: AnalisisCpItemPayload[] = cards.map((card, i) => {
        const item = analisisMap[card.cardId] || {
          cp_id: card.cp_id,
          materi_pokok: "",
          kompetensi: "Memahami dan Mengaplikasi",
          kata_kunci: [],
          benang_merah: "",
          dpl_ids: [],
          panca_cinta_ids: [],
          alokasi_jp: 2,
        };

        return {
          id: card.analisisId || (item.id && !item.id.startsWith("card-") ? item.id : undefined),
          cp_id: card.cp_id,
          materi_pokok: item.materi_pokok,
          kompetensi: item.kompetensi || "Memahami dan Mengaplikasi",
          kata_kunci: item.kata_kunci,
          benang_merah: item.benang_merah,
          dpl_ids: item.dpl_ids,
          panca_cinta_ids: item.panca_cinta_ids,
          alokasi_jp: item.alokasi_jp || 2,
          urutan: i + 1,
        };
      });

      const res = await saveAnalisisCpAction(penugasanId, payloadList, deletedAnalisisIds);
      if (!res.success) {
        setErrorMessage(res.error || "Gagal menyimpan analisis.");
        setIsSaving(false);
        return;
      }

      setSaveSuccess(true);
      const savedData = res.data && res.data.length > 0 ? res.data : payloadList;
      if (res.data && res.data.length > 0) {
        setCards((prevCards) =>
          prevCards.map((c, idx) => ({
            ...c,
            analisisId: res.data![idx]?.id || c.analisisId,
          }))
        );
      }
      if (onAnalisisUpdated) {
        onAnalisisUpdated(savedData);
      }
      if (proceedNext) {
        onNext();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Kesalahan sistem";
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const getPancaCintaColor = (urutan: number) => {
    switch (urutan) {
      case 1:
        return "bg-emerald-50 text-emerald-800 border-emerald-300";
      case 2:
        return "bg-sky-50 text-sky-800 border-sky-300";
      case 3:
        return "bg-lime-50 text-lime-800 border-lime-300";
      case 4:
        return "bg-rose-50 text-rose-800 border-rose-300";
      case 5:
        return "bg-amber-50 text-amber-800 border-amber-300";
      default:
        return "bg-slate-50 text-slate-800 border-slate-300";
    }
  };

  return (
    <div className="space-y-8">
      {/* Panel Accordion Bantuan Reflektif Panduan Kemenag */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 md:p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-5 h-5 text-amber-700" />
          <h3 className="font-semibold text-amber-950 text-base">
            Panel Bantuan: Pertanyaan Reflektif Analisis CP (Panduan PPA Kemenag)
          </h3>
        </div>
        <p className="text-xs text-amber-800 mb-3">
          Gunakan pertanyaan reflektif berikut sebagai kompas untuk membedah setiap elemen CP menjadi kata kunci,
          materi pokok, benang merah nilai luhur, dan integrasi Profil Lulusan & Panca Cinta:
        </p>

        <Accordion className="w-full bg-white/80 rounded-lg border border-amber-200">
          {PERTANYAAN_REFLEKTIF.map((item, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`} className="px-3">
              <AccordionTrigger className="text-xs md:text-sm font-medium text-slate-800 hover:text-emerald-700">
                <span className="flex items-center gap-2 text-left">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  {item.judul}: {item.pertanyaan}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-xs text-slate-600 pl-7 pb-3">
                <p className="bg-amber-50/60 p-2.5 rounded border border-amber-100">
                  <span className="font-semibold text-amber-900">Petunjuk Pengisian:</span> {item.panduan}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Notifikasi Status Verifikasi Bank Data */}
      {!bankDataVerified && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Pemberitahuan Bank Data Kurikulum:</span>
            <span>
              Bank data mata pelajaran ini belum diverifikasi waka kurikulum. Anda tetap bisa input manual atau gunakan saran sementara.
            </span>
          </div>
        </div>
      )}

      {/* Notifikasi feedback */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm">
          {errorMessage}
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Analisis Capaian Pembelajaran berhasil disimpan! Anda dapat melanjutkan ke Langkah 2.
        </div>
      )}

      {/* Daftar Elemen / Bab Analisis CP */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5 bg-emerald-50/80 border border-emerald-200/90 rounded-xl text-xs text-emerald-950 shadow-xs">
          <div className="flex items-center gap-2.5">
            {tingkatKelas && (
              <span className="font-bold px-2.5 py-1 bg-emerald-700 text-white rounded-md text-[11px] shadow-xs">
                Kelas {tingkatKelas}
              </span>
            )}
            <span className="font-medium text-slate-800">
              Terdapat <strong>{cards.length} Analisis Bab / Elemen CP</strong> pada alokasi kurikulum Fase D ini.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/atp/${penugasanId}/preview-cp`}
              target="_blank"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "bg-white border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold text-xs h-7 px-2.5",
              })}
            >
              <FileText className="w-3.5 h-3.5 mr-1 text-blue-600" />
              Dokumen / Cetak CP
            </Link>
            <span className="text-[11px] text-emerald-800 bg-white/70 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold hidden sm:inline">
              Fase D (MTs / SMP)
            </span>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h4 className="font-semibold text-slate-800 mb-1">Belum Ada Analisis CP Ditambahkan</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Gunakan tombol di bawah untuk menarik elemen CP dan materi bab dari Bank Data Kurikulum resmi.
            </p>
            {nextMateri && (
              <Button
                type="button"
                onClick={() => handleAddCardFromMateri(nextMateriIndex)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Tarik Bab {nextMateri.urutan}: {nextMateri.bab.replace(/^Bab\s*\d+:\s*/i, "")}
              </Button>
            )}
          </div>
        ) : (
          cards.map((card, idx) => {
            const cardId = card.cardId;
            const currentData = analisisMap[cardId] || {
              cp_id: card.cp_id,
              materi_pokok: "",
              kompetensi: "Memahami dan Mengaplikasi",
              kata_kunci: [],
              benang_merah: "",
              dpl_ids: [],
              panca_cinta_ids: [],
            };

            const selectedMatIdx = selectedMateriIndex[cardId];
            const selectedMat =
              selectedMatIdx !== undefined && selectedMatIdx !== null
                ? (materiList || [])[selectedMatIdx]
                : null;

            return (
              <div
                key={cardId}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-emerald-300 transition-colors"
              >
                {/* Header Elemen CP */}
                <div className="bg-slate-50/80 border-b border-slate-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {/* Reorder Buttons */}
                    <div className="flex flex-col gap-0.5 mr-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={idx === 0}
                        onClick={() => moveCard(idx, "up")}
                        className="h-6 w-6 text-slate-600 hover:text-emerald-700 disabled:opacity-30 cursor-pointer"
                        title="Geser Elemen CP ke Atas"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={idx === cards.length - 1}
                        onClick={() => moveCard(idx, "down")}
                        className="h-6 w-6 text-slate-600 hover:text-emerald-700 disabled:opacity-30 cursor-pointer"
                        title="Geser Elemen CP ke Bawah"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </Button>
                    </div>

                    <span className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">
                        Elemen: {card.elemen}
                      </h4>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>Fase D (MTs)</span>
                        {card.sumber_regulasi && (
                          <>
                            <span>•</span>
                            <span className="font-mono">{card.sumber_regulasi}</span>
                          </>
                        )}
                        {card.kode_elemen && (
                          <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-700 font-normal">
                            {card.kode_elemen}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-emerald-800 bg-emerald-50/60 border-emerald-200">
                      Urutan #{idx + 1}
                    </Badge>
                    {cards.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCard(cardId)}
                        className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 px-2 text-xs"
                        title="Hapus analisis elemen ini"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Hapus
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-5 md:p-6 space-y-6">
                  {/* Teks CP Read-Only */}
                  <div className="bg-emerald-50/30 border border-emerald-100 rounded-lg p-4">
                    <label className="text-xs font-semibold text-emerald-950 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                      Deskripsi Capaian Pembelajaran (Read-Only)
                    </label>
                    <p className="text-slate-800 text-sm leading-relaxed text-justify">
                      {card.deskripsi_cp || "Deskripsi capaian pembelajaran belum tersedia."}
                    </p>
                  </div>

                  {/* Form Pengisian Guru */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* 1. Kata Kunci (Input Tag) */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-800 block flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-slate-500" />
                        Kata Kunci Penting
                        <span className="text-rose-500">*</span>
                      </label>
                      <p className="text-xs text-slate-500">
                        Ketik kata kunci lalu tekan Enter atau tombol Tambah (misal: <em>daulah abbasiyah, peradaban islam</em>).
                      </p>

                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Tambah kata kunci..."
                          value={tagInputMap[cardId] || ""}
                          onChange={(e) =>
                            setTagInputMap((prev) => ({ ...prev, [cardId]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddTag(cardId);
                            }
                          }}
                          className="text-xs md:text-sm"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAddTag(cardId)}
                          className="shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Tambah
                        </Button>
                      </div>

                      {/* Tag Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1 min-h-[30px]">
                        {currentData.kata_kunci.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">Belum ada kata kunci ditambahkan</span>
                        ) : (
                          currentData.kata_kunci.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs px-2.5 py-1 rounded-md border border-slate-200"
                            >
                              <span>{tag}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTag(cardId, tag)}
                                className="text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      {/* Saran Kata Kunci dari Bank Data jika ada materi yang dipilih */}
                      {selectedMat?.kata_kunci && selectedMat.kata_kunci.length > 0 ? (
                        <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl space-y-2 shadow-2xs mt-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-blue-950 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              Saran Kata Kunci Bank Data (Bab {selectedMat.urutan}: {selectedMat.bab.replace(/^Bab\s*\d+:\s*/i, "")}):
                            </span>
                            {selectedMat.kata_kunci.some((k) => !currentData.kata_kunci.includes(k)) && (
                              <button
                                type="button"
                                onClick={() => {
                                  const toAdd = selectedMat.kata_kunci!.filter(
                                    (k) => !currentData.kata_kunci.includes(k)
                                  );
                                  updateField(cardId, "kata_kunci", [...currentData.kata_kunci, ...toAdd]);
                                }}
                                className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-white px-2.5 py-0.5 rounded-md border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                              >
                                + Tambah Semua
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedMat.kata_kunci.map((kw) => {
                              const isAdded = currentData.kata_kunci.includes(kw);
                              return (
                                <button
                                  key={kw}
                                  type="button"
                                  disabled={isAdded}
                                  onClick={() => {
                                    if (!isAdded) {
                                      updateField(cardId, "kata_kunci", [...currentData.kata_kunci, kw]);
                                    }
                                  }}
                                  className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                                    isAdded
                                      ? "bg-slate-100 text-slate-500 border-slate-200 cursor-default font-medium"
                                      : "bg-white text-blue-700 border-blue-300 hover:bg-blue-100 hover:border-blue-400 shadow-2xs cursor-pointer font-medium"
                                  }`}
                                  title={isAdded ? "Sudah ditambahkan" : "Klik untuk menambahkan"}
                                >
                                  {isAdded ? `✓ ${kw}` : `+ ${kw}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : materiPelajaran && materiPelajaran.length > 0 ? (
                        <div className="p-2.5 bg-slate-50/80 border border-dashed border-slate-300 rounded-lg text-slate-500 text-xs flex items-center gap-1.5 mt-1">
                          <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Pilih Rekomendasi Bab di kolom Materi Pokok untuk memunculkan saran kata kunci kurikulum.</span>
                        </div>
                      ) : null}
                    </div>

                    {/* 2. Materi Pokok */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                          Materi Pokok
                          <span className="text-rose-500">*</span>
                        </label>
                        {materiList && materiList.length > 0 && (
                          <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300 font-normal">
                            Bank Data: {materiList.length} Bab
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Pilih bab kurikulum resmi, edit/tambah bab ke Bank Data, atau ketik materi pokok secara manual.
                      </p>

                      {materiList && materiList.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-medium text-slate-600">
                              Pilih Rekomendasi Bab Kurikulum (Bank Data Fase D):
                            </label>
                            <div className="flex items-center gap-1.5">
                              {selectedMateriIndex[cardId] !== undefined &&
                                selectedMateriIndex[cardId] !== null && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleOpenEditBabModal(cardId, selectedMateriIndex[cardId]!)
                                    }
                                    className="h-6 px-2 text-[11px] text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200 gap-1 font-medium shadow-none cursor-pointer"
                                    title="Edit data bab yang sedang dipilih dan simpan ke Bank Data"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    <span>Edit Bab</span>
                                  </Button>
                                )}
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenAddBabModal(cardId)}
                                className="h-6 px-2 text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 gap-1 font-medium shadow-none cursor-pointer"
                                title="Tambah bab baru dan simpan ke Bank Data"
                              >
                                <Plus className="w-3 h-3" />
                                <span>+ Bab Baru</span>
                              </Button>
                            </div>
                          </div>

                          <select
                            value={
                              selectedMateriIndex[cardId] !== undefined && selectedMateriIndex[cardId] !== null
                                ? String(selectedMateriIndex[cardId])
                                : ""
                            }
                            onChange={(e) => {
                              if (e.target.value === "__ADD_NEW__") {
                                handleOpenAddBabModal(cardId);
                              } else if (e.target.value !== "") {
                                handleSelectBankDataMateri(cardId, parseInt(e.target.value, 10));
                              } else {
                                setSelectedMateriIndex((prev) => ({ ...prev, [cardId]: null }));
                              }
                            }}
                            className="w-full text-xs border border-emerald-300 bg-emerald-50/50 rounded-md px-2.5 py-1.5 text-slate-900 font-medium focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="">-- Rekomendasi Bab dari Bank Data Fase D --</option>
                            {materiList.map((m, mIdx) => {
                              const cleanBab = m.bab.replace(/^Bab\s*\d+:\s*/i, "");
                              return (
                                <option key={mIdx} value={mIdx}>
                                  Bab {m.urutan}: {cleanBab} (Semester {m.semester})
                                </option>
                              );
                            })}
                            <option value="__ADD_NEW__" className="text-emerald-700 font-semibold bg-emerald-50">
                              ➕ + Tambah Bab Baru ke Bank Data...
                            </option>
                          </select>
                        </div>
                      )}

                      <Input
                        placeholder="Contoh: Daulah Abbasiyah Membangun Peradaban Islam"
                        value={currentData.materi_pokok}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateField(cardId, "materi_pokok", val);
                          if (val && materiList && materiList.length > 0) {
                            const valNorm = val.toLowerCase().trim();
                            const matchIdx = materiList.findIndex((m) => {
                              const bNorm = m.bab.toLowerCase();
                              return valNorm.includes(bNorm) || bNorm.includes(valNorm);
                            });
                            if (matchIdx !== -1) {
                              setSelectedMateriIndex((prev) => ({ ...prev, [cardId]: matchIdx }));
                            }
                          }
                        }}
                        className="text-xs md:text-sm bg-white"
                      />
                    </div>
                  </div>

                  {/* 3. Benang Merah Nilai Kemanusiaan / Spiritual / Lingkungan */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        Benang Merah Nilai Luhur (Spiritual, Kemanusiaan, & Lingkungan)
                        <span className="text-rose-500">*</span>
                      </label>
                      {materiList && materiList.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500 font-medium">Saran Bab:</span>
                          <select
                            value={
                              selectedMateriIndex[cardId] !== undefined && selectedMateriIndex[cardId] !== null
                                ? String(selectedMateriIndex[cardId])
                                : ""
                            }
                            onChange={(e) => {
                              if (e.target.value === "") {
                                setSelectedMateriIndex((prev) => ({ ...prev, [cardId]: null }));
                                return;
                              }
                              const idx = parseInt(e.target.value, 10);
                              setSelectedMateriIndex((prev) => ({ ...prev, [cardId]: idx }));
                              const mat = (materiList || [])[idx];
                              const val = mat?.deskripsi || mat?.saran_panca_cinta?.[0]?.alasan || "";
                              if (val && !currentData.benang_merah?.trim()) {
                                updateField(cardId, "benang_merah", val);
                              }
                            }}
                            className="text-xs border border-amber-300 bg-amber-50/80 rounded-md px-2 py-1 text-slate-800 font-medium focus:ring-1 focus:ring-amber-500"
                          >
                            <option value="">-- Pilih Bab untuk Lihat Saran --</option>
                            {materiList.map((m, mIdx) => (
                              <option key={mIdx} value={mIdx}>
                                Bab {m.urutan}: {m.bab.replace(/^Bab\s*\d+:\s*/i, "")}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Uraikan nilai kebajikan, adab, atau kesadaran ketuhanan yang menjadi ruh dalam materi ini
                      agar pembelajaran tidak berhenti sebatas hafalan mekanistik semata.
                    </p>

                    {/* Saran dari Bank Data Kurikulum */}
                    {selectedMat ? (
                      <div className="p-3 bg-amber-50/90 border border-amber-300/80 rounded-xl space-y-2.5 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-semibold text-amber-950 text-xs">
                            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>
                              Saran Nilai Luhur Bank Data (Bab {selectedMat.urutan}: {selectedMat.bab.replace(/^Bab\s*\d+:\s*/i, "")}):
                            </span>
                          </div>
                          {(() => {
                            const textVal = selectedMat.deskripsi || selectedMat.saran_panca_cinta?.[0]?.alasan || "";
                            const isUsed = currentData.benang_merah === textVal;
                            return (
                              <button
                                type="button"
                                onClick={() => updateField(cardId, "benang_merah", textVal)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0 ${
                                  isUsed
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                    : "bg-amber-600 hover:bg-amber-700 text-white"
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                {isUsed ? "✓ Saran Telah Digunakan" : "Gunakan Saran Ini"}
                              </button>
                            );
                          })()}
                        </div>
                        <p className="text-slate-800 italic text-xs md:text-sm leading-relaxed bg-white p-3 rounded-lg border border-amber-200 shadow-2xs">
                          &ldquo;{selectedMat.deskripsi || selectedMat.saran_panca_cinta?.[0]?.alasan}&rdquo;
                        </p>
                      </div>
                    ) : materiPelajaran && materiPelajaran.length > 0 ? (
                      <div className="p-3 bg-amber-50/70 border border-dashed border-amber-300 rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            Klik salah satu bab di bawah untuk langsung memunculkan saran nilai luhur:
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {materiPelajaran.map((m, mIdx) => (
                            <button
                              key={mIdx}
                              type="button"
                              onClick={() => {
                                setSelectedMateriIndex((prev) => ({ ...prev, [cardId]: mIdx }));
                                const text = m.deskripsi || m.saran_panca_cinta?.[0]?.alasan || "";
                                if (text && !currentData.benang_merah?.trim()) {
                                  updateField(cardId, "benang_merah", text);
                                }
                              }}
                              className="px-2.5 py-1 text-[11px] bg-white hover:bg-amber-100 text-amber-950 border border-amber-200 rounded-md font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                            >
                              <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[10px] font-bold">
                                {m.urutan}
                              </span>
                              <span>{m.bab.replace(/^Bab\s*\d+:\s*/i, "")}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <Textarea
                      rows={3}
                      placeholder="Contoh: Mengapresiasi pencapaian peradaban Islam membangkitkan rasa percaya diri, cinta ilmu pengetahuan, dan keterbukaan belajar dari peradaban lain."
                      value={currentData.benang_merah}
                      onChange={(e) => updateField(cardId, "benang_merah", e.target.value)}
                      className="text-xs md:text-sm bg-white"
                    />
                  </div>

                  {/* 4. Pemetaan Dimensi Profil Lulusan (DPL1 - DPL8) */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        Dimensi Profil Lulusan (DPL) Terkait
                      </label>
                      <span className="text-[11px] text-slate-400">Pilih 1 atau lebih</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                      {dplList.map((dpl) => {
                        const isChecked = currentData.dpl_ids.includes(dpl.id);
                        const dplNum = parseInt(dpl.kode.replace(/\D/g, ""), 10);
                        const isRecommended = selectedMat?.saran_dpl?.includes(dplNum);

                        return (
                          <div
                            key={dpl.id}
                            onClick={() => toggleDpl(cardId, dpl.id)}
                            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? "bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-400 shadow-2xs"
                                : isRecommended
                                ? "bg-emerald-50/30 border-emerald-200 text-slate-700 hover:bg-slate-50"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className="font-bold text-[11px] text-emerald-800">
                                {dpl.kode}
                              </span>
                              <div className="flex items-center gap-1">
                                {isRecommended && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-medium">
                                    Saran
                                  </span>
                                )}
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => toggleDpl(cardId, dpl.id)}
                                />
                              </div>
                            </div>
                            <div className="font-medium text-xs leading-snug">{dpl.nama}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 5. Pemetaan Panca Cinta (5 Nilai Kemenag) */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-600" />
                        Pilar Nilai Luhur Panca Cinta (Kemenag)
                      </label>
                      <span className="text-[11px] text-slate-400">Pilih pilar yang diinternalisasi</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                      {pancaCintaList.map((pc) => {
                        const isChecked = currentData.panca_cinta_ids.includes(pc.id);
                        const saranPc = selectedMat?.saran_panca_cinta?.find(
                          (spc) => spc.topik_kode === pc.kode || spc.topik_kode === `PC${pc.urutan}`
                        );
                        const colorClass = getPancaCintaColor(pc.urutan);

                        return (
                          <div
                            key={pc.id}
                            onClick={() => togglePancaCinta(cardId, pc.id)}
                            className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                              isChecked
                                ? `${colorClass} ring-1 ring-current shadow-2xs font-medium`
                                : saranPc
                                ? "bg-amber-50/40 border-amber-300 text-slate-700 hover:bg-slate-50"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-mono text-[10px] text-slate-500 font-semibold">
                                {pc.kode}
                              </span>
                              <div className="flex items-center gap-1">
                                {saranPc && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-medium">
                                    Saran
                                  </span>
                                )}
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => togglePancaCinta(cardId, pc.id)}
                                />
                              </div>
                            </div>
                            <div className="font-semibold text-xs leading-tight mb-1">{pc.nama}</div>
                            {saranPc && (
                              <div className="text-[10px] text-emerald-700 italic line-clamp-2 mt-0.5" title={saranPc.alasan}>
                                💡 {saranPc.alasan}
                              </div>
                            )}
                            {!saranPc && pc.deskripsi && (
                              <div className="text-[10px] text-slate-500 line-clamp-2">
                                {pc.deskripsi}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Panel Tambah Elemen CP / Analisis Bab Selanjutnya */}
        <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 border border-emerald-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <h4 className="font-bold text-slate-900 text-sm md:text-base">
                  Tambah Elemen CP Berdasarkan Bab Selanjutnya
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Sistem mendeteksi bab kurikulum berikutnya dan menarik Elemen Capaian Pembelajaran (CP) yang relevan langsung dari Bank Data resmi.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {nextMateri && relevantCpForNextMateri && (
                <Button
                  type="button"
                  onClick={() => handleAddCardFromMateri(nextMateriIndex)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  + Tarik Bab {nextMateri.urutan}: {nextMateri.bab.replace(/^Bab\s*\d+:\s*/i, "").slice(0, 24)}...
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(true)}
                className="border-emerald-300 text-emerald-900 bg-white hover:bg-emerald-50 text-xs font-semibold shadow-xs cursor-pointer"
              >
                <ListPlus className="w-3.5 h-3.5 mr-1.5 text-emerald-700" />
                Pilih Bab / Elemen...
              </Button>
            </div>
          </div>

          {nextMateri && relevantCpForNextMateri && (
            <div className="p-3 bg-white/95 border border-emerald-200/90 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                  {nextMateri.urutan}
                </span>
                <div>
                  <span className="font-semibold text-slate-900">
                    {nextMateri.bab}
                  </span>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span>Semester {nextMateri.semester}</span>
                    <span>•</span>
                    <span className="text-emerald-800 font-medium">Elemen CP Relevan: {relevantCpForNextMateri.elemen}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-300">
                  Rekomendasi Berikutnya
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog: Tambah Elemen CP dari Bank Data */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              Tambah Elemen CP dari Bank Data Kurikulum
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Pilih bab yang ingin ditambahkan. Sistem akan otomatis memasangkan Elemen CP yang relevan serta seluruh rekomendasi materi, kata kunci, dan nilai luhur dari Bank Data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 1. Rekomendasi Bab Selanjutnya */}
            {nextMateri && relevantCpForNextMateri && (
              <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <Badge className="bg-emerald-700 text-white text-[10px]">
                    Rekomendasi Bab Selanjutnya
                  </Badge>
                  <span className="text-[11px] text-emerald-900 font-semibold">
                    Semester {nextMateri.semester}
                  </span>
                </div>

                <div>
                  <h5 className="font-bold text-slate-900 text-sm">
                    {nextMateri.bab}
                  </h5>
                  <p className="text-xs text-emerald-950 font-medium mt-1">
                    Elemen CP Terkait: <strong>{relevantCpForNextMateri.elemen}</strong> ({relevantCpForNextMateri.kode_elemen || "Fase D"})
                  </p>
                  <p className="text-[11px] text-slate-600 italic mt-1 line-clamp-2 bg-white/70 p-2 rounded border border-emerald-100">
                    &ldquo;{relevantCpForNextMateri.deskripsi_cp}&rdquo;
                  </p>
                </div>

                <div className="pt-1 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => handleAddCardFromMateri(nextMateriIndex)}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Tarik Bab Ini ke Analisis CP
                  </Button>
                </div>
              </div>
            )}

            {/* 2. Daftar Bab Lain dari Bank Data */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Pilih Bab Kurikulum Lain (Fase D):
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {(materiList || []).map((m, mIdx) => {
                  const isAssigned = usedMateriIndexes.has(mIdx);
                  const kode = m.elemen_kode?.[0];
                  const matchedCp = kode ? poolCp.find((c) => c.kode_elemen === kode) : null;
                  const cpName = matchedCp?.elemen || "Elemen Kurikulum";

                  return (
                    <div
                      key={mIdx}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 transition-colors ${
                        isAssigned
                          ? "bg-slate-50 border-slate-200 opacity-60"
                          : "bg-white border-slate-200 hover:border-emerald-300 shadow-2xs"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">
                          Bab {m.urutan}: {m.bab.replace(/^Bab\s*\d+:\s*/i, "")}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>Sem. {m.semester}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-medium">Elemen CP: {cpName}</span>
                        </div>
                      </div>

                      {isAssigned ? (
                        <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-500 shrink-0">
                          Sudah Dianalisis
                        </Badge>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddCardFromMateri(mIdx)}
                          className="shrink-0 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Pilih
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Atau Pilih Elemen CP Manual */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Atau Tambah Elemen CP Tanpa Bab Tertentu:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {poolCp.map((cp) => (
                  <button
                    key={cp.id}
                    type="button"
                    onClick={() => handleAddCardFromCp(cp.id)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-left transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3 h-3 text-slate-500" />
                    <span>{cp.elemen}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}
              className="text-xs cursor-pointer"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Dialog: Tambah / Edit Bab di Bank Data */}
      <Dialog
        open={babModal.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setBabModal((prev) => ({ ...prev, isOpen: false }));
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
              {babModal.mode === "edit" ? (
                <>
                  <Pencil className="w-5 h-5 text-amber-600" />
                  Edit Bab di Bank Data Kurikulum
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  Tambah Bab Baru ke Bank Data Kurikulum
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {babModal.mode === "edit"
                ? "Perubahan pada bab ini akan otomatis tersimpan ke Bank Data kurikulum madrasah dan memperbarui rekomendasi secara langsung."
                : "Bab baru akan otomatis tersimpan ke Bank Data kurikulum Fase D dan dapat langsung dipilih pada analisis CP ini."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* 1. Nama / Judul Bab */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 flex items-center justify-between">
                <span>
                  Nama / Judul Bab <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">Contoh: Bab 6: Dinamika Penduduk Benua</span>
              </label>
              <Input
                value={babModal.bab}
                onChange={(e) => setBabModal((prev) => ({ ...prev, bab: e.target.value }))}
                placeholder="Masukkan judul bab lengkap..."
                className="text-xs md:text-sm bg-white font-medium"
              />
            </div>

            {/* 2. Semester & Nomor Urut */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800">
                  Semester <span className="text-rose-500">*</span>
                </label>
                <select
                  value={babModal.semester}
                  onChange={(e) =>
                    setBabModal((prev) => ({
                      ...prev,
                      semester: (parseInt(e.target.value, 10) === 2 ? 2 : 1) as 1 | 2,
                    }))
                  }
                  className="w-full text-xs border border-slate-300 rounded-md px-2.5 py-2 text-slate-900 font-medium focus:ring-1 focus:ring-emerald-500 bg-white"
                >
                  <option value={1}>Semester 1 (Ganjil)</option>
                  <option value={2}>Semester 2 (Genap)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-800">
                  Nomor Urut Bab <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min={1}
                  value={babModal.urutan}
                  onChange={(e) =>
                    setBabModal((prev) => ({
                      ...prev,
                      urutan: parseInt(e.target.value, 10) || 1,
                    }))
                  }
                  className="text-xs md:text-sm bg-white font-medium"
                />
              </div>
            </div>

            {/* 3. Subbab / Lingkup Materi */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 flex items-center justify-between">
                <span>Subbab / Lingkup Materi (Opsional)</span>
                <span className="text-[11px] text-slate-400 font-normal">Satu per baris atau pisahkan dengan koma</span>
              </label>
              <Textarea
                rows={3}
                value={babModal.subbabText}
                onChange={(e) => setBabModal((prev) => ({ ...prev, subbabText: e.target.value }))}
                placeholder="A. Konsep dan Karakteristik Utama&#10;B. Analisis dan Dampak Sosial&#10;C. Penerapan Praktis"
                className="text-xs bg-white resize-y"
              />
            </div>

            {/* 4. Kata Kunci Kurikulum */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 flex items-center justify-between">
                <span>Kata Kunci (Opsional)</span>
                <span className="text-[11px] text-slate-400 font-normal">Pisahkan dengan koma</span>
              </label>
              <Input
                value={babModal.kataKunciText}
                onChange={(e) => setBabModal((prev) => ({ ...prev, kataKunciText: e.target.value }))}
                placeholder="dinamika, penduduk, keberagaman, nilai sosial"
                className="text-xs bg-white"
              />
            </div>

            {/* 5. Deskripsi / Benang Merah Nilai Luhur */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 flex items-center justify-between">
                <span>Benang Merah Nilai Luhur / Deskripsi KBC (Opsional)</span>
                <span className="text-[11px] text-slate-400 font-normal">Saran otomatis nilai spiritual/kemanusiaan</span>
              </label>
              <Textarea
                rows={2}
                value={babModal.deskripsi}
                onChange={(e) => setBabModal((prev) => ({ ...prev, deskripsi: e.target.value }))}
                placeholder="Menanamkan rasa cinta kasih kepada sesama insan dan mensyukuri karunia Allah SWT..."
                className="text-xs bg-white resize-y"
              />
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between pt-2 border-t border-slate-100">
            <div>
              {babModal.mode === "edit" && babModal.id ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleDeleteBabModal}
                  disabled={isSavingBab || isDeletingBab}
                  className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                >
                  {isDeletingBab ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                  )}
                  Hapus Bab
                </Button>
              ) : (
                <div />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBabModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={isSavingBab || isDeletingBab}
                className="text-xs cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleSaveBabModal}
                disabled={isSavingBab || isDeletingBab || !babModal.bab.trim()}
                className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer"
              >
                {isSavingBab ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Menyimpan ke Bank Data...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Simpan ke Bank Data
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Bar Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <div className="text-xs text-slate-500">
          Semua perubahan analisis CP disimpan ke database secara aman.
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Link
            href={`/atp/${penugasanId}/preview-cp`}
            target="_blank"
            className={buttonVariants({
              variant: "outline",
              className: "flex-1 sm:flex-none border-blue-200 text-blue-700 hover:bg-blue-50 font-medium text-xs",
            })}
          >
            <FileText className="w-4 h-4 mr-1.5 text-blue-600" />
            Dokumen CP
          </Link>

          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => handleSave(false)}
            className="flex-1 sm:flex-none border-slate-300 hover:bg-slate-100 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2 text-slate-600" />
            )}
            Simpan Draf Analisis
          </Button>

          <Button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave(true)}
            className="flex-1 sm:flex-none bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-sm cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            Lanjut ke Rumuskan TP
          </Button>
        </div>
      </div>
    </div>
  );
}
