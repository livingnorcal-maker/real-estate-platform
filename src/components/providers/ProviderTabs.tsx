"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "all", label: "All" },
  { value: "escrow", label: "Escrow" },
  { value: "title", label: "Title" },
  { value: "inspector", label: "Inspectors" },
  { value: "lender", label: "Lenders" },
];

interface ProviderTabsProps {
  activeType: string;
}

export function ProviderTabs({ activeType }: ProviderTabsProps) {
  return (
    <div className="flex gap-1 border-b">
      {TABS.map((tab) => (
        <Link
          key={tab.value}
          href={tab.value === "all" ? "/providers" : `/providers?type=${tab.value}`}
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeType === tab.value
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
