import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Use service role for webhook (no user session)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = getAdminClient();

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;

      // Update escrow_payments status
      await supabase
        .from("escrow_payments")
        .update({ status: "succeeded" })
        .eq("stripe_payment_intent_id", pi.id);

      // Mark "Earnest Money Deposit" milestone as completed
      const transactionId = pi.metadata.transaction_id;
      if (transactionId) {
        const { data: milestone } = await supabase
          .from("transaction_milestones")
          .select("id")
          .eq("transaction_id", transactionId)
          .ilike("title", "%earnest%money%")
          .single();

        if (milestone) {
          await supabase
            .from("transaction_milestones")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", milestone.id);
        }
      }

      break;
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const piId = typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id;

      if (piId) {
        await supabase
          .from("escrow_payments")
          .update({ status: "refunded" })
          .eq("stripe_payment_intent_id", piId);
      }

      break;
    }
  }

  return NextResponse.json({ received: true });
}
