"use client"

import { useState } from "react"
import Image from "next/image"
import { Film, Star, Calendar, Tag } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { QueryResultRow } from "@/lib/types/query.types"
import type { TemplateField } from "@/lib/types/template.types"

interface TemplateCardRendererProps {
  data: QueryResultRow
  template: TemplateField[]
  className?: string
}

export function TemplateCardRenderer({
  data,
  template,
  className = "",
}: TemplateCardRendererProps) {
  const [imageError, setImageError] = useState(false)

  const renderField = (field: TemplateField) => {
    if (!field.visible) return null

    const value = data[field.dataKey]
    if (value === null || value === undefined) return null
    const displayLabel = field.label?.trim() || field.dataKey || "Image"

    const sizeClasses = {
      small: "text-xs",
      medium: "text-sm",
      large: "text-base",
      full: "text-lg",
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

    switch (field.type) {
      case "image":
        const imageUrl = value as string
        const hasValidImage =
          imageUrl && imageUrl.startsWith("http") && !imageError
        return (
          <div
            key={field.id}
            className={`relative ${widthClasses[field.width]} ${
              heightClasses[field.size]
            } overflow-hidden rounded-lg bg-muted`}
          >
            {hasValidImage ? (
              <Image
                src={imageUrl || "/placeholder.svg"}
                alt={displayLabel}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                sizes="(max-width: 768px) 100vw, 400px"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Film className="text-muted-foreground/30 h-16 w-16" />
              </div>
            )}
          </div>
        )

      case "video":
        const videoUrl = value as string
        return (
          <div
            key={field.id}
            className={`relative ${widthClasses[field.width]} ${
              heightClasses[field.size]
            } overflow-hidden rounded-lg bg-muted`}
          >
            {videoUrl ? (
              <video
                src={videoUrl}
                controls
                className="h-full w-full object-cover"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Film className="text-muted-foreground/30 h-12 w-12" />
              </div>
            )}
          </div>
        )

      case "text":
        return (
          <div key={field.id} className={sizeClasses[field.size]}>
            <span
              className={
                field.size === "large" || field.size === "full"
                  ? "font-bold"
                  : field.size === "medium"
                  ? "font-semibold"
                  : ""
              }
            >
              {String(value)}
            </span>
          </div>
        )

      case "rating":
        return (
          <div
            key={field.id}
            className={`flex items-center gap-1 ${sizeClasses[field.size]}`}
          >
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold">{value}</span>
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
            <span>{String(value)}</span>
          </div>
        )

      case "badge":
        return (
          <Badge
            key={field.id}
            variant="secondary"
            className={sizeClasses[field.size]}
          >
            {String(value)}
          </Badge>
        )

      case "tag":
        return (
          <div
            key={field.id}
            className={`flex items-center gap-1 ${sizeClasses[field.size]}`}
          >
            <Tag className="h-3 w-3" />
            <span className="text-muted-foreground">{String(value)}</span>
          </div>
        )

      default:
        return (
          <div key={field.id} className={sizeClasses[field.size]}>
            {String(value)}
          </div>
        )
    }
  }

  const imageFields = template.filter(
    (f) => f.type === "image" || f.type === "video"
  )
  const otherFields = template.filter(
    (f) => f.type !== "image" && f.type !== "video"
  )

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        {imageFields.map((field) => renderField(field))}
        {otherFields.length > 0 && (
          <div className="space-y-2 p-3">
            {otherFields.map((field) => renderField(field))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
