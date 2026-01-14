"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Film, Star, Calendar } from "lucide-react"
import type { QueryResultRow } from "@/lib/types/query.types"
import type { CardTemplate } from "@/lib/types/template.types"
import { Badge } from "@/components/ui/badge"
import { getTemplate } from "@/lib/utils/template-storage"

interface ResultsPreviewFeedProps {
  data: QueryResultRow[]
  template?: CardTemplate | null
  engineName: string
  rankFeatures: any[]
  rankImageFeatures: any[]
}

export function ResultsPreviewFeed({
  data,
  template,
  engineName,
  rankFeatures,
  rankImageFeatures,
}: ResultsPreviewFeedProps) {
  const [customTemplate, setCustomTemplate] = useState<CardTemplate | null>(
    template || null
  )
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const [isHovered, setIsHovered] = useState(false)
  const [startAutoScroll, setStartAutoScroll] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isHoveredRef = useRef(false)
  const animationFrameRef = useRef<number>(0)

  useEffect(() => {
    const loadedTemplate = getTemplate(engineName, "feed")
    setCustomTemplate(loadedTemplate)
  }, [engineName, template])

  const handleImageError = (index: number) => {
    setImageErrors((prev) => new Set(prev).add(index))
  }

  useEffect(() => {
    setImageErrors(new Set())
  }, [data])

  useEffect(() => {
    const timer = setTimeout(() => {
      setStartAutoScroll(true)
    }, 1600) // Wait for slide animation (1.2s) + small delay

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!startAutoScroll) return

    const scrollContainer = scrollContainerRef.current
    if (!scrollContainer) return

    const scrollSpeed = 1

    const autoScroll = () => {
      if (!isHoveredRef.current && scrollContainer) {
        scrollContainer.scrollTop += scrollSpeed

        // Reset to top when reached bottom
        if (
          scrollContainer.scrollTop >=
          scrollContainer.scrollHeight - scrollContainer.clientHeight
        ) {
          scrollContainer.scrollTop = 0
        }
      }
      animationFrameRef.current = requestAnimationFrame(autoScroll)
    }

    animationFrameRef.current = requestAnimationFrame(autoScroll)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [startAutoScroll])

  useEffect(() => {
    isHoveredRef.current = isHovered
  }, [isHovered])

  const renderField = (row: QueryResultRow, field: any) => {
    const value = row[field.dataKey]
    if (!value || !field.visible) return null

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

    switch (field.type) {
      case "image":
        return (
          <div
            className={`relative overflow-hidden rounded-t-xl bg-muted ${
              widthClasses[(field.width || "full") as keyof typeof widthClasses]
            } ${heightClasses[(field.height || "medium") as keyof typeof heightClasses]}`}
          >
            <Image
              src={value || "/placeholder.svg"}
              alt={field.label}
              fill
              className="object-cover"
              unoptimized
              onError={() => handleImageError(0)}
            />
          </div>
        )
      case "rating":
        return (
          <div className="flex items-center">
            <span className="text-sm font-medium">
              {field.label ? `${field.label}: ` : ""}
            </span>
            &nbsp;
            <span className="text-sm font-medium">
              {Array.isArray(value) ? value.join(", ") : value}
            </span>
          </div>
        )
      case "date":
        return (
          <div className="flex items-center text-sm text-foreground">
            <span className="text-sm font-medium">
              {field.label ? `${field.label}: ` : ""}
            </span>
            &nbsp;
            <span>{Array.isArray(value) ? value.join(", ") : value}</span>
          </div>
        )
      case "badge":
        return (
          <div className="flex items-center">
            <span className="text-sm font-medium">
              {field.label ? `${field.label}: ` : ""}
            </span>
            &nbsp;
            <Badge variant="secondary">
              {Array.isArray(value) ? value.join(", ") : value}
            </Badge>
          </div>
        )
      case "text":
      default:
        // const textSize =
        //   field.size === "large"
        //     ? "text-lg font-semibold"
        //     : field.size === "medium"
        //     ? "text-base font-semibold"
        //     : "text-sm text-muted-foreground"
        return (
          <div className="flex items-center">
            <span className="text-sm font-medium">
              {field.label ? `${field.label}: ` : ""}
            </span>
            &nbsp;
            <p className="text-sm text-foreground">
              {Array.isArray(value) ? value.join(", ") : value}
            </p>
          </div>
        )
    }
  }

  return (
    <div className="flex h-full justify-center overflow-hidden bg-background-solid">
      <style jsx>{`
        @keyframes feedSlideFromLeft {
          0% {
            opacity: 0;
            transform: translateX(-400px) scale(0.8) rotate(-8deg);
          }
          60% {
            transform: translateX(10px) scale(1.05) rotate(2deg);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1) rotate(0deg);
          }
        }
        @keyframes feedSlideFromRight {
          0% {
            opacity: 0;
            transform: translateX(400px) scale(0.8) rotate(8deg);
          }
          60% {
            transform: translateX(-10px) scale(1.05) rotate(-2deg);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1) rotate(0deg);
          }
        }
        @keyframes feedFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .feed-card-slide-left {
          animation: feedSlideFromLeft 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)
            forwards;
          opacity: 0;
        }
        .feed-card-slide-right {
          animation: feedSlideFromRight 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)
            forwards;
          opacity: 0;
        }
        .feed-card-fade {
          animation: feedFadeIn 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
      <div
        ref={scrollContainerRef}
        className="hide-scrollbar h-full w-full max-w-md overflow-y-auto p-4"
        onMouseEnter={() => {
          setIsHovered(true)
        }}
        onMouseLeave={() => {
          setIsHovered(false)
        }}
      >
        <div className="space-y-4">
          {data.map((row, index) => {
            let animationClass = "feed-card-fade"
            if (index < 5) {
              animationClass =
                index % 2 === 0
                  ? "feed-card-slide-left"
                  : "feed-card-slide-right"
            }

            return (
              <div
                key={row.item_id || index}
                className={`${animationClass} overflow-hidden rounded-xl border border-border bg-background-primary transition-shadow hover:shadow-lg`}
                style={{
                  animationDelay:
                    index < 5 ? `${index * 0.2}s` : `${(index - 5) * 0.08}s`,
                }}
              >
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
                    <div className="space-y-2 p-4">
                      {customTemplate &&
                        customTemplate.fields
                          .filter(
                            (f) =>
                              f.visible &&
                              f.type !== "image" &&
                              f.type !== "video"
                          )
                          .sort((a, b) => a.position - b.position)
                          .map((field) => (
                            <div key={field.id}>{renderField(row, field)}</div>
                          ))}
                    </div>
                  )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
