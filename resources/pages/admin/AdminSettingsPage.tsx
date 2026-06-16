import { useState, useEffect } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminSettings, useUpdateSetting } from '@/hooks/useAdmin'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'

interface Setting {
  id: string
  key: string
  value: string
}

interface SettingGroup {
  title: string
  description: string
  keys: string[]
}

const settingGroups: SettingGroup[] = [
  {
    title: 'General',
    description: 'Basic platform settings',
    keys: ['app_name', 'app_description', 'support_email', 'support_phone', 'default_currency', 'currency_locale'],
  },
  {
    title: 'Pricing & Commission',
    description: 'Fare calculation and driver commission settings',
    keys: ['company_commission_rate', 'driver_commission_percentage', 'platform_fee_percentage', 'cancellation_fee_percentage', 'min_ride_distance_km', 'max_ride_distance_km', 'max_search_radius_km', 'waiting_fee_per_minute', 'waiting_free_minutes', 'long_pickup_threshold_km', 'long_pickup_commission_rate'],
  },
  {
    title: 'Vehicle Class Pricing',
    description: 'Fare multipliers by vehicle class',
    keys: ['vehicle_class_basic_multiplier', 'vehicle_class_medium_multiplier', 'vehicle_class_premium_multiplier'],
  },
  {
    title: 'Fuel Pricing',
    description: 'Fuel cost surcharge settings',
    keys: ['gasoline_92_price_per_liter', 'average_car_fuel_consumption_l_per_100km', 'average_motorcycle_fuel_consumption_l_per_100km', 'fuel_surcharge_enabled'],
  },
  {
    title: 'Motorcycle Pricing',
    description: 'Motorcycle-specific pricing settings (used when no vehicle_type_id matches)',
    keys: ['motorcycle_base_fare', 'motorcycle_per_km_rate', 'motorcycle_per_minute_rate', 'motorcycle_minimum_fare'],
  },
  {
    title: 'Surge & Peak Pricing',
    description: 'Dynamic demand-based surge configuration',
    keys: ['surge_enabled', 'surge_demand_window_minutes', 'surge_min_open_requests', 'surge_min_demand_supply_ratio', 'surge_max_multiplier', 'surge_step', 'surge_cooldown_minutes', 'surge_radius_km', 'peak_hour_surcharge', 'peak_hour_morning_start', 'peak_hour_morning_end', 'peak_hour_evening_start', 'peak_hour_evening_end', 'night_surcharge', 'night_surcharge_start', 'night_surcharge_end'],
  },
  {
    title: 'Hours & Timeouts',
    description: 'Operating hours and ride timeout configuration',
    keys: ['ride_timeout_minutes', 'otp_expiry_minutes'],
  },
  {
    title: 'Platform',
    description: 'Platform-level configuration',
    keys: ['maintenance_mode', 'google_maps_enabled'],
  },
]

const getSettingLabel = (key: string): string => {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const isBooleanSetting = (key: string): boolean => {
  return ['maintenance_mode', 'google_maps_enabled', 'fuel_surcharge_enabled', 'surge_enabled'].includes(key)
}

export default function AdminSettingsPage() {
  const { data, isLoading, isError, refetch } = useAdminSettings()
  const updateSetting = useUpdateSetting()

  const [localSettings, setLocalSettings] = useState<Record<string, string>>({})

  useEffect(() => {
    if (data?.data) {
      const settings = Array.isArray(data.data) ? data.data as Setting[] : []
      const map: Record<string, string> = {}
      settings.forEach((s) => { map[s.key] = s.value })
      setLocalSettings(map)
    }
  }, [data])

  const handleChange = (key: string, value: string) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async (group: SettingGroup) => {
    try {
      await Promise.all(
        group.keys
          .filter((key) => key in localSettings)
          .map((key) => updateSetting.mutateAsync({ key, value: localSettings[key] }))
      )
      toast.success(`${group.title} settings saved`)
    } catch {
      toast.error(`Failed to save ${group.title} settings`)
    }
  }

  if (isLoading) return <LoadingScreen message="Loading settings..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  const settings = Array.isArray(data?.data) ? data.data as Setting[] : []
  const settingKeys = new Set(settings.map((s: Setting) => s.key))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your platform settings"
      />

      <div className="space-y-6">
        {settingGroups.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{group.title}</CardTitle>
                  <CardDescription>{group.description}</CardDescription>
                </div>
                <Button onClick={() => handleSave(group)} disabled={updateSetting.isPending}>
                  {updateSetting.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                {group.keys
                  .filter((key) => settingKeys.has(key))
                  .map((key) => (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key}>{getSettingLabel(key)}</Label>
                      {isBooleanSetting(key) ? (
                        <div className="flex items-center gap-2 pt-1">
                          <Switch
                            id={key}
                            checked={localSettings[key] === 'true' || localSettings[key] === '1'}
                            onCheckedChange={(checked) => handleChange(key, checked ? 'true' : 'false')}
                          />
                          <span className="text-sm text-muted-foreground">
                            {localSettings[key] === 'true' || localSettings[key] === '1' ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      ) : ['default_currency', 'default_language'].includes(key) ? (
                        <Select value={localSettings[key] ?? ''} onValueChange={(v) => handleChange(key, v)}>
                          <SelectTrigger id={key}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                                                          {key === 'default_currency' ? (
                              <>
                                <SelectItem value="EGP">EGP (ج.م)</SelectItem>
                                <SelectItem value="USD">USD ($)</SelectItem>
                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                <SelectItem value="GBP">GBP (£)</SelectItem>
                              </>
                            ) : (
                              <>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Spanish</SelectItem>
                                <SelectItem value="fr">French</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={key}
                          type={key.includes('time') ? 'time' : key.includes('date') ? 'date' : key.includes('email') ? 'email' : 'text'}
                          value={localSettings[key] ?? ''}
                          onChange={(e) => handleChange(key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
