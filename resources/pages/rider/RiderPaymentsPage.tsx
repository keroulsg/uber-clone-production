import { useState } from 'react'
import {
  CreditCard, Wallet, DollarSign, Plus,
  Trash, Star, CheckCircle,
} from 'lucide-react'
import { usePayments } from '@/hooks/usePayments'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { Payment } from '@/types'

type PaymentMethod = {
  id: string
  type: string
  label: string
  last4?: string
  expMonth?: number
  expYear?: number
  isDefault: boolean
}

export default function RiderPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [addMethodOpen, setAddMethodOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [methods, setMethods] = useState<PaymentMethod[]>([])

  const { data, isLoading, error, refetch } = usePayments({ page, ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }) })

  const payments = (data?.data?.payments ?? []) as Payment[]
  const rawMeta = data?.data?.meta as Record<string, unknown> | undefined
  const meta = {
    currentPage: (rawMeta?.currentPage ?? rawMeta?.current_page ?? 1) as number,
    lastPage: (rawMeta?.lastPage ?? rawMeta?.last_page ?? 1) as number,
    total: (rawMeta?.total ?? 0) as number,
  }

  const setDefaultMethod = (id: string) => {
    setMethods(methods.map((m) => ({ ...m, isDefault: m.id === id })))
  }

  const removeMethod = (id: string) => {
    setMethods(methods.filter((m) => m.id !== id))
  }

  const typeIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="h-5 w-5" />
      case 'wallet':
        return <Wallet className="h-5 w-5" />
      case 'cash':
        return <DollarSign className="h-5 w-5" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }

  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Manage your payment methods and view payment history" />

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Your saved payment methods</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setAddMethodOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Method
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {methods.map((method) => (
            <div
              key={method.id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                method.isDefault ? 'border-primary/50 bg-primary/5' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  {typeIcon(method.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{method.label}</p>
                    {method.isDefault && (
                      <Badge variant="success" className="text-[10px] px-1.5 py-0">Default</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {method.type === 'card'
                      ? `**** ${method.last4} | Exp: ${method.expMonth}/${method.expYear}`
                      : (method.type?.charAt(0)?.toUpperCase() ?? '') + (method.type?.slice(1) ?? '')
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!method.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => setDefaultMethod(method.id)}>
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMethod(method.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Payment History</CardTitle>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingScreen fullScreen={false} />
          ) : payments.length === 0 ? (
            <EmptyState title="No payments yet" description="Your payment history will appear here" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Ride</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment: Payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">{formatDate(payment.paidAt ?? new Date().toISOString())}</TableCell>
                    <TableCell className="text-sm">{payment.rideId?.slice(0, 8) ?? '--'}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell className="text-sm capitalize">{payment.paymentMethod ?? 'Card'}</TableCell>
                    <TableCell>
                      <StatusBadge status={payment.status} type="payment" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {meta.lastPage > 1 && (
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {meta.lastPage}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.lastPage}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Method Dialog */}
      <Dialog open={addMethodOpen} onOpenChange={setAddMethodOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>Enter your card details to add a new payment method</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input id="card-number" placeholder="4242 4242 4242 4242" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input id="expiry" placeholder="MM/YY" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input id="cvv" placeholder="123" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="card-name">Cardholder Name</Label>
              <Input id="card-name" placeholder="John Doe" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMethodOpen(false)}>Cancel</Button>
            <Button onClick={() => setAddMethodOpen(false)}>Save Card</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
