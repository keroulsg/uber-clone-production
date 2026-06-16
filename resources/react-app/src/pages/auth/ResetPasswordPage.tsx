import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import * as authApi from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
const resetSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    passwordConfirmation: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirmation, {
    message: 'Passwords do not match',
    path: ['passwordConfirmation'],
  })

type ResetInput = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const resetMutation = useMutation({
    mutationFn: ({ password, passwordConfirmation }: { password: string; passwordConfirmation: string }) =>
      authApi.resetPassword(email, token, password, passwordConfirmation),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (data: ResetInput) => {
    try {
      await resetMutation.mutateAsync({ password: data.password, passwordConfirmation: data.passwordConfirmation })
      toast.success('Password reset successfully. Please sign in.')
      navigate('/login', { replace: true })
    } catch {
      toast.error('Failed to reset password. The link may be expired.')
    }
  }

  if (!token || !email) {
    return (
        <Card className="w-full">
          <CardContent className="text-center py-8">
            <p className="text-destructive font-medium">Invalid or missing reset link.</p>
            <Link to="/forgot-password" className="text-sm text-primary hover:underline mt-2 inline-block">
              Request a new reset link
            </Link>
          </CardContent>
        </Card>
    )
  }

  return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">U</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>Enter your new password</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordConfirmation">Confirm New Password</Label>
              <Input
                id="passwordConfirmation"
                type="password"
                placeholder="••••••••"
                {...register('passwordConfirmation')}
              />
              {errors.passwordConfirmation && (
                <p className="text-sm text-destructive">{errors.passwordConfirmation.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={resetMutation.isPending}>
              {resetMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
            </Button>
            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-primary hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </CardFooter>
        </form>
      </Card>
  )
}
