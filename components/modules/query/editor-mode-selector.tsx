"use client"

import { EditorMode } from "@/lib/types/query.types"
import { FileCode, Database, FileText } from "lucide-react"

interface EditorModeSelectorProps {
  mode: EditorMode
  onChange: (mode: EditorMode) => void
}

export function EditorModeSelector({
  mode,
  onChange,
}: EditorModeSelectorProps) {
  const modes = [
    { value: EditorMode.PLAIN, label: "Plain", icon: FileText },
    { value: EditorMode.YAML, label: "YAML", icon: FileCode },
    { value: EditorMode.SQL, label: "SQL", icon: Database },
  ]

  return (
    <div className="bg-muted/30 flex items-center gap-1 border-b px-3 py-2">
      <span className="mr-2 text-sm text-muted-foreground">Editor Mode:</span>
      <div className="bg-background flex items-center gap-1 rounded-md border p-1">
        {modes.map((item) => {
          const Icon = item.icon
          const isActive = mode === item.value

          return (
            <button
              key={item.value}
              onClick={() => onChange(item.value)}
              className={`
                flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-all
                ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
