"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CreditCard, CheckCircle, Loader2 } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface EarnestMoneyPaymentProps {
  transactionId: string;
  earnestAmount: number;
  paymentStatus: "none" | "pending" | "succeeded" | "refunded";
  isBuyer: boolean;
  onPaymentComplete: () => void;
}

function PaymentForm({
  transactionId,
  onPaymentComplete,
}: {
  transactionId: string;
  onPaymentComplete: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/transactions/${transactionId}`,
      },
      redirect: "if_required",
    });

    if (error) {
      toast.error(error.message || "Payment failed");
      setProcessing(false);
    } else {
      toast.success("Earnest money deposited successfully!");
      onPaymentComplete();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || processing} className="w-full">
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay Now
          </>
        )}
      </Button>
    </form>
  );
}

export function EarnestMoneyPayment({
  transactionId,
  earnestAmount,
  paymentStatus,
  isBuyer,
  onPaymentComplete,
}: EarnestMoneyPaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function initPayment() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/earnest-money", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create payment");
      }

      setClientSecret(data.clientSecret);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Payment setup failed");
    } finally {
      setLoading(false);
    }
  }

  if (paymentStatus === "succeeded") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Earnest Money</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <CheckCircle className="mr-1 h-3 w-3" />
              Deposited
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            ${(earnestAmount / 100).toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Earnest money has been successfully deposited.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === "refunded") {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Earnest Money</CardTitle>
            <Badge variant="outline">Refunded</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">
            ${(earnestAmount / 100).toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Earnest money has been refunded.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Earnest Money Deposit</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold mb-2">
          ${(earnestAmount / 100).toLocaleString()}
        </p>

        {!isBuyer ? (
          <p className="text-sm text-muted-foreground">
            Waiting for buyer to deposit earnest money.
          </p>
        ) : clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: "stripe" } }}
          >
            <PaymentForm
              transactionId={transactionId}
              onPaymentComplete={onPaymentComplete}
            />
          </Elements>
        ) : (
          <Button onClick={initPayment} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Deposit Earnest Money
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
