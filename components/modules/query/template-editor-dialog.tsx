"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Star,
  RotateCcw,
  CircleX,
  LucideProps,
  MoveDown,
  MoveUp,
  GalleryVerticalEnd,
} from "lucide-react"
import type {
  TemplateField,
  CardTemplate,
  FieldType,
} from "@/lib/types/template.types"
import type { QueryResultRow, ResultViewMode } from "@/lib/types/query.types"
import {
  saveTemplate,
  getTemplate,
  deleteTemplate,
} from "@/lib/utils/template-storage"
import { cn } from "@/lib/utils"
import Image from "next/image"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import CloseModalButton from "@/components/ui/close-modal-button"

interface TemplateEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  previewMode:
    | "feed"
    | "carousel"
    | "grid"
    | "editorial"
    | "ticker"
    | "list"
    | "masonry"
  engineName: string
  sampleData: QueryResultRow | null
  onTemplateChange: (template: CardTemplate | null) => void
  previewViewModes: {
    value: ResultViewMode
    label: string
    icon: React.ComponentType<LucideProps>
  }[]
  viewMode: ResultViewMode
  handleViewModeChange: (mode: ResultViewMode) => void
}

export function TemplateEditorDialog({
  open,
  onOpenChange,
  previewMode,
  engineName,
  sampleData,
  onTemplateChange,
  previewViewModes,
  viewMode,
  handleViewModeChange,
}: TemplateEditorDialogProps) {
  const [fields, setFields] = useState<TemplateField[]>([])
  const [availableKeys, setAvailableKeys] = useState<string[]>([])

  useEffect(() => {
    if (sampleData) {
      const keys = Object.keys(sampleData)
      setAvailableKeys(keys)
    }
  }, [sampleData])

  useEffect(() => {
    if (open) {
      // Load existing template or create default
      const savedTemplate = getTemplate(engineName, previewMode)
      if (savedTemplate) {
        setFields(savedTemplate.fields)
      } else {
        // Create default fields based on sample data
        if (sampleData) {
          const defaultFields = createDefaultFields(sampleData)
          setFields(defaultFields)
        }
      }
    }
  }, [open, engineName, previewMode, sampleData])

  const createDefaultFields = (data: QueryResultRow): TemplateField[] => {
    const keys = Object.keys(data)
    const defaultFields: TemplateField[] = []

    // Try to find common field names
    const imageKey = keys.find(
      (k) =>
        k.includes("image") || k.includes("poster") || k.includes("thumbnail")
    )
    const titleKey = keys.find((k) => k.includes("title") || k.includes("name"))
    const descKey = keys.find(
      (k) =>
        k.includes("desc") || k.includes("overview") || k.includes("summary")
    )

    if (imageKey) {
      defaultFields.push({
        id: crypto.randomUUID(),
        type: "image",
        label: "Image",
        dataKey: imageKey,
        size: "medium",
        width: "full",
        position: 0,
        visible: true,
      })
    }

    if (titleKey) {
      defaultFields.push({
        id: crypto.randomUUID(),
        type: "text",
        label: "Title",
        dataKey: titleKey,
        size: "medium",
        width: "full",
        position: 1,
        visible: true,
      })
    }

    if (descKey) {
      defaultFields.push({
        id: crypto.randomUUID(),
        type: "text",
        label: "Description",
        dataKey: descKey,
        size: "small",
        width: "full",
        position: 2,
        visible: true,
      })
    }

    const template: CardTemplate = {
      id: crypto.randomUUID(),
      name: `${previewMode} Template`,
      previewMode,
      fields: defaultFields,
    }

    saveTemplate(engineName, previewMode, template)
    onTemplateChange(template)
    return defaultFields
  }

  const addField = () => {
    const newField: TemplateField = {
      id: crypto.randomUUID(),
      type: "text",
      label: "New Field",
      dataKey: availableKeys[0] || "",
      size: "medium",
      width: "full",
      position: fields.length,
      visible: true,
    }
    setFields([...fields, newField])
  }

  const updateField = (id: string, updates: Partial<TemplateField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id))
  }

  const moveField = (id: string, direction: "up" | "down") => {
    const index = fields.findIndex((f) => f.id === id)
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === fields.length - 1)
    ) {
      return
    }

    const newFields = [...fields]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    ;[newFields[index], newFields[targetIndex]] = [
      newFields[targetIndex],
      newFields[index],
    ]

    // Update positions
    newFields.forEach((f, i) => {
      f.position = i
    })

    setFields(newFields)
  }

  const handleSave = () => {
    const template: CardTemplate = {
      id: crypto.randomUUID(),
      name: `${previewMode} Template`,
      previewMode,
      fields,
    }

    saveTemplate(engineName, previewMode, template)
    onTemplateChange(template)
    onOpenChange(false)
  }

  const handleReset = () => {
    if (sampleData) {
      const defaultFields = createDefaultFields(sampleData)
      setFields(defaultFields)
    }
  }

  const handleRevertToOriginal = () => {
    deleteTemplate(engineName, previewMode)
    onTemplateChange(null)
    onOpenChange(false)
  }

  const handleApplyForAll = () => {
    // Create template from current fields
    const template: CardTemplate = {
      id: crypto.randomUUID(),
      name: `${previewMode} Template`,
      previewMode,
      fields,
    }

    const allPreviewModes: Array<
      "feed" | "carousel" | "grid" | "ticker" | "list" | "masonry"
    > = ["feed", "carousel", "grid", "ticker", "list", "masonry"]

    allPreviewModes.forEach((mode) => {
      const templateForMode: CardTemplate = {
        ...template,
        id: crypto.randomUUID(),
        name: `${mode} Template`,
        previewMode: mode,
      }
      saveTemplate(engineName, mode, templateForMode)
    })

    onTemplateChange(template)
    onOpenChange(false)
  }

  const renderFieldPreview = (field: TemplateField) => {
    if (!field.visible || !sampleData) return null

    const value = sampleData[field.dataKey]
    if (!value) return null

    const sizeClasses = {
      small: "text-sm",
      medium: "text-base",
      large: "text-lg",
      full: "text-xl",
    }

    const widthClasses = {
      small: "w-32",
      medium: "w-48",
      large: "w-64",
      full: "w-full",
    }

    const heightClasses = {
      small: "h-32",
      medium: "h-48",
      large: "h-64",
      full: "h-96",
    }

    switch (field.type) {
      case "image":
        return (
          <div
            className={cn(
              "relative overflow-hidden rounded-lg",
              widthClasses[field.size],
              heightClasses[field.size]
            )}
          >
            <Image
              src={value.toString() || "/placeholder.svg"}
              alt={field.label || "Image"}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )

      case "video":
        return (
          <div
            className={cn(
              "relative overflow-hidden rounded-lg",
              widthClasses[field.size],
              heightClasses[field.size]
            )}
          >
            <video
              src={value.toString()}
              controls
              className="h-full w-full object-cover"
            />
          </div>
        )

      case "text":
        return (
          <div
            className={cn(
              "line-clamp-3 text-sm font-medium text-foreground",
              sizeClasses[field.size]
            )}
          >
            <span className="font-medium">
              {field.label ? `${field.label}: ` : ""}
            </span>
            {value.toString()}
          </div>
        )

      case "rating":
        return (
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-foreground">
              {field.label ? `${field.label}: ` : ""}
            </span>
            <div className="flex items-center"></div>
            <span className="ml-1 text-sm font-medium text-foreground">
              {value}
            </span>
          </div>
        )

      case "date":
        return (
          <div
            className={cn(
              "text-sm font-medium text-foreground",
              sizeClasses[field.size]
            )}
          >
            {new Date(value.toString()).toLocaleDateString()}
          </div>
        )

      case "badge":
        return (
          <div className="flex flex-wrap gap-1">
            {value
              .toString()
              .split(",")
              .map((item, i) => (
                <Badge key={i} variant="secondary">
                  {item.trim()}
                </Badge>
              ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className="dark:bg-background-base flex max-h-[90vh] max-w-[70vw] flex-col gap-0 space-y-0 overflow-auto rounded-lg border border-border bg-background-base p-0"
      >
        <DialogHeader className="border-b border-border bg-background-base p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogClose asChild>
                <CloseModalButton />
              </DialogClose>
              <DialogTitle className="text-lg font-bold text-foreground">
                Edit Template
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplyForAll}
                className="shadow-xs h-auto cursor-pointer rounded-md border border-border bg-background-primary px-2 py-1.5 text-xs font-medium text-foreground  hover:bg-background-secondary"
              >
                <GalleryVerticalEnd className="mr-2 h-4 w-4" />
                Apply For All Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                className="shadow-xs h-auto cursor-pointer rounded-md border border-border bg-background-primary px-2 py-1.5 text-xs font-medium text-foreground"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 bg-background-solid"
        >
          <ResizablePanel
            defaultSize={60}
            minSize={40}
            maxSize={75}
            className="bg-background-solid p-4"
          >
            <div className="h-full space-y-4 overflow-y-auto bg-background-solid">
              {fields.length === 0 ? (
                <div className="py-8 text-center text-foreground-muted">
                  <p>
                    No fields added yet. Click "Add Field" to start building
                    your template.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 bg-background-solid">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-foreground">
                      Fields
                    </h2>
                    <Button
                      onClick={addField}
                      variant="outline"
                      className="shadow-xs h-auto w-fit cursor-pointer gap-1 rounded-md border border-border bg-background-solid px-2 py-1.5 text-xs font-medium text-foreground hover:border-border-active hover:bg-background-secondary"
                    >
                      <Plus className="size-5 text-accent-brand-purple" />
                      Add
                    </Button>
                  </div>
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className={cn(
                        " overflow-hidden rounded-lg border border-border-muted",
                        !field.visible && "opacity-50"
                      )}
                    >
                      <div className="flex items-center justify-between border-b border-border bg-background-base px-4 py-3">
                        {/* <Input
                          value={field.label}
                          onChange={(e) =>
                            updateField(field.id, { label: e.target.value })
                          }
                          className="h-9 w-40"
                          placeholder="Field label"
                        /> */}
                        {field.type === "text" ? (
                          <Select
                            value={field.type}
                            onValueChange={(value: FieldType) =>
                              updateField(field.id, { type: value })
                            }
                          >
                            <SelectTrigger
                              chevronsDouble
                              className="shadow-xs h-auto w-fit gap-2 border border-border bg-background-solid px-2 py-1.5 text-xs font-medium text-foreground"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-500 max-h-40 overflow-y-auto">
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="rating">Rating</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="badge">Badge</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : field.type === "image" || field.type === "video" ? (
                          <Select
                            value={field.type}
                            onValueChange={(value: FieldType) =>
                              updateField(field.id, { type: value })
                            }
                          >
                            <SelectTrigger
                              chevronsDouble
                              className="shadow-xs h-auto w-fit gap-2 border border-border bg-background-solid px-2 py-1.5 text-xs font-medium text-foreground"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-500">
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="rating">Rating</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="badge">Badge</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Select
                            value={field.type}
                            onValueChange={(value: FieldType) =>
                              updateField(field.id, { type: value })
                            }
                          >
                            <SelectTrigger
                              chevronsDouble
                              className="shadow-xs h-auto w-fit gap-2 border border-border bg-background-solid px-2 py-1.5 text-xs font-medium text-foreground"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-500">
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="rating">Rating</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="badge">Badge</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                        <div className="shadow-xs flex items-center rounded-md border border-border bg-background-primary">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-auto w-8 rounded-none border-r border-border p-1.5 py-1.5 text-foreground"
                            onClick={() => moveField(field.id, "up")}
                            disabled={index === 0}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-auto w-8 rounded-none border-r border-border p-1.5 py-1.5 text-foreground"
                            onClick={() => moveField(field.id, "down")}
                            disabled={index === fields.length - 1}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-auto w-8 rounded-none p-1.5 py-1.5 text-foreground"
                            onClick={() => removeField(field.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-auto w-8 rounded-none border-l border-border p-1.5 py-1.5 text-foreground"
                            onClick={() =>
                              updateField(field.id, { visible: !field.visible })
                            }
                          >
                            {field.visible ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {field.type === "text" ? (
                        <div className="grid grid-cols-2 bg-background-solid p-4">
                          <Label className="text-sm font-bold text-foreground">
                            Label (Optional)
                          </Label>
                          <Label className="text-sm font-bold text-foreground">
                            Data key
                          </Label>
                          <div className="col-span-2 mt-2 grid grid-cols-2 overflow-hidden rounded-md border border-border-inverse">
                            <div className="relative">
                              <Input
                                value={field.label}
                                onChange={(e) =>
                                  updateField(field.id, {
                                    label: e.target.value,
                                  })
                                }
                                className="h-9 w-full rounded-none border-0 border-r border-border-inverse bg-background-solid px-3 py-2 hover:bg-background-secondary focus:ring-0 focus:ring-offset-0"
                                placeholder="Optional Label"
                              />
                              {field.label && (
                                <CircleX
                                  onClick={() =>
                                    updateField(field.id, { label: "" })
                                  }
                                  className="size-4 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-foreground-muted hover:text-foreground"
                                />
                              )}
                            </div>

                            <Select
                              value={field.dataKey}
                              onValueChange={(value) =>
                                updateField(field.id, { dataKey: value })
                              }
                            >
                              <SelectTrigger
                                chevronsDouble
                                className="h-9 rounded-none border-0 bg-background-solid px-3 py-2 text-foreground focus:ring-0 focus:ring-offset-0"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-500 max-h-40 overflow-y-auto">
                                {availableKeys.map((key) => (
                                  <SelectItem key={key} value={key}>
                                    {key}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ) : field.type === "image" || field.type === "video" ? (
                        <>
                          <div className="grid grid-cols-2 bg-background-solid p-4">
                            <Label className="text-sm font-bold text-foreground">
                              Data key
                            </Label>
                            <Label className="text-sm font-bold text-foreground">
                              Size
                            </Label>
                            <div className="col-span-2 mt-2 grid grid-cols-2 overflow-hidden rounded-md border border-border-inverse">
                              <Select
                                value={field.dataKey}
                                onValueChange={(value) =>
                                  updateField(field.id, { dataKey: value })
                                }
                              >
                                <SelectTrigger
                                  chevronsDouble
                                  className="h-9 rounded-none border-0 border-r border-border-inverse bg-background-solid px-3 py-2 text-foreground focus:ring-0 focus:ring-offset-0"
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-500 max-h-40 overflow-y-auto">
                                  {availableKeys.map((key) => (
                                    <SelectItem key={key} value={key}>
                                      {key}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select
                                value={field.size}
                                onValueChange={(value: TemplateField["size"]) =>
                                  updateField(field.id, { size: value })
                                }
                              >
                                <SelectTrigger
                                  chevronsDouble
                                  className="h-9 rounded-none border-0 bg-background-solid px-3 py-2 text-foreground focus:ring-0 focus:ring-offset-0"
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-500">
                                  <SelectItem value="small">Small</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="large">Large</SelectItem>
                                  <SelectItem value="full">Full</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="grid grid-cols-2 bg-background-solid p-4">
                          <Label className="text-sm font-bold text-foreground">
                            Label (Optional)
                          </Label>
                          <Label className="text-sm font-bold text-foreground">
                            Data key
                          </Label>
                          <div className="col-span-2 mt-2 grid grid-cols-2 overflow-hidden rounded-md border border-border-inverse">
                            <div className="relative">
                              <Input
                                value={field.label}
                                onChange={(e) =>
                                  updateField(field.id, {
                                    label: e.target.value,
                                  })
                                }
                                className="h-9 w-full rounded-none border-0 border-r border-border-inverse bg-background-solid px-3 py-2 hover:bg-background-secondary focus:ring-0 focus:ring-offset-0"
                                placeholder="Optional Label"
                              />
                              {field.label && (
                                <CircleX
                                  onClick={() =>
                                    updateField(field.id, { label: "" })
                                  }
                                  className="size-4 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-foreground-muted hover:text-foreground"
                                />
                              )}
                            </div>
                            <Select
                              value={field.dataKey}
                              onValueChange={(value) =>
                                updateField(field.id, { dataKey: value })
                              }
                            >
                              <SelectTrigger className="h-9 rounded-none border-0 bg-background-solid px-3 py-2 text-foreground focus:ring-0 focus:ring-offset-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="z-500 max-h-40 overflow-y-auto">
                                {availableKeys.map((key) => (
                                  <SelectItem key={key} value={key}>
                                    {key}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-center">
                <Button
                  onClick={addField}
                  variant="outline"
                  className="shadow-xs h-auto w-fit cursor-pointer rounded-md border border-border bg-background-primary p-1.5 text-xs hover:border-border-active hover:bg-background-secondary"
                >
                  <Plus className="size-5 text-accent-brand-purple" />
                </Button>
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle className="mr-1" />

          <ResizablePanel
            defaultSize={40}
            minSize={25}
            maxSize={60}
            className="mr-2 bg-background-solid"
          >
            <div className="flex h-full flex-col overflow-y-auto">
              <div className="space-y-2 px-4 pb-4">
                <div className="sticky top-0 z-10 mb-0 flex items-center gap-2 rounded bg-background-solid p-4">
                  <h3 className="text-sm font-bold text-foreground">
                    Preview:
                  </h3>
                  <div className="flex items-center justify-center">
                    <Select
                      value={viewMode}
                      onValueChange={(value: ResultViewMode) =>
                        handleViewModeChange(value)
                      }
                    >
                      <SelectTrigger
                        chevronsDouble
                        className="shadow-xs h-auto w-fit gap-1 rounded-md border border-border bg-background-primary px-2 py-1.5 text-xs font-medium"
                      >
                        {(() => {
                          const currentMode = previewViewModes.find(
                            (mode) => mode.value === viewMode
                          )
                          const Icon = currentMode?.icon
                          return (
                            <>
                              {Icon && <Icon className="size-4 shrink-0" />}
                              <SelectValue className="text-nowrap text-xs font-medium">
                                {currentMode?.label || "Select view"}
                              </SelectValue>
                            </>
                          )
                        })()}
                      </SelectTrigger>
                      <SelectContent className="z-500 whitespace-nowrap">
                        {previewViewModes.map((mode) => {
                          const Icon = mode.icon
                          return (
                            <SelectItem
                              key={mode.value}
                              value={mode.value}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-row items-center gap-2">
                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                <span className="text-nowrap">
                                  {mode.label}
                                </span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {sampleData ? (
                  <Card className="overflow-hidden bg-background-primary">
                    <CardContent className="space-y-2 p-4">
                      {fields
                        .filter((f) => f.visible)
                        .sort((a, b) => a.position - b.position)
                        .map((field) => (
                          <div key={field.id} className="text-foreground">
                            {renderFieldPreview(field)}
                          </div>
                        ))}
                      {fields.filter((f) => f.visible).length === 0 && (
                        <div className="py-8 text-center text-sm text-foreground-muted">
                          No visible fields. Add fields to see preview.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="rounded-lg border border-border-muted py-8 text-center text-sm text-foreground-muted">
                    No sample data available
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        {/* <div className="flex justify-end gap-2 border-t border-border-muted pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Template</Button>
        </div> */}
      </DialogContent>
    </Dialog>
  )
}
