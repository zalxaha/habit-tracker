"use client";

import type { Habit } from "@/lib/github";

const COLOR_MAP: Record<Habit["color"], { fill: string; glow: string; dim: string }> = {
  gold: { fill: "#F2C879", glow: "rgba(242,200,121,0.55)", dim: "#4A4530" },
  ember: { fill: "#F0876A", glow: "rgba(240,135,106,0.55)", dim: "#4A362E" },
  sage: { fill: "#8FCB9B", glow: "rgba(143,203,155,0.5)", dim: "#33452F" },
};

function toKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Deterministic pseudo-random jitter so stars don't move between renders.
function jitter(seed: string, range: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const normalized = (Math.abs(hash) % 1000) / 1000; // 0..1
  return (normalized - 0.5) * range;
}

function computeStreak(logs: Record<string, string>) {
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!logs[toKey(cursor)]) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (logs[toKey(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function formatSavedAt(iso: string) {
  const d = new Date(iso);
  const datePart = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${datePart}, ${hh}.${mm}`;
}

function lastLoggedEntry(logs: Record<string, string>) {
  const keys = Object.keys(logs).sort();
  if (keys.length === 0) return null;
  const lastKey = keys[keys.length - 1];
  return { date: lastKey, at: logs[lastKey] };
}

export default function HabitConstellation({
  habit,
  days = 14,
  onToggle,
  onEdit,
  onDelete,
}: {
  habit: Habit;
  days?: number;
  onToggle: (date: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const colors = COLOR_MAP[habit.color] || COLOR_MAP.gold;
  const streak = computeStreak(habit.logs);
  const total = Object.keys(habit.logs).length;
  const lastEntry = lastLoggedEntry(habit.logs);

  const todayKey = toKey(new Date());
  const doneToday = !!habit.logs[todayKey];

  const dates: Date[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    dates.push(d);
  }

  const width = 560;
  const height = 64;
  const marginX = 24;
  const spacing = (width - marginX * 2) / (days - 1);
  const baseY = height / 2;

  const points = dates.map((d, i) => {
    const key = toKey(d);
    const x = marginX + i * spacing;
    const y = baseY + jitter(key + habit.id, 22);
    return { key, x, y, done: !!habit.logs[key], date: d };
  });

  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    if (points[i].done && points[i + 1].done) {
      segments.push({ x1: points[i].x, y1: points[i].y, x2: points[i + 1].x, y2: points[i + 1].y });
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onToggle(todayKey)}
            aria-pressed={doneToday}
            aria-label={doneToday ? "Batalkan tanda hari ini" : "Tandai selesai hari ini, menambah hari"}
            className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all active:scale-95"
            style={{
              borderColor: doneToday ? colors.fill : "#3a3f66",
              backgroundColor: doneToday ? colors.fill : "transparent",
              boxShadow: doneToday ? `0 0 14px ${colors.glow}` : "none",
            }}
          >
            {doneToday ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 12.5L9.5 18L20 6"
                  stroke="#0B0D1D"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <span className="text-lg leading-none opacity-70">{habit.emoji}</span>
            )}
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base leading-none">{habit.emoji}</span>
              <span className="font-display text-parchment text-[15px] truncate">{habit.name}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[11px] text-parchment-dim">
              {habit.reminderTime && (
                <span className="inline-flex items-center gap-1">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={2} />
                    <path d="M12 7V12L15.5 14" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                  </svg>
                  {habit.reminderTime}
                </span>
              )}
              {lastEntry && (
                <span>
                  {habit.reminderTime && "· "}
                  Dicatat {formatSavedAt(lastEntry.at)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="text-[11px] text-parchment-dim hover:text-gold">
              ubah
            </button>
            <button onClick={onDelete} className="text-[11px] text-parchment-dim hover:text-ember">
              hapus
            </button>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span style={{ color: colors.fill }}>{streak}</span>
            <span className="text-parchment-dim/60 uppercase tracking-wider text-[10px]">beruntun</span>
            <span className="text-parchment-dim/40">·</span>
            <span className="text-parchment-dim">{total}</span>
            <span className="text-parchment-dim/60 uppercase tracking-wider text-[10px]">total</span>
          </div>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-14 overflow-visible"
        role="img"
        aria-label={`Riwayat ${days} hari terakhir untuk ${habit.name}, streak ${streak} hari`}
      >
        {segments.map((s, i) => (
          <line
            key={i}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke={colors.fill}
            strokeWidth={1.25}
            strokeOpacity={0.55}
          />
        ))}
        {points.map((p) => {
          const isToday = p.key === todayKey;
          return (
            <g
              key={p.key}
              onClick={() => onToggle(p.key)}
              className="cursor-pointer"
              style={{ pointerEvents: "auto" }}
            >
              <circle cx={p.x} cy={p.y} r={12} fill="transparent" />
              {p.done && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isToday ? 8 : 6.5}
                  fill={colors.glow}
                  opacity={0.5}
                  className={isToday ? "animate-twinkle" : ""}
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={p.done ? (isToday ? 4.5 : 3.6) : 2.4}
                fill={p.done ? colors.fill : "none"}
                stroke={p.done ? "none" : colors.dim}
                strokeWidth={1}
              />
              {isToday && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={9.5}
                  fill="none"
                  stroke={colors.fill}
                  strokeOpacity={0.6}
                  strokeWidth={1}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
