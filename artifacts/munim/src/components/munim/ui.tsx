import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "wouter";
import { ArrowLeft, BookOpen, RefreshCw, SearchX, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-14 w-14 text-3xl" : size === "sm" ? "h-8 w-8 text-lg" : "h-10 w-10 text-xl";
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-[30%] bg-ink text-haldi font-display font-bold shadow-sm",
        box,
        className,
      )}
      aria-hidden
    >
      <span className="translate-y-[1px]">म</span>
      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-haldi ring-2 ring-background" />
    </span>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2.5">
      <Logo />
      <span className="font-display text-2xl font-semibold tracking-tight text-ink">Munim</span>
    </span>
  );
}

export function Page({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  return (
    <div className="min-h-[100dvh] w-full pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className={cn("mx-auto flex w-full flex-col gap-5 px-4 pt-4 sm:px-6", wide ? "max-w-3xl" : "max-w-md", className)}>
        {children}
      </div>
    </div>
  );
}

export function TopBar({ back = "/app", backLabel = "Home", right }: { back?: string; backLabel?: string; right?: ReactNode }) {
  return (
    <div className="sticky top-0 z-20 -mx-4 flex items-center justify-between gap-3 bg-background/85 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6">
      <Link
        href={back}
        data-testid="link-back"
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-[15px] font-semibold text-ink/80 transition-colors hover:bg-secondary hover:text-ink"
      >
        <ArrowLeft className="h-5 w-5" />
        {backLabel}
      </Link>
      {right}
    </div>
  );
}

export function PageTitle({ eyebrow, title, sub }: { eyebrow?: string; title: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rise flex flex-col gap-1">
      {eyebrow && <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{eyebrow}</span>}
      <h1 className="font-display text-[1.9rem] font-semibold leading-[1.1] tracking-tight text-ink">{title}</h1>
      {sub && <p className="text-[15px] leading-snug text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function Initials({ name, tone = "ink", className }: { name: string; tone?: "ink" | "owed" | "owe" | "haldi"; className?: string }) {
  const t = {
    ink: "bg-ink text-background",
    owed: "bg-owed-soft text-owed",
    owe: "bg-owe-soft text-owe",
    haldi: "bg-haldi-soft text-[hsl(30_60%_22%)]",
  }[tone];
  const letters = name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  return (
    <span className={cn("inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold", t, className)}>
      {letters}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Page>
      <div className="flex items-center justify-between py-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-36 w-full rounded-3xl" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </Page>
  );
}

export function StateCard({
  icon,
  title,
  body,
  action,
  tone = "neutral",
}: {
  icon: ReactNode;
  title: string;
  body?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "warn";
}) {
  return (
    <div className="rise flex flex-col items-center gap-3 rounded-3xl border border-dashed border-input bg-card/60 px-6 py-10 text-center">
      <span
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl",
          tone === "warn" ? "bg-owe-soft text-owe" : "bg-secondary text-ink",
        )}
      >
        {icon}
      </span>
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      {body && <p className="max-w-xs text-[15px] leading-snug text-muted-foreground">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorView({ onRetry, title = "Something went wrong.", body = "Try again, or go back and try a different way." }: { onRetry?: () => void; title?: string; body?: string }) {
  return (
    <Page className="min-h-[80dvh] justify-center">
      <StateCard
        tone="warn"
        icon={<WifiOff className="h-6 w-6" />}
        title={title}
        body={body}
        action={
          <div className="mt-2 flex w-full flex-col gap-2">
            {onRetry && (
              <Button onClick={onRetry} data-testid="button-retry">
                <RefreshCw className="h-4 w-4" /> Try again
              </Button>
            )}
            <Link href="/app" className="min-h-11 py-2 text-sm font-semibold text-muted-foreground hover:text-ink">
              Go home
            </Link>
          </div>
        }
      />
    </Page>
  );
}

export function NotFoundView() {
  return (
    <Page className="min-h-[85dvh] justify-center">
      <StateCard
        icon={<SearchX className="h-6 w-6" />}
        title="This page isn't in the khata."
        body="The link may be old, or the entry was removed. Nothing has changed in your accounts."
        action={
          <Link
            href="/"
            data-testid="link-home"
            className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-ink px-6 font-semibold text-background"
          >
            <BookOpen className="h-4 w-4" /> Back to Munim
          </Link>
        }
      />
    </Page>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "ink" | "owed" | "ghost" | "outline" | "haldi"; size?: "md" | "lg" };
export function Button({ variant = "ink", size = "md", className, ...props }: BtnProps) {
  const v = {
    ink: "bg-ink text-background hover:bg-ink/90 shadow-md",
    owed: "bg-owed text-background hover:bg-owed/90 shadow-md",
    haldi: "bg-haldi text-[hsl(28_60%_14%)] hover:brightness-95 shadow-sm",
    ghost: "text-muted-foreground hover:bg-secondary hover:text-ink",
    outline: "border border-input bg-card text-ink hover:bg-secondary",
  }[variant];
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-[transform,background-color,opacity] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        size === "lg" ? "min-h-14 px-6 text-[17px]" : "min-h-12 px-5 text-[15px]",
        v,
        className,
      )}
    />
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)} aria-hidden />;
}

export function Notice({ children, tone = "owe" }: { children: ReactNode; tone?: "owe" | "haldi" }) {
  return (
    <div
      role="alert"
      className={cn(
        "rise rounded-2xl border px-4 py-3 text-[15px] font-medium leading-snug",
        tone === "owe" ? "border-owe/25 bg-owe-soft text-owe" : "border-haldi/40 bg-haldi-soft text-[hsl(28_60%_20%)]",
      )}
    >
      {children}
    </div>
  );
}

export function fmtDate(s: string | null | undefined, withTime = false) {
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return withTime
    ? d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
