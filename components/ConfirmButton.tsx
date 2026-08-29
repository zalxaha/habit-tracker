"use client";

import { useEffect, useRef, useState } from "react";

export default function ConfirmButton({
  label = "hapus",
  className = "text-parchment-dim hover:text-ember",
  onConfirm,
}: {
  label?: string;
  className?: string;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!confirming) return;
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setConfirming(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [confirming]);

  if (confirming) {
    return (
      <span ref={wrapRef} className="inline-flex items-center gap-1.5 whitespace-nowrap">
        <span className="text-ember">Yakin?</span>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            onConfirm();
          }}
          className="text-ember font-semibold hover:underline"
        >
          Ya, hapus
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-parchment-dim hover:text-parchment"
        >
          Batal
        </button>
      </span>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} className={className}>
      {label}
    </button>
  );
}
