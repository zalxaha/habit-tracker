"use client";

import { useMemo, useState } from "react";
import type { Note, NoteCategory, NoteType, NoteTable } from "@/lib/github";
import { NOTE_CATEGORIES } from "@/lib/github";
import CategoryBadge, { CATEGORY_META } from "@/components/CategoryBadge";
import NoteTableEditor from "@/components/NoteTableEditor";
import NoteTableView from "@/components/NoteTableView";
import NoteFullView from "@/components/NoteFullView";

const DEFAULT_TABLE: NoteTable = {
  columns: ["Tanggal", "Keterangan", "Jumlah"],
  rows: [["", "", ""]],
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${datePart}, ${hh}.${mm}`;
}

function CategoryPicker({
  value,
  onChange,
}: {
  value: NoteCategory;
  onChange: (c: NoteCategory) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {NOTE_CATEGORIES.map((c) => {
        const meta = CATEGORY_META[c];
        const active = value === c;
        return (
          <button
            type="button"
            key={c}
            onClick={() => onChange(c)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${
              active ? "border-transparent text-ink-900" : "border-ink-600 text-parchment-dim"
            }`}
            style={active ? { backgroundColor: meta.swatch } : {}}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: active ? "#0B0D1D" : meta.swatch }}
            />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

function TypePicker({ value, onChange }: { value: NoteType; onChange: (t: NoteType) => void }) {
  return (
    <div className="flex gap-1.5 mb-3">
      {(["text", "table"] as const).map((t) => (
        <button
          type="button"
          key={t}
          onClick={() => onChange(t)}
          className={`px-3 py-1 rounded-full text-xs border transition-colors ${
            value === t ? "border-gold bg-gold text-ink-900" : "border-ink-600 text-parchment-dim"
          }`}
        >
          {t === "text" ? "Teks" : "Tabel"}
        </button>
      ))}
    </div>
  );
}

