import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Scissors, ShoppingBasket, Sparkles, Apple, UtensilsCrossed } from "lucide-react";
import { postJSON } from "@/lib/api";
import { Notice, Page, PageTitle, Spinner, TopBar } from "@/components/munim/ui";

const PERSONAS = [
  { slug: "ramesh", title: "Ramesh", subtitle: "Kirana store · 12 customers, supplier due Friday", icon: ShoppingBasket },
  { slug: "sunita", title: "Sunita", subtitle: "Tiffin service · monthly dues, Hindi", icon: UtensilsCrossed },
  { slug: "meena", title: "Meena", subtitle: "Side hustle · custom orders with advances", icon: Sparkles },
  { slug: "anwar", title: "Anwar", subtitle: "Tailor · small sample, Hindi", icon: Scissors },
  { slug: "suresh", title: "Suresh", subtitle: "Fruit cart · small sample, Kannada", icon: Apple },
];

export default function Demo() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadPersona(slug: string) {
    setLoading(slug);
    setError(null);
    try {
      const res = await postJSON(`demo/${slug}`);
      setLoading(null);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(typeof data?.error === "string" ? data.error : "Demo data isn't seeded yet. Run the seed script first.");
        return;
      }
      qc.removeQueries({ queryKey: ["view"] });
      navigate("/app");
    } catch {
      setLoading(null);
      setError("Couldn't reach Munim. Check your connection and try again.");
    }
  }

  return (
    <Page>
      <TopBar back="/" backLabel="Back" />
      <PageTitle eyebrow="Sample data" title="Try a demo shop" sub="Pick a persona to explore Munim. Nothing you do here touches real money." />
      {error && <Notice>{error}</Notice>}
      <ul className="flex flex-col gap-3">
        {PERSONAS.map((p, i) => (
          <li key={p.slug} className="rise" style={{ animationDelay: `${i * 55}ms` }}>
            <button
              onClick={() => loadPersona(p.slug)}
              disabled={loading !== null}
              data-testid={`button-persona-${p.slug}`}
              className="group flex min-h-20 w-full items-center gap-4 rounded-3xl border border-card-border bg-card p-4 text-left shadow-xs transition-[transform,opacity] active:scale-[0.99] disabled:opacity-60"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-haldi-soft text-[hsl(28_60%_22%)] transition-colors group-hover:bg-ink group-hover:text-haldi">
                <p.icon className="h-6 w-6" />
              </span>
              <span className="flex-1">
                <span className="block font-display text-xl font-semibold text-ink">{p.title}</span>
                <span className="block text-sm leading-snug text-muted-foreground">{p.subtitle}</span>
              </span>
              {loading === p.slug ? <Spinner className="h-5 w-5 text-ink" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
            </button>
          </li>
        ))}
      </ul>
    </Page>
  );
}
