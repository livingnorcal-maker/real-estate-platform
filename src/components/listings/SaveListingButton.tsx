"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SaveListingButtonProps {
  listingId: string;
  className?: string;
  variant?: "icon" | "button";
}

export function SaveListingButton({
  listingId,
  className,
  variant = "icon",
}: SaveListingButtonProps) {
  const { user } = useUser();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("saved_listings")
      .select("id")
      .eq("user_id", user.id)
      .eq("listing_id", listingId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSaved(true);
      });
  }, [user, listingId]);

  async function toggleSave() {
    if (!user) {
      toast.error("Sign in to save listings");
      return;
    }

    // Optimistic update
    setSaved(!saved);
    setLoading(true);

    try {
      const res = await fetch("/api/saved-listings", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId }),
      });

      if (!res.ok) {
        setSaved(saved); // revert
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success(saved ? "Removed from saved" : "Saved!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "icon") {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleSave();
        }}
        disabled={loading}
        className={cn(
          "p-2 rounded-full bg-white/80 hover:bg-white transition-colors",
          className
        )}
        aria-label={saved ? "Unsave listing" : "Save listing"}
      >
        <Heart
          className={cn(
            "h-5 w-5 transition-colors",
            saved ? "fill-red-500 text-red-500" : "text-gray-600"
          )}
        />
      </button>
    );
  }

  return (
    <Button
      variant="outline"
      onClick={toggleSave}
      disabled={loading}
      className={className}
    >
      <Heart
        className={cn(
          "mr-2 h-4 w-4",
          saved ? "fill-red-500 text-red-500" : ""
        )}
      />
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
