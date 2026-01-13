import { cn } from "@/lib/utils"
import Image, { type ImageProps } from "next/image"

interface ShapedLogoProps extends Omit<ImageProps, "src" | "alt"> {}

export default function ShapedLogo({ className, ...props }: ShapedLogoProps) {
  return (
    <Image
      src="/shaped-logo.svg"
      alt="Shaped logo mark"
      width={40}
      height={40}
      className={cn(
        "dark:brightness-[3] dark:invert h-10 w-10 transition-[filter] duration-300",
        className
      )}
      priority
      {...props}
    />
  )
}
