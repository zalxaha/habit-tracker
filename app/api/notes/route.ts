import { NextResponse } from "next/server";
import { writeData, Note, NoteTable, NOTE_CATEGORIES, NoteCategory } from "@/lib/github";

export const dynamic = "force-dynamic";

const MAX_COLS = 12;
const MAX_ROWS = 500;
const MAX_CELL_LEN = 500;

function newId() {
  return `nt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCategory(value: unknown): NoteCategory | null {
  return typeof value === "string" && NOTE_CATEGORIES.includes(value as NoteCategory)
    ? (value as NoteCategory)
    : null;
}

function clampCell(v: unknown): string {
  const s = typeof v === "string" ? v : "";
  return s.length > MAX_CELL_LEN ? s.slice(0, MAX_CELL_LEN) : s;
}

function normalizeTable(value: unknown): NoteTable {
  const fallback: NoteTable = { columns: ["Kolom 1"], rows: [[""]] };
  if (!value || typeof value !== "object") return fallback;
  const v = value as any;

  let columns: string[] = Array.isArray(v.columns) ? v.columns.map(clampCell) : [];
  columns = columns.slice(0, MAX_COLS);
  if (columns.length === 0) columns = ["Kolom 1"];
  columns = columns.map((c, i) => (c.trim() ? c : `Kolom ${i + 1}`));

  let rows: string[][] = Array.isArray(v.rows) ? v.rows : [];
  rows = rows.slice(0, MAX_ROWS).map((row: unknown) => {
    const arr = Array.isArray(row) ? row.map(clampCell) : [];
    const padded = [...arr];
    while (padded.length < columns.length) padded.push("");
    return padded.slice(0, columns.length);
  });
  if (rows.length === 0) rows = [columns.map(() => "")];

  return { columns, rows };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, content, category, type, table } = body;
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Judul catatan wajib diisi." }, { status: 400 });
    }

    const noteType = type === "table" ? "table" : "text";
    const now = new Date().toISOString();
    const note: Note = {
      id: newId(),
      title: title.trim(),
      type: noteType,
      content: noteType === "text" && typeof content === "string" ? content : "",
      table: noteType === "table" ? normalizeTable(table) : undefined,
      category: normalizeCategory(category) || "umum",
      createdAt: now,
      updatedAt: now,
    };

    const data = await writeData((current) => ({
      ...current,
      notes: [note, ...current.notes],
    }));

    return NextResponse.json({ note, data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Gagal membuat catatan." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, title, content, category, type, table } = body;
    if (!id) {
      return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
    }

    const data = await writeData((current) => ({
      ...current,
      notes: current.notes.map((n) => {
        if (n.id !== id) return n;

        const nextType = type === "table" || type === "text" ? type : n.type;

        return {
          ...n,
          title: typeof title === "string" && title.trim() ? title.trim() : n.title,
          category: normalizeCategory(category) || n.category,
          type: nextType,
          content: nextType === "text" ? (typeof content === "string" ? content : n.content) : "",
          table: nextType === "table" ? normalizeTable(table ?? n.table) : undefined,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Gagal memperbarui catatan." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
    }

    const data = await writeData((current) => ({
      ...current,
      notes: current.notes.filter((n) => n.id !== id),
    }));

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Gagal menghapus catatan." }, { status: 500 });
  }
}
