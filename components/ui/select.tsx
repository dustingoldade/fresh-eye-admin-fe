"use client";
import { forwardRef, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <div className="relative inline-block">
    <select
      ref={ref}
      className={cn(
        "appearance-none h-8 bg-background border border-border pl-2.5 pr-7 text-sm outline-none focus:border-foreground focus:ring-2 focus:ring-accent/20 rounded-md transition shadow-xs",
        className,
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-muted-fg" strokeWidth={1.5} />
  </div>
));
Select.displayName = "Select";
