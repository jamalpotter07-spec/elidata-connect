// Paystack payment initialization server helper.
// Called by createPaystackTransaction to initialize a payment session,
// store the reference on the order before redirecting, and return the auth URL.

export type PaystackInitResult =
  | { ok: true; authorizationUrl: string; reference: string }
  | { ok: false; error: string };

export async function initializePaystackTransaction(params: {
  amountGhs: number;
  email: string;
  orderId: string;
  callbackUrl: string;
}): Promise<PaystackInitResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return { ok: false, error: "PAYSTACK_SECRET_KEY not configured" };
  }

  // Paystack accepts amounts in kobo (pesewa) — multiply GHS by 100.
  const amountPesewas = Math.round(params.amountGhs * 100);
  const reference = `ELI-${params.orderId.slice(0, 8)}-${Date.now()}`;

  try {
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: params.email,
        amount: amountPesewas,
        currency: "GHS",
        reference,
        callback_url: params.callbackUrl,
        metadata: { order_id: params.orderId },
      }),
    });

    const json = await res.json() as any;
    if (!json.status) {
      return { ok: false, error: json.message ?? "Paystack initialization failed" };
    }

    return {
      ok: true,
      authorizationUrl: json.data.authorization_url as string,
      reference: json.data.reference as string,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Network error reaching Paystack" };
  }
}
