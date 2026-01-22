import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-background-accent text-accent-brand-off-white hover:bg-background-accent/90",
        secondary:
          "border-transparent bg-background-secondary text-foreground hover:bg-background-secondary/80",
        destructive:
          "border-transparent bg-accent-brand-red text-white hover:bg-accent-brand-red/80",
        outline:
          "border-border text-foreground bg-transparent hover:bg-background-secondary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
