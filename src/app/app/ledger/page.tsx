import { redirect } from "next/navigation";
import { ensureSchema } from "@/lib/db";
import { getMerchant } from "@/lib/session";
import { getCustomerBalances, getSupplierDues } from "@/lib/ledger";
import LedgerTabs from "./LedgerTabs";

export default async function LedgerPage() {
  await ensureSchema();
  const merchant = await getMerchant();
  if (!merchant) redirect("/signup");

  const [owedToMe, iOwe] = await Promise.all([
    getCustomerBalances(merchant.id),
    getSupplierDues(merchant.id),
  ]);

  return (
    <div className="min-h-screen max-w-sm mx-auto p-6 flex flex-col gap-6">
      <h1 className="text-xl font-bold">Ledger</h1>
      <LedgerTabs
        owedToMe={owedToMe.map((r) => ({ ...r, balance_paise: Number(r.balance_paise) }))}
        iOwe={iOwe.map((r) => ({ ...r, balance_paise: Number(r.balance_paise) }))}
      />
    </div>
  );
}
