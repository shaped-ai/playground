"use client"

import type { QueryResultRow } from "@/lib/types/query.types"
import Image from "next/image"
import { useEffect, useState, useMemo } from "react"
import { Film, Star, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { CardTemplate, TemplateField } from "@/lib/types/template.types"
import { getTemplate } from "@/lib/utils/template-storage"
import { cn } from "@/lib/utils"
import { useMediaQuery, useIsMobile } from "@/hooks/shared/use-media-query"

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

  // Detect column count based on screen size
  const isSm = useMediaQuery("(min-width: 640px)")
  const isLg = useMediaQuery("(min-width: 1024px)")
  const isXl = useMediaQuery("(min-width: 1536px)")

  const columnCount = useMemo(() => {
    if (isXl) return 5
    if (isLg) return 4
    if (isSm) return 3
    return 2
  }, [isSm, isLg, isXl])

  useEffect(() => {
    const loadedTemplate = getTemplate(engineName, "masonry")
    setCustomTemplate(loadedTemplate)
  }, [engineName, template])

  // Reorder items for left-to-right, top-to-bottom layout
  // CSS columns fill top-to-bottom first, so we need to reorder the array
  // so that when CSS processes them, they appear left-to-right then top-to-bottom
  const reorderedData = useMemo(() => {
    if (!data || data.length === 0) return []

    const totalItems = data.length
    const rowsPerColumn = Math.ceil(totalItems / columnCount)

    // Create a mapping array: for each position in the reordered array,
    // determine which original item should go there
    const reordered: Array<{
      item: QueryResultRow
      originalIndex: number
      displayIndex: number
    }> = []

    // For each position in the final array, calculate which original item belongs there
    for (let position = 0; position < totalItems; position++) {
      // In CSS columns, position p goes to:
      // column = p % columnCount
      // row = Math.floor(p / columnCount)
      const finalColumn = position % columnCount
      const finalRow = Math.floor(position / columnCount)

      // We want original item i to appear at row = floor(i / columnCount), column = i % columnCount
      // So we need to find i such that:
      // floor(i / columnCount) = finalRow AND i % columnCount = finalColumn
      // This gives us: i = finalRow * columnCount + finalColumn
      const originalIndex = finalRow * columnCount + finalColumn

      if (originalIndex < totalItems) {
        reordered.push({
          item: data[originalIndex],
          originalIndex,
          displayIndex: originalIndex,
        })
      }
    }

    return reordered
  }, [data, columnCount])

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
        {reorderedData.map(({ item, displayIndex }, idx) => (
          <MasonryCard
            key={`masonry-${item.item_id || displayIndex}`}
            item={item}
            template={customTemplate}
            originalIndex={displayIndex}
            positionInReorderedArray={idx}
            columnCount={columnCount}
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
  positionInReorderedArray,
  columnCount,
}: {
  item: QueryResultRow
  template: CardTemplate | null
  originalIndex: number
  positionInReorderedArray: number
  columnCount: number
}) {
  const isMobile = useIsMobile()
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
            <span>{displayLabel ? `${displayLabel}: ` : ""}</span> &nbsp;
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

  // Calculate marginTop based on final column position in the layout
  // The positionInReorderedArray determines which column this item ends up in
  const columnPosition = positionInReorderedArray % columnCount
  // Use smaller offsets on mobile to account for smaller card size
  const marginTop = isMobile
    ? `${
        columnPosition === 0
          ? 0
          : columnPosition === 1
            ? 6
            : columnPosition === 2
              ? 12
              : columnPosition === 3
                ? 8
                : columnPosition === 4
                  ? 20
                  : 22
      }px`
    : `${
        columnPosition === 0
          ? 0
          : columnPosition === 1
            ? 12
            : columnPosition === 2
              ? 25
              : columnPosition === 3
                ? 15
                : columnPosition === 4
                  ? 40
                  : 45
      }px`

  return (
    <div
      className="masonry-item animate-masonry-drop group cursor-pointer"
      style={{
        marginTop,
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
            <div className="absolute bottom-0 left-0 right-0 transform space-y-2 p-6 text-white transition-transform duration-500">
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
