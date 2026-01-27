"use client"

import { useEffect, useRef, useState } from "react"
import { type TourStep } from "@/hooks/use-onboarding-tour"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface QueryOnboardingOverlayProps {
  steps: TourStep[]
  currentStepIndex: number
  isOpen: boolean
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  onClose: () => void
}

type TooltipPlacement = "top" | "bottom"

interface TooltipPosition {
  top: number
  left: number
  width: number
  placement: TooltipPlacement
  ready: boolean
  centered: boolean
}

export function QueryOnboardingOverlay({
  steps,
  currentStepIndex,
  isOpen,
  onNext,
  onPrev,
  onSkip,
  onClose,
}: QueryOnboardingOverlayProps) {
  const [position, setPosition] = useState<TooltipPosition>({
    top: 0,
    left: 0,
    width: 320,
    placement: "bottom",
    ready: false,
    centered: true,
  })

  const activeTargetRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen || steps.length === 0) {
      // Clear highlight when tour closes
      if (activeTargetRef.current) {
        activeTargetRef.current.classList.remove("tour-highlight")
        activeTargetRef.current = null
      }
      setPosition((prev) => ({ ...prev, ready: false }))
      return
    }

    const step = steps[currentStepIndex] ?? steps[0]
    const selector = `[data-tour="${step.targetId}"]`
    const element = document.querySelector(selector) as HTMLElement | null

    // Remove highlight from previous target
    if (activeTargetRef.current && activeTargetRef.current !== element) {
      activeTargetRef.current.classList.remove("tour-highlight")
    }

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const margin = 16
    const tooltipWidth = Math.min(320, viewportWidth - margin * 2)
    const estimatedHeight = 180

    if (!element) {
      // Fallback: center the tooltip if target not found
      setPosition({
        top: viewportHeight / 2,
        left: (viewportWidth - tooltipWidth) / 2,
        width: tooltipWidth,
        placement: "bottom",
        ready: true,
        centered: true,
      })
      activeTargetRef.current = null
      return
    }

    activeTargetRef.current = element
    element.classList.add("tour-highlight")

    const rect = element.getBoundingClientRect()
    let placement: TooltipPlacement = "bottom"
    let top: number

    // Decide whether to show above or below
    if (rect.bottom + estimatedHeight + margin > viewportHeight &&
        rect.top - estimatedHeight - margin > 0) {
      placement = "top"
      top = Math.max(margin, rect.top - estimatedHeight - margin)
    } else {
      placement = "bottom"
      top = Math.min(
        viewportHeight - estimatedHeight - margin,
        rect.bottom + margin
      )
    }

    // Center horizontally relative to the target, clamped to viewport
    let left = rect.left + rect.width / 2 - tooltipWidth / 2
    left = Math.max(margin, Math.min(left, viewportWidth - tooltipWidth - margin))

    setPosition({
      top,
      left,
      width: tooltipWidth,
      placement,
      ready: true,
      centered: false,
    })
  }, [isOpen, currentStepIndex, steps])

  const step = steps[currentStepIndex] ?? steps[0]
  const total = steps.length
  const isFirst = currentStepIndex === 0
  const isLast = currentStepIndex === total - 1

  const progressDots = Array.from({ length: total })

  useEffect(() => {
    return () => {
      if (activeTargetRef.current) {
        activeTargetRef.current.classList.remove("tour-highlight")
        activeTargetRef.current = null
      }
    }
  }, [])

  const handleAdvance = () => {
    if (isLast) {
      onClose()
    } else {
      onNext()
    }
  }

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault()
        handleAdvance()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, handleAdvance])

  if (!isOpen || steps.length === 0 || !position.ready) return null

  return (
    <div
      className="fixed inset-0 z-[10000] tour-backdrop"
      onClick={handleAdvance}
    >
      <div
        className="absolute tour-card rounded-2xl border border-border bg-background-base p-4 shadow-lg md:p-5 transition-[top,left] duration-200 ease-in-out"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-step-title"
        aria-describedby="onboarding-step-body"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-medium text-foreground-muted">
              Guided tour
            </p>
            <div className="flex items-center gap-1" aria-hidden="true">
              {progressDots.map((_, index) => (
                <span
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full bg-border-muted transition-colors duration-200",
                    index === currentStepIndex && "bg-accent-brand-purple"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
        <h2
          id="onboarding-step-title"
          className="mb-1 text-sm font-semibold text-foreground"
        >
          {step.title}
        </h2>
        <p
          id="onboarding-step-body"
          className="mb-3 text-xs text-foreground-muted"
        >
          {step.body}
        </p>
        {step.hint && (
          <p className="mb-3 text-[11px] text-foreground-muted">
            <span className="font-semibold text-foreground">Tip:</span>{" "}
            {step.hint}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="h-7 px-2 text-xs text-foreground-muted hover:text-foreground"
            aria-label="Skip guided tour"
          >
            Skip tour
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrev}
              disabled={isFirst}
              className={cn(
                "h-7 px-2 text-xs",
                isFirst && "opacity-50 cursor-default"
              )}
              aria-label="Go to previous step"
            >
              Back
            </Button>
            <Button
              size="sm"
              onClick={handleAdvance}
              className="h-7 px-3 text-xs"
              aria-label={isLast ? "Finish guided tour" : "Go to next step"}
            >
              {isLast ? "Finish" : "Next"}
            </Button>
          </div>
        </div>
        <div
          className={cn(
            "pointer-events-none absolute left-1/2 -translate-x-1/2 w-0 h-0",
            position.placement === "top"
              ? "bottom-[-6px] border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-border"
              : "top-[-6px] border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-border"
          )}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

