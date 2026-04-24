import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const button = cva(
  "inline-flex items-center justify-center gap-2 font-medium select-none transition disabled:opacity-40 disabled:pointer-events-none rounded-md",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background hover:bg-foreground/90 shadow-xs",
        accent:
          "bg-accent text-accent-fg hover:bg-accent/90 shadow-xs",
        outline:
          "border border-border bg-background text-foreground hover:bg-subtle shadow-xs",
        ghost:
          "text-foreground hover:bg-subtle",
        link: "text-accent hover:underline underline-offset-2 px-0",
        danger:
          "bg-status-red text-white hover:bg-status-red/90 shadow-xs",
      },
      size: {
        sm: "h-7 px-2.5 text-xs",
        md: "h-8 px-3 text-sm",
        lg: "h-10 px-4 text-md",
        icon: "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(button({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = "Button";
