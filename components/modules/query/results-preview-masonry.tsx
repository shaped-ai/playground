"use client"

import type { QueryResultRow } from "@/lib/types/query.types"
import Image from "next/image"
import { useEffect, useState, useMemo } from "react"
import { Film, Star, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { CardTemplate, TemplateField } from "@/lib/types/template.types"
import { getTemplate } from "@/lib/utils/template-storage"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/shared/use-media-query"
import { useTheme } from "next-themes"

interface ResultsPreviewMasonryProps {
  data: QueryResultRow[]
  template?: CardTemplate | null
  engineName: string
  rankFeatures: any[]
  rankImageFeatures: any[]
}

export function ResultsPreviewMasonry({
  data,
  template,
  engineName,
  rankFeatures,
  rankImageFeatures,
}: ResultsPreviewMasonryProps) {
  const [customTemplate, setCustomTemplate] = useState<CardTemplate | null>(
    template || null
  )

  useEffect(() => {
    const loadedTemplate = getTemplate(engineName, "masonry")
    setCustomTemplate(loadedTemplate)
  }, [engineName, template])

  // Map data to include original index for display
  // CSS Grid naturally fills horizontally first (row by row), so no reordering needed
  const displayData = useMemo(() => {
    if (!data || data.length === 0) return []
    return data.map((item, index) => ({
      item,
      originalIndex: index,
      displayIndex: index,
    }))
  }, [data])

  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No data to display</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto px-6 pb-6 pt-3">
      <div className="masonry-grid">
        {displayData.map(({ item, displayIndex }) => (
          <MasonryCard
            key={`masonry-${item.item_id || displayIndex}`}
            item={item}
            template={customTemplate}
            originalIndex={displayIndex}
          />
        ))}
      </div>
    </div>
  )
}

function MasonryCard({
  item,
  template,
  originalIndex,
}: {
  item: QueryResultRow
  template: CardTemplate | null
  originalIndex: number
}) {
  const isMobile = useIsMobile()
  const { theme } = useTheme()
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null)

  const renderField = (field: TemplateField) => {
    if (!field.visible) return null
    const value = item[field.dataKey]
    if (!value) return null
    const displayLabel = field.label?.trim() || field.dataKey

    const sizeClasses = {
      small: "text-xs",
      medium: "text-sm",
      large: "text-base",
      full: "text-lg",
    }

    switch (field.type) {
      case "image":
        return null // Images handled separately in masonry layout

      case "text":
        return (
          <div
            key={field.id}
            className={cn(sizeClasses[field.size], "flex items-center")}
          >
            <span
              className={`${
                field.size === "large"
                  ? "font-bold"
                  : field.size === "medium"
                    ? "font-semibold"
                    : ""
              } line-clamp-2`}
            >
              {Array.isArray(value) ? value.join(", ") : value}
            </span>
          </div>
        )

      case "rating":
        return (
          <div
            key={field.id}
            className={`flex items-center gap-1 ${sizeClasses[field.size]}`}
          >
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">
              {Array.isArray(value) ? value.join(", ") : value}
            </span>
          </div>
        )

      case "date":
        return (
          <div
            key={field.id}
            className={`flex items-center gap-1 text-muted-foreground ${
              sizeClasses[field.size]
            }`}
          >
            <Calendar className="h-3 w-3" />
            <span>{Array.isArray(value) ? value.join(", ") : value}</span>
          </div>
        )

      case "badge":
        return (
          <Badge
            key={field.id}
            variant="secondary"
            className={sizeClasses[field.size]}
          >
            {Array.isArray(value) ? value.join(", ") : value}
          </Badge>
        )

      default:
        return (
          <div key={field.id} className={sizeClasses[field.size]}>
            {Array.isArray(value) ? value.join(", ") : value}
          </div>
        )
    }
  }

  const visibleFields = (template?.fields || [])
    .filter((f) => f.visible)
    .sort((a, b) => a.position - b.position)
  const imageFields = visibleFields.filter((f) => f.type === "image")
  const otherFields = visibleFields.filter((f) => f.type !== "image")
  const imageField = imageFields[0]
  const imageValue = imageField ? item[imageField.dataKey] : null
  const imageLabel = imageField?.label?.trim() || imageField?.dataKey || "Image"

  return (
    <div
      className="masonry-item animate-masonry-drop group cursor-pointer"
      style={{
        animationDelay: `${originalIndex * 20}ms`,
        animationFillMode: "both",
        transform: isMobile ? "scale(0.5)" : "scale(1)",
        transformOrigin: "top left",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-2xl shadow-md transition-all duration-500 hover:shadow-2xl">
        <div
          className="relative w-full overflow-hidden bg-muted"
          style={{ aspectRatio: imageAspectRatio ?? "4 / 3" }}
        >
          {imageValue && typeof imageValue === "string" && !imageError ? (
            <Image
              src={imageValue || "/placeholder.svg"}
              alt={imageLabel}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              onError={() => setImageError(true)}
              onLoadingComplete={({ naturalWidth, naturalHeight }) => {
                if (naturalWidth && naturalHeight) {
                  setImageAspectRatio(naturalWidth / naturalHeight)
                }
              }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="via-muted/70 to-muted/50 bg-linear-to-br flex h-full w-full items-center justify-center from-muted transition-transform duration-700 group-hover:scale-110">
              <Film className="text-muted-foreground/20 h-16 w-16" />
            </div>
          )}
          <div
            className={`bg-linear-to-t dark:from-white/60 dark:via-white/50 absolute inset-0 from-black/90 via-black/50 to-transparent transition-opacity duration-500 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className={`absolute bottom-0 left-0 right-0 transform space-y-2 p-6 transition-transform duration-500 ${
              theme === "dark" ? "text-black" : "text-white"
            }`}>
              {otherFields.map((field) => (
                <div key={field.id}>{renderField(field)}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
