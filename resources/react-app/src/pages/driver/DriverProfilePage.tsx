import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Camera, Save, Upload, Eye, EyeOff,
} from 'lucide-react'
import { useDriverProfile, useUpdateDriverProfile } from '@/hooks/useDrivers'
import { useChangePassword } from '@/hooks/useAuth'
import { useDriverStore } from '@/stores/driverStore'
import { changePasswordSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { FileUpload } from '@/components/common/FileUpload'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { getInitials } from '@/lib/utils'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone must be at least 10 characters'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  dateOfBirth: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof changePasswordSchema>

export default function DriverProfilePage() {
  const { driverProfile } = useDriverStore()
  const { data, isLoading, error, refetch } = useDriverProfile()
  const updateProfile = useUpdateDriverProfile()
  const changePassword = useChangePassword()

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      dateOfBirth: '',
    },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      newPasswordConfirmation: '',
    },
  })

  useEffect(() => {
    if (driverProfile) {
      profileForm.reset({
        name: driverProfile.user.name,
        email: driverProfile.user.email,
        phone: driverProfile.user.phone,
        address: driverProfile.address ?? '',
        city: driverProfile.city ?? '',
        state: driverProfile.state ?? '',
        dateOfBirth: '',
      })
    }
  }, [driverProfile, profileForm])

  const onProfileSubmit = (formData: ProfileForm) => {
    updateProfile.mutate(formData as unknown as Record<string, unknown>)
  }

  const onPasswordSubmit = (formData: PasswordForm) => {
    changePassword.mutate(
      {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        newPasswordConfirmation: formData.newPasswordConfirmation,
      },
      {
        onSuccess: () => {
          passwordForm.reset()
        },
      }
    )
  }

  const docStatus = driverProfile?.isVerified
    ? ({ label: 'Verified', variant: 'success' as const })
    : ({ label: 'Pending', variant: 'warning' as const })

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader title="Driver Profile" description="Manage your personal information and documents" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Photo */}
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <Avatar className="h-28 w-28">
                <AvatarImage src={driverProfile?.profilePhotoUrl} />
                <AvatarFallback className="text-3xl">
                  {driverProfile?.user.name ? getInitials(driverProfile.user.name) : 'D'}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="secondary"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <h3 className="font-semibold text-lg">{driverProfile?.user.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{driverProfile?.user.email}</p>
            <Badge variant={docStatus.variant}>{docStatus.label}</Badge>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" {...profileForm.register('name')} />
                  {profileForm.formState.errors.name && (
                    <p className="text-xs text-destructive">{profileForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...profileForm.register('email')} />
                  {profileForm.formState.errors.email && (
                    <p className="text-xs text-destructive">{profileForm.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...profileForm.register('phone')} />
                  {profileForm.formState.errors.phone && (
                    <p className="text-xs text-destructive">{profileForm.formState.errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input id="dateOfBirth" type="date" {...profileForm.register('dateOfBirth')} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" {...profileForm.register('address')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...profileForm.register('city')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" {...profileForm.register('state')} />
                </div>
              </div>
              <Button type="submit" className="gap-2" disabled={updateProfile.isPending}>
                <Save className="h-4 w-4" />
                {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Upload your license and identity documents for verification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Driver License (Front)</Label>
                <Badge variant={docStatus.variant}>{docStatus.label}</Badge>
              </div>
              <FileUpload accept="image/*" maxSize={5 * 1024 * 1024} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Driver License (Back)</Label>
                <Badge variant={docStatus.variant}>{docStatus.label}</Badge>
              </div>
              <FileUpload accept="image/*" maxSize={5 * 1024 * 1024} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Identity Proof (Front)</Label>
                <Badge variant={docStatus.variant}>{docStatus.label}</Badge>
              </div>
              <FileUpload accept="image/*,application/pdf" maxSize={5 * 1024 * 1024} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Identity Proof (Back)</Label>
                <Badge variant={docStatus.variant}>{docStatus.label}</Badge>
              </div>
              <FileUpload accept="image/*,application/pdf" maxSize={5 * 1024 * 1024} />
            </div>
          </div>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Documents
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  {...passwordForm.register('currentPassword')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  {...passwordForm.register('newPassword')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPasswordConfirmation">Confirm New Password</Label>
              <Input
                id="newPasswordConfirmation"
                type="password"
                {...passwordForm.register('newPasswordConfirmation')}
              />
              {passwordForm.formState.errors.newPasswordConfirmation && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.newPasswordConfirmation.message}</p>
              )}
            </div>
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? 'Updating...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
