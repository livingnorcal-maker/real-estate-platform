import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Phone, Mail, Globe, MapPin } from "lucide-react";
import type { ServiceProvider } from "@/types/database";

const TYPE_LABELS: Record<string, string> = {
  escrow: "Escrow",
  title: "Title",
  inspector: "Inspector",
  lender: "Lender",
};

interface ProviderCardProps {
  provider: ServiceProvider;
  onSelect?: (provider: ServiceProvider) => void;
  selectable?: boolean;
}

export function ProviderCard({ provider, onSelect, selectable }: ProviderCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg leading-snug">{provider.name}</CardTitle>
          <Badge variant="secondary" className="shrink-0">
            {TYPE_LABELS[provider.type] || provider.type}
          </Badge>
        </div>
        {provider.rating && (
          <div className="flex items-center gap-1 text-sm text-amber-600">
            <Star className="h-4 w-4 fill-current" />
            <span className="font-medium">{provider.rating}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 space-y-3">
        {provider.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {provider.description}
          </p>
        )}

        <div className="space-y-1.5 text-sm">
          {(provider.city || provider.state) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>
                {[provider.city, provider.state].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
          {provider.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span>{provider.phone}</span>
            </div>
          )}
          {provider.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{provider.email}</span>
            </div>
          )}
          {provider.website && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-3.5 w-3.5 shrink-0" />
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate hover:text-primary transition-colors"
              >
                {provider.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
        </div>

        {selectable && onSelect && (
          <Button
            className="w-full mt-3"
            size="sm"
            onClick={() => onSelect(provider)}
          >
            Select Provider
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
