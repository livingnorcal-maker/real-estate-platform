"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Home, FileText, Heart, DollarSign } from "lucide-react";

interface Stats {
  activeListings: number;
  offersCount: number;
  savedCount: number;
  totalValue: number;
}

export default function DashboardOverviewPage() {
  const { user, profile, loading } = useUser();
  const [stats, setStats] = useState<Stats>({
    activeListings: 0,
    offersCount: 0,
    savedCount: 0,
    totalValue: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const isSeller = profile?.role === "seller" || profile?.role === "both";

  useEffect(() => {
    if (!user) return;

    async function fetchStats() {
      const supabase = createClient();

      const [listingsRes, offersRes, savedRes] = await Promise.all([
        isSeller
          ? supabase
              .from("listings")
              .select("price", { count: "exact" })
              .eq("seller_id", user!.id)
              .eq("status", "active")
          : Promise.resolve({ data: [], count: 0 }),

        isSeller
          ? supabase
              .from("offers")
              .select("offer_price, listing_id, listings!inner(seller_id)", { count: "exact" })
              .eq("listings.seller_id", user!.id)
              .eq("status", "pending")
          : supabase
              .from("offers")
              .select("offer_price", { count: "exact" })
              .eq("buyer_id", user!.id)
              .eq("status", "pending"),

        supabase
          .from("saved_listings")
          .select("id", { count: "exact" })
          .eq("user_id", user!.id),
      ]);

      const listings = (listingsRes.data || []) as { price: number }[];
      const offers = (offersRes.data || []) as { offer_price: number }[];

      setStats({
        activeListings: listingsRes.count || 0,
        offersCount: offersRes.count || 0,
        savedCount: savedRes.count || 0,
        totalValue: isSeller
          ? listings.reduce((sum, l) => sum + l.price, 0)
          : offers.reduce((sum, o) => sum + o.offer_price, 0),
      });
      setStatsLoading(false);
    }

    fetchStats();
  }, [user, isSeller]);

  if (loading || statsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isSeller && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Listings
              </CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeListings}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Properties listed
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isSeller ? "Offers Received" : "Offers Sent"}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.offersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isSeller ? "Pending review" : "Awaiting response"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saved Listings
            </CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.savedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Bookmarked properties
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalValue > 0 ? formatPrice(stats.totalValue) : "$0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isSeller ? "Listed value" : "Offer value"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
