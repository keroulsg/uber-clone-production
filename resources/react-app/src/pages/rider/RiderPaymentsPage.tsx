import { useState, useMemo } from 'react'
import {
  Eye, Calendar, Filter, Search, RotateCcw,
} from 'lucide-react'
import { usePayments, usePayment } from '@/hooks/usePayments'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { Payment } from '@/types'

export default function RiderPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const params = useMemo(
    () => ({
      page,
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(methodFilter !== 'all' && { method: methodFilter }),
      ...(dateFrom && { from: dateFrom }),
      ...(dateTo && { to: dateTo }),
      ...(searchQuery && { search: searchQuery }),
    }),
    [page, statusFilter, methodFilter, dateFrom, dateTo, searchQuery]
  )

  const { data, isLoading, error, refetch } = usePayments(params)
  const { data: detailData } = usePayment(selectedPaymentId ?? '')

  const payments = (data?.data?.payments ?? []) as Payment[]
  const rawMeta = data?.data?.meta as Record<string, unknown> | undefined
  const meta = {
    currentPage: (rawMeta?.current_page ?? 1) as number,
    lastPage: (rawMeta?.last_page ?? 1) as number,
    total: (rawMeta?.total ?? 0) as number,
  }
  const selectedPayment = detailData?.data as Payment | undefined

  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="View your payment history" />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setPage(1) }}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="wallet">Wallet</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className="w-40 h-9"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className="w-40 h-9"
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ride/booking ID..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
                className="w-48 h-9"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter('all'); setMethodFilter('all')
                  setDateFrom(''); setDateTo('')
                  setSearchQuery(''); setPage(1)
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment List */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingScreen fullScreen={false} />
          ) : payments.length === 0 ? (
            <EmptyState title="No payments yet" description="Your payment history will appear here" />
          ) : (
            <div className="space-y-2">
              {payments.map((payment: Payment) => (
                <button
                  key={payment.id}
                  type="button"
                  className="w-full text-left flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  onClick={() => { setSelectedPaymentId(payment.id); setDetailOpen(true) }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {payment.rideId ? `Ride #${payment.rideId.slice(0, 8)}` : `Payment #${payment.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(payment.paidAt)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-semibold">{formatCurrency(payment.amount)}</p>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <span className="text-xs capitalize text-muted-foreground">{payment.paymentMethod ?? 'N/A'}</span>
                      <StatusBadge status={payment.status} type="payment" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {meta.lastPage > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing page {meta.currentPage} of {meta.lastPage} ({meta.total} total)
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Prev
                </Button>
                {(() => {
                  const pages: (number | string)[] = []
                  const d = 2
                  const start = Math.max(1, page - d)
                  const end = Math.min(meta.lastPage, page + d)
                  if (start > 1) { pages.push(1); if (start > 2) pages.push('...') }
                  for (let i = start; i <= end; i++) pages.push(i)
                  if (end < meta.lastPage) { if (end < meta.lastPage - 1) pages.push('...'); pages.push(meta.lastPage) }
                  return pages.map((p, i) =>
                    typeof p === 'number' ? (
                      <Button key={i} variant={p === page ? 'default' : 'outline'} size="sm" className="h-8 w-8" onClick={() => setPage(p)}>{p}</Button>
                    ) : (
                      <span key={i} className="px-1 text-muted-foreground text-sm">{p}</span>
                    )
                  )
                })()}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.lastPage}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) setSelectedPaymentId(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>Payment ID: {selectedPayment?.id}</DialogDescription>
          </DialogHeader>
          {selectedPayment ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment ID</span>
                <span className="font-mono text-sm">{selectedPayment.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ride Booking ID</span>
                <span className="font-mono text-sm">{selectedPayment.rideId?.slice(0, 12) ?? 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-lg">{formatCurrency(selectedPayment.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-medium capitalize">{selectedPayment.paymentMethod ?? 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={selectedPayment.status} type="payment" />
              </div>
              {selectedPayment.driver && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Driver</span>
                  <span className="font-medium">{selectedPayment.driver.name}</span>
                </div>
              )}
              <Separator />
              <div className="text-xs text-muted-foreground space-y-1">
                {selectedPayment.platformFee > 0 && (
                  <div className="flex justify-between">
                    <span>Platform Fee</span>
                    <span>{formatCurrency(selectedPayment.platformFee)}</span>
                  </div>
                )}
                {selectedPayment.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatCurrency(selectedPayment.taxAmount)}</span>
                  </div>
                )}
                {selectedPayment.driverAmount > 0 && (
                  <div className="flex justify-between">
                    <span>Driver Amount</span>
                    <span>{formatCurrency(selectedPayment.driverAmount)}</span>
                  </div>
                )}
                {(selectedPayment.appliedCommissionRate ?? 0) > 0 && (
                  <div className="flex justify-between">
                    <span>Commission Rate</span>
                    <span>{selectedPayment.appliedCommissionRate}%</span>
                  </div>
                )}
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Paid At</span>
                  <span>{formatDate(selectedPayment.paidAt)}</span>
                </div>
                {selectedPayment.refundedAt && (
                  <div className="flex justify-between">
                    <span>Refunded At</span>
                    <span>{formatDate(selectedPayment.refundedAt)}</span>
                  </div>
                )}
                {selectedPayment.transactionId && (
                  <div className="flex justify-between">
                    <span>Transaction ID</span>
                    <span className="font-mono text-xs">{selectedPayment.transactionId}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <LoadingScreen fullScreen={false} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
