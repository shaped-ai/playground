"use client"

import type { QueryResultRow } from "@/lib/types/query.types"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Film, Star, Calendar, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { CardTemplate, TemplateField } from "@/lib/types/template.types"
import { getTemplate } from "@/lib/utils/template-storage"
import { cn } from "@/lib/utils"

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
        {data.map((item, idx) => (
          <MasonryCard
            key={`masonry-${item.item_id || idx}`}
            item={item}
            template={customTemplate}
            index={idx}
          />
        ))}
      </div>
    </div>
  )
}

function MasonryCard({
  item,
  template,
  index,
}: {
  item: QueryResultRow
  template: CardTemplate | null
  index: number
}) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const renderField = (field: TemplateField) => {
    if (!field.visible) return null
    const value = item[field.dataKey]
    if (!value) return null

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
            <span>{field.label ? `${field.label}: ` : ""}</span> &nbsp;
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

  const baseHeight = 300
  const heightVariance = 220
  const height = `${baseHeight + ((index * 83) % heightVariance)}px`

  const marginTop = `${
    index % 5 === 0
      ? 0
      : index % 5 === 1
      ? 12
      : index % 5 === 2
      ? 25
      : index % 5 === 3
      ? 15
      : index % 5 === 4
      ? 40
      : 45
  }px`

  return (
    <div
      className="masonry-item animate-masonry-drop group cursor-pointer"
      style={{
        marginTop,
        animationDelay: `${index * 20}ms`,
        animationFillMode: "both",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-2xl shadow-md transition-all duration-500 hover:shadow-2xl">
        <div
          className="relative w-full overflow-hidden bg-muted"
          style={{ height }}
        >
          {imageValue && typeof imageValue === "string" && !imageError ? (
            <Image
              src={imageValue || "/placeholder.svg"}
              alt={imageField?.label || "Image"}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              onError={() => setImageError(true)}
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
