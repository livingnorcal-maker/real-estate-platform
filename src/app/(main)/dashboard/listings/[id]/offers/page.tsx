"use client";

import { useEffect, useState, use } from "react";
import { useUser } from "@/hooks/useUser";
import { formatPrice, formatDate } from "@/lib/utils";
import { OfferStatusBadge } from "@/components/offers/OfferStatusBadge";
import { CounterOfferForm } from "@/components/offers/CounterOfferForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Offer } from "@/types/database";

interface BuyerProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string;
}

interface OfferWithBuyer extends Offer {
  profiles: BuyerProfile;
}

export default function SellerOffersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: listingId } = use(params);
  const { user } = useUser();
  const [offers, setOffers] = useState<OfferWithBuyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [counteringId, setCounteringId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchOffers() {
      try {
        const res = await fetch(`/api/listings/${listingId}/offers`);
        const json = await res.json();
        setOffers(json.data || []);
      } catch {
        toast.error("Failed to load offers");
      } finally {
        setLoading(false);
      }
    }

    fetchOffers();
  }, [user, listingId]);

  async function handleAction(offerId: string, action: "accept" | "reject") {
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      setOffers((prev) =>
        prev.map((o) =>
          o.id === offerId
            ? { ...o, status: action === "accept" ? "accepted" : "rejected" }
            : o
        )
      );
      toast.success(
        action === "accept" ? "Offer accepted!" : "Offer rejected"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/listings"
          className="text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Offers Received</h1>
      </div>

      {offers.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">No offers yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            When buyers submit offers, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => {
            const buyer = offer.profiles;
            const initials =
              buyer?.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "B";

            return (
              <Card key={offer.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={buyer?.avatar_url || undefined} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">
                          {buyer?.full_name || "Buyer"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {buyer?.email}
                        </p>
                      </div>
                    </div>
                    <OfferStatusBadge status={offer.status} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                    <div>
                      <span className="text-muted-foreground">Offer Price</span>
                      <p className="font-semibold text-lg">
                        {formatPrice(offer.offer_price)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Earnest Money
                      </span>
                      <p className="font-medium">
                        {formatPrice(offer.earnest_money)}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Closing Date
                      </span>
                      <p className="font-medium">{offer.closing_date}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Submitted</span>
                      <p className="font-medium">
                        {formatDate(offer.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs mb-4">
                    {offer.inspection_contingency && (
                      <span className="px-2 py-1 bg-muted rounded">
                        Inspection
                      </span>
                    )}
                    {offer.financing_contingency && (
                      <span className="px-2 py-1 bg-muted rounded">
                        Financing
                      </span>
                    )}
                    {offer.appraisal_contingency && (
                      <span className="px-2 py-1 bg-muted rounded">
                        Appraisal
                      </span>
                    )}
                  </div>

                  {offer.notes && (
                    <p className="text-sm text-muted-foreground mb-4">
                      &quot;{offer.notes}&quot;
                    </p>
                  )}

                  {offer.status === "accepted" && (
                    <Button asChild size="sm">
                      <Link href="/dashboard/transactions">
                        View Transaction
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  )}

                  {offer.status === "pending" && (
                    <>
                      {counteringId === offer.id ? (
                        <CounterOfferForm
                          offerId={offer.id}
                          originalPrice={offer.offer_price}
                          onSuccess={() => {
                            setCounteringId(null);
                            setOffers((prev) =>
                              prev.map((o) =>
                                o.id === offer.id
                                  ? { ...o, status: "countered" }
                                  : o
                              )
                            );
                          }}
                          onCancel={() => setCounteringId(null)}
                        />
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAction(offer.id, "accept")}
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleAction(offer.id, "reject")}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setCounteringId(offer.id)}
                          >
                            Counter
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
