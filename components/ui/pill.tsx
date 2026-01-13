import React, { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface PillProps extends HTMLAttributes<HTMLDivElement> {
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
  title?: string
  key?: string
  showCloseIcon?: boolean
  closeIconClassName?: string
  pillLeftIcon?: React.ReactNode
}

export default function Pill({
  className,
  title,
  onKeyDown,
  onClick,
  key,
  showCloseIcon = true,
  closeIconClassName = "",
  pillLeftIcon,
}: PillProps) {
  return (
    <div
      key={key}
      className={cn(
        "border-border-active/30 flex items-center gap-1 rounded-full border bg-background-secondary px-2 py-0.5 text-xs text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-border-active focus:ring-offset-2",
        className
      )}
    >
      {pillLeftIcon && pillLeftIcon}
      {title}
      {showCloseIcon && (
        <button
          type="button"
          className="rounded-full outline-none"
          onKeyDown={(e) => {
            e.stopPropagation()
            onKeyDown?.(e as unknown as React.KeyboardEvent<HTMLDivElement>)
          }}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={(e) => {
            e.stopPropagation()
            onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>)
          }}
        >
          <X
            className={cn(
              "size-3 text-foreground  transition-colors hover:text-foreground",
              closeIconClassName
            )}
          />
        </button>
      )}
    </div>
  )
}
