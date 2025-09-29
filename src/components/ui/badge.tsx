import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded px-2 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
        secondary: "bg-muted text-muted-foreground",
        destructive: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
        outline: "border border-input text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
