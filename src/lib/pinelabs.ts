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
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  if (mode() === "stub") {
    return {
      paymentUrl: `${appUrl}/api/pay/${payToken}/stub`,
      paymentRef: `stub_${input.reference}`,
    };
  }

  // TODO(event): wire up Pine Labs payment-link API with real docs from the event.
  // Use input.amountPaise, input.reference as the order reference, input.customerName, input.merchantName.
  throw new Error(`PINELABS_MODE=${mode()} is not implemented yet — paste the Pine Labs docs to wire it up.`);
}

/** In stub mode, any webhook call for a known reminder is trusted. Live/test mode: TODO(event) verify Pine Labs signature. */
export function verifyWebhook(_payload: unknown, _signature: string | null): boolean {
  if (mode() === "stub") return true;
  // TODO(event): verify the real Pine Labs webhook signature.
  return false;
}
