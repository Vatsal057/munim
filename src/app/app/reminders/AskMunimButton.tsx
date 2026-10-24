"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AskMunimButton() {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function run() {
    setBusy(true);
    await fetch("/api/agent/run", { method: "POST" });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={run}
      disabled={busy}
      className="bg-gray-200 rounded-lg py-3 text-sm font-semibold disabled:opacity-50"
    >
      {busy ? "Thinking…" : "Ask munim"}
    </button>
  );
}
