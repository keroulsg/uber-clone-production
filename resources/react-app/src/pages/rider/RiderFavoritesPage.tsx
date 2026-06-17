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
  return (
    <div className="space-y-6">
      <PageHeader
        title="Saved Places"
        description="Your favorite and frequently visited locations"
      />

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Heart className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Save your home, work, and frequent destinations for one-tap booking. 
            This feature is being built and will be available soon.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
