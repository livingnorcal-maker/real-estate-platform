import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListingStatusBadge } from "@/components/listings/ListingStatusBadge";
import { formatPrice, formatDate } from "@/lib/utils";
import { Plus, Pencil, Eye, FileText } from "lucide-react";
import type { Listing } from "@/types/database";

export default async function MyListingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", user?.id || "")
    .order("created_at", { ascending: false });

  const listings = (data || []) as Listing[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Listings</h1>
        <Button asChild>
          <Link href="/dashboard/listings/new">
            <Plus className="mr-2 h-4 w-4" />
            New Listing
          </Link>
        </Button>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">No listings yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first property listing to start receiving offers.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/listings/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Listing
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => {
            const coverPhoto =
              listing.photos?.[listing.cover_photo_index] || null;
            return (
              <Card key={listing.id}>
                <CardContent className="flex gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="relative w-24 h-24 sm:w-32 sm:h-24 rounded-md overflow-hidden bg-muted shrink-0">
                    {coverPhoto ? (
                      <Image
                        src={coverPhoto}
                        alt={listing.title}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                        No photo
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold line-clamp-1">
                          {listing.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {listing.city}, {listing.state}
                        </p>
                      </div>
                      <ListingStatusBadge status={listing.status} />
                    </div>
                    <p className="font-bold mt-1">
                      {formatPrice(listing.price)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Listed {formatDate(listing.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/listings/${listing.id}`}>
                        <Pencil className="mr-1 h-3 w-3" />
                        Edit
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/dashboard/listings/${listing.id}/offers`}>
                        <FileText className="mr-1 h-3 w-3" />
                        Offers
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/listings/${listing.id}`}>
                        <Eye className="mr-1 h-3 w-3" />
                        View
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
