import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { isAuthError, requireApiSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { guestCreateSchema } from "@/lib/validations/guest";

export async function GET(request: NextRequest) {
  const session = await requireApiSession(["ADMIN", "RECEPTIONIST"]);
  if (isAuthError(session)) {
    return session;
  }

  const search = request.nextUrl.searchParams.get("search")?.trim();
  const where: Prisma.GuestWhereInput = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } }
        ]
      }
    : {};

  const guests = await prisma.guest.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ guests });
}

export async function POST(request: NextRequest) {
  const session = await requireApiSession(["ADMIN", "RECEPTIONIST"]);
  if (isAuthError(session)) {
    return session;
  }

  try {
    const input = guestCreateSchema.parse(await request.json());
    const guest = await prisma.guest.create({ data: input });
    return NextResponse.json({ guest }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Guest creation failed." }, { status: 400 });
  }
}
