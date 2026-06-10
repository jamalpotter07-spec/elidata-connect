// Helpers for Mobigh /packages and /balance endpoints.
const BASE = "https://mobigh.com/api/external/v1";

export type MobighPackage = { network: string; volume: number; price: number };

export async function listMobighPackages(): Promise<MobighPackage[]> {
  const apiKey = process.env.MOBIGH_API_KEY;
  if (!apiKey) throw new Error("MOBIGH_API_KEY not configured");
  const res = await fetch(`${BASE}/packages`, {
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
  const res = await fetch(`${BASE}/balance`, {
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

// Map our network code → Mobigh's lowercase code.
export function mobighNetCode(n: string): string {
  if (n === "MTN") return "mtn";
  if (n === "Telecel") return "telecel";
  if (n === "AT") return "at";
  return n.toLowerCase();
}
