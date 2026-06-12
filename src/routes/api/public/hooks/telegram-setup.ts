// One-shot helper to register the Telegram webhook with Telegram's API.
// Visit this URL in a browser once (GET): it points Telegram at /api/public/hooks/telegram
// on the same host you're viewing it from. Returns Telegram's JSON response so you can
// confirm `"ok": true`.
//
//   GET  /api/public/hooks/telegram-setup           → auto-detects host from request
//   GET  /api/public/hooks/telegram-setup?url=…     → override webhook URL explicitly
//   GET  /api/public/hooks/telegram-setup?info=1    → just call getWebhookInfo (debug)
//   GET  /api/public/hooks/telegram-setup?delete=1  → deleteWebhook (revert)

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/telegram-setup")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
          return Response.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 500 });
        }
        const u = new URL(request.url);
        const base = `https://api.telegram.org/bot${token}`;

        if (u.searchParams.get("info")) {
          const r = await fetch(`${base}/getWebhookInfo`);
          return new Response(await r.text(), { headers: { "Content-Type": "application/json" } });
        }
        if (u.searchParams.get("delete")) {
          const r = await fetch(`${base}/deleteWebhook`);
          return new Response(await r.text(), { headers: { "Content-Type": "application/json" } });
        }

        const override = u.searchParams.get("url");
        const webhook = override ?? `${u.origin}/api/public/hooks/telegram`;
        const r = await fetch(`${base}/setWebhook`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: webhook,
            allowed_updates: ["message", "edited_message"],
          }),
        });
        const body = await r.text();
        return new Response(
          JSON.stringify({ registered_url: webhook, telegram: safeJson(body) }, null, 2),
          { headers: { "Content-Type": "application/json" }, status: r.ok ? 200 : 500 },
        );
      },
    },
  },
});

function safeJson(s: string) { try { return JSON.parse(s); } catch { return s; } }
