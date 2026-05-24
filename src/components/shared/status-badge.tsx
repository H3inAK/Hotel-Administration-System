import { Badge } from "@/components/ui/badge";
import { toTitleCase } from "@/lib/format";
import type { BookingStatus, PaymentStatus, RoomStatus } from "@/types";

type StatusBadgeProps = {
  status: RoomStatus | BookingStatus | PaymentStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant = (() => {
    if (["AVAILABLE", "CONFIRMED", "CHECKED_OUT", "PAID"].includes(status)) {
      return "success" as const;
    }
    if (["PENDING", "PARTIAL", "MAINTENANCE"].includes(status)) {
      return "warning" as const;
    }
    if (["CANCELLED", "REFUNDED"].includes(status)) {
      return "danger" as const;
    }
    if (["OCCUPIED", "CHECKED_IN"].includes(status)) {
      return "info" as const;
    }
    return "muted" as const;
  })();

  return <Badge variant={variant}>{toTitleCase(status)}</Badge>;
}
