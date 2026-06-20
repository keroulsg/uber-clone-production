import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Wallet, DollarSign, TrendingUp, CreditCard, AlertTriangle, ArrowUpDown, Landmark, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getDriverWallet, getDriverSettlements, createDriverSettlement } from '@/api/drivers'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  awaiting_verification: 'bg-blue-100 text-blue-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  failed: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
}

export default function DriverWalletPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['driver', 'wallet'],
    queryFn: () => getDriverWallet(),
  })
  const { data: settlementsRes, isLoading: settlementsLoading } = useQuery({
    queryKey: ['driver', 'settlements'],
    queryFn: () => getDriverSettlements(),
  })

  const createSettlement = useMutation({
    mutationFn: (formData: FormData) => createDriverSettlement(formData),
    onSuccess: () => {
      toast.success('Settlement request submitted')
      setOpen(false)
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['driver', 'settlements'] })
      queryClient.invalidateQueries({ queryKey: ['driver', 'wallet'] })
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to submit settlement')
    },
  })

  const resetForm = () => { setAmount(''); setMethod(''); setReference(''); setNote(''); setFile(null) }

  const handleSubmit = () => {
    if (!amount || !method) { toast.error('Amount and method are required'); return }
    if (method !== 'cash' && !reference) { toast.error('Reference number is required for this method'); return }
    const formData = new FormData()
    formData.append('amount', amount)
    formData.append('method', method)
    if (reference) formData.append('reference', reference)
    if (note) formData.append('note', note)
    if (file) formData.append('attachment', file)
    createSettlement.mutate(formData)
  }

  const d = data?.data as any
  const debts = d?.debts ?? {}
  const settlements = Array.isArray(settlementsRes?.data) ? settlementsRes.data as any[] : []

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader title="My Wallet" description="Track your earnings, balance, and company dues" />

      {/* Balance cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Wallet Balance</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /><span className="text-2xl font-bold">{formatCurrency(d?.balance ?? 0)}</span></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Today Earnings</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-emerald-500" /><span className="text-2xl font-bold">{formatCurrency(d?.today_earnings ?? 0)}</span></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-blue-500" /><span className="text-2xl font-bold">{formatCurrency(d?.weekly_earnings ?? 0)}</span></div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle></CardHeader>
          <CardContent><div className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-purple-500" /><span className="text-2xl font-bold">{formatCurrency(d?.total_earnings ?? 0)}</span></div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Earnings Split */}
        <Card>
          <CardHeader><CardTitle>Earnings Split</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Cash Collected</span><span className="font-medium">{formatCurrency(d?.cash_collected ?? 0)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Wallet Earnings</span><span className="font-medium">{formatCurrency(d?.wallet_earnings ?? 0)}</span></div>
              <Separator />
              <div className="flex justify-between font-bold"><span>Total Lifetime Earnings</span><span>{formatCurrency(d?.total_earnings ?? 0)}</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Company Dues */}
        {debts.outstanding_debt > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Company Dues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div className="flex justify-between font-bold text-amber-700">
                  <span>You currently owe</span>
                  <span className="text-lg">{formatCurrency(debts.outstanding_debt)}</span>
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Unpaid Commission</span><span>{formatCurrency(debts.unpaid_commission)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cash Change Liability</span><span>{formatCurrency(debts.cash_change_liability)}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">Today's Commission</span><span>{formatCurrency(debts.today_commission)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">This Week Commission</span><span>{formatCurrency(debts.weekly_commission)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">This Month Commission</span><span>{formatCurrency(debts.monthly_commission)}</span></div>
                <p className="text-xs text-muted-foreground mt-2">Cash rides create commission debt. Wallet rides do not.</p>
                <Button className="w-full mt-2 gap-2" variant="default" onClick={() => setOpen(true)}>
                  <Landmark className="h-4 w-4" />
                  Pay Company Dues
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Settlement Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Settlement Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {settlementsLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : settlements.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No settlement requests yet.</p>
          ) : (
            <div className="space-y-2">
              {settlements.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between text-sm p-3 rounded-lg border">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(s.amount)}</span>
                      <Badge className={statusColors[s.status] || ''}>{s.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {s.method?.replace(/_/g, ' ')} · {formatDate(s.created_at)}
                      {s.reference && <> · Ref: {s.reference}</>}
                    </p>
                    {s.rejection_reason && (
                      <p className="text-xs text-red-500 mt-1">Reason: {s.rejection_reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            Online payment gateways will be added later. Current settlement is submitted for admin verification.
          </p>
        </CardContent>
      </Card>

      {/* Settlement Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Company Dues</DialogTitle>
            <DialogDescription>Your outstanding debt: {formatCurrency(debts.outstanding_debt ?? 0)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input id="amount" type="number" min="0.01" step="0.01" max={debts.outstanding_debt} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Payment Method *</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash to Admin</SelectItem>
                  <SelectItem value="instapay">Instapay</SelectItem>
                  <SelectItem value="vodafone_cash">Vodafone Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reference">Reference / Transaction ID {method && method !== 'cash' ? '*' : ''}</Label>
              <Input id="reference" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction reference" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any additional info" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachment">Receipt Image (optional)</Label>
              <Input id="attachment" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm() }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createSettlement.isPending}>
              {createSettlement.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Submitting...</> : 'Submit Settlement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
