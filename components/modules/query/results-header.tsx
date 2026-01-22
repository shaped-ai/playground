"use client"

import {
  Monitor,
  Settings2,
  ChevronsUpDown,
  MonitorSmartphone,
  FileCode,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ResultViewMode } from "@/lib/types/query.types"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState, useMemo } from "react"
import { useIsMobile } from "@/hooks/shared/use-media-query"

interface ResultsHeaderProps {
  rowCount: number
  executionTime: number
  viewMode: ResultViewMode
  isPreviewMode: boolean
  onViewModeChange: (mode: ResultViewMode) => void
  onEditTemplate?: () => void
  hasNoResults?: boolean
}

export function ResultsHeader({
  rowCount,
  executionTime,
  viewMode,
  isPreviewMode,
  onViewModeChange,
  onEditTemplate,
  hasNoResults = false,
}: ResultsHeaderProps) {
  const isMobile = useIsMobile()
  const resultsHeaderRef = useRef<HTMLDivElement>(null)
  const [resultsHeaderWidth, setResultsHeaderWidth] = useState(0)

  useEffect(() => {
    if (resultsHeaderRef.current) {
      setResultsHeaderWidth(resultsHeaderRef.current.offsetWidth)
    }
  }, [resultsHeaderRef.current])

  const dataViewModes = useMemo(() => {
    const baseModes = [
      { value: ResultViewMode.RAW_TABLE, label: "Raw Table", icon: Monitor },
      {
        value: ResultViewMode.JSON,
        label: "JSON",
        icon: FileCode,
      },
    ]

    // Show UI View option when there are results (on both mobile and desktop)
    return [
      ...baseModes,
      ...(hasNoResults
        ? []
        : [
            {
              value:
                viewMode != ResultViewMode.RAW_TABLE &&
                viewMode != ResultViewMode.SUMMARY_TABLE &&
                viewMode != ResultViewMode.JSON
                  ? viewMode
                  : ResultViewMode.PREVIEW_MASONRY,
              label: "UI View",
              icon: MonitorSmartphone,
            },
          ]),
    ]
  }, [hasNoResults, viewMode])

  return (
    <div
      ref={resultsHeaderRef}
      className="border-b border-border bg-background-base"
    >
      <div className="flex items-center justify-between gap-2 md:gap-4 px-2 md:px-4 py-1 md:py-3">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="text-nowrap text-xs md:text-lg font-semibold text-foreground">
            {rowCount} Results in {Math.round(executionTime)} ms
          </span>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          {isPreviewMode && !hasNoResults && !isMobile && (
            <div
              className={cn(
                "thin-scrollbar flex flex-1 items-center justify-start gap-2 overflow-x-auto",
                resultsHeaderWidth > 1400 ? "justify-center" : "justify-start"
              )}
            >
              {onEditTemplate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEditTemplate}
                  className="shadow-xs h-8 gap-2 rounded-lg bg-background-primary px-2 text-xs font-medium hover:bg-background-secondary"
                >
                  <Settings2 className="size-4 text-accent-brand-purple" />
                  <span className="text-nowrap text-xs">Edit Template</span>
                </Button>
              )}
            </div>
          )}

          {!hasNoResults && (
            <Select
              value={viewMode}
              onValueChange={(value: ResultViewMode) => onViewModeChange(value)}
            >
              <SelectTrigger
                size="sm"
                className={cn(
                  "w-auto cursor-pointer rounded-lg border text-xs font-medium hover:bg-background-secondary focus:ring-0 focus:ring-offset-0",
                  isMobile ? "gap-0.5 px-1.5 py-1" : "gap-1 px-2"
                )}
                showIcon={false}
              >
                <SelectValue />
                <ChevronsUpDown
                  className={cn(isMobile ? "h-3 w-3" : "h-4 w-4")}
                />
              </SelectTrigger>
              <SelectContent className="z-9999 border-border bg-background-primary text-foreground">
                {dataViewModes.map((mode) => {
                  const Icon = mode.icon
                  return (
                    <SelectItem
                      rightCheckIcon={true}
                      key={mode.value}
                      value={mode.value}
                      className="group border-background-primary"
                    >
                      <div className="flex h-auto cursor-pointer items-center gap-1">
                        <Icon className="size-4 data-[state=open]:text-accent-brand-off-white shrink-0 text-accent-brand-purple" />
                        <span className="text-xs font-medium text-foreground">
                          {mode.label}
                        </span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  )
}
