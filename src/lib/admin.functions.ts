import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fulfill } from "./reseller.server";
import { notifyAdmin } from "./notify.server";
import { deliveredSms } from "./sms.server";
import { listMobighPackages, getMobighBalance, mobighNetCode } from "./reseller-packages.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

export const adminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("status, amount_ghs");
    const totalRevenue = (orders ?? [])
      .filter((o) => o.status === "paid" || o.status === "delivered")
      .reduce((s, o) => s + Number(o.amount_ghs), 0);
    const counts: Record<string, number> = {};
    for (const o of orders ?? []) counts[o.status] = (counts[o.status] ?? 0) + 1;
    return { totalRevenue, counts, totalOrders: orders?.length ?? 0 };
  });

// ---------------------------------------------------------------------------
// #9 FIX — cursor-based pagination replacing the hard 200-row limit.
// Pass `cursor` (a created_at ISO string) to fetch the next page.
// Returns `nextCursor` so the UI can request subsequent pages, plus
// `truncated: true` when the caller omitted a cursor AND there are more rows,
// so the admin sees a visible warning rather than silent data loss.
// ---------------------------------------------------------------------------
export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        cursor: z.string().datetime().optional(), // created_at of last row on previous page
        pageSize: z.number().int().min(1).max(200).default(100),
      })
      .optional()
      .transform((v) => v ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const pageSize = (data as any).pageSize ?? 100;
    const cursor   = (data as any).cursor as string | undefined;

    let q = supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(pageSize + 1); // fetch one extra to detect if there's a next page

    if (cursor) {
      q = q.lt("created_at", cursor);
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const hasMore = (rows?.length ?? 0) > pageSize;
    const orders  = hasMore ? rows!.slice(0, pageSize) : (rows ?? []);
    const nextCursor = hasMore
      ? orders[orders.length - 1].created_at
      : null;

    return {
      orders,
      nextCursor,
      // Warn the UI when this is the first page and it's already full —
      // older orders exist but weren't requested yet.
      truncated: !cursor && hasMore,
    };
  });

export const adminListBundles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("bundles")
      .select("*")
      .order("network")
      .order("sort_order")
      .order("data_mb");
    if (error) throw new Error(error.message);
    return { bundles: data ?? [] };
  });

const bundleInput = z.object({
  id: z.string().uuid().optional(),
  network: z.enum(["MTN", "Telecel", "AT"]),
  name: z.string().min(1).max(100),
  data_mb: z.number().int().positive(),
  price_ghs: z.number().positive(),
  cost_price_ghs: z.number().nonnegative().nullable().optional(),
  validity: z.string().min(1).max(50),
  active: z.boolean(),
  sort_order: z.number().int().default(0),
});

export const adminUpsertBundle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => bundleInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.id) {
      const { error } = await supabaseAdmin
        .from("bundles")
        .update(data)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { id: _ignored, ...insert } = data;
      const { error } = await supabaseAdmin.from("bundles").insert(insert);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteBundle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("bundles").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminBulkAdjustPrices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      percent: z.number().min(-90).max(500),
      network: z.enum(["MTN", "Telecel", "AT", "ALL"]).default("ALL"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const factor = 1 + data.percent / 100;
    let q = supabaseAdmin.from("bundles").select("id, cost_price_ghs, network");
    if (data.network !== "ALL") q = q.eq("network", data.network);
    const { data: rows, error: rErr } = await q;
    if (rErr) throw new Error(rErr.message);
    let updated = 0;
    let skipped = 0;
    for (const b of rows ?? []) {
      const cost = Number(b.cost_price_ghs ?? 0);
      if (!cost) { skipped++; continue; }
      const next = Math.round(cost * factor * 100) / 100;
      const { error } = await supabaseAdmin.from("bundles").update({ price_ghs: next }).eq("id", b.id);
      if (!error) updated++;
    }
    return { ok: true, updated, skipped };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, phone, created_at")
      .order("created_at", { ascending: false });
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const roleMap = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    }
    return {
      users: (profiles ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] })),
    };
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "moderator", "user"]),
        grant: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const checkAmAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

