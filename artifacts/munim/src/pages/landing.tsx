import { Link } from "wouter";
import { ArrowRight, BellRing, Camera, Check, Mic, QrCode, Sun, Store } from "lucide-react";
import { Wordmark } from "@/components/munim/ui";

const STEPS = [
  {
    icon: Mic,
    title: "Tell (show or speak)",
    body: "Snap a khata notebook page, upload a supplier bill, or speak in Kannada, Hindi, or English. Zero typing.",
  },
  {
    icon: Sun,
    title: "Today (one clear answer)",
    body: "No complex reports or ledger math. One simple morning card tells you who owes what and who is due to pay.",
  },
  {
    icon: QrCode,
    title: "Get paid (one-tap WhatsApp)",
    body: "Pre-drafted polite reminders carry a payment link and UPI QR. Customer pays from home, due clears instantly.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-[100dvh] overflow-x-hidden pb-12">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
        <Wordmark />
        <Link
          href="/demo"
          data-testid="link-demo-nav"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-haldi/50 bg-haldi-soft px-4 text-sm font-semibold text-[hsl(28_60%_20%)] transition-colors hover:bg-haldi/40"
        >
          Try 5 demo shops <ArrowRight className="h-4 w-4" />
        </Link>
      </nav>

      <main className="mx-auto grid w-full max-w-5xl gap-10 px-5 pt-6 md:grid-cols-[1.1fr_1fr] md:items-center md:pt-14">
        <section className="flex flex-col gap-6">
          <span className="rise inline-flex w-fit items-center gap-2 rounded-full bg-ink px-3.5 py-1.5 text-xs font-semibold tracking-wide text-background">
            <span className="h-2 w-2 rounded-full bg-haldi" /> Simple as UPI, for your business
          </span>
          <h1 className="rise font-display text-[2.75rem] font-semibold leading-[1.02] tracking-tight text-ink sm:text-6xl" style={{ animationDelay: "60ms" }}>
            Your munim,
            <br />
            <em className="font-medium text-[hsl(28_70%_38%)]">on your phone.</em>
          </h1>
          <p className="rise max-w-md text-lg leading-relaxed text-muted-foreground" style={{ animationDelay: "120ms" }}>
            Tell it what happened. It tells you what to do.{" "}
            <strong className="font-semibold text-ink">Get paid before you have to pay.</strong>
          </p>
          <div className="rise flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "180ms" }}>
            <Link
              href="/signup"
              data-testid="link-signup"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-ink px-7 text-[17px] font-semibold text-background shadow-lg transition-transform active:scale-[0.98]"
            >
              <Store className="h-5 w-5" /> Start free for your shop
            </Link>
            <Link
              href="/demo"
              data-testid="link-demo"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-input bg-card px-6 text-[15px] font-semibold text-ink transition-colors hover:bg-secondary"
            >
              Explore sample businesses
            </Link>
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check className="h-4 w-4 text-owed" /> No credit card required · Works on any phone
          </p>
        </section>

        {/* Briefing preview: a page from the bahi */}
        <section className="rise relative" style={{ animationDelay: "240ms" }}>
          <div className="absolute -inset-4 -z-10 rotate-2 rounded-[2rem] bg-haldi-soft/70" />
          <div className="margin-rule ledger-lines relative overflow-hidden rounded-[1.75rem] border border-card-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                <Sun className="h-4 w-4 text-haldi" /> Today's briefing
              </span>
              <span className="rounded-full bg-owe-soft px-2.5 py-1 text-xs font-bold text-owe">₹2,500 short</span>
            </div>
            <p className="mt-5 font-display text-[1.35rem] leading-snug text-ink">
              You owe Shree Wholesale <strong className="font-semibold">₹8,000 on Friday</strong>. You'll likely collect{" "}
              <strong className="font-semibold text-owed">₹5,500</strong> by then.
            </p>
            <p className="mt-3 text-[15px] text-muted-foreground">Remind these 4 customers, politely.</p>
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <div className="flex -space-x-2">
                {["S", "A", "M", "+1"].map((l, i) => (
                  <span
                    key={l}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ring-2 ring-card ${
                      ["bg-ink text-background", "bg-haldi-soft text-[hsl(28_60%_22%)]", "bg-owed-soft text-owed", "bg-secondary text-ink"][i]
                    }`}
                  >
                    {l}
                  </span>
                ))}
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-ink px-3.5 py-2 text-sm font-semibold text-background">
                <BellRing className="h-4 w-4" /> Review reminders
              </span>
            </div>
          </div>
        </section>
      </main>

      <section className="mx-auto mt-16 w-full max-w-5xl px-5">
        <h2 className="font-display text-3xl font-semibold text-ink">Three things. Every day.</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-[1.2fr_1fr_1fr]">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rise flex gap-4 rounded-3xl border border-card-border bg-card p-5 md:flex-col" style={{ animationDelay: `${i * 80}ms` }}>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-haldi">
                <s.icon className="h-6 w-6" />
              </span>
              <div>
                <p className="font-num text-xs font-bold text-muted-foreground">0{i + 1}</p>
                <p className="text-lg font-bold text-ink">{s.title}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto mt-16 w-full max-w-5xl px-5">
        <div className="relative overflow-hidden rounded-[2rem] bg-ink px-6 py-10 text-background sm:px-10">
          <Camera className="absolute -right-6 -top-6 h-40 w-40 text-background/5" />
          <p className="max-w-xl font-display text-2xl leading-snug sm:text-3xl">
            "UPI made paying one tap. We make running a business one sentence."
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              data-testid="link-signup-bottom"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-haldi px-7 text-[17px] font-semibold text-[hsl(28_60%_14%)]"
            >
              Start free <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/demo" className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-background/25 px-6 font-semibold">
              See Ramesh's kirana first
            </Link>
          </div>
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">Every reminder waits for your tap. Munim never messages anyone on its own.</p>
      </section>
    </div>
  );
}
