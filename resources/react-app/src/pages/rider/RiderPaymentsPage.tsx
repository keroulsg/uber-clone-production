import { useState } from 'react'
import {
  CreditCard, Wallet, DollarSign,
} from 'lucide-react'
import { usePayments } from '@/hooks/usePayments'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { StatusBadge } from '@/components/common/StatusBadge'
import type { Payment } from '@/types'

export default function RiderPaymentsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, error, refetch } = usePayments({ page, ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }) })

  const payments = (data?.data?.payments ?? []) as Payment[]
  const rawMeta = data?.data?.meta as Record<string, unknown> | undefined
  const meta = {
    currentPage: (rawMeta?.currentPage ?? rawMeta?.current_page ?? 1) as number,
    lastPage: (rawMeta?.lastPage ?? rawMeta?.last_page ?? 1) as number,
    total: (rawMeta?.total ?? 0) as number,
  }

  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="View your payment history" />

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
    </div>
  )
}
