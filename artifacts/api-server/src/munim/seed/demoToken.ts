import crypto from "node:crypto";

export function demoSessionToken(slug: string): string {
  return "demo-" + crypto.createHash("sha256").update(`munim-demo-${slug}`).digest("hex").slice(0, 32);
}

export const PERSONA_SLUGS = ["ramesh", "sunita", "meena", "anwar", "suresh"] as const;

/** Seeded phone per persona (see personas/*.json). Lets a demo shop be found even if its token was overwritten. */
export const PERSONA_PHONES: Record<(typeof PERSONA_SLUGS)[number], string> = {
  ramesh: "9000000001",
  sunita: "9000000002",
  meena: "9000000003",
  anwar: "9000000004",
  suresh: "9000000005",
};