export const adminGetOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", data.orderId)
      .single();
    if (error) throw new Error(error.message);
    const { data: payments } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("order_id", data.orderId)
      .order("created_at", { ascending: false });
    return { order, payments: payments ?? [] };
  });

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      orderId: z.string().uuid(),
      status: z.enum(["pending", "paid", "processing", "delivered", "failed", "refunded"]).optional(),
      notes: z.string().max(2000).optional(),
      resellerReference: z.string().max(200).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const patch: { status?: any; notes?: string; reseller_reference?: string } = {};
    if (data.status) patch.status = data.status;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.resellerReference !== undefined) patch.reseller_reference = data.resellerReference;
    const { error } = await supabaseAdmin.from("orders").update(patch).eq("id", data.orderId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminMarkPaidManual = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      orderId: z.string().uuid(),
      note: z.string().max(500).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .select("*").eq("id", data.orderId).single();
    if (oErr || !order) throw new Error("Order not found");

    const reference = `MANUAL-${order.id.slice(0, 8)}-${Date.now()}`;
    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      reference,
      amount_ghs: order.amount_ghs,
      status: "success",
      provider: "manual-admin",
      metadata: { paid_by: context.userId, note: data.note ?? "Preordered with admin funds" },
    });
    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        status: "paid",
        paystack_reference: reference,
        notes: data.note ?? "Preordered with admin funds",
      })
      .eq("id", order.id);
    if (error) throw new Error(error.message);
    return { ok: true, reference };
  });

export const adminRetryDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ orderId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: order, error } = await supabaseAdmin
      .from("orders").select("*").eq("id", data.orderId).single();
    if (error || !order) throw new Error("Order not found");
    if (!["paid", "failed", "processing"].includes(order.status)) {
      throw new Error(`Cannot retry from status: ${order.status}`);
    }
    await supabaseAdmin.from("orders").update({ status: "processing" }).eq("id", order.id);
    const result = await fulfill({
      network: order.network as any,
      dataMb: order.data_mb,
      recipientPhone: order.recipient_phone,
      orderId: order.id,
    });
    if (result.ok) {
      await supabaseAdmin.from("orders")
        .update({ status: "delivered", reseller_reference: result.reference })
        .eq("id", order.id);
      await notifyAdmin(`🔁 <b>Retry delivered</b> ${order.network} → ${order.recipient_phone}`);
      await deliveredSms({
        phone: order.recipient_phone,
        network: order.network,
        dataMb: order.data_mb,
        orderId: order.id,
      });
      return { ok: true, status: "delivered" as const };
    }
    await supabaseAdmin.from("orders")
      .update({ status: "failed", notes: result.error }).eq("id", order.id);
    await notifyAdmin(`🔁❌ <b>Retry failed</b> ${order.network} → ${order.recipient_phone}\n${result.error}`);
    return { ok: false, status: "failed" as const, error: result.error };
  });

export const adminRefundOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ orderId: z.string().uuid(), reason: z.string().max(500).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: order, error } = await supabaseAdmin
      .from("orders").select("*").eq("id", data.orderId).single();
    if (error || !order) throw new Error("Order not found");
    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      reference: `REFUND-${order.id.slice(0, 8)}-${Date.now()}`,
      amount_ghs: -Number(order.amount_ghs),
      status: "success",
      provider: "refund",
      metadata: { refunded_by: context.userId, reason: data.reason ?? "" },
    });
    await supabaseAdmin.from("orders")
      .update({ status: "refunded", notes: `Refunded: ${data.reason ?? "no reason given"}` })
      .eq("id", order.id);
    await notifyAdmin(`💸 <b>Refund</b> GHS ${Number(order.amount_ghs).toFixed(2)} · ${order.network} → ${order.recipient_phone}\nReason: ${data.reason ?? "—"}`);
    return { ok: true };
  });

export const adminSyncMobighPrices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ marginPercent: z.number().min(0).max(500).default(20) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const packages = await listMobighPackages();
    const { data: bundles, error } = await supabaseAdmin
      .from("bundles").select("id, network, data_mb");
    if (error) throw new Error(error.message);
    const factor = 1 + data.marginPercent / 100;
    let updated = 0;
    let skipped = 0;
    for (const b of bundles ?? []) {
      const code = mobighNetCode(b.network);
      const ourGb = Math.round((b.data_mb / 1024) * 10) / 10;
      const match = packages.find(
        (p) => p.network === code && Math.round((p.volume / 1000) * 10) / 10 === ourGb,
      );
      if (!match) { skipped++; continue; }
      const cost = Number(match.price);
      const sell = Math.round(cost * factor * 100) / 100;
      const { error: upErr } = await supabaseAdmin
        .from("bundles")
        .update({ cost_price_ghs: cost, price_ghs: sell })
        .eq("id", b.id);
      if (!upErr) updated++;
    }
    await notifyAdmin(`🔄 <b>Mobigh sync</b>\nUpdated: ${updated}\nSkipped (no match): ${skipped}\nMargin: ${data.marginPercent}%`);
    return { ok: true, updated, skipped, packageCount: packages.length };
  });