export default function NotesSection({
  notes,
  onCreate,
  onUpdate,
  onDelete,
}: {
  notes: Note[];
  onCreate: (
    title: string,
    content: string,
    category: NoteCategory,
    type: NoteType,
    table?: NoteTable
  ) => Promise<void>;
  onUpdate: (
    id: string,
    title: string,
    content: string,
    category: NoteCategory,
    type: NoteType,
    table?: NoteTable
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NoteCategory>("umum");
  const [noteType, setNoteType] = useState<NoteType>("text");
  const [table, setTable] = useState<NoteTable>(DEFAULT_TABLE);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState<NoteCategory>("umum");
  const [editType, setEditType] = useState<NoteType>("text");
  const [editTable, setEditTable] = useState<NoteTable>(DEFAULT_TABLE);

  const [filter, setFilter] = useState<"all" | NoteCategory>("all");
  const [fullViewNote, setFullViewNote] = useState<Note | null>(null);
  const [saving, setSaving] = useState(false);

  function resetCompose() {
    setTitle("");
    setContent("");
    setCategory("umum");
    setNoteType("text");
    setTable(DEFAULT_TABLE);
    setComposing(false);
  }

  async function submitNew(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    await onCreate(title, content, category, noteType, noteType === "table" ? table : undefined);
    resetCompose();
    setSaving(false);
  }

  function startEdit(n: Note) {
    setEditingId(n.id);
    setEditTitle(n.title);
    setEditContent(n.content);
    setEditCategory(n.category);
    setEditType(n.type);
    setEditTable(n.table ?? DEFAULT_TABLE);
    setFullViewNote(null);
  }

  async function submitEdit(e: React.FormEvent, id: string) {
    e.preventDefault();
    if (!editTitle.trim() || saving) return;
    setSaving(true);
    await onUpdate(
      id,
      editTitle,
      editContent,
      editCategory,
      editType,
      editType === "table" ? editTable : undefined
    );
    setEditingId(null);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setFullViewNote(null);
    await onDelete(id);
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: notes.length };
    for (const cat of NOTE_CATEGORIES) c[cat] = notes.filter((n) => n.category === cat).length;
    return c;
  }, [notes]);

  const filtered = filter === "all" ? notes : notes.filter((n) => n.category === filter);

  const groups: { category: NoteCategory; items: Note[] }[] =
    filter === "all"
      ? NOTE_CATEGORIES.map((c) => ({ category: c, items: notes.filter((n) => n.category === c) })).filter(
          (g) => g.items.length > 0
        )
      : [{ category: filter, items: filtered }];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter("all")}
          className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
            filter === "all" ? "border-gold text-parchment" : "border-ink-600 text-parchment-dim"
          }`}
        >
          Semua {counts.all > 0 && <span className="text-parchment-dim/60">({counts.all})</span>}
        </button>
        {NOTE_CATEGORIES.map((c) => {
          const meta = CATEGORY_META[c];
          const active = filter === c;
          return (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                active ? "border-transparent text-ink-900" : "border-ink-600 text-parchment-dim"
              }`}
              style={active ? { backgroundColor: meta.swatch } : {}}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: active ? "#0B0D1D" : meta.swatch }}
              />
              {meta.label}
              {counts[c] > 0 && <span className={active ? "" : "text-parchment-dim/60"}>({counts[c]})</span>}
            </button>
          );
        })}
      </div>

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
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <CategoryPicker value={category} onChange={setCategory} />
            <TypePicker value={noteType} onChange={setNoteType} />
          </div>
          {noteType === "table" ? (
            <NoteTableEditor value={table} onChange={setTable} />
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis sesuatu…"
              rows={4}
              className="w-full bg-transparent text-parchment text-sm placeholder:text-parchment-dim/60 outline-none resize-none mb-3"
            />
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={resetCompose} className="px-3 py-1.5 rounded-lg text-parchment-dim text-sm">
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

      {notes.length > 0 && filtered.length === 0 && (
        <p className="text-parchment-dim text-sm text-center py-8">
          Belum ada catatan di kategori ini.
        </p>
      )}

      <div className="space-y-5">
        {groups.map((group) => {
          const meta = CATEGORY_META[group.category];
          return (
            <div key={group.category}>
              {filter === "all" && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.swatch }} />
                  <span className={`text-xs font-medium uppercase tracking-wider ${meta.text}`}>
                    {meta.label}
                  </span>
                  <span className="flex-1 h-px bg-ink-600" />
                </div>
              )}
              <div className="space-y-3">
                {group.items.map((n) => (
                  <div
                    key={n.id}
                    className="rounded-xl border border-ink-600 bg-ink-800 p-4 group animate-rise-in border-l-2"
                    style={{ borderLeftColor: meta.swatch }}
                  >
                    {editingId === n.id ? (
                      <form onSubmit={(e) => submitEdit(e, n.id)}>
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-transparent text-parchment font-display text-lg outline-none mb-2"
                        />
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <CategoryPicker value={editCategory} onChange={setEditCategory} />
                          <TypePicker value={editType} onChange={setEditType} />
                        </div>
                        {editType === "table" ? (
                          <NoteTableEditor value={editTable} onChange={setEditTable} />
                        ) : (
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={4}
                            className="w-full bg-transparent text-parchment text-sm outline-none resize-none mb-3"
                          />
                        )}
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
                          <h3 className="font-display text-lg text-parchment break-words">{n.title}</h3>
                          <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => startEdit(n)}
                              className="text-xs text-parchment-dim hover:text-gold"
                            >
                              Ubah
                            </button>
                            <button
                              onClick={() => handleDelete(n.id)}
                              className="text-xs text-parchment-dim hover:text-ember"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <CategoryBadge category={n.category} />
                          <span className="text-parchment-dim/40">·</span>
                          <p className="text-[11px] font-mono text-parchment-dim">
                            {formatDate(n.updatedAt)}
                          </p>
                        </div>

                        {n.type === "table" && n.table ? (
                          <div className="mb-2">
                            <NoteTableView
                              table={{
                                columns: n.table.columns,
                                rows: n.table.rows.slice(0, 3),
                              }}
                            />
                            {n.table.rows.length > 3 && (
                              <p className="text-[11px] text-parchment-dim mt-1">
                                +{n.table.rows.length - 3} baris lagi
                              </p>
                            )}
                          </div>
                        ) : (
                          n.content && (
                            <p className="text-sm text-parchment/90 whitespace-pre-wrap leading-relaxed line-clamp-4 mb-2">
                              {n.content}
                            </p>
                          )
                        )}

                        <button
                          onClick={() => setFullViewNote(n)}
                          className="text-xs text-gold hover:underline"
                        >
                          Lihat penuh
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {fullViewNote && (
        <NoteFullView
          note={fullViewNote}
          onClose={() => setFullViewNote(null)}
          onEdit={() => startEdit(fullViewNote)}
          onDelete={() => handleDelete(fullViewNote.id)}
        />
      )}
    </div>
  );
}
