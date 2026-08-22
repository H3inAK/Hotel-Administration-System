"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { paymentCreateSchema, type PaymentCreateInput } from "@/lib/validations/payment";
import type { Booking, PaymentMethod } from "@/types";

type PaymentDialogProps = {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void | Promise<void>;
};

export function PaymentDialog({ booking, open, onOpenChange, onSaved }: PaymentDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const paidAmount = useMemo(
    () => booking?.payments.filter((payment) => ["PAID", "PARTIAL"].includes(payment.status)).reduce((sum, payment) => sum + payment.amount, 0) ?? 0,
    [booking]
  );
  const outstanding = Math.max(0, (booking?.totalAmount ?? 0) - paidAmount);
  const methodOptions = useMemo(
    () => [
      { value: "CASH", label: "Cash" },
      { value: "CARD", label: "Card" },
      { value: "BANK_TRANSFER", label: "Bank Transfer" },
      { value: "MOBILE_PAY", label: "Mobile Pay" }
    ],
    []
  );
  const form = useForm<PaymentCreateInput>({
    resolver: zodResolver(paymentCreateSchema),
    defaultValues: {
      bookingId: booking?.id ?? "",
      amount: outstanding || booking?.totalAmount || 0,
      method: "CASH",
      status: "PAID"
    }
  });

  useEffect(() => {
    if (booking && open) {
      const nextAmount = outstanding > 0 ? outstanding : booking.totalAmount;
      form.reset({
        bookingId: booking.id,
        amount: nextAmount,
        method: "CASH",
        status: nextAmount >= booking.totalAmount ? "PAID" : "PARTIAL"
      });
    }
  }, [booking, form, open, outstanding]);

  async function onSubmit(values: PaymentCreateInput) {
    setSubmitting(true);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          status: values.amount + paidAmount >= (booking?.totalAmount ?? 0) - 0.01 ? "PAID" : "PARTIAL"
        })
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Payment failed");
      }
      toast.success("Payment recorded");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Record Payment" description="Add a payment transaction for this booking." className="max-w-xl">
      {booking ? (
        <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="flex items-center gap-2 font-semibold text-slate-950">
            <CreditCard className="h-4 w-4 text-gold-600" /> {booking.guest.name} · Room {booking.room.roomNumber}
          </p>
          <p className="mt-1">Total: {formatCurrency(booking.totalAmount)} · Paid: {formatCurrency(paidAmount)} · Outstanding: {formatCurrency(outstanding)}</p>
        </div>
      ) : null}
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input type="number" step="0.01" max={outstanding || undefined} {...form.register("amount")} />
          {form.formState.errors.amount ? <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p> : null}
        </div>
        <div className="space-y-2">
          <Label>Method</Label>
          <FilterSelect
            ariaLabel="Select payment method"
            value={form.watch("method")}
            options={methodOptions}
            onChange={(value) => form.setValue("method", value as PaymentMethod, { shouldDirty: true, shouldValidate: true })}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="gold" disabled={submitting || !booking}>
            {submitting ? "Recording..." : "Record Payment"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
