"use client";

import { useState } from "react";
import { OfferForm } from "@/components/offers/OfferForm";
import { SaveListingButton } from "./SaveListingButton";
import { Button } from "@/components/ui/button";

interface ListingActionsProps {
  listingId: string;
  listingPrice: number;
  isActive: boolean;
}

export function ListingActions({
  listingId,
  listingPrice,
  isActive,
}: ListingActionsProps) {
  const [offerOpen, setOfferOpen] = useState(false);

  return (
    <>
      {isActive && (
        <Button className="w-full" size="lg" onClick={() => setOfferOpen(true)}>
          Make an Offer
        </Button>
      )}

      <SaveListingButton
        listingId={listingId}
        variant="button"
        className="w-full mt-2"
      />

      <OfferForm
        listingId={listingId}
        listingPrice={listingPrice}
        open={offerOpen}
        onOpenChange={setOfferOpen}
      />
    </>
  );
}
