import { cn } from "@/lib/utils"
import React, { useEffect, useRef, useState } from "react"

export default function TruncatedText({
  truncatedText,
  hoverText,
  isHoverable = true,
  className = "",
  hoverClassName = "",
  width,
}: {
  truncatedText: string | number
  hoverText?: string | number
  isHoverable?: boolean
  className?: string
  hoverClassName?: string
  width?: string
}) {
  const [showTruncatedText, setShowTruncatedText] = useState(false)
  const [isTruncated, setIsTruncated] = useState(false)
  const spanRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    const element = spanRef.current
    if (element && element.scrollWidth > element.clientWidth)
      setIsTruncated(true)
  }, [spanRef.current])

  return (
    <div
      className={cn("relative flex min-w-0", className)}
      style={{ width: width }}
    >
      <span
        ref={spanRef}
        onMouseEnter={() => isHoverable && setShowTruncatedText(true)}
        onMouseLeave={() => isHoverable && setShowTruncatedText(false)}
        className={cn(
          "truncate",
          showTruncatedText && isTruncated && "cursor-help"
        )}
      >
        {truncatedText}
      </span>
      {showTruncatedText && isTruncated && (
        <div
          className={cn(
            "z-9999 absolute rounded bg-black px-2 py-1 text-sm font-medium text-white",
            hoverClassName
          )}
        >
          {hoverText || truncatedText}
        </div>
      )}
    </div>
  )
}
