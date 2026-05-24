import { PaymentStatus, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireApiSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializePayment } from "@/lib/serializers";
import { paymentCreateSchema } from "@/lib/validations/payment";

const paymentInclude = {
  booking: {
    include: {
      guest: true,
      room: { include: { category: true } }
    }
  }
} satisfies Prisma.PaymentInclude;

export async function GET() {
  const session = await requireApiSession(["ADMIN", "RECEPTIONIST"]);
  if (isAuthError(session)) {
    return session;
  }

  const payments = await prisma.payment.findMany({
    include: paymentInclude,
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ payments: payments.map(serializePayment) });
}

export async function POST(request: NextRequest) {
  const session = await requireApiSession(["ADMIN", "RECEPTIONIST"]);
  if (isAuthError(session)) {
    return session;
  }

  try {
    const input = paymentCreateSchema.parse(await request.json());
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: { payments: true }
    });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId: input.bookingId,
        amount: input.amount,
        method: input.method,
        status: input.status ?? PaymentStatus.PAID,
        paidAt: input.paidAt ?? new Date()
      },
      include: paymentInclude
    });

    return NextResponse.json({ payment: serializePayment(payment) }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Payment creation failed." }, { status: 400 });
  }
}
