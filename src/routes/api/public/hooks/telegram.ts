// Telegram bot webhook — admin-only command interface for manual orders.
// One-time setup (run in the browser after deploy, then paste the response):
//   https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<your-domain>/api/public/hooks/telegram
//
// Commands (sent as a regular Telegram message):
//   /order MTN 1 0241234567        → fulfill 1 GB MTN to that phone
//   /order Telecel 5 0501234567    → fulfill 5 GB Telecel
//   /order AT 2 0271234567 note    → optional note (trailing text)
//   /balance                       → check Mobigh wholesale balance
//   /bundles MTN                   → list active MTN bundles + prices
//   /help                          → show command list
//
// Only messages from TELEGRAM_ADMIN_CHAT_ID are accepted; everything else is ignored.

import { createFileRoute } from "@tanstack/react-router";
import { fulfill } from "@/lib/reseller.server";
import { getMobighBalance } from "@/lib/reseller-packages.server";
import { notifyAdmin } from "@/lib/notify.server";

function rangeSinceMs(range: "today" | "7d" | "30d" | "all"): number {
  const now = Date.now();
  if (range === "today") return now - 24 * 60 * 60 * 1000;
  if (range === "7d")    return now - 7  * 24 * 60 * 60 * 1000;
  if (range === "30d")   return now - 30 * 24 * 60 * 60 * 1000;
  return 0;
}

const HELP = [
  "<b>Manual order commands</b>",
  "<code>/order MTN 1 0241234567</code>  — 1 GB MTN",
  "<code>/order Telecel 5 0501234567</code>",
  "<code>/order AT 2 0271234567 note</code>",
  "<code>/balance</code>  — Mobigh wholesale balance",
  "<code>/bundles MTN</code>  — list active MTN bundles",
  "<code>/profit [today|7d|30d|all]</code>  — revenue, cost, profit",
  "<code>/payments [today|7d|30d|all]</code>  — where money was collected",
  "<code>/help</code>",
].join("\n");

function parseRange(arg?: string): "today" | "7d" | "30d" | "all" {
  const v = (arg ?? "").toLowerCase();
  if (v === "today" || v === "7d" || v === "30d" || v === "all") return v;
  return "7d";
}

function normalizeNetwork(raw: string): "MTN" | "Telecel" | "AT" | null {
  const n = raw.trim().toLowerCase();
  if (n === "mtn") return "MTN";
  if (n === "telecel" || n === "vodafone" || n === "voda") return "Telecel";
  if (n === "at" || n === "airteltigo" || n === "tigo" || n === "airtel") return "AT";
  return null;
}

async function reply(chatId: number | string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch(() => {});
}

