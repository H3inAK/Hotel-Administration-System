import { BookingStatus, PaymentStatus, Prisma, RoomStatus } from "@prisma/client";
import { addMonths, endOfToday, format, startOfMonth, startOfToday } from "date-fns";
import { NextResponse } from "next/server";
import { isAuthError, requireApiSession } from "@/lib/auth";
import { calculateOccupancyRate, bookingStatusLabels } from "@/lib/report-utils";
import { prisma } from "@/lib/prisma";
import { serializeBooking } from "@/lib/serializers";

const bookingInclude = {
  guest: true,
  room: { include: { category: true } },
  payments: true,
  services: { include: { service: true } }
} satisfies Prisma.BookingInclude;

export async function GET() {
  const session = await requireApiSession(["ADMIN", "RECEPTIONIST"]);
  if (isAuthError(session)) {
    return session;
  }

  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const firstMonth = startOfMonth(addMonths(new Date(), -5));

  const [rooms, totalGuests, totalBookings, bookings, payments, recentBookings, todayCheckIns, currentlyInHouse, pendingArrivals] = await Promise.all([
    prisma.room.findMany({ include: { category: true } }),
    prisma.guest.count(),
    prisma.booking.count(),
    prisma.booking.findMany({ include: { room: { include: { category: true } } } }),
    prisma.payment.findMany({
      where: { status: { in: [PaymentStatus.PAID, PaymentStatus.PARTIAL] } },
      include: { booking: { include: { room: { include: { category: true } } } } }
    }),
    prisma.booking.findMany({ include: bookingInclude, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.booking.count({
      where: {
        checkInDate: { gte: todayStart, lte: todayEnd },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] }
      }
    }),
    prisma.booking.count({ where: { status: BookingStatus.CHECKED_IN } }),
    prisma.booking.count({
      where: {
        checkInDate: { gte: todayStart },
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] }
      }
    })
  ]);

  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((room) => room.status === RoomStatus.OCCUPIED).length;
  const availableRooms = rooms.filter((room) => room.status === RoomStatus.AVAILABLE).length;
  const maintenanceRooms = rooms.filter((room) => room.status === RoomStatus.MAINTENANCE).length;
  const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const averageRoomPrice = totalRooms > 0 ? rooms.reduce((sum, room) => sum + Number(room.pricePerNight), 0) / totalRooms : 0;

  const monthBuckets = Array.from({ length: 6 }).map((_, index) => {
    const monthDate = addMonths(firstMonth, index);
    return {
      key: format(monthDate, "yyyy-MM"),
      month: format(monthDate, "MMM yy"),
      revenue: 0
    };
  });

  for (const payment of payments) {
    const paymentDate = payment.paidAt ?? payment.createdAt;
    if (paymentDate >= firstMonth) {
      const key = format(paymentDate, "yyyy-MM");
      const bucket = monthBuckets.find((item) => item.key === key);
      if (bucket) {
        bucket.revenue += Number(payment.amount);
      }
    }
  }

  const roomTypeRevenue = new Map<string, { type: string; bookings: Set<string>; revenue: number }>();

  for (const payment of payments) {
    const type = payment.booking.room.category.name;
    const current = roomTypeRevenue.get(type) ?? { type, bookings: new Set<string>(), revenue: 0 };
    current.bookings.add(payment.bookingId);
    current.revenue += Number(payment.amount);
    roomTypeRevenue.set(type, current);
  }

  const statusBreakdown = (Object.values(BookingStatus) as BookingStatus[]).map((status) => ({
    status,
    label: bookingStatusLabels[status],
    count: bookings.filter((booking) => booking.status === status).length
  }));

  return NextResponse.json({
    metrics: {
      totalRevenue,
      totalRooms,
      occupiedRooms,
      availableRooms,
      maintenanceRooms,
      occupancyRate: calculateOccupancyRate(occupiedRooms, totalRooms),
      totalGuests,
      totalBookings,
      averageRoomPrice,
      todayCheckIns,
      currentlyInHouse,
      pendingArrivals
    },
    monthlyRevenue: monthBuckets.map(({ month, revenue }) => ({ month, revenue })),
    revenueByRoomType: Array.from(roomTypeRevenue.values()).map((item) => ({
      type: item.type,
      bookings: item.bookings.size,
      revenue: item.revenue
    })),
    statusBreakdown,
    recentBookings: recentBookings.map(serializeBooking)
  });
}
