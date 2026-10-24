import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, ArrowRight, Camera, Check, Mic, Receipt, Square, Trash2, Volume2 } from "lucide-react";
import { apiFetch, postJSON } from "@/lib/api";
import { Button, Notice, Page, PageTitle, Spinner, TopBar } from "@/components/munim/ui";
import { cn } from "@/lib/utils";

const ENTRY_TYPES = [
  "credit_given",
  "payment_received",
  "purchase",
  "supplier_due",
  "supplier_paid",
  "order",
  "skip",
  "sale",
  "wastage",
] as const;

type Entry = {
  type: (typeof ENTRY_TYPES)[number];
  party_name: string;
  party_kind: "customer" | "supplier";
  amount_rupees: number;
  due_date: string | null;
  items: string | null;
  confidence: "high" | "medium" | "low";
};

type ParseResult = { entries: Entry[]; readback: string };

/**
 * Phone camera photos are often 5-12 MB (over the upload limit) and slow to send on shop data.
 * 1600px JPEG keeps handwriting readable at ~200-400 KB. Falls back to the original file.
 */
async function shrinkPhoto(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    return blob ?? file;
  } catch {
    return file;
  }
}

// tone: owed = money coming to me (green), owe = I owe (red), neutral otherwise
const TYPE_LABELS: Record<(typeof ENTRY_TYPES)[number], { label: string; tone: "owed" | "owe" | "neutral" | "haldi" }> = {
  credit_given: { label: "Credit given (udhaar)", tone: "owed" },
  payment_received: { label: "Payment received", tone: "owed" },
  purchase: { label: "Purchase on credit", tone: "owe" },
  supplier_due: { label: "Supplier due", tone: "owe" },
  supplier_paid: { label: "Paid to supplier", tone: "neutral" },
  order: { label: "Customer order", tone: "haldi" },
  skip: { label: "Skipped today", tone: "neutral" },
  sale: { label: "Cash sale", tone: "owed" },
  wastage: { label: "Wastage / loss", tone: "neutral" },
};
const TONE = {
  owed: "bg-owed-soft text-owed",
  owe: "bg-owe-soft text-owe",
  neutral: "bg-secondary text-ink",
  haldi: "bg-haldi-soft text-[hsl(28_60%_20%)]",
};

const field =
  "min-h-12 w-full rounded-xl border border-input bg-background/60 px-3 text-[16px] text-ink focus:border-ink focus:bg-card focus:outline-none focus:ring-2 focus:ring-ink/15";

