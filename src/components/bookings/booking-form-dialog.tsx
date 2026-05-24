"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateInput } from "@/lib/format";
import { availabilitySchema, bookingCreateSchema, bookingUpdateSchema } from "@/lib/validations/booking";
import type { Booking, BookingStatus, Guest, Room, RoomCategory } from "@/types";

type BookingFormInput = z.input<typeof bookingCreateSchema>;
type BookingFormOutput = z.output<typeof bookingCreateSchema>;
type BookingUpdateInput = z.input<typeof bookingUpdateSchema>;

type BookingFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  rooms: Room[];
  guests: Guest[];
  categories: RoomCategory[];
  onSaved: () => void | Promise<void>;
};

export function BookingFormDialog({ open, onOpenChange, booking, rooms, guests, categories, onSaved }: BookingFormDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const guestOptions = useMemo(
    () => [{ value: "", label: "Select guest" }, ...guests.map((guest) => ({ value: guest.id, label: `${guest.name} · ${guest.phone}` }))],
    [guests]
  );
  const roomOptions = useMemo(
    () => [
      { value: "", label: "Select room" },
      ...rooms.map((room) => ({ value: room.id, label: `${room.roomNumber} · ${room.category.name} · ${room.status}` }))
    ],
    [rooms]
  );
  const statusOptions = useMemo(
    () =>
      (["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"] satisfies BookingStatus[]).map((item) => ({
        value: item,
        label: item.replaceAll("_", " ")
      })),
    []
  );
  const form = useForm<BookingFormInput, unknown, BookingFormOutput>({
    resolver: zodResolver(bookingCreateSchema),
    defaultValues: {
      guestId: "",
      roomId: "",
      checkInDate: today,
      checkOutDate: tomorrow,
      status: "CONFIRMED",
      notes: ""
    }
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      guestId: booking?.guestId ?? "",
      roomId: booking?.roomId ?? rooms[0]?.id ?? "",
      checkInDate: booking ? formatDateInput(booking.checkInDate) : today,
      checkOutDate: booking ? formatDateInput(booking.checkOutDate) : tomorrow,
      status: booking?.status ?? "CONFIRMED",
      notes: booking?.notes ?? ""
    });
  }, [booking, form, open, rooms, today, tomorrow]);

  async function checkAvailability(showSuccess = true) {
    const values = form.getValues();
    const parsed = availabilitySchema.safeParse({
      roomId: values.roomId,
      checkInDate: values.checkInDate,
      checkOutDate: values.checkOutDate,
      excludeBookingId: booking?.id
    });

    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message ?? "Invalid dates");
      return false;
    }

    setChecking(true);
    try {
      const response = await fetch("/api/bookings/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data)
      });
      const payload = (await response.json()) as { available: boolean; reason?: string };
      if (!response.ok || !payload.available) {
        throw new Error(payload.reason ?? "Room is not available");
      }
      if (showSuccess) {
        toast.success("Room is available for selected dates");
      }
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Availability check failed");
      return false;
    } finally {
      setChecking(false);
    }
  }

  async function onSubmit(values: BookingFormOutput) {
    const available = await checkAvailability(false);
    if (!available) {
      return;
    }

    setSubmitting(true);
    try {
      const body: BookingFormOutput | BookingUpdateInput = booking
        ? {
            guestId: values.guestId,
            roomId: values.roomId,
            checkInDate: values.checkInDate,
            checkOutDate: values.checkOutDate,
            status: values.status,
            notes: values.notes
          }
        : values;

      const response = await fetch(booking ? `/api/bookings/${booking.id}` : "/api/bookings", {
        method: booking ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Booking save failed");
      }
      toast.success(booking ? "Booking updated" : "Booking created");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Booking save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={booking ? "Edit Booking" : "Create Booking"} className="max-w-2xl">
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Guest</Label>
            <FilterSelect
              ariaLabel="Select guest"
              value={String(form.watch("guestId") ?? "")}
              options={guestOptions}
              onChange={(value) => form.setValue("guestId", value, { shouldDirty: true, shouldValidate: true })}
            />
            {form.formState.errors.guestId ? <p className="text-sm text-red-600">{form.formState.errors.guestId.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Room</Label>
            <FilterSelect
              ariaLabel="Select room"
              value={String(form.watch("roomId") ?? "")}
              options={roomOptions}
              onChange={(value) => form.setValue("roomId", value, { shouldDirty: true, shouldValidate: true })}
            />
            {form.formState.errors.roomId ? <p className="text-sm text-red-600">{form.formState.errors.roomId.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Check-in</Label>
            <Input type="date" {...form.register("checkInDate")} />
          </div>
          <div className="space-y-2">
            <Label>Check-out</Label>
            <Input type="date" {...form.register("checkOutDate")} />
            {form.formState.errors.checkOutDate ? <p className="text-sm text-red-600">{form.formState.errors.checkOutDate.message}</p> : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Status</Label>
            <FilterSelect
              ariaLabel="Select booking status"
              value={String(form.watch("status") ?? "CONFIRMED")}
              options={statusOptions}
              onChange={(value) => form.setValue("status", value as BookingStatus, { shouldDirty: true, shouldValidate: true })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Textarea {...form.register("notes")} placeholder="Guest requests, arrival details, billing notes..." />
          </div>
        </div>
        <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Available categories</p>
          <p>{categories.map((category) => category.name).join(", ") || "No categories found"}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => void checkAvailability()} disabled={checking}>
            <CheckCircle2 className="h-4 w-4" /> {checking ? "Checking..." : "Check Availability"}
          </Button>
          <Button type="submit" variant="gold" disabled={submitting || checking}>
            {submitting ? "Saving..." : booking ? "Update Booking" : "Create Booking"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
