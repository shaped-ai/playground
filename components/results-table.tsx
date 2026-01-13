"use client"

import Image from "next/image"
import React, {
  HTMLAttributes,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react"
import TruncatedText from "@/components/ui/truncated-text"
import TableColumnSortingAndFiltering from "@/components/table/table-column-sorting-and-filtering"
import { cn } from "@/lib/utils"
import DataCatalogBarChart from "@/components/graphs/data-catalog-bar-chart"
import {
  FeatureType,
  ItemRecommendationTab,
  QueryTab,
  UserRecommendationTab,
} from "@/types/enums"
import ImageSkeleton from "@/components/loader/image-skeleton"
import { getBucketizedCount } from "@/utils/get-bucketized-count"
import { TableCellDetailsModal } from "@/components/modals/table-cell-details-modal"
import moment from "moment"
import type { QueryRequestDetailsProps } from "@/components/modals/query-request-details"
import { TableCellScoreDetailsModal } from "@/components/modals/table-cell-score-details-modal"
import { usePathname } from "next/navigation"
import dynamic from "next/dynamic"
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Baseline,
  Binary,
  Blend,
  Brackets,
  CalendarClock,
  FileCode2,
  Hash,
  ImageIcon,
  Layers,
  ListFilter,
  Rows3,
  Settings2,
  SquareUser,
} from "lucide-react"

