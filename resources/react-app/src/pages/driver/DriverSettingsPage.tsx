import { useState, useEffect } from 'react'
import {
  Volume2, Moon, Wallet, AlertTriangle, LifeBuoy, VolumeX,
} from 'lucide-react'
import { playNotificationSound, unlockNotificationSound } from '@/lib/notificationSound'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { PageHeader } from '@/components/common/PageHeader'
import { getDriverPayout, updateDriverPayout, type PayoutInfo } from '@/api/drivers'
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useUserSettings'

export default function DriverSettingsPage() {
  const { data: settings } = useUserSettings()
  const updateSettings = useUpdateUserSettings()

  const [soundEnabled, setSoundEnabled] = useState(true)
  const [notificationVolume, setNotificationVolume] = useState(100)

  useEffect(() => {
    if (settings?.data?.notifications) {
      setSoundEnabled(settings.data.notifications.soundEnabled ?? true)
      setNotificationVolume(settings.data.notifications.notificationVolume ?? 100)
    }
  }, [settings])

  const handleSoundToggle = (v: boolean) => {
    setSoundEnabled(v)
    updateSettings.mutate({
      notifications: {
        pushRideUpdates: settings?.data?.notifications?.pushRideUpdates ?? true,
        smsRideUpdates: settings?.data?.notifications?.smsRideUpdates ?? false,
        emailRideUpdates: settings?.data?.notifications?.emailRideUpdates ?? true,
        pushPromotions: settings?.data?.notifications?.pushPromotions ?? false,
        emailPromotions: settings?.data?.notifications?.emailPromotions ?? false,
        soundEnabled: v,
        notificationVolume: settings?.data?.notifications?.notificationVolume ?? 100,
      },
    })
  }

  const handleVolumeChange = (v: number) => {
    setNotificationVolume(v)
    updateSettings.mutate({
      notifications: {
        pushRideUpdates: settings?.data?.notifications?.pushRideUpdates ?? true,
        smsRideUpdates: settings?.data?.notifications?.smsRideUpdates ?? false,
        emailRideUpdates: settings?.data?.notifications?.emailRideUpdates ?? true,
        pushPromotions: settings?.data?.notifications?.pushPromotions ?? false,
        emailPromotions: settings?.data?.notifications?.emailPromotions ?? false,
        soundEnabled: settings?.data?.notifications?.soundEnabled ?? true,
        notificationVolume: v,
      },
    })
  }

  const [payout, setPayout] = useState<PayoutInfo>({
    payout_method: null,
    payout_phone: null,
    payout_account_name: null,
    payout_notes: null,
  })
  const [payoutLoading, setPayoutLoading] = useState(true)
  const [payoutSaving, setPayoutSaving] = useState(false)

  useEffect(() => {
    getDriverPayout()
      .then((res) => {
        if (res.data) setPayout(res.data)
      })
      .catch(() => toast.error('Failed to load payout settings'))
      .finally(() => setPayoutLoading(false))
  }, [])

  const handleSavePayout = async () => {
    setPayoutSaving(true)
    try {
      const res = await updateDriverPayout(payout)
      if (res.data) setPayout(res.data)
      toast.success('Payout settings saved')
    } catch {
      toast.error('Failed to save payout settings')
    } finally {
      setPayoutSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account and app preferences" />

      {/* Sound */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Sound
          </CardTitle>
          <CardDescription>Configure notification sound for ride requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              {soundEnabled ? (
                <Volume2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              ) : (
                <VolumeX className="h-5 w-5 text-muted-foreground mt-0.5" />
              )}
              <div>
                <Label htmlFor="sound-toggle" className="font-medium">Notification Sound</Label>
                <p className="text-sm text-muted-foreground">Play sound for new ride requests</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="sound-toggle"
                checked={soundEnabled}
                onCheckedChange={handleSoundToggle}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={!soundEnabled}
                onClick={() => {
                  unlockNotificationSound()
                  playNotificationSound(notificationVolume)
                }}
              >
                Test
              </Button>
            </div>
          </div>
          {soundEnabled && (
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={notificationVolume}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="text-sm text-muted-foreground w-10 text-right">{notificationVolume}%</span>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Payout Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Payout Settings
          </CardTitle>
          <CardDescription>Configure how you receive your earnings</CardDescription>
        </CardHeader>
        <CardContent>
          {payoutLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Payout Method</Label>
                <Select
                  value={payout.payout_method || ''}
                  onValueChange={(v) => setPayout((p) => ({ ...p, payout_method: v || null }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payout method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vodafone_cash">Vodafone Cash</SelectItem>
                    <SelectItem value="instapay">InstaPay</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  placeholder="e.g. +201234567890"
                  value={payout.payout_phone || ''}
                  onChange={(e) => setPayout((p) => ({ ...p, payout_phone: e.target.value || null }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Account Name</Label>
                <Input
                  placeholder="Full name on the account"
                  value={payout.payout_account_name || ''}
                  onChange={(e) => setPayout((p) => ({ ...p, payout_account_name: e.target.value || null }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input
                  placeholder="Additional instructions"
                  value={payout.payout_notes || ''}
                  onChange={(e) => setPayout((p) => ({ ...p, payout_notes: e.target.value || null }))}
                />
              </div>
              <Button onClick={handleSavePayout} disabled={payoutSaving}>
                {payoutSaving ? 'Saving...' : 'Save Payout Settings'}
              </Button>
            </div>
          )}
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
              <Label className="font-medium">Deactivate Account</Label>
              <p className="text-sm text-muted-foreground">
                Account deactivation request will be handled by support. Please contact support.
              </p>
            </div>
            <Button variant="outline" className="gap-2" asChild>
              <a href="/driver/support">
                <LifeBuoy className="h-4 w-4" />
                Contact Support
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
