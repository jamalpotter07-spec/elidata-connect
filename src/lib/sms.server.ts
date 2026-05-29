// Arkesel SMS receipts — silently no-ops until ARKESEL_API_KEY is set.
// Docs: https://developers.arkesel.com/

const ARKESEL_URL = "https://sms.arkesel.com/api/v2/sms/send";

function normalizeGhPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (/^0\d{9}$/.test(digits)) return "233" + digits.slice(1);
  if (/^233\d{9}$/.test(digits)) return digits;
  return null;
}

export async function sendSms(to: string, message: string): Promise<void> {
  const apiKey = process.env.ARKESEL_API_KEY;
  const sender = (process.env.ARKESEL_SENDER_ID || "EliData").slice(0, 11);
  if (!apiKey) {
    console.log("[sms] ARKESEL_API_KEY not set — skipping:", to, message.slice(0, 60));
    return;
  }
  const phone = normalizeGhPhone(to);
  if (!phone) {
    console.warn("[sms] invalid phone:", to);
    return;
  }
  try {
    const res = await fetch(ARKESEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify({ sender, message, recipients: [phone] }),
    });
    if (!res.ok) console.error("[sms] arkesel error:", res.status, await res.text());
  } catch (e) {
    console.error("[sms] failed:", e);
  }
}

export function deliveredSms(opts: {
  phone: string;
  network: string;
  dataMb: number;
  orderId: string;
}) {
  const gb = (opts.dataMb / 1024).toFixed(opts.dataMb % 1024 ? 1 : 0);
  return sendSms(
    opts.phone,
    `EliData: ${gb}GB ${opts.network} delivered to ${opts.phone}. Ref ${opts.orderId.slice(0, 8)}. Thank you!`,
  );
}
