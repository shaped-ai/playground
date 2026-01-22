"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import moment from "moment"
import { useQuery } from "@tanstack/react-query"
import { getOrganizationInfo } from "@/utils/organization-info"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { DEMO_ENGINES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { StatusChip } from "@/components/status-chip"
import { Icons } from "@/components/icons/icons"
import { ModelStatus } from "@/types/enums"

type EngineOption = {
  id: string
  label: string
  createdAt?: string
  status: string
}

interface EngineSelectorProps {
  selectedEngine?: string
  onEngineChange: (engineName: string, metadata?: EngineOption) => void
  className?: string
  disabled?: boolean
  autoSelectFirst?: boolean
  placeholder?: string
  filterByStatus?: string[]
}

export function EngineSelector({
  selectedEngine,
  onEngineChange,
  className,
  disabled = false,
  autoSelectFirst = true,
  placeholder = `Select an engine`,
  filterByStatus,
}: EngineSelectorProps) {
  const [apiKey, setApiKey] = useState("")

  useEffect(() => {
    getOrganizationInfo()
      .then((org) => setApiKey(org.apiKey))
      .catch((error) => {
        console.error("Error while fetching api key", error)
      })
  }, [])

  const fetchEngines = useCallback(async () => {
    return DEMO_ENGINES.map((engine) => ({
      ...engine,
      status: ModelStatus.ACTIVE,
    }))
  }, [])

  const { data: engines = [], isLoading } = useQuery({
    queryKey: ["engines"],
    queryFn: fetchEngines,
    select: (models: any[]) =>
      models.toSorted(
        (a, b) =>
          moment(b.created_at.replace(" UTC", "")).unix() -
          moment(a.created_at.replace(" UTC", "")).unix()
      ),
  })

  const engineOptions: EngineOption[] = useMemo(() => {
    const mapped = engines.map((engine: any) => ({
      id: engine.id,
      label: engine.model_name,
      createdAt: engine.created_at,
      status: engine.status,
    }))

    if (filterByStatus && filterByStatus.length > 0) {
      return mapped.filter((engine) => filterByStatus.includes(engine.status))
    }

    return mapped
  }, [engines, filterByStatus])

  const comboItems: Item[] = useMemo(
    () =>
      engineOptions.map((option) => ({
        label: option.label,
        searchValues: [option.label],
        status: option.status,
        id: option.id,
      })),
    [engineOptions]
  )

  const displayItems: Item[] = useMemo(() => {
    if (!selectedEngine) {
      return comboItems
    }
    // Check if selectedEngine matches either the id or the label
    if (
      comboItems.some(
        (item) => item.id === selectedEngine || item.label === selectedEngine
      )
    ) {
      return comboItems
    }
    return [
      // {
      //   label: selectedEngine,
      //   searchValues: [selectedEngine],
      // },
      ...comboItems,
    ]
  }, [comboItems, selectedEngine])

  // If selectedEngine is undefined, use the 0th index engine and call onEngineChange
  useEffect(() => {
    if (!selectedEngine && engineOptions.length > 0) {
      const firstOption = engineOptions[0]
      onEngineChange(firstOption.id)
      return
    }
  }, [selectedEngine, engineOptions, onEngineChange])

  useEffect(() => {
    if (!autoSelectFirst) return
    // Don't auto-select if selectedEngine is provided and non-empty
    // This prevents overwriting engines restored from URL
    if (selectedEngine && selectedEngine.trim() !== "") return
    if (engineOptions.length === 0) return

    const firstOption = engineOptions[0]
    onEngineChange(firstOption.id, firstOption)
  }, [engineOptions, autoSelectFirst, selectedEngine, onEngineChange])

  const handleEngineSelect = useCallback(
    (engineName: string) => {
      const option = engineOptions.find((engine) => engine.label === engineName)
      if (!engineName) {
        onEngineChange(engineName)
        return
      }
      // Pass the engine id instead of the label
      onEngineChange(option?.id || engineName, option)
    },
    [engineOptions, onEngineChange]
  )

  // Preserve selectedEngine even if engines haven't loaded yet (e.g., when restoring from URL)
  // Convert engine id to label for display (ComboSearchbox matches by label)
  const currentValue = useMemo(() => {
    if (!selectedEngine) {
      return engineOptions[0]?.label || ""
    }
    // Check if selectedEngine is an id or a label
    const matchingItem = comboItems.find(
      (item) => item.id === selectedEngine || item.label === selectedEngine
    )
    return matchingItem?.label || selectedEngine
  }, [selectedEngine, comboItems, engineOptions])

  return (
    <ComboSearchbox
      name="engine"
      items={displayItems.length > 0 ? displayItems : []}
      onItemSelect={handleEngineSelect}
      selectedValue={currentValue}
      disabled={disabled || isLoading}
      canDeselect={false}
      className={className || "w-auto !max-w-none"}
      placeholder={placeholder}
      labelClassName="wrap-break-word min-w-0 flex-1 whitespace-normal"
    />
  )
}

export interface Item {
  searchValues: string[]
  label: string
  status: string
  id?: string
}

interface ComboboxProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  items: Item[]
  onItemSelect: (item: string) => void
  name?: string
  selectedValue: string
  disabled: boolean
  showButton?: boolean
  canDeselect?: boolean
  placeholder?: string
  labelClassName?: string
  popoverClassName?: string
}

