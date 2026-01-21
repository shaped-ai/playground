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
    <Card className="mt-2 p-4 rounded-none">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Query Parameters</h3>

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
                value={values[param.name] ?? param.value ?? param.defaultValue ?? ""}
                onChange={(e) => {
                  const val =
                    param.type === "number"
                      ? Number(e.target.value)
                      : e.target.value
                  handleChange(param.name, val)
                }}
                placeholder={
                  (param.value ?? param.defaultValue)?.toString() || `Enter ${param.name}`
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
