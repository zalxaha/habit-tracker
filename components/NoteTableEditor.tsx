"use client";

import type { NoteTable } from "@/lib/github";

export default function NoteTableEditor({
  value,
  onChange,
}: {
  value: NoteTable;
  onChange: (v: NoteTable) => void;
}) {
  function updateColumn(i: number, text: string) {
    const columns = [...value.columns];
    columns[i] = text;
    onChange({ ...value, columns });
  }

  function addColumn() {
    if (value.columns.length >= 12) return;
    const columns = [...value.columns, `Kolom ${value.columns.length + 1}`];
    const rows = value.rows.map((r) => [...r, ""]);
    onChange({ columns, rows });
  }

  function removeColumn(i: number) {
    if (value.columns.length <= 1) return;
    const columns = value.columns.filter((_, idx) => idx !== i);
    const rows = value.rows.map((r) => r.filter((_, idx) => idx !== i));
    onChange({ columns, rows });
  }

  function updateCell(r: number, c: number, text: string) {
    const rows = value.rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? text : cell)) : row));
    onChange({ ...value, rows });
  }

  function addRow() {
    if (value.rows.length >= 500) return;
    onChange({ ...value, rows: [...value.rows, value.columns.map(() => "")] });
  }

  function removeRow(r: number) {
    if (value.rows.length <= 1) return;
    onChange({ ...value, rows: value.rows.filter((_, idx) => idx !== r) });
  }

  return (
    <div className="mb-3">
      <div className="overflow-x-auto rounded-lg border border-ink-600">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {value.columns.map((col, i) => (
                <th key={i} className="p-0 border-b border-ink-600 bg-ink-700">
                  <div className="flex items-center gap-1 px-2 py-1.5">
                    <input
                      value={col}
                      onChange={(e) => updateColumn(i, e.target.value)}
                      className="w-full min-w-[80px] bg-transparent text-parchment text-xs font-medium uppercase tracking-wide outline-none"
                    />
                    {value.columns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColumn(i)}
                        className="text-parchment-dim/50 hover:text-ember text-xs shrink-0"
                        title="Hapus kolom"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="p-1 border-b border-ink-600 bg-ink-700 w-8">
                <button
                  type="button"
                  onClick={addColumn}
                  className="text-parchment-dim hover:text-gold text-xs w-full"
                  title="Tambah kolom"
                >
                  +
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {value.rows.map((row, r) => (
              <tr key={r} className="border-b border-ink-600/60 last:border-b-0">
                {row.map((cell, c) => (
                  <td key={c} className="p-0">
                    <input
                      value={cell}
                      onChange={(e) => updateCell(r, c, e.target.value)}
                      className="w-full min-w-[80px] bg-transparent text-parchment text-sm px-2 py-1.5 outline-none focus:bg-ink-700"
                    />
                  </td>
                ))}
                <td className="p-1 text-center">
                  {value.rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(r)}
                      className="text-parchment-dim/50 hover:text-ember text-xs"
                      title="Hapus baris"
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-2 text-xs text-parchment-dim hover:text-gold"
      >
        + Tambah baris
      </button>
    </div>
  );
}
