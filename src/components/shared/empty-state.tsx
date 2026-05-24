import type { LucideIcon } from "lucide-react";
import { SearchX } from "lucide-react";

export function EmptyState({ title = "No records found", description, icon: Icon = SearchX }: { title?: string; description?: string; icon?: LucideIcon }) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <Icon className="h-10 w-10 text-slate-300" />
      <h3 className="mt-3 font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}
