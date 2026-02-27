import { ListingForm } from "@/components/listings/ListingForm";

export default function NewListingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create New Listing</h1>
      <ListingForm />
    </div>
  );
}
