import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { offerSchema } from "@/lib/validations";
import type { Offer } from "@/types/database";

// GET /api/listings/[id]/offers — list offers for a listing
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is the seller of this listing
  const { data: listing } = await supabase
    .from("listings")
    .select("seller_id")
    .eq("id", id)
    .single();

  const listingData = listing as { seller_id: string } | null;
  if (!listingData) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const isSeller = listingData.seller_id === user.id;

  // Sellers see all offers; buyers see only their own
  let query = supabase
    .from("offers")
    .select("*, profiles!offers_buyer_id_fkey(id, full_name, avatar_url, email)")
    .eq("listing_id", id)
    .order("created_at", { ascending: false });

  if (!isSeller) {
    query = query.eq("buyer_id", user.id);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, isSeller });
}

// POST /api/listings/[id]/offers — submit an offer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify listing exists and is active
  const { data: listing } = await supabase
    .from("listings")
    .select("seller_id, status")
    .eq("id", id)
    .single();

  const listingData = listing as { seller_id: string; status: string } | null;

  if (!listingData) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listingData.status !== "active") {
    return NextResponse.json(
      { error: "This listing is no longer accepting offers" },
      { status: 400 }
    );
  }

  if (listingData.seller_id === user.id) {
    return NextResponse.json(
      { error: "You cannot make an offer on your own listing" },
      { status: 400 }
    );
  }

  const body = await request.json();
  const parsed = offerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("offers")
    .insert({
      listing_id: id,
      buyer_id: user.id,
      ...parsed.data,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
