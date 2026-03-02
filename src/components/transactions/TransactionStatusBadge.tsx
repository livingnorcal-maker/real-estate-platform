import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  opened: { label: "Opened", variant: "outline" },
  in_progress: { label: "In Progress", variant: "default" },
  closing: { label: "Closing", variant: "secondary" },
  closed: { label: "Closed", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export function TransactionStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, variant: "outline" as const };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
