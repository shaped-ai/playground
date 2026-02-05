"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const REGISTRATION_URL =
  "https://console.shaped.ai/register?utm_source=playground&utm_medium=product&utm_campaign=shapedql&utm_content=register_cta"

interface RegistrationPromptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RegistrationPromptModal({
  open,
  onOpenChange,
}: RegistrationPromptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] gap-4">
        <DialogHeader>
          <DialogTitle className="text-left text-xl font-bold">
            Try Shaped with your own data
          </DialogTitle>
          <div className="text-muted-foreground text-left text-sm">
            <span className="block mb-2">Sign up to:</span>
            <ul className="list-disc list-inside space-y-1">
              <li>Embed with any Hugging Face model</li>
              <li>Query vectors using SQL</li>
              <li>Connect your own data sources</li>
            </ul>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row justify-end">
            <Button variant="outline" asChild>
              <a
                href={REGISTRATION_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Sign Up
              </a>
            </Button>
          </div>
          <span className="text-xs text-muted-foreground text-right">
            $100 free credits, every month
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
