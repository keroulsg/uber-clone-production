import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, User, Car, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { registerSchema, type RegisterInput } from '@/lib/validations'
import { useRegister } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
import { ROLES } from '@/lib/constants'

type Step = 'role' | 'form'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('role')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const registerMutation = useRegister()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  if (isAuthenticated) {
    const roles = useAuthStore.getState().user?.roles ?? []
    if (roles.includes('driver')) navigate('/driver', { replace: true })
    else navigate('/rider', { replace: true })
  }

  const selectRole = (role: string) => {
    setSelectedRole(role)
    setStep('form')
  }

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      await registerMutation.mutateAsync({
        name: data.name as string,
        email: data.email as string,
        phone: data.phone as string,
        password: data.password as string,
        passwordConfirmation: data.passwordConfirmation as string,
        role: selectedRole,
      })
      toast.success('Account created successfully!')
      if (selectedRole === ROLES.DRIVER) navigate('/driver', { replace: true })
      else navigate('/rider', { replace: true })
    } catch (err: unknown) {
      const error = err as { validationErrors?: Record<string, string[]>; message?: string }
      if (error.validationErrors) {
        for (const [field, messages] of Object.entries(error.validationErrors)) {
          setError(field as keyof RegisterInput, { message: messages[0] })
        }
      } else {
        toast.error(error.message || 'Registration failed. Please try again.')
      }
    }
  }

  return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">U</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            {step === 'role' ? 'Choose your account type' : 'Fill in your details'}
          </CardDescription>
        </CardHeader>

        {step === 'role' ? (
          <CardContent className="space-y-4">
            <button
              type="button"
              onClick={() => selectRole(ROLES.RIDER)}
              className={cn(
                'w-full p-6 rounded-xl border-2 text-left transition-all hover:border-primary/50',
                selectedRole === ROLES.RIDER ? 'border-primary bg-primary/5' : 'border-border'
              )}
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Rider</p>
                  <p className="text-sm text-muted-foreground">I want to book rides</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => selectRole(ROLES.DRIVER)}
              className={cn(
                'w-full p-6 rounded-xl border-2 text-left transition-all hover:border-primary/50',
                selectedRole === ROLES.DRIVER ? 'border-primary bg-primary/5' : 'border-border'
              )}
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <Car className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Driver</p>
                  <p className="text-sm text-muted-foreground">I want to drive and earn</p>
                </div>
              </div>
            </button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  {...register('phone')}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value)
                    e.target.value = formatted
                    register('phone').onChange(e)
                  }}
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password.message as string}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordConfirmation">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="passwordConfirmation"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pr-10"
                    {...register('passwordConfirmation')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.passwordConfirmation && (
                  <p className="text-sm text-destructive">{errors.passwordConfirmation.message as string}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <div className="flex gap-3 w-full">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep('role')}>
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={registerMutation.isPending}>
                  {registerMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {registerMutation.isPending ? 'Creating...' : 'Create Account'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
              </p>
            </CardFooter>
          </form>
        )}
      </Card>
  )
}
