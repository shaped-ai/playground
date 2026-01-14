import { cn } from "@/lib/utils"
import { useState } from "react"
import { Icons } from "@/components/icons/icons"
import copyToClipboard from "@/utils/copy-to-clipboard"

interface CopyClipboardProps {
  text?: string
  showText?: boolean
  className?: string
}

export function CopyClipboard({
  text,
  showText = false,
  className,
}: CopyClipboardProps) {
  const [copied, setCopied] = useState(false)

  const CopyClipboardIcon = Icons["clipboardCopy"]
  const ClipboardCheckIcon = Icons["clipboardCheck"]

  return (
    <>
      {copied ? (
        <div className="flex flex-col items-center justify-center gap-1">
          <ClipboardCheckIcon
            className={cn(
              "h-5 w-5 rounded-sm bg-background-solid text-foreground transition duration-100 hover:bg-background-secondary",
              className
            )}
            strokeWidth={1.25}
          />
          {showText && (
            <span className="text-xs font-normal text-foreground">Copied</span>
          )}
        </div>
      ) : (
        <button
          onClick={() => {
            copyToClipboard(text || "")
            setCopied(true)
            setTimeout(() => {
              setCopied(false)
            }, 2000)
          }}
          className="group flex w-[41px] flex-col items-center justify-center gap-1"
        >
          <CopyClipboardIcon
            className={cn(
              "h-5 w-5 rounded-sm text-foreground group-hover:cursor-pointer",
              className
            )}
            strokeWidth={1.25}
          />
          {showText && (
            <span className="text-xs font-normal text-foreground hover:opacity-80 group-hover:cursor-pointer">
              Copy
            </span>
          )}
        </button>
      )}
    </>
  )
}
