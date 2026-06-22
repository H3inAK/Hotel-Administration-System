import { BookingStatus, Prisma, RoomStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireApiSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeBooking } from "@/lib/serializers";
import { bookingActionSchema } from "@/lib/validations/booking";

const bookingInclude = {
  guest: true,
  room: { include: { category: true } },
  payments: true,
  services: { include: { service: true } }
} satisfies Prisma.BookingInclude;

const checkInReadyStatuses: BookingStatus[] = [BookingStatus.PENDING, BookingStatus.CONFIRMED];

export async function POST(request: NextRequest) {
  const session = await requireApiSession(["ADMIN", "RECEPTIONIST"]);
  if (isAuthError(session)) {
    return session;
  }

  try {
    const input = bookingActionSchema.parse(await request.json());
    const booking = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const current = await tx.booking.findUnique({ where: { id: input.bookingId }, include: { room: true } });

      if (!current) {
        throw new Error("Booking not found.");
      }

      if (!checkInReadyStatuses.includes(current.status)) {
        throw new Error("Only pending or confirmed bookings can be checked in.");
      }

      if (current.room.status === RoomStatus.MAINTENANCE) {
        throw new Error("Maintenance rooms cannot be checked in.");
      }

      await tx.room.update({ where: { id: current.roomId }, data: { status: RoomStatus.OCCUPIED } });
      return tx.booking.update({ where: { id: current.id }, data: { status: BookingStatus.CHECKED_IN }, include: bookingInclude });
    });

    return NextResponse.json({ booking: serializeBooking(booking) });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Check-in failed." }, { status: 400 });
  }
}
