"use client";

import { BedDouble, DollarSign, TrendingUp, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { BookingManagement } from "@/components/bookings/booking-management";
import { GuestManagement } from "@/components/guests/guest-management";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";
import { RoomManagement } from "@/components/rooms/room-management";
import { MetricCard } from "@/components/shared/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/format";
import { useDashboardStore, type AdminTab } from "@/stores/dashboard-store";
import type { ReportSummary } from "@/types";

const tabs: Array<{ value: AdminTab; label: string }> = [
  { value: "rooms", label: "Rooms" },
  { value: "guests", label: "Guests" },
  { value: "bookings", label: "Bookings" },
  { value: "reports", label: "Reports" }
];

export function AdminDashboard() {
  const selectedTab = useDashboardStore((state) => state.selectedAdminTab);
  const setSelectedTab = useDashboardStore((state) => state.setSelectedAdminTab);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/reports/summary", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load reports");
      }
      setSummary((await response.json()) as ReportSummary);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  return (
    <div className="page-shell">
      <AppHeader />
      <main className="mx-auto min-h-[calc(100vh-160px)] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 text-white shadow-lg">
            <TrendingUp className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-950">Admin Dashboard</h1>
            <p className="text-slate-500">Hotel management, room control, booking oversight, and analytics.</p>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {loading || !summary ? (
            Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36" />)
          ) : (
            <>
              <MetricCard title="Total Revenue" value={formatCurrency(summary.metrics.totalRevenue)} helper="Collected payments" icon={DollarSign} tone="green" />
              <MetricCard title="Occupancy Rate" value={`${summary.metrics.occupancyRate}%`} helper={`${summary.metrics.occupiedRooms} of ${summary.metrics.totalRooms} rooms`} icon={TrendingUp} tone="blue" />
              <MetricCard title="Total Rooms" value={summary.metrics.totalRooms} helper={`Avg ${formatCurrency(summary.metrics.averageRoomPrice)}/night`} icon={BedDouble} tone="purple" />
              <MetricCard title="Total Guests" value={summary.metrics.totalGuests} helper="Registered guest records" icon={Users} tone="gold" />
            </>
          )}
        </div>

        <div className="mt-8">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} active={selectedTab === tab.value} onClick={() => setSelectedTab(tab.value)}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="mt-8">
          {selectedTab === "rooms" ? <RoomManagement onChanged={loadSummary} /> : null}
          {selectedTab === "guests" ? <GuestManagement onChanged={loadSummary} /> : null}
          {selectedTab === "bookings" ? <BookingManagement onChanged={loadSummary} /> : null}
          {selectedTab === "reports" ? <ReportsDashboard summary={summary} onRefresh={loadSummary} loading={loading} /> : null}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
