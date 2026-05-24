import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireApiSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeRoom } from "@/lib/serializers";
import { roomUpdateSchema } from "@/lib/validations/room";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const room = await prisma.room.findUnique({ where: { id }, include: { category: true } });

  if (!room) {
    return NextResponse.json({ message: "Room not found." }, { status: 404 });
  }

  return NextResponse.json({ room: serializeRoom(room) });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await requireApiSession(["ADMIN"]);
  if (isAuthError(session)) {
    return session;
  }

  try {
    const { id } = await context.params;
    const input = roomUpdateSchema.parse(await request.json());
    const room = await prisma.room.update({
      where: { id },
      data: input,
      include: { category: true }
    });

    return NextResponse.json({ room: serializeRoom(room) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "Room number already exists." }, { status: 409 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ message: "Room not found." }, { status: 404 });
    }

    return NextResponse.json({ message: error instanceof Error ? error.message : "Room update failed." }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await requireApiSession(["ADMIN"]);
  if (isAuthError(session)) {
    return session;
  }

  try {
    const { id } = await context.params;
    await prisma.room.delete({ where: { id } });
    return NextResponse.json({ message: "Room deleted." });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return NextResponse.json({ message: "Cannot delete a room with existing bookings." }, { status: 409 });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ message: "Room not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Room deletion failed." }, { status: 400 });
  }
}
