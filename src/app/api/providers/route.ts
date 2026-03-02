import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { providerSchema } from "@/lib/validations";
import type { ServiceProvider } from "@/types/database";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  let query = supabase
    .from("service_providers")
    .select("*")
    .eq("active", true)
    .order("rating", { ascending: false, nullsFirst: false });

  if (type && ["escrow", "title", "inspector", "lender"].includes(type)) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as unknown as ServiceProvider[]);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = providerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("service_providers")
    .insert({
      ...parsed.data,
      description: parsed.data.description || null,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      website: parsed.data.website || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as unknown as ServiceProvider, { status: 201 });
}
