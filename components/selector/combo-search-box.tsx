"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
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
import { Icons } from "@/components/icons/icons"

export interface Item {
  searchValues: string[]
  label: string
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
            <CommandGroup>
              {items.map((option) => (
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
                    " text-wrap flex cursor-pointer items-center gap-2 px-3 py-2 text-sm  text-foreground"
                  )}
                >
                  {showButton === false && (
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 shrink-0",
                        value === option.label ? "opacity-100" : "opacity-0"
                      )}
                    />
                  )}
                  <span className={cn("flex-1 truncate", labelClassName)}>
                    {option.label}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
