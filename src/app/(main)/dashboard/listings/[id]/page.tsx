import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListingForm } from "@/components/listings/ListingForm";
import type { Listing } from "@/types/database";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("listings")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) notFound();

  const listing = data as unknown as Listing;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit Listing</h1>
      <ListingForm listing={listing} />
    </div>
  );
}
