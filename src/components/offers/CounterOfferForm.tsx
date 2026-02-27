"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { counterOfferSchema, type CounterOfferFormData } from "@/lib/validations";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CounterOfferFormProps {
  offerId: string;
  originalPrice: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CounterOfferForm({
  offerId,
  originalPrice,
  onSuccess,
  onCancel,
}: CounterOfferFormProps) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CounterOfferFormData>({
    resolver: zodResolver(counterOfferSchema),
    defaultValues: {
      counter_price: originalPrice,
      counter_notes: "",
    },
  });

  async function onSubmit(data: CounterOfferFormData) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "counter", ...data }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to counter");
      }

      toast.success("Counter offer sent!");
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
      <p className="text-sm font-medium">Counter Offer</p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <FormField
            control={form.control}
            name="counter_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Counter Price (cents)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                  />
                </FormControl>
                {field.value > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formatPrice(field.value)}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="counter_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (optional)</FormLabel>
                <FormControl>
                  <Textarea
                    rows={2}
                    placeholder="Explain your counter offer..."
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Send Counter
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
