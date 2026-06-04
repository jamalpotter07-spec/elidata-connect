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

function mobighNetwork(n: FulfillInput["network"]): number {
  // Mobigh network IDs — common mapping for Ghana resellers
  switch (n) {
    case "MTN":
      return 1;
    case "Telecel":
      return 2;
    case "AT":
      return 3;
  }
}

export async function fulfill(input: FulfillInput): Promise<FulfillResult> {
  const apiKey = process.env.MOBIGH_API_KEY;
  if (!apiKey) {
    console.error("MOBIGH_API_KEY is not configured");
    return { ok: false, error: "Reseller API key not configured" };
  }

  try {
    const res = await fetch(`${BASE}/data`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        network: mobighNetwork(input.network),
        phone: input.recipientPhone,
        volume: input.dataMb,
        reference: input.orderId,
      }),
    });

    const body = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(body);
    } catch {
      // non-JSON response
    }

    if (!res.ok) {
      const msg =
        typeof data.message === "string"
          ? data.message
          : `Mobigh API error ${res.status}`;
      console.error("Mobigh fulfill error:", res.status, body);
      return { ok: false, error: msg };
    }

    const ref =
      typeof data.reference === "string"
        ? data.reference
        : typeof data.id === "string"
          ? data.id
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
