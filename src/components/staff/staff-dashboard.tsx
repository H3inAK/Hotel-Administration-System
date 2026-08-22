"use client";

import { CalendarCheck, DoorOpen, LogIn, Search, Timer, Users } from "lucide-react";
import { isSameDay, parseISO } from "date-fns";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { PaymentDialog } from "@/components/payments/payment-dialog";
import { StaffBookingTable } from "@/components/staff/staff-booking-table";
import { MetricCard } from "@/components/shared/metric-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardStore, type StaffTab } from "@/stores/dashboard-store";
import type { Booking, BookingListResponse, ReportSummary } from "@/types";

const tabs: Array<{ value: StaffTab; label: string }> = [
  { value: "today", label: "Today" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "all", label: "All Bookings" }
];

export function StaffDashboard() {
  const selectedTab = useDashboardStore((state) => state.selectedStaffTab);
  const setSelectedTab = useDashboardStore((state) => state.setSelectedStaffTab);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingResponse, summaryResponse] = await Promise.all([
        fetch("/api/bookings", { cache: "no-store" }),
        fetch("/api/reports/summary", { cache: "no-store" })
      ]);
      if (!bookingResponse.ok || !summaryResponse.ok) {
        throw new Error("Unable to load dashboard");
      }
      setBookings(((await bookingResponse.json()) as BookingListResponse).bookings);
      setSummary((await summaryResponse.json()) as ReportSummary);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredBookings = useMemo(() => {
    const query = search.toLowerCase();
    const today = new Date();
    return bookings.filter((booking) => {
      const matchesSearch = booking.guest.name.toLowerCase().includes(query) || booking.room.roomNumber.toLowerCase().includes(query);
      const matchesTab = (() => {
        if (selectedTab === "today") {
          return isSameDay(parseISO(booking.checkInDate), today) && ["PENDING", "CONFIRMED"].includes(booking.status);
        }
        if (selectedTab === "active") {
          return booking.status === "CHECKED_IN";
        }
        if (selectedTab === "pending") {
          return ["PENDING", "CONFIRMED"].includes(booking.status);
        }
        return true;
      })();
      return matchesSearch && matchesTab;
    });
  }, [bookings, search, selectedTab]);

  return (
    <div className="page-shell">
      <AppHeader />
      <main className="mx-auto min-h-[calc(100vh-160px)] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <h1 className="hotel-heading text-3xl font-bold text-slate-950">Staff Dashboard</h1>
          <p className="text-slate-500">Manage daily operations, guest check-ins, check-outs, and payments.</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {loading || !summary ? (
            Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32" />)
          ) : (
            <>
              <MetricCard title="Today's Check-ins" value={summary.metrics.todayCheckIns} icon={CalendarCheck} tone="blue" />
              <MetricCard title="Currently In-house" value={summary.metrics.currentlyInHouse} icon={LogIn} tone="green" />
              <MetricCard title="Pending Arrivals" value={summary.metrics.pendingArrivals} icon={Timer} tone="gold" />
              <MetricCard title="Total Bookings" value={summary.metrics.totalBookings} icon={DoorOpen} tone="purple" />
            </>
          )}
        </div>

        <div className="mt-8 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input className="pl-10" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by guest or room..." />
          </div>
        </div>
        <div className="mt-5">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} active={selectedTab === tab.value} onClick={() => setSelectedTab(tab.value)}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">Loading bookings...</div>
          ) : filteredBookings.length === 0 ? (
            <EmptyState title="No bookings found" description="There are no bookings for this filter." icon={Users} />
          ) : (
            <StaffBookingTable bookings={filteredBookings} onChanged={loadData} onPayment={setPaymentBooking} />
          )}
        </div>
      </main>
      <AppFooter />
      <PaymentDialog
        booking={paymentBooking}
        open={Boolean(paymentBooking)}
        onOpenChange={(open) => !open && setPaymentBooking(null)}
        onSaved={async () => {
          setPaymentBooking(null);
          await loadData();
        }}
      />
    </div>
  );
}
