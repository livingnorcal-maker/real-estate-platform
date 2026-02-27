import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listingSchema } from "@/lib/validations";
import { LISTINGS_PER_PAGE } from "@/lib/constants";

// GET /api/listings — search with filters + pagination
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const q = searchParams.get("q");
  const city = searchParams.get("city");
  const state = searchParams.get("state");
  const zip = searchParams.get("zip");
  const minPrice = searchParams.get("min_price");
  const maxPrice = searchParams.get("max_price");
  const bedrooms = searchParams.get("bedrooms");
  const bathrooms = searchParams.get("bathrooms");
  const propertyType = searchParams.get("property_type");
  const status = searchParams.get("status") || "active";
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(
    searchParams.get("per_page") || String(LISTINGS_PER_PAGE)
  );
  const sortBy = searchParams.get("sort") || "created_at";
  const sortOrder = searchParams.get("order") || "desc";

  let query = supabase
    .from("listings")
    .select("*, profiles!listings_seller_id_fkey(id, full_name, avatar_url)", {
      count: "exact",
    });

  // Full-text search
  if (q) {
    query = query.textSearch("search_vector", q, {
      type: "websearch",
      config: "english",
    });
  }

  // Filters
  if (city) query = query.ilike("city", `%${city}%`);
  if (state) query = query.eq("state", state.toUpperCase());
  if (zip) query = query.eq("zip_code", zip);
  if (minPrice) query = query.gte("price", parseInt(minPrice));
  if (maxPrice) query = query.lte("price", parseInt(maxPrice));
  if (bedrooms) query = query.gte("bedrooms", parseInt(bedrooms));
  if (bathrooms) query = query.gte("bathrooms", parseInt(bathrooms));
  if (propertyType) query = query.eq("property_type", propertyType);
  if (status) query = query.eq("status", status);

  // Sort
  const validSortFields = ["created_at", "price", "bedrooms", "sqft"];
  const field = validSortFields.includes(sortBy) ? sortBy : "created_at";
  query = query.order(field, { ascending: sortOrder === "asc" });

  // Pagination
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    count,
    page,
    per_page: perPage,
    total_pages: Math.ceil((count || 0) / perPage),
  });
}

// POST /api/listings — create a new listing
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = listingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("listings")
    .insert({
      ...parsed.data,
      seller_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
