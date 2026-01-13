"use client"

import { FolderClosed, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SavedQuery } from "@/lib/types/query.types"
import { cn } from "@/lib/utils"
import { ModelStatus } from "@/types/enums"
import { ModelDetails } from "@/types"

interface SavedQuerySelectorProps {
  engine: string
  selectedQueryId?: string | null
  onQuerySelect: (query: string | null) => void
  queries: string[]
  isLoading?: boolean
  engineDetails?: ModelDetails
}

export function SavedQuerySelector({
  engine,
  selectedQueryId,
  onQuerySelect,
  queries,
  isLoading = false,
  engineDetails,
}: SavedQuerySelectorProps) {
  const handleQueryClick = (query: string) => {
    if (selectedQueryId === query) {
      onQuerySelect(null)
    } else {
      onQuerySelect(query)
    }
  }

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 border-border-muted px-4 py-2",
        engineDetails?.status != ModelStatus.ACTIVE &&
          engineDetails?.status != ModelStatus.IDLE &&
          engineDetails?.status != ModelStatus.ERROR &&
          "border-b border-border"
      )}
    >
      <div className="flex shrink-0 items-center gap-1">
        <FolderClosed className="size-4 text-accent-brand-purple" />
        <span className="text-xs font-bold text-foreground">Saved</span>
      </div>

      <div
        className={cn(
          "min-w-0 flex-1 overflow-x-auto",
          queries && queries.length > 0
            ? "scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
            : ""
        )}
      >
        <div className="flex items-center gap-1">
          {isLoading ? (
            <div className="flex items-center gap-2 px-2 py-1">
              <Loader2 className="size-3 animate-spin text-foreground-muted" />
              <span className="text-sm text-foreground-muted">
                Loading queries...
              </span>
            </div>
          ) : queries.length === 0 ? (
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
            queries.map((query: string) => {
              const isSelected = selectedQueryId === query
              return (
                <Button
                  key={query}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleQueryClick(query)}
                  className={cn(
                    "h-auto shrink-0 rounded-[38px] px-2 py-1 text-xs font-medium transition-all",
                    isSelected
                      ? "border-border-active bg-[#6338bc] text-accent-brand-off-white hover:bg-[#6338bc]/90"
                      : "border-border-muted bg-background-primary text-foreground hover:bg-background-secondary"
                  )}
                >
                  {query}
                </Button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