export const adminMobighBalance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const balance = await getMobighBalance();
    return { balance };
  });

// ---------------------------------------------------------------------------
// #8 FIX — Profit report now subtracts refunds from revenue.
// Previously filtered to ["paid", "delivered"] which overstated revenue for
// orders that were later refunded — Mobigh data was consumed at real cost but
// the negative-amount refund payment row was never subtracted.
// Now: fetch all order IDs in range, join their payments, sum positives
// (revenue) and negatives (refunds) separately, then net off.
// ---------------------------------------------------------------------------
export const adminProfitReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      range: z.enum(["today", "7d", "30d", "all"]).default("7d"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const now = Date.now();
    const sinceMs =
      data.range === "today" ? now - 24 * 60 * 60 * 1000 :
      data.range === "7d"    ? now - 7  * 24 * 60 * 60 * 1000 :
      data.range === "30d"   ? now - 30 * 24 * 60 * 60 * 1000 :
      0;

    // Pull delivered + refunded orders so we can account for both.
    let q = supabaseAdmin
      .from("orders")
      .select("id, created_at, network, data_mb, recipient_phone, amount_ghs, status, bundle_id")
      .in("status", ["paid", "delivered", "refunded"])
      .order("created_at", { ascending: false });
    if (sinceMs > 0) q = q.gte("created_at", new Date(sinceMs).toISOString());
    const { data: orders, error } = await q;
    if (error) throw new Error(error.message);

    // Bundle cost map
    const bundleIds = Array.from(new Set((orders ?? []).map((o) => o.bundle_id).filter(Boolean)));
    const bundleMap = new Map<string, { name: string; cost: number }>();
    if (bundleIds.length) {
      const { data: bundles } = await supabaseAdmin
        .from("bundles").select("id, name, cost_price_ghs").in("id", bundleIds);
      for (const b of bundles ?? []) {
        bundleMap.set(b.id as string, { name: b.name as string, cost: Number(b.cost_price_ghs ?? 0) });
      }
    }

    // Fetch all payment rows for these orders so we can sum refunds accurately.
    // Refund rows have a negative amount_ghs and provider === "refund".
    const orderIds = (orders ?? []).map((o) => o.id);
    const refundMap = new Map<string, number>(); // order_id → total refunded (positive number)
    if (orderIds.length) {
      const { data: payments } = await supabaseAdmin
        .from("payments")
        .select("order_id, amount_ghs, provider")
        .in("order_id", orderIds)
        .eq("status", "success");
      for (const p of payments ?? []) {
        const amt = Number(p.amount_ghs);
        if (amt < 0) {
          // Negative amount = refund. Store as a positive value for subtraction.
          const prev = refundMap.get(p.order_id as string) ?? 0;
          refundMap.set(p.order_id as string, prev + Math.abs(amt));
        }
      }
    }

    let grossRevenue = 0;
    let totalRefunds = 0;
    let cost = 0;

    const sales = (orders ?? []).map((o) => {
      const b = bundleMap.get(o.bundle_id as string);
      const rev   = Number(o.amount_ghs);
      const c     = o.status === "refunded" ? 0 : (b?.cost ?? 0); // cost only incurred if delivered
      const refund = refundMap.get(o.id) ?? 0;

      grossRevenue += rev;
      totalRefunds += refund;
      cost += c;

      return {
        id: o.id,
        created_at: o.created_at,
        network: o.network,
        data_mb: o.data_mb,
        recipient_phone: o.recipient_phone,
        status: o.status,
        bundle_name: b?.name ?? null,
        revenue: rev,
        refund,
        cost: c,
        profit: rev - refund - c,
      };
    });

    const netRevenue = grossRevenue - totalRefunds;

    return {
      totals: {
        grossRevenue,
        refunds: totalRefunds,
        netRevenue,
        cost,
        profit: netRevenue - cost,
        sales: sales.length,
      },
      sales,
    };
  });

