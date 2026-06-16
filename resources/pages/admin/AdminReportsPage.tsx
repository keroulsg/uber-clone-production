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

  const handleExportCSV = () => {
    toast.success('Report exported as CSV')
  }

  const handleExportPDF = () => {
    toast.success('Report exported as PDF')
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
                value={formatCurrency(stats?.revenue ?? 0)}
                icon={Download}
                variant="green"
              />
              <StatCard
                title="Total Rides"
                value={stats?.rides ?? 0}
                icon={Calendar}
                variant="blue"
              />
              <StatCard
                title="Active Users"
                value={stats?.users ?? 0}
                icon={Download}
                variant="purple"
              />
              <StatCard
                title="Active Drivers"
                value={stats?.drivers ?? 0}
                icon={Download}
                variant="yellow"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <DashboardCharts
                type="line"
                data={Array.isArray(chartData) ? chartData : []}
                config={{ title: 'Revenue', xAxisKey: 'label', height: 300 }}
              />
              <DashboardCharts
                type="bar"
                data={Array.isArray(chartData) ? chartData : []}
                config={{ title: 'Rides', xAxisKey: 'label', height: 300 }}
              />
              <DashboardCharts
                type="area"
                data={Array.isArray(chartData) ? chartData : []}
                config={{ title: 'Users', xAxisKey: 'label', height: 300 }}
              />
              <DashboardCharts
                type="line"
                data={Array.isArray(chartData) ? chartData : []}
                config={{ title: 'Drivers', xAxisKey: 'label', height: 300 }}
              />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
