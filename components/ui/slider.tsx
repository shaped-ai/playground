"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"
import { FeatureType } from "@/types/enums"
import moment from "moment"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    onThumbMouseUp?: (event: React.PointerEvent<HTMLSpanElement>) => void
    showHoveredValue?: boolean
    headerType?: string
  }
>(
  (
    {
      className,
      onThumbMouseUp,
      showHoveredValue = false,
      headerType,
      ...props
    },
    ref
  ) => {
    const [hoveredThumbIndex, setHoveredThumbIndex] = React.useState<
      number | null
    >(null)
    const [isPointerDown, setIsPointerDown] = React.useState<boolean>(false)

    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center",
          className
        )}
        {...props}
      >
        <SliderPrimitive.Track
          className={cn(
            "relative h-3 w-full grow overflow-hidden rounded-sm bg-background-secondary",
            props.value && props.value.length > 1 && "h-2"
          )}
        >
          <SliderPrimitive.Range
            className={cn("absolute h-full bg-accent-brand-purple")}
          />
        </SliderPrimitive.Track>
        {props.value?.map((val, index) => (
          <SliderPrimitive.Thumb
            key={index}
            onPointerUp={(e) => {
              onThumbMouseUp?.(e)
              setIsPointerDown(false)
            }}
            onPointerDown={() => setIsPointerDown(true)}
            onPointerEnter={() => !isPointerDown && setHoveredThumbIndex(index)}
            onPointerLeave={() => setHoveredThumbIndex(null)}
            className={cn(
              "block rounded border border-border bg-background-primary transition-colors focus:outline-none focus:ring-2 focus:ring-border-active focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
              `${props.value && props.value.length > 1 ? "size-3" : "size-5"}`
            )}
            style={{
              ...(props.value &&
                props.value.length > 1 && {
                  boxShadow:
                    "0px 1px 3px 0px var(--Overlays-Black-Alpha-1, rgba(0, 0, 0, 0.05)), 0px 2px 1px -1px var(--Overlays-Black-Alpha-1, rgba(0, 0, 0, 0.05)), 0px 1px 4px 0px var(--Colors-Neutral-Neutral-Alpha-4, rgba(0, 0, 45, 0.09)), 0px 0px 0px 0.5px var(--Overlays-Black-Alpha-1, rgba(0, 0, 0, 0.05))",
                }),
            }}
          >
            {showHoveredValue && hoveredThumbIndex === index && (
              <span
                className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-background-primary px-1 text-xs text-white"
                style={{ transform: `translateX(-50%)` }}
              >
                {headerType && headerType == FeatureType.TIMESTAMP
                  ? moment.unix(val).format("YYYY/MM/DD")
                  : val}
              </span>
            )}
          </SliderPrimitive.Thumb>
        ))}
      </SliderPrimitive.Root>
    )
  }
)
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
