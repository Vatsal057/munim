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
    return <p className="text-sm text-gray-500 text-center py-8">No reminders right now.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {reminders.map((r) => (
        <div key={r.id} className="border rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between">
            <p className="font-semibold">{r.customer_name}</p>
            <p className="font-semibold">{formatINR(r.amount_paise)}</p>
          </div>
          <p className="text-xs text-gray-500">{r.reason}</p>
          <textarea
            value={r.message}
            onChange={(e) => updateMessage(r.id, e.target.value)}
            disabled={r.status === "approved"}
            className="border rounded-lg px-3 py-2 text-sm min-h-20"
          />
          {r.status === "draft" ? (
            <div className="flex gap-2">
              <button
                onClick={() => approveAndSend(r)}
                disabled={busyId === r.id}
                className="flex-1 bg-black text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
              >
                {busyId === r.id ? "Sending…" : "Approve & send"}
              </button>
              <button
                onClick={() => reject(r.id)}
                disabled={busyId === r.id}
                className="px-4 rounded-lg border text-sm font-semibold"
              >
                Reject
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => share(r)}
                className="bg-gray-200 rounded-lg py-2 text-sm font-semibold"
              >
                Share again
              </button>
              <button
                onClick={() => markPaid(r.id)}
                disabled={busyId === r.id}
                className="text-green-700 text-sm font-semibold"
              >
                Mark paid (cash/UPI)
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
