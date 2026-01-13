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
  const handleChange = (name: string, value: any) => {
    onChange({ ...values, [name]: value })
  }

  if (parameters.length === 0) return null

  return (
    <Card className="mt-2 p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Query Parameters</h3>
          {onRun && (
            <div className="flex justify-end pt-2">
              <Button
                onClick={onRun}
                disabled={
                  isExecuting ||
                  (engineDetails?.status != ModelStatus.ACTIVE &&
                    engineDetails?.status != ModelStatus.IDLE)
                }
                className={cn(
                  "ml-auto flex h-auto shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-border-active bg-background-accent px-2 py-1.5 text-xs font-medium text-accent-brand-off-white hover:border-border-active hover:bg-accent-active",
                  engineDetails?.status != ModelStatus.ACTIVE &&
                    engineDetails?.status != ModelStatus.IDLE &&
                    "border-[rgba(0,0,0,0.15)] bg-accent-brand-off-white text-accent-brand-light-gray hover:bg-accent-brand-off-white"
                )}
                variant="default"
              >
                <Play className="mr-2 h-4 w-4" />
                Run
              </Button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {parameters.map((param) => (
            <div key={param.name} className="space-y-1.5">
              <Label htmlFor={param.name} className="text-xs font-medium">
                {param.name}
                {param.required && (
                  <span className="ml-1 text-destructive">*</span>
                )}
              </Label>
              <Input
                id={param.name}
                type={param.type === "number" ? "number" : "text"}
                value={values[param.name] ?? param.defaultValue ?? ""}
                onChange={(e) => {
                  const val =
                    param.type === "number"
                      ? Number(e.target.value)
                      : e.target.value
                  handleChange(param.name, val)
                }}
                placeholder={
                  param.defaultValue?.toString() || `Enter ${param.name}`
                }
                className="h-8 focus:ring-0 focus:ring-offset-0"
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
