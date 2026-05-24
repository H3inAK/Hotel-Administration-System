import { differenceInCalendarDays } from "date-fns";
import { BookingStatus, Prisma, type PrismaClient, RoomStatus } from "@prisma/client";

export type BookableRoom = Prisma.RoomGetPayload<{ include: { category: true } }>;

export type RoomAvailabilityResult =
  | { available: true; room: BookableRoom; reason?: never }
  | { available: false; reason: string; room?: never };

export function calculateTotalNights(checkInDate: Date, checkOutDate: Date) {
  return Math.max(1, differenceInCalendarDays(checkOutDate, checkInDate));
}

export function getOverlapWhere(
  roomId: string,
  requestedCheckInDate: Date,
  requestedCheckOutDate: Date,
  excludeBookingId?: string
): Prisma.BookingWhereInput {
  return {
    roomId,
    id: excludeBookingId ? { not: excludeBookingId } : undefined,
    checkInDate: { lt: requestedCheckOutDate },
    checkOutDate: { gt: requestedCheckInDate },
    status: { notIn: [BookingStatus.CANCELLED, BookingStatus.CHECKED_OUT] }
  };
}

export async function ensureRoomCanBeBooked(
  prisma: PrismaClient | Prisma.TransactionClient,
  roomId: string,
  checkInDate: Date,
  checkOutDate: Date,
  excludeBookingId?: string
): Promise<RoomAvailabilityResult> {
  if (checkOutDate <= checkInDate) {
    return { available: false, reason: "Check-out date must be after check-in date." };
  }

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { category: true }
  });

  if (!room) {
    return { available: false, reason: "Room not found." };
  }

  if (room.status === RoomStatus.MAINTENANCE) {
    return { available: false, reason: "Maintenance rooms cannot be booked." };
  }

  const overlappingBooking = await prisma.booking.findFirst({
    where: getOverlapWhere(roomId, checkInDate, checkOutDate, excludeBookingId),
    select: { id: true }
  });

  if (overlappingBooking) {
    return { available: false, reason: "This room is already booked for the selected dates." };
  }

  return { available: true, room };
}

export function calculateRoomTotal(pricePerNight: number, checkInDate: Date, checkOutDate: Date) {
  const totalNights = calculateTotalNights(checkInDate, checkOutDate);
  return {
    totalNights,
    roomTotal: totalNights * pricePerNight
  };
}
