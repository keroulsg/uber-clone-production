import { useState, useRef, type KeyboardEvent, type ClipboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import * as authApi from '@/api/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card'
const OTP_LENGTH = 6

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [resendCountdown, setResendCountdown] = useState(0)

  const verifyMutation = useMutation({
    mutationFn: (code: string) => authApi.verifyOtp(code),
  })

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    const newOtp = Array(OTP_LENGTH).fill('')
    pasted.split('').forEach((char, i) => {
      newOtp[i] = char
    })
    setOtp(newOtp)
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1)
    inputRefs.current[focusIndex]?.focus()
  }

  const handleSubmit = async () => {
    const code = otp.join('')
    if (code.length !== OTP_LENGTH) {
      toast.error('Please enter the complete 6-digit code')
      return
    }
    try {
      await verifyMutation.mutateAsync(code)
      toast.success('Verification successful!')
      navigate('/login', { replace: true })
    } catch {
      toast.error('Invalid or expired verification code')
    }
  }

  const handleResend = async () => {
    try {
      await authApi.sendOtp()
      toast.success('Verification code resent')
      setResendCountdown(60)
      const interval = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch {
      toast.error('Failed to resend code')
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
          <CardTitle className="text-2xl">Verify OTP</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to your email or phone
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="h-14 w-12 text-center text-lg font-bold"
              />
            ))}
          </div>

          <div className="text-center">
            {resendCountdown > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend code in <span className="font-medium">{resendCountdown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-sm text-primary hover:underline font-medium"
              >
                Resend OTP
              </button>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={verifyMutation.isPending || otp.some((d) => !d)}
          >
            {verifyMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {verifyMutation.isPending ? 'Verifying...' : 'Verify'}
          </Button>
        </CardFooter>
      </Card>
  )
}
