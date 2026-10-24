const hits = new Map<string, number[]>();

/** Simple in-memory sliding-window limiter. Resets on server restart — fine for a single-instance demo. */
export function rateLimited(key: string, maxPerMinute: number): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);
  if (recent.length >= maxPerMinute) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}
