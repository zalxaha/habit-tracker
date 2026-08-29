import { NextResponse } from "next/server";
import { writeData, Note, NOTE_CATEGORIES, NoteCategory } from "@/lib/github";

export const dynamic = "force-dynamic";

function newId() {
  return `nt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCategory(value: unknown): NoteCategory | null {
  return typeof value === "string" && NOTE_CATEGORIES.includes(value as NoteCategory)
    ? (value as NoteCategory)
    : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, content, category } = body;
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Judul catatan wajib diisi." }, { status: 400 });
    }

    const now = new Date().toISOString();
    const note: Note = {
      id: newId(),
      title: title.trim(),
      content: typeof content === "string" ? content : "",
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
    const { id, title, content, category } = body;
    if (!id) {
      return NextResponse.json({ error: "id wajib diisi." }, { status: 400 });
    }

    const data = await writeData((current) => ({
      ...current,
      notes: current.notes.map((n) =>
        n.id === id
          ? {
              ...n,
              title: typeof title === "string" && title.trim() ? title.trim() : n.title,
              content: typeof content === "string" ? content : n.content,
              category: normalizeCategory(category) || n.category,
              updatedAt: new Date().toISOString(),
            }
          : n
      ),
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
