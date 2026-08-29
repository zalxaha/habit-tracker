"use client";

import type { NoteCategory } from "@/lib/github";

export const CATEGORY_META: Record<NoteCategory, { label: string; swatch: string; text: string }> = {
  umum: { label: "Umum", swatch: "#9AA0C8", text: "text-parchment-dim" },
  ide: { label: "Ide", swatch: "#F2C879", text: "text-gold" },
  refleksi: { label: "Refleksi", swatch: "#8FCB9B", text: "text-sage" },
  tugas: { label: "Tugas", swatch: "#F0876A", text: "text-ember" },
};

export default function CategoryBadge({ category }: { category: NoteCategory }) {
  const meta = CATEGORY_META[category];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${meta.text}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.swatch }} />
      {meta.label}
    </span>
  );
}
