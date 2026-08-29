"use client";

import type { Note } from "@/lib/github";
import CategoryBadge from "@/components/CategoryBadge";
import NoteTableView from "@/components/NoteTableView";
import ConfirmButton from "@/components/ConfirmButton";

function formatDate(iso: string) {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${datePart}, ${hh}.${mm}`;
}

export default function NoteFullView({
  note,
  onClose,
  onEdit,
  onDelete,
}: {
  note: Note;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-ink-900 field-star-bg flex flex-col animate-rise-in">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-ink-600 shrink-0">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-parchment-dim hover:text-parchment text-sm"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Tutup
        </button>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <button onClick={onEdit} className="text-sm text-parchment-dim hover:text-gold">
            Ubah
          </button>
          <ConfirmButton
            label="Hapus"
            className="text-sm text-parchment-dim hover:text-ember"
            onConfirm={onDelete}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-xl w-full mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <CategoryBadge category={note.category} />
        </div>
        <h1 className="font-display text-2xl text-parchment mb-2 break-words">{note.title}</h1>
        <p className="text-[11px] font-mono text-parchment-dim mb-6">
          Dibuat {formatDate(note.createdAt)}
          {note.updatedAt !== note.createdAt && <> · Diubah {formatDate(note.updatedAt)}</>}
        </p>

        {note.type === "table" && note.table ? (
          <NoteTableView table={note.table} />
        ) : (
          <p className="text-[15px] text-parchment/90 whitespace-pre-wrap leading-relaxed">
            {note.content || <span className="text-parchment-dim">Catatan ini belum ada isinya.</span>}
          </p>
        )}
      </div>
    </div>
  );
}
