"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Film, Star, Calendar } from "lucide-react"
import { Swiper, SwiperSlide } from "swiper/react"
import {
  Navigation,
  Pagination,
  Autoplay,
  EffectCoverflow,
} from "swiper/modules"
import type { QueryResultRow } from "@/lib/types/query.types"
import type { CardTemplate } from "@/lib/types/template.types"
import { getTemplate } from "@/lib/utils/template-storage"
import { Badge } from "@/components/ui/badge"
import type { Swiper as SwiperType } from "swiper"

import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import "swiper/css/effect-coverflow"

interface ResultsPreviewCarouselProps {
  data: QueryResultRow[]
  engineName: string
  template: CardTemplate | null
  rankFeatures: any[]
  rankImageFeatures: any[]
}

export function ResultsPreviewCarousel({
  data,
  template,
  engineName,
  rankFeatures,
  rankImageFeatures,
}: ResultsPreviewCarouselProps) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set())
  const [customTemplate, setCustomTemplate] = useState<CardTemplate | null>(
    template || null
  )
  const swiperRef = useRef<SwiperType | null>(null)
  const [showInitialAnimation, setShowInitialAnimation] = useState(true)

  useEffect(() => {
    const loadedTemplate = getTemplate(engineName, "carousel")
    setCustomTemplate(loadedTemplate)
  }, [engineName, template])

  useEffect(() => {
    setShowInitialAnimation(true)
    const timer = setTimeout(() => setShowInitialAnimation(false), 1200)
    return () => clearTimeout(timer)
  }, [data])

  const handleImageError = (idx: number) => {
    setImageErrors((prevErrors) => new Set([...prevErrors, idx]))
  }

  useEffect(() => {
    setImageErrors(new Set())
  }, [data])

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
            className={`relative overflow-hidden bg-muted ${
              heightClasses[field.size || "full"]
            } ${heightClasses[field.size || "large"]}`}
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
          <div key={field.id} className="flex items-center">
            <span>{field.label ? `${field.label}: ` : ""}</span> &nbsp;
            <span className="text-sm font-medium">{value}</span>
          </div>
        )
      case "date":
        return (
          <div
            key={field.id}
            className="flex items-center text-sm text-muted-foreground"
          >
            <span>{field.label ? `${field.label}: ` : ""}</span> &nbsp;
            <span>{value}</span>
          </div>
        )
      case "badge":
        return (
          <div key={field.id} className="flex items-center">
            <span>{field.label ? `${field.label}: ` : ""}</span> &nbsp;
            <Badge variant="secondary">
              <span>{value}</span>
            </Badge>
          </div>
        )
      case "text":
      default:
        const textSize =
          field.size === "large"
            ? "text-lg font-semibold"
            : field.size === "medium"
            ? "text-base font-semibold"
            : "text-sm text-muted-foreground"
        return (
          <p key={field.id} className={textSize}>
            <span>{field.label ? `${field.label}: ` : ""}</span> &nbsp;
            <span>{Array.isArray(value) ? value.join(", ") : value}</span>
          </p>
        )
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="w-full max-w-5xl">
        <Swiper
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          modules={[Navigation, Pagination, Autoplay, EffectCoverflow]}
          effect="coverflow"
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={3.5}
          spaceBetween={28}
          autoplay={{
            delay: 2000,
            disableOnInteraction: false,
          }}
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 115,
            modifier: 2,
            slideShadows: false,
          }}
          pagination={{
            clickable: true,
            dynamicBullets: true,
          }}
          navigation={false}
          loop={true}
          className="pb-12! "
          onMouseEnter={() => swiperRef.current?.autoplay?.stop()}
          onMouseLeave={() => swiperRef.current?.autoplay?.start()}
        >
          {data.map((row, idx) => (
            <SwiperSlide key={row.item_id || idx}>
              <div
                className="bg-card w-full cursor-pointer overflow-hidden rounded-xl border transition-shadow hover:shadow-xl"
                style={
                  showInitialAnimation
                    ? {
                        animation: `dropFromTop 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
                        opacity: 0,
                      }
                    : undefined
                }
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
                    <div className="space-y-0.5 bg-background-primary p-3">
                      {customTemplate.fields
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
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style jsx>{`
        @keyframes dropFromTop {
          0% {
            opacity: 0;
            transform: translateY(-100px);
          }
          80% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
