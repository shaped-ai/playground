"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Film, Star, Calendar, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { QueryResultRow } from "@/lib/types/query.types"
import type { CardTemplate } from "@/lib/types/template.types"
import { getTemplate } from "@/lib/utils/template-storage"

interface ResultsPreviewListProps {
  data: QueryResultRow[]
  template?: CardTemplate | null
  engineName: string
  rankFeatures: any[]
  rankImageFeatures: any[]
}

export function ResultsPreviewList({
  data,
  template,
  engineName,
  rankFeatures,
  rankImageFeatures,
}: ResultsPreviewListProps) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const [customTemplate, setCustomTemplate] = useState<CardTemplate | null>(
    template || null
  )
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(true)

  useEffect(() => {
    const loadedTemplate = getTemplate(engineName, "list")
    setCustomTemplate(loadedTemplate)
  }, [engineName, template])

  useEffect(() => {
    setIsAnimating(true)
    const timer = setTimeout(
      () => setIsAnimating(false),
      data.length * 80 + 500
    )
    return () => clearTimeout(timer)
  }, [data.length])

  const handleImageError = (idx: number) => {
    setImageErrors((prevErrors) => new Set([...prevErrors, idx]))
  }

  useEffect(() => {
    setImageErrors(new Set())
  }, [data])

  const renderField = (row: QueryResultRow, field: any, isCompact = false) => {
    const value = row[field.dataKey]
    if (!value || !field.visible) return null

    switch (field.type) {
      case "image":
        return null
      case "rating":
        return (
          <div key={field.id} className="flex items-center text-xs font-medium">
            <span>{field.label}: </span> &nbsp;
            <span>{Array.isArray(value) ? value.join(", ") : value}</span>
          </div>
        )
      case "date":
        return (
          <div
            key={field.id}
            className="flex items-center text-xs text-muted-foreground"
          >
            <span>{field.label}: </span> &nbsp;
            <span>{Array.isArray(value) ? value.join(", ") : value}</span>
          </div>
        )
      case "badge":
        return (
          <div key={field.id} className="flex items-center">
            <span>{field.label}: </span> &nbsp;
            <Badge key={field.id} variant="secondary" className="text-xs">
              <span>{Array.isArray(value) ? value.join(", ") : value}</span>
            </Badge>
          </div>
        )
      case "text":
        if (field.size === "large" || field.position === 0) {
          return (
            <h4
              key={field.id}
              className="flex items-center truncate text-sm font-semibold"
            >
              <span>{field.label}: </span> &nbsp;
              <span>{Array.isArray(value) ? value.join(", ") : value}</span>
            </h4>
          )
        }
        return (
          <p
            key={field.id}
            className="flex items-center truncate text-xs text-muted-foreground"
          >
            <span>{field.label}: </span> &nbsp;
            <span>{Array.isArray(value) ? value.join(", ") : value}</span>
          </p>
        )
      default:
        return null
    }
  }

  const title = rankFeatures.find(
    (f) => f.name === "title" || f.name === "movie_title" || f.name === "name"
  )?.name
  const itemId = rankFeatures.find(
    (f) => f.name === "id" || f.name === "item_id"
  )?.name
  const year = rankFeatures.find((f) => f.name === "year")?.name
  const rating = rankFeatures.find((f) => f.name === "rating")?.name
  const genre = rankFeatures.find((f) => f.name === "genre")?.name
  console.log("customTemplate", customTemplate)
  return (
    <div className="mx-auto max-w-md">
      <div className="space-y-2">
        {data.map((row, idx) => (
          <div
            key={row.item_id || idx}
            className="hover:border-primary/50 flex cursor-pointer items-center gap-4 rounded-lg border border-border bg-background-primary p-3 transition-all duration-200 hover:shadow-md"
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              animation: `slideInLeft 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${
                idx * 0.08
              }s both`,
              willChange: isAnimating ? "transform, opacity" : "auto",
            }}
          >
            {/* Thumbnail */}
            {customTemplate &&
              customTemplate.fields.length > 0 &&
              customTemplate.fields.filter(
                (f) => f.visible && f.type === "image"
              ).length > 0 && (
                <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded bg-muted">
                  {customTemplate.fields
                    .filter((f) => f.visible && f.type === "image")
                    .slice(0, 1)
                    .map((field) => {
                      const imageUrl = row[field.dataKey]
                      return imageUrl && !imageErrors.has(idx) ? (
                        <Image
                          key={field.id}
                          src={imageUrl || "/placeholder.svg"}
                          alt={field.label || ""}
                          fill
                          className="object-cover"
                          unoptimized
                          onError={() => handleImageError(idx)}
                        />
                      ) : (
                        <div
                          key={field.id}
                          className="flex h-full w-full items-center justify-center"
                        >
                          <Film className="text-foreground-muted/40 h-8 w-8" />
                        </div>
                      )
                    })}
                </div>
              )}

            {/* Content */}
            <div className="min-w-0 flex-1 space-y-1">
              {customTemplate &&
                customTemplate.fields
                  .filter(
                    (f) => f.visible && f.type !== "image" && f.type !== "video"
                  )
                  .sort((a, b) => a.position - b.position)
                  .slice(0, 4)
                  .map((field) => (
                    <div key={field.id}>{renderField(row, field)}</div>
                  ))}
            </div>

            {/* Arrow indicator */}
            <ChevronRight
              className={`h-5 w-5 text-foreground-muted transition-transform duration-200 ${
                hoveredIndex === idx ? "translate-x-1 text-primary" : ""
              }`}
            />
          </div>
        ))}

        <style jsx>{`
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-50px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </div>
    </div>
  )
}
