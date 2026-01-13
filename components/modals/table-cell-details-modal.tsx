"use client"

import { Icons } from "@/components/icons/icons"
import * as Dialog from "@radix-ui/react-dialog"
import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import ImageSkeleton from "@/components/loader/image-skeleton"
import { CopyClipboard } from "@/components/ui/copy-clipboard"

interface TableCellDetailsModalProps
  extends React.HTMLAttributes<HTMLDivElement> {
  isImage?: boolean
  value: string
  colName?: string
  triggerText?: string
  iconName?: string
  iconClass?: string
  triggerClassName?: string
  closeButtonClass?: string
  setShowDetailsIcon?: (value: React.SetStateAction<boolean>) => void
}

export function TableCellDetailsModal({
  isImage = false,
  value,
  colName,
  className,
  iconName,
  iconClass,
  triggerText,
  triggerClassName,
  closeButtonClass,
  setShowDetailsIcon,
}: TableCellDetailsModalProps) {
  const [imageLoaded, setimageLoaded] = React.useState("Loading")

  const TriggerIcon = Icons[iconName ?? "zoomIn"]
  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) {
          setShowDetailsIcon?.(false)
        }
      }}
    >
      <Dialog.Trigger asChild>
        {iconName && triggerText ? (
          <button
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex items-center gap-1 border border-[#8559E0] bg-white px-4 py-2 text-xs font-medium text-[#8559E0] shadow-sm hover:bg-[#E9E1F9]",
              triggerClassName
            )}
          >
            <TriggerIcon
              className={cn("size-4", iconClass)}
              strokeWidth={1.25}
            />
            <span>{triggerText}</span>
          </button>
        ) : triggerText ? (
          <button
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "flex items-center gap-1 border border-[#8559E0] bg-white px-4 py-2 text-xs font-medium text-[#8559E0] shadow-sm hover:bg-[#E9E1F9]",
              triggerClassName
            )}
          >
            <span>{triggerText}</span>
          </button>
        ) : (
          <button
            className={cn(triggerClassName)}
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <TriggerIcon
              className={cn("size-4", iconClass)}
              strokeWidth={1.25}
            />
          </button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-overlay-show z-9998 fixed inset-0 bg-gray-700/70" />
        <Dialog.Content
          className={cn(
            "data-[state=open]:animate-content-show z-9999 fixed left-[50%] top-[50%] flex w-[40vw] translate-x-[-50%] translate-y-[-50%] flex-col overflow-y-auto rounded-[6px] bg-background-base object-contain focus:outline-none",
            isImage ? "h-[80vh] " : "max-h-[80vh] min-h-[20vh]",
            className
          )}
        >
          <Dialog.Title className="absolute hidden">Image Modal</Dialog.Title>
          <div className="flex items-center justify-between bg-background-primary px-6 pt-4 pb-2 text-foreground">
            <div className="flex items-center gap-3">
              <Dialog.Close asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                  className="w-fit rounded-[32px] border border-border bg-background-primary p-1 shadow-sm hover:bg-background-secondary"
                >
                  <Icons.close
                    className="size-5 shrink-0 cursor-pointer"
                    strokeWidth={1.25}
                  />
                </button>
              </Dialog.Close>
              <span className="dark:text-[#F0F0EB] text-2xl font-bold text-black">
                {colName}
              </span>
            </div>
            <CopyClipboard text={value} showText={true} />
          </div>
          {isImage ? (
            <div
              className={cn(
                "size-full flex grow items-center justify-center bg-background-primary p-6"
              )}
            >
              {imageLoaded == "Loading" || imageLoaded == "Loaded" ? (
                <div className="relative h-full w-full">
                  <Image
                    src={value}
                    alt="item-image"
                    className="w-full object-contain"
                    fill
                    onLoad={() => setimageLoaded("Loaded")}
                    onError={() => setimageLoaded("Error")}
                  />
                  {imageLoaded == "Loading" && (
                    <ImageSkeleton className="absolute h-full w-full overflow-hidden rounded-lg object-contain " />
                  )}
                </div>
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg bg-gray-100 text-center">
                  <Icons.image className="h-[25%] w-[25%]" />
                  <span className="text-base font-medium">Image not found</span>
                </div>
              )}
            </div>
          ) : (
            <p className="relative mt-2 h-full w-full flex-1 grow flex-wrap overflow-y-auto break-all px-6 pb-6 pt-3">
              {value}
            </p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
