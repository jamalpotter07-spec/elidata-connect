// Arkesel SMS receipts — silently no-ops until ARKESEL_API_KEY is set.
// Docs: https://developers.arkesel.com/

const ARKESEL_URL = "https://sms.arkesel.com/api/v2/sms/send";

function normalizeGhPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (/^0\d{9}$/.test(digits)) return "233" + digits.slice(1);
  if (/^233\d{9}$/.test(digits)) return digits;
  return null;
}

// Sender ID per network — mirrors the short alpha sender each Ghanaian
// telecom uses for native bundle-delivery notifications. Defaults can be
// overridden with ARKESEL_SENDER_ID_* env vars (must be ≤11 chars and pre-
// registered with Arkesel).
function senderFor(network: string): string {
  const n = network.toUpperCase();
  if (n === "MTN") return (process.env.ARKESEL_SENDER_ID_MTN || "MTN").slice(0, 11);
  if (n === "TELECEL") return (process.env.ARKESEL_SENDER_ID_TELECEL || "Telecel").slice(0, 11);
  if (n === "AT") return (process.env.ARKESEL_SENDER_ID_AT || "AirtelTigo").slice(0, 11);
  return (process.env.ARKESEL_SENDER_ID || "EliData").slice(0, 11);
}

export async function sendSms(
  to: string,
  message: string,
  opts?: { sender?: string },
): Promise<void> {
  const apiKey = process.env.ARKESEL_API_KEY;
  const sender = (opts?.sender || process.env.ARKESEL_SENDER_ID || "EliData").slice(0, 11);
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

// Format the data volume the way the carrier displays it in real SMS.
// Mobigh (and the Ghanaian carriers) bill 1GB = 1000MB.
function formatVolume(dataMb: number): string {
  if (dataMb >= 1000) {
    const gb = dataMb / 1000;
    return Number.isInteger(gb) ? `${gb}GB` : `${gb.toFixed(2).replace(/\.?0+$/, "")}GB`;
  }
  return `${dataMb}MB`;
}

function maskedPhone(phone: string): string {
  // 0241234567 → 024****4567 (matches the style of carrier confirmations)
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 10) return digits.slice(0, 3) + "****" + digits.slice(-3);
  return phone;
}

// Build the tracking link for an order, if PUBLIC_APP_URL is configured.
// Silently omitted from the SMS (not a placeholder/broken link) when unset,
// mirroring how sendSms() silently no-ops without ARKESEL_API_KEY.
function trackingUrlFor(orderId: string): string | null {
  const base = process.env.PUBLIC_APP_URL;
  if (!base) return null;
  return `${base.replace(/\/+$/, "")}/track/${orderId}`;
}

// Build the carrier-style delivery SMS. These mimic the wording each
// Ghanaian network uses when a bundle is credited to a number, with an
// optional tracking link appended as its own line.
function deliveryMessage(
  network: string,
  dataMb: number,
  phone: string,
  trackingUrl: string | null,
): string {
  const vol = formatVolume(dataMb);
  const masked = maskedPhone(phone);
  const n = network.toUpperCase();
  let base: string;
  if (n === "MTN") {
    base = `Dear Customer, your data bundle of ${vol} has been successfully credited to ${masked}. Dial *138# to check your balance. Thank you for choosing MTN.`;
  } else if (n === "TELECEL") {
    base = `Dear Telecel Customer, ${vol} data bundle has been credited to ${masked}. Dial *124# to check your data balance. Thank you for choosing Telecel Ghana.`;
  } else if (n === "AT") {
    base = `Hi, ${vol} data bundle has been credited to your AirtelTigo line ${masked}. Dial *134# to check your balance. Enjoy!`;
  } else {
    base = `Your ${vol} ${network} data bundle has been credited to ${masked}. Thank you.`;
  }
  return trackingUrl ? `${base} Track: ${trackingUrl}` : base;
}

export function deliveredSms(opts: {
  phone: string;
  network: string;
  dataMb: number;
  orderId: string;
}) {
  const trackingUrl = trackingUrlFor(opts.orderId);
  return sendSms(
    opts.phone,
    deliveryMessage(opts.network, opts.dataMb, opts.phone, trackingUrl),
    { sender: senderFor(opts.network) },
  );
}
