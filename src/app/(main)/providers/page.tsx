import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ProviderCard } from "@/components/providers/ProviderCard";
import { ProviderTabs } from "@/components/providers/ProviderTabs";
import type { Metadata } from "next";
import type { ServiceProvider } from "@/types/database";

export const metadata: Metadata = {
  title: "Service Providers | HomeDirectly",
  description:
    "Find vetted escrow companies, title agencies, home inspectors, and lenders for your real estate transaction.",
};

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ProvidersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const supabase = await createClient();
  const activeType = sp.type || "all";

  let query = supabase
    .from("service_providers")
    .select("*")
    .eq("active", true)
    .order("rating", { ascending: false, nullsFirst: false });

  if (activeType !== "all" && ["escrow", "title", "inspector", "lender"].includes(activeType)) {
    query = query.eq("type", activeType);
  }

  const { data } = await query;
  const providers = (data || []) as unknown as ServiceProvider[];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Service Providers</h1>
        <p className="mt-2 text-muted-foreground">
          Browse vetted escrow, title, inspection, and lending professionals
        </p>
      </div>

      <Suspense>
        <ProviderTabs activeType={activeType} />
      </Suspense>

      <div className="mt-4 mb-4 text-sm text-muted-foreground">
        {providers.length} provider{providers.length !== 1 ? "s" : ""} found
      </div>

      {providers.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No providers found in this category.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {providers.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))}
        </div>
      )}
    </div>
  );
}
