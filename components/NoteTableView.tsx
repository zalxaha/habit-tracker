"use client";

import type { NoteTable } from "@/lib/github";

export default function NoteTableView({ table }: { table: NoteTable }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-ink-600">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {table.columns.map((col, i) => (
              <th
                key={i}
                className="text-left px-3 py-2 border-b border-ink-600 bg-ink-700 text-parchment-dim text-xs font-medium uppercase tracking-wide whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={r} className="border-b border-ink-600/50 last:border-b-0 odd:bg-ink-700/20">
              {row.map((cell, c) => (
                <td key={c} className="px-3 py-2 text-parchment/90 whitespace-pre-wrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
