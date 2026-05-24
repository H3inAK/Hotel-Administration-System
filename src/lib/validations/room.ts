import { z } from "zod";

const roomStatusSchema = z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE"]);

export const roomCreateSchema = z.object({
  roomNumber: z.string().trim().min(1, "Room number is required.").max(20, "Room number is too long."),
  categoryId: z.string().trim().min(1, "Room category is required."),
  pricePerNight: z.coerce.number().positive("Price per night must be greater than zero."),
  capacity: z.coerce.number().int().positive("Capacity must be at least one."),
  status: roomStatusSchema.default("AVAILABLE"),
  description: z.preprocess((value) => (value === "" ? undefined : value), z.string().max(500).optional()),
  imageUrl: z.preprocess((value) => (value === "" ? undefined : value), z.string().url("Enter a valid image URL.").optional())
});

export const roomUpdateSchema = roomCreateSchema.partial();

export type RoomCreateInput = z.infer<typeof roomCreateSchema>;
export type RoomUpdateInput = z.infer<typeof roomUpdateSchema>;
