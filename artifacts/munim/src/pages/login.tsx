import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { postJSON } from "@/lib/api";
import { Button, Logo, Notice, Page, Spinner, TopBar } from "@/components/munim/ui";
import { cn } from "@/lib/utils";

const inputCls =
  "min-h-13 w-full rounded-2xl border border-input bg-card px-4 py-3 text-[17px] text-ink placeholder:text-muted-foreground/60 focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15";

export default function Login() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await postJSON("login", { phone, pin });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setLoading(false);
      if (!res.ok) {
        setError(data.error ?? "Couldn't log in. Try again.");
        return;
      }
      qc.removeQueries({ queryKey: ["view"] });
      navigate("/app");
    } catch {
      setLoading(false);
      setError("Network error. Check your connection.");
    }
  }

  return (
    <Page>
      <TopBar back="/" backLabel="Back" />
      <div className="rise flex flex-col items-start gap-3">
        <Logo size="lg" />
        <h1 className="font-display text-[2rem] font-semibold leading-tight text-ink">Welcome back</h1>
        <p className="text-[15px] text-muted-foreground">Log in with your phone number and PIN.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
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
              data-testid="input-login-phone"
              autoComplete="tel-national"
            />
          </div>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-ink">PIN</span>
          <input
            required
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            className={cn(inputCls, "font-num tracking-[0.5em]")}
            placeholder="••••"
            data-testid="input-login-pin"
            autoComplete="current-password"
          />
        </label>

        {error && <Notice>{error}</Notice>}

        <Button type="submit" size="lg" disabled={loading} data-testid="button-login">
          {loading ? (
            <>
              <Spinner /> Logging in…
            </>
          ) : (
            <>
              Log in <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-ink underline underline-offset-4">
            Create your free account
          </Link>
        </p>
      </form>
    </Page>
  );
}
