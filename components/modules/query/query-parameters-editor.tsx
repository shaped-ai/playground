"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import type { QueryParameter, ParameterValue } from "@/lib/types/query.types"
import { cn } from "@/lib/utils"
import { ModelStatus } from "@/types/enums"
import { ModelDetails } from "@/types"
import { useIsMobile } from "@/hooks/shared/use-media-query"

interface QueryParametersEditorProps {
  parameters: QueryParameter[]
  values: ParameterValue
  onChange: (values: ParameterValue) => void
  onRun?: () => void
  isExecuting?: boolean
  engineDetails?: ModelDetails
}

export function QueryParametersEditor({
  parameters,
  values,
  onChange,
  onRun,
  isExecuting,
  engineDetails,
}: QueryParametersEditorProps) {
  const isMobile = useIsMobile()
  const handleChange = (name: string, value: any) => {
    onChange({ ...values, [name]: value })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onRun && !isExecuting) {
      e.preventDefault()
      onRun()
    }
  }

  if (parameters.length === 0) return null

  return (
    <Card
      className={cn(
        "mt-2 rounded-sm gap-0 mb-0 px-0 pb-0 h-full flex flex-col",
        isMobile ? "pt-3" : "pt-4"
      )}
      style={{
        marginBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: 0,
      }}
    >
      <div
        className={cn(
          "space-y-3 flex-1",
          isMobile && "space-y-2",
          isMobile ? "px-3 pb-3" : "px-4 pb-4"
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className={cn("font-semibold", isMobile ? "text-xs" : "text-sm")}>
            Query Parameters
          </h3>
        </div>
        <div className={cn("grid grid-cols-2 gap-2", !isMobile && "gap-4")}>
          {parameters.map((param) => (
            <div
              key={param.name}
              className={cn("space-y-1.5", isMobile && "space-y-1")}
            >
              <Label htmlFor={param.name} className="text-xs font-medium">
                {param.name}
                {param.required && (
                  <span className="ml-1 text-destructive">*</span>
                )}
              </Label>
              <Input
                id={param.name}
                type={param.type === "number" ? "number" : "text"}
                value={
                  values[param.name] ?? param.value ?? param.defaultValue ?? ""
                }
                onChange={(e) => {
                  const val =
                    param.type === "number"
                      ? Number(e.target.value)
                      : e.target.value
                  handleChange(param.name, val)
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  (param.value ?? param.defaultValue)?.toString() ||
                  `Enter ${param.name}`
                }
                className={cn(
                  "focus:ring-0 focus:ring-offset-0",
                  isMobile ? "h-7" : "h-8"
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
