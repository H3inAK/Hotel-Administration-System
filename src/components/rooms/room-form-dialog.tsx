"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { roomCreateSchema, type RoomCreateInput } from "@/lib/validations/room";
import type { Room, RoomCategory } from "@/types";

type RoomFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  categories: RoomCategory[];
  onSaved: () => void | Promise<void>;
};

export function RoomFormDialog({ open, onOpenChange, room, categories, onSaved }: RoomFormDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<RoomCreateInput>({
    resolver: zodResolver(roomCreateSchema),
    defaultValues: {
      roomNumber: "",
      categoryId: "",
      pricePerNight: 0,
      capacity: 2,
      status: "AVAILABLE",
      description: "",
      imageUrl: ""
    }
  });
  const categoryOptions = useMemo(() => categories.map((category) => ({ value: category.id, label: category.name })), [categories]);
  const statusOptions = useMemo(
    () => [
      { value: "AVAILABLE", label: "Available" },
      { value: "OCCUPIED", label: "Occupied" },
      { value: "MAINTENANCE", label: "Maintenance" }
    ],
    []
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    form.reset({
      roomNumber: room?.roomNumber ?? "",
      categoryId: room?.categoryId ?? categories[0]?.id ?? "",
      pricePerNight: room?.pricePerNight ?? Number(categories[0]?.basePrice ?? 0),
      capacity: room?.capacity ?? 2,
      status: room?.status ?? "AVAILABLE",
      description: room?.description ?? "",
      imageUrl: room?.imageUrl ?? ""
    });
  }, [categories, form, open, room]);

  async function onSubmit(values: RoomCreateInput) {
    setSubmitting(true);
    try {
      const response = await fetch(room ? `/api/rooms/${room.id}` : "/api/rooms", {
        method: room ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Room save failed");
      }

      toast.success(room ? "Room updated" : "Room created");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Room save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={room ? "Edit Room" : "Add New Room"} className="max-w-2xl">
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Room Number</Label>
            <Input {...form.register("roomNumber")} placeholder="101" />
            {form.formState.errors.roomNumber ? <p className="text-sm text-red-600">{form.formState.errors.roomNumber.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Room Type</Label>
            <FilterSelect
              ariaLabel="Select room type"
              value={form.watch("categoryId")}
              options={categoryOptions}
              onChange={(value) => form.setValue("categoryId", value, { shouldDirty: true, shouldValidate: true })}
            />
            {form.formState.errors.categoryId ? <p className="text-sm text-red-600">{form.formState.errors.categoryId.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Price / Night (MMK)</Label>
            <Input type="number" step="1" {...form.register("pricePerNight")} />
            {form.formState.errors.pricePerNight ? <p className="text-sm text-red-600">{form.formState.errors.pricePerNight.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Capacity</Label>
            <Input type="number" min="1" {...form.register("capacity")} />
            {form.formState.errors.capacity ? <p className="text-sm text-red-600">{form.formState.errors.capacity.message}</p> : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Status</Label>
            <FilterSelect
              ariaLabel="Select room status"
              value={form.watch("status")}
              options={statusOptions}
              onChange={(value) => form.setValue("status", value as RoomCreateInput["status"], { shouldDirty: true, shouldValidate: true })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Image URL</Label>
            <Input {...form.register("imageUrl")} placeholder="https://example.com/room.jpg" />
            {form.formState.errors.imageUrl ? <p className="text-sm text-red-600">{form.formState.errors.imageUrl.message}</p> : null}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <Textarea {...form.register("description")} placeholder="A cozy room with city view..." />
          </div>
        </div>
        <Button type="submit" variant="gold" className="w-full" disabled={submitting}>
          {submitting ? "Saving..." : room ? "Update Room" : "Create Room"}
        </Button>
      </form>
    </Dialog>
  );
}
