import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { postJSON } from "@/lib/api";
import { Button, Logo, Notice, Page, Spinner, TopBar } from "@/components/munim/ui";
import { cn } from "@/lib/utils";

const BUSINESS_TYPES = [
  { value: "kirana", label: "Kirana shop" },
  { value: "tiffin", label: "Tiffin service" },
  { value: "tailor", label: "Tailor" },
  { value: "cart", label: "Cart / vendor" },
  { value: "side_hustle", label: "Side hustle" },
  { value: "personal", label: "Personal" },
];
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "kn", label: "ಕನ್ನಡ" },
  { value: "hi", label: "हिन्दी" },
];

const inputCls =
  "min-h-13 w-full rounded-2xl border border-input bg-card px-4 py-3 text-[17px] text-ink placeholder:text-muted-foreground/60 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15";

function Chip({ active, onClick, children, testId }: { active: boolean; onClick: () => void; children: ReactNode; testId: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      aria-pressed={active}
      className={cn(
        "min-h-12 rounded-2xl border px-3 text-[15px] font-semibold transition-colors",
        active ? "border-ink bg-ink text-background" : "border-input bg-card text-ink hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}

export default function Signup() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("kirana");
  const [language, setLanguage] = useState("en");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await postJSON("signup", {
        name,
        phone,
        business_name: businessName,
        business_type: businessType,
        language,
      });
      setLoading(false);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error?.fieldErrors?.phone?.[0] ?? "Something went wrong. Try again.");
        return;
      }
      qc.removeQueries({ queryKey: ["view"] });
      navigate("/app");
    } catch {
      setLoading(false);
      setError("Something went wrong. Try again.");
    }
  }

  return (
    <Page>
      <TopBar back="/" backLabel="Back" />
      <div className="rise flex flex-col items-start gap-3">
        <Logo size="lg" />
        <h1 className="font-display text-[2rem] font-semibold leading-tight text-ink">Let's set you up</h1>
        <p className="text-[15px] text-muted-foreground">One minute. Your khata stays yours.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Your name</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ramesh Kumar" data-testid="input-name" autoComplete="name" />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Phone number</span>
          <div className="relative">
            <span className="font-num pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[17px] text-muted-foreground">+91</span>
            <input
              required
              inputMode="numeric"
              pattern="\d{10}"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className={cn(inputCls, "font-num pl-14 tracking-wider")}
              placeholder="9876543210"
              data-testid="input-phone"
              autoComplete="tel-national"
            />
          </div>
          <span className="text-xs text-muted-foreground">{phone.length}/10 digits</span>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">Shop / business name</span>
          <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputCls} placeholder="Ramesh Kirana Store" data-testid="input-business-name" />
        </label>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-semibold text-ink">Business type</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {BUSINESS_TYPES.map((t) => (
              <Chip key={t.value} active={businessType === t.value} onClick={() => setBusinessType(t.value)} testId={`button-type-${t.value}`}>
                {t.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-semibold text-ink">Language</legend>
          <div className="grid grid-cols-3 gap-2">
            {LANGUAGES.map((l) => (
              <Chip key={l.value} active={language === l.value} onClick={() => setLanguage(l.value)} testId={`button-lang-${l.value}`}>
                {l.label}
              </Chip>
            ))}
          </div>
        </fieldset>

        {error && <Notice>{error}</Notice>}

        <Button type="submit" size="lg" disabled={loading} data-testid="button-submit">
          {loading ? (
            <>
              <Spinner /> Setting up…
            </>
          ) : (
            <>
              Start free <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Just looking?{" "}
          <Link href="/demo" className="font-semibold text-ink underline underline-offset-4">
            Try a demo shop
          </Link>
        </p>
      </form>
    </Page>
  );
}
