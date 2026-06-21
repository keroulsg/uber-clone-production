import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Download, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { useAdminPayments, usePaymentDetail } from '@/hooks/useAdmin'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Payment } from '@/types'

export default function AdminPaymentsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

  const { data, isLoading, isError, refetch } = useAdminPayments({
    page,
    per_page: perPage,
    ...(statusFilter ? { status: statusFilter } : {}),
  })

  const payments = data?.data?.data ?? []
  const meta = data?.data?.meta

  const totalRevenue = payments.reduce((sum: number, p: Payment) => sum + p.amount, 0)
  const totalFees = payments.reduce((sum: number, p: Payment) => sum + p.platformFee, 0)

  const columns: Column<Payment>[] = [
    {
      header: 'Transaction ID',
      accessor: (row) => row.transactionId ?? String(row.id).slice(0, 8),
      sortable: true,
    },
    {
      header: 'Rider',
      accessor: (row) => '',
      cell: (row) => {
        const rider = (row as any).rider
        return rider?.id ? (
          <span className="cursor-pointer text-primary hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/admin/riders/${rider.id}`) }}>
            {rider.name}
          </span>
        ) : <span className="text-muted-foreground">—</span>
      },
    },
    {
      header: 'Driver',
      accessor: (row) => '',
      cell: (row) => {
        const driver = (row as any).driver
        return driver?.id ? (
          <span className="cursor-pointer text-primary hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/admin/drivers/${driver.id}`) }}>
            {driver.name}
          </span>
        ) : <span className="text-muted-foreground">—</span>
      },
    },
    {
      header: 'Amount',
      accessor: (row) => formatCurrency(row.amount),
      sortable: true,
    },
    {
      header: 'Fee',
      accessor: (row) => formatCurrency(row.platformFee),
    },
    {
      header: 'Method',
      accessor: (row) => row.paymentMethod ?? '—',
    },
    {
      header: 'Status',
      accessor: 'status' as keyof Payment,
      cell: (row) => <StatusBadge status={row.status} type="payment" />,
    },
    {
      header: 'Date',
      accessor: (row) => formatDate(row.paidAt ?? new Date().toISOString()),
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (row) => '',
      cell: (row) => (
        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedPayment(row) }}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const handleExport = () => {
    const headers = ['Transaction ID', 'Rider', 'Driver', 'Amount', 'Fee', 'Method', 'Status', 'Date']
    const rows = payments.map((p: Payment) => [
      p.transactionId ?? p.id,
      (p as any).rider?.name ?? '',
      (p as any).driver?.name ?? '',
      p.amount, p.platformFee, p.paymentMethod ?? '', p.status, p.paidAt ?? '',
    ])
    const csv = [headers.join(','), ...rows.map((r: any[]) => r.map((c: any) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Payments exported')
  }

  if (isLoading) return <LoadingScreen message="Loading payments..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="View and manage all payment transactions"
        actions={[
          { label: 'Export', onClick: handleExport, icon: Download },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold">{formatCurrency(totalRevenue)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Platform Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{formatCurrency(totalFees)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{formatCurrency(totalRevenue - totalFees)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DataTable<Payment>
            columns={columns}
            data={payments}
            keyExtractor={(p) => p.id}
            searchable
            searchPlaceholder="Search transactions..."
            page={page}
            lastPage={meta?.lastPage ?? 1}
            total={meta?.total ?? 0}
            from={meta?.from ?? 0}
            to={meta?.to ?? 0}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            onRowClick={(payment) => setSelectedPayment(payment)}
          />
        </CardContent>
      </Card>

      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedPayment && <PaymentDetailContent paymentId={selectedPayment.id} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PaymentDetailContent({ paymentId }: { paymentId: string }) {
  const { data: detailRes, isLoading } = usePaymentDetail(paymentId)
  const detail = detailRes?.data as any
  const payment = detail?.payment as any
  const debts = detail?.driver_debts ?? []
  const ledgerEntries = detail?.ledger_entries ?? []

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading payment details...</div>
  if (!payment) return <div className="py-8 text-center text-muted-foreground">Payment not found</div>

  return (
    <>
      <DialogHeader>
        <DialogTitle>Payment Details</DialogTitle>
        <DialogDescription>Transaction #{payment.transactionId ?? payment.id?.slice(0, 8)}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold mb-2">Payment Info</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><p className="text-muted-foreground text-xs">Amount</p><p className="font-medium">{formatCurrency(payment.amount)}</p></div>
            <div><p className="text-muted-foreground text-xs">Status</p><StatusBadge status={payment.status} type="payment" /></div>
            <div><p className="text-muted-foreground text-xs">Method</p><p className="font-medium capitalize">{payment.paymentMethod ?? '—'}</p></div>
            <div><p className="text-muted-foreground text-xs">Currency</p><p className="font-medium">{payment.currency}</p></div>
            <div><p className="text-muted-foreground text-xs">Commission</p><p className="font-medium">{formatCurrency(payment.companyCommission ?? payment.platformFee ?? 0)}</p></div>
            <div><p className="text-muted-foreground text-xs">Driver Payout</p><p className="font-medium">{formatCurrency(payment.driverAmount ?? 0)}</p></div>
            <div><p className="text-muted-foreground text-xs">Rider</p><p className="font-medium">{payment.rider?.name ?? '—'}</p></div>
            <div><p className="text-muted-foreground text-xs">Driver</p><p className="font-medium">{payment.driver?.name ?? '—'}</p></div>
            {payment.paidAt && <div className="col-span-2"><p className="text-muted-foreground text-xs">Paid At</p><p className="font-medium">{formatDate(payment.paidAt)}</p></div>}
          </div>
        </div>

        {debts.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Driver Debts</h4>
            <div className="space-y-1">
              {debts.map((d: any) => (
                <div key={d.id} className="flex justify-between text-sm p-2 rounded bg-amber-50 border border-amber-200">
                  <span className="capitalize">{d.type.replace(/_/g, ' ')}</span>
                  <span className="font-medium text-amber-700">{formatCurrency(d.amount)}</span>
                  <span className="text-xs">{d.status === 'paid' ? 'Paid' : 'Unpaid'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {ledgerEntries.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Ledger Entries</h4>
            <div className="space-y-1">
              {ledgerEntries.map((e: any) => (
                <div key={e.id} className="flex justify-between text-sm p-2 rounded bg-muted">
                  <div>
                    <span className={e.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}>
                      {e.type === 'credit' ? '+' : '-'}{formatCurrency(e.amount)}
                    </span>
                    <span className="text-muted-foreground ml-2">{e.description}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(e.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {debts.length === 0 && ledgerEntries.length === 0 && payment.paymentMethod === 'cash' && (
          <p className="text-xs text-muted-foreground">Cash ride — driver collects payment directly. No wallet movement.</p>
        )}
        {debts.length === 0 && ledgerEntries.length === 0 && payment.paymentMethod === 'wallet' && (
          <p className="text-xs text-muted-foreground">Wallet ride — full amount processed through wallet system.</p>
        )}
      </div>
    </>
  )
}
