import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionStatusBadge } from "./TransactionStatusBadge";
import { Calendar, DollarSign } from "lucide-react";

interface TransactionCardProps {
  transaction: {
    id: string;
    status: string;
    closing_date: string | null;
    created_at: string;
    buyer_id: string;
    seller_id: string;
    listing: {
      title: string;
      address_line1: string;
      city: string;
      state: string;
      price: number;
    };
    offer: {
      offer_price: number;
      earnest_money: number;
    };
  };
  userId: string;
}

export function TransactionCard({ transaction, userId }: TransactionCardProps) {
  const role = transaction.buyer_id === userId ? "Buyer" : "Seller";

  return (
    <Link href={`/dashboard/transactions/${transaction.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-lg leading-snug truncate">
                {transaction.listing.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {transaction.listing.address_line1}, {transaction.listing.city},{" "}
                {transaction.listing.state}
              </p>
            </div>
            <TransactionStatusBadge status={transaction.status} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>
                ${(transaction.offer.offer_price / 100).toLocaleString()}
              </span>
            </div>
            {transaction.closing_date && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Close:{" "}
                  {new Date(transaction.closing_date).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="ml-auto text-xs bg-muted px-2 py-0.5 rounded">
              {role}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
