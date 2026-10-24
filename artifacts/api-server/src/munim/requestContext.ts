import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Replaces Next.js `cookies()` from `next/headers`: the Express adapter runs each
 * Munim handler inside this store so library code can read the request cookies.
 */
type RequestStore = { cookies: Map<string, string> };

export const requestStore = new AsyncLocalStorage<RequestStore>();

export function parseCookieHeader(header: string | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!header) return map;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name) map.set(name, decodeURIComponent(value));
  }
  return map;
}

export async function cookies() {
  const store = requestStore.getStore();
  const jar = store?.cookies ?? new Map<string, string>();
  return {
    get(name: string): { name: string; value: string } | undefined {
      const value = jar.get(name);
      return value === undefined ? undefined : { name, value };
    },
  };
}
