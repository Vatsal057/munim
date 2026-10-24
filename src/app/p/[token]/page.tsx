import { notFound } from "next/navigation";
import { ensureSchema, query } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { buildQrDataUrl } from "@/lib/share";

export default async function PayPage({ params }: { params: Promise<{ token: string }> }) {
  await ensureSchema();
  const { token } = await params;

  const rows = await query<{
    amount_paise: number;
    status: string;
    payment_url: string | null;
    business_name: string;
    customer_name: string;
  }>(
    `select r.amount_paise, r.status, r.payment_url, m.business_name, c.name as customer_name
     from reminders r
     join merchants m on m.id = r.merchant_id
     join customers c on c.id = r.customer_id
     where r.pay_token = $1`,
    [token]
  );
  const reminder = rows[0];
  if (!reminder) notFound();

  const isTest = (process.env.PINELABS_MODE || "stub") !== "live";
  const firstName = reminder.customer_name.split(" ")[0];
  const qrDataUrl = reminder.payment_url ? await buildQrDataUrl(reminder.payment_url) : null;

  return (
    <div className="min-h-screen max-w-sm mx-auto p-6 flex flex-col items-center gap-6 text-center">
      {isTest && (
        <div className="bg-yellow-200 text-yellow-900 text-xs font-semibold px-3 py-1 rounded-full">
          TEST MODE
        </div>
      )}

      <h1 className="text-lg font-semibold">{reminder.business_name}</h1>
      <p className="text-gray-600">Hi {firstName}, amount due:</p>
      <p className="text-4xl font-bold">{formatINR(Number(reminder.amount_paise))}</p>

      {reminder.status === "paid" ? (
        <p className="text-green-700 font-semibold text-lg">Paid ✓</p>
      ) : (
        <>
          {reminder.payment_url && (
            <a
              href={reminder.payment_url}
              className="bg-black text-white rounded-lg px-8 py-4 text-lg font-semibold w-full"
            >
              Pay {formatINR(Number(reminder.amount_paise))}
            </a>
          )}
          {qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="Scan to pay" className="w-48 h-48" />
          )}
          <p className="text-xs text-gray-400">Scan with any UPI app to pay from another device.</p>
        </>
      )}
    </div>
  );
}