const DynamicQueryRequestDetails = dynamic<QueryRequestDetailsProps>(
  () =>
    import("@/components/modals/query-request-details").then((mod) => ({
      default: mod.QueryRequestDetails,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-1 rounded-l-lg border border-y border-l border-[#8559E0] bg-white px-4 py-2 text-xs font-medium text-[#8559E0] shadow-sm">
        <FileCode2 className="size-5" strokeWidth={1.25} />
        <span>Request Details</span>
      </div>
    ),
  }
)

interface ResultTableProps extends HTMLAttributes<HTMLDivElement> {
  currentRankTab: UserRecommendationTab | ItemRecommendationTab
  resultsData: Record<string, any>[]
  features: any
  imageFeatures: any
  selectedResultsItems?: string[] | []
  setSelectedResultsItems?: React.Dispatch<React.SetStateAction<string[]>>
  sessionInteractionEnabled: boolean
  rankTime: any
  modelDetails: any
  queryStep: string | number
  title?: string
  handleShowRankConfig: (event: any) => void
  currentQueryTab: QueryTab
  configuration: any
  scoringPolicyNames?: string[]
  searchScoresBreakdown?: Array<Record<string, number>>
  updateQueryParams: (params: {
    itemId?: string | null
    userId?: string | null
    textQuery?: string | null
    queryStep?: number | null
    currentQueryTab?: QueryTab | null
    currentRankTab?: UserRecommendationTab | ItemRecommendationTab | null
    routerOption: "push" | "replace"
  }) => void
}

export function ResultsTable({
  currentRankTab,
  resultsData,
  features,
  imageFeatures,
  selectedResultsItems,
  setSelectedResultsItems,
  sessionInteractionEnabled,
  rankTime,
  modelDetails,
  title,
  handleShowRankConfig,
  currentQueryTab,
  configuration,
  queryStep,
  scoringPolicyNames,
  searchScoresBreakdown,
  updateQueryParams,
}: ResultTableProps) {
  const path = usePathname()
  const [imageLoaded, setImageLoaded] = useState({})
  const [imagesInView, setImagesInView] = useState<Set<string>>(new Set())
  const imagesInViewRef = useRef<Set<string>>(new Set())
  const nodeRegistryRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const [sortingOrder, setSortingOrder] = useState<Record<string, string>>({})
  const [filters, setFilters] = useState<any[]>([])
  const [showFilterPopUp, setShowFilterPopUp] = useState<boolean[] | []>(
    new Array(modelDetails?.model_schema?.item?.length).fill(false)
  )
  const [headers, setHeaders] = useState<Record<string, any>[]>([])
  const [chartWidth, setChartWidth] = useState<Record<string, number>>({})
  const [chartHeight, setChartHeight] = useState(120)
  const [subHeaderRowCount, setSubHeaderRowCount] = useState<number>(4)
  const [tableData, setTableData] = useState<any[]>(resultsData)
  const [showCellOptions, setShowCellOptions] = useState(false)
  const [hoveredCell, setHoveredCell] = useState({ rowNum: -1, colNum: -1 })
  const [showScoreDetails, setShowScoreDetails] = useState(false)
  const [containerHeight, setContainerHeight] = useState<number>(0)
  const [showDetailsIcon, setShowDetailsIcon] = useState(false)
  const [resizingSubHeader, setResizingSubHeader] = useState(false)
  const [currentY, setCurrentY] = useState(0)
  const [hoveredSubHeaderColNum, setHoveredSubHeaderColNum] =
    useState<number>(-1)
  const [subHeaderHeight, setSubHeaderHeight] = useState<number>(136)
  // column resize
  const headerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const columnRefs = useRef<(HTMLDivElement | null)[]>([])
  const [hoveredColNum, setHoveredColNum] = useState(-1)
  const [columnWidth, setColumnWidth] = useState<Record<string, number>>({})
  const [resizingColNum, setResizingColNum] = useState<number>(-1)
  const [resizingColName, setResizingColName] = useState<string | null>(null)
  const [isColumnResizing, setIsColumnResizing] = useState(false)
  const [currentX, setCurrentX] = useState(0)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const subHeaderRef = useRef<HTMLDivElement>(null)
  const minColWidth = 210
  const paddingX = 16
  const minRowHeight = 136
  const paddingY = 16

  const handleColumnMouseDown = (
    e: React.MouseEvent,
    colNum: number,
    colName: string
  ) => {
    setResizingColNum(colNum)
    setCurrentX(headerRef?.current?.getBoundingClientRect().right ?? 0)
    setIsColumnResizing(true)
    setResizingColName(colName)
  }

  const handleColumnMouseMove = (e: MouseEvent) => {
    if (isColumnResizing) {
      const colEl = columnRefs.current[resizingColNum]

      if (colEl) {
        const colLeftX = colEl.getBoundingClientRect().left
        const newWidth = e.clientX + 3 - colLeftX

        if (newWidth > minColWidth) {
          setCurrentX(e.clientX + 3)
        } else {
          setCurrentX(minColWidth + colLeftX)
        }
      }
    }
  }

  const handleColumnMouseUp = () => {
    const colEl = columnRefs.current[resizingColNum]

    if (colEl) {
      const colLeftX = colEl.getBoundingClientRect().left
      const newWidth = currentX - colLeftX

      if (newWidth > minColWidth) {
        setColumnWidth((prev) => ({
          ...prev,
          [resizingColName!]: newWidth,
        }))
        setChartWidth((prevChartWidth) => ({
          ...prevChartWidth,
          [headers[resizingColNum].name]: newWidth - paddingX,
        }))
      } else {
        setColumnWidth((prev) => ({
          ...prev,
          [resizingColName!]: minColWidth,
        }))
        setChartWidth((prevChartWidth) => ({
          ...prevChartWidth,
          [headers[resizingColNum].name]: minColWidth - paddingX,
        }))
      }
    }

    setResizingColNum(-1)
    setIsColumnResizing(false)
    setResizingColName(null)
  }

  useEffect(() => {
    if (isColumnResizing) {
      document.addEventListener("mousemove", handleColumnMouseMove)
      document.addEventListener("mouseup", handleColumnMouseUp)
    } else {
      document.removeEventListener("mousemove", handleColumnMouseMove)
      document.removeEventListener("mouseup", handleColumnMouseUp)
    }
    return () => {
      document.removeEventListener("mousemove", handleColumnMouseMove)
      document.removeEventListener("mouseup", handleColumnMouseUp)
    }
  }, [isColumnResizing, currentX])

  const hasScore = resultsData?.some((item: any) => item.score !== undefined)

  useEffect(() => {
    setHeaders([
      ...imageFeatures,
      ...features.filter(({ name }) => !name.startsWith("_derived_")),
      ...(hasScore ? [{ name: "score", type: "Numerical" }] : []),
      ...features.filter(({ name }) => name.startsWith("_derived_")),
    ])
  }, [currentRankTab, features, imageFeatures])

  useEffect(() => {
    setShowFilterPopUp(new Array(headers.length).fill(false))
  }, [headers])

  useEffect(() => {
    setTableData(resultsData)
  }, [resultsData])

  useEffect(() => {
    if (Object.keys(sortingOrder).length == 0) return

    const headerName = sortingOrder.colName
    const headerType = headers.find((header) => header.name == headerName)?.type

    if (sortingOrder.order == "Ascending") {
      if (headerType == FeatureType.TEXT) {
        tableData.sort((a, b) => a[headerName].length - b[headerName].length)
        setTableData([...tableData])
      } else if (headerType == FeatureType.TIMESTAMP) {
        tableData.sort((a, b) => {
          const timeA = moment(a[headerName], "YYYY-MM-DD HH:mm:ss").valueOf()
          const timeB = moment(b[headerName], "YYYY-MM-DD HH:mm:ss").valueOf()
          return timeA - timeB
        })
        setTableData([...tableData])
      } else {
        tableData.sort((a, b) => a[headerName] - b[headerName])
        setTableData([...tableData])
      }
    } else {
      if (headerType == FeatureType.TEXT) {
        tableData.sort((a, b) => b[headerName].length - a[headerName].length)
        setTableData([...tableData])
      } else if (headerType == FeatureType.TIMESTAMP) {
        tableData.sort((a, b) => {
          const timeA = moment(a[headerName], "YYYY-MM-DD HH:mm:ss").valueOf()
          const timeB = moment(b[headerName], "YYYY-MM-DD HH:mm:ss").valueOf()
          return timeB - timeA
        })
        setTableData([...tableData])
      } else {
        tableData.sort((a, b) => b[headerName] - a[headerName])
        setTableData([...tableData])
      }
    }
  }, [sortingOrder])

  useEffect(() => {
    const filterData = (data: any[], filters: any[]) => {
      return filters.reduce((filteredData, filter) => {
        const { colName, colType, values } = filter

        if (
          colType === FeatureType.NUMERICAL ||
          colType === FeatureType.TIMESTAMP
        ) {
          const [start, end] = values as [number, number]
          return filteredData.filter((item) => {
            const raw = item[colName]

            if (colType === FeatureType.TIMESTAMP) {
              const ts = moment.utc(raw).unix()
              return start <= ts && ts <= end
            }

            return start <= raw && raw <= end // NUMERICAL
          })
        }

        if (colType === FeatureType.TEXT) {
          const needles = values as string[]
          return filteredData.filter((item) => {
            const text = item[colName] as string | undefined
            return text ? needles.some((n) => text.includes(n)) : false
          })
        }

        if (
          colType === FeatureType.TEXT_SET ||
          colType === FeatureType.TEXT_SEQUENCE
        ) {
          const needles = values as string[]
          return filteredData.filter((item) => {
            const arr = item[colName] as string[] | undefined
            return Array.isArray(arr)
              ? arr.some((elem) => needles.some((n) => elem.includes(n)))
              : false
          })
        }

        if (
          colType === FeatureType.NUMERICAL_SET ||
          colType === FeatureType.NUMERICAL_SEQUENCE
        ) {
          const [start, end] = values as [number, number]
          return filteredData.filter((item) => {
            const arr = item[colName] as number[] | undefined
            return Array.isArray(arr)
              ? arr.some((num) => start <= num && num <= end)
              : false
          })
        }

        const allowedValues = values as string[]
        return filteredData.filter((item) => {
          const field = item[colName]

          if (Array.isArray(field)) {
            return field.some((elem) => allowedValues.includes(elem))
          }

          return allowedValues.includes(field)
        })
      }, data)
    }

    const sortData = (tableData) => {
      const headerName = sortingOrder.colName
      const headerType = headers.find(
        (header) => header.name == headerName
      )?.type

      if (sortingOrder.order == "Ascending") {
        if (headerType == FeatureType.TEXT) {
          tableData.sort((a, b) => a[headerName].length - b[headerName].length)
          setTableData([...tableData])
        } else if (headerType == FeatureType.TIMESTAMP) {
          tableData.sort((a, b) => {
            const timeA = moment(a[headerName]).unix()
            const timeB = moment(b[headerName]).unix()
            return timeA - timeB
          })
          setTableData([...tableData])
        } else {
          tableData.sort((a, b) => a[headerName] - b[headerName])
          setTableData([...tableData])
        }
      } else {
        if (headerType == FeatureType.TEXT) {
          tableData.sort((a, b) => b[headerName].length - a[headerName].length)
          setTableData([...tableData])
        } else if (headerType == FeatureType.TIMESTAMP) {
          tableData.sort((a, b) => {
            const timeA = moment(a[headerName]).unix()
            const timeB = moment(b[headerName]).unix()
            return timeB - timeA
          })
          setTableData([...tableData])
        } else {
          tableData.sort((a, b) => b[headerName] - a[headerName])
          setTableData([...tableData])
        }
      }
    }

    if (filters.length > 0) {
      const newFilteredData = filterData(resultsData, filters)
      if (Object.keys(sortingOrder).length != 0) sortData(newFilteredData)
      setTableData(newFilteredData)
    } else {
      if (Object.keys(sortingOrder).length != 0) sortData(resultsData)
      setTableData(resultsData)
    }
  }, [filters, resultsData, sortingOrder])

  const handleImageLoad = (itemId) => {
    setImageLoaded((prevState) => ({
      ...prevState,
      [itemId]: "Loaded",
    }))
  }

  const handleImageError = (itemId) => {
    setImageLoaded((prevState) => ({
      ...prevState,
      [itemId]: "Error",
    }))
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return
          }

          const itemId = entry.target.getAttribute("data-item-id")
          if (!itemId) {
            return
          }

          if (!imagesInViewRef.current.has(itemId)) {
            imagesInViewRef.current.add(itemId)
            setImagesInView(new Set(imagesInViewRef.current))
            setImageLoaded((prev) => {
              if (prev[itemId]) {
                return prev
              }
              return {
                ...prev,
                [itemId]: "Loading",
              }
            })
          }

          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.1, rootMargin: "50px" }
    )

    observerRef.current = observer
    nodeRegistryRef.current.forEach((node) => {
      observer.observe(node)
    })

    return () => {
      observer.disconnect()
    }
  }, [])

  const observeImageContainer = useCallback(
    (node: HTMLDivElement | null, itemId: string) => {
      if (!node) {
        const storedNode = nodeRegistryRef.current.get(itemId)
        if (storedNode && observerRef.current) {
          observerRef.current.unobserve(storedNode)
        }
        nodeRegistryRef.current.delete(itemId)
        return
      }

      node.setAttribute("data-item-id", itemId)
      nodeRegistryRef.current.set(itemId, node)

      if (observerRef.current) {
        observerRef.current.observe(node)
      }
    },
    []
  )

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [tableData])

  const handleCellClick = (rowNum: number) => {
    if (!sessionInteractionEnabled) return
    const selected = tableData.find((_, index) => index === rowNum)
    if (selected) {
      setSelectedResultsItems?.((prevSelected) => [
        ...prevSelected,
        selected.item_id,
      ])
    }
  }

  useEffect(() => {
    const newColumnWidth = headers.reduce((acc, cur) => {
      acc[cur.name] = minColWidth
      return acc
    }, {})
    setColumnWidth(newColumnWidth)
  }, [headers])

  useEffect(() => {
    const newChartWidth = headers.reduce((acc, cur) => {
      acc[cur.name] = 194
      return acc
    }, {})
    setChartWidth(newChartWidth)
  }, [headers])

  const getPercentageFromCount = (count: number, total_rows: number) => {
    return ((count / total_rows) * 100).toFixed(1)
  }

  const handleFilter = (e, header, idx) => {
    e.stopPropagation()
    if (showFilterPopUp[idx]) {
      showFilterPopUp[idx] = false
      setShowFilterPopUp([...showFilterPopUp])
    } else {
      const arr = new Array(headers.length).fill(false)
      arr[idx] = true
      setShowFilterPopUp(arr)
    }
  }

  const handleSubHeaderResize = (newHeight: number, name?: string) => {
    setChartHeight(newHeight)

    const targetRowCount = Math.floor(newHeight / 24) - 1
    const isDecreasing = targetRowCount < subHeaderRowCount
    const incrementTime = 500 / Math.abs(targetRowCount - subHeaderRowCount)

    if (isDecreasing) {
      setSubHeaderRowCount((prevCount) => prevCount - 1)
    }

    const interval = setInterval(() => {
      setSubHeaderRowCount((prevCount) => {
        if (prevCount < targetRowCount) {
          return prevCount + 1
        } else if (prevCount > targetRowCount) {
          return prevCount - 1
        } else {
          clearInterval(interval)
          return prevCount
        }
      })
    }, incrementTime)
  }

  const getCardinality = (header: string) => {
    const uniqueValues: string[] = []
    tableData.forEach((result) => {
      if (Array.isArray(result[header])) {
        for (let i = 0; i < result[header].length; i++) {
          if (!uniqueValues.includes(result[header][i]))
            uniqueValues.push(result[header][i])
        }
      } else if (!uniqueValues.includes(result[header]))
        uniqueValues.push(result[header])
    })
    return uniqueValues.length
  }

  const getNullCount = (headerName: string) => {
    const nullCount = resultsData.filter((d) => d[headerName] == null).length
    return nullCount
  }

  const getUniqueRows = (headerName: string) => {
    const uniqueRows: any[] = []
    if (Array.isArray(resultsData[0]?.[headerName])) {
      const uniqueTypes = {}
      for (let i = 0; i < resultsData.length; i++) {
        resultsData[i][headerName]?.forEach((d) => {
          if (uniqueTypes[d]) uniqueTypes[d]++
          else uniqueTypes[d] = 1
        })
      }
      for (const key in uniqueTypes) uniqueRows.push([key, uniqueTypes[key]])
    } else {
      const uniqueTypes = {}
      for (let i = 0; i < resultsData.length; i++) {
        if (uniqueTypes[resultsData[i][headerName]])
          uniqueTypes[resultsData[i][headerName]]++
        else uniqueTypes[resultsData[i][headerName]] = 1
      }
      for (const key in uniqueTypes) uniqueRows.push([key, uniqueTypes[key]])
    }
    uniqueRows.sort((a, b) => b[1] - a[1])
    return uniqueRows
  }

  const getSliderRange = (name, type): [number, number] => {
    if (
      FeatureType.getAllNumericalTypes().includes(type) ||
      type == FeatureType.TIMESTAMP ||
      type == FeatureType.TEXT ||
      type == FeatureType.TEXT_SEQUENCE ||
      type == FeatureType.TEXT_SET
    ) {
      const { min_value, max_value } = getBucketizedCount(
        resultsData,
        name,
        type
      ).columnStats
      return [
        type == FeatureType.TIMESTAMP
          ? moment.utc(min_value, "YYYY/MM/DD").unix()
          : (min_value as number),
        type == FeatureType.TIMESTAMP
          ? moment.utc(max_value, "YYYY/MM/DD").add(24, "hours").unix()
          : (max_value as number),
      ]
    } else return [0, 0]
  }

  const isValidUrl = (src) => {
    try {
      new URL(src)
    } catch (e) {
      return ""
    }
    return src
  }
  const tab = path?.split("/").at(-1)

  useEffect(() => {
    const calculateHeight = () => {
      const height = window.innerHeight - (tab == "simulate" ? 64 : 171)
      setContainerHeight(height)
    }

    if (queryStep === 2 || currentQueryTab == QueryTab.SESSION) {
      calculateHeight()
      window.addEventListener("resize", calculateHeight)
    }

    return () => {
      window.removeEventListener("resize", calculateHeight)
    }
    // }, [queryStep, currentQueryTab, selectedResultsItems])
  }, [queryStep, currentQueryTab])

  const handleMouseDown = (e: React.MouseEvent) => {
    setResizingSubHeader(true)
    setCurrentY(subHeaderRef?.current?.getBoundingClientRect().bottom ?? 0)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (resizingSubHeader && subHeaderRef.current) {
      const rowTopY = subHeaderRef.current.getBoundingClientRect().top
      const newHeight = e.clientY + 3 - rowTopY
      if (newHeight > minRowHeight) setCurrentY(e.clientY + 3)
      else setCurrentY(minRowHeight + rowTopY)
    }
  }

  const handleMouseUp = () => {
    setHoveredSubHeaderColNum(-1)
    if (subHeaderRef.current) {
      const newHeight =
        currentY - subHeaderRef.current.getBoundingClientRect().top

      if (newHeight > minRowHeight) {
        setSubHeaderHeight(newHeight)
        setContainerHeight((prev) => prev + newHeight - subHeaderHeight)
        handleSubHeaderResize(newHeight - paddingY)
      } else {
        setSubHeaderHeight(minRowHeight)
        setContainerHeight((prev) => prev + minRowHeight - subHeaderHeight)
        handleSubHeaderResize(minRowHeight - paddingY)
      }
    }
    setResizingSubHeader(false)
  }

  useEffect(() => {
    if (resizingSubHeader) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    } else {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [resizingSubHeader, currentY])

  useEffect(() => {
    if (headers.length === 0) return
    const containerWidth =
      containerRef.current?.getBoundingClientRect().width ?? 0

    const totalColumnWidth = Object.values(columnWidth).reduce(
      (acc, width) => acc + width,
      0
    )

    const equalWidth = Math.max(
      minColWidth,
      Math.floor(containerWidth / headers.length)
    )

    if (
      containerWidth - totalColumnWidth > 1 &&
      Object.keys(columnWidth).length !== 0
    ) {
      const updatedWidths = headers.reduce((acc, { name }) => {
        acc[name] = equalWidth
        return acc
      }, {} as Record<string, number>)

      const widthsAreSame = headers.every(
        ({ name }) => columnWidth[name] === equalWidth
      )

      if (!widthsAreSame) setColumnWidth(updatedWidths)
    }
  }, [headers, columnWidth])

  return (
    <div className="dark:bg-[#1D1D1D] flex max-w-full flex-col gap-4 overflow-x-auto ">
      {/* <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-0">
          {(queryStep == 2 || currentQueryTab == QueryTab.SESSION) && (
            <h1 className=" text-2xl font-bold text-[#191919]">{title}</h1>
          )}
          <p
            className={cn(
              "text-base font-bold text-gray-700",
              queryStep == 3 && "text-xl text-black"
            )}
          >
            {resultsData.length} results in {rankTime?.toFixed(2) ?? 0} s
          </p>
        </div>

        <div className="flex items-center">
          <DynamicQueryRequestDetails
            modelDetails={modelDetails}
            configuration={configuration}
            currentQueryTab={currentQueryTab}
            currentRankTab={currentRankTab}
            queryStep={queryStep}
            className=" items-center gap-1 rounded-l-lg border border-[#8559E0] bg-white px-4 py-2 text-[#8559E0] shadow-sm"
          />
          <button
            onClick={handleShowRankConfig}
            className="text-nowrap flex items-center justify-center gap-1 rounded-r-lg border-y border-r border-[#8559E0] bg-white px-4 py-2 text-xs font-medium text-[#8559E0] shadow-sm hover:bg-[#E9E1F9]"
          >
            <Settings2 className="size-5" strokeWidth={1.5} />
            <span>Customize Results</span>
          </button>
        </div>
      </div> */}
      {/* table */}
      <div
        onKeyDown={() => setShowScoreDetails(false)}
        onScroll={() => setShowScoreDetails(false)}
        onWheel={() => setShowScoreDetails(false)}
        ref={containerRef}
        className="select-none overflow-hidden rounded-none border-0 border-border-muted"
      >
        <div
          className="relative w-full overflow-auto"
          style={{
            height:
              queryStep == 2 && containerHeight > 700
                ? containerHeight
                : path?.split("/").at(-1) == "simulate" &&
                  configuration.interactions.length == 0
                ? containerHeight
                : path?.split("/").at(-1) == "simulate" &&
                  configuration.interactions.length > 0 &&
                  containerHeight > 1450
                ? containerHeight - 700
                : 700,
          }}
        >
          <div className="relative flex w-fit">
            {headers?.map(({ name, type }, colIdx) => (
              // table column
              <div
                key={colIdx}
                ref={(el) => {
                  columnRefs.current[colIdx] = el
                }}
                style={{
                  zIndex: name == "score" ? 9995 : 9995 - colIdx,
                  width: `${columnWidth[name] ?? 210}px`,
                }}
                className="relative shrink-0 gap-0 transition-[width] duration-150 ease-out"
              >
                {/* headers */}
                <div
                  key={colIdx}
                  onMouseEnter={() => setHoveredColNum(colIdx)}
                  onMouseLeave={() => setHoveredColNum(-1)}
                  className={cn(
                    "dark:bg-[#262626] z-9900 dark:border-[#40403F] sticky top-0 h-[54px] w-full border-0 border-b border-[#E5E7EB] bg-[#F9F7FD] px-2 py-2 "
                  )}
                >
                  <div className="relative mb-1 flex items-center justify-between">
                    <div className="dark:text-[#F0F0EB] flex w-full items-center gap-1 text-xs font-medium text-[#737373]">
                      {type == FeatureType.ID ? (
                        <SquareUser className="size-4 " strokeWidth={1.25} />
                      ) : type == FeatureType.CATEGORY ||
                        type == FeatureType.TEXT_CATEGORY ? (
                        <Layers className="size-4 " strokeWidth={1.25} />
                      ) : type == FeatureType.TIMESTAMP ? (
                        <CalendarClock className="size-4 " strokeWidth={1.25} />
                      ) : type == FeatureType.BINARY ||
                        type == "BinaryLabel" ? (
                        <Binary className="size-4 " strokeWidth={1.25} />
                      ) : type == FeatureType.NUMERICAL ? (
                        <Hash className="size-4 " strokeWidth={1.25} />
                      ) : FeatureType.getSequenceTypes().includes(type) ? (
                        <Brackets className="size-4 " strokeWidth={1.25} />
                      ) : (
                        <Baseline className="size-4 " strokeWidth={1.25} />
                      )}
                      <TruncatedText
                        truncatedText={type}
                        isHoverable={true}
                        className="dark:text-[#F0F0EB] w-[60%] font-mono text-xs text-[#737373]"
                        hoverClassName={`top-[280%] left-[-20px]`}
                      />
                    </div>
                    {sortingOrder.colName == name &&
                    sortingOrder.order == "Ascending" ? (
                      <ArrowUpNarrowWide
                        onClick={(e) => handleFilter(e, name, colIdx)}
                        className={cn(
                          "size-5 dark:text-[#F0F0EB] absolute right-0 rounded p-[2px]",
                          "cursor-pointer hover:bg-purple-300"
                        )}
                        strokeWidth={1.5}
                      />
                    ) : sortingOrder.colName == name &&
                      sortingOrder.order == "Descending" ? (
                      <ArrowDownWideNarrow
                        onClick={(e) => handleFilter(e, name, colIdx)}
                        className={cn(
                          "size-5 dark:text-[#F0F0EB] absolute right-0 rounded p-[2px]",
                          "cursor-pointer hover:bg-purple-300"
                        )}
                        strokeWidth={1.5}
                      />
                    ) : (
                      <ListFilter
                        onClick={(e) => handleFilter(e, name, colIdx)}
                        className={cn(
                          "size-5 dark:text-[#F0F0EB] absolute right-0 rounded p-[2px]",
                          "cursor-pointer hover:bg-purple-300"
                        )}
                        strokeWidth={1.5}
                      />
                    )}
                    {showFilterPopUp[colIdx] && (
                      <TableColumnSortingAndFiltering
                        idx={colIdx}
                        data={Array.from(
                          new Set(resultsData.flatMap((d) => d[name]))
                        )}
                        header={name}
                        headerType={type}
                        filters={filters}
                        setFilters={setFilters}
                        sortingOrder={sortingOrder}
                        setSortingOrder={setSortingOrder}
                        setShowFilterPopUp={setShowFilterPopUp}
                        isLoading={false}
                        sliderRange={getSliderRange(name, type)}
                      />
                    )}
                  </div>
                  {filters.find((filter) => filter.colName == name)?.values
                    ?.length > 0 && (
                    <span className="dark:text-[#F0F0EB] absolute right-1 top-2 flex aspect-square w-3 items-center justify-center rounded-full bg-[#8559E0] text-[8px] text-white">
                      {
                        filters.find((filter) => filter.colName == name)?.values
                          ?.length
                      }
                    </span>
                  )}
                  <TruncatedText
                    truncatedText={name}
                    isHoverable={true}
                    className="dark:text-[#F0F0EB] text-xs font-semibold text-[#191919]"
                    hoverClassName="top-[150%] left-0"
                  />
                  {!resizingSubHeader &&
                    resizingColNum == -1 &&
                    hoveredColNum == colIdx && (
                      <div
                        className={` absolute right-0 top-0 h-full w-1 bg-[#a184dc] transition`}
                      />
                    )}
                </div>

                {/* subheader */}
                <div
                  ref={subHeaderRef}
                  className={cn(
                    "z-9800 sticky top-[54px] w-full border-0 border-r border-b border-border bg-background-primary p-2",
                    getNullCount(name) == resultsData.length && "items-start"
                  )}
                  style={{ height: `${subHeaderHeight}px` }}
                  onMouseEnter={() => setHoveredSubHeaderColNum(colIdx)}
                  onMouseLeave={() => setHoveredSubHeaderColNum(-1)}
                >
                  {FeatureType.getAllNumericalTypes().includes(type) ||
                  type == FeatureType.TIMESTAMP ||
                  type == FeatureType.TEXT ||
                  type == FeatureType.TEXT_SEQUENCE ||
                  type == FeatureType.TEXT_SET ? (
                    <div className="flex w-full flex-col">
                      {getNullCount(name) == resultsData.length ? (
                        <div className="flex w-full items-start justify-between text-xs font-medium text-accent-brand-red">
                          <span>[Nulls]</span>
                          <span>100%</span>
                        </div>
                      ) : (
                        <DataCatalogBarChart
                          chartData={
                            getBucketizedCount(resultsData, name, type)
                              .bucketizedData
                          }
                          width={chartWidth[name] ?? 304}
                          height={
                            chartHeight -
                            40 -
                            (type == FeatureType.TEXT ? 14 : 0)
                          }
                          showToolTip={true}
                        />
                      )}
                      {getNullCount(name) != resultsData.length &&
                        type == FeatureType.TEXT && (
                          <div className="text-foreground-strong mb-1 flex w-full items-center justify-center text-[10px] font-medium leading-[10px] ">
                            text.length
                          </div>
                        )}
                      {getNullCount(name) != resultsData.length && (
                        <div className="w-full rounded bg-background-secondary px-[6px]">
                          <div className="flex items-center justify-between">
                            <div className="flex w-1/2 items-center gap-1">
                              <span className=" text-[10px] font-medium text-foreground">
                                min
                              </span>
                              <span className=" flex-1 truncate text-[10px] font-medium text-foreground">
                                {
                                  getBucketizedCount(resultsData, name, type)
                                    .columnStats.min_value
                                }
                              </span>
                            </div>
                            <div className="flex max-w-[50%] items-center gap-1">
                              <span className=" text-[10px] font-medium text-foreground">
                                median
                              </span>
                              <span className=" overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-medium text-foreground">
                                {
                                  getBucketizedCount(resultsData, name, type)
                                    .columnStats.median_value
                                }
                              </span>
                            </div>
                          </div>
                          <div className="flex w-full items-center justify-between">
                            <div className="flex w-1/2 items-center gap-1">
                              <span className=" text-[10px] font-medium text-foreground">
                                max
                              </span>
                              <span className=" flex-1 truncate text-[10px] font-medium text-foreground">
                                {
                                  getBucketizedCount(resultsData, name, type)
                                    .columnStats.max_value
                                }
                              </span>
                            </div>
                            <div className=" flex max-w-[50%] items-center gap-1 text-accent-brand-red">
                              <span className="text-[10px] font-medium ">
                                [nulls]
                              </span>
                              <span className=" flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-medium text-foreground">
                                {getPercentageFromCount(
                                  getNullCount(name),
                                  resultsData.length
                                )}
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="size-full">
                      <div className="  flex items-center  justify-between rounded bg-background-secondary p-1">
                        <span className=" text-xs font-medium text-foreground">
                          Cardinality
                        </span>
                        <span className=" text-xs font-medium text-foreground">
                          {getCardinality(name)}
                        </span>
                      </div>
                      {getNullCount(name) > 0 && (
                        <div className="flex items-center justify-between rounded p-1 text-accent-brand-red">
                          <span className="text-xs font-medium ">[Nulls]</span>
                          <span className="text-xs font-medium ">
                            {getPercentageFromCount(
                              getNullCount(name),
                              resultsData.length
                            )}
                            %
                          </span>
                        </div>
                      )}
                      {getUniqueRows(name)
                        ?.slice(
                          0,
                          subHeaderRowCount - (getNullCount(name) > 0 ? 2 : 1)
                        )
                        .map(([rowName, value]) => (
                          <div
                            key={rowName}
                            className={cn(
                              "group/itemRow flex items-center justify-between rounded p-1 text-xs font-medium text-foreground-muted",
                              "hover:bg-background-secondary hover:text-accent-brand-off-white"
                            )}
                          >
                            <TruncatedText
                              truncatedText={
                                Array.isArray(rowName)
                                  ? JSON.stringify(rowName)
                                  : typeof rowName === "object" &&
                                    rowName !== null
                                  ? JSON.stringify(rowName, null, 2)
                                  : rowName == null
                                  ? "null"
                                  : rowName === true || rowName === false
                                  ? rowName.toString()
                                  : rowName == ""
                                  ? '""'
                                  : rowName
                              }
                              isHoverable={true}
                              width="calc(100% - 50px)"
                              className="group-hover/itemRow:text-accent-brand-off-white flex-1 p-0"
                              hoverClassName={`px-3 py-1 rounded top-[130%] max-w-[20vw] break-words ${
                                colIdx == headers.length - 1 ? "right-0" : ""
                              }`}
                            />
                            <span className=" group-hover/itemRow:text-accent-brand-off-white text-foreground-muted">
                              {value}
                            </span>
                          </div>
                        ))}
                      {subHeaderRowCount - 1 < getUniqueRows(name).length && (
                        <div
                          className={cn(
                            "group/othersRow flex items-center justify-between rounded p-1 text-xs font-medium text-foreground-muted",
                            "bg-transparent hover:bg-background-secondary hover:text-accent-brand-off-white"
                          )}
                        >
                          <span
                            className={`group-hover/othersRow:text-accent-brand-off-white text-foreground-muted`}
                          >
                            Others(
                            {getUniqueRows(name).length -
                              subHeaderRowCount +
                              1 <
                            0
                              ? 0
                              : getUniqueRows(name).length -
                                subHeaderRowCount +
                                1}
                            )
                          </span>
                          <span
                            className={`group-hover/othersRow:text-accent-brand-off-white text-foreground-muted `}
                          >
                            {(
                              100 -
                              (getUniqueRows(name)?.slice(
                                0,
                                subHeaderRowCount -
                                  (getNullCount(name) > 0 ? 2 : 1)
                              ).length *
                                100) /
                                getUniqueRows(name).length
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {!resizingSubHeader && hoveredSubHeaderColNum == colIdx && (
                    <div
                      className="absolute bottom-0 left-0 h-[4px] w-full cursor-row-resize bg-[#a184dc]"
                      onMouseDown={handleMouseDown}
                    />
                  )}
                  {resizingSubHeader && (
                    <div
                      className={`absolute -left-px z-30 h-1 cursor-row-resize bg-[#a184dc] transition`}
                      style={{
                        bottom:
                          (subHeaderRef?.current?.getBoundingClientRect()
                            .bottom ?? 0) - currentY,
                        width: "calc(100% + 2px)",
                      }}
                    />
                  )}
                </div>
                {/* tablecells */}
                {tableData.map((row, index) =>
                  imageFeatures.find((f) => f.name == name) ? (
                    <div
                      key={index}
                      onMouseEnter={() => setHoveredColNum(colIdx)}
                      onMouseLeave={() => setHoveredColNum(-1)}
                      onClick={() => handleCellClick(index)}
                      className={cn(
                        "relative z-0 h-[120px] overflow-hidden border-x-0 border-b border-t-0 border-border-muted bg-background-solid object-contain p-2 text-base text-foreground-muted",
                        row[name] == null && "text-slate-300",
                        sessionInteractionEnabled && "cursor-pointer"
                      )}
                    >
                      <div className="relative mx-auto flex h-full w-[90px] flex-col items-center justify-center rounded-lg object-contain">
                        {row[name] &&
                        row[name] !== "none" &&
                        (row[name].startsWith("/") ||
                          row[name].startsWith("http")) ? (
                          <div
                            ref={(node) =>
                              observeImageContainer(node, row["item_id"])
                            }
                            className="size-full relative"
                          >
                            {!imagesInView.has(row["item_id"]?.toString()) ? (
                              <ImageSkeleton className="size-full overflow-hidden rounded-lg object-contain" />
                            ) : imageLoaded[row["item_id"]] == undefined ? (
                              <ImageSkeleton className="size-full overflow-hidden rounded-lg object-contain" />
                            ) : imageLoaded[row["item_id"]] == "Loading" ||
                              imageLoaded[row["item_id"]] == "Loaded" ? (
                              <>
                                <Image
                                  src={row[name]}
                                  alt=""
                                  fill
                                  sizes="90px"
                                  className="rounded-lg object-contain"
                                  onError={() =>
                                    handleImageError(row["item_id"])
                                  }
                                  onLoad={() => handleImageLoad(row["item_id"])}
                                />

                                {imageLoaded[row["item_id"]] == "Loading" && (
                                  <ImageSkeleton className="size-full absolute overflow-hidden rounded-lg object-contain" />
                                )}
                              </>
                            ) : (
                              <div className="size-full flex flex-col items-center justify-center gap-1 rounded-lg bg-gray-100 text-center">
                                <ImageIcon className="size-1/4 text-gray-400" />
                                <span className="text-[10px] font-medium">
                                  Image not found
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="size-full flex flex-col items-center justify-center gap-1 rounded-lg bg-gray-100 text-center">
                            <ImageIcon className="size-1/4 text-gray-400" />
                            <span className="text-[10px] font-medium">
                              No image URL
                            </span>
                          </div>
                        )}
                      </div>
                      {imageLoaded[row["item_id"]] == "Loaded" && (
                        <div className="absolute bottom-2 right-2">
                          <TableCellDetailsModal
                            value={row[name]}
                            colName={name}
                            isImage={true}
                            iconClass="size-4 text-[#D1D5DB]"
                            triggerClassName="bg-transparent border-0 p-0 shadow-none hover:bg-transparent flex items-center gap-1 text-xs font-medium text-[#8559E0]"
                            className="h-[80vh]"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      key={index}
                      onClick={() => {
                        handleCellClick(index)
                        setShowCellOptions((prev) => !prev)
                      }}
                      onMouseLeave={() => {
                        setShowCellOptions(false)
                        setHoveredCell({ colNum: -1, rowNum: -1 })
                        setShowDetailsIcon(false)
                        setHoveredColNum(-1)
                      }}
                      onMouseEnter={() => {
                        setShowCellOptions((prev) => !prev)
                        setHoveredCell({
                          colNum: colIdx + 1,
                          rowNum: index + 2,
                        })
                        setShowDetailsIcon(true)
                        setHoveredColNum(colIdx)
                      }}
                      className={cn(
                        "relative h-[120px] border-x-0 border-b border-t-0 border-border-muted bg-background-solid text-base   text-foreground",
                        row[name] == null && "text-slate-300",
                        sessionInteractionEnabled && "cursor-pointer"
                      )}
                    >
                      <div className="size-full flex items-center justify-between px-3 py-2">
                        <div className="size-full relative flex max-w-[75%] items-center justify-center">
                          {Array.isArray(row[name]) ? (
                            <span className="w-full truncate">
                              {JSON.stringify(row[name])}
                            </span>
                          ) : typeof row[name] === "object" &&
                            row[name] !== null ? (
                            <span className="w-full truncate">
                              {JSON.stringify(row[name], null, 2)}
                            </span>
                          ) : (
                            <span
                              onMouseEnter={() => {
                                if (name == "score") {
                                  setHoveredCell({
                                    colNum: colIdx + 1,
                                    rowNum: index + 2,
                                  })
                                  setShowScoreDetails(true)
                                }
                              }}
                              onMouseLeave={() => {
                                if (name == "score") {
                                  setHoveredCell({
                                    colNum: -1,
                                    rowNum: -1,
                                  })
                                  setShowScoreDetails(false)
                                }
                              }}
                              className="w-full truncate"
                            >
                              {row[name] == null
                                ? "null"
                                : row[name] === true || row[name] === false
                                ? row[name].toString()
                                : row[name]}
                            </span>
                          )}
                        </div>
                        {showDetailsIcon &&
                          hoveredCell.colNum == colIdx + 1 &&
                          hoveredCell.rowNum == index + 2 && (
                            <TableCellDetailsModal
                              value={
                                Array.isArray(row[name])
                                  ? JSON.stringify(row[name])
                                  : typeof row[name] === "object" &&
                                    row[name] !== null
                                  ? JSON.stringify(row[name], null, 2)
                                  : row[name] == null
                                  ? "null"
                                  : row[name] === true || row[name] === false
                                  ? row[name].toString()
                                  : row[name]
                              }
                              colName={name || ""}
                              iconName="maximize2"
                              setShowDetailsIcon={setShowDetailsIcon}
                            />
                          )}
                      </div>

                      {hoveredCell.colNum == colIdx + 1 &&
                        hoveredCell.rowNum == index + 2 &&
                        name.toLowerCase() == "score" &&
                        (queryStep == 2 ||
                          (scoringPolicyNames &&
                            scoringPolicyNames.length > 0)) &&
                        showScoreDetails && (
                          <TableCellScoreDetailsModal
                            colIdx={colIdx}
                            setHoveredCell={setHoveredCell}
                            setShowScoreDetails={setShowScoreDetails}
                            index={index}
                            handleShowRankConfig={handleShowRankConfig}
                            scores={
                              scoringPolicyNames?.map((name) => ({
                                model: name,
                                value: row[name],
                              })) ?? []
                            }
                            retrieverScores={Object.entries(
                              searchScoresBreakdown?.[index] ?? {}
                            ).map(([name, val]) => ({
                              retriever: name,
                              value: val,
                            }))}
                          />
                        )}
                    </div>
                  )
                )}
                {tableData.length == 0 && colIdx == 0 && (
                  <div
                    className="mr-2 flex w-full flex-1 items-center justify-center "
                    style={{ width: `600px` }}
                  >
                    No matching results found
                  </div>
                )}
                {
                  <div
                    className="z-9999 absolute right-0 top-0 h-full w-[6px] cursor-col-resize"
                    onMouseEnter={() => setHoveredColNum(colIdx)}
                    onMouseLeave={() => setHoveredColNum(-1)}
                    onMouseDown={(e) => handleColumnMouseDown(e, colIdx, name)}
                  />
                }

                {resizingColNum == colIdx && (
                  <div
                    className={`z-9901 absolute top-0 h-full w-1 bg-[#a184dc] transition
        `}
                    style={{
                      right:
                        (columnRefs.current?.[colIdx]?.getBoundingClientRect()
                          .right ?? 0) - currentX,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