// Payment destinations summary
export const adminPaymentDestinations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      range: z.enum(["today", "7d", "30d", "all"]).default("7d"),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    return computePaymentDestinations(data.range);
  });

export async function computePaymentDestinations(range: "today" | "7d" | "30d" | "all") {
  const now = Date.now();
  const sinceMs =
    range === "today" ? now - 24 * 60 * 60 * 1000 :
    range === "7d"    ? now - 7  * 24 * 60 * 60 * 1000 :
    range === "30d"   ? now - 30 * 24 * 60 * 60 * 1000 :
    0;
  let q = supabaseAdmin
    .from("payments")
    .select("provider, status, amount_ghs, created_at")
    .eq("status", "success");
  if (sinceMs > 0) q = q.gte("created_at", new Date(sinceMs).toISOString());
  const { data: rows, error } = await q;
  if (error) throw new Error(error.message);

  const byProvider = new Map<string, { count: number; amount: number }>();
  let total = 0;
  for (const r of rows ?? []) {
    const amt = Number(r.amount_ghs);
    total += amt;
    const prev = byProvider.get(r.provider) ?? { count: 0, amount: 0 };
    prev.count += 1;
    prev.amount += amt;
    byProvider.set(r.provider, prev);
  }
  return {
    total,
    byProvider: Array.from(byProvider.entries()).map(([provider, v]) => ({
      provider,
      destination: destinationFor(provider),
      count: v.count,
      amount: v.amount,
    })),
  };
}

function destinationFor(provider: string): string {
  if (provider === "paystack") return "Paystack settlement account (live keys)";
  if (provider === "manual-admin") return "Admin/owner direct (offline payment, not banked through Paystack)";
  if (provider === "refund") return "Refund issued — outgoing to customer";
  return provider;
}

export const adminManualOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      bundleId: z.string().uuid(),
      recipientPhone: z.string().trim().min(9).max(15),
      note: z.string().max(300).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const { data: bundle, error: bErr } = await supabaseAdmin
      .from("bundles").select("*").eq("id", data.bundleId).single();
    if (bErr || !bundle) throw new Error("Bundle not found");

    const reference = `MANUAL-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: context.userId,
        bundle_id: bundle.id,
        network: bundle.network,
        data_mb: bundle.data_mb,
        recipient_phone: data.recipientPhone,
        amount_ghs: bundle.price_ghs,
        status: "paid",
        paystack_reference: reference,
        notes: `Manual order (offline customer). ${data.note ?? ""}`.trim(),
      })
      .select("*").single();
    if (oErr || !order) throw new Error(oErr?.message ?? "Could not create order");

    await supabaseAdmin.from("payments").insert({
      order_id: order.id,
      reference,
      amount_ghs: bundle.price_ghs,
      status: "success",
      provider: "manual-admin",
      metadata: { manual: true, created_by: context.userId, note: data.note ?? "" },
    });

    await supabaseAdmin.from("orders").update({ status: "processing" }).eq("id", order.id);
    const result = await fulfill({
      network: bundle.network as any,
      dataMb: bundle.data_mb,
      recipientPhone: data.recipientPhone,
      orderId: order.id,
    });

    if (result.ok) {
      await supabaseAdmin.from("orders")
        .update({ status: "delivered", reseller_reference: result.reference })
        .eq("id", order.id);
      await notifyAdmin(`✋ <b>Manual order delivered</b> ${bundle.network} ${bundle.name} → ${data.recipientPhone}`);
      await deliveredSms({
        phone: data.recipientPhone,
        network: bundle.network,
        dataMb: bundle.data_mb,
        orderId: order.id,
      });
      return { ok: true, orderId: order.id, status: "delivered" as const };
    }

    await supabaseAdmin.from("orders")
      .update({ status: "failed", notes: result.error }).eq("id", order.id);
    await notifyAdmin(`✋❌ <b>Manual order failed</b> ${bundle.network} ${bundle.name} → ${data.recipientPhone}\n${result.error}`);
    return { ok: false, orderId: order.id, status: "failed" as const, error: result.error };
  });
