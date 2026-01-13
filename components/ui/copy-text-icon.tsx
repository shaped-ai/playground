import { useState } from "react"
import { Icons } from "@/components/icons/icons"
import copyToClipboard from "@/utils/copy-to-clipboard"
import { cn } from "@/lib/utils"

interface CopyTextIconProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string
  checkIconClassName?: string
}

export default function CopyTextIcon({
  text,
  className,
  checkIconClassName,
}: CopyTextIconProps) {
  const [copied, setCopied] = useState(false)
  const CopyClipboardIcon = Icons["copy"]
  const ClipboardCheckIcon = Icons["check"]

  return (
    <>
      {copied ? (
        <ClipboardCheckIcon
          className={cn(
            "ml-8 h-5 w-5 rounded-sm text-green-500 transition duration-100",
            checkIconClassName
          )}
        />
      ) : (
        <CopyClipboardIcon
          className={cn("ml-0 h-5 w-5 rounded-sm text-foreground", className)}
          onClick={() => {
            copyToClipboard(text)
            setCopied(true)
            setTimeout(() => {
              setCopied(false)
            }, 2000)
          }}
        />
      )}
    </>
  )
}
