import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { loginSchema, type LoginInput } from '@/lib/validations'
import { useLogin } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
export default function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const loginMutation = useLogin()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (isAuthenticated) {
      const roles = useAuthStore.getState().user?.roles ?? []
      if (roles.includes('admin') || roles.includes('super-admin')) navigate('/admin', { replace: true })
      else if (roles.includes('driver')) navigate('/driver', { replace: true })
      else navigate('/rider', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const onSubmit = async (data: LoginInput) => {
    try {
      const res = await loginMutation.mutateAsync(data)
      const roles = res.data.user.roles
      toast.success('Welcome back!')
      if (roles.includes('admin') || roles.includes('super-admin')) navigate('/admin', { replace: true })
      else if (roles.includes('driver')) navigate('/driver', { replace: true })
      else navigate('/rider', { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { error?: { message?: string } } }; validationErrors?: Record<string, string[]>; message?: string }
      const status = axiosErr.response?.status

      if (axiosErr.validationErrors) {
        for (const [field, messages] of Object.entries(axiosErr.validationErrors)) {
          setError(field as keyof LoginInput, { message: messages[0] })
        }
      } else if (status === 429) {
        toast.error('Too many login attempts. Please wait before trying again.')
      } else if (status === 500) {
        toast.error('Something went wrong. Please try again.')
      } else {
        toast.error(axiosErr.response?.data?.error?.message || 'Invalid email or password')
      }
    }
  }

  const isPending = loginMutation.isPending || isSubmitting

  return (
      <Card className="w-full border-border/50 shadow-xl shadow-black/5">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-primary flex items-center justify-center shadow-lg shadow-primary/25 ring-1 ring-primary/10">
              <span className="text-primary-foreground font-bold text-3xl">G</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className={cn(
                  'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors',
                  errors.email ? 'text-destructive' : 'text-muted-foreground'
                )} />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="name@example.com"
                  className={cn(
                    'h-11 pl-10 transition-shadow',
                    errors.email && 'border-destructive ring-1 ring-destructive/20'
                  )}
                  {...register('email')}
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1.5 mt-1" role="alert">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className={cn(
                  'absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors',
                  errors.password ? 'text-destructive' : 'text-muted-foreground'
                )} />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={cn(
                    'h-11 pl-10 pr-10 transition-shadow',
                    errors.password && 'border-destructive ring-1 ring-destructive/20'
                  )}
                  {...register('password')}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn(
                    'absolute right-3 top-1/2 -translate-y-1/2 transition-colors',
                    'text-muted-foreground hover:text-foreground'
                  )}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive flex items-center gap-1.5 mt-1" role="alert">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-5 pt-0">
            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold transition-all duration-200"
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-5 w-5 animate-spin mr-2 shrink-0" />}
              {isPending ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">New to Go?</span>
              </div>
            </div>
            <Link
              to="/register"
              className="w-full h-11 inline-flex items-center justify-center rounded-lg border border-input bg-background text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Create an account
            </Link>
          </CardFooter>
        </form>
      </Card>
  )
}
