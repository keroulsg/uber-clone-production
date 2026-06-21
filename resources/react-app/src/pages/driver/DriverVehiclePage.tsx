import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, Edit, Shield, FileText, Car, Trash, LifeBuoy,
  CheckCircle, XCircle, Clock,
} from 'lucide-react'
import { useVehicles, useVehicleTypes, useRegisterVehicle, useUpdateVehicle, useUploadDocument } from '@/hooks/useVehicles'
import { vehicleRegistrationSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { StatusBadge } from '@/components/common/StatusBadge'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { FileUpload } from '@/components/common/FileUpload'
import type { Vehicle, VehicleType } from '@/types'

type VehicleForm = z.infer<typeof vehicleRegistrationSchema>

export default function DriverVehiclePage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [docUploadVehicle, setDocUploadVehicle] = useState<string | null>(null)

  const { data: vehiclesData, isLoading, error, refetch } = useVehicles()
  const { data: vehicleTypesData } = useVehicleTypes()
  const registerVehicle = useRegisterVehicle()
  const updateVehicle = useUpdateVehicle()
  const uploadDocument = useUploadDocument()

  const vehicles = ((vehiclesData?.data as any)?.vehicles ?? []) as Vehicle[]
  const vehicleTypes = ((vehicleTypesData?.data as any)?.vehicle_types ?? []) as VehicleType[]

  const form = useForm<VehicleForm>({
    resolver: zodResolver(vehicleRegistrationSchema),
    defaultValues: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      licensePlate: '',
      registrationNumber: '',
      vehicleTypeId: '',
      features: [],
    },
  })

  const openAddDialog = () => {
    setEditingVehicle(null)
    form.reset({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      licensePlate: '',
      registrationNumber: '',
      vehicleTypeId: '',
      features: [],
    })
    setDialogOpen(true)
  }

  const openEditDialog = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    form.reset({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      licensePlate: vehicle.licensePlate,
      registrationNumber: vehicle.registrationNumber ?? '',
      vehicleTypeId: vehicle.vehicleType?.id ?? '',
      features: vehicle.features ?? [],
    })
    setDialogOpen(true)
  }

  const handleSubmit = (data: VehicleForm) => {
    if (editingVehicle) {
      updateVehicle.mutate(
        { id: editingVehicle.id, data: data as unknown as Record<string, unknown> },
        { onSuccess: () => setDialogOpen(false) }
      )
    } else {
      registerVehicle.mutate(data as unknown as Record<string, unknown>, {
        onSuccess: () => setDialogOpen(false),
      })
    }
  }

  const handleDocUpload = (vehicleId: string, file: File) => {
    const formData = new FormData()
    formData.append('document', file)
    uploadDocument.mutate({ id: vehicleId, formData })
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'success' as const
      case 'rejected':
        return 'destructive' as const
      case 'pending':
      case 'maintenance':
        return 'warning' as const
      default:
        return 'secondary' as const
    }
  }

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Vehicles"
        description="Manage your registered vehicles"
        actions={[{ label: 'Add Vehicle', icon: Plus, onClick: openAddDialog }]}
      />

      {vehicles.length === 0 ? (
        <EmptyState
          title="No vehicles registered"
          description="Add a vehicle to start accepting rides"
          actionLabel="Add Vehicle"
          onAction={openAddDialog}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Car className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-sm text-muted-foreground">{vehicle.year}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(vehicle.status)}>
                      {vehicle.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(vehicle)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Color</span>
                    <p className="font-medium">{vehicle.color}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">License Plate</span>
                    <p className="font-medium">{vehicle.licensePlate}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type</span>
                    <p className="font-medium">{vehicle.vehicleType?.name ?? '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Registration</span>
                    <p className="font-medium">{vehicle.registrationNumber ?? 'N/A'}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setDocUploadVehicle(docUploadVehicle === vehicle.id ? null : vehicle.id)}
                  >
                    <FileText className="h-4 w-4" />
                    Documents
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground"
                    disabled
                    title="Vehicle removal requires support/admin review"
                  >
                    <LifeBuoy className="h-4 w-4" />
                    Contact Support
                  </Button>
                </div>

                {docUploadVehicle === vehicle.id && (
                  <div className="mt-4 space-y-3">
                    <FileUpload
                      accept="image/*,application/pdf"
                      maxSize={5 * 1024 * 1024}
                      onUpload={(file) => handleDocUpload(vehicle.id, file)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Vehicle Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Register Vehicle'}</DialogTitle>
            <DialogDescription>
              {editingVehicle ? 'Update your vehicle information' : 'Add a new vehicle to your fleet'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input id="make" {...form.register('make')} placeholder="e.g. Toyota" />
                {form.formState.errors.make && (
                  <p className="text-xs text-destructive">{form.formState.errors.make.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" {...form.register('model')} placeholder="e.g. Camry" />
                {form.formState.errors.model && (
                  <p className="text-xs text-destructive">{form.formState.errors.model.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input id="year" type="number" {...form.register('year', { valueAsNumber: true })} />
                {form.formState.errors.year && (
                  <p className="text-xs text-destructive">{form.formState.errors.year.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input id="color" {...form.register('color')} placeholder="e.g. White" />
                {form.formState.errors.color && (
                  <p className="text-xs text-destructive">{form.formState.errors.color.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="licensePlate">License Plate</Label>
                <Input id="licensePlate" {...form.register('licensePlate')} placeholder="ABC 1234" />
                {form.formState.errors.licensePlate && (
                  <p className="text-xs text-destructive">{form.formState.errors.licensePlate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input id="registrationNumber" {...form.register('registrationNumber')} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="vehicleTypeId">Vehicle Type</Label>
                <Select
                  value={form.watch('vehicleTypeId')}
                  onValueChange={(v) => form.setValue('vehicleTypeId', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleTypes.map((vt) => (
                      <SelectItem key={vt.id} value={vt.id}>
                        {vt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.vehicleTypeId && (
                  <p className="text-xs text-destructive">{form.formState.errors.vehicleTypeId.message}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={registerVehicle.isPending || updateVehicle.isPending}>
                {editingVehicle ? 'Update Vehicle' : 'Register Vehicle'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
