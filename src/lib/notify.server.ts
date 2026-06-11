// Telegram notification helper.
// Uses a raw bot token (TELEGRAM_BOT_TOKEN) and admin chat id (TELEGRAM_ADMIN_CHAT_ID).
// Silently no-ops if either is missing.

export async function notifyAdmin(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) {
    console.log("[notifyAdmin] Telegram not configured, skipping:", text);
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    if (!res.ok) {
      console.error("[notifyAdmin] Telegram error:", res.status, await res.text());
    }
  } catch (e) {
    console.error("[notifyAdmin] failed:", e);
  }
}
