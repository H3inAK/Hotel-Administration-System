import { BookingStatus, PaymentStatus, Prisma, RoomStatus } from "@prisma/client";
import { eachDayOfInterval, eachMonthOfInterval, endOfDay, endOfToday, format, isValid, startOfDay, startOfMonth, startOfToday } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
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

function parseReportDate(value: string | null, fallback: Date, end: boolean) {
  if (!value) return fallback;
  const parsed = new Date(`${value}T00:00:00`);
  return isValid(parsed) ? (end ? endOfDay(parsed) : startOfDay(parsed)) : fallback;
}

export async function GET(request: NextRequest) {
  const session = await requireApiSession(["ADMIN", "RECEPTIONIST"]);
  if (isAuthError(session)) {
    return session;
  }

  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), 0, 1);
  const defaultTo = endOfDay(new Date(now.getFullYear(), 11, 31));
  const from = parseReportDate(request.nextUrl.searchParams.get("from"), defaultFrom, false);
  const to = parseReportDate(request.nextUrl.searchParams.get("to"), defaultTo, true);
  const granularity = request.nextUrl.searchParams.get("granularity") === "day" ? "day" : "month";

  if (from > to) {
    return NextResponse.json({ message: "The report start date must be before the end date." }, { status: 400 });
  }

  const bookingDateFilter = { checkInDate: { gte: from, lte: to } };
  const paymentDateFilter: Prisma.PaymentWhereInput = {
    status: { in: [PaymentStatus.PAID, PaymentStatus.PARTIAL] },
    OR: [{ paidAt: { gte: from, lte: to } }, { paidAt: null, createdAt: { gte: from, lte: to } }]
  };

  const [rooms, totalGuests, totalBookings, bookings, payments, recentBookings, todayCheckIns, currentlyInHouse, pendingArrivals] = await Promise.all([
    prisma.room.findMany({ include: { category: true } }),
    prisma.guest.count(),
    prisma.booking.count({ where: bookingDateFilter }),
    prisma.booking.findMany({ where: bookingDateFilter, include: { room: { include: { category: true } } } }),
    prisma.payment.findMany({
      where: paymentDateFilter,
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

  const roomTypes = Array.from(new Set(rooms.map((room) => room.category.name)));
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((room) => room.status === RoomStatus.OCCUPIED).length;
  const availableRooms = rooms.filter((room) => room.status === RoomStatus.AVAILABLE).length;
  const maintenanceRooms = rooms.filter((room) => room.status === RoomStatus.MAINTENANCE).length;
  const totalRevenue = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const averageRoomPrice = totalRooms > 0 ? rooms.reduce((sum, room) => sum + Number(room.pricePerNight), 0) / totalRooms : 0;

  type RevenueBucket = { key: string; period: string; revenue: number; [roomType: string]: number | string };
  const intervalDates = granularity === "day" ? eachDayOfInterval({ start: from, end: to }) : eachMonthOfInterval({ start: startOfMonth(from), end: startOfMonth(to) });
  const revenueBuckets: RevenueBucket[] = intervalDates.map((date) => {
    return {
      key: format(date, granularity === "day" ? "yyyy-MM-dd" : "yyyy-MM"),
      period: format(date, granularity === "day" ? "MMM d" : "MMM yy"),
      revenue: 0,
      ...Object.fromEntries(roomTypes.map((type) => [type, 0]))
    };
  });

  const roomTypeRevenue = new Map<string, { type: string; bookings: Set<string>; revenue: number }>();

  for (const payment of payments) {
    const paymentDate = payment.paidAt ?? payment.createdAt;
    const key = format(paymentDate, granularity === "day" ? "yyyy-MM-dd" : "yyyy-MM");
    const bucket = revenueBuckets.find((item) => item.key === key);
    const type = payment.booking.room.category.name;
    const amount = Number(payment.amount);

    if (bucket) {
      bucket.revenue += amount;
      bucket[type] = Number(bucket[type] ?? 0) + amount;
    }

    const current = roomTypeRevenue.get(type) ?? { type, bookings: new Set<string>(), revenue: 0 };
    current.bookings.add(payment.bookingId);
    current.revenue += amount;
    roomTypeRevenue.set(type, current);
  }

  const revenueTrend = revenueBuckets.map(({ period, revenue, ...roomTypeValues }) => ({ period, revenue, ...roomTypeValues }));

  for (const type of roomTypes) {
    if (!roomTypeRevenue.has(type)) {
      roomTypeRevenue.set(type, { type, bookings: new Set<string>(), revenue: 0 });
    }
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
    revenueTrend,
    revenueByRoomType: Array.from(roomTypeRevenue.values()).map((item) => ({
      type: item.type,
      bookings: item.bookings.size,
      revenue: item.revenue
    })),
    statusBreakdown,
    recentBookings: recentBookings.map(serializeBooking),
    reportRange: {
      from: format(from, "yyyy-MM-dd"),
      to: format(to, "yyyy-MM-dd"),
      granularity
    }
  });
}