export function ComboSearchbox({
  items,
  onItemSelect,
  name = "option",
  className,
  selectedValue = "",
  disabled,
  showButton = false,
  canDeselect = true,
  placeholder = `Select an option`,
  labelClassName,
  popoverClassName,
}: ComboboxProps) {
  const Add = Icons["add"]

  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(selectedValue)
  React.useEffect(() => setValue(selectedValue), [selectedValue])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <div className="flex justify-start">
          {showButton === false ? (
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                "max-w-40 sm:max-w-52 md:max-w-64 h-auto shrink-0 justify-between rounded-lg border border-border bg-background-primary py-1.5 px-2 text-xs font-medium text-foreground transition-colors",
                " hover:bg-background-secondary",
                "focus-visible:ring-ring/40 focus-visible:outline-none focus-visible:ring-2",
                open ? "border-border-inverse" : "",
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                className
              )}
            >
              <span className="w-full truncate">
                {value
                  ? items.find((option) => option.label === value)?.label
                  : placeholder}
              </span>
              <ChevronsUpDown
                className={cn(
                  "ml-1.5 h-4 w-4 shrink-0 text-foreground transition-colors"
                )}
              />
            </Button>
          ) : (
            <Button className="w-32 rounded-2xl py-0 font-normal text-gray-50">
              <div className="flex w-32 flex-row items-center justify-between">
                <Add className="h-4 w-4" />
                <div className="text-xs">Add category</div>
              </div>
            </Button>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className={cn(
          "z-201 dark:bg-background-primary mt-1 max-h-96 min-w-[350px] max-w-[450px] overflow-y-auto rounded-lg border border-border-muted bg-background-primary p-0 text-foreground shadow-lg",
          popoverClassName
        )}
      >
        <Command
          filter={(value: string, search: string) => {
            return value
              .split(" | ")
              .some((e) => e.toLowerCase().includes(search.toLowerCase()))
              ? 1
              : 0
          }}
          className="h-full max-h-full"
        >
          <CommandInput
            placeholder={`Select ${name}...`}
            className="border-border-muted px-2 py-2 text-sm text-foreground"
          />
          <CommandList className="h-full max-h-full">
            <CommandEmpty className="px-2.5 py-2 text-sm text-foreground-muted">
              {placeholder ? placeholder : `No ${name} found...`}
            </CommandEmpty>
            <TooltipProvider delayDuration={100}>
              <CommandGroup>
                {items.map((option) => {
                  const getStatusDotColor = (status: string) => {
                    const upperStatus = status?.toUpperCase() || ""
                    if (upperStatus === "ACTIVE") {
                      return "bg-green-500"
                    }
                    if (upperStatus === "IDLE") {
                      return "bg-gray-500"
                    }
                    if (upperStatus === "ERROR") {
                      return "bg-red-500"
                    }
                    return "bg-yellow-500"
                  }

                  const isSelected = value === option.label

                  return (
                    <CommandItem
                      key={option.label}
                      value={option.searchValues.join(" | ")}
                      onSelect={() => {
                        setValue(
                          option.label === value
                            ? canDeselect
                              ? ""
                              : option.label
                            : option.label
                        )
                        onItemSelect(
                          option.label === value
                            ? canDeselect
                              ? ""
                              : option.label
                            : option.label
                        )
                        setOpen(false)
                      }}
                      className={cn(
                        " text-wrap flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-foreground"
                      )}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "h-2.5 w-2.5 shrink-0 cursor-pointer rounded-full",
                              getStatusDotColor(option.status)
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="m-0 rounded-2xl border-0 p-0">
                          <StatusChip status={option.status} />
                        </TooltipContent>
                      </Tooltip>
                      <span className={cn("flex-1 truncate", labelClassName)}>
                        {option.label}
                      </span>
                      {showButton === false && (
                        <Check
                          className={cn(
                            "h-4 w-4 shrink-0 ml-2",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                      )}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </TooltipProvider>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
