import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Bell, MessageSquare, Mail, Megaphone,
  Car, Moon, Sun, Globe, Info,
  AlertTriangle, Trash, Save, Volume2,
} from 'lucide-react'
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useUserSettings'
import { playNotificationSound, unlockNotificationSound } from '@/lib/notificationSound'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import type { UserSettings } from '@/types'

const defaultSettings: UserSettings = {
  notifications: {
    pushRideUpdates: true,
    smsRideUpdates: false,
    emailRideUpdates: true,
    pushPromotions: false,
    emailPromotions: false,
    soundEnabled: true,
    notificationVolume: 100,
  },
  preferredVehicle: 'any',
  language: 'en',
  appearance: 'system',
}

export default function RiderSettingsPage() {
  const navigate = useNavigate()
  const { data: settingsData, isLoading } = useUserSettings()
  const updateSettings = useUpdateUserSettings()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const [notifications, setNotifications] = useState(defaultSettings.notifications)
  const [preferredVehicle, setPreferredVehicle] = useState(defaultSettings.preferredVehicle)
  const [language, setLanguage] = useState(defaultSettings.language)
  const [appearance, setAppearance] = useState(defaultSettings.appearance)
  const [hasChanges, setHasChanges] = useState(false)
  const [notificationVolume, setNotificationVolume] = useState(100)

  const settings = settingsData?.data as UserSettings | undefined

  useEffect(() => {
    if (settings) {
      const n = settings.notifications
      setNotifications({
        pushRideUpdates: n?.pushRideUpdates ?? true,
        smsRideUpdates: n?.smsRideUpdates ?? false,
        emailRideUpdates: n?.emailRideUpdates ?? true,
        pushPromotions: n?.pushPromotions ?? false,
        emailPromotions: n?.emailPromotions ?? false,
        soundEnabled: n?.soundEnabled ?? true,
      })
      setNotificationVolume((n as any)?.notificationVolume ?? 100)
      setPreferredVehicle(settings.preferredVehicle ?? 'any')
      setLanguage(settings.language ?? 'en')
      setAppearance(settings.appearance ?? 'system')
    }
  }, [settings])

  useEffect(() => {
    if (!settings) return
    const changed =
      JSON.stringify(notifications) !== JSON.stringify(settings.notifications) ||
      preferredVehicle !== settings.preferredVehicle ||
      language !== settings.language ||
      appearance !== settings.appearance
    setHasChanges(changed)
  }, [notifications, preferredVehicle, language, appearance, settings])

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        notifications: { ...notifications, notificationVolume },
        preferredVehicle,
        language,
        appearance,
      })
      toast.success('Settings saved')
      setHasChanges(false)
    } catch {
      toast.error('Failed to save settings')
    }
  }

  const handleDeleteAccount = () => {
    setDeleteOpen(false)
    navigate('/rider/support')
    toast.info('Please create a support ticket to request account deletion')
  }

  const appVersion = '1.0.0'

  if (isLoading) return <LoadingScreen />

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Customize your app experience" />

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose how you receive ride updates and promotions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Ride Updates</p>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <Label htmlFor="push-ride" className="font-medium">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications about your rides</p>
              </div>
            </div>
            <Switch
              id="push-ride"
              checked={notifications.pushRideUpdates}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, pushRideUpdates: v }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <Label htmlFor="sms-ride" className="font-medium">SMS</Label>
                <p className="text-sm text-muted-foreground">Receive SMS updates about your rides</p>
              </div>
            </div>
            <Switch
              id="sms-ride"
              checked={notifications.smsRideUpdates}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, smsRideUpdates: v }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <Label htmlFor="email-ride" className="font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">Receive email updates about your rides</p>
              </div>
            </div>
            <Switch
              id="email-ride"
              checked={notifications.emailRideUpdates}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, emailRideUpdates: v }))}
            />
          </div>

          <Separator />
          <p className="text-sm font-medium text-muted-foreground pt-2">Promotions</p>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Megaphone className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <Label htmlFor="push-promo" className="font-medium">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Get notified about promotions and offers</p>
              </div>
            </div>
            <Switch
              id="push-promo"
              checked={notifications.pushPromotions}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, pushPromotions: v }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <Label htmlFor="email-promo" className="font-medium">Email</Label>
                <p className="text-sm text-muted-foreground">Receive promotional emails and offers</p>
              </div>
            </div>
            <Switch
              id="email-promo"
              checked={notifications.emailPromotions}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, emailPromotions: v }))}
            />
          </div>

          <Separator />
          <p className="text-sm font-medium text-muted-foreground pt-2">Sound</p>
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <Volume2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <Label htmlFor="sound" className="font-medium">Notification Sound</Label>
                <p className="text-sm text-muted-foreground">Play a sound when important notifications arrive</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  unlockNotificationSound()
                  playNotificationSound(notificationVolume)
                }}
              >
                Test
              </Button>
              <Switch
                id="sound"
                checked={notifications.soundEnabled}
                onCheckedChange={(v) => setNotifications((n) => ({ ...n, soundEnabled: v }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={notificationVolume}
              onChange={(e) => setNotificationVolume(parseInt(e.target.value))}
              disabled={!notifications.soundEnabled}
              className="flex-1 accent-primary"
            />
            <span className="text-sm text-muted-foreground w-10 text-right">{notificationVolume}%</span>
          </div>
        </CardContent>
      </Card>

      {/* Ride Preferences */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Preferred Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={preferredVehicle} onValueChange={setPreferredVehicle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">No Preference</SelectItem>
                <SelectItem value="economy">Economy</SelectItem>
                <SelectItem value="comfort">Comfort</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">Language saved. Full translation will be enabled soon.</p>
          </CardContent>
        </Card>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges || updateSettings.isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            App Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">{appVersion}</span>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Delete Account</Label>
              <p className="text-sm text-muted-foreground">
                Contact support to request account deletion. This action requires admin approval.
              </p>
            </div>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash className="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Request Account Deletion"
        description="Account deletion is managed by our support team. This will create a support ticket for your deletion request."
        confirmText="Contact Support"
        variant="destructive"
        onConfirm={handleDeleteAccount}
      />
    </div>
  )
}
