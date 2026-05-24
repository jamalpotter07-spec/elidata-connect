import { Badge } from "@/components/ui/badge";

const map: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
  paid: { label: "Paid", className: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  processing: { label: "Processing", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  delivered: { label: "Delivered", className: "bg-green-500/15 text-green-700 dark:text-green-300" },
  failed: { label: "Failed", className: "bg-destructive/15 text-destructive" },
  refunded: { label: "Refunded", className: "bg-muted text-muted-foreground" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return <Badge className={s.className} variant="outline">{s.label}</Badge>;
}

export function NetworkBadge({ network }: { network: string }) {
  const color =
    network === "MTN"
      ? "bg-[color:var(--mtn)] text-black"
      : network === "Telecel"
        ? "bg-[color:var(--telecel)] text-white"
        : "bg-[color:var(--at)] text-white";
  return <Badge className={color}>{network}</Badge>;
}
