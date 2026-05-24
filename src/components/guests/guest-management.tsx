"use client";

import { Edit, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { GuestFormDialog } from "@/components/guests/guest-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateValue } from "@/lib/format";
import type { Guest, GuestListResponse } from "@/types";

type GuestManagementProps = {
  onChanged?: () => void;
};

export function GuestManagement({ onChanged }: GuestManagementProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [deleteGuest, setDeleteGuest] = useState<Guest | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadGuests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/guests?search=${encodeURIComponent(search)}`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load guests");
      }
      const payload = (await response.json()) as GuestListResponse;
      setGuests(payload.guests);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load guests");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadGuests(), 250);
    return () => window.clearTimeout(timeout);
  }, [loadGuests]);

  const filteredGuests = useMemo(() => guests, [guests]);

  function openCreate() {
    setSelectedGuest(null);
    setDialogOpen(true);
  }

  function openEdit(guest: Guest) {
    setSelectedGuest(guest);
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleteGuest) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/guests/${deleteGuest.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to delete guest");
      }
      toast.success("Guest deleted");
      setDeleteGuest(null);
      await loadGuests();
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete guest");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="hotel-heading text-3xl font-bold text-slate-950">Guests</h2>
          <p className="text-sm text-slate-500">Search and maintain guest contact profiles.</p>
        </div>
        <Button variant="gold" onClick={openCreate}>
          <Plus className="h-5 w-5" /> Add Guest
        </Button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, or phone..." />
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">Loading guests...</div>
      ) : filteredGuests.length === 0 ? (
        <EmptyState title="No guests found" description="Create a guest profile or try another search keyword." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGuests.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell className="font-semibold text-slate-950">{guest.name}</TableCell>
                <TableCell>{guest.email ?? "-"}</TableCell>
                <TableCell>{guest.phone}</TableCell>
                <TableCell>{guest.address ?? "-"}</TableCell>
                <TableCell>{formatDateValue(guest.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" aria-label="Edit guest" onClick={() => openEdit(guest)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Delete guest" className="text-red-600 hover:text-red-700" onClick={() => setDeleteGuest(guest)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <GuestFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        guest={selectedGuest}
        onSaved={async () => {
          setDialogOpen(false);
          await loadGuests();
          onChanged?.();
        }}
      />
      <AlertDialog
        open={Boolean(deleteGuest)}
        onOpenChange={(open) => !open && setDeleteGuest(null)}
        title="Delete guest?"
        description="Guests with existing bookings cannot be removed. Update the guest instead if the profile has history."
        confirmLabel="Delete guest"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </section>
  );
}
