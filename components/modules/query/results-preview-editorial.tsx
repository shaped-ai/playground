"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Film } from "lucide-react"
import type { QueryResultRow } from "@/lib/types/query.types"
import { getTemplate } from "@/lib/utils/template-storage"
import { CardTemplate } from "@/lib/types/template.types"

interface ResultsPreviewEditorialProps {
  data: QueryResultRow[]
  engineName: string
  template: CardTemplate | null
}

export function ResultsPreviewEditorial({
  data,
  engineName,
  template,
}: ResultsPreviewEditorialProps) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const [customTemplate, setCustomTemplate] = useState<CardTemplate | null>(
    template || null
  )

  const handleImageError = (index: number) => {
    setImageErrors((prevErrors) => new Set(prevErrors).add(index))
  }

  useEffect(() => {
    setImageErrors(new Set())
  }, [data])

  useEffect(() => {
    if (!template) {
      const loadedTemplate = getTemplate(engineName, "editorial")
      setCustomTemplate(loadedTemplate)
    }
  }, [engineName, template])

  const featuredItem = data[0]
  const secondaryItems = data.slice(1, 4)
  const gridItems = data.slice(4)

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Featured Item */}
        {featuredItem && (
          <div
            className="bg-card overflow-hidden rounded-2xl border transition-shadow hover:shadow-xl"
            style={{
              animation: `fadeScaleIn 0.6s ease-out both`,
            }}
          >
            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div className="aspect-2/3 relative overflow-hidden rounded-lg bg-muted">
                {featuredItem.poster_url && !imageErrors.has(0) ? (
                  <Image
                    src={featuredItem.poster_url || "/placeholder.svg"}
                    alt={
                      featuredItem.movie_title ||
                      featuredItem.title ||
                      "Movie poster"
                    }
                    fill
                    className="object-cover"
                    unoptimized
                    onError={() => handleImageError(0)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Film className="text-foreground-muted/40 h-24 w-24" />
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center gap-4">
                <div className="inline-block">
                  <span className="rounded-full bg-background-secondary px-3 py-1 text-xs font-semibold text-foreground">
                    Featured
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-foreground">
                  {featuredItem.movie_title || featuredItem.title || "Untitled"}
                </h2>
                {featuredItem.year && (
                  <p className="text-lg text-foreground-muted">
                    {featuredItem.year}
                  </p>
                )}
                {featuredItem.rating && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      {featuredItem.rating}
                    </span>
                    <span className="text-foreground-muted">/10</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Secondary Items */}
        {secondaryItems.length > 0 && (
          <div className="grid gap-4 md:grid-cols-3">
            {secondaryItems.map((row, index) => {
              const actualIndex = index + 1
              return (
                <div
                  key={row.item_id || actualIndex}
                  className="overflow-hidden rounded-xl border border-border bg-background-primary transition-shadow hover:shadow-lg"
                  style={{
                    animation: `fadeScaleIn 0.5s ease-out ${
                      0.1 + index * 0.1
                    }s both`,
                  }}
                >
                  <div className="aspect-2/3 relative bg-muted">
                    {row.poster_url && !imageErrors.has(actualIndex) ? (
                      <Image
                        src={row.poster_url || "/placeholder.svg"}
                        alt={row.movie_title || row.title || "Movie poster"}
                        fill
                        className="object-cover"
                        unoptimized
                        onError={() => handleImageError(actualIndex)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Film className="text-muted-foreground/40 h-16 w-16" />
                      </div>
                    )}
                  </div>
                  <div className="p-3 text-foreground">
                    <h3 className="truncate text-sm font-semibold text-foreground">
                      {row.movie_title || row.title || "Untitled"}
                    </h3>
                    {row.year && (
                      <p className="text-xs text-foreground-muted">
                        {row.year}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Grid Items */}
        {gridItems.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
            {gridItems.map((row, index) => {
              const actualIndex = index + 4
              return (
                <div
                  key={row.item_id || actualIndex}
                  className="bg-card overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
                  style={{
                    animation: `fadeScaleIn 0.5s ease-out ${
                      0.4 + index * 0.05
                    }s both`,
                  }}
                >
                  <div className="aspect-2/3 relative bg-muted">
                    {row.poster_url && !imageErrors.has(actualIndex) ? (
                      <Image
                        src={row.poster_url || "/placeholder.svg"}
                        alt={row.movie_title || row.title || "Movie poster"}
                        fill
                        className="object-cover"
                        unoptimized
                        onError={() => handleImageError(actualIndex)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Film className="text-foreground-muted/40 h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-2 text-foreground">
                    <h3 className="truncate text-xs font-medium text-foreground">
                      {row.movie_title || row.title || "Untitled"}
                    </h3>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
