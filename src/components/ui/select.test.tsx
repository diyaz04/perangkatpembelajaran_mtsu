import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./select";

describe("Select component label extraction", () => {
  it("renders human-readable label when a value is selected, instead of raw UUID/ID", () => {
    const pancaCintaList = [
      { id: "00000000-0000-0000-0000-000000000001", kode: "PC1", nama: "Cinta Allah dan Rasul-Nya" },
      { id: "00000000-0000-0000-0000-000000000004", kode: "PC4", nama: "Cinta Bangsa dan Negara" },
    ];

    const html = renderToString(
      <Select value="00000000-0000-0000-0000-000000000004">
        <SelectTrigger>
          <SelectValue placeholder="Pilih Topik Panca Cinta..." />
        </SelectTrigger>
        <SelectContent>
          {pancaCintaList.map((pc) => (
            <SelectItem key={pc.id} value={pc.id}>
              {pc.kode}: {pc.nama}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );

    // Must contain human-readable text
    expect(html).toContain("PC4");
    expect(html).toContain("Cinta Bangsa dan Negara");
    // The button trigger display must NOT just show raw UUID text as the label span
    expect(html).not.toContain("<span>00000000-0000-0000-0000-000000000004</span>");
  });

  it("renders placeholder when value is empty string", () => {
    const html = renderToString(
      <Select value="">
        <SelectTrigger>
          <SelectValue placeholder="Pilih Topik Panca Cinta..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Opsi 1</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(html).toContain("Pilih Topik Panca Cinta...");
  });

  it("renders labels correctly for enum values like ATP methods", () => {
    const html = renderToString(
      <Select value="konkret_ke_abstrak">
        <SelectTrigger>
          <SelectValue placeholder="Pilih Metode Pengurutan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="hierarkis">Pengurutan Hierarkis</SelectItem>
          <SelectItem value="konkret_ke_abstrak">Pengurutan Konkret ke Abstrak</SelectItem>
        </SelectContent>
      </Select>
    );

    expect(html).toContain("Pengurutan Konkret ke Abstrak");
  });
});
