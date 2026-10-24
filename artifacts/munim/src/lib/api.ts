import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export const API_BASE = `${import.meta.env.BASE_URL}api`;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function apiUrl(path: string) {
  return `${API_BASE}/${path.replace(/^\//, "")}`;
}

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(apiUrl(path), { credentials: "include", ...init });
}

export function postJSON(path: string, body?: unknown) {
  return apiFetch(path, {
    method: "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function getView<T>(path: string): Promise<T> {
  const res = await apiFetch(`views/${path}`);
  if (!res.ok) throw new ApiError(res.status, `Request failed (${res.status})`);
  return (await res.json()) as T;
}

export const viewKey = (path: string) => ["view", path] as const;

/** Read a server view. 401 sends the merchant to /signup (unless `publicView`). */
export function useView<T>(path: string, opts: { publicView?: boolean } = {}) {
  const [, navigate] = useLocation();
  const q = useQuery<T, ApiError>({
    queryKey: viewKey(path),
    queryFn: () => getView<T>(path),
    retry: (count, err) => err.status >= 500 && count < 1,
  });
  const status = q.error?.status;
  useEffect(() => {
    if (status === 401 && !opts.publicView) navigate("/signup");
  }, [status, opts.publicView, navigate]);
  return q;
}

export type Merchant = {
  id: number;
  name: string;
  phone: string;
  business_name: string;
  business_type: string;
  language: string;
  is_demo: boolean;
};

export type HomeView = {
  merchant: Merchant;
  totalOwedToMe: number;
  totalIOwe: number;
  owedToMeCount: number;
  iOweCount: number;
  gapPaise: number;
  todayCard: { message: string; cta: "review_reminders" | "remind_anyway" | "tell_me" | null; gapPaise: number };
  remindCount: number;
  draftCount: number;
};

export type Party = {
  customer_id: number;
  name: string;
  phone: string | null;
  balance_paise: number;
  oldest_due_date: string | null;
};
export type LedgerView = { owedToMe: Party[]; iOwe: Party[] };

export type CustomerView = {
  customer: { id: number; name: string; kind: "customer" | "supplier" };
  balance: number;
  entries: { id: number; type: string; amount_paise: number; due_date: string | null; note: string | null; created_at: string }[];
};

export type ActivityView = {
  events: { action: string; actor: string; payload: Record<string, unknown> | null; created_at: string }[];
};

export type Reminder = {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string | null;
  amount_paise: number;
  reason: string;
  message: string;
  status: "draft" | "approved" | string;
  pay_token: string | null;
  payment_url: string | null;
};
export type RemindersView = { reminders: Reminder[]; draftCount: number };

export type PayView = {
  business_name: string;
  customer_name: string;
  firstName: string;
  amount_paise: number;
  status: string;
  payment_url: string | null;
  isTest: boolean;
  qrDataUrl: string | null;
};

export type AdminView = {
  merchants: { id: number; name: string; business_name: string; created_at: string }[];
  entriesBySource: { source: string; count: number }[];
  reminderCounts: { status: string; count: number }[];
  paymentsCount: number;
  agentEventsCount: number;
};
