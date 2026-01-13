"use client"

import React, { HTMLAttributes, useEffect, useRef, useState } from "react"
import { Icons } from "@/components/icons/icons"
import { cn } from "@/lib/utils"

interface SuggestionListProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  suggestions: string[]
  isLoading?: boolean
  onClickSuggestion: (suggestion: string) => void
  top?: number
}

export default function SuggestionList({
  title,
  suggestions,
  isLoading = false,
  onClickSuggestion,
  className,
  top,
}: SuggestionListProps) {
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(0)
  const suggestionRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => setSelectedSuggestionIdx(0), [suggestions])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault()
        setSelectedSuggestionIdx(
          (prevIndex) => (prevIndex + 1) % suggestions.length
        )
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        setSelectedSuggestionIdx(
          (prevIndex) =>
            (prevIndex - 1 + suggestions.length) % suggestions.length
        )
      } else if (event.key === "Enter") {
        event.preventDefault()
        onClickSuggestion(suggestions[selectedSuggestionIdx])
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [suggestions, selectedSuggestionIdx, onClickSuggestion])

  // Scroll selected suggestion into view when the index changes
  useEffect(() => {
    if (suggestionRefs.current[selectedSuggestionIdx]) {
      suggestionRefs.current[selectedSuggestionIdx]?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      })
    }
  }, [selectedSuggestionIdx])

  return (
    <div
      className={cn(
        "absolute left-0 z-30 min-w-[5vw] max-w-[25.6vw] rounded-lg border border-[#E5E5E5] bg-white p-1 shadow-md",
        className
      )}
      style={{
        top: top ? `${top}%` : "calc(100% - 32px)",
        overflowX: "hidden",
      }}
    >
      <div className="flex w-full items-center gap-2 border-b border-[#D1D5DB] p-2 text-base font-bold text-black">
        <Icons.pyramid className="size-4" strokeWidth={1.5} />
        <span className="flex-1 truncate text-left">{title}</span>
      </div>
      {isLoading ? (
        <div className="flex w-full items-center justify-center overflow-hidden px-3 py-1">
          <Icons.spinner className="size-5 animate-spin " strokeWidth={1.25} />
        </div>
      ) : (
        <div className="scrollbar-thin mt-1 max-h-[45vh] w-full">
          {suggestions?.map((attribute, index) => (
            <button
              key={index}
              ref={(el) => {
                if (el) {
                  suggestionRefs.current[index] = el
                }
              }} // Assign ref to each suggestion button
              onClick={() => onClickSuggestion(attribute)}
              className={`flex w-full rounded px-2 py-1 text-left text-sm text-black ${
                selectedSuggestionIdx === index
                  ? "bg-[#EDE9FE]"
                  : "hover:bg-gray-100"
              }`}
            >
              <span className="w-full truncate">{attribute}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
