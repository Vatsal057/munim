export function checkAgentAuth(req: Request): boolean {
  const auth = req.headers.get("authorization");
  const expected = process.env.AGENT_API_KEY;
  if (!expected) return false;
  return auth === `Bearer ${expected}`;
}
