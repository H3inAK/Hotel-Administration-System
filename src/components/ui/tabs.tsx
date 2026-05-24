import * as React from "react";
import { cn } from "@/lib/utils";

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex rounded-md bg-slate-100 p-1", className)} {...props} />;
}

export type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

export function TabsTrigger({ className, active, type = "button", ...props }: TabsTriggerProps) {
  return (
    <button
      type={type}
      className={cn(
        "rounded-sm px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950",
        active && "bg-white text-slate-950 shadow-sm",
        className
      )}
      {...props}
    />
  );
}
