import { NextRequest, NextResponse } from "next/server";
import { ensureRoomCanBeBooked } from "@/lib/booking-utils";
import { prisma } from "@/lib/prisma";
import { availabilitySchema } from "@/lib/validations/booking";

export async function POST(request: NextRequest) {
  try {
    const input = availabilitySchema.parse(await request.json());
    const result = await ensureRoomCanBeBooked(prisma, input.roomId, input.checkInDate, input.checkOutDate, input.excludeBookingId);

    return NextResponse.json({
      available: result.available,
      reason: result.reason,
      roomId: input.roomId
    });
  } catch (error) {
    return NextResponse.json({ available: false, reason: error instanceof Error ? error.message : "Availability check failed." }, { status: 400 });
  }
}
