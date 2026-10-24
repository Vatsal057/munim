"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function TellPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"input" | "confirm">("input");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [source, setSource] = useState<"text" | "voice" | "khata_photo" | "bill_photo">("text");

  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function runParse(body: FormData, src: typeof source) {
    setBusy(true);
    setError(null);
    setSource(src);
    const res = await fetch("/api/tell/parse", { method: "POST", body });
    setBusy(false);
    if (!res.ok) {
      setError("Couldn't read that. Try again or type it.");
      return;
    }
    const data: ParseResult = await res.json();
    setResult(data);
    setMode("confirm");
  }

  async function handleTextSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const form = new FormData();
    form.set("text", text);
    form.set("kind", "auto");
    await runParse(form, "text");
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.set("image", file);
    form.set("kind", "khata");
    await runParse(form, "khata_photo");
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
    } catch {
      setError("Couldn't access the microphone.");
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
    recorder.stream.getTracks().forEach((t) => t.stop());

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    setBusy(true);
    setError(null);

    const form = new FormData();
    form.set("audio", blob, "audio.webm");
    const transcribeRes = await fetch("/api/tell/transcribe", { method: "POST", body: form });

    let transcript = "";
    if (transcribeRes.ok) {
      const data = await transcribeRes.json();
      transcript = data.text ?? "";
    } else {
      transcript = await browserSpeechFallback();
    }

    setBusy(false);
    if (!transcript) {
      setError("Couldn't hear that. Try typing instead.");
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
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entries: result.entries.map((e) => ({ ...e, source })),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Couldn't save that. Try again.");
      return;
    }
    router.push("/app/ledger");
  }

  function discard() {
    setResult(null);
    setMode("input");
    setText("");
  }

  if (mode === "confirm" && result) {
    return (
      <div className="min-h-screen max-w-sm mx-auto p-6 flex flex-col gap-5">
        <h1 className="text-xl font-bold">Here&apos;s what I understood ✓</h1>
        <p className="text-sm text-gray-600">{result.readback}</p>

        <ul className="flex flex-col gap-3">
          {result.entries.map((entry, i) => (
            <li
              key={i}
              className={`border rounded-xl p-4 flex flex-col gap-2 ${
                entry.confidence === "low" ? "bg-yellow-50 border-yellow-400" : ""
              }`}
            >
              <div className="flex gap-2">
                <input
                  value={entry.party_name}
                  onChange={(e) => updateEntry(i, { party_name: e.target.value })}
                  className="border rounded-lg px-3 py-2 flex-1 text-base"
                />
                <button
                  onClick={() => removeEntry(i)}
                  className="text-red-600 px-2"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
              <select
                value={entry.type}
                onChange={(e) => updateEntry(i, { type: e.target.value as Entry["type"] })}
                className="border rounded-lg px-3 py-2 text-sm"
              >
                {ENTRY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={entry.amount_rupees}
                onChange={(e) => updateEntry(i, { amount_rupees: Number(e.target.value) })}
                className="border rounded-lg px-3 py-2 text-2xl font-semibold"
              />
              <input
                type="date"
                value={entry.due_date ?? ""}
                onChange={(e) => updateEntry(i, { due_date: e.target.value || null })}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              {entry.confidence === "low" && (
                <p className="text-xs text-yellow-700">Not sure about this one — check it.</p>
              )}
            </li>
          ))}
        </ul>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex flex-col gap-2">
          <button
            onClick={confirmAll}
            disabled={busy || result.entries.length === 0}
            className="bg-black text-white rounded-lg py-4 text-lg font-semibold disabled:opacity-50"
          >
            {busy ? "Saving…" : "Confirm all"}
          </button>
          <button onClick={discard} className="text-gray-500 py-2">
            Discard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-sm mx-auto p-6 flex flex-col gap-6">
      <h1 className="text-xl font-bold">Tell munim</h1>

      <form onSubmit={handleTextSubmit} className="flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ramesh paid 500, Suresh owes 340 for rice"
          className="border rounded-lg px-4 py-3 text-base min-h-24"
        />
        <button
          type="submit"
          disabled={busy || !text.trim()}
          className="bg-black text-white rounded-lg py-4 text-lg font-semibold disabled:opacity-50"
        >
          {busy ? "Reading…" : "Send"}
        </button>
      </form>

      <div className="grid grid-cols-2 gap-4">
        <button
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          disabled={busy}
          className={`rounded-2xl py-8 flex flex-col items-center justify-center gap-2 text-lg font-semibold ${
            recording ? "bg-red-600 text-white" : "bg-gray-200"
          }`}
        >
          <span className="text-3xl">🎙️</span>
          {recording ? "Release to stop" : "Hold to talk"}
        </button>

        <label className="bg-gray-200 rounded-2xl py-8 flex flex-col items-center justify-center gap-2 text-lg font-semibold cursor-pointer">
          <span className="text-3xl">📷</span>
          Photo
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            className="hidden"
          />
        </label>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {busy && <p className="text-sm text-gray-500 text-center">Working on it…</p>}
    </div>
  );
}
