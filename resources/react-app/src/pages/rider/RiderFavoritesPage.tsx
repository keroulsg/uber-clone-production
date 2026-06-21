import { useState } from 'react'
import {
  Home, Briefcase, Heart, MapPin,
  Pencil, Trash, Navigation, Star, Info,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  useSavedPlaces, useUpdateSavedPlace, useDeleteSavedPlace,
} from '@/hooks/useSavedPlaces'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import type { SavedPlace } from '@/types'

const labelIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  work: Briefcase,
  custom: MapPin,
}

const labelColors: Record<string, string> = {
  home: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
  work: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
  custom: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400',
}

const labelNames: Record<string, string> = {
  home: 'Home',
  work: 'Work',
  custom: 'Custom',
}

function hasValidCoords(place: SavedPlace): boolean {
  const lat = Number(place.latitude)
  const lng = Number(place.longitude)
  return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !(lat === 0 && lng === 0)
}

export default function RiderFavoritesPage() {
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useSavedPlaces()
  const updatePlace = useUpdateSavedPlace()
  const deletePlace = useDeleteSavedPlace()

  const places = (data?.data ?? []) as SavedPlace[]

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPlace, setEditingPlace] = useState<SavedPlace | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<SavedPlace | null>(null)

  const [formLabel, setFormLabel] = useState<string>('custom')
  const [formName, setFormName] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formError, setFormError] = useState('')

  const openEdit = (place: SavedPlace) => {
    setEditingPlace(place)
    setFormLabel(place.label)
    setFormName(place.name)
    setFormAddress(place.address)
    setFormError('')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      setFormError('Name is required')
      return
    }
    if (!formAddress.trim()) {
      setFormError('Address is required')
      return
    }

    try {
      if (editingPlace) {
        await updatePlace.mutateAsync({
          id: editingPlace.id,
          data: {
            label: formLabel,
            name: formName.trim(),
            address: formAddress.trim(),
            latitude: editingPlace.latitude,
            longitude: editingPlace.longitude,
          },
        })
        toast.success('Place updated')
      }
      setDialogOpen(false)
    } catch {
      setFormError('Failed to save place')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deletePlace.mutateAsync(deleteTarget.id)
      toast.success('Place deleted')
      setDeleteOpen(false)
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete place')
    }
  }

  const handleUsePlace = (place: SavedPlace, type: 'pickup' | 'destination') => {
    if (!hasValidCoords(place)) return
    const params = new URLSearchParams()
    if (type === 'pickup') {
      params.set('pickupAddress', place.address)
      params.set('pickupLat', String(place.latitude))
      params.set('pickupLng', String(place.longitude))
    } else {
      params.set('destAddress', place.address)
      params.set('destLat', String(place.latitude))
      params.set('destLng', String(place.longitude))
    }
    navigate(`/rider?${params.toString()}`)
  }

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Places"
        description="Your favorite and frequently visited locations"
      />

      <div className="bg-muted/50 border rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          You can save places from the{' '}
          <button className="underline font-medium text-foreground" onClick={() => navigate('/rider')}>
            Book Ride
          </button>{' '}
          page after selecting a pickup or destination.
        </p>
      </div>

      {places.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No saved places"
          description="Save your home, work, and frequent destinations from the Book Ride page"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {places.map((place) => {
            const Icon = labelIcons[place.label] || MapPin
            const valid = hasValidCoords(place)
            return (
              <Card key={place.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${labelColors[place.label] || labelColors.custom}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{place.name}</h3>
                        <span className="text-xs text-muted-foreground capitalize px-2 py-0.5 rounded bg-muted">{labelNames[place.label] || place.label}</span>
                        {place.isFavorite && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{place.address}</p>
                      {!valid && (
                        <p className="text-xs text-amber-600 mt-1">
                          This saved place has no valid location. Please recreate it from Book Ride.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      disabled={!valid}
                      onClick={() => handleUsePlace(place, 'pickup')}
                    >
                      <Navigation className="h-3 w-3" />
                      Pickup
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      disabled={!valid}
                      onClick={() => handleUsePlace(place, 'destination')}
                    >
                      <MapPin className="h-3 w-3" />
                      Dest
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(place)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => { setDeleteTarget(place); setDeleteOpen(true) }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Place</DialogTitle>
            <DialogDescription>
              Update your saved location details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Select value={formLabel} onValueChange={setFormLabel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. My Office" />
            </div>
            <div className="space-y-2">
              <Label>Address <span className="text-destructive">*</span></Label>
              <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Full address" />
            </div>
            {formError && <p className="text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updatePlace.isPending}>
              {updatePlace.isPending ? 'Saving...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Place"
        description={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  )
}