export default function Tell() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"input" | "confirm">("input");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState("Working on it…");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [source, setSource] = useState<"text" | "voice" | "khata_photo" | "bill_photo">("text");

  const [keys, setKeys] = useState<number[]>([]);
  const [recording, setRecording] = useState(false);
  const recognitionRef = useRef<{ stop: () => void; onend: (() => void) | null } | null>(null);
  const liveTextRef = useRef("");
  const [liveText, setLiveText] = useState("");
  const [heard, setHeard] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  async function runParse(body: FormData, src: typeof source) {
    setBusy(true);
    setBusyMessage("Reading and parsing entries…");
    setError(null);
    setSource(src);
    try {
      const res = await apiFetch("tell/parse", { method: "POST", body });
      setBusy(false);
      if (!res.ok) {
        const msg = res.status === 422 ? ((await res.json().catch(() => null)) as { error?: string } | null)?.error : null;
        setError(msg || "Couldn't read that clearly. Please try again or type directly.");
        return;
      }
      const data: ParseResult = await res.json();
      if (!data.entries || data.entries.length === 0) {
        setError("No transactions found in this input. Try saying a name and amount (e.g. 'Ramesh took 2 soaps, ₹340').");
        return;
      }
      setResult(data);
      setKeys(data.entries.map((_, i) => Date.now() + i));
      setMode("confirm");
      window.scrollTo({ top: 0 });
    } catch {
      setBusy(false);
      setError("Network error while parsing. Check connection.");
    }
  }

  async function handleTextSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const form = new FormData();
    form.set("text", text);
    form.set("kind", "auto");
    await runParse(form, "text");
  }

  async function handlePhoto(e: ChangeEvent<HTMLInputElement>, kind: "khata" | "bill") {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const form = new FormData();
    form.set("image", await shrinkPhoto(file), "photo.jpg");
    form.set("kind", kind);
    await runParse(form, kind === "khata" ? "khata_photo" : "bill_photo");
  }

  // Browser speech recognition runs *while* the merchant speaks (live captions), so it is a
  // real fallback when ElevenLabs isn't configured instead of listening after they've stopped.
  type Recognition = {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start: () => void;
    stop: () => void;
    onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
  };
  function startLiveCaptions() {
    const w = window as unknown as { webkitSpeechRecognition?: new () => Recognition; SpeechRecognition?: new () => Recognition };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    liveTextRef.current = "";
    setLiveText("");
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = true;
    let finals = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finals += r[0].transcript + " ";
        else interim += r[0].transcript;
      }
      liveTextRef.current = (finals + interim).trim();
      setLiveText(liveTextRef.current);
    };
    rec.onerror = () => undefined;
    try {
      rec.start();
      recognitionRef.current = rec;
    } catch {
      recognitionRef.current = null;
    }
  }

  function stopLiveCaptions(): Promise<void> {
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (!rec) return Promise.resolve();
    return new Promise((resolve) => {
      const done = setTimeout(resolve, 1200); // last words arrive just after stop()
      rec.onend = () => {
        clearTimeout(done);
        resolve();
      };
      rec.stop();
    });
  }

  async function toggleRecording() {
    if (busy) return;
    if (recording) return stopRecording();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setError(null);
      startLiveCaptions();
    } catch {
      setError("Couldn't access the microphone. Allow mic access in the browser, or type instead.");
    }
  }

  async function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    mediaRecorderRef.current = null;
    setRecording(false);
    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });
    recorder.stop();
    await Promise.all([stopped, stopLiveCaptions()]);
    recorder.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());

    const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
    setBusy(true);
    setBusyMessage("Transcribing voice note…");
    setError(null);

    let transcript = "";
    if (blob.size > 0) {
      try {
        const form = new FormData();
        form.set("audio", blob, "audio.webm");
        const transcribeRes = await apiFetch("tell/transcribe", { method: "POST", body: form });
        if (transcribeRes.ok) transcript = ((await transcribeRes.json()) as { text?: string }).text?.trim() ?? "";
      } catch {
        // fall back to the live captions below
      }
    }
    if (!transcript) transcript = liveTextRef.current.trim();

    if (!transcript) {
      setBusy(false);
      setError("Couldn't hear any words. Speak a little closer to the mic, or type it below.");
      return;
    }

    setText(transcript);
    setHeard(transcript);
    const parseForm = new FormData();
    parseForm.set("text", transcript);
    parseForm.set("kind", "auto");
    await runParse(parseForm, "voice");
  }

  function updateEntry(index: number, patch: Partial<Entry>) {
    if (!result) return;
    const entries = [...result.entries];
    entries[index] = { ...entries[index], ...patch };
    setResult({ ...result, entries });
  }

  function removeEntry(index: number) {
    if (!result) return;
    setResult({ ...result, entries: result.entries.filter((_, i) => i !== index) });
    setKeys((ks) => ks.filter((_, i) => i !== index));
  }

  async function confirmAll() {
    if (!result || result.entries.length === 0) return;
    setBusy(true);
    setBusyMessage("Saving confirmed entries to ledger…");
    setError(null);
    try {
      const res = await postJSON("entries", {
        entries: result.entries.map((e) => ({ ...e, source })),
      });
      setBusy(false);
      if (!res.ok) {
        setError("Couldn't save entries. Please try again.");
        return;
      }
      await qc.invalidateQueries({ queryKey: ["view"] });
      navigate(`/app?added=${result.entries.length}`);
    } catch {
      setBusy(false);
      setError("Couldn't save entries. Please try again.");
    }
  }

  function discard() {
    setResult(null);
    setMode("input");
    setText("");
    setError(null);
  }

  // --- CONFIRMATION VIEW ---
  if (mode === "confirm" && result) {
    const n = result.entries.length;
    return (
      <Page>
        <div className="sticky top-0 z-20 -mx-4 flex items-center justify-between bg-background/85 px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6">
          <button onClick={discard} data-testid="button-back-discard" className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2 text-[15px] font-semibold text-ink/80 hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" /> Back
          </button>
          <span className="font-num rounded-full bg-owed-soft px-3 py-1 text-xs font-bold text-owed" data-testid="text-entry-count">
            {n} {n === 1 ? "entry" : "entries"} found
          </span>
        </div>

        <PageTitle title="Here's what I understood" sub="Review and edit if needed. Money is only saved after you tap Confirm." />

        {heard && source === "voice" && (
          <p className="rounded-2xl border border-input bg-card px-4 py-3 text-[15px] text-ink" data-testid="text-heard">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">You said </span>
            <span className="font-display italic">"{heard}"</span>
          </p>
        )}

        {result.readback && (
          <div className="rise flex gap-3 rounded-2xl border border-haldi/40 bg-haldi-soft/70 p-4">
            <Volume2 className="mt-0.5 h-5 w-5 shrink-0 text-[hsl(28_60%_30%)]" />
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[hsl(28_60%_28%)]">Readback</span>
              <p className="font-display text-[17px] leading-snug text-ink" data-testid="text-readback">"{result.readback}"</p>
            </div>
          </div>
        )}

        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {result.entries.map((entry, i) => {
              const meta = TYPE_LABELS[entry.type];
              const low = entry.confidence === "low";
              return (
                <motion.li
                  key={keys[i] ?? i}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                  exit={{ opacity: 0, x: -40 }}
                  className={cn(
                    "flex flex-col gap-3 rounded-[1.5rem] border bg-card p-4 shadow-xs",
                    low ? "border-haldi ring-2 ring-haldi/25" : "border-card-border",
                  )}
                  data-testid={`card-entry-${i}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("rounded-lg px-2.5 py-1 text-xs font-bold", TONE[meta?.tone ?? "neutral"])}>
                      {meta?.label || entry.type.replace(/_/g, " ")}
                    </span>
                    <button
                      onClick={() => removeEntry(i)}
                      aria-label="Delete entry"
                      data-testid={`button-delete-entry-${i}`}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-owe-soft hover:text-owe"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-[1.3fr_1fr] gap-2.5">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted-foreground">Party / customer</span>
                      <input value={entry.party_name} onChange={(e) => updateEntry(i, { party_name: e.target.value })} className={cn(field, "font-semibold")} placeholder="Name" data-testid={`input-party-${i}`} />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted-foreground">Amount</span>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">₹</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={entry.amount_rupees}
                          onChange={(e) => updateEntry(i, { amount_rupees: Number(e.target.value) })}
                          className={cn(field, "font-num pl-7 text-lg font-bold")}
                          data-testid={`input-amount-${i}`}
                        />
                      </div>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted-foreground">Type</span>
                      <select value={entry.type} onChange={(e) => updateEntry(i, { type: e.target.value as Entry["type"] })} className={cn(field, "text-[15px]")} data-testid={`select-type-${i}`}>
                        {ENTRY_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {TYPE_LABELS[t].label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-muted-foreground">Due date (optional)</span>
                      <input type="date" value={entry.due_date ?? ""} onChange={(e) => updateEntry(i, { due_date: e.target.value || null })} className={cn(field, "text-[15px]")} data-testid={`input-due-${i}`} />
                    </label>
                  </div>

                  {entry.items && (
                    <p className="rounded-xl bg-secondary/70 px-3 py-2 text-sm text-muted-foreground">
                      <span className="font-semibold text-ink">Items:</span> {entry.items}
                    </p>
                  )}

                  {low && (
                    <div className="flex items-center gap-2 rounded-xl bg-haldi-soft px-3 py-2 text-sm font-medium text-[hsl(28_60%_20%)]">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      Not fully sure about this one. Please check the amount and name.
                    </div>
                  )}
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

        {n === 0 && <Notice tone="haldi">All entries removed. Discard and tell Munim again.</Notice>}
        {error && <Notice>{error}</Notice>}

        <div className="sticky bottom-0 -mx-4 flex flex-col gap-1 bg-gradient-to-t from-background via-background to-background/0 px-4 pb-3 pt-6 sm:-mx-6 sm:px-6">
          <Button size="lg" onClick={confirmAll} disabled={busy || n === 0} data-testid="button-confirm">
            {busy ? (
              <>
                <Spinner /> Saving…
              </>
            ) : (
              <>
                <Check className="h-5 w-5" /> Confirm & save ({n})
              </>
            )}
          </Button>
          <Button variant="ghost" onClick={discard} data-testid="button-discard">
            Discard and re-enter
          </Button>
        </div>
      </Page>
    );
  }

  // --- INPUT VIEW ---
  return (
    <Page>
      <TopBar />
      <PageTitle title="Tell your Munim" sub="Speak, photograph a notebook or bill, or type. Munim reads the numbers for you." />

      {/* Voice */}
      <section className="rise flex flex-col items-center gap-4 rounded-[1.75rem] border border-card-border bg-card px-5 pb-6 pt-5 text-center shadow-sm">
        <div className="flex w-full items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Voice note</span>
          <span className="text-xs font-semibold text-muted-foreground">ಕನ್ನಡ · हिन्दी · English</span>
        </div>
        <button
          onClick={toggleRecording}
          onContextMenu={(e) => e.preventDefault()}
          disabled={busy}
          data-testid="button-record"
          aria-label={recording ? "Stop recording" : "Start recording"}
          className={cn(
            "relative isolate my-2 flex h-32 w-32 touch-none select-none flex-col items-center justify-center gap-1 rounded-full shadow-lg transition-[transform,background-color] active:scale-95 disabled:opacity-50",
            recording ? "rec-ring bg-owe text-background" : "bg-ink text-background",
          )}
        >
          {recording ? <Square className="h-8 w-8 fill-current" /> : <Mic className="h-10 w-10 text-haldi" />}
          <span className="text-sm font-bold">{recording ? "Tap to stop" : "Tap & speak"}</span>
        </button>
        <p className="min-h-6 text-[15px] text-muted-foreground" aria-live="polite">
          {recording ? (
            <span className="font-semibold text-owe">{liveText ? `"${liveText}"` : "Listening… tap again when done"}</span>
          ) : (
            <span className="font-display italic">"Ramesh took 2 soaps, ₹340, Friday pay maadtaare"</span>
          )}
        </p>
      </section>

      {/* Photo */}
      <section className="grid grid-cols-2 gap-3">
        <label className="rise flex min-h-[132px] cursor-pointer flex-col justify-between rounded-[1.5rem] border border-card-border bg-card p-4 shadow-xs transition-transform active:scale-[0.98] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-haldi" style={{ animationDelay: "60ms" }}>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-haldi-soft text-[hsl(28_60%_22%)]">
            <Camera className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-[16px] font-bold text-ink">Snap khata page</span>
            <span className="block text-[13px] text-muted-foreground">Camera scan</span>
          </span>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => handlePhoto(e, "khata")} className="sr-only" disabled={busy} data-testid="input-khata-photo" />
        </label>
        <label className="rise flex min-h-[132px] cursor-pointer flex-col justify-between rounded-[1.5rem] border border-card-border bg-card p-4 shadow-xs transition-transform active:scale-[0.98] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-haldi" style={{ animationDelay: "100ms" }}>
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-ink">
            <Receipt className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-[16px] font-bold text-ink">Bill or UPI slip</span>
            <span className="block text-[13px] text-muted-foreground">Upload or photo</span>
          </span>
          <input ref={galleryInputRef} type="file" accept="image/*" onChange={(e) => handlePhoto(e, "bill")} className="sr-only" disabled={busy} data-testid="input-bill-photo" />
        </label>
      </section>

      {/* Text */}
      <form onSubmit={handleTextSubmit} className="rise flex flex-col gap-3 rounded-[1.5rem] border border-card-border bg-card p-4 shadow-xs" style={{ animationDelay: "140ms" }}>
        <label htmlFor="tell-text" className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Or type anything
        </label>
        <textarea
          id="tell-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Suresh paid 500, bought rice 1200 from wholesaler due Friday"
          className="ledger-lines min-h-28 w-full resize-none rounded-xl border border-input bg-background/60 px-3.5 py-2 text-[16px] leading-8 text-ink focus:border-ink focus:outline-none"
          data-testid="input-text"
        />
        <Button type="submit" disabled={busy || !text.trim()} data-testid="button-parse">
          {busy ? "Reading…" : (
            <>
              Read with Munim <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <AnimatePresence>
        {busy && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            role="status"
            className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md items-center justify-center gap-3 rounded-2xl bg-ink px-4 py-4 text-[15px] font-semibold text-background shadow-xl"
          >
            <Spinner className="text-haldi" /> {busyMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {error && <Notice>{error}</Notice>}

      <p className="text-center text-sm text-muted-foreground">
        Nothing is saved until you confirm.{" "}
        <Link href="/app/ledger" className="font-semibold text-ink underline underline-offset-4">
          See ledger
        </Link>
      </p>
    </Page>
  );
}
