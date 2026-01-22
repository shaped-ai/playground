"use client"

import React from "react"
import {
  Select,
  SelectIcon,
  SelectPortal,
  SelectTrigger,
  SelectValue,
} from "@radix-ui/react-select"
import { SelectContent, SelectItem } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { EntityType, FeatureType, QueryTab } from "@/types/enums"
import Pill from "@/components/ui/pill"
import {
  ChevronDown,
  ChevronsRight,
  Info,
  MousePointer,
  PackageSearch,
  Puzzle,
  UserRound,
  UsersRound,
} from "lucide-react"

export interface BasicSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  items: string[]
  onValueChange: (value: string) => void
  showIcon?: boolean
  iconName?: string
  iconClassName?: string
  icon?: React.ReactNode
}

const BasicSelector = ({
  value,
  items,
  onValueChange,
  className,
  showIcon = true,
  iconClassName,
  icon,
}: BasicSelectorProps) => {
  return (
    <Select onValueChange={onValueChange} value={value}>
      <SelectTrigger
        className={cn(
          "select--trigger flex items-center justify-between gap-x-2 px-4 py-1 outline-none shadow-none",
          className
        )}
      >
        <SelectValue>
          <div className="flex max-w-[10vw] items-center gap-1">
            <span className="truncate">{value}</span>
          </div>
        </SelectValue>
        {showIcon && icon && <SelectIcon>{icon}</SelectIcon>}
      </SelectTrigger>
      <SelectPortal>
        <SelectContent
          className="z-10000 rounded-md border border-border bg-background-primary text-foreground"
          position="popper"
        >
          {items.map((item) => (
            <SelectItem
              key={item}
              value={item}
              className="cursor-pointer text-foreground"
            >
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectPortal>
    </Select>
  )
}

export interface SelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  placeholder: string
  items: string[]
  onValueChange: (value: string) => void
  currentQueryTab?: QueryTab
  showIcon?: boolean
}

const Selector = ({
  placeholder,
  items,
  onValueChange,
  className,
  currentQueryTab,
  showIcon = false,
}: SelectorProps) => {
  return (
    <Select onValueChange={onValueChange} value={placeholder}>
      <SelectTrigger
        className={cn(
          "select--trigger flex items-center justify-between gap-x-2 border border-border bg-background-primary px-4 py-1 outline-none shadow-none hover:bg-background-secondary",
          className
        )}
      >
        <SelectValue>
          <div className="flex items-center gap-1">
            {showIcon && (
              <>
                {currentQueryTab == QueryTab.USER ? (
                  <UsersRound
                    className="size-5 text-[#8559E0]"
                    strokeWidth={1.25}
                  />
                ) : (
                  <PackageSearch
                    className="size-5 text-[#8559E0]"
                    strokeWidth={1.25}
                  />
                )}
              </>
            )}
            <span className="truncate">{placeholder}</span>
          </div>
        </SelectValue>
        <SelectIcon>
          <ChevronDown className="size-4 rounded-md font-bold text-foreground" />
        </SelectIcon>
      </SelectTrigger>
      <SelectPortal>
        <SelectContent className="z-10000 max-h-52 overflow-auto border-border bg-background-primary text-foreground">
          {items.map((item) => (
            <SelectItem
              className="cursor-pointer border-background-primary text-foreground focus:bg-background-secondary"
              key={item}
              value={item}
            >
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectPortal>
    </Select>
  )
}

export interface EntityFeatureSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedItem: {
    featureName: string
    featureType: string
    entityType: EntityType
    isDerivedFeature: boolean
  }
  items: Record<string, any>
  onValueChange: (value: Record<string, any>) => void
}
function EntityFeatureSelector({
  selectedItem,
  items,
  onValueChange,
  className,
}: EntityFeatureSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const selectorRef = React.useRef<HTMLDivElement>(null)
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const getEntityIcon = (entityType: EntityType) => {
    switch (entityType.toLowerCase()) {
      case "user":
        return (
          <UserRound
            className="size-4 mr-2 text-foreground"
            strokeWidth={1.5}
          />
        )
      case "item":
        return (
          <Puzzle className="size-4 mr-2 text-foreground" strokeWidth={1.5} />
        )
      case "interaction":
        return (
          <MousePointer
            className="size-4 mr-2 text-foreground"
            strokeWidth={1.5}
          />
        )
      default:
        return null
    }
  }

  const getEntityFeaturesList = (entityType: EntityType) => {
    const features = items[entityType].filter(
      (item: any) =>
        !item.name.startsWith("_derived_") &&
        (entityType === EntityType.INTERACTION
          ? item.name == "created_at"
          : true) &&
        ![
          FeatureType.TEXT,
          FeatureType.TEXT_SEQUENCE,
          FeatureType.TEXT_SET,
          FeatureType.IMAGE,
          FeatureType.URL,
          FeatureType.VECTOR,
        ].includes(item.type) &&
        !item.name.includes("https")
    )

    return features
  }

  const getEntityDerivedFeaturesList = (entityType: EntityType) => {
    const derivedFeatures = [] as any

    if (
      entityType == EntityType.ITEM.toLowerCase() ||
      entityType == EntityType.USER.toLowerCase()
    ) {
      if (
        items[entityType].find((feature: any) => feature.name == "created_at")
      )
        derivedFeatures.push({
          name: "days_since_created",
          type: FeatureType.CATEGORY,
        })

      derivedFeatures.push({
        name: "interaction_frequency",
        type: FeatureType.CATEGORY,
      })
    }

    return derivedFeatures
  }

  return (
    <div className="relative w-full" ref={selectorRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "bg-base flex w-full items-center justify-between rounded-md border border-border px-4 py-2 text-left text-sm",
          className
        )}
      >
        <Pill
          title={`${selectedItem.entityType.toLowerCase()}: ${
            selectedItem.featureName
          }`}
          showCloseIcon={false}
        />
        <ChevronDown className="size-4 " />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-fit overflow-auto rounded-lg border border-border bg-background-base p-2 shadow-md"
          style={{
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
        >
          {(Object.keys(items) as EntityType[]).map((entityType) => (
            <div key={entityType} className="w-full">
              <div className="flex items-center p-2 gap-1 font-semibold text-sm text-foreground">
                {getEntityIcon(entityType)}
                <span className="text-foreground">
                  {entityType.charAt(0).toUpperCase() + entityType.slice(1)}{" "}
                  attributes
                </span>
              </div>
              <div className="h-0 border-b border-border" />

              {getEntityFeaturesList(entityType).map((item: any) => (
                <div
                  key={item.name}
                  onClick={() => {
                    onValueChange({
                      featureName: item.name,
                      featureType: item.type,
                      entityType: entityType,
                      isDerivedFeature: false,
                    })
                    setIsOpen(false)
                  }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded p-2 text-sm hover:bg-background-secondary"
                  )}
                >
                  <span className="truncate font-sans font-normal text-foreground">
                    {item.name}
                  </span>
                  <span className="font-sfmono text-xs font-medium text-foreground-muted">
                    {item.type}
                  </span>
                </div>
              ))}

              {getEntityDerivedFeaturesList(entityType).length > 0 && (
                <div>
                  <div className="flex select-none items-center gap-0.5 pt-1 px-2 text-xs font-medium text-foreground-muted">
                    <ChevronsRight className="h-4 w-4" strokeWidth={2} />
                    derived
                  </div>

                  <div className="py-1 px-2">
                    {getEntityDerivedFeaturesList(entityType).map(
                      (item: any) => (
                        <div
                          key={item.name}
                          onClick={() => {
                            onValueChange({
                              featureName: item.name,
                              featureType: item.type,
                              entityType,
                              isDerivedFeature: true,
                            })
                            setIsOpen(false)
                          }}
                          className={cn(
                            "flex cursor-pointer items-center justify-between rounded px-2 py-1 text-sm gap-4",
                            "hover:bg-background-secondary"
                          )}
                        >
                          <div className="flex items-center gap-0.5">
                            <ChevronsRight
                              className="h-3 w-3 text-foreground-muted"
                              strokeWidth={2}
                            />
                            <span className="truncate font-sans text-foreground">
                              {item.name}
                            </span>
                          </div>

                          <span className="font-sfmono text-xs font-medium text-foreground-muted">
                            {item.type}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export interface SelectorLabeledProps extends SelectorProps {
  label?: string
  tooltipText?: string
}
const SelectorLabeled = ({
  label,
  tooltipText,
  ...props
}: SelectorLabeledProps) => {
  return (
    <div className="flex flex-row items-center space-x-4">
      {label && <div className="font-bold">{label}</div>}
      {tooltipText && (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hover:cursor-pointer">
                <Info className="Size-4 text-gray-400 " />
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      <Selector {...props} />
    </div>
  )
}

export interface DistributedSelectorProps extends React.HTMLAttributes<HTMLDivElement> {
  placeholder: string
  onValueChange: (value: string) => void
  features: any
}

const DistributedSelector = ({
  placeholder,
  onValueChange,
  className,
  features,
}: DistributedSelectorProps) => {
  return (
    <Select onValueChange={onValueChange} value={placeholder}>
      <SelectTrigger
        className={cn(
          "select--trigger flex items-center justify-between gap-x-2 px-1 outline-none drop-shadow-none",
          className
        )}
      >
        <SelectValue>{placeholder}</SelectValue>
        <SelectIcon>
          <ChevronDown className="h-4 w-4 rounded-md font-bold text-slate-400" />
        </SelectIcon>
      </SelectTrigger>
      <SelectPortal>
        <SelectContent>
          <div className="p-2">
            {features?.map((item: string, index: number) => {
              return (
                <div>
                  <p className="mb-1 pl-8 text-sm font-bold">Item features</p>
                  <SelectItem key={index} value={item} className="py-0.5">
                    {item}
                  </SelectItem>
                </div>
              )
            })}
          </div>
        </SelectContent>
      </SelectPortal>
    </Select>
  )
}

const IdSelector = ({
  placeholder,
  items,
  onValueChange,
  className,
}: SelectorProps) => {
  return (
    <Select onValueChange={onValueChange} value={placeholder}>
      <SelectTrigger
        className={cn(
          "select--trigger flex items-center justify-between gap-x-2 px-2 outline-none drop-shadow-none",
          className
        )}
      >
        <SelectValue className="overflow-hidden whitespace-nowrap break-all">
          {placeholder}
        </SelectValue>
        <SelectIcon>
          <ChevronDown className="h-4 w-4 rounded-md font-bold text-slate-400" />
        </SelectIcon>
      </SelectTrigger>
      <SelectPortal>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectPortal>
    </Select>
  )
}

const DividedSelector = ({
  placeholder,
  onValueChange,
  className,
  features,
}: DistributedSelectorProps) => {
  return (
    <Select onValueChange={onValueChange} value={placeholder}>
      <SelectTrigger
        className={cn(
          "select--trigger flex items-center justify-between gap-x-2 px-1 outline-none drop-shadow-none",
          className
        )}
      >
        <SelectValue>{placeholder}</SelectValue>
        <SelectIcon>
          <ChevronDown className="h-4 w-4 rounded-md font-bold text-slate-400" />
        </SelectIcon>
      </SelectTrigger>
      <SelectPortal>
        <SelectContent>
          <div className="p-2">
            {(Object.entries(features) as [string, any[]][]).map(
              ([header, values]) => {
                return (
                  <div key={header}>
                    <p className="my-2 pl-8 text-sm font-bold">{header}</p>
                    {values.map((item, index) => {
                      return (
                        <SelectItem
                          key={item.name}
                          value={item.name}
                          className="py-2"
                        >
                          {item.name}
                        </SelectItem>
                      )
                    })}
                  </div>
                )
              }
            )}
          </div>
        </SelectContent>
      </SelectPortal>
    </Select>
  )
}

export {
  BasicSelector,
  Selector,
  EntityFeatureSelector,
  SelectorLabeled,
  DistributedSelector,
  IdSelector,
  DividedSelector,
}
