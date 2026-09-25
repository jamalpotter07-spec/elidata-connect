// Hubnet data-bundle reseller adapter (replaces Mobigh for live fulfillment).
// Base URL: https://console.hubnet.app/live/api/context/business/transaction
//
// Auth quirk: Hubnet uses a non-standard `token: Bearer <key>` HEADER NAME
// (not the usual `Authorization: Bearer <key>`). Easy to "fix" by accident
// in a future refactor — don't.
//
// SAFEGUARD — idempotent retries.
// Hubnet requires a caller-generated, globally-unique reference per
// transaction. That reference is persisted on the order BEFORE the HTTP
// request fires. If the request then times out / errors on our end, we
// genuinely don't know whether Hubnet received and processed it. So on the
// *next* call for that same order, we check Hubnet's status for the
// already-persisted reference FIRST instead of blindly submitting a new
// one — which would risk delivering (and billing) the same bundle twice.

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { randomBytes } from "crypto";

export type FulfillInput = {
  network: "MTN" | "Telecel" | "AT";
  dataMb: number;
  recipientPhone: string;
  orderId: string;
};

export type FulfillResult =
  | { ok: true; reference: string }
  | { ok: false; error: string; pending?: boolean };
// `pending: true` means "unresolved, do not count as a failed attempt and
// do not resubmit yet" — the caller (retry-failed.ts) should leave the
// order alone and let a later pass check again.

const BASE = "https://console.hubnet.app/live/api/context/business/transaction";

function hubnetNetwork(n: FulfillInput["network"]): string {
  switch (n) {
    case "MTN":
      return "mtn";
    case "Telecel":
      return "telecel";
    case "AT":
      return "at";
  }
}

// Hubnet's `volume` is decimal MB (1 GB = "1000"). Our catalog stores
// data_mb in 1024-based (binary) MB. Same conversion Mobigh needed —
// unchanged from the old adapter.
function toHubnetVolume(dataMb: number): number {
  return Math.round((dataMb / 1024) * 1000);
}

// Short, globally-unique reference. NOTE: the old Mobigh-era fallback
// pattern (`MBG-${orderId.slice(0,8)}-${Date.now()}`) is 26 characters —
// Hubnet caps references at 25 and would reject every single request.
// 16 chars here, comfortably under the limit.
function generateReference(): string {
  return `HBN-${randomBytes(6).toString("hex").toUpperCase()}`;
}

type HubnetStatus = "delivered" | "pending" | "failed" | "unknown";

function normalizeStatus(raw: string | undefined): HubnetStatus {
  const s = (raw ?? "").toLowerCase();
  if (["delivered", "success", "completed"].includes(s)) return "delivered";
  if (["pending", "processing"].includes(s)) return "pending";
  if (["failed", "cancelled"].includes(s)) return "failed";
  return "unknown";
}

// Universal, network-agnostic status lookup (Hubnet doc section 6b).
// Returns "unknown" on any ambiguity — including the status-check call
// itself failing — so the caller falls through to a safe fresh submission
// rather than getting stuck.
async function checkHubnetStatus(reference: string): Promise<HubnetStatus> {
  const apiKey = process.env.HUBNET_API_KEY;
  if (!apiKey) return "unknown";
  try {
    const res = await fetch(
      `${BASE}/check-transaction-status?reference=${encodeURIComponent(reference)}`,
      {
        headers: { token: `Bearer ${apiKey}`, Accept: "application/json" },
      },
    );
    const body = await res.text();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(body);
    } catch {
      return "unknown";
    }
    // Top-level status:false means OUR status-check call didn't succeed
    // (e.g. rate limited) — not that the transaction failed. Stay unknown.
    if (parsed.status !== true) return "unknown";
    const data = (parsed.data as Record<string, unknown> | undefined) ?? {};
    return normalizeStatus(data.status as string | undefined);
  } catch (err) {
    console.error("Hubnet status-check network error:", err);
    return "unknown";
  }
}

export async function fulfill(input: FulfillInput): Promise<FulfillResult> {
  const apiKey = process.env.HUBNET_API_KEY;
  if (!apiKey) {
    console.error("HUBNET_API_KEY is not configured");
    return { ok: false, error: "Reseller API key not configured" };
  }

  // ---- Step 1: is there an unresolved attempt already in flight? --------
  const { data: existing, error: fetchErr } = await supabaseAdmin
    .from("orders")
    .select("reseller_reference, status")
    .eq("id", input.orderId)
    .single();

  if (fetchErr) {
    console.error("Could not load order before fulfillment (continuing anyway):", fetchErr);
  }

  if (existing?.reseller_reference) {
    if (existing.status === "delivered") {
      return { ok: true, reference: existing.reseller_reference };
    }

    const status = await checkHubnetStatus(existing.reseller_reference);

    if (status === "delivered") {
      return { ok: true, reference: existing.reseller_reference };
    }
    if (status === "pending") {
      return {
        ok: false,
        error: "Still processing on Hubnet's side — will re-check next pass.",
        pending: true,
      };
    }
    // status === "failed" or "unknown" (including "no transaction found",
    // meaning the original request never actually reached Hubnet) —
    // safe to submit fresh below.
  }

  // ---- Step 2: fresh submission ------------------------------------------
  const reference = generateReference();

  // Persist BEFORE sending — this is what makes Step 1 possible on retry.
  const { error: preErr } = await supabaseAdmin
    .from("orders")
    .update({ reseller_reference: reference })
    .eq("id", input.orderId);
  if (preErr) {
    console.error("Failed to persist reference pre-flight (continuing anyway):", preErr);
  }

  try {
    const res = await fetch(`${BASE}/${hubnetNetwork(input.network)}-new-transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        token: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        phone: input.recipientPhone,
        volume: String(toHubnetVolume(input.dataMb)),
        reference,
      }),
    });

    const body = await res.text();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(body);
    } catch {
      // Non-JSON response — ambiguous, not a clean failure. Flag pending
      // so a retry checks status instead of assuming it never happened.
      console.error("Hubnet non-JSON response:", res.status, body);
      return {
        ok: false,
        error: `Hubnet returned an unreadable response (HTTP ${res.status})`,
        pending: true,
      };
    }

    // Hubnet's success signal: status:true AND message:"0000".
    // (Their own doc table mislabels the code/message columns against each
    // other — this check matches their working PHP sample, not the table.)
    const success = parsed.status === true && parsed.message === "0000";
    if (success) {
      return { ok: true, reference };
    }

    // Clean, definitive failure (duplicate ref, insufficient balance, rate
    // limited, bad request, etc.) — safe to mark failed outright.
    const msg =
      typeof parsed.message === "string" && parsed.message !== "0000"
        ? parsed.message
        : `Hubnet API error ${res.status}`;
    console.error("Hubnet purchase error:", res.status, body);
    return { ok: false, error: msg };
  } catch (err) {
    // Network/timeout error — we genuinely don't know if Hubnet received
    // and processed the request. Flag pending so retry logic checks
    // status instead of resubmitting (the double-delivery risk this whole
    // safeguard exists for).
    console.error("Hubnet network error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Network error",
      pending: true,
    };
  }
}
