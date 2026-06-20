import { useState } from 'react'
import { Download, FileText, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { useCharts, useStats } from '@/hooks/useAdmin'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { DashboardCharts } from '@/components/common/DashboardCharts'
import { StatCard } from '@/components/common/StatCard'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
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

  const { data: chartRes, isLoading: chartLoading, isError: chartError, refetch: chartRefetch } = useCharts(period)
  const { data: statsRes, isLoading: statsLoading } = useStats()

  const chartData = chartRes?.data
  const stats = statsRes?.data as any

  const chartDataForDisplay = (() => {
    const cd = chartData as { labels: string[]; datasets?: { label: string; data: number[] }[] } | undefined
    const labels = cd?.labels ?? []
    const datasets = cd?.datasets ?? []
    if (labels.length === 0) return []
    return labels.map((label: string, i: number) => {
      const point: Record<string, string | number> = { label }
      datasets.forEach((ds: { label: string; data: number[] }) => { point[ds.label] = ds.data[i] ?? 0 })
      return point
    })
  })()

  const handleExportCSV = () => {
    if (chartDataForDisplay.length === 0) {
      toast.error('No data to export')
      return
    }
    const headers = Object.keys(chartDataForDisplay[0] ?? {})
    const rows = chartDataForDisplay.map((row: any) => headers.map((h: string) => row[h]))
    const csv = [headers.join(','), ...rows.map((r: any[]) => r.map((c: any) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `report-${period}-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Report exported as CSV')
  }

  const handleExportPDF = () => {
    toast.info('PDF export coming soon')
  }

  if (chartLoading || statsLoading) return <LoadingScreen message="Loading reports..." />
  if (chartError) return <ErrorState onRetry={() => chartRefetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Analytics and reports for your business"
        actions={[
          { label: 'Export CSV', onClick: handleExportCSV, icon: FileText },
          { label: 'Export PDF', onClick: handleExportPDF, icon: Download },
        ]}
      />

      <Tabs value={period} onValueChange={setPeriod}>
        <div className="flex items-center justify-between">
          <TabsList>
            {periods.map((p) => (
              <TabsTrigger key={p.value} value={p.value} disabled={p.value === 'custom' && !dateFrom && !dateTo}>
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <div className="space-y-1">
                <Label className="text-xs">From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-8 w-40"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-8 w-40"
                />
              </div>
            </div>
          )}
        </div>

        {periods.map((p) => (
          <TabsContent key={p.value} value={p.value} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Revenue"
                value={formatCurrency(stats?.totalRevenue ?? 0)}
                icon={Download}
                variant="green"
              />
              <StatCard
                title="Today Revenue"
                value={formatCurrency(stats?.todayRevenue ?? 0)}
                icon={Calendar}
                variant="blue"
              />
              <StatCard
                title="Total Rides"
                value={stats?.totalRides ?? 0}
                icon={Download}
                variant="purple"
              />
              <StatCard
                title="Total Drivers"
                value={stats?.totalDrivers ?? 0}
                icon={Download}
                variant="yellow"
              />
              <StatCard
                title="Total Users"
                value={stats?.totalUsers ?? 0}
                icon={Download}
                variant="purple"
              />
              <StatCard
                title="Active Drivers"
                value={stats?.activeDrivers ?? 0}
                icon={Download}
                variant="green"
              />
              <StatCard
                title="Weekly Revenue"
                value={formatCurrency(stats?.weeklyRevenue ?? 0)}
                icon={Download}
                variant="blue"
              />
              <StatCard
                title="Monthly Revenue"
                value={formatCurrency(stats?.monthlyRevenue ?? 0)}
                icon={Download}
                variant="purple"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <DashboardCharts
                type="line"
                data={chartDataForDisplay.map((d: any) => ({ label: d.label, Revenue: d.Revenue ?? d.revenue ?? 0 }))}
                config={{ title: 'Revenue', xAxisKey: 'label', height: 300 }}
              />
              <DashboardCharts
                type="bar"
                data={chartDataForDisplay.map((d: any) => ({ label: d.label, Rides: d.Rides ?? d.rides ?? 0 }))}
                config={{ title: 'Rides', xAxisKey: 'label', height: 300 }}
              />
              <DashboardCharts
                type="area"
                data={chartDataForDisplay.map((d: any) => ({ label: d.label, Users: d.Users ?? d.users ?? 0 }))}
                config={{ title: 'Users', xAxisKey: 'label', height: 300 }}
              />
              <DashboardCharts
                type="line"
                data={chartDataForDisplay.map((d: any) => ({ label: d.label, Drivers: d.Drivers ?? d.drivers ?? 0 }))}
                config={{ title: 'Drivers', xAxisKey: 'label', height: 300 }}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
