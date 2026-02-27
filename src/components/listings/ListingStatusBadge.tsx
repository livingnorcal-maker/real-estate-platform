import { Badge } from "@/components/ui/badge";

const statusStyles: Record<string, string> = {
  active: "bg-green-100 text-green-800 hover:bg-green-100",
  pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  sold: "bg-red-100 text-red-800 hover:bg-red-100",
  withdrawn: "bg-gray-100 text-gray-800 hover:bg-gray-100",
};

export function ListingStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={statusStyles[status] || ""}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
