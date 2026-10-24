import { ensureSchema } from "@/lib/db";
import { checkAgentAuth } from "@/lib/agentAuth";
import { getCustomerBalances, getSupplierDues } from "@/lib/ledger";
import { pickCustomers } from "@/lib/collections";

export async function GET(req: Request) {
  await ensureSchema();
  if (!checkAgentAuth(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const merchantId = Number(url.searchParams.get("merchant_id"));
  if (!merchantId) return Response.json({ error: "merchant_id required" }, { status: 400 });

  const [owedToMe, iOwe, picks] = await Promise.all([
    getCustomerBalances(merchantId),
    getSupplierDues(merchantId),
    pickCustomers(merchantId),
  ]);

  const owedOutPaise = iOwe.reduce((sum, r) => sum + Number(r.balance_paise), 0);
  const expectedInPaise = picks.reduce((sum, p) => sum + Math.round(p.amountPaise * p.likelihood), 0);

  return Response.json({
    open_dues: owedToMe.map((r) => ({
      customer_id: r.customer_id,
      name: r.name,
      balance_paise: Number(r.balance_paise),
      oldest_due_date: r.oldest_due_date,
    })),
    supplier_dues_paise: owedOutPaise,
    gap_paise: owedOutPaise - expectedInPaise,
    suggested_picks: picks,
  });
}
