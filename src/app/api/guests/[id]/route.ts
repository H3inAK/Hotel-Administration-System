import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireApiSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { guestUpdateSchema } from "@/lib/validations/guest";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await requireApiSession(["ADMIN", "RECEPTIONIST"]);
  if (isAuthError(session)) {
    return session;
  }

  const { id } = await context.params;
  const guest = await prisma.guest.findUnique({ where: { id } });

  if (!guest) {
    return NextResponse.json({ message: "Guest not found." }, { status: 404 });
  }

  return NextResponse.json({ guest });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await requireApiSession(["ADMIN", "RECEPTIONIST"]);
  if (isAuthError(session)) {
    return session;
  }

  try {
    const { id } = await context.params;
    const input = guestUpdateSchema.parse(await request.json());
    const guest = await prisma.guest.update({ where: { id }, data: input });
    return NextResponse.json({ guest });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ message: "Guest not found." }, { status: 404 });
    }

    return NextResponse.json({ message: error instanceof Error ? error.message : "Guest update failed." }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await requireApiSession(["ADMIN"]);
  if (isAuthError(session)) {
    return session;
  }

  try {
    const { id } = await context.params;
    await prisma.guest.delete({ where: { id } });
    return NextResponse.json({ message: "Guest deleted." });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ message: "Cannot delete a guest with existing bookings." }, { status: 409 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ message: "Guest not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Guest deletion failed." }, { status: 400 });
  }
}
