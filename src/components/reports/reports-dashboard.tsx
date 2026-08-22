"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarRange, DollarSign, Hotel, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MetricCard } from "@/components/shared/metric-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import { calculateProgressValue } from "@/lib/report-utils";
import type { ReportSummary } from "@/types";

type ReportsDashboardProps = {
  summary: ReportSummary | null;
  loading: boolean;
  onRefresh: () => void | Promise<void>;
};

const granularityOptions = [
  { value: "month", label: "Monthly" },
  { value: "day", label: "Daily" }
];

export function ReportsDashboard({ summary, loading, onRefresh }: ReportsDashboardProps) {
  const [report, setReport] = useState(summary);
  const [from, setFrom] = useState(summary?.reportRange.from ?? "");
  const [to, setTo] = useState(summary?.reportRange.to ?? "");
  const [granularity, setGranularity] = useState<"day" | "month">(summary?.reportRange.granularity ?? "month");
  const [filtering, setFiltering] = useState(false);

  useEffect(() => {
    setReport(summary);
    if (summary && !from && !to) {
      setFrom(summary.reportRange.from);
      setTo(summary.reportRange.to);
      setGranularity(summary.reportRange.granularity);
    }
  }, [from, summary, to]);

  async function loadFilteredReport(refreshParent = false) {
    if (!from || !to) {
      toast.error("Choose both a start date and an end date.");
      return;
    }

    setFiltering(true);
    try {
      if (refreshParent) await onRefresh();
      const query = new URLSearchParams({ from, to, granularity });
      const response = await fetch(`/api/reports/summary?${query}`, { cache: "no-store" });
      const payload = (await response.json()) as ReportSummary & { message?: string };
      if (!response.ok) throw new Error(payload.message ?? "Unable to load reports");
      setReport(payload);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load reports");
    } finally {
      setFiltering(false);
    }
  }

  if (loading || !report) return <Skeleton className="h-[520px] w-full" />;

  const maxStatus = Math.max(...report.statusBreakdown.map((item) => item.count), 1);
  const roomTypes = report.revenueByRoomType.map((item) => item.type);
  const roomTypeColors = ["#2563eb", "#e8a522", "#059669", "#d97706"];
  const chartWidth = Math.max(720, report.revenueTrend.length * (granularity === "day" ? 38 : 74));

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">Reports</h2>
        <p className="text-sm text-slate-500">Filter revenue and booking reports by date, then group the graph by day or month.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_180px_auto] xl:items-end">
            <div className="space-y-2"><Label htmlFor="report-from">From</Label><Input id="report-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="report-to">To</Label><Input id="report-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></div>
            <div className="space-y-2"><Label>Group By</Label><FilterSelect ariaLabel="Group report by" value={granularity} options={granularityOptions} onChange={(value) => setGranularity(value as "day" | "month")} /></div>
            <div className="flex gap-2">
              <Button variant="gold" disabled={filtering} onClick={() => void loadFilteredReport()}><CalendarRange className="h-4 w-4" /> {filtering ? "Calculating..." : "Apply"}</Button>
              <Button variant="outline" disabled={filtering} onClick={() => void loadFilteredReport(true)}>Refresh</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-3">
        <MetricCard title="Total Revenue" value={formatCompactCurrency(report.metrics.totalRevenue)} helper={`${report.reportRange.from} to ${report.reportRange.to}`} icon={DollarSign} tone="green" />
        <MetricCard title="Bookings" value={report.metrics.totalBookings} helper="Check-ins within selected dates" icon={ReceiptText} tone="blue" />
        <MetricCard title="Revenue Room Types" value={report.revenueByRoomType.filter((item) => item.revenue > 0).length} helper="Room types earning revenue" icon={Hotel} tone="gold" />
      </div>

      <Card>
        <CardHeader><CardTitle>{report.reportRange.granularity === "day" ? "Daily" : "Monthly"} Revenue by Room Type</CardTitle></CardHeader>
        <CardContent>
          {report.revenueTrend.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-slate-500">No revenue data for this date range</div>
          ) : (
            <div className="overflow-x-auto pb-2"><div className="h-80" style={{ width: chartWidth }}>
              <ResponsiveContainer width="100%" height="100%"><BarChart data={report.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="period" /><YAxis tickFormatter={(value) => `${Math.round(Number(value) / 100000)}L`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} /><Legend />
                {roomTypes.map((type, index) => <Bar key={type} dataKey={type} fill={roomTypeColors[index % roomTypeColors.length]} radius={[5, 5, 0, 0]} />)}
              </BarChart></ResponsiveContainer>
            </div></div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Revenue by Room Type</CardTitle></CardHeader>
          <CardContent><div className="overflow-hidden rounded-2xl border border-slate-200"><table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600"><tr><th className="px-4 py-3">Type</th><th className="px-4 py-3">Bookings</th><th className="px-4 py-3">Revenue</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{report.revenueByRoomType.map((item) => (
              <tr key={item.type}><td className="px-4 py-3 font-semibold text-slate-950">{item.type}</td><td className="px-4 py-3">{item.bookings}</td><td className="px-4 py-3">{formatCompactCurrency(item.revenue)}</td></tr>
            ))}</tbody>
          </table></div></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Booking Status Breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-4">{report.statusBreakdown.map((item) => (
            <div key={item.status} className="grid grid-cols-[130px_1fr_40px] items-center gap-4">
              <span className="text-sm text-slate-600">{item.label}</span>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gold-500" style={{ width: `${calculateProgressValue(item.count, maxStatus)}%` }} /></div>
              <span className="text-right font-semibold text-slate-950">{item.count}</span>
            </div>
          ))}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Current Occupancy Summary</CardTitle></CardHeader>
        <CardContent><div className="grid gap-4 sm:grid-cols-4">{[
          ["Available", report.metrics.availableRooms, "text-emerald-600"],
          ["Occupied", report.metrics.occupiedRooms, "text-blue-600"],
          ["Maintenance", report.metrics.maintenanceRooms, "text-amber-600"],
          ["Occupancy", `${report.metrics.occupancyRate}%`, "text-slate-950"]
        ].map(([label, value, tone]) => (
          <div key={label} className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">{label}</p><p className={`text-2xl font-bold ${tone}`}>{value}</p></div>
        ))}</div></CardContent>
      </Card>
    </section>
  );
}
