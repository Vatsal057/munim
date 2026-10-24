"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AskMunimButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function run() {
    setBusy(true);
    try {
      await fetch("/api/agent/run", { method: "POST" });
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  return (
    <button
      onClick={run}
      disabled={busy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold shadow-xs hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50"
    >
      <span className="text-amber-400">{busy ? "⚡" : "✨"}</span>
      <span>{busy ? "Munim Drafting…" : "Run Agent"}</span>
    </button>
  );
}

