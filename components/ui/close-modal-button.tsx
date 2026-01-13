"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CloseModalButtonProps {
  className?: string
}

export default function CloseModalButton({ className }: CloseModalButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-6 w-6 rounded-md", className)}
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </Button>
  )
}
