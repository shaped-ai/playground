import { cn } from "@/lib/utils"
import React from "react"
import { Icons } from "@/components/icons/icons"

export default function ImageSkeleton({ className }) {
  return (
    <div
      role="status"
      className={cn("animate-pulse rtl:space-x-reverse", className)}
    >
      <div
        className={
          "dark:bg-gray-700 flex h-full w-full items-center  justify-center bg-slate-100"
        }
      >
        <Icons.image className="h-[25%] w-[25%] text-slate-300" />
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  )
}
