export type CreatePaymentLinkInput = {
  amountPaise: number;
  reference: string;
  customerName: string;
  merchantName: string;
};

export type CreatePaymentLinkResult = {
  paymentUrl: string;
  paymentRef: string;
};

function mode(): "stub" | "test" | "live" {
  return (process.env.PINELABS_MODE as "stub" | "test" | "live") || "stub";
}

export async function createPaymentLink(
  input: CreatePaymentLinkInput,
  payToken: string
): Promise<CreatePaymentLinkResult> {
  const replitDomain = process.env.REPLIT_DOMAINS?.split(",")[0];
  const appUrl = process.env.APP_URL || (replitDomain ? `https://${replitDomain}` : "http://localhost:3000");

  if (mode() === "stub") {
    return {
      paymentUrl: `${appUrl}/api/pay/${payToken}/stub`,
      paymentRef: `stub_${input.reference}`,
    };
  }

  // Docs: https://www.pinelabs.com/docs/online-payments/use-cases/accept-payments-via-payment-links
  const res = await plFetch("/api/pay/v1/payment-links", {
    method: "POST",
    body: JSON.stringify({
      // Unique per approval: a re-approved reminder must not collide with an older link.
      merchant_payment_link_reference: `munim-${input.reference}-${Date.now()}`,
      payment_link_amount: { value: Number(input.amountPaise), currency: "INR" }, // pg returns bigint as string
      description: `${input.merchantName}: dues from ${input.customerName}`.slice(0, 100),
      customer: { first_name: input.customerName.split(" ")[0] },
      callback_url: `${appUrl}/p/${payToken}`,
    }),
  });
  if (!res.payment_link_url || !res.payment_link_id) {
    throw new Error(`Pine Labs payment-link response missing url/id: ${JSON.stringify(res).slice(0, 300)}`);
  }
  return { paymentUrl: String(res.payment_link_url), paymentRef: String(res.payment_link_id) };
}

/** Asks Pine Labs whether a payment link has been paid. Source of truth for webhooks and return visits. */
export async function isPaymentLinkPaid(paymentLinkId: string): Promise<boolean> {
  if (mode() === "stub") return false;
  const res = await plFetch(`/api/pay/v1/payment-links/${encodeURIComponent(paymentLinkId)}`, { method: "GET" });
  // ponytail: status names not fully documented; accept any paid-looking status, tighten once seen in UAT.
  return /PAID|CAPTURED|PROCESSED|SUCCESS|COMPLETED/i.test(String(res.status ?? res.payment_link_status ?? ""));
}

function baseUrl(): string {
  return process.env.PINELABS_BASE_URL || "https://pluraluat.v2.pinepg.in";
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  const resp = await fetch(`${baseUrl()}/api/auth/v1/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.PINELABS_CLIENT_ID,
      client_secret: process.env.PINELABS_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok || !body.access_token) throw new Error(`Pine Labs token failed (${resp.status})`);
  const ttlMs = (Number(body.expires_in) || 3000) * 1000;
  cachedToken = { value: body.access_token, expiresAt: Date.now() + ttlMs - 60_000 };
  return cachedToken.value;
}

async function plFetch(path: string, init: { method: string; body?: string }): Promise<Record<string, unknown>> {
  const resp = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: { "content-type": "application/json", authorization: `Bearer ${await accessToken()}` },
  });
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(`Pine Labs ${init.method} ${path} failed (${resp.status}): ${JSON.stringify(body).slice(0, 300)}`);
  return body;
}

/** Pulls the payment link id out of a Pine Labs webhook (ORDER_CAPTURED puts it under data). */
export function webhookPaymentLinkId(payload: unknown): string | undefined {
  const p = payload as { data?: { payment_link_id?: unknown }; payment_ref?: unknown; reference?: unknown } | null;
  const id = p?.data?.payment_link_id ?? p?.payment_ref ?? p?.reference;
  return typeof id === "string" && id ? id : undefined;
}
