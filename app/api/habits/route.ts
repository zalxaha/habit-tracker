import { NextResponse } from "next/server";
import { writeData, Habit } from "@/lib/github";

export const dynamic = "force-dynamic";

function newId() {
  return `hb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, emoji, color } = body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nama kebiasaan wajib diisi." }, { status: 400 });
    }

    const habit: Habit = {
      id: newId(),
      name: name.trim(),
      emoji: emoji || "✦",
      color: ["gold", "ember", "sage"].includes(color) ? color : "gold",
      createdAt: new Date().toISOString(),
      logs: {},
    };

    const data = await writeData((current) => ({
      ...current,
      habits: [...current.habits, habit],
    }));

    return NextResponse.json({ habit, data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Gagal membuat kebiasaan." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, action } = body;
    if (!id || !action) {
      return NextResponse.json({ error: "id dan action wajib diisi." }, { status: 400 });
    }

    const data = await writeData((current) => {
      const habits = current.habits.map((h) => {
        if (h.id !== id) return h;

        if (action === "toggle") {
          const date: string = body.date;
          const logs = { ...h.logs };
          if (logs[date]) delete logs[date];
          else logs[date] = true;
          return { ...h, logs };
        }

        if (action === "edit") {
          return {
            ...h,
            name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : h.name,
            emoji: typeof body.emoji === "string" && body.emoji ? body.emoji : h.emoji,
            color: ["gold", "ember", "sage"].includes(body.color) ? body.color : h.color,
          };
        }

        if (action === "archive") {
          return { ...h, archived: !h.archived };
        }

        return h;
      });

      return { ...current, habits };
    });

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Gagal memperbarui kebiasaan." }, { status: 500 });
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
      habits: current.habits.filter((h) => h.id !== id),
    }));

    return NextResponse.json({ data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Gagal menghapus kebiasaan." }, { status: 500 });
  }
}
