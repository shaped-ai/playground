"use client"

import {
  Plus,
  X,
  BookOpen,
  History,
  Share2,
  ChevronLeft,
  ChevronRight,
  CircleX,
  BookOpenText,
  ChevronsUpDown,
  Bookmark,
  CircleHelp,
  CirclePlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState, useRef, useEffect } from "react"
import type { QueryTab } from "@/lib/types/query.types"
import { useToast } from "@/hooks/shared/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { QueryRequestDetails } from "@/components/modals/query-request-details"
import {
  ItemRecommendationTab,
  QueryTab as QueryTabEnum,
  UserRecommendationTab,
} from "@/types/enums"
import { ModelDetails } from "@/types"
interface QueryTabsProps {
  modelDetails: ModelDetails
  tabs: QueryTab[]
  activeTabId: string
  onTabClick: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onTabAdd: () => void
  onTabRename: (tabId: string, newName: string) => void
  isReadOnly?: boolean
}

export function QueryTabs({
  modelDetails,
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onTabAdd,
  onTabRename,
  isReadOnly = false,
}: QueryTabsProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const [showHistory, setShowHistory] = useState(false)
  const [docView, setDocView] = useState<"list" | "grid">("list")

  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    )
  }

  useEffect(() => {
    checkScroll()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", checkScroll)
      window.addEventListener("resize", checkScroll)
      return () => {
        container.removeEventListener("scroll", checkScroll)
        window.removeEventListener("resize", checkScroll)
      }
    }
  }, [tabs])

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = 200
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    })
  }

  const handleDoubleClick = (tab: QueryTab) => {
    setEditingTabId(tab.id)
    setEditValue(tab.name)
  }

  const handleRename = (tabId: string) => {
    if (editValue.trim()) {
      onTabRename(tabId, editValue.trim())
    }
    setEditingTabId(null)
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copied!",
        description: "Query state link copied to clipboard",
      })
    })
  }

  return (
    <div className="flex min-w-0 items-center gap-3 border-b border-border bg-background-base px-4 py-3">
      <Button
        variant="outline"
        size="icon"
        onClick={onTabAdd}
        className=" shrink-0 cursor-pointer  border-0 bg-inherit text-foreground hover:bg-inherit"
      >
        <CirclePlus className="size-5" strokeWidth={1.25} />
      </Button>

      {canScrollLeft && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("left")}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}

      {/* Tabs container with horizontal scroll */}
      <TooltipProvider delayDuration={1000}>
        <div
          ref={scrollContainerRef}
          className="scrollbar-hide flex min-w-0 flex-1 items-center gap-2 overflow-x-auto"
        >
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`
              group relative flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-all
              ${
                activeTabId === tab.id
                  ? "border border-border-active bg-background-accent text-accent-brand-off-white shadow-sm hover:border-border-active hover:bg-accent-active "
                  : "border-border bg-background-primary text-foreground hover:bg-background-secondary"
              }
            `}
            >
              {editingTabId === tab.id ? (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleRename(tab.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(tab.id)
                    if (e.key === "Escape") setEditingTabId(null)
                  }}
                  className="h-6 w-32 px-2 py-0 text-sm"
                  autoFocus
                />
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onTabClick(tab.id)}
                      onDoubleClick={() => handleDoubleClick(tab)}
                      className="flex items-center gap-2 group-hover:cursor-pointer"
                    >
                      <span className="whitespace-nowrap text-sm font-medium">
                        {tab.name}
                      </span>
                      {tab.isExecuting && (
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    sideOffset={10}
                    className="border border-border bg-background-primary text-foreground"
                  >
                    Double-click to edit tab name
                  </TooltipContent>
                </Tooltip>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTabClose(tab.id)
                }}
                className={`  
                flex  items-center justify-center transition-all group-hover:cursor-pointer
                ${
                  activeTabId === tab.id
                    ? "text-accent-brand-off-white"
                    : "text-foreground "
                }
              `}
              >
                <CircleX className="h-4 w-4" strokeWidth={1.25} />
              </button>
            </div>
          ))}
        </div>
      </TooltipProvider>

      {canScrollRight && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => scroll("right")}
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}

      {/* Utility icons on the right */}
      <div className="flex h-auto shrink-0 items-stretch gap-0 overflow-hidden rounded-lg border border-border bg-background-primary shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-auto cursor-pointer items-center gap-2 rounded-none border-0 bg-background-primary px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background-secondary focus:outline-none"
            >
              <div className="flex items-center gap-1">
                <BookOpenText
                  className="size-5 shrink-0 text-accent-brand-purple "
                  strokeWidth={1.25}
                />
                <span className="text-xs font-medium text-foreground">
                  Docs
                </span>
              </div>
              <ChevronsUpDown
                className="size-4 shrink-0 text-foreground"
                strokeWidth={1.25}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="z-9999 min-w-[240px] rounded-md border border-border bg-background-primary p-1 text-sm shadow-lg"
          >
            <DropdownMenuItem className="group p-0 hover:bg-background-secondary focus:bg-background-secondary">
              <a
                href="https://docs.shaped.ai/docs/v2/overview/query_api"
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center gap-2 px-2 py-1.5"
              >
                <Bookmark
                  className="size-4 shrink-0 text-accent-brand-purple"
                  strokeWidth={1.25}
                />
                <p className="text-left text-sm text-foreground">
                  Write your first query
                </p>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem className="group p-0 hover:bg-background-secondary focus:bg-background-secondary">
              <a
                href="https://docs.shaped.ai/docs/v2/query_reference/shapedql/?hide-nav=true"
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center gap-2 px-2 py-1.5"
              >
                <Bookmark
                  className="size-4 shrink-0 text-accent-brand-purple"
                  strokeWidth={1.25}
                />
                <p className="text-left text-sm text-foreground">
                  Query reference
                </p>
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem className="group p-0 hover:bg-background-secondary focus:bg-background-secondary">
              <a
                href="https://docs.shaped.ai/docs/v2/support/contact"
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center gap-2 px-2 py-1.5"
              >
                <CircleHelp
                  className="size-4 shrink-0 text-accent-brand-purple"
                  strokeWidth={1.25}
                />
                <p className="text-left text-sm text-foreground">Get help</p>
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {modelDetails && Object.keys(modelDetails).length > 0 && (
          <QueryRequestDetails
            modelDetails={modelDetails}
            configuration={{}}
            currentQueryTab={QueryTabEnum.ITEM}
            currentRankTab={ItemRecommendationTab.SIMILAR_ITEMS}
            queryStep={2}
            isReadOnly={isReadOnly}
            className="h-auto cursor-pointer items-center gap-1 rounded-none border-y-0 border-l border-r-0 border-border bg-background-primary px-3 py-1.5 text-foreground shadow-none hover:bg-background-secondary"
            activeTab={tabs.find((tab) => tab.id === activeTabId) || tabs[0]}
          />
        )}
      </div>
    </div>
  )
}
