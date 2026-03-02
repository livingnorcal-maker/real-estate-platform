"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@/hooks/useUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionStatusBadge } from "@/components/transactions/TransactionStatusBadge";
import { TransactionTimeline } from "@/components/transactions/TransactionTimeline";
import { MilestoneChecklist } from "@/components/transactions/MilestoneChecklist";
import { ProviderSelector } from "@/components/providers/ProviderSelector";
import { EarnestMoneyPayment } from "@/components/transactions/EarnestMoneyPayment";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Calendar, DollarSign, User } from "lucide-react";
import type { ServiceProvider } from "@/types/database";

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchTransaction = useCallback(() => {
    fetch(`/api/transactions/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.id) setTransaction(data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user) fetchTransaction();
  }, [user, fetchTransaction]);

  async function assignProvider(
    field: "escrow_provider_id" | "title_provider_id",
    provider: ServiceProvider
  ) {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: provider.id }),
      });

      if (!res.ok) throw new Error("Failed to assign provider");

      toast.success(`${provider.name} assigned`);
      fetchTransaction();
    } catch {
      toast.error("Failed to assign provider");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Transaction not found.</p>
      </div>
    );
  }

  const isBuyer = transaction.buyer_id === user?.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {transaction.listing?.title || "Transaction"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {transaction.listing?.address_line1},{" "}
            {transaction.listing?.city}, {transaction.listing?.state}
          </p>
        </div>
        <TransactionStatusBadge status={transaction.status} />
      </div>

      {/* Key Info */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" />
              <span>Offer Price</span>
            </div>
            <p className="text-xl font-bold">
              ${(transaction.offer?.offer_price / 100).toLocaleString()}
            </p>
            {transaction.offer?.earnest_money > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Earnest: $
                {(transaction.offer.earnest_money / 100).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="h-4 w-4" />
              <span>Closing Date</span>
            </div>
            <p className="text-xl font-bold">
              {transaction.closing_date
                ? new Date(transaction.closing_date).toLocaleDateString()
                : "Not set"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <User className="h-4 w-4" />
              <span>{isBuyer ? "Seller" : "Buyer"}</span>
            </div>
            <p className="text-xl font-bold">
              {isBuyer
                ? transaction.seller?.full_name || "Seller"
                : transaction.buyer?.full_name || "Buyer"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isBuyer
                ? transaction.seller?.email
                : transaction.buyer?.email}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Providers */}
      <Card>
        <CardHeader>
          <CardTitle>Service Providers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Escrow Company</p>
              <p className="text-sm text-muted-foreground">
                {transaction.escrow_provider?.name || "Not selected"}
              </p>
            </div>
            <ProviderSelector
              providerType="escrow"
              currentProviderId={transaction.escrow_provider_id}
              onSelect={(p) => assignProvider("escrow_provider_id", p)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Title Company</p>
              <p className="text-sm text-muted-foreground">
                {transaction.title_provider?.name || "Not selected"}
              </p>
            </div>
            <ProviderSelector
              providerType="title"
              currentProviderId={transaction.title_provider_id}
              onSelect={(p) => assignProvider("title_provider_id", p)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Earnest Money Payment */}
      {transaction.offer?.earnest_money > 0 && (
        <EarnestMoneyPayment
          transactionId={transaction.id}
          earnestAmount={transaction.offer.earnest_money}
          paymentStatus={
            transaction.payments?.find(
              (p: any) => p.status === "succeeded"
            )
              ? "succeeded"
              : transaction.payments?.find(
                  (p: any) => p.status === "refunded"
                )
              ? "refunded"
              : transaction.payments?.length > 0
              ? "pending"
              : "none"
          }
          isBuyer={isBuyer}
          onPaymentComplete={fetchTransaction}
        />
      )}

      {/* Timeline + Milestones */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionTimeline milestones={transaction.milestones || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <MilestoneChecklist
              milestones={transaction.milestones || []}
              transactionId={transaction.id}
              onUpdate={fetchTransaction}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
