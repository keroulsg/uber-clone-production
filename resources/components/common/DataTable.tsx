import { useState, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUpDown, ArrowUp, ArrowDown, Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { PAGINATION } from '@/lib/constants'

export interface Column<T> {
  header: string
  accessor: string | ((row: T) => React.ReactNode)
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  emptyAction?: React.ReactNode
  searchable?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
  page?: number
  lastPage?: number
  total?: number
  from?: number
  to?: number
  perPage?: number
  onPageChange?: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  onRowClick?: (row: T) => void
  keyExtractor: (row: T) => string | number
}

function SkeletonRow({ columns }: { columns: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton className={cn('h-4', i === 0 ? 'w-3/4' : 'w-1/2')} />
        </td>
      ))}
    </tr>
  )
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No results found.',
  emptyAction,
  searchable,
  searchPlaceholder = 'Search...',
  onSearch,
  page = 1,
  lastPage = 1,
  total = 0,
  from = 0,
  to = 0,
  perPage = PAGINATION.DEFAULT_PER_PAGE,
  onPageChange,
  onPerPageChange,
  onRowClick,
  keyExtractor,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchQuery, setSearchQuery] = useState('')

  const handleSort = (accessor: string | ((row: T) => React.ReactNode)) => {
    const key = typeof accessor === 'string' ? accessor : null
    if (!key) return
    if (sortColumn === key) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(key)
      setSortDirection('asc')
    }
  }

  const sortedData = useMemo(() => {
    if (!sortColumn) return data
    return [...data].sort((a, b) => {
      const aVal = (a as any)[sortColumn]
      const bVal = (b as any)[sortColumn]
      if (aVal == null) return 1
      if (bVal == null) return -1
      const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal
      return sortDirection === 'asc' ? cmp : -cmp
    })
  }, [data, sortColumn, sortDirection])

  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = []
    const delta = 2
    const rangeStart = Math.max(1, page - delta)
    const rangeEnd = Math.min(lastPage, page + delta)

    if (rangeStart > 1) {
      pages.push(1)
      if (rangeStart > 2) pages.push('ellipsis')
    }
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i)
    }
    if (rangeEnd < lastPage) {
      if (rangeEnd < lastPage - 1) pages.push('ellipsis')
      pages.push(lastPage)
    }
    return pages
  }, [page, lastPage])

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              onSearch?.(e.target.value)
            }}
            className="pl-9 h-9"
          />
        </div>
      )}

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="bg-muted/50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.header}
                    className={cn(
                      'h-10 px-4 text-left align-middle font-medium text-muted-foreground',
                      col.sortable && 'cursor-pointer select-none hover:text-foreground',
                      col.className
                    )}
                    onClick={() => col.sortable && handleSort(col.accessor)}
                  >
                    <div className="flex items-center gap-1">
                      {col.header}
                      {col.sortable && (
                        <span className="inline-flex">
                          {sortColumn === col.accessor ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} columns={columns.length} />
                ))
              ) : sortedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Search className="h-8 w-8" />
                      <p>{emptyMessage}</p>
                      {emptyAction}
                    </div>
                  </td>
                </tr>
              ) : (
                sortedData.map((row) => (
                  <tr
                    key={keyExtractor(row)}
                    className={cn(
                      'border-b transition-colors hover:bg-muted/50',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((col) => (
                      <td key={col.header} className={cn('p-4 align-middle', col.className)}>
                        {col.cell
                          ? col.cell(row)
                          : typeof col.accessor === 'function'
                            ? col.accessor(row)
                            : (row as any)[col.accessor] as React.ReactNode}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {onPageChange && (
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Showing</span>
            <span className="font-medium">{from}</span>
            <span>to</span>
            <span className="font-medium">{to}</span>
            <span>of</span>
            <span className="font-medium">{total}</span>
            {onPerPageChange && (
              <>
                <span className="ml-2">per page</span>
                <Select
                  value={String(perPage)}
                  onValueChange={(v) => onPerPageChange(Number(v))}
                >
                  <SelectTrigger className="h-8 w-16">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGINATION.PER_PAGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={String(opt)}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => onPageChange(1)}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {pageNumbers.map((p, i) =>
              p === 'ellipsis' ? (
                <span key={`e${i}`} className="px-2 text-muted-foreground">...</span>
              ) : (
                <Button
                  key={p}
                  variant={p === page ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onPageChange(p)}
                >
                  {p}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= lastPage}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= lastPage}
              onClick={() => onPageChange(lastPage)}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
