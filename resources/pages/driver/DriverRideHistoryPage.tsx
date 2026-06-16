import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Eye, Calendar, ArrowUpDown, Filter,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { getRideHistory } from '@/api/drivers'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { DataTable } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import type { RideBrief, Ride } from '@/types'

const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'ride_completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function DriverRideHistoryPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const params = useMemo(
    () => ({
      page,
      per_page: perPage,
      ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
      ...(dateFrom && { from: dateFrom }),
      ...(dateTo && { to: dateTo }),
    }),
    [page, perPage, statusFilter, dateFrom, dateTo]
  )

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['driver', 'rides', 'history', params],
    queryFn: () => getRideHistory(params),
  })

  const response = data?.data
  const rides = (response?.data ?? []) as RideBrief[]
  const meta = response?.meta ?? { currentPage: 1, lastPage: 1, total: 0, perPage: 10, from: 0, to: 0 }

  const columns = [
    {
      header: 'Booking ID',
      accessor: 'bookingId' as keyof RideBrief,
      sortable: true,
    },
    {
      header: 'Date',
      accessor: (row: RideBrief) => formatDate(row.createdAt),
      sortable: true,
    },
    {
      header: 'Pickup',
      accessor: (row: RideBrief) => (
        <span className="truncate max-w-[200px] block">{row.pickup?.address}</span>
      ),
    },
    {
      header: 'Destination',
      accessor: (row: RideBrief) => (
        <span className="truncate max-w-[200px] block">{row.destination?.address}</span>
      ),
    },
    {
      header: 'Fare',
      accessor: (row: RideBrief) => formatCurrency(row.actualFare ?? row.estimatedFare),
      sortable: true,
    },
    {
      header: 'Status',
      accessor: (row: RideBrief) => <StatusBadge status={row.status} type="ride" />,
      sortable: true,
    },
    {
      header: '',
      accessor: (row: RideBrief) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedRide(row as unknown as Ride)
            setDetailOpen(true)
          }}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
      ),
    },
  ]

  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader title="Ride History" description="View all your completed and cancelled rides" />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className="w-40 h-9"
                placeholder="From"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className="w-40 h-9"
                placeholder="To"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <DataTable
        columns={columns}
        data={rides}
        isLoading={isLoading}
        keyExtractor={(row: RideBrief) => row.id}
        page={meta.currentPage}
        lastPage={meta.lastPage}
        total={meta.total}
        from={meta.from}
        to={meta.to}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(pp) => { setPerPage(pp); setPage(1) }}
        searchable
        searchPlaceholder="Search by booking ID..."
        emptyMessage="No rides found"
      />

      {/* Ride Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ride Details</DialogTitle>
            <DialogDescription>
              Booking ID: {selectedRide?.bookingId}
            </DialogDescription>
          </DialogHeader>
          {selectedRide && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={selectedRide.status} type="ride" />
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pickup</p>
                <p className="font-medium">{selectedRide.pickup?.address}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Destination</p>
                <p className="font-medium">{selectedRide.destination?.address}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Distance</p>
                  <p className="font-medium">{selectedRide.actualDistance ?? selectedRide.estimatedDistance ?? 'N/A'} km</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="font-medium">{selectedRide.actualDuration ?? selectedRide.estimatedDuration ?? 'N/A'} min</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fare</p>
                  <p className="font-bold text-lg">{formatCurrency(selectedRide.actualFare ?? selectedRide.estimatedFare)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment</p>
                  <p className="font-medium capitalize">{selectedRide.paymentMethod ?? 'N/A'}</p>
                </div>
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground">
                <p>Created: {formatDate(selectedRide.createdAt)}</p>
                {selectedRide.completedAt && <p>Completed: {formatDate(selectedRide.completedAt)}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
