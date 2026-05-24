"use client";

import { Edit, Plus, Search, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BookingFormDialog } from "@/components/bookings/booking-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateValue } from "@/lib/format";
import type { Booking, BookingListResponse, BookingStatus, Guest, GuestListResponse, Room, RoomCategory, RoomListResponse } from "@/types";

type BookingManagementProps = {
  onChanged?: () => void;
};

export function BookingManagement({ onChanged }: BookingManagementProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BookingStatus | "ALL">("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingResponse, guestResponse, roomResponse] = await Promise.all([
        fetch("/api/bookings", { cache: "no-store" }),
        fetch("/api/guests", { cache: "no-store" }),
        fetch("/api/rooms", { cache: "no-store" })
      ]);

      if (!bookingResponse.ok || !guestResponse.ok || !roomResponse.ok) {
        throw new Error("Unable to load booking data");
      }

      const bookingPayload = (await bookingResponse.json()) as BookingListResponse;
      const guestPayload = (await guestResponse.json()) as GuestListResponse;
      const roomPayload = (await roomResponse.json()) as RoomListResponse;
      setBookings(bookingPayload.bookings);
      setGuests(guestPayload.guests);
      setRooms(roomPayload.rooms);
      setCategories(roomPayload.categories);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load booking data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredBookings = useMemo(() => {
    const query = search.toLowerCase();
    return bookings.filter((booking) => {
      const matchesSearch =
        booking.guest.name.toLowerCase().includes(query) ||
        booking.room.roomNumber.toLowerCase().includes(query) ||
        booking.room.category.name.toLowerCase().includes(query);
      const matchesStatus = status === "ALL" || booking.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, search, status]);
  const statusOptions = useMemo(
    () => [
      { value: "ALL", label: "All Status" },
      { value: "PENDING", label: "Pending" },
      { value: "CONFIRMED", label: "Confirmed" },
      { value: "CHECKED_IN", label: "Checked-In" },
      { value: "CHECKED_OUT", label: "Checked-Out" },
      { value: "CANCELLED", label: "Cancelled" }
    ],
    []
  );

  function openCreate() {
    setSelectedBooking(null);
    setDialogOpen(true);
  }

  function openEdit(booking: Booking) {
    setSelectedBooking(booking);
    setDialogOpen(true);
  }

  async function handleCancel() {
    if (!cancelBooking) {
      return;
    }

    setCancelling(true);
    try {
      const response = await fetch(`/api/bookings/${cancelBooking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" })
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to cancel booking");
      }
      toast.success("Booking cancelled");
      setCancelBooking(null);
      await loadData();
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel booking");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-950">Bookings</h2>
          <p className="text-sm text-slate-500">Create reservations, verify availability, and update booking status.</p>
        </div>
        <Button variant="gold" onClick={openCreate}>
          <Plus className="h-5 w-5" /> Create Booking
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
          <Input className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search guest, room, or type..." />
        </div>
        <FilterSelect ariaLabel="Filter by booking status" value={status} options={statusOptions} onChange={(value) => setStatus(value as BookingStatus | "ALL")} />
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <EmptyState title="No bookings found" description="Create a booking or change filters." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <p className="font-semibold text-slate-950">{booking.guest.name}</p>
                  <p className="text-xs text-slate-500">{booking.guest.phone}</p>
                </TableCell>
                <TableCell>
                  Room {booking.room.roomNumber}
                  <p className="text-xs text-slate-500">{booking.room.category.name}</p>
                </TableCell>
                <TableCell>{formatDateValue(booking.checkInDate)}</TableCell>
                <TableCell>{formatDateValue(booking.checkOutDate)}</TableCell>
                <TableCell>{formatCurrency(booking.totalAmount)}</TableCell>
                <TableCell>
                  <StatusBadge status={booking.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" aria-label="Edit booking" onClick={() => openEdit(booking)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Cancel booking"
                      className="text-red-600 hover:text-red-700"
                      disabled={["CANCELLED", "CHECKED_OUT"].includes(booking.status)}
                      onClick={() => setCancelBooking(booking)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <BookingFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        booking={selectedBooking}
        rooms={rooms}
        guests={guests}
        categories={categories}
        onSaved={async () => {
          setDialogOpen(false);
          await loadData();
          onChanged?.();
        }}
      />
      <AlertDialog
        open={Boolean(cancelBooking)}
        onOpenChange={(open) => !open && setCancelBooking(null)}
        title="Cancel booking?"
        description="Cancelled bookings are excluded from room availability checks and reports."
        confirmLabel="Cancel booking"
        loading={cancelling}
        onConfirm={handleCancel}
      />
    </section>
  );
}
