export const bookingStatusLabels: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked-In",
  CHECKED_OUT: "Checked-Out",
  CANCELLED: "Cancelled"
};

export function calculateOccupancyRate(occupiedRooms: number, totalRooms: number) {
  if (totalRooms === 0) {
    return 0;
  }

  return Math.round((occupiedRooms / totalRooms) * 100);
}

export function calculateProgressValue(value: number, max: number) {
  if (max <= 0) {
    return 0;
  }

  return Math.round((value / max) * 100);
}
