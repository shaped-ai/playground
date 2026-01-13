"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Film, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { QueryResultRow } from "@/lib/types/query.types"
import type { CardTemplate } from "@/lib/types/template.types"
import { getTemplate } from "@/lib/utils/template-storage"

interface ResultsPreviewHorizontalProps {
  data: QueryResultRow[]
  template?: CardTemplate | null
  engineName: string
  rankFeatures: any[]
  rankImageFeatures: any[]
}

export function ResultsPreviewHorizontal({
  data,
  template,
  engineName,
  rankFeatures,
  rankImageFeatures,
}: ResultsPreviewHorizontalProps) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const [customTemplate, setCustomTemplate] = useState<CardTemplate | null>(
    template || null
  )
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [animationComplete, setAnimationComplete] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const autoScrollRef = useRef<boolean>(false)
  const animationFrameRef = useRef<number>(0)

  useEffect(() => {
    // Always use the template prop if provided, otherwise load from localStorage
    const loadedTemplate = getTemplate(engineName, "ticker")
    setCustomTemplate(loadedTemplate)
  }, [engineName, template])

  const handleImageError = (idx: number) => {
    setImageErrors((prevErrors) => new Set([...prevErrors, idx]))
  }

  useEffect(() => {
    setImageErrors(new Set())
  }, [data])

  const checkScrollability = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    )
  }

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current
    if (!container) return

    autoScrollRef.current = false

    const scrollAmount = container.clientWidth * 0.8
    const targetScroll =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    })

    setTimeout(() => {
      autoScrollRef.current = true
    }, 2000)
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    checkScrollability()
    container.addEventListener("scroll", checkScrollability)
    window.addEventListener("resize", checkScrollability)

    return () => {
      container.removeEventListener("scroll", checkScrollability)
      window.removeEventListener("resize", checkScrollability)
    }
  }, [data])

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true)
    }, data.length * 50 + 500) // Wait for all stagger animations + 500ms buffer

    return () => clearTimeout(timer)
  }, [data.length])

  useEffect(() => {
    if (!animationComplete || !scrollContainerRef.current) return

    let lastTimestamp = 0
    const scrollSpeed = 2 // pixels per frame

    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp
      const delta = timestamp - lastTimestamp

      const container = scrollContainerRef.current
      if (!container) {
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }

      const maxScroll = container.scrollWidth - container.clientWidth
      if (container.scrollLeft >= maxScroll - 5) {
        container.scrollLeft = 0
        checkScrollability()
      }

      if (autoScrollRef.current) {
        container.scrollLeft += scrollSpeed
        checkScrollability()
      }

      lastTimestamp = timestamp
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    autoScrollRef.current = true
    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animationComplete])

  const handleMouseEnter = () => {
    autoScrollRef.current = false
  }

  const handleMouseLeave = () => {
    autoScrollRef.current = true
  }

  const widthClasses = {
    small: "w-32",
    medium: "w-48",
    large: "w-64",
    full: "w-full",
  }

  const heightClasses = {
    small: "h-32",
    medium: "h-48",
    large: "h-64",
    full: "h-96",
  }

  const renderField = (row: QueryResultRow, field: any) => {
    const value = row[field.dataKey]
    if (!value || !field.visible) return null

    switch (field.type) {
      case "image":
        return (
          <div
            key={field.id}
            className={`relative overflow-hidden rounded-t-lg bg-muted ${
              widthClasses[field.size || "full"]
            } ${heightClasses[field.size || "large"]}`}
          >
            <Image
              src={value || "/placeholder.svg"}
              alt={field.label || ""}
              fill
              className="object-cover"
              unoptimized
              onError={() => handleImageError(0)}
            />
          </div>
        )
      case "text":
        const textSize =
          field.size === "large"
            ? "text-base font-semibold"
            : field.size === "medium"
            ? "text-sm font-medium"
            : "text-xs text-muted-foreground"
        return (
          <p key={field.id} className={`${textSize} truncate`}>
            <span>{field.label ? `${field.label}: ` : ""}</span> &nbsp;
            <span>{Array.isArray(value) ? value.join(", ") : value}</span>
          </p>
        )
      default:
        return (
          <span key={field.id} className="text-xs text-muted-foreground">
            <span>{field.label ? `${field.label}: ` : ""}</span> &nbsp;
            <span>{Array.isArray(value) ? value.join(", ") : value}</span>
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <h3 className="text-lg font-semibold">Recommended for You</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="shadow-xs h-auto w-auto bg-background-primary px-2.5 py-1.5"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="shadow-xs h-auto w-auto bg-background-primary px-2.5 py-1.5"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="hide-scrollbar flex gap-4 overflow-x-auto scroll-smooth pb-4"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {data.map((row, idx) => (
          <div
            key={row.item_id || idx}
            className="group w-[180px] shrink-0 cursor-pointer"
            style={{
              animation: `slideIn 0.8s ease-out ${idx * 0.08}s both`,
            }}
          >
            <div className="bg-card overflow-hidden rounded-lg border transition-all duration-300 hover:scale-105 hover:shadow-lg">
              {customTemplate &&
                customTemplate.fields
                  .filter(
                    (f) =>
                      f.visible && (f.type === "image" || f.type === "video")
                  )
                  .sort((a, b) => a.position - b.position)
                  .map((field) => (
                    <div key={field.id}>{renderField(row, field)}</div>
                  ))}
              {customTemplate &&
                customTemplate.fields.filter(
                  (f) => f.visible && f.type !== "image" && f.type !== "video"
                ).length > 0 && (
                  <div className="space-y-1 p-3">
                    {customTemplate &&
                      customTemplate.fields
                        .filter(
                          (f) =>
                            f.visible &&
                            f.type !== "image" &&
                            f.type !== "video"
                        )
                        .sort((a, b) => a.position - b.position)
                        .slice(0, 3)
                        .map((field) => (
                          <div key={field.id}>{renderField(row, field)}</div>
                        ))}
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            margin-left: -30px;
          }
          to {
            opacity: 1;
            margin-left: 0;
          }
        }
      `}</style>
    </div>
  )
}
