import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import { Agent } from "undici";
import dns from "node:dns";
import type { LookupFunction } from "node:net";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // We don't throw at import time in every environment (e.g. during `next build`
  // static analysis) but any actual query will fail loudly with a clear message.
  console.warn(
    "[db] DATABASE_URL is not set. Database calls will fail until it is configured."
  );
}

/**
 * Node's global fetch resolves hostnames through the OS resolver
 * (`getaddrinfo`), which can wedge on one specific hostname even when a raw
 * DNS query for that same name succeeds instantly — e.g. a stale/corrupted
 * macOS mDNSResponder cache entry, or a resolver/filter that special-cases a
 * label like "api.". Every Neon serverless-driver query routes through a
 * single control-plane host (`api.<region>.aws.neon.tech`), so a wedged
 * `getaddrinfo` entry for just that host reliably breaks *every* query with
 * a bare "fetch failed" / ConnectTimeoutError, even though the network path
 * itself is fine and `dns.resolve4`/`resolve6` (protocol-level queries, no
 * OS cache involved) answer immediately. This lookup tries those first and
 * only falls back to the normal OS resolver if they come back empty.
 */
const resilientLookup: LookupFunction = (hostname, options, callback) => {
  const wantAll = options.all === true;
  const family = options.family;

  const queries: Promise<dns.LookupAddress[]>[] = [];
  if (family !== 6) {
    queries.push(dns.promises.resolve4(hostname).then((addrs) => addrs.map((address) => ({ address, family: 4 }))));
  }
  if (family !== 4) {
    queries.push(dns.promises.resolve6(hostname).then((addrs) => addrs.map((address) => ({ address, family: 6 }))));
  }

  Promise.allSettled(queries).then((results) => {
    const addresses = results
      .filter((r): r is PromiseFulfilledResult<dns.LookupAddress[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);

    if (addresses.length === 0) {
      // Protocol-level DNS had no answer either — fall back to the normal
      // OS resolver rather than failing a request that might succeed there.
      dns.lookup(hostname, options, callback);
      return;
    }

    if (wantAll) {
      callback(null, addresses);
    } else {
      callback(null, addresses[0].address, addresses[0].family);
    }
  });
};

const neonDispatcher = new Agent({ connect: { lookup: resilientLookup } });

/**
 * Neon's serverless HTTP driver issues a plain `fetch()` per query. A free-tier
 * compute that's been idle auto-suspends, and the very first request after
 * that (or any brief network blip) can surface as a bare "fetch failed"
 * TypeError that crashes the page — even though a retry a moment later
 * succeeds every time. Wrapping the fetch with a couple of short, silent
 * retries absorbs exactly that class of transient failure, and routing
 * through `neonDispatcher` absorbs the OS-resolver class above.
 */
neonConfig.fetchFunction = async (url: string | URL | Request, options?: RequestInit) => {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fetch(url, { ...options, dispatcher: neonDispatcher } as RequestInit & { dispatcher: Agent });
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 300));
      }
    }
  }

  throw lastError;
};

const sql = neon(connectionString ?? "postgres://placeholder");

export const db = drizzle(sql, { schema });

export function isDatabaseConfigured() {
  return Boolean(connectionString);
}
