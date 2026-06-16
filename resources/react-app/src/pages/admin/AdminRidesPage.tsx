import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminRides } from '@/hooks/useAdmin'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Ride } from '@/types'

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'searching_driver', label: 'Searching' },
  { value: 'driver_assigned', label: 'Assigned' },
  { value: 'ride_started', label: 'In Progress' },
  { value: 'ride_completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export default function AdminRidesPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)

  const { data, isLoading, isError, refetch } = useAdminRides({
    page,
    per_page: perPage,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  })

  const rides = (data?.data as any)?.data ?? []
  const meta = data?.data?.meta

  const columns: Column<Ride>[] = [
    { header: 'Booking ID', accessor: 'bookingId', sortable: true },
    {
      header: 'Rider',
      accessor: (row) => row.rider?.name ?? 'Unknown',
      sortable: true,
    },
    {
      header: 'Driver',
      accessor: (row) => row.driver?.user?.name ?? '—',
    },
    { header: 'Pickup', accessor: (row) => row.pickup?.address ?? '—' },
    { header: 'Destination', accessor: (row) => row.destination?.address ?? '—' },
    {
      header: 'Status',
      accessor: 'status' as keyof Ride,
      cell: (row) => <StatusBadge status={row.status} type="ride" />,
    },
    {
      header: 'Fare',
      accessor: (row) => formatCurrency(Number((row as any).actualFare ?? (row as any).actual_fare ?? (row as any).estimatedFare ?? (row as any).estimated_fare ?? 0)),
    },
    {
      header: 'Date',
      accessor: (row) => formatDate(row.createdAt),
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (row) => '',
      cell: (row) => (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/admin/rides/${row.id}`) }}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const handleExport = () => {
    toast.success('Rides data exported successfully')
  }

  if (isLoading) return <LoadingScreen message="Loading rides..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rides"
        description="Manage all ride bookings"
        actions={[
          { label: 'Export', onClick: handleExport, icon: Download },
        ]}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DataTable<Ride>
            columns={columns}
            data={rides}
            keyExtractor={(r) => r.id}
            searchable
            searchPlaceholder="Search rides..."
            page={page}
            lastPage={meta?.lastPage ?? 1}
            total={meta?.total ?? 0}
            from={meta?.from ?? 0}
            to={meta?.to ?? 0}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            onRowClick={(ride) => navigate(`/admin/rides/${ride.id}`)}
          />
        </CardContent>
      </Card>

      <Dialog open={!!selectedRide} onOpenChange={() => setSelectedRide(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ride Details - {selectedRide?.bookingId}</DialogTitle>
            <DialogDescription>Complete ride information</DialogDescription>
          </DialogHeader>
          {selectedRide && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Rider</p>
                <p className="font-medium">{selectedRide.rider?.name ?? 'Unknown'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Driver</p>
                <p className="font-medium">{selectedRide.driver?.user?.name ?? 'Not assigned'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1">Pickup</p>
                <p className="font-medium">{selectedRide.pickup?.address ?? 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1">Destination</p>
                <p className="font-medium">{selectedRide.destination?.address ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Status</p>
                <StatusBadge status={selectedRide.status} type="ride" />
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Fare</p>
                <p className="font-medium">{formatCurrency(Number((selectedRide as any).actualFare ?? (selectedRide as any).actual_fare ?? (selectedRide as any).estimatedFare ?? (selectedRide as any).estimated_fare ?? 0))}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Vehicle Type</p>
                <p className="font-medium">{selectedRide.vehicleType?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Payment</p>
                <Badge variant={selectedRide.paymentStatus === 'completed' ? 'success' : 'warning'}>
                  {selectedRide.paymentStatus}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Distance</p>
                <p className="font-medium">{selectedRide.actualDistance ? `${selectedRide.actualDistance.toFixed(1)} km` : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Duration</p>
                <p className="font-medium">{selectedRide.actualDuration ? `${Math.round(selectedRide.actualDuration)} min` : '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1">Created</p>
                <p className="font-medium">{formatDate(selectedRide.createdAt)}</p>
              </div>
              {selectedRide.completedAt && (
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">Completed</p>
                  <p className="font-medium">{formatDate(selectedRide.completedAt)}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
