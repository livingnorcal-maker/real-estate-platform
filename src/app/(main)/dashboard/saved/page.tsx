"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Listing } from "@/types/database";

export default function SavedListingsPage() {
  const { user } = useUser();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchSaved() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("saved_listings")
          .select(
            "listing_id, listings(*)"
          )
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false });

        const items = (data || [])
          .map((d: any) => d.listings)
          .filter(Boolean) as Listing[];
        setListings(items);
      } catch {
        toast.error("Failed to load saved listings");
      } finally {
        setLoading(false);
      }
    }

    fetchSaved();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Saved Listings</h1>

      {listings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No saved listings</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Save listings you&apos;re interested in by clicking the heart icon.
          </p>
          <Button asChild className="mt-4">
            <Link href="/listings">Browse Listings</Link>
          </Button>
        </div>
      ) : (
        <ListingGrid listings={listings} />
      )}
    </div>
  );
}
