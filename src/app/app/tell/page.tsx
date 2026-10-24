"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

const TYPE_LABELS: Record<(typeof ENTRY_TYPES)[number], { label: string; badge: string }> = {
  credit_given: { label: "Credit Given (Udhaar)", badge: "bg-amber-100 text-amber-900 border-amber-200" },
  payment_received: { label: "Payment Received", badge: "bg-emerald-100 text-emerald-900 border-emerald-200" },
  purchase: { label: "Purchase on Credit", badge: "bg-rose-100 text-rose-900 border-rose-200" },
  supplier_due: { label: "Supplier Due", badge: "bg-rose-100 text-rose-900 border-rose-200" },
  supplier_paid: { label: "Paid to Supplier", badge: "bg-blue-100 text-blue-900 border-blue-200" },
  order: { label: "Customer Order", badge: "bg-indigo-100 text-indigo-900 border-indigo-200" },
  skip: { label: "Skipped Today", badge: "bg-slate-100 text-slate-800 border-slate-200" },
  sale: { label: "Cash Sale", badge: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  wastage: { label: "Wastage / Loss", badge: "bg-slate-100 text-slate-700 border-slate-200" },
};

export default function TellPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"input" | "confirm">("input");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState("Working on it…");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [source, setSource] = useState<"text" | "voice" | "khata_photo" | "bill_photo">("text");

  const [recording, setRecording] = useState(false);
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
      const res = await fetch("/api/tell/parse", { method: "POST", body });
      setBusy(false);
      if (!res.ok) {
        setError("Couldn't read that clearly. Please try again or type directly.");
        return;
      }
      const data: ParseResult = await res.json();
      if (!data.entries || data.entries.length === 0) {
        setError("No transactions found in this input. Try saying a name and amount (e.g. 'Ramesh took 2 soaps, ₹340').");
        return;
      }
      setResult(data);
      setMode("confirm");
    } catch {
      setBusy(false);
      setError("Network error while parsing. Check connection.");
    }
  }

  async function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const form = new FormData();
    form.set("text", text);
    form.set("kind", "auto");
    await runParse(form, "text");
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>, kind: "khata" | "bill") {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.set("image", file);
    form.set("kind", kind);
    await runParse(form, kind === "khata" ? "khata_photo" : "bill_photo");
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setError(null);
    } catch {
      setError("Couldn't access the microphone. Check browser permissions.");
    }
  }

  async function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    setRecording(false);
    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });
    recorder.stop();
    await stopped;
    recorder.stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    setBusy(true);
    setBusyMessage("Transcribing voice note…");
    setError(null);

    const form = new FormData();
    form.set("audio", blob, "audio.webm");

    let transcript = "";
    try {
      const transcribeRes = await fetch("/api/tell/transcribe", { method: "POST", body: form });
      if (transcribeRes.ok) {
        const data = await transcribeRes.json();
        transcript = data.text ?? "";
      }
    } catch {
      // transcribe endpoint failed, fallback to browser
    }

    if (!transcript) {
      transcript = await browserSpeechFallback();
    }

    if (!transcript) {
      setBusy(false);
      setError("Couldn't recognize any speech. Try speaking closer to mic or type.");
      return;
    }

    setText(transcript);
    const parseForm = new FormData();
    parseForm.set("text", transcript);
    parseForm.set("kind", "auto");
    await runParse(parseForm, "voice");
  }

  function browserSpeechFallback(): Promise<string> {
    return new Promise((resolve) => {
      type SpeechRecognitionResultLike = { results: { [i: number]: { [j: number]: { transcript: string } } } };
      const w = window as unknown as {
        webkitSpeechRecognition?: new () => {
          lang: string;
          start: () => void;
          onresult: ((e: SpeechRecognitionResultLike) => void) | null;
          onerror: (() => void) | null;
        };
        SpeechRecognition?: typeof w.webkitSpeechRecognition;
      };
      const SpeechRecognition = w.webkitSpeechRecognition || w.SpeechRecognition;
      if (!SpeechRecognition) {
        resolve("");
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.onresult = (e) => resolve(e.results[0][0].transcript);
      recognition.onerror = () => resolve("");
      recognition.start();
    });
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
  }

  async function confirmAll() {
    if (!result || result.entries.length === 0) return;
    setBusy(true);
    setBusyMessage("Saving confirmed entries to ledger…");
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entries: result.entries.map((e) => ({ ...e, source })),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Couldn't save entries. Please try again.");
      return;
    }
    router.push("/app/ledger");
  }

  function discard() {
    setResult(null);
    setMode("input");
    setText("");
  }

  // --- CONFIRMATION CARD VIEW ---
  if (mode === "confirm" && result) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
        <div className="max-w-md mx-auto px-5 pt-6 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <button
              onClick={discard}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1 py-1"
            >
              <span>←</span>
              <span>Back / Discard</span>
            </button>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {result.entries.length} {result.entries.length === 1 ? "entry" : "entries"} found
            </span>
          </div>

          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-950 flex items-center gap-1.5">
              <span>Here&apos;s what I understood</span>
              <span className="text-emerald-600">✓</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and edit if needed. Money is only saved after you tap Confirm.
            </p>
          </div>

          {/* Spoken Readback Banner */}
          {result.readback && (
            <div className="bg-amber-500/10 border border-amber-300/80 rounded-xl p-3.5 flex gap-2.5 items-start">
              <span className="text-amber-800 text-lg leading-none mt-0.5">🔊</span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                  Readback Summary
                </span>
                <p className="text-xs text-amber-950 font-medium leading-relaxed">
                  &ldquo;{result.readback}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* List of Parsed Entries */}
          <ul className="flex flex-col gap-3.5">
            {result.entries.map((entry, i) => (
              <li
                key={i}
                className={`bg-white rounded-2xl p-4 border shadow-xs flex flex-col gap-3 transition-all ${
                  entry.confidence === "low"
                    ? "border-amber-400 bg-amber-50/20 shadow-amber-200/50"
                    : "border-slate-200/90"
                }`}
              >
                {/* Card Top: Type & Remove */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                      TYPE_LABELS[entry.type]?.badge || "bg-slate-100 text-slate-800"
                    }`}
                  >
                    {TYPE_LABELS[entry.type]?.label || entry.type.replace(/_/g, " ")}
                  </span>
                  <button
                    onClick={() => removeEntry(i)}
                    className="text-xs font-semibold text-rose-500 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50 transition-colors"
                    aria-label="Remove"
                  >
                    Delete entry
                  </button>
                </div>

                {/* Party Name & Rupee Amount */}
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-slate-500">Party / Customer</span>
                    <input
                      value={entry.party_name}
                      onChange={(e) => updateEntry(i, { party_name: e.target.value })}
                      className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold bg-slate-50/50 focus:bg-white focus:outline-slate-900"
                      placeholder="Name"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-slate-500">Amount (₹)</span>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-sm font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        value={entry.amount_rupees}
                        onChange={(e) => updateEntry(i, { amount_rupees: Number(e.target.value) })}
                        className="w-full border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-base font-bold bg-slate-50/50 focus:bg-white focus:outline-slate-900"
                      />
                    </div>
                  </label>
                </div>

                {/* Due Date & Type selector */}
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-slate-500">Type</span>
                    <select
                      value={entry.type}
                      onChange={(e) => updateEntry(i, { type: e.target.value as Entry["type"] })}
                      className="border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium bg-slate-50/50"
                    >
                      {ENTRY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-[11px] font-semibold text-slate-500">Due Date (Optional)</span>
                    <input
                      type="date"
                      value={entry.due_date ?? ""}
                      onChange={(e) => updateEntry(i, { due_date: e.target.value || null })}
                      className="border border-slate-200 rounded-xl px-2.5 py-2 text-xs bg-slate-50/50"
                    />
                  </label>
                </div>

                {entry.items && (
                  <p className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-700">Items:</span> {entry.items}
                  </p>
                )}

                {entry.confidence === "low" && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    <span>⚠️</span>
                    <span>Low AI confidence — please verify the amount and name.</span>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {error && <p className="text-rose-600 text-xs font-semibold text-center">{error}</p>}

          {/* Confirm Actions */}
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              onClick={confirmAll}
              disabled={busy || result.entries.length === 0}
              className="w-full bg-slate-950 text-white rounded-xl py-4 text-base font-bold shadow-md hover:bg-slate-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
            >
              <span>{busy ? "Saving…" : `Confirm & Save (${result.entries.length})`}</span>
              <span>✓</span>
            </button>
            <button
              onClick={discard}
              className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Discard and Re-enter
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN INPUT VIEW ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <div className="max-w-md mx-auto px-5 pt-6 flex flex-col gap-6">
        {/* Top Bar with Back Button */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
          <Link
            href="/app"
            className="text-xs font-semibold text-slate-600 hover:text-slate-950 flex items-center gap-1.5 py-1.5"
          >
            <span>←</span>
            <span>Home</span>
          </Link>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
            Tell Mode
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">
            Tell your Munim
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Speak, photograph a notebook/bill, or type. Munim parses the numbers for you.
          </p>
        </div>

        {/* Input Option Cards */}
        <div className="flex flex-col gap-4">
          {/* 1. Voice Input Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col items-center text-center gap-3">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1. Voice Note (Kannada, Hindi, English)
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                No typing
              </span>
            </div>

            <button
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              disabled={busy}
              className={`w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1 shadow-md transition-all active:scale-95 my-2 select-none ${
                recording
                  ? "bg-rose-600 text-white animate-pulse-ring"
                  : "bg-slate-950 text-white hover:bg-slate-800"
              }`}
            >
              <span className="text-3xl">{recording ? "🛑" : "🎙️"}</span>
              <span className="text-[11px] font-bold">
                {recording ? "Release" : "Hold & Speak"}
              </span>
            </button>

            <p className="text-xs text-slate-500 font-medium">
              {recording ? (
                <span className="text-rose-600 font-semibold animate-pulse">
                  Listening… release button when done speaking
                </span>
              ) : (
                <span>&ldquo;Ramesh took 2 soaps, ₹340, Friday pay maadtaare&rdquo;</span>
              )}
            </p>
          </div>

          {/* 2. Photo Camera / Upload Grid */}
          <div className="grid grid-cols-2 gap-3">
            <label className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between min-h-[120px] shadow-2xs transition-all active:scale-[0.98] cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center text-xl">
                  📸
                </span>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                  Khata
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900">Snap Khata Page</span>
                <span className="text-[11px] text-slate-500">Camera scan</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handlePhoto(e, "khata")}
                className="hidden"
              />
            </label>

            <label className="bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between min-h-[120px] shadow-2xs transition-all active:scale-[0.98] cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center text-xl">
                  🧾
                </span>
                <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded">
                  Bill / Slip
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900">Wholesale Bill</span>
                <span className="text-[11px] text-slate-500">Upload or photo</span>
              </div>
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handlePhoto(e, "bill")}
                className="hidden"
              />
            </label>
          </div>

          {/* 3. Text Input Box */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col gap-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Or Type Anything
            </span>
            <form onSubmit={handleTextSubmit} className="flex flex-col gap-2.5">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. Suresh paid 500, bought rice 1200 from wholesaler due Friday"
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm min-h-20 bg-slate-50/50 focus:bg-white focus:outline-slate-900"
              />
              <button
                type="submit"
                disabled={busy || !text.trim()}
                className="w-full bg-slate-950 text-white rounded-xl py-3 text-sm font-bold shadow-xs hover:bg-slate-800 transition-colors disabled:opacity-40"
              >
                {busy ? "Reading…" : "Parse with Munim →"}
              </button>
            </form>
          </div>
        </div>

        {/* Status / Error feedback */}
        {busy && (
          <div className="bg-slate-900 text-white text-xs font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md animate-pulse">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span>{busyMessage}</span>
          </div>
        )}

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium p-3 rounded-xl text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
