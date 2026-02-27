import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { SearchFilters } from "@/components/search/SearchFilters";
import { Button } from "@/components/ui/button";
import { LISTINGS_PER_PAGE } from "@/lib/constants";
import Link from "next/link";
import type { Metadata } from "next";
import type { Listing } from "@/types/database";

export const metadata: Metadata = {
  title: "Browse Listings",
  description: "Find your next home — directly from the seller",
};

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ListingsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();

  const page = parseInt(sp.page || "1");
  const perPage = LISTINGS_PER_PAGE;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  let query = supabase
    .from("listings")
    .select("*", { count: "exact" })
    .eq("status", "active");

  if (sp.q) {
    query = query.textSearch("search_vector", sp.q, {
      type: "websearch",
      config: "english",
    });
  }
  if (sp.city) query = query.ilike("city", `%${sp.city}%`);
  if (sp.state) query = query.eq("state", sp.state.toUpperCase());
  if (sp.zip) query = query.eq("zip_code", sp.zip);
  if (sp.min_price) query = query.gte("price", parseInt(sp.min_price));
  if (sp.max_price) query = query.lte("price", parseInt(sp.max_price));
  if (sp.bedrooms) query = query.gte("bedrooms", parseInt(sp.bedrooms));
  if (sp.bathrooms) query = query.gte("bathrooms", parseInt(sp.bathrooms));
  if (sp.property_type) query = query.eq("property_type", sp.property_type);

  const sortField = sp.sort || "created_at";
  const ascending = sp.order === "asc";
  query = query.order(sortField, { ascending }).range(from, to);

  const { data, count } = await query;
  const listings = (data || []) as unknown as Listing[];
  const totalPages = Math.ceil((count || 0) / perPage);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Browse Listings</h1>
        <p className="mt-2 text-muted-foreground">
          Find your next home — directly from the seller
        </p>
      </div>

      <Suspense>
        <SearchFilters />
      </Suspense>

      <div className="mt-6 mb-4 text-sm text-muted-foreground">
        {count || 0} listing{count !== 1 ? "s" : ""} found
      </div>

      <ListingGrid listings={listings} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <Button variant="outline" asChild>
              <Link
                href={`/listings?${new URLSearchParams({ ...sp, page: String(page - 1) } as Record<string, string>).toString()}`}
              >
                Previous
              </Link>
            </Button>
          )}
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Button variant="outline" asChild>
              <Link
                href={`/listings?${new URLSearchParams({ ...sp, page: String(page + 1) } as Record<string, string>).toString()}`}
              >
                Next
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
