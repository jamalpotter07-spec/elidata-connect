// Mobigh data-bundle reseller adapter.
// Base URL: https://mobigh.com/api/external/v1 — Bearer token auth.

export type FulfillInput = {
  network: "MTN" | "Telecel" | "AT";
  dataMb: number;
  recipientPhone: string;
  orderId: string;
};

export type FulfillResult =
  | { ok: true; reference: string }
  | { ok: false; error: string };

const BASE = "https://mobigh.com/api/external/v1";

function mobighNetwork(n: FulfillInput["network"]): string {
  switch (n) {
    case "MTN":
      return "mtn";
    case "Telecel":
      return "telecel";
    case "AT":
      return "at";
  }
}

export async function fulfill(input: FulfillInput): Promise<FulfillResult> {
  const apiKey = process.env.MOBIGH_API_KEY;
  if (!apiKey) {
    console.error("MOBIGH_API_KEY is not configured");
    return { ok: false, error: "Reseller API key not configured" };
  }

  try {
    // Mobigh's `volume` is in MB but uses 1000 MB = 1 GB (decimal),
    // while our catalog stores data_mb in 1024-based MB. Convert before sending.
    const mobighVolume = Math.round((input.dataMb / 1024) * 1000);

    const res = await fetch(`${BASE}/purchase`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        phone: input.recipientPhone,
        volume: mobighVolume,
        network: mobighNetwork(input.network),
      }),
    });

    const body = await res.text();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(body);
    } catch {
      // non-JSON
    }

    if (!res.ok || parsed.status === "error") {
      const msg =
        typeof parsed.message === "string"
          ? parsed.message
          : `Mobigh API error ${res.status}`;
      console.error("Mobigh purchase error:", res.status, body);
      return { ok: false, error: msg };
    }

    const data = (parsed.data as Record<string, unknown> | undefined) ?? {};
    const ref =
      typeof data.reference === "string"
        ? data.reference
        : `MBG-${input.orderId.slice(0, 8)}-${Date.now()}`;

    return { ok: true, reference: ref };
  } catch (err) {
    console.error("Mobigh network error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
