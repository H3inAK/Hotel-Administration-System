import { z } from "zod";
import { guestCreateSchema } from "@/lib/validations/guest";

const optionalIdSchema = z.preprocess((value) => (value === "" ? undefined : value), z.string().trim().min(1).optional());

export const bookingServiceSchema = z.object({
  serviceId: z.string().trim().min(1),
  quantity: z.coerce.number().int().positive().default(1)
});

export const bookingCreateSchema = z
  .object({
    guestId: optionalIdSchema,
    guest: guestCreateSchema.optional(),
    roomId: z.string().trim().min(1, "Room is required."),
    checkInDate: z.coerce.date({ required_error: "Check-in date is required." }),
    checkOutDate: z.coerce.date({ required_error: "Check-out date is required." }),
    status: z.enum(["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"]).optional(),
    notes: z.preprocess((value) => (value === "" ? undefined : value), z.string().max(600).optional()),
    services: z.array(bookingServiceSchema).optional()
  })
  .superRefine((value, ctx) => {
    if (!value.guestId && !value.guest) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["guestId"],
        message: "Select an existing guest or enter guest details."
      });
    }

    if (value.checkOutDate <= value.checkInDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["checkOutDate"],
        message: "Check-out date must be after check-in date."
      });
    }
  });

export const bookingUpdateSchema = z
  .object({
    guestId: optionalIdSchema,
    roomId: optionalIdSchema,
    checkInDate: z.coerce.date().optional(),
    checkOutDate: z.coerce.date().optional(),
    status: z.enum(["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"]).optional(),
    notes: z.preprocess((value) => (value === "" ? undefined : value), z.string().max(600).optional()),
    services: z.array(bookingServiceSchema).optional()
  })
  .superRefine((value, ctx) => {
    if (value.checkInDate && value.checkOutDate && value.checkOutDate <= value.checkInDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["checkOutDate"],
        message: "Check-out date must be after check-in date."
      });
    }
  });

export const availabilitySchema = z
  .object({
    roomId: z.string().trim().min(1, "Room is required."),
    checkInDate: z.coerce.date(),
    checkOutDate: z.coerce.date(),
    excludeBookingId: optionalIdSchema
  })
  .superRefine((value, ctx) => {
    if (value.checkOutDate <= value.checkInDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["checkOutDate"],
        message: "Check-out date must be after check-in date."
      });
    }
  });

export const bookingActionSchema = z.object({
  bookingId: z.string().trim().min(1, "Booking is required.")
});

export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
export type BookingUpdateInput = z.infer<typeof bookingUpdateSchema>;
export type AvailabilityInput = z.infer<typeof availabilitySchema>;
