import { BookingStatus, Prisma, RoomStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromCookie, isAuthError, requireApiSession } from "@/lib/auth";
import { calculateRoomTotal, ensureRoomCanBeBooked } from "@/lib/booking-utils";
import { prisma } from "@/lib/prisma";
import { serializeBooking } from "@/lib/serializers";
import { bookingCreateSchema } from "@/lib/validations/booking";

const bookingInclude = {
  guest: true,
  room: { include: { category: true } },
  payments: true,
  services: { include: { service: true } }
} satisfies Prisma.BookingInclude;

export async function GET(request: NextRequest) {
  const session = await requireApiSession(["ADMIN", "RECEPTIONIST"]);
  if (isAuthError(session)) {
    return session;
  }

  const search = request.nextUrl.searchParams.get("search")?.trim();
  const status = request.nextUrl.searchParams.get("status");
  const where: Prisma.BookingWhereInput = {};

  if (search) {
    where.OR = [
      { guest: { name: { contains: search, mode: "insensitive" } } },
      { guest: { phone: { contains: search, mode: "insensitive" } } },
      { room: { roomNumber: { contains: search, mode: "insensitive" } } },
      { room: { category: { name: { contains: search, mode: "insensitive" } } } }
    ];
  }

  if (status && Object.values(BookingStatus).includes(status as BookingStatus)) {
    where.status = status as BookingStatus;
  }

  const bookings = await prisma.booking.findMany({
    where,
    include: bookingInclude,
    orderBy: [{ checkInDate: "asc" }, { createdAt: "desc" }]
  });

  return NextResponse.json({ bookings: bookings.map(serializeBooking) });
}

export async function POST(request: NextRequest) {
  try {
    const input = bookingCreateSchema.parse(await request.json());
    const session = await getSessionFromCookie();

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const availability = await ensureRoomCanBeBooked(tx, input.roomId, input.checkInDate, input.checkOutDate);

      if (!availability.available || !availability.room) {
        throw new Error(availability.reason ?? "Room is not available.");
      }

      if (!session && !input.guest) {
        throw new Error("Guest details are required for public bookings.");
      }

      const guestId = session && input.guestId
        ? input.guestId
        : (
            await tx.guest.create({
              data: {
                name: input.guest?.name ?? "Guest",
                email: input.guest?.email,
                phone: input.guest?.phone ?? "N/A",
                address: input.guest?.address
              }
            })
          ).id;
      const bookingStatus = session ? input.status ?? BookingStatus.CONFIRMED : BookingStatus.CONFIRMED;

      const { totalNights, roomTotal } = calculateRoomTotal(Number(availability.room.pricePerNight), input.checkInDate, input.checkOutDate);
      const serviceRequests = input.services ?? [];
      const services = serviceRequests.length
        ? await tx.service.findMany({ where: { id: { in: serviceRequests.map((item) => item.serviceId) }, isActive: true } })
        : [];
      const serviceItems = serviceRequests
        .map((requestItem) => {
          const service = services.find((item) => item.id === requestItem.serviceId);
          if (!service) {
            return null;
          }
          const quantity = requestItem.quantity;
          const unitPrice = Number(service.price);
          return {
            serviceId: service.id,
            quantity,
            unitPrice,
            totalPrice: unitPrice * quantity
          };
        })
        .filter((item): item is { serviceId: string; quantity: number; unitPrice: number; totalPrice: number } => item !== null);
      const serviceTotal = serviceItems.reduce((sum, item) => sum + item.totalPrice, 0);

      const booking = await tx.booking.create({
        data: {
          guestId,
          roomId: input.roomId,
          createdById: session?.userId,
          checkInDate: input.checkInDate,
          checkOutDate: input.checkOutDate,
          totalNights,
          roomTotal,
          serviceTotal,
          totalAmount: roomTotal + serviceTotal,
          status: bookingStatus,
          notes: input.notes,
          services: serviceItems.length
            ? {
                create: serviceItems
              }
            : undefined
        },
        include: bookingInclude
      });

      if (bookingStatus === BookingStatus.CHECKED_IN) {
        await tx.room.update({ where: { id: input.roomId }, data: { status: RoomStatus.OCCUPIED } });
      }

      return booking;
    });

    return NextResponse.json({ booking: serializeBooking(result) }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ message: "Guest or room record was not found." }, { status: 404 });
    }

    return NextResponse.json({ message: error instanceof Error ? error.message : "Booking creation failed." }, { status: 400 });
  }
}
