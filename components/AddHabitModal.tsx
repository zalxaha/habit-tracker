"use client";

import { useState } from "react";
import type { Habit } from "@/lib/github";

const EMOJI_OPTIONS = ["✦", "🌙", "💧", "📖", "🏃", "🧘", "🥗", "✍️", "☀️", "🎯"];
const COLOR_OPTIONS: { key: Habit["color"]; label: string; swatch: string }[] = [
  { key: "gold", label: "Emas", swatch: "#F2C879" },
  { key: "ember", label: "Bara", swatch: "#F0876A" },
  { key: "sage", label: "Sage", swatch: "#8FCB9B" },
];

export default function AddHabitModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: { name: string; emoji: string; color: Habit["color"] }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJI_OPTIONS[0]);
  const [color, setColor] = useState<Habit["color"]>("gold");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    await onCreate({ name, emoji, color });
    setSaving(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full sm:max-w-sm bg-ink-800 border border-ink-600 rounded-2xl p-5 animate-rise-in"
      >
        <h2 className="font-display text-xl text-parchment mb-4">Kebiasaan baru</h2>

        <label className="block text-xs uppercase tracking-wider text-parchment-dim mb-1.5">
          Nama
        </label>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Misalnya: Minum air putih"
          className="w-full bg-ink-700 border border-ink-600 rounded-lg px-3 py-2 text-parchment placeholder:text-parchment-dim/60 mb-4 focus:border-gold outline-none"
        />

        <label className="block text-xs uppercase tracking-wider text-parchment-dim mb-1.5">
          Simbol
        </label>
        <div className="flex flex-wrap gap-2 mb-4">
          {EMOJI_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => setEmoji(opt)}
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-base border transition-colors ${
                emoji === opt ? "border-gold bg-ink-600" : "border-ink-600 bg-ink-700"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        <label className="block text-xs uppercase tracking-wider text-parchment-dim mb-1.5">
          Warna
        </label>
        <div className="flex gap-2 mb-6">
          {COLOR_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.key}
              onClick={() => setColor(opt.key)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${
                color === opt.key ? "border-gold text-parchment" : "border-ink-600 text-parchment-dim"
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opt.swatch }} />
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-ink-600 text-parchment-dim text-sm"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="flex-1 py-2.5 rounded-lg bg-gold text-ink-900 font-medium text-sm disabled:opacity-50"
          >
            {saving ? "Menyimpan…" : "Tambahkan"}
          </button>
        </div>
      </form>
    </div>
  );
}
