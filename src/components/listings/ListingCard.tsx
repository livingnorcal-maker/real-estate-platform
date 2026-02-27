import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bed, Bath, Maximize, MapPin } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { SaveListingButton } from "./SaveListingButton";
import type { Listing } from "@/types/database";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const coverPhoto = listing.photos?.[listing.cover_photo_index] || null;

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
        {/* Photo */}
        <div className="relative aspect-[4/3] bg-muted">
          {coverPhoto ? (
            <Image
              src={coverPhoto}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No photo
            </div>
          )}

          {/* Save button */}
          <div className="absolute top-2 left-2 z-10">
            <SaveListingButton listingId={listing.id} />
          </div>

          {/* Status badge */}
          {listing.status !== "active" && (
            <Badge
              variant={listing.status === "sold" ? "destructive" : "secondary"}
              className="absolute top-2 right-2"
            >
              {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
            </Badge>
          )}

          {/* Price overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
            <p className="text-white font-bold text-xl">
              {formatPrice(listing.price)}
            </p>
          </div>
        </div>

        {/* Info */}
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm line-clamp-1 mb-1">
            {listing.title}
          </h3>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <MapPin className="h-3 w-3" />
            <span className="line-clamp-1">
              {listing.city}, {listing.state} {listing.zip_code}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {listing.bedrooms != null && (
              <span className="flex items-center gap-1">
                <Bed className="h-3.5 w-3.5" />
                {listing.bedrooms} bd
              </span>
            )}
            {listing.bathrooms != null && (
              <span className="flex items-center gap-1">
                <Bath className="h-3.5 w-3.5" />
                {listing.bathrooms} ba
              </span>
            )}
            {listing.sqft != null && (
              <span className="flex items-center gap-1">
                <Maximize className="h-3.5 w-3.5" />
                {listing.sqft.toLocaleString()} sqft
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
