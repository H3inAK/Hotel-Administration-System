"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { calculateProgressValue } from "@/lib/report-utils";
import type { ReportSummary } from "@/types";

type ReportsDashboardProps = {
  summary: ReportSummary | null;
  loading: boolean;
  onRefresh: () => void | Promise<void>;
};

export function ReportsDashboard({ summary, loading, onRefresh }: ReportsDashboardProps) {
  if (loading || !summary) {
    return <Skeleton className="h-[520px] w-full" />;
  }

  const maxStatus = Math.max(...summary.statusBreakdown.map((item) => item.count), 1);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="hotel-heading text-3xl font-bold text-slate-950">Reports</h2>
          <p className="text-sm text-slate-500">Revenue, room type performance, booking statuses, and occupancy summary.</p>
        </div>
        <Button variant="outline" onClick={() => void onRefresh()}>
          Refresh Reports
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.monthlyRevenue.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-slate-500">No revenue data yet</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" fill="#e8a522" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Room Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Bookings</th>
                    <th className="px-4 py-3">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.revenueByRoomType.length === 0 ? (
                    <tr>
                      <td className="px-4 py-10 text-center text-slate-500" colSpan={3}>
                        No room type revenue yet
                      </td>
                    </tr>
                  ) : (
                    summary.revenueByRoomType.map((item) => (
                      <tr key={item.type}>
                        <td className="px-4 py-3 font-semibold text-slate-950">{item.type}</td>
                        <td className="px-4 py-3">{item.bookings}</td>
                        <td className="px-4 py-3">{formatCurrency(item.revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.statusBreakdown.map((item) => (
              <div key={item.status} className="grid grid-cols-[130px_1fr_40px] items-center gap-4">
                <span className="text-sm text-slate-600">{item.label}</span>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gold-500" style={{ width: `${calculateProgressValue(item.count, maxStatus)}%` }} />
                </div>
                <span className="text-right font-semibold text-slate-950">{item.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Occupancy Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Available</p>
              <p className="hotel-heading text-3xl font-bold text-emerald-600">{summary.metrics.availableRooms}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Occupied</p>
              <p className="hotel-heading text-3xl font-bold text-blue-600">{summary.metrics.occupiedRooms}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Maintenance</p>
              <p className="hotel-heading text-3xl font-bold text-amber-600">{summary.metrics.maintenanceRooms}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Occupancy</p>
              <p className="hotel-heading text-3xl font-bold text-slate-950">{summary.metrics.occupancyRate}%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
