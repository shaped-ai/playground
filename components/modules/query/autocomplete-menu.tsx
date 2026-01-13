"use client"

import type { AutocompleteSuggestion } from "@/lib/schema/query-schema"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface AutocompleteMenuProps {
  suggestions: AutocompleteSuggestion[]
  selectedIndex: number
  position: { top: number; left: number }
  onSelect: (suggestion: AutocompleteSuggestion) => void
  onHover: (index: number) => void
}

export function AutocompleteMenu({
  suggestions,
  selectedIndex,
  position,
  onSelect,
  onHover,
}: AutocompleteMenuProps) {
  if (suggestions.length === 0) return null

  return (
    <div
      className="bg-popover fixed z-50 min-w-[200px] max-w-[320px] rounded-md border shadow-lg"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="max-h-[300px] overflow-y-auto p-1">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className={cn(
              "flex w-full cursor-pointer items-start gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors",
              index === selectedIndex
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50"
            )}
            onClick={() => onSelect(suggestion)}
            onMouseEnter={() => onHover(index)}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{suggestion.label}</span>
                {suggestion.detail && (
                  <span className="text-xs text-muted-foreground">
                    {suggestion.detail}
                  </span>
                )}
              </div>
              {suggestion.description && (
                <div className="line-clamp-2 mt-0.5 text-xs text-muted-foreground">
                  {suggestion.description}
                </div>
              )}
            </div>
            {index === selectedIndex && (
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
