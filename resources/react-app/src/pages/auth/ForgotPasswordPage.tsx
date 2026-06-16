import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Mail, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations'
import { useMutation } from '@tanstack/react-query'
import * as authApi from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false)

  const forgotMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      await forgotMutation.mutateAsync(data.email)
      setEmailSent(true)
      toast.success('Check your email for reset instructions')
    } catch {
      toast.error('Failed to send reset email. Please try again.')
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
          <CardTitle className="text-2xl">Forgot Password?</CardTitle>
          <CardDescription>
            {emailSent
              ? 'We have sent you a recovery email'
              : 'Enter your email and we will send you a reset link'}
          </CardDescription>
        </CardHeader>

        {emailSent ? (
          <CardContent className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              If an account exists with that email, you will receive password reset instructions shortly.
            </p>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={forgotMutation.isPending}>
                {forgotMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {forgotMutation.isPending ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </CardFooter>
          </form>
        )}

        <CardFooter className="justify-center pt-0">
          <Link to="/login" className="flex items-center gap-2 text-sm text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
  )
}
