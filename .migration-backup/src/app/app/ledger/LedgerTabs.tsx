"use client";

import { useState } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/money";

type Row = { customer_id: number; name: string; balance_paise: number; oldest_due_date: string | null };

export default function LedgerTabs({ owedToMe, iOwe }: { owedToMe: Row[]; iOwe: Row[] }) {
  const [tab, setTab] = useState<"owed" | "iowe">("owed");
  const rows = tab === "owed" ? owedToMe : iOwe;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex rounded-xl bg-gray-100 p-1">
        <button
          onClick={() => setTab("owed")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${
            tab === "owed" ? "bg-white shadow" : "text-gray-500"
          }`}
        >
          They owe me
        </button>
        <button
          onClick={() => setTab("iowe")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${
            tab === "iowe" ? "bg-white shadow" : "text-gray-500"
          }`}
        >
          I owe
        </button>
      </div>

      {rows.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-8">Nothing here yet.</p>
      )}

      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.customer_id}>
            <Link
              href={`/app/customers/${row.customer_id}`}
              className="flex items-center justify-between border rounded-xl px-4 py-3"
            >
              <div>
                <p className="font-medium">{row.name}</p>
                {row.oldest_due_date && (
                  <p className="text-xs text-gray-500">
                    since {new Date(row.oldest_due_date).toLocaleDateString("en-IN")}
                  </p>
                )}
              </div>
              <p className="font-semibold">{formatINR(Number(row.balance_paise))}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
