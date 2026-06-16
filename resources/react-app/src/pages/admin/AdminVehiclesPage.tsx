import { useState } from 'react'
import { CheckCircle, XCircle, PauseCircle, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminVehicles, useApproveVehicle, useRejectVehicle, useSuspendVehicle } from '@/hooks/useAdmin'
import { formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent } from '@/components/ui/card'

interface VehicleRow {
  id: string
  driver: { id: string; user?: { name: string; email: string } }
  make: string
  model: string
  year: number
  licensePlate: string
  license_plate?: string
  status: string
  color: string
  vehicleType?: { name: string }
  vehicle_class?: string
  isActive?: boolean
}

export default function AdminVehiclesPage() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRow | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | 'suspend'
    vehicle: VehicleRow
  } | null>(null)

  const { data, isLoading, isError, refetch } = useAdminVehicles({
    page,
    per_page: perPage,
    ...(statusFilter ? { status: statusFilter } : {}),
  })

  const approveVehicle = useApproveVehicle()
  const rejectVehicle = useRejectVehicle()
  const suspendVehicle = useSuspendVehicle()

  const response = data?.data as any
  const vehicles: VehicleRow[] = response?.data ?? []
  const meta = response?.meta ?? { currentPage: 1, lastPage: 1, perPage: 10, total: 0 }

  const handleConfirm = async () => {
    if (!confirmAction) return
    try {
      if (confirmAction.type === 'approve') {
        await approveVehicle.mutateAsync(confirmAction.vehicle.id)
        toast.success('Vehicle approved')
      } else if (confirmAction.type === 'reject') {
        await rejectVehicle.mutateAsync(confirmAction.vehicle.id)
        toast.success('Vehicle rejected')
      } else {
        await suspendVehicle.mutateAsync(confirmAction.vehicle.id)
        toast.success('Vehicle suspended')
      }
    } catch {
      toast.error('Action failed')
    }
    setConfirmAction(null)
  }

  const columns: Column<VehicleRow>[] = [
    {
      header: 'Vehicle',
      accessor: (row) => `${row.make ?? ''} ${row.model ?? ''}`.trim() || '—',
      cell: (row) => (
        <div>
          <p className="font-medium">{row.make} {row.model}</p>
          <p className="text-xs text-muted-foreground">{row.year}</p>
        </div>
      ),
    },
    {
      header: 'Driver',
      accessor: (row) => row.driver?.user?.name ?? '—',
    },
    {
      header: 'License Plate',
      accessor: (row) => row.licensePlate ?? row.license_plate ?? '—',
    },
    {
      header: 'Type',
      accessor: (row) => row.vehicleType?.name ?? row.vehicle_class ?? '—',
    },
    { header: 'Color', accessor: (row) => row.color ?? '—' },
    {
      header: 'Status',
      accessor: 'status' as keyof VehicleRow,
      cell: (row) => <StatusBadge status={row.status} type="vehicle" />,
    },
    {
      header: 'Actions',
      accessor: (row) => '',
      cell: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => setSelectedVehicle(row)}>
            <Eye className="h-4 w-4" />
          </Button>
          {row.status === 'pending' && (
            <>
              <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ type: 'approve', vehicle: row })}>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ type: 'reject', vehicle: row })}>
                <XCircle className="h-4 w-4 text-red-500" />
              </Button>
            </>
          )}
          {row.status !== 'maintenance' && row.status !== 'rejected' && (
            <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ type: 'suspend', vehicle: row })}>
              <PauseCircle className="h-4 w-4 text-amber-500" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  if (isLoading) return <LoadingScreen message="Loading vehicles..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader title="Vehicles" description="Manage driver vehicles" />

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 mb-4">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable<VehicleRow>
            columns={columns}
            data={vehicles}
            keyExtractor={(v) => v.id}
            page={page}
            lastPage={meta?.lastPage ?? 1}
            total={meta?.total ?? 0}
            from={meta?.from ?? 0}
            to={meta?.to ?? 0}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            onRowClick={(v) => setSelectedVehicle(v)}
          />
        </CardContent>
      </Card>

      <Dialog open={!!selectedVehicle} onOpenChange={() => setSelectedVehicle(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Vehicle Details</DialogTitle>
            <DialogDescription>Vehicle and document information</DialogDescription>
          </DialogHeader>
          {selectedVehicle && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-muted-foreground">Make</p><p className="font-medium">{selectedVehicle.make}</p></div>
                <div><p className="text-muted-foreground">Model</p><p className="font-medium">{selectedVehicle.model}</p></div>
                <div><p className="text-muted-foreground">Year</p><p className="font-medium">{selectedVehicle.year}</p></div>
                <div><p className="text-muted-foreground">Color</p><p className="font-medium">{selectedVehicle.color}</p></div>
                <div><p className="text-muted-foreground">Plate</p><p className="font-medium">{selectedVehicle.licensePlate ?? selectedVehicle.license_plate}</p></div>
                <div><p className="text-muted-foreground">Status</p><StatusBadge status={selectedVehicle.status} type="vehicle" /></div>
              </div>
              <Accordion type="single" collapsible>
                <AccordionItem value="documents">
                  <AccordionTrigger>Documents</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">Vehicle documents will appear here when uploaded.</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={`${confirmAction?.type === 'approve' ? 'Approve' : confirmAction?.type === 'reject' ? 'Reject' : 'Suspend'} Vehicle`}
        description={`Are you sure?`}
        confirmText={confirmAction?.type ?? ''}
        variant={confirmAction?.type === 'approve' ? 'default' : 'destructive'}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
