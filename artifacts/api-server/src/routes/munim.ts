/**
 * Mounts Munim's original Web-standard (Request -> Response) route handlers on Express.
 * Each handler runs inside the request-cookie store so `getMerchant()` keeps working
 * exactly as it did under Next.js.
 */
import express, { Router, type IRouter, type Request as ExpressRequest, type Response as ExpressResponse } from "express";
import { requestStore, parseCookieHeader } from "../munim/requestContext";

import * as adminExport from "../munim-routes/admin/export/route";
import * as adminSeed from "../munim-routes/admin/seed/route";
import * as agentDues from "../munim-routes/agent/dues/route";
import * as agentMarkPaid from "../munim-routes/agent/mark-paid/route";
import * as agentMerchants from "../munim-routes/agent/merchants/route";
import * as agentReminders from "../munim-routes/agent/reminders/route";
import * as agentRun from "../munim-routes/agent/run/route";
import * as demoSlug from "../munim-routes/demo/[slug]/route";
import * as entries from "../munim-routes/entries/route";
import * as entryDelete from "../munim-routes/entries/[id]/delete";
import * as health from "../munim-routes/health/route";
import * as payStub from "../munim-routes/pay/[token]/stub/route";
import * as pinelabsWebhook from "../munim-routes/pinelabs/webhook/route";
import * as reminderApprove from "../munim-routes/reminders/[id]/approve/route";
import * as reminderMarkPaid from "../munim-routes/reminders/[id]/mark-paid/route";
import * as reminderQr from "../munim-routes/reminders/[id]/qr/route";
import * as reminderReject from "../munim-routes/reminders/[id]/reject/route";
import * as reminderShare from "../munim-routes/reminders/[id]/share/route";
import * as signup from "../munim-routes/signup/route";
import * as login from "../munim-routes/login/route";
import * as logout from "../munim-routes/logout/route";
import * as tellParse from "../munim-routes/tell/parse/route";
import * as tellTranscribe from "../munim-routes/tell/transcribe/route";
import * as views from "../munim-routes/views";

type WebHandler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response> | Response;

function toWebRequest(req: ExpressRequest): Request {
  const proto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0] ?? req.protocol;
  const host = (req.headers["x-forwarded-host"] as string | undefined) ?? req.headers.host ?? "localhost";
  const url = `${proto}://${host}${req.originalUrl}`;

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else headers.set(key, value);
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD" && Buffer.isBuffer(req.body) && req.body.length > 0;
  return new Request(url, {
    method: req.method,
    headers,
    body: hasBody ? new Uint8Array(req.body as Buffer) : undefined,
  });
}

async function sendWebResponse(webRes: Response, res: ExpressResponse) {
  res.status(webRes.status);
  const setCookies = webRes.headers.getSetCookie();
  webRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") return;
    res.setHeader(key, value);
  });
  if (setCookies.length > 0) res.setHeader("Set-Cookie", setCookies);
  const body = Buffer.from(await webRes.arrayBuffer());
  res.end(body);
}

function adapt(handler: WebHandler) {
  return async (req: ExpressRequest, res: ExpressResponse) => {
    try {
      const webReq = toWebRequest(req);
      const params = Promise.resolve({ ...(req.params as Record<string, string>) });
      const webRes = await requestStore.run({ cookies: parseCookieHeader(req.headers.cookie) }, () =>
        handler(webReq, { params })
      );
      await sendWebResponse(webRes, res);
    } catch (err) {
      req.log.error({ err }, "Munim route failed");
      if (!res.headersSent) res.status(500).json({ error: "Something went wrong" });
    }
  };
}

const router: IRouter = Router();

// Handlers parse their own bodies (JSON, multipart, webhook signatures), so keep the raw bytes.
const rawBody = express.raw({ type: () => true, limit: "12mb" });

router.get("/health", rawBody, adapt(health.GET as WebHandler));

router.post("/signup", rawBody, adapt(signup.POST as WebHandler));
router.post("/login", rawBody, adapt(login.POST as WebHandler));
router.post("/logout", rawBody, adapt(logout.POST as WebHandler));
router.post("/demo/:slug", rawBody, adapt(demoSlug.POST as WebHandler));
router.post("/entries", rawBody, adapt(entries.POST as WebHandler));
router.post("/entries/:id/delete", rawBody, adapt(entryDelete.POST as WebHandler));
router.post("/tell/parse", rawBody, adapt(tellParse.POST as WebHandler));
router.post("/tell/transcribe", rawBody, adapt(tellTranscribe.POST as WebHandler));

router.post("/reminders/:id/approve", rawBody, adapt(reminderApprove.POST as WebHandler));
router.post("/reminders/:id/mark-paid", rawBody, adapt(reminderMarkPaid.POST as WebHandler));
router.get("/reminders/:id/qr", rawBody, adapt(reminderQr.GET as WebHandler));
router.post("/reminders/:id/reject", rawBody, adapt(reminderReject.POST as WebHandler));
router.post("/reminders/:id/share", rawBody, adapt(reminderShare.POST as WebHandler));

router.post("/agent/run", rawBody, adapt(agentRun.POST as WebHandler));
router.get("/agent/dues", rawBody, adapt(agentDues.GET as WebHandler));
router.post("/agent/mark-paid", rawBody, adapt(agentMarkPaid.POST as WebHandler));
router.get("/agent/merchants", rawBody, adapt(agentMerchants.GET as WebHandler));
router.post("/agent/reminders", rawBody, adapt(agentReminders.POST as WebHandler));

router.get("/pay/:token/stub", rawBody, adapt(payStub.GET as WebHandler));
router.post("/pay/:token/stub", rawBody, adapt(payStub.POST as WebHandler));
router.post("/pinelabs/webhook", rawBody, adapt(pinelabsWebhook.POST as WebHandler));

router.get("/admin/export", rawBody, adapt(adminExport.GET as WebHandler));
router.post("/admin/seed", rawBody, adapt(adminSeed.POST as WebHandler));

router.get("/views/home", rawBody, adapt(views.home as WebHandler));
router.get("/views/ledger", rawBody, adapt(views.ledger as WebHandler));
router.get("/views/customers/:id", rawBody, adapt(views.customer as WebHandler));
router.get("/views/activity", rawBody, adapt(views.activity as WebHandler));
router.get("/views/reminders", rawBody, adapt(views.reminders as WebHandler));
router.get("/views/pay/:token", rawBody, adapt(views.pay as WebHandler));
router.get("/views/admin", rawBody, adapt(views.admin as WebHandler));
router.get("/views/proof", rawBody, adapt(views.proof as WebHandler));

export default router;
