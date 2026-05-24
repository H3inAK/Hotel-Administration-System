import { z } from "zod";

export const guestCreateSchema = z.object({
  name: z.string().trim().min(2, "Guest name must be at least 2 characters."),
  email: z.preprocess((value) => (value === "" ? undefined : value), z.string().email("Enter a valid email.").optional()),
  phone: z.string().trim().min(5, "Phone number is required."),
  address: z.preprocess((value) => (value === "" ? undefined : value), z.string().max(300).optional())
});

export const guestUpdateSchema = guestCreateSchema.partial();

export type GuestCreateInput = z.infer<typeof guestCreateSchema>;
export type GuestUpdateInput = z.infer<typeof guestUpdateSchema>;
