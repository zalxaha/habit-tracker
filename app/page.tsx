"use client";

import { useEffect, useState, useCallback } from "react";
import type { StarlogData, Habit, NoteCategory } from "@/lib/github";
import HabitConstellation from "@/components/HabitConstellation";
import AddHabitModal, { HabitFormInput } from "@/components/AddHabitModal";
import NotesSection from "@/components/NotesSection";

type SyncState = "idle" | "loading" | "saving" | "saved" | "error";

export default function Home() {
  const [data, setData] = useState<StarlogData | null>(null);
  const [tab, setTab] = useState<"habits" | "notes">("habits");
  const [sync, setSync] = useState<SyncState>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showAddHabit, setShowAddHabit] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const load = useCallback(async () => {
    setSync("loading");
    try {
      const res = await fetch("/api/data");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memuat data.");
      setData(json);
      setSync("idle");
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message);
      setSync("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function flashSaved() {
    setSync("saved");
    setTimeout(() => setSync((s) => (s === "saved" ? "idle" : s)), 1500);
  }

  async function createHabit(input: HabitFormInput) {
    setSync("saving");
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.name,
          emoji: input.emoji,
          color: input.color,
          reminderTime: input.reminderTime || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data);
      setShowAddHabit(false);
      flashSaved();
    } catch (err: any) {
      setErrorMsg(err.message);
      setSync("error");
    }
  }

  async function editHabit(id: string, input: HabitFormInput) {
    setSync("saving");
    try {
      const res = await fetch("/api/habits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          action: "edit",
          name: input.name,
          emoji: input.emoji,
          color: input.color,
          reminderTime: input.reminderTime, // "" berarti hapus jam
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data);
      setEditingHabit(null);
      flashSaved();
    } catch (err: any) {
      setErrorMsg(err.message);
      setSync("error");
    }
  }

  async function toggleLog(habitId: string, date: string) {
    if (!data) return;
    // optimistic update
    const prev = data;
    const nowIso = new Date().toISOString();
    setData({
      ...data,
      habits: data.habits.map((h) => {
        if (h.id !== habitId) return h;
        const logs = { ...h.logs };
        if (logs[date]) delete logs[date];
        else logs[date] = nowIso;
        return { ...h, logs };
      }),
    });
    setSync("saving");
    try {
      const res = await fetch("/api/habits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: habitId, action: "toggle", date }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data);
      flashSaved();
    } catch (err: any) {
      setData(prev);
      setErrorMsg(err.message);
      setSync("error");
    }
  }

  async function deleteHabit(id: string) {
    if (!data) return;
    const prev = data;
    setData({ ...data, habits: data.habits.filter((h) => h.id !== id) });
    setSync("saving");
    try {
      const res = await fetch("/api/habits", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data);
      flashSaved();
    } catch (err: any) {
      setData(prev);
      setErrorMsg(err.message);
      setSync("error");
    }
  }

  async function createNote(title: string, content: string, category: NoteCategory) {
    setSync("saving");
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data);
      flashSaved();
    } catch (err: any) {
      setErrorMsg(err.message);
      setSync("error");
    }
  }

  async function updateNote(id: string, title: string, content: string, category: NoteCategory) {
    setSync("saving");
    try {
      const res = await fetch("/api/notes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, title, content, category }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data);
      flashSaved();
    } catch (err: any) {
      setErrorMsg(err.message);
      setSync("error");
    }
  }

  async function deleteNote(id: string) {
    if (!data) return;
    const prev = data;
    setData({ ...data, notes: data.notes.filter((n) => n.id !== id) });
    setSync("saving");
    try {
      const res = await fetch("/api/notes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data);
      flashSaved();
    } catch (err: any) {
      setData(prev);
      setErrorMsg(err.message);
      setSync("error");
    }
  }

  const activeHabits = data?.habits.filter((h) => !h.archived) ?? [];

  return (
    <main className="min-h-screen field-star-bg">
      <div className="max-w-xl mx-auto px-4 pt-10 pb-24">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-1">
            <h1 className="font-display italic text-3xl text-parchment tracking-tight">
              Starlog
            </h1>
            <SyncBadge state={sync} onRetry={load} />
          </div>
          <p className="text-parchment-dim text-sm">
            Setiap hari yang kamu selesaikan menjadi satu titik cahaya.
          </p>
        </header>

        <nav className="flex gap-1 mb-6 bg-ink-800 border border-ink-600 rounded-xl p-1 w-fit">
          {(["habits", "notes"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-gold text-ink-900" : "text-parchment-dim hover:text-parchment"
              }`}
            >
              {t === "habits" ? "Kebiasaan" : "Catatan"}
            </button>
          ))}
        </nav>

        {sync === "error" && errorMsg && (
          <div className="mb-6 rounded-xl border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-ember">
            <p className="font-medium mb-1">Ada yang tidak beres.</p>
            <p className="text-ember/90">{errorMsg}</p>
            {errorMsg.toLowerCase().includes("konfigurasi") && (
              <p className="mt-2 text-parchment-dim">
                Set <code className="font-mono">GITHUB_TOKEN</code>,{" "}
                <code className="font-mono">GITHUB_OWNER</code>, dan{" "}
                <code className="font-mono">GITHUB_REPO</code> di Environment Variables project
                Vercel-mu, lalu deploy ulang. Lihat README untuk langkah lengkap.
              </p>
            )}
            <button onClick={load} className="mt-2 text-gold underline text-sm">
              Coba lagi
            </button>
          </div>
        )}

        {sync === "loading" && !data && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-ink-800 animate-pulse" />
            ))}
          </div>
        )}

        {data && tab === "habits" && (
          <div className="space-y-5">
            {activeHabits.length === 0 && (
              <p className="text-parchment-dim text-sm text-center py-10">
                Belum ada kebiasaan yang dilacak. Mulai satu untuk melihat bintang pertamamu
                menyala.
              </p>
            )}
            {activeHabits.map((h) => (
              <div key={h.id} className="rounded-xl border border-ink-600 bg-ink-800/60 px-4 py-3">
                <HabitConstellation
                  habit={h}
                  onToggle={(date) => toggleLog(h.id, date)}
                  onEdit={() => setEditingHabit(h)}
                  onDelete={() => deleteHabit(h.id)}
                />
              </div>
            ))}

            <button
              onClick={() => setShowAddHabit(true)}
              className="w-full text-left px-4 py-3 rounded-xl border border-dashed border-ink-600 text-parchment-dim text-sm hover:border-gold/60 hover:text-parchment transition-colors"
            >
              + Tambah kebiasaan
            </button>
          </div>
        )}

        {data && tab === "notes" && (
          <NotesSection
            notes={data.notes}
            onCreate={createNote}
            onUpdate={updateNote}
            onDelete={deleteNote}
          />
        )}
      </div>

      {showAddHabit && (
        <AddHabitModal onClose={() => setShowAddHabit(false)} onSubmit={createHabit} />
      )}

      {editingHabit && (
        <AddHabitModal
          initial={editingHabit}
          onClose={() => setEditingHabit(null)}
          onSubmit={(input) => editHabit(editingHabit.id, input)}
        />
      )}
    </main>
  );
}

function SyncBadge({ state, onRetry }: { state: SyncState; onRetry: () => void }) {
  const map: Record<SyncState, { label: string; className: string }> = {
    idle: { label: "Tersimpan di GitHub", className: "text-parchment-dim" },
    loading: { label: "Memuat…", className: "text-parchment-dim" },
    saving: { label: "Menyimpan…", className: "text-gold" },
    saved: { label: "Tersimpan ✓", className: "text-sage" },
    error: { label: "Gagal sinkron", className: "text-ember" },
  };
  const { label, className } = map[state];
  return (
    <button
      onClick={state === "error" ? onRetry : undefined}
      className={`font-mono text-[10px] uppercase tracking-wider ${className}`}
    >
      {label}
    </button>
  );
}
