"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PERSONAS = [
  { slug: "ramesh", title: "Ramesh", subtitle: "Kirana store · 12 customers, supplier due Friday" },
  { slug: "sunita", title: "Sunita", subtitle: "Tiffin service · monthly dues, Hindi" },
  { slug: "meena", title: "Meena", subtitle: "Side hustle · custom orders with advances" },
  { slug: "anwar", title: "Anwar", subtitle: "Tailor · small sample, Hindi" },
  { slug: "suresh", title: "Suresh", subtitle: "Fruit cart · small sample, Kannada" },
];

export default function DemoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadPersona(slug: string) {
    setLoading(slug);
    setError(null);
    const res = await fetch(`/api/demo/${slug}`, { method: "POST" });
    setLoading(null);
    if (!res.ok) {
      setError("Demo data isn't seeded yet. Run `npm run seed` first.");
      return;
    }
    router.push("/app");
  }

  return (
    <div className="min-h-screen max-w-sm mx-auto p-6 flex flex-col gap-5">
      <h1 className="text-xl font-bold text-center">Try a demo shop</h1>
      <p className="text-sm text-gray-500 text-center">Sample data — pick a persona to explore munim.</p>

      {error && <p className="text-red-600 text-sm text-center">{error}</p>}

      <ul className="flex flex-col gap-3">
        {PERSONAS.map((p) => (
          <li key={p.slug}>
            <button
              onClick={() => loadPersona(p.slug)}
              disabled={loading !== null}
              className="w-full text-left border rounded-xl p-4 disabled:opacity-50"
            >
              <p className="font-semibold">{p.title}</p>
              <p className="text-xs text-gray-500">{p.subtitle}</p>
              {loading === p.slug && <p className="text-xs text-gray-400 mt-1">Loading…</p>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
