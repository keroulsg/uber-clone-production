import { useState, useEffect } from 'react'
import {
  Bell, MessageSquare, DollarSign, Globe,
  Moon, Sun, Shield, AlertTriangle, Trash, Wallet,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PageHeader } from '@/components/common/PageHeader'
import { getDriverPayout, updateDriverPayout, type PayoutInfo } from '@/api/drivers'

export default function DriverSettingsPage() {
  const [notifications, setNotifications] = useState({
    rideRequests: true,
    newMessages: true,
    earningsReports: true,
    rideReminders: true,
    promotions: false,
  })

  const [language, setLanguage] = useState('en')
  const [deactivateOpen, setDeactivateOpen] = useState(false)

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

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Control which notifications you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <Label htmlFor="ride-requests" className="font-medium">Ride Requests</Label>
                <p className="text-sm text-muted-foreground">Get notified when a new ride request comes in</p>
              </div>
            </div>
            <Switch
              id="ride-requests"
              checked={notifications.rideRequests}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, rideRequests: v }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <Label htmlFor="new-messages" className="font-medium">New Messages</Label>
                <p className="text-sm text-muted-foreground">Get notified when you receive a new message</p>
              </div>
            </div>
            <Switch
              id="new-messages"
              checked={notifications.newMessages}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, newMessages: v }))}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <Label htmlFor="earnings-reports" className="font-medium">Earnings Reports</Label>
                <p className="text-sm text-muted-foreground">Get weekly and monthly earnings summaries</p>
              </div>
            </div>
            <Switch
              id="earnings-reports"
              checked={notifications.earningsReports}
              onCheckedChange={(v) => setNotifications((n) => ({ ...n, earningsReports: v }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance & Language */}
      <div className="grid gap-6 md:grid-cols-2">
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Language
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-profile" className="font-medium">Show my profile to riders</Label>
              <p className="text-sm text-muted-foreground">Riders can see your name, photo and rating</p>
            </div>
            <Switch id="show-profile" defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="share-location" className="font-medium">Share live location</Label>
              <p className="text-sm text-muted-foreground">Riders can see your real-time location during a ride</p>
            </div>
            <Switch id="share-location" defaultChecked />
          </div>
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

      {/* Account Deactivation */}
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
                Permanently deactivate your driver account and stop receiving rides
              </p>
            </div>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setDeactivateOpen(true)}
            >
              <Trash className="h-4 w-4" />
              Deactivate
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title="Deactivate Account"
        description="Are you sure you want to deactivate your account? This action cannot be undone. All your data will be permanently removed."
        confirmText="Deactivate"
        variant="destructive"
        onConfirm={() => {
          setDeactivateOpen(false)
        }}
      />
    </div>
  )
}
