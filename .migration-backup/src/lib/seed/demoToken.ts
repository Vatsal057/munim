import crypto from "node:crypto";

export function demoSessionToken(slug: string): string {
  return "demo-" + crypto.createHash("sha256").update(`munim-demo-${slug}`).digest("hex").slice(0, 32);
}

export const PERSONA_SLUGS = ["ramesh", "sunita", "meena", "anwar", "suresh"] as const;
