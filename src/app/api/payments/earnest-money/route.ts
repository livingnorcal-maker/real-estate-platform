import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { transactionId } = await request.json();

  if (!transactionId) {
    return NextResponse.json(
      { error: "transactionId is required" },
      { status: 400 }
    );
  }

  // Verify user is the buyer on this transaction
  const { data: transaction } = await supabase
    .from("transactions")
    .select("id, buyer_id, offer:offers(earnest_money)")
    .eq("id", transactionId)
    .single();

  if (!transaction || transaction.buyer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const offer = transaction.offer as unknown as { earnest_money: number };
  const amount = offer?.earnest_money;

  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: "No earnest money amount on this offer" },
      { status: 400 }
    );
  }

  // Check if already paid
  const { data: existingPayment } = await supabase
    .from("escrow_payments")
    .select("id, status")
    .eq("transaction_id", transactionId)
    .eq("status", "succeeded")
    .maybeSingle();

  if (existingPayment) {
    return NextResponse.json(
      { error: "Earnest money already deposited" },
      { status: 400 }
    );
  }

  // Create Stripe PaymentIntent
  const paymentIntent = await getStripe().paymentIntents.create({
    amount,
    currency: "usd",
    metadata: {
      transaction_id: transactionId,
      payer_id: user.id,
      type: "earnest_money",
    },
  });

  // Create escrow_payments record
  await supabase.from("escrow_payments").insert({
    transaction_id: transactionId,
    payer_id: user.id,
    amount,
    stripe_payment_intent_id: paymentIntent.id,
    status: "pending",
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    amount,
  });
}
