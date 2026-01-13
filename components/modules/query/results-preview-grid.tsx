"use client"

import type { QueryResultRow } from "@/lib/types/query.types"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { Film } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { CardTemplate, TemplateField } from "@/lib/types/template.types"
import { getTemplate } from "@/lib/utils/template-storage"

interface ResultsPreviewGridProps {
  data: QueryResultRow[]
  template?: CardTemplate | null
  engineName: string
  rankFeatures: any[]
  rankImageFeatures: any[]
}

export function ResultsPreviewGrid({
  data,
  template,
  engineName,
  rankFeatures,
  rankImageFeatures,
}: ResultsPreviewGridProps) {
  const [customTemplate, setCustomTemplate] = useState<CardTemplate | null>(
    template || null
  )

  useEffect(() => {
    const loadedTemplate = getTemplate(engineName, "grid")
    setCustomTemplate(loadedTemplate)
  }, [engineName, template])

  const templateKey = customTemplate
    ? JSON.stringify(customTemplate.fields.map((f) => f.id))
    : "default"

  return (
    <div className="h-full overflow-auto p-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {data.map(
          (item, idx) =>
            customTemplate && (
              <TemplateCard
                key={`${templateKey}-${item.item_id || idx}`}
                item={item}
                template={customTemplate}
                index={idx}
              />
            )
        )}
      </div>
    </div>
  )
}

function TemplateCard({
  item,
  template,
  index,
}: {
  item: QueryResultRow
  template: CardTemplate
  index: number
}) {
  const [imageError, setImageError] = useState(false)

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
            key={field.id}
            className={`relative  ${heightClasses[field.size]} bg-muted`}
          >
            {value && typeof value === "string" && !imageError ? (
              <Image
                src={value || "/placeholder.svg"}
                alt={field.label || ""}
                fill
                className="rounded-t-lg object-cover"
                onError={() => setImageError(true)}
                sizes="(max-width: 768px) 50vw, 300px"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Film className="text-foreground-muted/30 h-12 w-12" />
              </div>
            )}
          </div>
        )

      case "text":
        return (
          <div key={field.id} className={sizeClasses[field.size]}>
            <span className="text-sm font-medium text-foreground">
              {field.label ? `${field.label}: ` : ""}
            </span>
            &nbsp;
            <span
              className={
                field.size === "large"
                  ? "font-bold"
                  : field.size === "medium"
                  ? "font-semibold"
                  : ""
              }
            >
              {Array.isArray(value) ? value.join(", ") : value}
            </span>
          </div>
        )

      case "rating":
        return (
          <div
            key={field.id}
            className={`flex items-center text-foreground ${
              sizeClasses[field.size]
            }`}
          >
            <span className="text-sm font-medium text-foreground">
              {field.label ? `${field.label}: ` : ""}
            </span>
            &nbsp;
            <span className="font-semibold text-foreground">{value}</span>
          </div>
        )

      case "badge":
        return (
          <div key={field.id} className={sizeClasses[field.size]}>
            <span className="text-sm font-medium text-foreground">
              {field.label ? `${field.label}: ` : ""}
            </span>
            &nbsp;
            <Badge
              key={field.id}
              variant="secondary"
              className={sizeClasses[field.size]}
            >
              {Array.isArray(value) ? value.join(", ") : value}
            </Badge>
          </div>
        )

      default:
        return (
          <div key={field.id} className={sizeClasses[field.size]}>
            <span className="text-sm font-medium text-foreground">
              {field.label ? `${field.label}: ` : ""}
            </span>
            &nbsp;
            <span className="text-sm text-foreground">
              {Array.isArray(value) ? value.join(", ") : value}
            </span>
          </div>
        )
    }
  }

  const visibleFields = template.fields
    .filter((f) => f.visible)
    .sort((a, b) => a.position - b.position)
  const imageFields = visibleFields.filter((f) => f.type === "image")
  const otherFields = visibleFields.filter((f) => f.type !== "image")

  return (
    <Card
      className="transform overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 hover:scale-105 hover:shadow-lg"
      style={{
        animationDuration: "0.5s",
        animationDelay: `${index * 0.05}s`,
        animationFillMode: "both",
      }}
    >
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
