import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, Download, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { useAdminPayments } from '@/hooks/useAdmin'
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
    toast.success('Payments exported successfully')
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>Transaction information</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Transaction ID</p>
                <p className="font-medium">{selectedPayment.transactionId ?? String(selectedPayment.id).slice(0, 8)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <StatusBadge status={selectedPayment.status} type="payment" />
              </div>
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-medium">{formatCurrency(selectedPayment.amount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Platform Fee</p>
                <p className="font-medium">{formatCurrency(selectedPayment.platformFee)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Driver Payout</p>
                <p className="font-medium">{formatCurrency(selectedPayment.driverAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tax</p>
                <p className="font-medium">{formatCurrency(selectedPayment.taxAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-medium">{selectedPayment.paymentMethod ?? '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Currency</p>
                <p className="font-medium">{selectedPayment.currency}</p>
              </div>
              {selectedPayment.paidAt && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Paid At</p>
                  <p className="font-medium">{formatDate(selectedPayment.paidAt)}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
