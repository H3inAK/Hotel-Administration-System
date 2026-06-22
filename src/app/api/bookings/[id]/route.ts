import { BookingStatus, Prisma, RoomStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireApiSession } from "@/lib/auth";
import { calculateRoomTotal, ensureRoomCanBeBooked } from "@/lib/booking-utils";
import { prisma } from "@/lib/prisma";
import { serializeBooking } from "@/lib/serializers";
import { bookingUpdateSchema } from "@/lib/validations/booking";

const bookingInclude = {
  guest: true,
  room: { include: { category: true } },
  payments: true,
  services: { include: { service: true } }
} satisfies Prisma.BookingInclude;

const inactiveBookingStatuses: BookingStatus[] = [BookingStatus.CANCELLED, BookingStatus.CHECKED_OUT];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await requireApiSession(["ADMIN", "RECEPTIONIST"]);
  if (isAuthError(session)) {
    return session;
  }

  const { id } = await context.params;
  const booking = await prisma.booking.findUnique({ where: { id }, include: bookingInclude });

  if (!booking) {
    return NextResponse.json({ message: "Booking not found." }, { status: 404 });
  }

  return NextResponse.json({ booking: serializeBooking(booking) });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await requireApiSession(["ADMIN", "RECEPTIONIST"]);
  if (isAuthError(session)) {
    return session;
  }

  try {
    const { id } = await context.params;
    const input = bookingUpdateSchema.parse(await request.json());

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const existing = await tx.booking.findUnique({ where: { id }, include: { room: true } });

      if (!existing) {
        throw new Error("Booking not found.");
      }

      const roomId = input.roomId ?? existing.roomId;
      const checkInDate = input.checkInDate ?? existing.checkInDate;
      const checkOutDate = input.checkOutDate ?? existing.checkOutDate;
      const nextStatus = input.status ?? existing.status;
      const shouldCheckAvailability = !inactiveBookingStatuses.includes(nextStatus);
      const availability = shouldCheckAvailability
        ? await ensureRoomCanBeBooked(tx, roomId, checkInDate, checkOutDate, existing.id)
        : null;

      if (availability && (!availability.available || !availability.room)) {
        throw new Error(availability.reason ?? "Room is not available.");
      }

      const room = availability?.room ?? (await tx.room.findUniqueOrThrow({ where: { id: roomId }, include: { category: true } }));
      const { totalNights, roomTotal } = calculateRoomTotal(Number(room.pricePerNight), checkInDate, checkOutDate);
      const serviceTotal = Number(existing.serviceTotal);

      const updated = await tx.booking.update({
        where: { id },
        data: {
          guestId: input.guestId ?? undefined,
          roomId,
          checkInDate,
          checkOutDate,
          totalNights,
          roomTotal,
          totalAmount: roomTotal + serviceTotal,
          status: nextStatus as BookingStatus,
          notes: input.notes
        },
        include: bookingInclude
      });

      if (nextStatus === BookingStatus.CHECKED_IN) {
        await tx.room.update({ where: { id: roomId }, data: { status: RoomStatus.OCCUPIED } });
      }

      if (inactiveBookingStatuses.includes(nextStatus)) {
        await tx.room.update({ where: { id: roomId }, data: { status: RoomStatus.AVAILABLE } });
      }

      return updated;
    });

    return NextResponse.json({ booking: serializeBooking(result) });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Booking update failed." }, { status: 400 });
  }
}
