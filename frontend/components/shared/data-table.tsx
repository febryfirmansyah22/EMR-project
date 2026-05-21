import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  isLoading?: boolean
  emptyMessage?: string
  pagination?: {
    page: number
    lastPage: number
    total: number
    onPageChange: (page: number) => void
  }
  onRowClick?: (row: T) => void
}

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span className={cn('material-symbols-outlined', className)} aria-hidden="true">
      {name}
    </span>
  )
}

export function DataTable<T extends { id: number }>({
  data,
  columns,
  isLoading,
  emptyMessage = 'Tidak ada data.',
  pagination,
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-1.5">
        {/* Header skeleton */}
        <Skeleton className="h-10 w-full rounded-t-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Table — horizontal scroll on small screens */}
      <div className="overflow-x-auto rounded-lg border border-[#c3c6d6]">
        <table className="w-full min-w-[640px] text-left text-[14px]">
          {/* Header — blue-tinted bg, uppercase small text */}
          <thead>
            <tr className="border-b border-[#c3c6d6] bg-[#f1f3ff]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#434654]',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-32 text-center text-[13px] text-[#737685]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-[#c3c6d6] last:border-0 transition-colors',
                    /* Zebra striping */
                    rowIdx % 2 === 0 ? 'bg-white' : 'bg-[#F4F5F7]',
                    /* Row hover */
                    onRowClick && 'cursor-pointer hover:bg-[#EBF4FF]',
                    /* Non-clickable rows still get hover */
                    !onRowClick && 'hover:bg-[#EBF4FF]'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'h-12 px-4 py-2.5 text-[14px] text-[#041b3c]',
                        col.className
                      )}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.lastPage > 1 && (
        <div className="flex items-center justify-between text-[13px] text-[#737685]">
          <span>
            Total{' '}
            <span className="font-semibold text-[#041b3c]">{pagination.total}</span> data
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              <Icon name="chevron_left" className="text-[18px]" />
            </Button>
            <span className="min-w-[6rem] text-center text-[13px] font-medium text-[#091E42]">
              {pagination.page} / {pagination.lastPage}
            </span>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={pagination.page >= pagination.lastPage}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              <Icon name="chevron_right" className="text-[18px]" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
