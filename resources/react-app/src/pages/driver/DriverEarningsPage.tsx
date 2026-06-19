import { useState, useMemo } from 'react'
import {
  DollarSign, TrendingUp, Calendar, Wallet,
  ArrowRight, CheckCircle, XCircle, Clock,
} from 'lucide-react'
import { useEarnings } from '@/hooks/useDrivers'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/common/StatCard'
import { DashboardCharts } from '@/components/common/DashboardCharts'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import type { Transaction } from '@/types'

type Period = 'daily' | 'weekly' | 'monthly'

export default function DriverEarningsPage() {
  const [period, setPeriod] = useState<Period>('daily')
  const { data, isLoading, error, refetch } = useEarnings()

  const earningsData = data?.data as {
    today: number
    weekly: number
    monthly: number
    total: number
    cashCollected: number
    walletEarnings: number
    currentBalance: number
    outstandingDebt: number
    outstandingCommission: number
    cashChangeLiability: number
    todayCommission: number
    chartData: { label: string; amount: number }[]
    recentTransactions: Transaction[]
    breakdown: { baseFare: number; tips: number; bonuses: number }
  } | undefined

  const chartData = useMemo(() => {
    if (!earningsData?.chartData) return []
    return earningsData.chartData.map((d) => ({
      name: d.label,
      Earnings: d.amount,
    }))
  }, [earningsData?.chartData])

  if (isLoading) return <LoadingScreen />
  if (error) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader title="Earnings" description="Track your earnings and transactions" />

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today"
          value={formatCurrency(earningsData?.today ?? 0)}
          icon={DollarSign}
          variant="green"
        />
        <StatCard
          title="This Week"
          value={formatCurrency(earningsData?.weekly ?? 0)}
          icon={TrendingUp}
          variant="blue"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(earningsData?.monthly ?? 0)}
          icon={Calendar}
          variant="purple"
        />
        <StatCard
          title="Total"
          value={formatCurrency(earningsData?.total ?? 0)}
          icon={Wallet}
          variant="yellow"
        />
      </div>

      {/* Earnings Breakdown Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Earnings Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Cash Collected</p>
              <p className="font-semibold">{formatCurrency(earningsData?.cashCollected ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Wallet Earnings</p>
              <p className="font-semibold">{formatCurrency(earningsData?.walletEarnings ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Balance</p>
              <p className="font-semibold">{formatCurrency(earningsData?.currentBalance ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Earnings</p>
              <p className="font-semibold">{formatCurrency(earningsData?.total ?? 0)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Dues */}
      {earningsData && earningsData.outstandingDebt > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-600" />
              Company Dues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Outstanding Debt</span>
                <span className="font-semibold text-amber-700">{formatCurrency(earningsData.outstandingDebt)}</span>
              </div>
              {earningsData.outstandingCommission > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unpaid Commission</span>
                  <span className="font-medium">{formatCurrency(earningsData.outstandingCommission)}</span>
                </div>
              )}
              {earningsData.cashChangeLiability > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cash Change Liability</span>
                  <span className="font-medium">{formatCurrency(earningsData.cashChangeLiability)}</span>
                </div>
              )}
              {earningsData.todayCommission > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Today's Commission Due</span>
                  <span className="font-medium">{formatCurrency(earningsData.todayCommission)}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">Outstanding dues to be settled with the company</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Earnings Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Earnings Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList className="mb-4">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
            <TabsContent value={period}>
              {chartData.length > 0 ? (
                <DashboardCharts
                  type="line"
                  data={chartData}
                  config={{ xAxisKey: 'name', title: '', height: 300 }}
                />
              ) : (
                <EmptyState title="No earnings data yet" />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Earnings Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Base Fare</span>
              <span className="font-semibold">
                {formatCurrency(earningsData?.breakdown?.baseFare ?? 0)}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tips</span>
              <span className="font-semibold text-emerald-600">
                {formatCurrency(earningsData?.breakdown?.tips ?? 0)}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Bonuses</span>
              <span className="font-semibold text-blue-600">
                {formatCurrency(earningsData?.breakdown?.bonuses ?? 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {(!earningsData?.recentTransactions || earningsData.recentTransactions.length === 0) ? (
              <EmptyState title="No transactions yet" />
            ) : (
              <div className="space-y-3">
                {earningsData.recentTransactions.map((txn: Transaction) => (
                  <div
                    key={txn.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center ${
                        txn.type === 'credit' ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-red-100 dark:bg-red-900/50'
                      }`}>
                        {txn.type === 'credit' ? (
                          <ArrowRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ArrowRight className="h-4 w-4 text-red-600 dark:text-red-400 rotate-180" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{txn.description || 'Ride payment'}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(txn.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        txn.type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                      </p>
                      <Badge variant={txn.status === 'completed' ? 'success' : txn.status === 'pending' ? 'warning' : 'destructive'}>
                        {txn.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
