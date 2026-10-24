import { useParams } from "wouter";
import { BadgeCheck, FlaskConical, ShieldCheck, Smartphone } from "lucide-react";
import { formatINR } from "@/lib/money";
import { useView, type PayView } from "@/lib/api";
import { Logo } from "@/components/munim/ui";
import { ViewGate } from "@/components/munim/view-gate";

export default function Pay() {
  const { token } = useParams<{ token: string }>();
  const q = useView<PayView>(`pay/${token}`, { publicView: true });
  return <ViewGate q={q} rows={1}>{(d) => <PayBody d={d} />}</ViewGate>;
}

function PayBody({ d }: { d: PayView }) {
  const amount = formatINR(Number(d.amount_paise));
  const paid = d.status === "paid";
  return (
    <div className="min-h-[100dvh] px-4 py-6">
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-5">
        {d.isTest && (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-haldi bg-haldi-soft px-3 py-1 text-xs font-bold uppercase tracking-widest text-[hsl(28_60%_20%)]" data-testid="badge-test-mode">
            <FlaskConical className="h-3.5 w-3.5" /> Test mode
          </div>
        )}

        <div className="rise w-full overflow-hidden rounded-[2rem] border border-card-border bg-card shadow-xl">
          <div className="bg-ink px-6 pb-8 pt-6 text-center text-background">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-background/60">Payment to</p>
            <h1 className="mt-1 font-display text-2xl font-semibold" data-testid="text-business-name">{d.business_name}</h1>
          </div>
          <div className="-mt-4 rounded-t-[1.5rem] bg-card px-6 pb-6 pt-6 text-center">
            <p className="text-[16px] text-muted-foreground">Hi {d.firstName}, amount due:</p>
            <p className="font-num mt-1 text-5xl font-bold text-ink" data-testid="text-amount">{amount}</p>

            {paid ? (
              <div className="mt-6 flex flex-col items-center gap-2" data-testid="status-paid">
                <span className="stamp flex h-20 w-20 items-center justify-center rounded-full bg-owed-soft text-owed">
                  <BadgeCheck className="h-10 w-10" />
                </span>
                <p className="text-xl font-bold text-owed">Paid</p>
                <p className="text-sm text-muted-foreground">Thank you. Nothing more is due on this link.</p>
              </div>
            ) : (
              <div className="mt-6 flex flex-col items-center gap-5">
                {d.payment_url && (
                  <a
                    href={d.payment_url}
                    data-testid="link-pay"
                    className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-owed px-6 text-lg font-semibold text-background shadow-lg transition-transform active:scale-[0.98]"
                  >
                    <ShieldCheck className="h-5 w-5" /> Pay {amount}
                  </a>
                )}
                {d.qrDataUrl && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="rounded-2xl border border-card-border bg-background p-3">
                      <img src={d.qrDataUrl} alt="Scan to pay" className="h-48 w-48" data-testid="img-qr" />
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Smartphone className="h-3.5 w-3.5" /> Scan with any UPI app to pay from another device.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Logo size="sm" /> Sent on behalf of {d.business_name} via Munim
        </p>
      </div>
    </div>
  );
}
