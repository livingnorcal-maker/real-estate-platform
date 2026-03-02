"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ProviderCard } from "./ProviderCard";
import { Building2 } from "lucide-react";
import type { ServiceProvider } from "@/types/database";

interface ProviderSelectorProps {
  providerType: "escrow" | "title";
  currentProviderId: string | null;
  onSelect: (provider: ServiceProvider) => void;
}

export function ProviderSelector({
  providerType,
  currentProviderId,
  onSelect,
}: ProviderSelectorProps) {
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch(`/api/providers?type=${providerType}`)
        .then((res) => res.json())
        .then((data) => setProviders(data))
        .finally(() => setLoading(false));
    }
  }, [open, providerType]);

  function handleSelect(provider: ServiceProvider) {
    onSelect(provider);
    setOpen(false);
  }

  const label = providerType === "escrow" ? "Escrow Company" : "Title Company";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Building2 className="mr-2 h-4 w-4" />
          {currentProviderId ? `Change ${label}` : `Select ${label}`}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select {label}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading providers...
          </div>
        ) : providers.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No {providerType} providers available.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                selectable
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
