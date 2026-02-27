import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, formatDate } from "@/lib/utils";
import { ListingStatusBadge } from "@/components/listings/ListingStatusBadge";
import { ListingActions } from "@/components/listings/ListingActions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bed,
  Bath,
  Maximize,
  MapPin,
  Calendar,
  Home,
  ArrowLeft,
} from "lucide-react";
import type { Metadata } from "next";
import type { Listing } from "@/types/database";

export const revalidate = 60;

interface SellerInfo {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string;
  created_at: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select("title, city, state, price, description")
    .eq("id", id)
    .single();

  const listing = data as { title: string; city: string; state: string; price: number; description: string | null } | null;
  if (!listing) return { title: "Listing Not Found" };

  return {
    title: `${listing.title} | ${listing.city}, ${listing.state}`,
    description:
      listing.description?.slice(0, 160) ||
      `${listing.title} in ${listing.city}, ${listing.state} - ${formatPrice(listing.price)}`,
  };
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("listings")
    .select(
      "*, profiles!listings_seller_id_fkey(id, full_name, avatar_url, phone, email, created_at)"
    )
    .eq("id", id)
    .single();

  if (!data) notFound();

  const listing = data as unknown as Listing & { profiles: SellerInfo };
  const seller = listing.profiles;

  const photos = listing.photos || [];
  const initials =
    seller?.full_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase() || "S";

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/listings"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Photo gallery */}
          {photos.length > 0 ? (
            <div className="space-y-2">
              <div className="relative aspect-[16/9] rounded-lg overflow-hidden bg-muted">
                <Image
                  src={photos[listing.cover_photo_index] || photos[0]}
                  alt={listing.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  priority
                />
              </div>
              {photos.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {photos.slice(0, 4).map((photo: string, i: number) => (
                    <div
                      key={i}
                      className="relative aspect-[4/3] rounded-md overflow-hidden bg-muted"
                    >
                      <Image
                        src={photo}
                        alt={`Photo ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 25vw, 16vw"
                      />
                      {i === 3 && photos.length > 4 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium">
                          +{photos.length - 4}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-[16/9] rounded-lg bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">No photos available</p>
            </div>
          )}

          {/* Title + price */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {listing.title}
                </h1>
                <div className="flex items-center gap-1 text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4" />
                  {listing.address_line1}
                  {listing.address_line2 && `, ${listing.address_line2}`},{" "}
                  {listing.city}, {listing.state} {listing.zip_code}
                </div>
              </div>
              <ListingStatusBadge status={listing.status} />
            </div>
            <p className="text-3xl font-bold mt-4 text-primary">
              {formatPrice(listing.price)}
            </p>
          </div>

          {/* Key facts */}
          <div className="flex flex-wrap gap-6 py-4 border-y">
            {listing.bedrooms != null && (
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-semibold">{listing.bedrooms}</p>
                  <p className="text-xs text-muted-foreground">Bedrooms</p>
                </div>
              </div>
            )}
            {listing.bathrooms != null && (
              <div className="flex items-center gap-2">
                <Bath className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-semibold">{listing.bathrooms}</p>
                  <p className="text-xs text-muted-foreground">Bathrooms</p>
                </div>
              </div>
            )}
            {listing.sqft != null && (
              <div className="flex items-center gap-2">
                <Maximize className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-semibold">
                    {listing.sqft.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Sq Ft</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-semibold capitalize">
                  {listing.property_type.replace("_", " ")}
                </p>
                <p className="text-xs text-muted-foreground">Type</p>
              </div>
            </div>
            {listing.year_built && (
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-semibold">{listing.year_built}</p>
                  <p className="text-xs text-muted-foreground">Year Built</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {listing.description && (
            <div>
              <h2 className="text-xl font-semibold mb-3">About this property</h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {listing.description}
              </p>
            </div>
          )}

          {/* Details */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Property Details</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Property Type</span>
                <span className="font-medium capitalize">
                  {listing.property_type.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Status</span>
                <ListingStatusBadge status={listing.status} />
              </div>
              {listing.lot_sqft && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Lot Size</span>
                  <span className="font-medium">
                    {listing.lot_sqft.toLocaleString()} sqft
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Listed</span>
                <span className="font-medium">
                  {formatDate(listing.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Seller card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={seller?.avatar_url || undefined} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {seller?.full_name || "Seller"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Member since {formatDate(seller?.created_at || listing.created_at)}
                  </p>
                </div>
              </div>

              <ListingActions
                listingId={listing.id}
                listingPrice={listing.price}
                isActive={listing.status === "active"}
              />

              {seller?.phone && (
                <p className="text-sm text-center text-muted-foreground mt-3">
                  or call {seller.phone}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick facts */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Quick Facts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price/sqft</span>
                  <span className="font-medium">
                    {listing.sqft
                      ? formatPrice(Math.round(listing.price / listing.sqft))
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Days on market</span>
                  <span className="font-medium">
                    {Math.floor(
                      (Date.now() - new Date(listing.created_at).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
