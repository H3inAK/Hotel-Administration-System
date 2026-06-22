import { BedDouble, DollarSign, TrendingUp, Users } from "lucide-react";
import { MetricCard } from "@/components/shared/metric-card";
import { formatCompactCurrency } from "@/lib/format";
import type { ReportSummary } from "@/types";

export function AdminStats({ summary }: { summary: ReportSummary }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard title="Total Revenue" value={formatCompactCurrency(summary.metrics.totalRevenue)} helper="Collected payments" icon={DollarSign} tone="green" />
      <MetricCard title="Occupancy Rate" value={`${summary.metrics.occupancyRate}%`} helper={`${summary.metrics.occupiedRooms} occupied`} icon={TrendingUp} tone="blue" />
      <MetricCard title="Total Rooms" value={summary.metrics.totalRooms} helper="Inventory count" icon={BedDouble} tone="purple" />
      <MetricCard title="Total Guests" value={summary.metrics.totalGuests} helper="Registered profiles" icon={Users} tone="gold" />
    </div>
  );
}
