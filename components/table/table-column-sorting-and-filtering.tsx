"use client"

import React, {
  Dispatch,
  HTMLAttributes,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react"
import { FeatureType } from "@/types/enums"
import { Slider } from "@/components/ui/slider"
import SuggestionList from "@/components/table/suggestion-list"
import TruncatedText from "@/components/ui/truncated-text"
import moment from "moment"
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Search, X } from "lucide-react"

interface TableColumnSortingAndFilteringProps
  extends HTMLAttributes<HTMLDivElement> {
  idx: number
  data: string[]
  header: string
  headerType: string
  sliderRange: number[]
  filters: any[]
  sortingOrder: Record<string, string>
  setSortingOrder: Dispatch<SetStateAction<Record<string, string>>>
  setFilters: Dispatch<SetStateAction<any[]>>
  setShowFilterPopUp: Dispatch<SetStateAction<boolean[] | []>>
  isLoading: boolean
}
export default function TableColumnSortingAndFiltering({
  idx,
  data,
  header,
  headerType,
  filters,
  setFilters,
  sortingOrder,
  setSortingOrder,
  setShowFilterPopUp,
  isLoading,
  sliderRange,
}: TableColumnSortingAndFilteringProps) {
  console.log("ddaaaatata", data, header, headerType)
  const [showFilterOptions, setShowFilterOptions] = useState(false)
  const [range, setRange] = useState([1, 100])
  const [textQuery, setTextQuery] = useState("")
  const [suggestions, setSuggestions] = useState<any[]>([])
  const filterInputBoxRef = useRef<HTMLInputElement | null>(null)

  const totalFilters = filters.find((e) => e.colName == header)?.values.length

  const handleSort = (e, order) => {
    e.stopPropagation()
    setShowFilterPopUp([])
    if (sortingOrder.colName == header) {
      if (sortingOrder.order == order) {
        setSortingOrder({})
      } else setSortingOrder({ colName: header, order: order })
    } else {
      setSortingOrder({ colName: header, order: order })
    }
  }

  const handleFilter = (e) => {
    e.stopPropagation()
    setShowFilterOptions(true)
  }

  const handleValueChange = (value: number[]) => {
    setRange(value)
  }

  const handleDeleteFilter = (deletedValue: string) => {
    const targetCol = filters.find((e) => e.colName == header)
    const remainingFilters = targetCol.values.filter(
      (filter) => filter != deletedValue
    )
    const arr = filters.filter((e) => e.colName != header)
    if (remainingFilters.length > 0)
      arr.push({
        colName: header,
        colType: headerType,
        values: remainingFilters,
      })
    setFilters(arr)
  }

  const handleSelectSuggestion = (selectedSuggestion: string) => {
    setTextQuery(selectedSuggestion)
    setTimeout(() => setSuggestions([]), 0)
    filterInputBoxRef.current?.focus()
  }

  const handleAddTextQuery = (e) => {
    if (textQuery && e.key == "Enter" && suggestions.length == 0) {
      const targetFilter = filters.find((e) => e.colName == header)
      if (targetFilter) {
        targetFilter.values.push(textQuery)
        setFilters([...filters])
        setTextQuery("")
      } else {
        filters.push({
          colName: header,
          colType: headerType,
          values: [textQuery],
        })
        setFilters([...filters])
        setTextQuery("")
      }
    }
  }

  useEffect(() => {
    const filter = filters.find((filter) => filter.colName == header)?.values
    if (filter) setRange(filter)
    else setRange([sliderRange[0], sliderRange[1]])
  }, [])

  useEffect(() => {
    if (textQuery) {
      const items = data
        .filter((d: any) => {
          if (typeof d !== "string") {
            d = d?.toString()
          }

          return d?.toLowerCase().includes(textQuery.toString().toLowerCase())
        })
        .map((d) => d?.toString())
      setSuggestions(items)
    }
  }, [textQuery])

  return (
    <div className="absolute -right-2 top-[120%] z-50 w-[210px] rounded-lg border border-border bg-background-primary p-2 shadow-xl duration-1000 ease-linear">
      <div
        onClick={(e) => handleSort(e, "Ascending")}
        className={`flex h-8 cursor-pointer items-center gap-2 rounded px-2 text-sm font-normal text-foreground  hover:bg-background-secondary ${
          sortingOrder.colName == header && sortingOrder.order == "Ascending"
            ? "bg-background-secondary"
            : ""
        }`}
      >
        <ArrowUpNarrowWide
          className="size-4 text-foreground"
          strokeWidth={1.25}
        />
        <span>Ascending</span>
      </div>
      <div
        onClick={(e) => handleSort(e, "Descending")}
        className={`flex h-8 cursor-pointer items-center gap-2 rounded px-2 text-sm font-normal text-foreground  hover:bg-background-secondary ${
          sortingOrder.colName == header && sortingOrder.order == "Descending"
            ? "bg-background-secondary"
            : ""
        }`}
      >
        <ArrowDownWideNarrow
          className="size-4 text-foreground"
          strokeWidth={1.25}
        />
        <span>Descending</span>
      </div>
      <button
        className="absolute right-1 top-1 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          setShowFilterPopUp([])
        }}
      >
        <X className="size-3 text-foreground" strokeWidth={1.25} />
      </button>
      {showFilterOptions ? (
        <div onClick={(e) => e.stopPropagation()} className="relative w-full">
          {headerType == FeatureType.NUMERICAL ||
          headerType == FeatureType.TIMESTAMP ? (
            <div className="relative w-full pt-6">
              <Slider
                value={range}
                onValueChange={handleValueChange}
                onThumbMouseUp={() => {
                  const targetFilter = filters.find((e) => e.colName == header)
                  if (targetFilter) {
                    const arr = filters.filter((e) => e.colName != header)
                    if (
                      range[0] != sliderRange[0] ||
                      range[1] != sliderRange[1]
                    ) {
                      arr.push({
                        colName: header,
                        colType: headerType,
                        values: range,
                      })
                    }
                    setFilters(arr)
                  } else {
                    if (
                      range[0] != sliderRange[0] ||
                      range[1] != sliderRange[1]
                    ) {
                      filters.push({
                        colName: header,
                        colType: headerType,
                        values: range,
                      })
                    }
                    setFilters([...filters])
                  }
                }}
                min={sliderRange[0]}
                max={sliderRange[1]}
                step={
                  headerType == FeatureType.TIMESTAMP
                    ? 60 * 60 * 24
                    : sliderRange[1] - sliderRange[0] > 100
                    ? 1
                    : (sliderRange[1] - sliderRange[0]) / 100
                }
                onClick={() => {
                  const targetFilter = filters.find((e) => e.colName == header)
                  if (targetFilter) {
                    const arr = filters.filter((e) => e.colName != header)
                    if (
                      range[0] != sliderRange[0] ||
                      range[1] != sliderRange[1]
                    ) {
                      arr.push({
                        colName: header,
                        colType: headerType,
                        values: range,
                      })
                    }
                    setFilters(arr)
                  } else {
                    if (
                      range[0] != sliderRange[0] ||
                      range[1] != sliderRange[1]
                    ) {
                      filters.push({
                        colName: header,
                        colType: headerType,
                        values: range,
                      })
                    }
                    setFilters([...filters])
                  }
                }}
                showHoveredValue={true}
                className="w-full"
                headerType={headerType}
              />
              <div className="mt-2 flex items-center justify-between text-foreground-subtle">
                <span className="text-xs font-medium">Applied:&nbsp;</span>
                <span className="flex-1 text-xs font-medium">
                  {headerType == FeatureType.TIMESTAMP
                    ? moment.unix(range[0]).format("YYYY/MM/DD")
                    : range[0]}{" "}
                  -{" "}
                  {headerType == FeatureType.TIMESTAMP
                    ? moment.unix(range[1]).format("YYYY/MM/DD")
                    : range[1]}
                </span>
              </div>
            </div>
          ) : (
            <div className="relative mt-1 border-t border-[#CDCED6] pt-3">
              {totalFilters > 0 && (
                <div className="mb-2 flex flex-wrap items-center gap-2 break-all">
                  {filters
                    .find((e) => e.colName == header)
                    ?.values.map((filter, idx) => (
                      <div
                        key={idx}
                        className="flex max-w-full items-center gap-[2px] rounded border border-border-accent bg-background-primary py-[2px] pl-1 pr-[2px] hover:bg-background-secondary"
                      >
                        <TruncatedText
                          truncatedText={filter}
                          className="flex-1 text-xs font-medium"
                          hoverClassName="bottom-full left-0"
                        />
                        <X
                          className="size-3 shrink-0 cursor-pointer text-foreground"
                          strokeWidth={1.25}
                          onClick={() => handleDeleteFilter(filter)}
                        />
                      </div>
                    ))}
                </div>
              )}
              <input
                type="text"
                ref={filterInputBoxRef}
                autoFocus
                placeholder="Enter your filter"
                className="rounded border px-2 py-1 text-xs text-[#737373] focus:outline-none"
                value={textQuery}
                onClick={() => setSuggestions([])}
                onChange={(e) => setTextQuery(e.target.value)}
                onKeyDown={handleAddTextQuery}
              />
              {textQuery && suggestions.length > 0 && (
                <SuggestionList
                  title={`${header}`}
                  onClickSuggestion={handleSelectSuggestion}
                  suggestions={suggestions}
                  isLoading={isLoading}
                  top={100}
                />
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleFilter}
          className="relative flex h-8 cursor-pointer items-center gap-2 rounded px-2 text-sm font-normal text-foreground  hover:bg-background-secondary"
        >
          <Search className="size-4 text-foreground" strokeWidth={1.25} />
          <span>Filter</span>
          {totalFilters > 0 && (
            <div className="absolute right-2 flex aspect-square w-5 items-center justify-center rounded-full bg-accent-brand-purple text-xs text-foreground-inverse">
              {totalFilters}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
