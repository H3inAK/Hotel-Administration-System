"use client";

import { CreditCard, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateValue } from "@/lib/format";
import type { Booking } from "@/types";

type StaffBookingTableProps = {
  bookings: Booking[];
  onChanged: () => void | Promise<void>;
  onPayment: (booking: Booking) => void;
};

export function StaffBookingTable({ bookings, onChanged, onPayment }: StaffBookingTableProps) {
  async function runAction(endpoint: string, bookingId: string, successMessage: string) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId })
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Action failed");
      }
      toast.success(successMessage);
      await onChanged();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    }
  }

  return (
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
        {bookings.map((booking) => {
          const canCheckIn = ["PENDING", "CONFIRMED"].includes(booking.status);
          const paidAmount = booking.payments
            .filter((payment) => ["PAID", "PARTIAL"].includes(payment.status))
            .reduce((sum, payment) => sum + payment.amount, 0);
          const outstanding = Math.max(0, booking.totalAmount - paidAmount);
          const canCheckOut = booking.status === "CHECKED_IN" && outstanding <= 0.01;
          return (
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
                <div className="flex flex-wrap justify-end gap-2">
                  <Button variant="outline" size="sm" disabled={!canCheckIn} onClick={() => void runAction("/api/bookings/check-in", booking.id, "Guest checked in")}> 
                    <LogIn className="h-4 w-4" /> Check-in
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canCheckOut}
                    title={booking.status === "CHECKED_IN" && outstanding > 0.01 ? `${formatCurrency(outstanding)} must be paid before check-out` : undefined}
                    onClick={() => void runAction("/api/bookings/check-out", booking.id, "Guest checked out")}
                  >
                    <LogOut className="h-4 w-4" /> Check-out
                  </Button>
                  <Button variant="gold" size="sm" onClick={() => onPayment(booking)}>
                    <CreditCard className="h-4 w-4" /> Pay
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
