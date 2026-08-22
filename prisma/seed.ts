import bcrypt from "bcryptjs";
import { addDays, differenceInCalendarDays, startOfMonth, subDays } from "date-fns";
import { BookingStatus, PaymentMethod, PaymentStatus, PrismaClient, RoomStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

function nights(checkInDate: Date, checkOutDate: Date) {
  return Math.max(1, differenceInCalendarDays(checkOutDate, checkInDate));
}

function dateInMonth(month: number, day: number) {
  const date = startOfMonth(new Date(2026, month - 1, 1));
  date.setDate(day);
  date.setHours(10, 0, 0, 0);
  return date;
}

async function main() {
  await prisma.bookingService.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.service.deleteMany();
  await prisma.room.deleteMany();
  await prisma.roomCategory.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("password123", 12);

  const [admin, receptionist] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Aye Chan",
        email: "admin@hotel.com",
        passwordHash,
        role: UserRole.ADMIN
      }
    }),
    prisma.user.create({
      data: {
        name: "Mya Thiri",
        email: "receptionist@hotel.com",
        passwordHash,
        role: UserRole.RECEPTIONIST
      }
    })
  ]);

  const standard = await prisma.roomCategory.create({
    data: {
      name: "Standard",
      description: "Bright and comfortable rooms with city views and modern essentials.",
      basePrice: 85000
    }
  });

  const deluxe = await prisma.roomCategory.create({
    data: {
      name: "Deluxe",
      description: "Spacious rooms with premium bedding, balcony options, and premium amenities.",
      basePrice: 145000
    }
  });

  const suite = await prisma.roomCategory.create({
    data: {
      name: "Suite",
      description: "Large suites with living space, jacuzzi access, and luxury views.",
      basePrice: 275000
    }
  });

  const presidential = await prisma.roomCategory.create({
    data: {
      name: "Presidential",
      description: "Private executive suites for luxury stays and VIP guests.",
      basePrice: 590000
    }
  });

  const rooms = await Promise.all([
    prisma.room.create({ data: { roomNumber: "101", categoryId: standard.id, pricePerNight: 85000, capacity: 2, status: RoomStatus.AVAILABLE, description: "A bright and comfortable room with city view, king bed, and modern amenities.", imageUrl: "/images/rooms/room-101.jpg" } }),
    prisma.room.create({ data: { roomNumber: "102", categoryId: standard.id, pricePerNight: 95000, capacity: 2, status: RoomStatus.AVAILABLE, description: "Cozy first-floor room with quick lobby and dining access.", imageUrl: "/images/rooms/room-102.jpg" } }),
    prisma.room.create({ data: { roomNumber: "103", categoryId: standard.id, pricePerNight: 105000, capacity: 2, status: RoomStatus.AVAILABLE, description: "Quiet standard room with warm tones and complimentary Wi-Fi.", imageUrl: "/images/rooms/room-103.jpg" } }),
    prisma.room.create({ data: { roomNumber: "104", categoryId: standard.id, pricePerNight: 90000, capacity: 2, status: RoomStatus.AVAILABLE, description: "Comfortable twin room with a reading corner and soft natural light.", imageUrl: "/images/rooms/room-104.jpg" } }),
    prisma.room.create({ data: { roomNumber: "105", categoryId: standard.id, pricePerNight: 110000, capacity: 2, status: RoomStatus.AVAILABLE, description: "Modern king room with a work desk and peaceful courtyard view.", imageUrl: "/images/rooms/room-105.jpg" } }),
    prisma.room.create({ data: { roomNumber: "201", categoryId: deluxe.id, pricePerNight: 145000, capacity: 3, status: RoomStatus.OCCUPIED, description: "Spacious deluxe room with panoramic garden views and premium bedding.", imageUrl: "/images/rooms/room-201.jpg" } }),
    prisma.room.create({ data: { roomNumber: "202", categoryId: deluxe.id, pricePerNight: 155000, capacity: 3, status: RoomStatus.AVAILABLE, description: "Elegant deluxe room featuring sitting area, rain shower, and city views.", imageUrl: "/images/rooms/room-202.jpg" } }),
    prisma.room.create({ data: { roomNumber: "203", categoryId: deluxe.id, pricePerNight: 165000, capacity: 3, status: RoomStatus.AVAILABLE, description: "Deluxe corner room with designer furnishings and balcony.", imageUrl: "/images/rooms/room-203.jpg" } }),
    prisma.room.create({ data: { roomNumber: "204", categoryId: deluxe.id, pricePerNight: 150000, capacity: 3, status: RoomStatus.AVAILABLE, description: "Airy deluxe room with lounge seating and floor-to-ceiling curtains.", imageUrl: "/images/rooms/room-204.jpg" } }),
    prisma.room.create({ data: { roomNumber: "205", categoryId: deluxe.id, pricePerNight: 170000, capacity: 3, status: RoomStatus.AVAILABLE, description: "Contemporary deluxe room with premium linens and warm ambient lighting.", imageUrl: "/images/rooms/room-205.jpg" } }),
    prisma.room.create({ data: { roomNumber: "206", categoryId: deluxe.id, pricePerNight: 175000, capacity: 3, status: RoomStatus.AVAILABLE, description: "Quiet deluxe retreat with a sofa, workspace, and generous storage.", imageUrl: "/images/rooms/room-206.jpg" } }),
    prisma.room.create({ data: { roomNumber: "301", categoryId: suite.id, pricePerNight: 275000, capacity: 4, status: RoomStatus.AVAILABLE, description: "Luxury suite with separate living area, jacuzzi tub, and butler service.", imageUrl: "/images/rooms/room-301.jpg" } }),
    prisma.room.create({ data: { roomNumber: "302", categoryId: suite.id, pricePerNight: 295000, capacity: 4, status: RoomStatus.MAINTENANCE, description: "Corner suite with floor-to-ceiling windows and panoramic skyline views.", imageUrl: "/images/rooms/room-302.jpg" } }),
    prisma.room.create({ data: { roomNumber: "303", categoryId: suite.id, pricePerNight: 315000, capacity: 4, status: RoomStatus.AVAILABLE, description: "Executive suite with lounge area and private work desk.", imageUrl: "/images/rooms/room-303.jpg" } }),
    prisma.room.create({ data: { roomNumber: "304", categoryId: suite.id, pricePerNight: 285000, capacity: 4, status: RoomStatus.AVAILABLE, description: "Family suite with separate sleeping and living spaces for longer stays.", imageUrl: "/images/rooms/room-304.jpg" } }),
    prisma.room.create({ data: { roomNumber: "305", categoryId: suite.id, pricePerNight: 325000, capacity: 4, status: RoomStatus.AVAILABLE, description: "Skyline suite with a spacious lounge and elegant dining corner.", imageUrl: "/images/rooms/room-305.jpg" } }),
    prisma.room.create({ data: { roomNumber: "401", categoryId: presidential.id, pricePerNight: 590000, capacity: 6, status: RoomStatus.AVAILABLE, description: "Presidential suite with private terrace, chef kitchen, and premium concierge service.", imageUrl: "/images/rooms/room-401.jpg" } }),
    prisma.room.create({ data: { roomNumber: "402", categoryId: presidential.id, pricePerNight: 690000, capacity: 6, status: RoomStatus.AVAILABLE, description: "Grand presidential suite with luxury lounge, dining area, and VIP service.", imageUrl: "/images/rooms/room-402.jpg" } }),
    prisma.room.create({ data: { roomNumber: "403", categoryId: presidential.id, pricePerNight: 625000, capacity: 6, status: RoomStatus.AVAILABLE, description: "Executive presidential suite with private lounge and formal dining area.", imageUrl: "/images/rooms/room-403.jpg" } }),
    prisma.room.create({ data: { roomNumber: "404", categoryId: presidential.id, pricePerNight: 720000, capacity: 6, status: RoomStatus.AVAILABLE, description: "Top-floor signature suite with panoramic views and dedicated guest service.", imageUrl: "/images/rooms/room-404.jpg" } })
  ]);

  const [guestOne, guestTwo, guestThree, guestFour, guestFive] = await Promise.all([
    prisma.guest.create({ data: { name: "Ko Min Thu", email: "minthu@example.com", phone: "09 450 123 111", address: "Mandalay" } }),
    prisma.guest.create({ data: { name: "Daw Khin Hnin", email: "khinhnin@example.com", phone: "09 450 123 222", address: "Yangon" } }),
    prisma.guest.create({ data: { name: "Mr. James Carter", email: "james.carter@example.com", phone: "+1 555 0199", address: "Singapore" } }),
    prisma.guest.create({ data: { name: "Ma Thae Su", email: "thaesu@example.com", phone: "09 450 123 333", address: "Naypyidaw" } }),
    prisma.guest.create({ data: { name: "Ms. Hana Lee", email: "hana.lee@example.com", phone: "+82 10 5555 2026", address: "Seoul" } })
  ]);

  const [breakfast, airportTransfer, laundry, spa, lateCheckout] = await Promise.all([
    prisma.service.create({ data: { name: "Breakfast Buffet", description: "Daily international breakfast buffet.", price: 18000, isActive: true } }),
    prisma.service.create({ data: { name: "Airport Transfer", description: "Private car pickup or drop-off.", price: 45000, isActive: true } }),
    prisma.service.create({ data: { name: "Laundry Service", description: "Same-day laundry and pressing.", price: 20000, isActive: true } }),
    prisma.service.create({ data: { name: "Spa Package", description: "Relaxing spa treatment package.", price: 85000, isActive: true } }),
    prisma.service.create({ data: { name: "Late Checkout", description: "Checkout extension subject to availability.", price: 35000, isActive: true } })
  ]);

  async function createBooking(input: {
    guestId: string;
    roomIndex: number;
    checkInDate: Date;
    checkOutDate: Date;
    status: BookingStatus;
    createdById: string;
    services?: Array<{ serviceId: string; quantity: number; unitPrice: number }>;
    notes?: string;
    createdAt?: Date;
  }) {
    const room = rooms[input.roomIndex];
    const totalNights = nights(input.checkInDate, input.checkOutDate);
    const roomTotal = totalNights * Number(room.pricePerNight);
    const serviceItems = input.services ?? [];
    const serviceTotal = serviceItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    return prisma.booking.create({
      data: {
        guestId: input.guestId,
        roomId: room.id,
        createdById: input.createdById,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        totalNights,
        roomTotal,
        serviceTotal,
        totalAmount: roomTotal + serviceTotal,
        status: input.status,
        notes: input.notes,
        createdAt: input.createdAt,
        updatedAt: input.createdAt,
        services: serviceItems.length
          ? {
              create: serviceItems.map((item) => ({
                serviceId: item.serviceId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice
              }))
            }
          : undefined
      }
    });
  }

  const checkedInBooking = await createBooking({
    guestId: guestOne.id,
    roomIndex: 5,
    checkInDate: subDays(new Date(), 1),
    checkOutDate: addDays(new Date(), 2),
    status: BookingStatus.CHECKED_IN,
    createdById: receptionist.id,
    services: [
      { serviceId: breakfast.id, quantity: 2, unitPrice: 18000 },
      { serviceId: laundry.id, quantity: 1, unitPrice: 20000 }
    ],
    notes: "Guest requested quiet floor."
  });

  const pastBooking = await createBooking({
    guestId: guestTwo.id,
    roomIndex: 0,
    checkInDate: subDays(new Date(), 12),
    checkOutDate: subDays(new Date(), 9),
    status: BookingStatus.CHECKED_OUT,
    createdById: admin.id,
    services: [{ serviceId: airportTransfer.id, quantity: 1, unitPrice: 45000 }],
    notes: "Paid by card."
  });

  const futureBooking = await createBooking({
    guestId: guestThree.id,
    roomIndex: 6,
    checkInDate: addDays(new Date(), 3),
    checkOutDate: addDays(new Date(), 6),
    status: BookingStatus.CONFIRMED,
    createdById: receptionist.id,
    services: [{ serviceId: spa.id, quantity: 1, unitPrice: 85000 }],
    notes: "VIP welcome fruit basket."
  });

  const pendingBooking = await createBooking({
    guestId: guestFour.id,
    roomIndex: 1,
    checkInDate: addDays(new Date(), 1),
    checkOutDate: addDays(new Date(), 4),
    status: BookingStatus.PENDING,
    createdById: receptionist.id,
    services: [{ serviceId: lateCheckout.id, quantity: 1, unitPrice: 35000 }],
    notes: "Payment pending."
  });

  await createBooking({
    guestId: guestFive.id,
    roomIndex: 9,
    checkInDate: addDays(new Date(), 10),
    checkOutDate: addDays(new Date(), 14),
    status: BookingStatus.CONFIRMED,
    createdById: admin.id,
    notes: "Anniversary stay."
  });

  await createBooking({
    guestId: guestOne.id,
    roomIndex: 2,
    checkInDate: addDays(new Date(), 5),
    checkOutDate: addDays(new Date(), 8),
    status: BookingStatus.CANCELLED,
    createdById: receptionist.id,
    services: [{ serviceId: breakfast.id, quantity: 1, unitPrice: 18000 }],
    notes: "Guest cancelled due to travel changes."
  });

  const monthlyBookings = Array.from({ length: 9 }).flatMap((_, index) => {
    const month = index + 1;
    const guestId = [guestOne.id, guestTwo.id, guestThree.id, guestFour.id, guestFive.id][index % 5];
    return [
      { month, day: 6, guestId, roomIndex: index % 3, nights: 2 + (index % 2), status: BookingStatus.CHECKED_OUT, services: [{ serviceId: breakfast.id, quantity: 2, unitPrice: 18000 }], paymentMethod: PaymentMethod.CARD },
      { month, day: 19, guestId, roomIndex: 3 + (index % 8), nights: 2 + ((index + 1) % 3), status: BookingStatus.CHECKED_OUT, services: [{ serviceId: index % 2 ? spa.id : airportTransfer.id, quantity: 1, unitPrice: index % 2 ? 85000 : 45000 }], paymentMethod: PaymentMethod.BANK_TRANSFER }
    ];
  });

  monthlyBookings.push(
    { month: 9, day: 25, guestId: guestFive.id, roomIndex: 9, nights: 2, status: BookingStatus.CHECKED_OUT, services: [], paymentMethod: PaymentMethod.CARD }
  );

  const cancelledBookings = [
    { month: 3, day: 12, guestId: guestTwo.id, roomIndex: 4, nights: 3, services: [{ serviceId: breakfast.id, quantity: 2, unitPrice: 18000 }], paymentMethod: PaymentMethod.CARD },
    { month: 6, day: 8, guestId: guestFour.id, roomIndex: 7, nights: 2, services: [{ serviceId: spa.id, quantity: 1, unitPrice: 85000 }], paymentMethod: PaymentMethod.BANK_TRANSFER }
  ];

  for (const item of cancelledBookings) {
    const checkInDate = dateInMonth(item.month, item.day);
    const booking = await createBooking({
      guestId: item.guestId,
      roomIndex: item.roomIndex,
      checkInDate,
      checkOutDate: addDays(checkInDate, item.nights),
      status: BookingStatus.CANCELLED,
      createdById: item.month % 2 === 0 ? admin.id : receptionist.id,
      services: item.services,
      createdAt: subDays(checkInDate, 5),
      notes: "Guest cancelled reservation."
    });

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: Number(booking.totalAmount),
        method: item.paymentMethod,
        status: PaymentStatus.REFUNDED,
        paidAt: subDays(checkInDate, 2),
        createdAt: subDays(checkInDate, 2),
        updatedAt: subDays(checkInDate, 1)
      }
    });
  }

  for (const item of monthlyBookings) {
    const checkInDate = dateInMonth(item.month, item.day);
    const booking = await createBooking({
      guestId: item.guestId,
      roomIndex: item.roomIndex,
      checkInDate,
      checkOutDate: addDays(checkInDate, item.nights),
      status: item.status,
      createdById: item.month % 2 === 0 ? admin.id : receptionist.id,
      services: item.services,
      createdAt: subDays(checkInDate, 8),
      notes: "Seeded monthly booking for revenue reporting."
    });

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: Number(booking.totalAmount),
        method: item.paymentMethod,
        status: PaymentStatus.PAID,
        paidAt: addDays(checkInDate, item.nights),
        createdAt: addDays(checkInDate, item.nights),
        updatedAt: addDays(checkInDate, item.nights)
      }
    });
  }

  await Promise.all([
    prisma.payment.create({ data: { bookingId: checkedInBooking.id, amount: 260000, method: PaymentMethod.CASH, status: PaymentStatus.PARTIAL, paidAt: subDays(new Date(), 1) } }),
    prisma.payment.create({ data: { bookingId: pastBooking.id, amount: Number(pastBooking.totalAmount), method: PaymentMethod.CARD, status: PaymentStatus.PAID, paidAt: subDays(new Date(), 9) } }),
    prisma.payment.create({ data: { bookingId: futureBooking.id, amount: 300000, method: PaymentMethod.BANK_TRANSFER, status: PaymentStatus.PARTIAL, paidAt: new Date() } }),
    prisma.payment.create({ data: { bookingId: pendingBooking.id, amount: 0, method: PaymentMethod.CASH, status: PaymentStatus.UNPAID } })
  ]);

  console.log("Seed completed for Hotel Admin System.");
  console.log("Admin: admin@hotel.com / password123");
  console.log("Receptionist: receptionist@hotel.com / password123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
