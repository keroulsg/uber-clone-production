import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle, XCircle, PauseCircle, Eye, MoreHorizontal, Plus, PlayCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAdminDrivers, useApproveDriver, useRejectDriver, useSuspendDriver, useReactivateDriver, useCreateDriver } from '@/hooks/useAdmin'
import { useVehicleTypes } from '@/hooks/useVehicles'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Driver } from '@/types'

export default function AdminDriversPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [statusFilter, setStatusFilter] = useState('')
  const [onlineFilter, setOnlineFilter] = useState('')
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [createDialog, setCreateDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'approve' | 'reject' | 'suspend' | 'reactivate'
    driver: Driver
  } | null>(null)

  // Create driver form state
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', gender: '', dateOfBirth: '', address: '',
    vehicleTypeId: '', vehicleMake: '', vehicleModel: '', vehicleYear: '', vehiclePlate: '', vehicleColor: '', vehicleClass: 'basic',
  })
  const [files, setFiles] = useState<Record<string, File>>({})

  const { data, isLoading, isError, refetch } = useAdminDrivers({
    page,
    per_page: perPage,
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(onlineFilter ? { is_online: onlineFilter === 'online' } : {}),
  })

  const approveDriver = useApproveDriver()
  const rejectDriver = useRejectDriver()
  const suspendDriver = useSuspendDriver()
  const reactivateDriver = useReactivateDriver()
  const createDriver = useCreateDriver()
  const { data: vehicleTypesData } = useVehicleTypes()
  const vehicleTypes = (vehicleTypesData as any)?.data ?? []

  const response = data?.data as any
  const drivers = response?.data ?? []
  const meta = response?.meta ?? { currentPage: 1, lastPage: 1, perPage: 10, total: 0, from: 0, to: 0 }

  const handleConfirm = async () => {
    if (!confirmAction) return
    try {
      if (confirmAction.type === 'approve') {
        await approveDriver.mutateAsync(confirmAction.driver.id)
        toast.success('Driver approved')
      } else if (confirmAction.type === 'reject') {
        await rejectDriver.mutateAsync({ id: confirmAction.driver.id, reason: 'Rejected by admin' })
        toast.success('Driver rejected')
      } else if (confirmAction.type === 'suspend') {
        await suspendDriver.mutateAsync(confirmAction.driver.id)
        toast.success('Driver suspended')
      } else {
        await reactivateDriver.mutateAsync(confirmAction.driver.id)
        toast.success('Driver reactivated')
      }
    } catch {
      toast.error('Action failed')
    }
    setConfirmAction(null)
  }

  const handleCreateDriver = async () => {
    try {
      const fd = new FormData()
      fd.append('name', formData.name)
      fd.append('email', formData.email)
      fd.append('phone', formData.phone)
      fd.append('password', formData.password)
      if (formData.gender) fd.append('gender', formData.gender)
      if (formData.dateOfBirth) fd.append('date_of_birth', formData.dateOfBirth)
      if (formData.address) fd.append('address', formData.address)
      if (formData.vehicleTypeId) fd.append('vehicle_type_id', formData.vehicleTypeId)
      if (formData.vehicleMake) fd.append('vehicle_make', formData.vehicleMake)
      if (formData.vehicleModel) fd.append('vehicle_model', formData.vehicleModel)
      if (formData.vehicleYear) fd.append('vehicle_year', formData.vehicleYear)
      if (formData.vehiclePlate) fd.append('vehicle_plate', formData.vehiclePlate)
      if (formData.vehicleColor) fd.append('vehicle_color', formData.vehicleColor)
      fd.append('vehicle_class', formData.vehicleClass)
      Object.entries(files).forEach(([key, file]) => fd.append(key, file))

      await createDriver.mutateAsync(fd)
      toast.success('Driver created successfully')
      setCreateDialog(false)
      setFormData({ name: '', email: '', phone: '', password: '', gender: '', dateOfBirth: '', address: '', vehicleTypeId: '', vehicleMake: '', vehicleModel: '', vehicleYear: '', vehiclePlate: '', vehicleColor: '', vehicleClass: 'basic' })
      setFiles({})
    } catch {
      toast.error('Failed to create driver')
    }
  }

  const columns: Column<Driver>[] = [
    {
      header: 'Name',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.user?.avatarUrl} />
            <AvatarFallback>{getInitials(row.user?.name ?? 'D')}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.user?.name ?? 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">{row.user?.email ?? '—'}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: 'Phone',
      accessor: (row) => row.user?.phone ?? '—',
    },
    {
      header: 'Status',
      accessor: 'status' as keyof Driver,
      cell: (row) => <StatusBadge status={row.status} type="driver" />,
    },
    {
      header: 'Online',
      accessor: (row) => '',
      cell: (row) => (
        <Badge variant={row.isOnline ? 'success' : 'secondary'}>
          {row.isOnline ? 'Online' : 'Offline'}
        </Badge>
      ),
    },
    {
      header: 'Rating',
      accessor: (row) => (Number((row as any).averageRating ?? (row as any).average_rating ?? 0)).toFixed(1),
      sortable: true,
    },
    {
      header: 'Rides',
      accessor: (row) => Number((row as any).totalRides ?? (row as any).total_rides ?? 0),
      sortable: true,
    },
    {
      header: 'Earnings',
      accessor: (row) => formatCurrency(Number((row as any).totalEarnings ?? (row as any).total_earnings ?? 0)),
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (row) => '',
      cell: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => navigate(`/admin/drivers/${row.id}`)}>
            <Eye className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate(`/admin/drivers/${row.id}`)}>
                <Eye className="h-4 w-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              {row.status === 'pending' && (
                <>
                  <DropdownMenuItem onClick={() => setConfirmAction({ type: 'approve', driver: row })}>
                    <CheckCircle className="h-4 w-4 mr-2 text-emerald-500" />
                    Approve
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setConfirmAction({ type: 'reject', driver: row })}>
                    <XCircle className="h-4 w-4 mr-2 text-red-500" />
                    Reject
                  </DropdownMenuItem>
                </>
              )}
              {row.status === 'approved' && (
                <DropdownMenuItem onClick={() => setConfirmAction({ type: 'suspend', driver: row })}>
                  <PauseCircle className="h-4 w-4 mr-2 text-amber-500" />
                  Suspend
                </DropdownMenuItem>
              )}
              {row.status === 'suspended' && (
                <DropdownMenuItem onClick={() => setConfirmAction({ type: 'reactivate', driver: row })}>
                  <PlayCircle className="h-4 w-4 mr-2 text-emerald-500" />
                  Reactivate
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  if (isLoading) return <LoadingScreen message="Loading drivers..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers"
        description="Manage driver registrations and status"
        actions={[
          { label: 'Create Driver', onClick: () => setCreateDialog(true), icon: Plus },
        ]}
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={onlineFilter} onValueChange={setOnlineFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Online status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable<Driver>
            columns={columns}
            data={drivers}
            keyExtractor={(d) => d.id}
            searchable
            searchPlaceholder="Search by name, email..."
            page={page}
            lastPage={meta?.lastPage ?? 1}
            total={meta?.total ?? 0}
            from={meta?.from ?? 0}
            to={meta?.to ?? 0}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            onRowClick={(d) => navigate(`/admin/drivers/${d.id}`)}
          />
        </CardContent>
      </Card>

      {/* Create Driver Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Driver</DialogTitle>
            <DialogDescription>Create a new driver account with vehicle and documents</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div><Label>Email *</Label><Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></div>
                <div><Label>Phone *</Label><Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                <div><Label>Password *</Label><Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div>
                <div><Label>Gender</Label>
                  <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Date of Birth</Label><Input type="date" value={formData.dateOfBirth} onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} /></div>
                <div className="col-span-2"><Label>Address</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Vehicle</h4>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Vehicle Type</Label>
                  <Select value={formData.vehicleTypeId} onValueChange={(v) => setFormData({ ...formData, vehicleTypeId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {vehicleTypes.map((vt: any) => (
                        <SelectItem key={vt.id} value={String(vt.id)}>{vt.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Class</Label>
                  <Select value={formData.vehicleClass} onValueChange={(v) => setFormData({ ...formData, vehicleClass: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Brand</Label><Input value={formData.vehicleMake} onChange={(e) => setFormData({ ...formData, vehicleMake: e.target.value })} /></div>
                <div><Label>Model</Label><Input value={formData.vehicleModel} onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })} /></div>
                <div><Label>Year</Label><Input type="number" value={formData.vehicleYear} onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })} /></div>
                <div><Label>Plate Number</Label><Input value={formData.vehiclePlate} onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })} /></div>
                <div><Label>Color</Label><Input value={formData.vehicleColor} onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })} /></div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Documents</h4>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'identity_front', label: 'National ID Front' },
                  { key: 'identity_back', label: 'National ID Back' },
                  { key: 'license_front', label: 'Driving License Front' },
                  { key: 'license_back', label: 'Driving License Back' },
                  { key: 'criminal_record', label: 'Criminal Record' },
                  { key: 'vehicle_license_front', label: 'Vehicle License Front' },
                  { key: 'vehicle_license_back', label: 'Vehicle License Back' },
                ].map((doc) => (
                  <div key={doc.key}>
                    <Label>{doc.label}</Label>
                    <Input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) setFiles({ ...files, [doc.key]: file })
                    }} />
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={handleCreateDriver} disabled={!formData.name || !formData.email || !formData.phone || !formData.password}>
              Create Driver
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
        title={`${confirmAction?.type === 'approve' ? 'Approve' : confirmAction?.type === 'reject' ? 'Reject' : 'Suspend'} Driver`}
        description={`Are you sure you want to ${confirmAction?.type} ${confirmAction?.driver?.user?.name}?`}
        confirmText={confirmAction?.type === 'approve' ? 'Approve' : confirmAction?.type === 'reject' ? 'Reject' : 'Suspend'}
        variant={confirmAction?.type === 'approve' ? 'default' : 'destructive'}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
