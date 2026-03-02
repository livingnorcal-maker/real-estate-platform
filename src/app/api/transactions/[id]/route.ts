import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transactionUpdateSchema } from "@/lib/validations";

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

  // Get transaction with related data
  const { data: transaction, error } = await supabase
    .from("transactions")
    .select(
      "*, listing:listings(id, title, address_line1, city, state, photos, cover_photo_index, price), offer:offers(offer_price, earnest_money, closing_date, inspection_contingency, financing_contingency, appraisal_contingency), buyer:profiles!transactions_buyer_id_fkey(id, full_name, email, avatar_url), seller:profiles!transactions_seller_id_fkey(id, full_name, email, avatar_url), escrow_provider:service_providers!transactions_escrow_provider_id_fkey(id, name, type, phone, email), title_provider:service_providers!transactions_title_provider_id_fkey(id, name, type, phone, email)"
    )
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  // Verify the user is buyer or seller
  if (transaction.buyer_id !== user.id && transaction.seller_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get milestones
  const { data: milestones } = await supabase
    .from("transaction_milestones")
    .select("*")
    .eq("transaction_id", id)
    .order("sort_order", { ascending: true });

  // Get payments
  const { data: payments } = await supabase
    .from("escrow_payments")
    .select("*")
    .eq("transaction_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({
    ...transaction,
    milestones: milestones || [],
    payments: payments || [],
  });
}

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

  // Verify ownership
  const { data: existing } = await supabase
    .from("transactions")
    .select("buyer_id, seller_id")
    .eq("id", id)
    .single();

  if (!existing || (existing.buyer_id !== user.id && existing.seller_id !== user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = transactionUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("transactions")
    .update(parsed.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
