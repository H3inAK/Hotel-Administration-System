"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { guestCreateSchema, type GuestCreateInput } from "@/lib/validations/guest";
import type { Guest } from "@/types";

type GuestFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: Guest | null;
  onSaved: () => void | Promise<void>;
};

export function GuestFormDialog({ open, onOpenChange, guest, onSaved }: GuestFormDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<GuestCreateInput>({
    resolver: zodResolver(guestCreateSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: ""
    }
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: guest?.name ?? "",
        email: guest?.email ?? "",
        phone: guest?.phone ?? "",
        address: guest?.address ?? ""
      });
    }
  }, [form, guest, open]);

  async function onSubmit(values: GuestCreateInput) {
    setSubmitting(true);
    try {
      const response = await fetch(guest ? `/api/guests/${guest.id}` : "/api/guests", {
        method: guest ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Guest save failed");
      }
      toast.success(guest ? "Guest updated" : "Guest created");
      await onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Guest save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={guest ? "Edit Guest" : "Add Guest"} className="max-w-xl">
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input {...form.register("name")} placeholder="Guest name" />
          {form.formState.errors.name ? <p className="text-sm text-red-600">{form.formState.errors.name.message}</p> : null}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...form.register("email")} placeholder="guest@example.com" />
            {form.formState.errors.email ? <p className="text-sm text-red-600">{form.formState.errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input {...form.register("phone")} placeholder="09 123 456 789" />
            {form.formState.errors.phone ? <p className="text-sm text-red-600">{form.formState.errors.phone.message}</p> : null}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Address</Label>
          <Textarea {...form.register("address")} placeholder="Guest address" />
        </div>
        <Button type="submit" variant="gold" className="w-full" disabled={submitting}>
          {submitting ? "Saving..." : guest ? "Update Guest" : "Create Guest"}
        </Button>
      </form>
    </Dialog>
  );
}
