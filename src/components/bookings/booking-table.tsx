import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDateValue } from "@/lib/format";
import type { Booking } from "@/types";

export function BookingTable({ bookings }: { bookings: Booking[] }) {
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="font-semibold text-slate-950">{booking.guest.name}</TableCell>
            <TableCell>Room {booking.room.roomNumber}</TableCell>
            <TableCell>{formatDateValue(booking.checkInDate)}</TableCell>
            <TableCell>{formatDateValue(booking.checkOutDate)}</TableCell>
            <TableCell>{formatCurrency(booking.totalAmount)}</TableCell>
            <TableCell>
              <StatusBadge status={booking.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
