"use client"
import { cn, convertTitleCase } from "@/lib/utils"
import { ModelStatus } from "@/types/enums"
import getStatusColor from "@/utils/status"
import {
  ArrowDownUp,
  CalendarClock,
  CircleCheckBig,
  CircleDotDashed,
  CircleMinus,
  Cog,
  ReplaceAll,
  Rocket,
  SlidersHorizontal,
  Trash2,
  TriangleAlert,
} from "lucide-react"

interface StatusChipProps {
  status: string
  className?: string
}

export function StatusChip({ status, className }: StatusChipProps) {
  let statusColor = getStatusColor(status)

  return (
    <div className="flex">
      <span
        className={cn(
          "text flex items-center gap-0.5 rounded-2xl px-3 py-1 text-xs font-medium",
          statusColor.textColor,
          statusColor.backgroundColor,
          className
        )}
      >
        {status == ModelStatus.ACTIVE ? (
          <CircleCheckBig
            className="size-4 text-accent-brand-green"
            strokeWidth={1.25}
          />
        ) : status == ModelStatus.INACTIVE ? (
          <CircleMinus
            className="size-4 text-foreground-muted"
            strokeWidth={1.25}
          />
        ) : status == ModelStatus.IDLE ? (
          <CircleDotDashed
            className="size-4 text-foreground-subtle"
            strokeWidth={1.25}
          />
        ) : status == ModelStatus.ERROR ? (
          <TriangleAlert
            className="size-4 text-accent-brand-red"
            strokeWidth={1.25}
          />
        ) : status == ModelStatus.SCHEDULING ? (
          <CalendarClock
            className="size-4 text-accent-brand-orange"
            strokeWidth={1.25}
          />
        ) : status == ModelStatus.FETCHING ? (
          <ReplaceAll
            className="size-4 text-accent-brand-blue"
            strokeWidth={1.25}
          />
        ) : status == ModelStatus.TUNING ? (
          <SlidersHorizontal
            className="size-4 text-accent-brand-blue"
            strokeWidth={1.25}
          />
        ) : status == ModelStatus.TRAINING ? (
          <Cog className="size-4 text-accent-brand-blue" strokeWidth={1.25} />
        ) : status == ModelStatus.BACKFILLING ? (
          <ArrowDownUp
            className="size-4 text-accent-brand-blue"
            strokeWidth={1.25}
          />
        ) : status == ModelStatus.DEPLOYING ? (
          <Rocket
            className="size-4 text-accent-brand-blue"
            strokeWidth={1.25}
          />
        ) : status == ModelStatus.DESTROYING ? (
          <Trash2 className="size-4 text-accent-brand-red" strokeWidth={1.25} />
        ) : (
          <CircleMinus className="size-4 text-[#595958]" strokeWidth={1.25} />
        )}
        {convertTitleCase(status)}
      </span>
    </div>
  )
}
