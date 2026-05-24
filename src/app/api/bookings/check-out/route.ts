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

      if (current.status !== BookingStatus.CHECKED_IN) {
        throw new Error("Only checked-in bookings can be checked out.");
      }

      await tx.room.update({ where: { id: current.roomId }, data: { status: RoomStatus.AVAILABLE } });
      return tx.booking.update({ where: { id: current.id }, data: { status: BookingStatus.CHECKED_OUT }, include: bookingInclude });
    });

    return NextResponse.json({ booking: serializeBooking(booking) });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Check-out failed." }, { status: 400 });
  }
}
