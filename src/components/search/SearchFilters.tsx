"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROPERTY_TYPES, BEDROOMS_OPTIONS, BATHROOMS_OPTIONS } from "@/lib/constants";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");

  useEffect(() => {
    setQ(searchParams.get("q") || "");
  }, [searchParams]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`/listings?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter("q", q);
  };

  const clearFilters = () => {
    router.push("/listings");
  };

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by city, address, or keyword..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          <Input
            placeholder="Min price"
            type="number"
            className="w-32"
            defaultValue={searchParams.get("min_price") || ""}
            onBlur={(e) => updateFilter("min_price", e.target.value)}
          />
          <Input
            placeholder="Max price"
            type="number"
            className="w-32"
            defaultValue={searchParams.get("max_price") || ""}
            onBlur={(e) => updateFilter("max_price", e.target.value)}
          />
        </div>

        <Select
          defaultValue={searchParams.get("bedrooms") || "all"}
          onValueChange={(v) => updateFilter("bedrooms", v)}
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Beds" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any beds</SelectItem>
            {BEDROOMS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label} beds
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          defaultValue={searchParams.get("bathrooms") || "all"}
          onValueChange={(v) => updateFilter("bathrooms", v)}
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Baths" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any baths</SelectItem>
            {BATHROOMS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label} baths
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          defaultValue={searchParams.get("property_type") || "all"}
          onValueChange={(v) => updateFilter("property_type", v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {PROPERTY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          defaultValue={searchParams.get("sort") || "created_at"}
          onValueChange={(v) => updateFilter("sort", v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Newest</SelectItem>
            <SelectItem value="price">Price: Low</SelectItem>
            <SelectItem value="sqft">Largest</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
