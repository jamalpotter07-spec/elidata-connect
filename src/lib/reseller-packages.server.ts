// Helpers for the Mobigh /packages and /balance endpoints, PLUS Hubnet's
// /check_balance endpoint.
//
// HYBRID SETUP (deliberate): Mobigh stays connected for wholesale price
// syncing ONLY — Hubnet has no equivalent "list packages" endpoint to sync
// from. Hubnet is the live fulfillment provider (see reseller.server.ts);
// Mobigh is now purely a pricing-catalog reference.

const MOBIGH_BASE = "https://mobigh.com/api/external/v1";
const HUBNET_BASE = "https://console.hubnet.app/live/api/context/business/transaction";

export type MobighPackage = { network: string; volume: number; price: number };

export async function listMobighPackages(): Promise<MobighPackage[]> {
  const apiKey = process.env.MOBIGH_API_KEY;
  if (!apiKey) throw new Error("MOBIGH_API_KEY not configured");
  const res = await fetch(`${MOBIGH_BASE}/packages`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  const body = await res.text();
  let parsed: any = {};
  try { parsed = JSON.parse(body); } catch {}
  if (!res.ok || parsed.status === "error") {
    throw new Error(typeof parsed.message === "string" ? parsed.message : `Mobigh packages error ${res.status}`);
  }
  return Array.isArray(parsed.data) ? (parsed.data as MobighPackage[]) : [];
}

export async function getMobighBalance(): Promise<number> {
  const apiKey = process.env.MOBIGH_API_KEY;
  if (!apiKey) throw new Error("MOBIGH_API_KEY not configured");
  const res = await fetch(`${MOBIGH_BASE}/balance`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  const body = await res.text();
  let parsed: any = {};
  try { parsed = JSON.parse(body); } catch {}
  if (!res.ok || parsed.status === "error") {
    throw new Error(typeof parsed.message === "string" ? parsed.message : `Mobigh balance error ${res.status}`);
  }
  return Number(parsed?.data?.balance ?? 0);
}

// Map our network code → Mobigh's lowercase code. Still used by
// adminSyncMobighPrices to match catalog entries against Mobigh packages.
export function mobighNetCode(n: string): string {
  if (n === "MTN") return "mtn";
  if (n === "Telecel") return "telecel";
  if (n === "AT") return "at";
  return n.toLowerCase();
}

// ---------------------------------------------------------------------------
// Hubnet — live fulfillment wallet. This is the balance that actually
// matters for "will deliveries fail from low funds" alerting now.
//
// NOTE: Hubnet's response shape is FLAT ({status, balance, currency}), not
// nested under `data` like Mobigh's ({data:{balance}}). Copying Mobigh's
// `parsed?.data?.balance` pattern here would silently always return 0 —
// deliberately not doing that.
// ---------------------------------------------------------------------------
export async function getHubnetBalance(): Promise<number> {
  const apiKey = process.env.HUBNET_API_KEY;
  if (!apiKey) throw new Error("HUBNET_API_KEY not configured");
  const res = await fetch(`${HUBNET_BASE}/check_balance`, {
    headers: { token: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  const body = await res.text();
  let parsed: any = {};
  try { parsed = JSON.parse(body); } catch {}
  if (!res.ok || parsed.status !== true) {
    throw new Error(typeof parsed.message === "string" ? parsed.message : `Hubnet balance error ${res.status}`);
  }
  return Number(parsed?.balance ?? 0);
}
