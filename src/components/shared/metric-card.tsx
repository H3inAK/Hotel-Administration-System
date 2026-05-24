import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  title: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
  tone?: "gold" | "blue" | "green" | "purple" | "slate";
};

const toneClasses = {
  gold: "bg-gold-100 text-gold-600",
  blue: "bg-blue-100 text-blue-600",
  green: "bg-emerald-100 text-emerald-600",
  purple: "bg-purple-100 text-purple-600",
  slate: "bg-slate-100 text-slate-600"
};

export function MetricCard({ title, value, helper, icon: Icon, tone = "slate" }: MetricCardProps) {
  return (
    <Card className="card-hover overflow-hidden">
      <CardContent className="relative min-h-32 p-6">
        <div className="min-w-0 pr-16">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
          <p className="hotel-heading mt-3 break-words text-[clamp(1.5rem,2vw,2rem)] font-bold leading-tight text-slate-950">{value}</p>
          {helper ? <p className="mt-2 text-sm text-slate-500">{helper}</p> : null}
        </div>
        <div className={cn("absolute right-5 top-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", toneClasses[tone])}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}
