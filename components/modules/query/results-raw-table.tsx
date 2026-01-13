"use client"

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { QueryResultRow } from "@/lib/types/query.types"
import { useMemo, useState } from "react"
import { ArrowUpDown, ListFilter, Copy, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import copyToClipboard from "@/utils/copy-to-clipboard"
import { cn } from "@/lib/utils"

interface ResultsRawTableProps {
  data: QueryResultRow[]
  columns: string[]
}

export function ResultsRawTable({ data, columns }: ResultsRawTableProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCellValue, setSelectedCellValue] = useState<string>("")
  const [copied, setCopied] = useState(false)
  const [selectedCellId, setSelectedCellId] = useState<string | null>(null)

  const handleCellDoubleClick = (value: string) => {
    setSelectedCellValue(value)
    setIsModalOpen(true)
    setCopied(false)
  }

  const handleCopy = () => {
    copyToClipboard(selectedCellValue)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const handleCellClick = (cellId: string) => {
    setSelectedCellId((prev) => (prev === cellId ? null : cellId))
  }

  const hasScore = useMemo(
    () => data?.some((item: any) => item.score !== undefined),
    [data]
  )

  const filteredColumns = useMemo(() => {
    if (hasScore) {
      return columns
    }
    return columns.filter((col) => col !== "score")
  }, [columns, hasScore])

  const tableColumns: ColumnDef<QueryResultRow>[] = useMemo(
    () =>
      filteredColumns.map((col) => ({
        accessorKey: col,
        header: col,
        cell: ({ getValue }) => {
          const value = getValue()
          return (
            <span className="block w-full truncate text-sm">
              {String(value ?? "")}
            </span>
          )
        },
      })),
    [filteredColumns]
  )

  const columnTypeMap = useMemo(() => {
    const map: Record<string, string> = {}
    filteredColumns.forEach((col) => {
      let detected: string | null = null
      for (const row of data) {
        const cellValue = row?.[col as keyof QueryResultRow]
        if (cellValue === null || cellValue === undefined) {
          continue
        }
        if (Array.isArray(cellValue)) {
          detected = "array"
          break
        }
        const typeOfValue = typeof cellValue
        if (typeOfValue === "number") {
          detected = Number.isInteger(cellValue as number)
            ? "integer"
            : "number"
        } else if (typeOfValue === "boolean") {
          detected = "boolean"
        } else if (typeOfValue === "object") {
          detected = "object"
        } else if (typeOfValue === "string") {
          detected = "string"
        } else if (typeOfValue === "bigint") {
          detected = "bigint"
        } else {
          detected = typeOfValue
        }
        if (detected) break
      }
      map[col] = (detected ?? "unknown").toUpperCase()
    })
    return map
  }, [filteredColumns, data])

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  })
  const rowCount = data.length
  const columnCount = filteredColumns.length

  return (
    <section className="flex h-full flex-col overflow-hidden border-0 border-border bg-background-primary shadow-sm">
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className="overflow-x-auto overflow-y-auto"
          style={{ height: "calc(100vh-130px" }}
        >
          <Table
            className="w-full border-collapse"
            style={{ minWidth: "100%" }}
          >
            <TableHeader className="sticky top-0 z-10 bg-background-base">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-none">
                  {headerGroup.headers.map((header) => {
                    const headerLabel = header.column.columnDef.header
                    return (
                      <TableHead
                        key={header.id}
                        className="bg-background-base px-4 py-3"
                        style={{
                          width: "250px",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold leading-5 text-foreground">
                            {flexRender(headerLabel, header.getContext())}
                          </p>
                        </div>
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columnCount || 1}
                    className="bg-background-primary px-4 py-6 text-center text-sm font-medium text-foreground-muted"
                  >
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="bg-background-solid transition-colors hover:bg-background-secondary"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const renderedCell = flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )

                      const cellValue = cell.getValue()
                      const cellText = String(cellValue ?? "")
                      const isSelected = selectedCellId === cell.id

                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            "cursor-pointer border px-4 py-3 font-mono text-sm leading-6 text-foreground",
                            isSelected
                              ? "border-2 border-accent-brand-purple"
                              : "border-border"
                          )}
                          style={{
                            minWidth: "100px",
                            width: "250px",
                            maxWidth: "250px",
                          }}
                          onClick={() => handleCellClick(cell.id)}
                          onDoubleClick={() => handleCellDoubleClick(cellText)}
                        >
                          <div
                            className="w-full truncate"
                            title={cellText}
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {renderedCell}
                          </div>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl border-border-muted bg-background-primary">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-foreground">
              <span>Cell Value</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-foreground-muted transition-colors hover:bg-background-secondary hover:text-foreground"
              >
                {copied ? (
                  <>
                    <Check className="size-4" strokeWidth={1.5} />
                    <span className="text-sm">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-4" strokeWidth={1.5} />
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-hidden rounded-md border border-border-muted bg-background-base p-4">
            <pre
              className="wrap-break-word max-h-[400px] w-full overflow-auto whitespace-pre-wrap font-mono text-sm text-foreground"
              style={{
                wordBreak: "break-word",
                overflowWrap: "break-word",
                whiteSpace: "pre-wrap",
                maxWidth: "100%",
                minWidth: 0,
              }}
            >
              {selectedCellValue}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
