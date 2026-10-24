"use client";

import { useState } from "react";
import { formatINR } from "@/lib/money";

type Reminder = {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string | null;
  amount_paise: number;
  reason: string;
  message: string;
  status: string;
  pay_token: string | null;
  payment_url: string | null;
};

function buildWaMeUrl(phone: string | null, text: string): string {
  const encoded = encodeURIComponent(text);
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
    return `https://wa.me/${withCountryCode}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export default function RemindersClient({ initialReminders }: { initialReminders: Reminder[] }) {
  const [reminders, setReminders] = useState(initialReminders);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateMessage(id: number, message: string) {
    setReminders((rs) => rs.map((r) => (r.id === id ? { ...r, message } : r)));
  }

  async function approveAndSend(reminder: Reminder) {
    setBusyId(reminder.id);
    setError(null);
    const res = await fetch(`/api/reminders/${reminder.id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reminder.message }),
    });
    setBusyId(null);
    if (!res.ok) {
      setError("Couldn't approve that. Try again.");
      return;
    }
    const data = await res.json();
    const approved = { ...reminder, status: "approved", payment_url: data.payment_url, pay_token: data.pay_token, message: data.message };
    setReminders((rs) => rs.map((r) => (r.id === reminder.id ? approved : r)));
    await share(approved);
  }

  async function share(reminder: Reminder) {
    if (!reminder.payment_url) return;
    try {
      if (navigator.canShare) {
        const qrRes = await fetch(`/api/reminders/${reminder.id}/qr`);
        if (qrRes.ok) {
          const blob = await qrRes.blob();
          const file = new File([blob], "pay-qr.png", { type: "image/png" });
          if (navigator.canShare({ files: [file], text: reminder.message })) {
            await navigator.share({ files: [file], text: reminder.message });
            await fetch(`/api/reminders/${reminder.id}/share`, { method: "POST" });
            return;
          }
        }
      }
    } catch {
      // user cancelled or share failed — fall through to wa.me
    }
    window.open(buildWaMeUrl(reminder.customer_phone, reminder.message), "_blank");
    await fetch(`/api/reminders/${reminder.id}/share`, { method: "POST" });
  }

  async function reject(id: number) {
    setBusyId(id);
    const res = await fetch(`/api/reminders/${id}/reject`, { method: "POST" });
    setBusyId(null);
    if (res.ok) setReminders((rs) => rs.filter((r) => r.id !== id));
  }

  async function markPaid(id: number) {
    setBusyId(id);
    const res = await fetch(`/api/reminders/${id}/mark-paid`, { method: "POST" });
    setBusyId(null);
    if (res.ok) setReminders((rs) => rs.filter((r) => r.id !== id));
  }

  if (reminders.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200/90 text-center flex flex-col items-center gap-3 shadow-xs">
        <span className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl">
          ✨
        </span>
        <h2 className="text-base font-bold text-slate-900">Queue is Clear</h2>
        <p className="text-xs text-slate-500 max-w-xs">
          No reminders waiting. You can tap &ldquo;Run Agent&rdquo; above to have your Munim scan your ledger and draft reminders for customers who owe you.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold p-3 rounded-xl text-center">
          {error}
        </div>
      )}

      {reminders.map((r) => (
        <div
          key={r.id}
          className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col gap-3.5 transition-all"
        >
          {/* Card Header: Avatar, Name & Amount */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {r.customer_name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-950 text-sm">{r.customer_name}</p>
                <p className="text-[11px] text-slate-400">
                  {r.customer_phone ? `+91 ${r.customer_phone}` : "Walk-in regular"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-extrabold text-slate-950 tracking-tight">
                {formatINR(r.amount_paise)}
              </p>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  r.status === "approved"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-amber-100 text-amber-900 border border-amber-200"
                }`}
              >
                {r.status === "approved" ? "Sent / Approved" : "Agent Draft"}
              </span>
            </div>
          </div>

          {/* AI Reason Badge */}
          <div className="bg-amber-500/10 border border-amber-300/60 rounded-xl px-3 py-2 flex items-start gap-2">
            <span className="text-xs">🤖</span>
            <p className="text-xs text-amber-950 font-medium leading-snug">
              <strong className="font-semibold text-amber-900">Why remind: </strong>
              {r.reason}
            </p>
          </div>

          {/* WhatsApp Message Preview */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <span>💬</span> WhatsApp Message Draft
              </span>
              <span className="text-[10px] text-slate-400">Editable</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 flex flex-col gap-1.5">
              <textarea
                value={r.message}
                onChange={(e) => updateMessage(r.id, e.target.value)}
                disabled={r.status === "approved"}
                rows={3}
                className="w-full bg-transparent text-xs text-slate-800 font-medium leading-relaxed resize-none focus:outline-hidden disabled:opacity-80"
                placeholder="Draft message..."
              />
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[10px] text-slate-400">
                <span>Carries Pine Labs payment link & UPI QR</span>
                <span>{r.message.length} chars</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {r.status === "draft" ? (
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => approveAndSend(r)}
                disabled={busyId === r.id}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 px-4 text-xs font-bold shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <span>{busyId === r.id ? "Preparing…" : "Approve & Send (WhatsApp)"}</span>
                <span>↗</span>
              </button>
              <button
                onClick={() => reject(r.id)}
                disabled={busyId === r.id}
                className="px-3.5 py-3 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-colors"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => share(r)}
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
              >
                <span>Share Again</span>
                <span>↗</span>
              </button>
              <button
                onClick={() => markPaid(r.id)}
                disabled={busyId === r.id}
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-xl py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <span>Mark Paid ✓</span>
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