export const Route = createFileRoute("/api/public/hooks/telegram")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const adminId = process.env.TELEGRAM_ADMIN_CHAT_ID;
        if (!adminId) return new Response("ok"); // not configured

        let update: any = {};
        try { update = await request.json(); } catch { return new Response("ok"); }
        const msg = update?.message ?? update?.edited_message;
        const chatId = msg?.chat?.id;
        const text: string = (msg?.text ?? "").trim();
        if (!chatId || !text) return new Response("ok");

        // Authorize: only the configured admin chat can run commands.
        if (String(chatId) !== String(adminId)) {
          await reply(chatId, "⛔ Not authorized.");
          return new Response("ok");
        }

        const [cmdRaw, ...args] = text.split(/\s+/);
        const cmd = cmdRaw.toLowerCase().split("@")[0]; // strip "@BotName"

        try {
          if (cmd === "/start" || cmd === "/help") {
            await reply(chatId, HELP);
            return new Response("ok");
          }

          if (cmd === "/balance") {
            const bal = await getMobighBalance();
            await reply(chatId, `💰 Mobigh balance: <b>GHS ${bal.toFixed(2)}</b>`);
            return new Response("ok");
          }

          if (cmd === "/bundles") {
            const net = args[0] ? normalizeNetwork(args[0]) : null;
            if (!net) { await reply(chatId, "Usage: <code>/bundles MTN | Telecel | AT</code>"); return new Response("ok"); }
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data } = await supabaseAdmin
              .from("bundles").select("name, data_mb, price_ghs, cost_price_ghs")
              .eq("network", net).eq("active", true).order("data_mb");
            const lines = (data ?? []).map((b: any) =>
              `${(b.data_mb / 1024).toFixed(b.data_mb % 1024 === 0 ? 0 : 1)}GB — GHS ${Number(b.price_ghs).toFixed(2)} (cost ${Number(b.cost_price_ghs ?? 0).toFixed(2)})`,
            );
            await reply(chatId, `<b>${net} active bundles</b>\n${lines.join("\n") || "—"}`);
            return new Response("ok");
          }

          if (cmd === "/profit") {
            const range = parseRange(args[0]);
            const since = rangeSinceMs(range);
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            let q = supabaseAdmin
              .from("orders")
              .select("amount_ghs, bundle_id, network, status")
              .in("status", ["paid", "delivered"]);
            if (since > 0) q = q.gte("created_at", new Date(since).toISOString());
            const { data: orders } = await q;
            const bundleIds = Array.from(new Set((orders ?? []).map((o: any) => o.bundle_id).filter(Boolean)));
            const costMap = new Map<string, number>();
            if (bundleIds.length) {
              const { data: bundles } = await supabaseAdmin
                .from("bundles").select("id, cost_price_ghs").in("id", bundleIds);
              for (const b of bundles ?? []) costMap.set(b.id as string, Number(b.cost_price_ghs ?? 0));
            }
            let revenue = 0, cost = 0;
            const byNet: Record<string, { count: number; revenue: number; profit: number }> = {};
            for (const o of orders ?? []) {
              const rev = Number(o.amount_ghs);
              const c = costMap.get(o.bundle_id as string) ?? 0;
              revenue += rev; cost += c;
              const k = o.network as string;
              byNet[k] = byNet[k] ?? { count: 0, revenue: 0, profit: 0 };
              byNet[k].count++; byNet[k].revenue += rev; byNet[k].profit += rev - c;
            }
            const lines2 = Object.entries(byNet)
              .map(([n, v]) => `• ${n}: ${v.count} · GHS ${v.revenue.toFixed(2)} rev · GHS ${v.profit.toFixed(2)} profit`)
              .join("\n");
            await reply(chatId,
              `📊 <b>Profit (${range})</b>\n` +
              `Sales: <b>${orders?.length ?? 0}</b>\n` +
              `Revenue: <b>GHS ${revenue.toFixed(2)}</b>\n` +
              `Cost: GHS ${cost.toFixed(2)}\n` +
              `<b>Profit: GHS ${(revenue - cost).toFixed(2)}</b>` +
              (lines2 ? `\n\n${lines2}` : ""),
            );
            return new Response("ok");
          }

          if (cmd === "/payments") {
            const range = parseRange(args[0]);
            const since = rangeSinceMs(range);
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            let q = supabaseAdmin
              .from("payments")
              .select("provider, amount_ghs, status")
              .eq("status", "success");
            if (since > 0) q = q.gte("created_at", new Date(since).toISOString());
            const { data: rows } = await q;
            const agg = new Map<string, { count: number; amount: number }>();
            let total = 0;
            for (const r of rows ?? []) {
              const a = Number(r.amount_ghs);
              total += a;
              const prev = agg.get(r.provider) ?? { count: 0, amount: 0 };
              prev.count++; prev.amount += a;
              agg.set(r.provider, prev);
            }
            const destFor = (p: string) =>
              p === "paystack" ? "→ Paystack settlement account" :
              p === "manual-admin" ? "→ Admin direct (offline / not via Paystack)" :
              p === "refund" ? "→ Refund out to customer" : `→ ${p}`;
            const lines3 = Array.from(agg.entries())
              .map(([p, v]) => `• <b>${p}</b> ${destFor(p)}\n   ${v.count} payments · GHS ${v.amount.toFixed(2)}`)
              .join("\n");
            await reply(chatId,
              `💳 <b>Payments (${range})</b>\n` +
              `Total collected: <b>GHS ${total.toFixed(2)}</b>` +
              (lines3 ? `\n\n${lines3}` : "\n\nNo successful payments in this range."),
            );
            return new Response("ok");
          }

          if (cmd === "/order") {
            // /order <network> <gb> <phone> [note...]
            if (args.length < 3) {
              await reply(chatId, "Usage: <code>/order MTN 1 0241234567</code>");
              return new Response("ok");
            }
            const net = normalizeNetwork(args[0]);
            if (!net) { await reply(chatId, "Unknown network. Use MTN, Telecel, or AT."); return new Response("ok"); }
            const gb = Number(args[1].replace(/gb$/i, ""));
            if (!Number.isFinite(gb) || gb <= 0) {
              await reply(chatId, "Size must be a number in GB, e.g. 1, 2, 5.");
              return new Response("ok");
            }
            const phone = args[2].trim();
            if (!/^0\d{9}$/.test(phone)) {
              await reply(chatId, "Phone must be 10 digits starting with 0, e.g. 0241234567.");
              return new Response("ok");
            }
            const note = args.slice(3).join(" ").trim() || "Telegram bot manual order";

            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            // Match active bundle by network + GB (1 GB = 1024 MB in our catalog).
            const targetMb = Math.round(gb * 1024);
            const { data: bundle } = await supabaseAdmin
              .from("bundles")
              .select("*")
              .eq("network", net)
              .eq("active", true)
              .eq("data_mb", targetMb)
              .maybeSingle();
            if (!bundle) {
              await reply(chatId, `No active ${net} ${gb}GB bundle found. Try <code>/bundles ${net}</code>.`);
              return new Response("ok");
            }

            const reference = `TG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            // We need a user_id (orders.user_id is NOT NULL). Use the first admin.
            const { data: admin } = await supabaseAdmin
              .from("user_roles").select("user_id").eq("role", "admin").limit(1).maybeSingle();
            if (!admin) {
              await reply(chatId, "No admin user in DB to attribute the order to.");
              return new Response("ok");
            }

            const { data: order, error: oErr } = await supabaseAdmin
              .from("orders")
              .insert({
                user_id: admin.user_id,
                bundle_id: bundle.id,
                network: bundle.network,
                data_mb: bundle.data_mb,
                recipient_phone: phone,
                amount_ghs: bundle.price_ghs,
                status: "processing",
                paystack_reference: reference,
                notes: `Telegram bot: ${note}`,
              })
              .select("*").single();
            if (oErr || !order) {
              await reply(chatId, `❌ Could not create order: ${oErr?.message ?? "unknown"}`);
              return new Response("ok");
            }
            await supabaseAdmin.from("payments").insert({
              order_id: order.id,
              reference,
              amount_ghs: bundle.price_ghs,
              status: "success",
              provider: "manual-admin",
              metadata: { source: "telegram-bot", note },
            });

            await reply(chatId, `⏳ Fulfilling ${net} ${gb}GB → ${phone} …`);
            const result = await fulfill({
              network: bundle.network as any,
              dataMb: bundle.data_mb,
              recipientPhone: phone,
              orderId: order.id,
            });
            if (result.ok) {
              await supabaseAdmin.from("orders")
                .update({ status: "delivered", reseller_reference: result.reference })
                .eq("id", order.id);
              await reply(chatId, `✅ <b>Delivered</b>\n${net} ${gb}GB → ${phone}\nGHS ${Number(bundle.price_ghs).toFixed(2)}\nRef: <code>${result.reference}</code>`);
            } else {
              await supabaseAdmin.from("orders")
                .update({ status: "failed", notes: result.error }).eq("id", order.id);
              await reply(chatId, `❌ <b>Failed</b>: ${result.error}`);
              await notifyAdmin(`✋❌ Telegram order failed ${net} ${gb}GB → ${phone}\n${result.error}`);
            }
            return new Response("ok");
          }

          await reply(chatId, `Unknown command. ${HELP}`);
          return new Response("ok");
        } catch (e: any) {
          await reply(chatId, `❌ Error: ${e?.message ?? String(e)}`);
          return new Response("ok");
        }
      },
      GET: async () => new Response("Telegram webhook is live. POST only."),
    },
  },
});
