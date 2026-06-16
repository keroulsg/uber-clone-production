import { useState } from 'react'
import {
  Home, Briefcase, Heart, MapPin,
  Plus, Pencil, Trash, Navigation, Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Map } from '@/components/common/Map'
import { PageHeader } from '@/components/common/PageHeader'
import { EmptyState } from '@/components/common/EmptyState'

interface SavedLocation {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  icon: 'home' | 'work' | 'heart'
  isFavorite: boolean
}

const iconMap = {
  home: Home,
  work: Briefcase,
  heart: Heart,
}

export default function RiderFavoritesPage() {
  const [locations, setLocations] = useState<SavedLocation[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    icon: 'heart' as SavedLocation['icon'],
    lat: 40.7128,
    lng: -74.006,
  })

  const openAddDialog = () => {
    setEditingId(null)
    setFormData({ name: '', address: '', icon: 'heart', lat: 40.7128, lng: -74.006 })
    setDialogOpen(true)
  }

  const openEditDialog = (loc: SavedLocation) => {
    setEditingId(loc.id)
    setFormData({
      name: loc.name,
      address: loc.address,
      icon: loc.icon,
      lat: loc.lat,
      lng: loc.lng,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (editingId) {
      setLocations(
        locations.map((l) =>
          l.id === editingId
            ? { ...l, ...formData, isFavorite: true }
            : l
        )
      )
    } else {
      setLocations([
        ...locations,
        { ...formData, id: String(Date.now()), isFavorite: true },
      ])
    }
    setDialogOpen(false)
  }

  const handleDelete = (id: string) => {
    setLocations(locations.filter((l) => l.id !== id))
  }

  const handleQuickBook = (loc: SavedLocation) => {
    // Navigate to dashboard with this location pre-filled
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Places"
        description="Your favorite and frequently visited locations"
        actions={[{ label: 'Add Favorite', icon: Plus, onClick: openAddDialog }]}
      />

      {locations.length === 0 ? (
        <EmptyState
          title="No saved places"
          description="Save your home, work, and other frequent destinations for quick booking"
          actionLabel="Add Favorite"
          onAction={openAddDialog}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {locations.map((loc) => {
            const Icon = iconMap[loc.icon]
            return (
              <Card key={loc.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{loc.name}</h3>
                          {loc.isFavorite && (
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{loc.address}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleQuickBook(loc)}
                    >
                      <Navigation className="h-4 w-4" />
                      Book Here
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(loc)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(loc.id)}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Location' : 'Add Favorite'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update your saved location' : 'Save a new location for quick booking'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fav-name">Label</Label>
              <Select
                value={formData.icon}
                onValueChange={(v) => setFormData((f) => ({ ...f, icon: v as SavedLocation['icon'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="heart">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fav-name">Name</Label>
              <Input
                id="fav-name"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Gym, Supermarket"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fav-address">Address</Label>
              <Input
                id="fav-address"
                value={formData.address}
                onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))}
                placeholder="Enter address"
              />
            </div>
            <Map
              height={200}
              center={{ lat: formData.lat, lng: formData.lng }}
              onMapClick={(lat, lng) => setFormData((f) => ({ ...f, lat, lng }))}
              markers={[{ lat: formData.lat, lng: formData.lng, color: 'blue' }]}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingId ? 'Update' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
