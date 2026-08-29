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

function computeStreak(logs: Record<string, boolean>) {
  let streak = 0;
  const cursor = new Date();
  // if today isn't logged yet, still count backwards from yesterday
  if (!logs[toKey(cursor)]) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (logs[toKey(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function HabitConstellation({
  habit,
  days = 14,
  onToggle,
}: {
  habit: Habit;
  days?: number;
  onToggle: (date: string) => void;
}) {
  const colors = COLOR_MAP[habit.color] || COLOR_MAP.gold;
  const streak = computeStreak(habit.logs);

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

  const todayKey = toKey(new Date());

  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    if (points[i].done && points[i + 1].done) {
      segments.push({ x1: points[i].x, y1: points[i].y, x2: points[i + 1].x, y2: points[i + 1].y });
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg leading-none">{habit.emoji}</span>
          <span className="font-display text-parchment text-[15px] truncate">{habit.name}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 pl-2">
          <span className="font-mono text-xs" style={{ color: colors.fill }}>
            {streak}
          </span>
          <span className="text-[10px] text-parchment-dim uppercase tracking-wider">hari</span>
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
