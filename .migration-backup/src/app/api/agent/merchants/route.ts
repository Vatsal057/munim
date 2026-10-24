import { ensureSchema, query } from "@/lib/db";
import { checkAgentAuth } from "@/lib/agentAuth";

export async function GET(req: Request) {
  await ensureSchema();
  if (!checkAgentAuth(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const includeDemo = url.searchParams.get("include_demo") === "1";

  const merchants = await query<{
    id: number;
    name: string;
    business_name: string;
    last_activity: string | null;
  }>(
    `select m.id, m.name, m.business_name,
       (select max(e.created_at) from events e where e.merchant_id = m.id) as last_activity
     from merchants m
     where ($1 or m.is_demo = false)
     order by m.created_at desc`,
    [includeDemo]
  );

  return Response.json({ merchants });
}
