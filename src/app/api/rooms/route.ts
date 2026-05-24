import { Prisma, RoomStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireApiSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeCategory, serializeRoom } from "@/lib/serializers";
import { roomCreateSchema } from "@/lib/validations/room";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search")?.trim();
  const status = searchParams.get("status");
  const categoryId = searchParams.get("categoryId");

  const where: Prisma.RoomWhereInput = {};

  if (search) {
    where.OR = [
      { roomNumber: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { category: { name: { contains: search, mode: "insensitive" } } }
    ];
  }

  if (status && Object.values(RoomStatus).includes(status as RoomStatus)) {
    where.status = status as RoomStatus;
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  const [rooms, categories] = await Promise.all([
    prisma.room.findMany({ where, include: { category: true }, orderBy: [{ roomNumber: "asc" }] }),
    prisma.roomCategory.findMany({ orderBy: { basePrice: "asc" } })
  ]);

  return NextResponse.json({
    rooms: rooms.map(serializeRoom),
    categories: categories.map(serializeCategory)
  });
}

export async function POST(request: NextRequest) {
  const session = await requireApiSession(["ADMIN"]);
  if (isAuthError(session)) {
    return session;
  }

  try {
    const input = roomCreateSchema.parse(await request.json());
    const room = await prisma.room.create({
      data: input,
      include: { category: true }
    });

    return NextResponse.json({ room: serializeRoom(room) }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ message: "Room number already exists." }, { status: 409 });
    }

    return NextResponse.json({ message: error instanceof Error ? error.message : "Room creation failed." }, { status: 400 });
  }
}
