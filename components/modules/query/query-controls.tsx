"use client"

import { Play, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SavedQuerySelector } from "./saved-query-selector"
import type { SavedQuery } from "@/lib/types/query.types"
import { useCallback, useState } from "react"
import { EngineSelector } from "@/components/selector/engine-selector"
import { ModelStatus } from "@/types/enums"
import { ModelDetails } from "@/types/index"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/shared/use-media-query"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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
  const isMobile = useIsMobile()
  const [showEngineInfo, setShowEngineInfo] = useState(false)

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
          "flex h-auto shrink-0 items-center justify-between border-b border-l-0 border-r-0 border-t-0 border-border-muted pt-0",
          isMobile ? "gap-1 px-2 pb-1" : "gap-2 px-4 pb-2",
          engineDetails?.status != ModelStatus.ACTIVE &&
            engineDetails?.status != ModelStatus.IDLE &&
            "border-0"
        )}
      >
        <div
          className={cn(
            "flex items-center overflow-hidden",
            isMobile ? "min-w-0 flex-1 gap-1" : "shrink-0 gap-2"
          )}
        >
          {!isMobile && (
            <span className="text-sm font-bold text-foreground">Engine</span>
          )}
          <EngineSelector
            selectedEngine={selectedEngine}
            onEngineChange={onEngineChange}
            placeholder="No engines available"
          />
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowEngineInfo(!showEngineInfo)}
                  className="h-7 w-7 shrink-0 rounded-lg hover:bg-background-secondary"
                  aria-label="Toggle engine information"
                >
                  <Info
                    className={cn(
                      "h-4 w-4 transition-colors",
                      showEngineInfo
                        ? "text-accent-brand-purple"
                        : "text-foreground-muted hover:text-foreground"
                    )}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                sideOffset={4}
                className="bg-gray-900 text-white border border-gray-700"
              >
                <p className="text-xs">Engine info</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {showRunButton && (
          <Button
            variant="outline"
            onClick={onRun}
            disabled={
              isExecuting ||
              (engineDetails?.status != ModelStatus.ACTIVE &&
                engineDetails?.status != ModelStatus.IDLE)
            }
            data-tour="run-button"
            className={cn(
              "ml-auto flex h-auto shrink-0 cursor-pointer items-center rounded-lg border text-xs font-medium text-foreground bg-background-primary hover:bg-background-secondary",
              isMobile ? "gap-0.5 px-1.5 py-1" : "gap-1 px-2 py-1.5",
              engineDetails?.status != ModelStatus.ACTIVE &&
                engineDetails?.status != ModelStatus.IDLE &&
                "border-[rgba(0,0,0,0.15)] bg-accent-brand-off-white text-accent-brand-light-gray hover:bg-accent-brand-off-white"
            )}
          >
            <Play
              className={cn("shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")}
            />
            Run
          </Button>
        )}
      </div>

      {/* Engine Info Section */}
      {showEngineInfo && (
        <div
          className={cn(
            "border-b border-border-muted bg-background-base",
            isMobile ? "px-2 py-2" : "px-4 py-3"
          )}
        >
          <div className="mb-3">
            <p className="text-xs text-foreground">
              Relevance engine for exploring data in the movielens dataset. Use
              the following embeddings and scoring models in your queries:
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Available Embeddings */}
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-2">
                Available Embeddings
              </h3>
              <div className="space-y-1.5 text-xs">
                <div>
                  <code className="font-mono text-accent-brand-purple">
                    title_embedding
                  </code>
                  <span className="text-foreground-muted">
                    {" "}
                    - semantic vectors from movie titles
                  </span>
                </div>
                <div>
                  <code className="font-mono text-accent-brand-purple">
                    description_content_embedding
                  </code>
                  <span className="text-foreground-muted">
                    {" "}
                    - semantic vectors from plot descriptions
                  </span>
                </div>
                <div>
                  <code className="font-mono text-accent-brand-purple">
                    personnel_embedding
                  </code>
                  <span className="text-foreground-muted">
                    {" "}
                    - categorical vectors for directors, writers, and cast
                  </span>
                </div>
                <div>
                  <code className="font-mono text-accent-brand-purple">
                    poster_embedding
                  </code>
                  <span className="text-foreground-muted">
                    {" "}
                    - visual vectors from poster images
                  </span>
                </div>
                <div>
                  <code className="font-mono text-accent-brand-purple">
                    collaborative_embedding
                  </code>
                  <span className="text-foreground-muted">
                    {" "}
                    - user-item collaborative filtering via ALS
                  </span>
                </div>
                <div>
                  <code className="font-mono text-accent-brand-purple">
                    people_also_liked
                  </code>
                  <span className="text-foreground-muted">
                    {" "}
                    - user-item collaborative filtering via ALS
                  </span>
                </div>
              </div>
            </div>

            {/* Available Scoring Expressions */}
            <div>
              <h3 className="text-xs font-semibold text-foreground mb-2">
                Available Scoring Expressions
              </h3>
              <div className="space-y-1.5 text-xs">
                <div>
                  <code className="font-mono text-accent-brand-purple">
                    click_through_rate
                  </code>
                  <span className="text-foreground-muted">
                    {" "}
                    - predicted CTR from trained model
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
