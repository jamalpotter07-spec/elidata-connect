// Telegram notification helper. Silently no-ops if the connector isn't set up.
// Requires LOVABLE_API_KEY (auto) + TELEGRAM_API_KEY (from Telegram connector)
// + TELEGRAM_ADMIN_CHAT_ID (your personal chat id from @userinfobot).

const GATEWAY = "https://connector-gateway.lovable.dev/telegram";

export async function notifyAdmin(text: string) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const tgKey = process.env.TELEGRAM_API_KEY;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!lovableKey || !tgKey || !chatId) {
    console.log("[notifyAdmin] Telegram not configured, skipping:", text);
    return;
  }
  try {
    const res = await fetch(`${GATEWAY}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": tgKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    if (!res.ok) {
      console.error("[notifyAdmin] Telegram error:", res.status, await res.text());
    }
  } catch (e) {
    console.error("[notifyAdmin] failed:", e);
  }
}
