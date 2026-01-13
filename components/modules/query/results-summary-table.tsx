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
import Image from "next/image"
import { Film } from "lucide-react"

interface ResultsSummaryTableProps {
  data: QueryResultRow[]
}

export function ResultsSummaryTable({ data }: ResultsSummaryTableProps) {
  const columns: ColumnDef<QueryResultRow>[] = useMemo(
    () => [
      {
        accessorKey: "poster_url",
        header: "poster_url",
        cell: ({ row }) => (
          <PosterCell
            url={row.original.poster_url}
            title={row.original.movie_title}
          />
        ),
      },
      {
        accessorKey: "item_id",
        header: "item_id",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">{row.original.item_id}</span>
            {row.original.cardinality && (
              <div className="text-xs text-muted-foreground">
                <div>Cardinality {row.original.cardinality}</div>
                {row.original.nulls && <div>Nulls {row.original.nulls}</div>}
                {row.original.duplicates && (
                  <div>Duplicates {row.original.duplicates}</div>
                )}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "movie_title",
        header: "movie_title",
        cell: ({ getValue }) => (
          <span className="text-sm">{String(getValue())}</span>
        ),
      },
      {
        accessorKey: "genre",
        header: "genre",
        cell: ({ getValue }) => {
          const genres = String(getValue()).split(",")
          return (
            <div className="flex flex-col gap-1">
              {genres.map((g, i) => (
                <span key={i} className="text-xs text-muted-foreground">
                  {g.trim()}
                </span>
              ))}
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="max-h-[calc(100vh-200px)] overflow-auto rounded-lg border">
      <Table>
        <TableHeader className="bg-background sticky top-0 z-10 border-b">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="font-semibold">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} className="align-top">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function PosterCell({ url, title }: { url?: string; title?: string }) {
  const [imageError, setImageError] = useState(false)
  const hasValidUrl = url && url.startsWith("http") && !imageError

  if (hasValidUrl) {
    return (
      <div className="relative h-24 w-16 rounded bg-muted">
        <Image
          src={url || "/placeholder.svg"}
          alt={title || "Poster"}
          fill
          className="rounded object-cover"
          onError={() => setImageError(true)}
          sizes="64px"
        />
      </div>
    )
  }

  return (
    <div className="flex h-24 w-16 items-center justify-center rounded bg-muted">
      <Film className="text-muted-foreground/30 h-8 w-8" />
    </div>
  )
}
