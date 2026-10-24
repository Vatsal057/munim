import { logger } from "../../../lib/logger";
import { ensureSchema, query } from "@/lib/db";
import { getMerchant } from "@/lib/session";
import { parse, VisionUnavailableError, type ParseKind } from "@/lib/parser";
import { rateLimited } from "@/lib/rateLimit";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_PARSES_PER_MINUTE = 20;

export async function POST(req: Request) {
  await ensureSchema();
  const merchant = await getMerchant();
  if (!merchant) return Response.json({ error: "Not signed in" }, { status: 401 });

  if (rateLimited(`tell-parse:${merchant.id}`, MAX_PARSES_PER_MINUTE)) {
    return Response.json({ error: "Too many requests. Wait a minute and try again." }, { status: 429 });
  }

  const form = await req.formData();
  const text = form.get("text");
  const image = form.get("image");
  const kindField = form.get("kind");
  const kind: ParseKind = (typeof kindField === "string" ? kindField : "auto") as ParseKind;

  let imageBase64: string | undefined;
  let imageMime: string | undefined;
  if (image instanceof File) {
    if (image.size > MAX_IMAGE_BYTES) {
      return Response.json({ error: "Image too large (max 5MB)" }, { status: 400 });
    }
    const buf = Buffer.from(await image.arrayBuffer());
    imageBase64 = buf.toString("base64");
    imageMime = image.type || "image/jpeg";
  }

  if (!text && !imageBase64) {
    return Response.json({ error: "Nothing to parse" }, { status: 400 });
  }

  const customers = await query<{ name: string }>(
    `select name from customers where merchant_id = $1`,
    [merchant.id]
  );

  try {
    const result = await parse(
      { text: typeof text === "string" ? text : undefined, imageBase64, imageMime, kind },
      { language: merchant.language, businessType: merchant.business_type, knownNames: customers.map((c) => c.name) }
    );
    return Response.json(result);
  } catch (err) {
    if (err instanceof VisionUnavailableError) return Response.json({ error: err.message }, { status: 422 });
    logger.error({ err }, "request failed");
    return Response.json({ error: "Couldn't read that. Try again or type it." }, { status: 502 });
  }
}
