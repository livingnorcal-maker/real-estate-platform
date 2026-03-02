"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, formatDate } from "@/lib/utils";
import { OfferStatusBadge } from "@/components/offers/OfferStatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Offer } from "@/types/database";

interface OfferWithListing extends Offer {
  listings: {
    id: string;
    title: string;
    city: string;
    state: string;
    price: number;
  };
}

export default function MyOffersPage() {
  const { user } = useUser();
  const [offers, setOffers] = useState<OfferWithListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchOffers() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("offers")
          .select("*, listings(id, title, city, state, price)")
          .eq("buyer_id", user!.id)
          .order("created_at", { ascending: false });

        setOffers((data || []) as OfferWithListing[]);
      } catch {
        toast.error("Failed to load offers");
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();
  }, [user]);

  async function handleWithdraw(offerId: string) {
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      setOffers((prev) =>
        prev.map((o) =>
          o.id === offerId ? { ...o, status: "withdrawn" } : o
        )
      );
      toast.success("Offer withdrawn");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to withdraw");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Offers</h1>

      {offers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No offers yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            When you submit offers on listings, they&apos;ll appear here.
          </p>
          <Button asChild className="mt-4">
            <Link href="/listings">Browse Listings</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/listings/${offer.listings.id}`}
                        className="font-semibold hover:text-primary truncate"
                      >
                        {offer.listings.title}
                      </Link>
                      <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {offer.listings.city}, {offer.listings.state}
                    </p>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Your Offer</span>
                        <p className="font-semibold">
                          {formatPrice(offer.offer_price)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">List Price</span>
                        <p className="font-medium">
                          {formatPrice(offer.listings.price)}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Closing</span>
                        <p className="font-medium">{offer.closing_date}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Submitted</span>
                        <p className="font-medium">
                          {formatDate(offer.created_at)}
                        </p>
                      </div>
                    </div>

                    {offer.status === "countered" && offer.counter_price && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">
                          Seller countered at {formatPrice(offer.counter_price)}
                        </p>
                        {offer.counter_notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {offer.counter_notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <OfferStatusBadge status={offer.status} />
                    {offer.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleWithdraw(offer.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Withdraw
                      </Button>
                    )}
                    {offer.status === "accepted" && (
                      <Button asChild size="sm">
                        <Link href="/dashboard/transactions">
                          View Transaction
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
