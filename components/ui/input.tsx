import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-8 w-full bg-background border border-border px-2.5 text-sm outline-none focus:border-foreground focus:ring-2 focus:ring-accent/20 rounded-md transition shadow-xs",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
