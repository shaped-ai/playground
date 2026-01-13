"use client"

import {
  Maximize2,
  Minimize2,
  Monitor,
  PanelsTopLeft,
  Grid3x3,
  List,
  Columns,
  Newspaper,
  Settings2,
  LayoutList,
  ListOrdered,
  LayoutPanelTop,
  ChevronsUpDown,
  Table,
  ScanEye,
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
import { useEffect, useRef, useState } from "react"

interface ResultsHeaderProps {
  rowCount: number
  executionTime: number
  viewMode: ResultViewMode
  isPreviewMode: boolean
  onViewModeChange: (mode: ResultViewMode) => void
  isEditorVisible?: boolean
  onToggleEditor?: () => void
  onEditTemplate?: () => void
}

export function ResultsHeader({
  rowCount,
  executionTime,
  viewMode,
  isPreviewMode,
  onViewModeChange,
  isEditorVisible = true,
  onToggleEditor,
  onEditTemplate,
}: ResultsHeaderProps) {
  const resultsHeaderRef = useRef<HTMLDivElement>(null)
  const [resultsHeaderWidth, setResultsHeaderWidth] = useState(0)

  useEffect(() => {
    if (resultsHeaderRef.current) {
      setResultsHeaderWidth(resultsHeaderRef.current.offsetWidth)
    }
  }, [resultsHeaderRef.current])

  const dataViewModes = [
    { value: ResultViewMode.RAW_TABLE, label: "Raw Table", icon: Monitor },
    {
      value: ResultViewMode.SUMMARY_TABLE,
      label: "Rich Table",
      icon: Table,
    },
    {
      value: ResultViewMode.JSON,
      label: "JSON",
      icon: FileCode,
    },
    {
      value:
        viewMode != ResultViewMode.RAW_TABLE &&
        viewMode != ResultViewMode.SUMMARY_TABLE &&
        viewMode != ResultViewMode.JSON
          ? viewMode
          : ResultViewMode.PREVIEW_GRID,
      label: "UI View",
      icon: MonitorSmartphone,
    },
  ]

  return (
    <div
      ref={resultsHeaderRef}
      className="border-b border-border bg-background-base"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          {onToggleEditor && (
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleEditor}
              className="shadow-xs h-auto w-auto shrink-0 cursor-pointer rounded-lg border-border bg-background-solid p-1.5 transition-all hover:border-border-active hover:bg-background-secondary"
            >
              {isEditorVisible ? (
                <Maximize2 className="dark:text-foreground h-4 w-4 text-accent-brand-purple" />
              ) : (
                <Minimize2 className="dark:text-foreground h-4 w-4 text-accent-brand-purple" />
              )}
            </Button>
          )}

          <span className="text-nowrap text-lg font-semibold text-foreground">
            {rowCount} Results in {Math.round(executionTime)} ms
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isPreviewMode && (
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
                  className="shadow-xs h-auto gap-2 rounded-lg bg-background-primary py-1.5 px-2 text-xs font-medium hover:bg-background-secondary"
                >
                  <Settings2 className="size-4 text-accent-brand-purple" />
                  <span className="text-nowrap text-xs">Edit Template</span>
                </Button>
              )}
            </div>
          )}

          <Select
            value={viewMode}
            onValueChange={(value: ResultViewMode) => onViewModeChange(value)}
          >
            <SelectTrigger
              className="h-auto w-auto cursor-pointer gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium hover:bg-background-secondary focus:ring-0 focus:ring-offset-0"
              showIcon={false}
            >
              <SelectValue />
              <ChevronsUpDown className="h-4 w-4" />
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
        </div>
      </div>
    </div>
  )
}
