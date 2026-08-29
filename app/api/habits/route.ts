import { NextResponse } from "next/server";
import { writeData, Habit } from "@/lib/github";

export const dynamic = "force-dynamic";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function newId() {
  return `hb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSchedule(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const days = value
    .filter((v) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 6)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .sort((a, b) => a - b);
  return days.length > 0 ? days : undefined;
}

function normalizeTarget(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const n = Math.floor(value);
  return n > 0 ? n : undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, emoji, color, reminderTime, schedule, targetCount } = body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Nama kebiasaan wajib diisi." }, { status: 400 });
    }

    const habit: Habit = {
      id: newId(),
      name: name.trim(),
      emoji: emoji || "✦",
      color: ["gold", "ember", "sage"].includes(color) ? color : "gold",
      createdAt: new Date().toISOString(),
      reminderTime: typeof reminderTime === "string" && TIME_RE.test(reminderTime) ? reminderTime : undefined,
      schedule: normalizeSchedule(schedule),
      targetCount: normalizeTarget(targetCount),
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
          else logs[date] = new Date().toISOString();
          return { ...h, logs };
        }

        if (action === "edit") {
          const nextReminder =
            "reminderTime" in body
              ? typeof body.reminderTime === "string" && TIME_RE.test(body.reminderTime)
                ? body.reminderTime
                : undefined
              : h.reminderTime;

          const nextSchedule = "schedule" in body ? normalizeSchedule(body.schedule) : h.schedule;
          const nextTarget = "targetCount" in body ? normalizeTarget(body.targetCount) : h.targetCount;

          return {
            ...h,
            name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : h.name,
            emoji: typeof body.emoji === "string" && body.emoji ? body.emoji : h.emoji,
            color: ["gold", "ember", "sage"].includes(body.color) ? body.color : h.color,
            reminderTime: nextReminder,
            schedule: nextSchedule,
            targetCount: nextTarget,
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
