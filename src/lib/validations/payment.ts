import { z } from "zod";

export const paymentCreateSchema = z.object({
  bookingId: z.string().trim().min(1, "Booking is required."),
  amount: z.coerce.number().positive("Amount must be greater than zero."),
  method: z.enum(["CASH", "CARD", "BANK_TRANSFER", "MOBILE_PAY"]),
  status: z.enum(["UNPAID", "PARTIAL", "PAID", "REFUNDED"]).default("PAID"),
  paidAt: z.coerce.date().optional()
});

export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
