"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { TransactionCard } from "@/components/transactions/TransactionCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsPage() {
  const { user } = useUser();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    fetch("/api/transactions")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTransactions(data);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Transactions</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Transactions</h1>

      {transactions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">
            No transactions yet. Transactions are created automatically when an
            offer is accepted.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <TransactionCard
              key={tx.id}
              transaction={tx}
              userId={user!.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
