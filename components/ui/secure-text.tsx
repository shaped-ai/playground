import { useState } from "react"
import { Icons } from "@/components/icons/icons"
import CopyTextIcon from "./copy-text-icon"
import { cn } from "@/lib/utils"

interface SecureTextProps extends React.HTMLAttributes<HTMLDivElement> {
  secureText: string
}

export function SecureTextComponent({
  secureText,
  className,
}: SecureTextProps) {
  const [visible, setVisible] = useState(false)
  const Eye = Icons["eye"]
  const EyeOff = Icons["eyeOff"]

  return (
    <div className={cn("flex flex-1 items-center justify-between", className)}>
      <span className="flex-1 truncate px-1 text-sm text-foreground">
        {visible
          ? secureText
          : Array(Math.floor(secureText.length * 1.2)).join("*")}
      </span>
      <div className="flex items-center">
        <CopyTextIcon className="size-4" text={secureText} />
        {visible ? (
          <EyeOff
            className="size-4 ml-2 cursor-pointer rounded-sm text-foreground"
            onClick={() => setVisible(false)}
          />
        ) : (
          <Eye
            className="size-4 ml-2 cursor-pointer rounded-sm text-foreground"
            onClick={() => setVisible(true)}
          />
        )}
      </div>
    </div>
  )
}
