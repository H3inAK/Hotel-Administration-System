export type UserRole = "ADMIN" | "RECEPTIONIST";
export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED";
export type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER" | "MOBILE_PAY";

export type UserSession = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type RoomCategory = {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  createdAt: string;
  updatedAt: string;
};

export type Room = {
  id: string;
  roomNumber: string;
  categoryId: string;
  category: RoomCategory;
  pricePerNight: number;
  capacity: number;
  status: RoomStatus;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Guest = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BookingServiceItem = {
  id: string;
  bookingId: string;
  serviceId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  service: Service;
};

export type Payment = {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Booking = {
  id: string;
  guestId: string;
  guest: Guest;
  roomId: string;
  room: Room;
  createdById: string | null;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  roomTotal: number;
  serviceTotal: number;
  totalAmount: number;
  status: BookingStatus;
  notes: string | null;
  payments: Payment[];
  services: BookingServiceItem[];
  createdAt: string;
  updatedAt: string;
};

export type SummaryMetric = {
  totalRevenue: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  maintenanceRooms: number;
  occupancyRate: number;
  totalGuests: number;
  totalBookings: number;
  averageRoomPrice: number;
  todayCheckIns: number;
  currentlyInHouse: number;
  pendingArrivals: number;
};

export type MonthlyRevenue = {
  month: string;
  revenue: number;
};

export type RevenueByRoomType = {
  type: string;
  bookings: number;
  revenue: number;
};

export type StatusBreakdown = {
  status: BookingStatus;
  label: string;
  count: number;
};

export type ReportSummary = {
  metrics: SummaryMetric;
  monthlyRevenue: MonthlyRevenue[];
  revenueByRoomType: RevenueByRoomType[];
  statusBreakdown: StatusBreakdown[];
  recentBookings: Booking[];
};

export type RoomListResponse = {
  rooms: Room[];
  categories: RoomCategory[];
};

export type GuestListResponse = {
  guests: Guest[];
};

export type BookingListResponse = {
  bookings: Booking[];
};
