import { useState } from 'react'
import {
  Bell, MessageSquare, Mail, Megaphone,
  Car, Moon, Sun, Globe, Info,
  AlertTriangle, Trash,
} from 'lucide-react'
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

export default function RiderSettingsPage() {
  const [notifications, setNotifications] = useState({
    pushRideUpdates: true,
    smsRideUpdates: false,
    emailRideUpdates: true,
    pushPromotions: false,
    emailPromotions: false,
  })

  const [preferredVehicle, setPreferredVehicle] = useState('any')
  const [language, setLanguage] = useState('en')
  const [deleteOpen, setDeleteOpen] = useState(false)

  const appVersion = '1.0.0'

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
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
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

      {/* Delete Account */}
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
                Permanently delete your account and all associated data
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
        title="Delete Account"
        description="Are you sure you want to delete your account? This action cannot be undone. All your data, including ride history and wallet balance, will be permanently removed."
        confirmText="Delete My Account"
        variant="destructive"
        onConfirm={() => setDeleteOpen(false)}
      />
    </div>
  )
}
