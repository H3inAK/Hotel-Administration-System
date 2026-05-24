"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DropdownMenuProps = {
  label: string;
  children: React.ReactNode;
  className?: string;
};

export function DropdownMenu({ label, children, className }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("relative inline-block text-left", className)}>
      <Button variant="outline" onClick={() => setOpen((value) => !value)}>
        {label}
        <ChevronDown className="h-4 w-4" />
      </Button>
      {open ? (
        <div className="absolute right-0 z-40 mt-2 min-w-44 rounded-md border border-slate-200 bg-white p-1 shadow-lg">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function DropdownMenuItem({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn("flex w-full items-center rounded-sm px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100", className)}
      {...props}
    />
  );
}
