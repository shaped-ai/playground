"use client"

import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SavedQuerySelector } from "./saved-query-selector"
import type { SavedQuery } from "@/lib/types/query.types"
import { useCallback } from "react"
import { EngineSelector } from "@/components/selector/engine-selector"
import { ModelStatus } from "@/types/enums"
import { ModelDetails } from "@/types/index"
import { cn } from "@/lib/utils"

interface QueryControlsProps {
  selectedEngine: string
  onEngineChange: (engine: string) => void
  selectedQueryId?: string | null
  onSavedQuerySelect: (query: SavedQuery | null) => void
  onRun: () => void
  isExecuting?: boolean
  showRunButton?: boolean
  isResultsVisible?: boolean
  onToggleResults?: () => void
  engineDetails?: ModelDetails
}

export function QueryControls({
  selectedEngine,
  onEngineChange,
  selectedQueryId,
  onSavedQuerySelect,
  onRun,
  isExecuting,
  showRunButton = true,
  isResultsVisible = true,
  onToggleResults,
  engineDetails,
}: QueryControlsProps) {
  const handleSavedQuerySelect = useCallback(
    (query: SavedQuery | null) => {
      onSavedQuerySelect(query)
    },
    [onSavedQuerySelect]
  )

  return (
    <div className="border-b-0 border-l-0 border-r-0 border-t-0 border-border bg-background-solid">
      {/* First row: Engine selector with Run button */}
      <div
        className={cn(
          "flex h-auto shrink-0 items-center justify-between gap-2 border-b border-l-0 border-r-0 border-t-0 border-border-muted px-4 pb-2 pt-0",
          engineDetails?.status != ModelStatus.ACTIVE &&
            engineDetails?.status != ModelStatus.IDLE &&
            "border-0"
        )}
      >
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-bold text-foreground">Engine</span>
          <EngineSelector
            selectedEngine={selectedEngine}
            onEngineChange={onEngineChange}
            placeholder="No engines available"
          />
        </div>

        {showRunButton && (
          <Button
            variant="default"
            onClick={onRun}
            disabled={
              isExecuting ||
              (engineDetails?.status != ModelStatus.ACTIVE &&
                engineDetails?.status != ModelStatus.IDLE)
            }
            className={cn(
              "ml-auto flex h-auto shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-border-active bg-background-accent px-2 py-1.5 text-xs font-medium text-accent-brand-off-white hover:border-border-active hover:bg-accent-active",
              engineDetails?.status != ModelStatus.ACTIVE &&
                engineDetails?.status != ModelStatus.IDLE &&
                "border-[rgba(0,0,0,0.15)] bg-accent-brand-off-white text-accent-brand-light-gray hover:bg-accent-brand-off-white"
            )}
          >
            <Play className="h-4 w-4 shrink-0" />
            Run
          </Button>
        )}
      </div>

      {/* Second row: Saved queries */}
      {selectedEngine && (
        <SavedQuerySelector
          engineDetails={engineDetails}
          engine={selectedEngine}
          selectedQueryId={selectedQueryId}
          onQuerySelect={handleSavedQuerySelect}
        />
      )}
    </div>
  )
}
