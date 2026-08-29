"use client";

import { useState } from "react";
import type { Note } from "@/lib/github";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function NotesSection({
  notes,
  onCreate,
  onUpdate,
  onDelete,
}: {
  notes: Note[];
  onCreate: (title: string, content: string) => Promise<void>;
  onUpdate: (id: string, title: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function submitNew(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    await onCreate(title, content);
    setTitle("");
    setContent("");
    setComposing(false);
    setSaving(false);
  }

  function startEdit(n: Note) {
    setEditingId(n.id);
    setEditTitle(n.title);
    setEditContent(n.content);
  }

  async function submitEdit(e: React.FormEvent, id: string) {
    e.preventDefault();
    if (!editTitle.trim() || saving) return;
    setSaving(true);
    await onUpdate(id, editTitle, editContent);
    setEditingId(null);
    setSaving(false);
  }

  return (
    <div className="space-y-3">
      {!composing ? (
        <button
          onClick={() => setComposing(true)}
          className="w-full text-left px-4 py-3 rounded-xl border border-dashed border-ink-600 text-parchment-dim text-sm hover:border-gold/60 hover:text-parchment transition-colors"
        >
          + Tulis catatan baru…
        </button>
      ) : (
        <form
          onSubmit={submitNew}
          className="rounded-xl border border-ink-600 bg-ink-800 p-4 animate-rise-in"
        >
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Judul"
            className="w-full bg-transparent text-parchment font-display text-lg placeholder:text-parchment-dim/60 outline-none mb-2"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Tulis sesuatu…"
            rows={4}
            className="w-full bg-transparent text-parchment text-sm placeholder:text-parchment-dim/60 outline-none resize-none mb-3"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                setComposing(false);
                setTitle("");
                setContent("");
              }}
              className="px-3 py-1.5 rounded-lg text-parchment-dim text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="px-4 py-1.5 rounded-lg bg-gold text-ink-900 text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Menyimpan…" : "Simpan"}
            </button>
          </div>
        </form>
      )}

      {notes.length === 0 && !composing && (
        <p className="text-parchment-dim text-sm text-center py-8">
          Belum ada catatan. Halaman ini menunggu untuk diisi.
        </p>
      )}

      <div className="space-y-3">
        {notes.map((n) => (
          <div
            key={n.id}
            className="rounded-xl border border-ink-600 bg-ink-800 p-4 group animate-rise-in"
          >
            {editingId === n.id ? (
              <form onSubmit={(e) => submitEdit(e, n.id)}>
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-transparent text-parchment font-display text-lg outline-none mb-2"
                />
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  className="w-full bg-transparent text-parchment text-sm outline-none resize-none mb-3"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 rounded-lg text-parchment-dim text-sm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 rounded-lg bg-gold text-ink-900 text-sm font-medium disabled:opacity-50"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="font-display text-lg text-parchment">{n.title}</h3>
                  <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(n)}
                      className="text-xs text-parchment-dim hover:text-gold"
                    >
                      Ubah
                    </button>
                    <button
                      onClick={() => onDelete(n.id)}
                      className="text-xs text-parchment-dim hover:text-ember"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
                <p className="text-xs font-mono text-parchment-dim mb-2">{formatDate(n.updatedAt)}</p>
                {n.content && (
                  <p className="text-sm text-parchment/90 whitespace-pre-wrap leading-relaxed">
                    {n.content}
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
