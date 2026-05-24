import type { Prisma } from "@prisma/client";

export type RoomWithCategory = Prisma.RoomGetPayload<{
  include: { category: true };
}>;

export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: {
    guest: true;
    room: { include: { category: true } };
    payments: true;
    services: { include: { service: true } };
  };
}>;

export type PaymentWithBooking = Prisma.PaymentGetPayload<{
  include: {
    booking: {
      include: {
        guest: true;
        room: { include: { category: true } };
      };
    };
  };
}>;

export function serializeCategory(category: RoomWithCategory["category"]) {
  return {
    ...category,
    basePrice: Number(category.basePrice)
  };
}

export function serializeRoom(room: RoomWithCategory) {
  return {
    ...room,
    pricePerNight: Number(room.pricePerNight),
    category: serializeCategory(room.category)
  };
}

export function serializeBooking(booking: BookingWithRelations) {
  return {
    ...booking,
    roomTotal: Number(booking.roomTotal),
    serviceTotal: Number(booking.serviceTotal),
    totalAmount: Number(booking.totalAmount),
    room: serializeRoom(booking.room),
    payments: booking.payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount)
    })),
    services: booking.services.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
      service: {
        ...item.service,
        price: Number(item.service.price)
      }
    }))
  };
}

export function serializePayment(payment: PaymentWithBooking) {
  return {
    ...payment,
    amount: Number(payment.amount),
    booking: {
      ...payment.booking,
      roomTotal: Number(payment.booking.roomTotal),
      serviceTotal: Number(payment.booking.serviceTotal),
      totalAmount: Number(payment.booking.totalAmount),
      room: serializeRoom(payment.booking.room)
    }
  };
}
