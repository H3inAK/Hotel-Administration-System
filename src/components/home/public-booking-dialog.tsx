"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format } from "date-fns";
import { CalendarCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { bookingCreateSchema } from "@/lib/validations/booking";
import type { Room } from "@/types";

type PublicBookingInput = z.input<typeof bookingCreateSchema>;
type PublicBookingValues = Omit<PublicBookingInput, "checkInDate" | "checkOutDate"> & {
  checkInDate: string;
  checkOutDate: string;
};

type PublicBookingDialogProps = {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PublicBookingDialog({ room, open, onOpenChange }: PublicBookingDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);
  const form = useForm<PublicBookingValues>({
    resolver: zodResolver(bookingCreateSchema) as unknown as Resolver<PublicBookingValues>,
    defaultValues: {
      guest: {
        name: "",
        email: "",
        phone: "",
        address: ""
      },
      roomId: room?.id ?? "",
      checkInDate: format(today, "yyyy-MM-dd"),
      checkOutDate: format(tomorrow, "yyyy-MM-dd"),
      notes: ""
    }
  });

  useEffect(() => {
    if (room) {
      form.reset({
        guest: {
          name: "",
          email: "",
          phone: "",
          address: ""
        },
        roomId: room.id,
        checkInDate: format(today, "yyyy-MM-dd"),
        checkOutDate: format(tomorrow, "yyyy-MM-dd"),
        notes: ""
      });
    }
  }, [form, room, today, tomorrow]);

  async function onSubmit(values: PublicBookingValues) {
    if (!room) {
      return;
    }

    const parsed = bookingCreateSchema.parse(values);
    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed, roomId: room.id, status: "CONFIRMED" })
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Booking failed");
      }

      toast.success("Booking confirmed. Our team will contact you shortly.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={room ? `Book Room ${room.roomNumber}` : "Book Room"}
      description="Enter guest details and stay dates to confirm this reservation."
      className="max-w-xl"
    >
      {room ? (
        <div className="mb-5 rounded-lg border border-gold-200 bg-gold-50/80 p-4 text-sm text-slate-700">
          <div className="flex flex-wrap items-center gap-2 font-semibold text-slate-950">
            <CalendarCheck className="h-5 w-5 text-gold-600" /> {room.category.name} · {formatCurrency(room.pricePerNight)} per night
          </div>
          <p className="mt-1 text-slate-600">Availability is checked automatically before the booking is saved.</p>
        </div>
      ) : null}
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Guest name</Label>
            <Input className="rounded-md" {...form.register("guest.name")} placeholder="Aung Kyaw" />
            {form.formState.errors.guest?.name ? <p className="text-sm text-red-600">{form.formState.errors.guest.name.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input className="rounded-md" {...form.register("guest.phone")} placeholder="09 123 456 789" />
            {form.formState.errors.guest?.phone ? <p className="text-sm text-red-600">{form.formState.errors.guest.phone.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input className="rounded-md" type="email" {...form.register("guest.email")} placeholder="guest@example.com" />
            {form.formState.errors.guest?.email ? <p className="text-sm text-red-600">{form.formState.errors.guest.email.message}</p> : null}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Address</Label>
            <Input className="rounded-md" {...form.register("guest.address")} placeholder="Mandalay" />
          </div>
          <div className="space-y-2">
            <Label>Check-in</Label>
            <Input className="rounded-md" type="date" {...form.register("checkInDate")} defaultValue={format(today, "yyyy-MM-dd")} />
          </div>
          <div className="space-y-2">
            <Label>Check-out</Label>
            <Input className="rounded-md" type="date" {...form.register("checkOutDate")} defaultValue={format(tomorrow, "yyyy-MM-dd")} />
            {form.formState.errors.checkOutDate ? <p className="text-sm text-red-600">{form.formState.errors.checkOutDate.message}</p> : null}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea className="min-h-20 rounded-md" {...form.register("notes")} placeholder="Airport pickup, extra bed, late arrival..." />
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="gold" className="rounded-md" disabled={submitting || !room}>
            {submitting ? "Confirming..." : "Confirm Booking"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
