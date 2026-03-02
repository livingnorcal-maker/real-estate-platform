import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Transaction } from "@/types/database";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("transactions")
    .select("*, listing:listings(id, title, address_line1, city, state, photos, cover_photo_index, price), offer:offers(offer_price, earnest_money, closing_date)")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as unknown as (Transaction & { listing: Record<string, unknown>; offer: Record<string, unknown> })[]);
}
