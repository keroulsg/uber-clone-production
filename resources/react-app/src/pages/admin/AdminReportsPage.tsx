import { useState } from 'react'
import { Download, DollarSign, TrendingUp, Users, Truck, AlertTriangle, FileText } from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/api/client'
import { useCharts } from '@/hooks/useAdmin'
import { formatCurrency } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardCharts } from '@/components/common/DashboardCharts'
import { StatCard } from '@/components/common/StatCard'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card, CardContent,
} from '@/components/ui/card'
import {
  Tabs, TabsList, TabsTrigger,
} from '@/components/ui/tabs'

const periods = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
] as const

export default function AdminReportsPage() {
  const [period, setPeriod] = useState<string>('weekly')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const chartParams = period === 'custom' && dateFrom && dateTo
    ? { period: 'custom', from: dateFrom, to: dateTo }
    : { period }

  const { data: chartRes, isLoading, isError, refetch } = useCharts(chartParams.period, chartParams.from, chartParams.to)
  const chartData = chartRes?.data as any
  const summary = chartData?.summary ?? {}
  const periodLabel = period === 'custom' && dateFrom ? `${dateFrom} — ${dateTo}` : period.charAt(0).toUpperCase() + period.slice(1)

  const chartDataForDisplay = (() => {
    const labels: string[] = chartData?.labels ?? []
    const datasets: { label: string; data: number[] }[] = chartData?.datasets ?? []
    if (labels.length === 0) return []
    return labels.map((label: string, i: number) => {
      const point: Record<string, string | number> = { label }
      datasets.forEach((ds) => { point[ds.label] = ds.data[i] ?? 0 })
      return point
    })
  })()

  const handleExportPDF = async () => {
    try {
      const params: Record<string, string> = { period }
      if (chartParams.from) params.from = chartParams.from
      if (chartParams.to) params.to = chartParams.to
      const res = await apiClient.get('/admin/reports/export-pdf', { params, responseType: 'text' })
      const w = window.open('', '_blank')
      if (!w) { toast.error('Popup blocked. Please allow popups.'); return }
      w.document.write(res.data)
      w.document.close()
      w.focus()
      w.print()
    } catch (err: any) {
      if (err?.response?.status === 401) {
        toast.error('Session expired. Please login again.')
      } else {
        toast.error('Failed to generate PDF report')
      }
    }
  }

  if (isLoading) return <LoadingScreen message="Loading reports..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description={`Analytics and reports — ${periodLabel}`}
        actions={[
          { label: 'Export PDF', onClick: handleExportPDF, icon: Download },
        ]}
      />

      <div className="flex items-center gap-3">
        <Tabs value={period} onValueChange={setPeriod}>
          <div className="flex items-center gap-3">
            <TabsList>
              {periods.map((p) => (
                <TabsTrigger key={p.value} value={p.value}>
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-36" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-36" />
            </div>
            <Button size="sm" className="mt-5" disabled={!dateFrom || !dateTo} onClick={() => refetch()}>
              Apply
            </Button>
          </div>
        )}
        {summary.from && <Badge variant="outline" className="ml-auto">{summary.from} — {summary.to}</Badge>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={formatCurrency(summary.totalRevenue ?? 0)} icon={DollarSign} variant="green" />
        <StatCard title="Completed Rides" value={summary.completedRides ?? 0} icon={TrendingUp} variant="blue" />
        <StatCard title="Active Drivers" value={summary.activeDrivers ?? 0} icon={Truck} variant="yellow" />
        <StatCard title="Total Users" value={summary.totalUsers ?? 0} icon={Users} variant="purple" />
        <StatCard title="Cash Revenue" value={formatCurrency(summary.cashRevenue ?? 0)} icon={DollarSign} variant="green" />
        <StatCard title="Wallet Revenue" value={formatCurrency(summary.walletRevenue ?? 0)} icon={DollarSign} variant="blue" />
        <StatCard title="Total Rides" value={summary.totalRides ?? 0} icon={TrendingUp} variant="purple" />
        <StatCard title="Cancelled Rides" value={summary.cancelledRides ?? 0} icon={FileText} variant="purple" />
        <StatCard title="Total Drivers" value={summary.totalDrivers ?? 0} icon={Truck} variant="yellow" />
        <StatCard title="Outstanding Debt" value={formatCurrency(summary.outstandingDebt ?? 0)} icon={AlertTriangle} variant="yellow" />
      </div>

      {chartDataForDisplay.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No data for selected range.</CardContent></Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <DashboardCharts type="line" data={chartDataForDisplay.map((d: any) => ({ label: d.label, Revenue: d.Revenue ?? 0 }))} config={{ title: 'Revenue', xAxisKey: 'label', height: 300 }} />
          <DashboardCharts type="bar" data={chartDataForDisplay.map((d: any) => ({ label: d.label, Rides: d.Rides ?? 0 }))} config={{ title: 'Rides', xAxisKey: 'label', height: 300 }} />
          <DashboardCharts type="area" data={chartDataForDisplay.map((d: any) => ({ label: d.label, Users: d.Users ?? 0 }))} config={{ title: 'Users', xAxisKey: 'label', height: 300 }} />
          <DashboardCharts type="bar" data={chartDataForDisplay.map((d: any) => ({ label: d.label, Drivers: d.Drivers ?? 0 }))} config={{ title: 'Drivers', xAxisKey: 'label', height: 300 }} />
        </div>
      )}
    </div>
  )
}
