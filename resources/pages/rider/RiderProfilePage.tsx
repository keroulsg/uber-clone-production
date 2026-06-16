import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Camera, Save, Eye, EyeOff,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useUpdateProfile, useChangePassword } from '@/hooks/useAuth'
import { changePasswordSchema } from '@/lib/validations'
import { getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 characters'),
  address: z.string().optional(),
  city: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof changePasswordSchema>

export default function RiderProfilePage() {
  const { user } = useAuthStore()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      phone: '',
      address: '',
      city: '',
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
    if (user) {
      profileForm.reset({
        name: user.name,
        phone: user.phone,
        address: '',
        city: '',
      })
    }
  }, [user, profileForm])

  const onProfileSubmit = (data: ProfileForm) => {
    const formData = new FormData()
    formData.append('name', data.name)
    formData.append('phone', data.phone)
    if (data.address) formData.append('address', data.address)
    if (data.city) formData.append('city', data.city)
    updateProfile.mutate(formData)
  }

  const onPasswordSubmit = (data: PasswordForm) => {
    changePassword.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      { onSuccess: () => passwordForm.reset() }
    )
  }

  if (!user) return <LoadingScreen />

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" description="Manage your personal information" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Photo */}
        <Card>
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <Avatar className="h-28 w-28">
                <AvatarImage src={user.avatarUrl} />
                <AvatarFallback className="text-3xl">
                  {getInitials(user.name)}
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
            <h3 className="font-semibold text-lg">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your profile details</CardDescription>
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
                  <Input id="email" value={user.email} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...profileForm.register('phone')} />
                  {profileForm.formState.errors.phone && (
                    <p className="text-xs text-destructive">{profileForm.formState.errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...profileForm.register('city')} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" {...profileForm.register('address')} />
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

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
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
