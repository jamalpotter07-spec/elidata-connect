// Reseller API adapter. Currently mocked — replace `fulfill` body with real
// Datamart / Hubnet / Geosams API call when ready.

export type FulfillInput = {
  network: "MTN" | "Telecel" | "AT";
  dataMb: number;
  recipientPhone: string;
  orderId: string;
};

export type FulfillResult =
  | { ok: true; reference: string }
  | { ok: false; error: string };

export async function fulfill(input: FulfillInput): Promise<FulfillResult> {
  // TODO: replace with real reseller API call.
  await new Promise((r) => setTimeout(r, 600));
  // 95% success in mock
  if (Math.random() < 0.05) {
    return { ok: false, error: "Reseller temporarily unavailable" };
  }
  return { ok: true, reference: `MOCK-${input.orderId.slice(0, 8)}-${Date.now()}` };
}
