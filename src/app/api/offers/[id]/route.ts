import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { counterOfferSchema } from "@/lib/validations";

// GET /api/offers/[id]
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

  const { data, error } = await supabase
    .from("offers")
    .select(
      "*, listings(id, title, address_line1, city, state, price, photos, cover_photo_index, seller_id), profiles!offers_buyer_id_fkey(id, full_name, avatar_url, email)"
    )
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

// PATCH /api/offers/[id] — accept, reject, counter, or withdraw
export async function PATCH(
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

  const body = await request.json();
  const { action } = body as { action: string };

  // Fetch the offer with listing info
  const { data: offer } = await supabase
    .from("offers")
    .select("*, listings(seller_id)")
    .eq("id", id)
    .single();

  const offerData = offer as {
    buyer_id: string;
    status: string;
    listings: { seller_id: string };
  } | null;

  if (!offerData) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  }

  const isSeller = offerData.listings.seller_id === user.id;
  const isBuyer = offerData.buyer_id === user.id;

  // Withdraw — only buyer can withdraw their own offer
  if (action === "withdraw") {
    if (!isBuyer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (offerData.status !== "pending") {
      return NextResponse.json(
        { error: "Can only withdraw pending offers" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("offers")
      .update({ status: "withdrawn" })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data });
  }

  // Accept / Reject / Counter — only seller can do these
  if (!isSeller) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (offerData.status !== "pending") {
    return NextResponse.json(
      { error: "Can only respond to pending offers" },
      { status: 400 }
    );
  }

  if (action === "accept") {
    const { data, error } = await supabase
      .from("offers")
      .update({
        status: "accepted",
        seller_response_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update listing status to pending
    await supabase
      .from("listings")
      .update({ status: "pending" })
      .eq("id", (offer as { listing_id: string }).listing_id);

    return NextResponse.json({ data });
  }

  if (action === "reject") {
    const { data, error } = await supabase
      .from("offers")
      .update({
        status: "rejected",
        seller_response_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data });
  }

  if (action === "counter") {
    const parsed = counterOfferSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("offers")
      .update({
        status: "countered",
        counter_price: parsed.data.counter_price,
        counter_notes: parsed.data.counter_notes,
        seller_response_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
