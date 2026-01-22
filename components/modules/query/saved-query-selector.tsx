"use client"

import { FolderClosed } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SavedQuery } from "@/lib/types/query.types"
import { DEMO_ENGINES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { ModelStatus } from "@/types/enums"
import { ModelDetails } from "@/types"
import { useMemo } from "react"
import { useIsMobile } from "@/hooks/shared/use-media-query"

interface SavedQuerySelectorProps {
  engine: string
  selectedQueryId?: string | null
  onQuerySelect: (query: SavedQuery | null) => void
  engineDetails?: ModelDetails
}

export function SavedQuerySelector({
  engine,
  selectedQueryId,
  onQuerySelect,
  engineDetails,
}: SavedQuerySelectorProps) {
  const isMobile = useIsMobile()
  const savedQueries = useMemo(() => {
    if (!engine) return []
    const demoEngine = DEMO_ENGINES.find((e) => e.id === engine)
    return (demoEngine?.saved_queries as SavedQuery[]) || []
  }, [engine])

  const handleQueryClick = (query: SavedQuery) => {
    onQuerySelect(query)
  }

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center border-border-muted",
        isMobile ? "gap-1 px-2 py-1" : "gap-2 px-4 py-2",
        engineDetails?.status != ModelStatus.ACTIVE &&
          engineDetails?.status != ModelStatus.IDLE &&
          engineDetails?.status != ModelStatus.ERROR &&
          "border-b border-border"
      )}
    >
      {!isMobile && (
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-xs font-bold text-foreground">Try a query</span>
        </div>
      )}

      <div
        className={cn(
          "min-w-0 flex-1 overflow-x-auto",
          savedQueries && savedQueries.length > 0
            ? "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
            : ""
        )}
      >
        <div className="flex items-center gap-1">
          {savedQueries.length === 0 ? (
            <div className="flex items-center">
              <span className="px-2 text-xs font-medium text-foreground-muted">
                No saved queries.{" "}
                <a
                  target="_blank"
                  rel="noreferrer"
                  href="https://docs.shaped.ai/docs/v2/home/"
                  className="text-xs font-medium text-accent-brand-purple underline"
                >
                  Read docs.
                </a>
              </span>
            </div>
          ) : (
            savedQueries.map((query: SavedQuery) => {
              return (
                <Button
                  key={query.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQueryClick(query)}
                  className={cn(
                    "h-auto shrink-0 rounded-[38px] px-2 py-1 text-xs font-medium transition-all cursor-pointer",
                    "border-border-muted bg-background-primary text-foreground hover:bg-background-secondary",
                    "active:scale-95 active:transition-transform"
                  )}
                >
                  {query.name}
                </Button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
