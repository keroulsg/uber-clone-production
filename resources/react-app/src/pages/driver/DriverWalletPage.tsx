import { useQuery } from '@tanstack/react-query'
import { Wallet, DollarSign, TrendingUp, CreditCard, AlertTriangle, ArrowUpDown } from 'lucide-react'
import { getDriverWallet } from '@/api/drivers'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { Separator } from '@/components/ui/separator'

export default function DriverWalletPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['driver', 'wallet'],
    queryFn: () => getDriverWallet(),
  })

  const d = data?.data as any
  const balance = d?.balance ?? 0
  const todayEarnings = d?.today_earnings ?? 0
  const weeklyEarnings = d?.weekly_earnings ?? 0
  const totalEarnings = d?.total_earnings ?? 0
  const cashCollected = d?.cash_collected ?? 0
  const walletEarnings = d?.wallet_earnings ?? 0
  const debts = d?.debts ?? {}
  const transactions = d?.transactions ?? []

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader title="My Wallet" description="Track your earnings, balance, and company dues" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{formatCurrency(balance)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <span className="text-2xl font-bold">{formatCurrency(todayEarnings)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">{formatCurrency(weeklyEarnings)}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-purple-500" />
              <span className="text-2xl font-bold">{formatCurrency(totalEarnings)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Earnings Split</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cash Collected</span>
                <span className="font-medium">{formatCurrency(cashCollected)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallet Earnings</span>
                <span className="font-medium">{formatCurrency(walletEarnings)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total Lifetime Earnings</span>
                <span>{formatCurrency(totalEarnings)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unpaid Commission</span>
                  <span>{formatCurrency(debts.unpaid_commission)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cash Change Liability</span>
                  <span>{formatCurrency(debts.cash_change_liability)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Today's Commission</span>
                  <span>{formatCurrency(debts.today_commission)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">This Week Commission</span>
                  <span>{formatCurrency(debts.weekly_commission)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">This Month Commission</span>
                  <span>{formatCurrency(debts.monthly_commission)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Cash rides create commission debt. Wallet rides do not.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((txn: any) => (
                <div key={txn.id} className="flex items-center justify-between text-sm p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium capitalize ${txn.type === 'credit' || txn.type === 'cash_collection' ? 'text-emerald-600' : txn.type === 'debit' ? 'text-red-600' : 'text-amber-600'}`}>
                        {txn.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(txn.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{txn.description}</p>
                  </div>
                  <div className="text-right ml-2">
                    <p className="font-medium">{txn.type === 'credit' || txn.type === 'cash_collection' ? '' : ''}{formatCurrency(txn.amount)}</p>
                    {txn.balance_after != null && (
                      <p className="text-xs text-muted-foreground">Balance: {formatCurrency(txn.balance_after)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}