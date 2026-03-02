import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { milestoneUpdateSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: transactionId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user is buyer or seller on this transaction
  const { data: transaction } = await supabase
    .from("transactions")
    .select("buyer_id, seller_id")
    .eq("id", transactionId)
    .single();

  if (!transaction || (transaction.buyer_id !== user.id && transaction.seller_id !== user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { milestoneId, ...updates } = body;

  if (!milestoneId) {
    return NextResponse.json({ error: "milestoneId is required" }, { status: 400 });
  }

  const parsed = milestoneUpdateSchema.safeParse(updates);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Build update object
  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "completed") {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("transaction_milestones")
    .update(updateData)
    .eq("id", milestoneId)
    .eq("transaction_id", transactionId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
