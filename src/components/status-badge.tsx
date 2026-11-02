import { Badge } from "@/components/ui/badge";

// Every colour comes from a theme token, so badges stay readable in light and dark.
const map: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
  paid: { label: "Paid", className: "bg-info-soft text-info" },
  processing: { label: "Processing", className: "bg-warning-soft text-warning" },
  delivered: { label: "Delivered", className: "bg-success-soft text-success" },
  failed: { label: "Failed", className: "bg-danger-soft text-danger" },
  refunded: { label: "Refunded", className: "bg-muted text-muted-foreground" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = map[status] ?? { label: status, className: "bg-muted text-muted-foreground" };
  return (
    <Badge className={`border-transparent ${s.className}`} variant="outline">
      {s.label}
    </Badge>
  );
}

export function NetworkBadge({ network }: { network: string }) {
  const cls =
    network === "MTN"
      ? "net-badge-mtn"
      : network === "Telecel"
        ? "net-badge-telecel"
        : "net-badge-at";
  const label = network === "MTN" || network === "Telecel" ? network : "Airtel-Tigo";
  return <span className={cls}>{label}</span>;
}
