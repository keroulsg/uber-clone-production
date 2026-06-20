import { useDashboard, useCharts, useAdminRides, useAdminDrivers, useLiveDrivers, useSurgeData } from '@/hooks/useAdmin'
import { Link } from 'react-router-dom'
import {
  Users, Car, UserCircle, DollarSign, TrendingUp, Calendar, MapPin,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { DashboardCharts } from '@/components/common/DashboardCharts'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import { Map } from '@/components/common/Map'
import type { SurgeZone } from '@/components/common/Map'
import type { ApiResponse, DashboardStats, PaginatedResponse, Ride, Driver, RoutePoint } from '@/types'

export default function AdminDashboardPage() {
  const { data: dashRes, isLoading: dashLoading, isError: dashError, refetch: dashRefetch } = useDashboard()
  const { data: chartRes, isLoading: chartLoading } = useCharts('weekly')
  const { data: latestRidesRes, isLoading: ridesLoading } = useAdminRides({ per_page: 5 })
  const { data: latestDriversRes, isLoading: driversLoading } = useAdminDrivers({ per_page: 5 })
  const { data: liveDriversData, isLoading: liveLoading } = useLiveDrivers()
  const { data: surgeData } = useSurgeData(30.05, 31.24)

  const stats: DashboardStats | undefined = dashRes?.data
  const chartData = chartRes?.data
  const response = latestRidesRes?.data as any
  const latestRides: Ride[] = response?.data ?? []
  const driverResponse = latestDriversRes?.data as any
  const latestDrivers: Driver[] = (driverResponse?.data ?? []).map((item: any) => item.driver ?? item)

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'

  if (dashLoading) return <LoadingScreen message="Loading dashboard..." />
  if (dashError) return <ErrorState onRetry={() => dashRefetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting}, Admin`}
        description={formatDate(today)}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          variant="blue"
          href="/admin/riders"
          trend={stats?.growthPercentages ? { value: stats.growthPercentages.users, isPositive: stats.growthPercentages.users >= 0 } : undefined}
        />
        <StatCard
          title="Total Drivers"
          value={stats?.totalDrivers ?? 0}
          icon={UserCircle}
          variant="green"
          href="/admin/drivers"
          trend={stats?.growthPercentages ? { value: stats.growthPercentages.drivers, isPositive: stats.growthPercentages.drivers >= 0 } : undefined}
        />
        <StatCard
          title="Active Rides"
          value={stats?.activeDrivers ?? 0}
          icon={Car}
          variant="yellow"
          href="/admin/rides"
        />
        <StatCard
          title="Today Revenue"
          value={formatCurrency(stats?.todayRevenue ?? 0)}
          icon={DollarSign}
          variant="green"
          href="/admin/reports"
        />
        <StatCard
          title="Weekly Revenue"
          value={formatCurrency(stats?.weeklyRevenue ?? 0)}
          icon={Calendar}
          variant="purple"
          href="/admin/reports"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.monthlyRevenue ?? 0)}
          icon={TrendingUp}
          variant="blue"
          href="/admin/reports"
        />
      </div>

      {chartLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card><CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">Loading charts...</CardContent></Card>
          <Card><CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">Loading charts...</CardContent></Card>
        </div>
      ) : chartData ? (() => {
        const cd = chartData as { labels: string[]; datasets: { label: string; data: number[] }[] }
        const labels = cd?.labels ?? []
        const datasets = cd?.datasets ?? []
        if (labels.length === 0) return null
        
        const combinedData = labels.map((label: string, i: number) => {
          const point: Record<string, string | number> = { label }
          datasets.forEach((ds: { label: string; data: number[] }) => {
            point[ds.label] = ds.data[i] ?? 0
          })
          return point
        })

        return (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <DashboardCharts
              type="line"
              data={combinedData.map((d: Record<string, string | number>) => ({ label: d.label, Revenue: d.Revenue ?? d.revenue ?? 0 }))}
              config={{ title: 'Revenue Trends', xAxisKey: 'label', height: 300 }}
              className="md:col-span-2"
            />
            <DashboardCharts
              type="area"
              data={combinedData.map((d: Record<string, string | number>) => ({ label: d.label, Rides: d.Rides ?? d.rides ?? 0 }))}
              config={{ title: 'Ride Trends', xAxisKey: 'label', height: 300 }}
            />
            <DashboardCharts
              type="bar"
              data={combinedData.map((d: Record<string, string | number>) => ({ label: d.label, Users: d.Users ?? d.users ?? 0 }))}
              config={{ title: 'User Growth', xAxisKey: 'label', height: 300 }}
            />
          </div>
        )
      })() : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Latest Rides</CardTitle>
            <Link to="/admin/rides" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {ridesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-3 w-40 bg-muted rounded" />
                    </div>
                    <div className="text-right space-y-1">
                      <div className="h-4 w-16 bg-muted rounded" />
                      <div className="h-3 w-12 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : latestRides.length === 0 ? (
              <EmptyState title="No rides yet" />
            ) : (
              <div className="space-y-4">
                {latestRides.map((ride: Ride) => (
                  <Link
                    key={ride.id}
                    to="/admin/rides"
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {ride.rider?.name?.charAt(0) ?? 'R'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">Ride #{ride.bookingId}</p>
                        <p className="text-xs text-muted-foreground">
                          {ride.pickup?.address ?? 'Pickup'} → {ride.destination?.address ?? 'Destination'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(Number((ride as any).estimatedFare ?? (ride as any).estimated_fare ?? 0))}</p>
                      <StatusBadge status={ride.status} type="ride" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Latest Drivers</CardTitle>
            <Link to="/admin/drivers" className="text-sm text-primary hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {driversLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-3 w-16 bg-muted rounded" />
                    </div>
                    <div className="h-6 w-16 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : latestDrivers.length === 0 ? (
              <EmptyState title="No drivers yet" />
            ) : (
              <div className="space-y-4">
                {latestDrivers.map((driver: Driver) => (
                  <Link
                    key={driver.id}
                    to="/admin/drivers"
                    className="flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {driver.user?.name?.charAt(0) ?? 'D'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">{driver.user?.name ?? 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{Number((driver as any).averageRating ?? (driver as any).average_rating ?? 0).toFixed(1)} ★</p>
                      </div>
                    </div>
                    <Badge variant={driver.isOnline ? 'success' : 'secondary'}>
                      {driver.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Live Drivers Map
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {(liveDriversData?.data as any[] | undefined)?.length ?? 0} online
            </Badge>
            <SurgeBadge />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {liveLoading ? (
            <div className="h-[300px] rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">Loading map...</div>
          ) : (() => {
            const drivers = (liveDriversData?.data as any[] | undefined) ?? []
            const withCoords = drivers.filter((d) => d.latitude != null && d.longitude != null)

            if (drivers.length === 0) {
              return (
                <div className="h-[300px] rounded-lg bg-muted/50 flex flex-col items-center justify-center text-muted-foreground">
                  <Car className="h-10 w-10 mb-2" />
                  <p>No online drivers</p>
                </div>
              )
            }

            if (withCoords.length === 0) {
              return (
                <div className="h-[300px] rounded-lg bg-amber-50 border border-amber-200 flex flex-col items-center justify-center text-amber-700">
                  <MapPin className="h-10 w-10 mb-2" />
                  <p className="font-medium">{drivers.length} driver(s) online but missing coordinates</p>
                </div>
              )
            }

            return (
              <>
                <Map
                  height={300}
                  center={{ lat: withCoords[0].latitude, lng: withCoords[0].longitude }}
                  markers={withCoords.map((d) => ({
                    lat: d.latitude,
                    lng: d.longitude,
                    color: 'green' as const,
                    label: d.user?.name?.charAt(0) ?? 'D',
                  }))}
                  surgeZone={surgeData?.data as SurgeZone | null | undefined}
                />
                <div className="text-xs text-muted-foreground space-y-1">
                  {withCoords.slice(0, 10).map((d: any) => (
                    <div key={d.id} className="flex justify-between">
                      <span className="font-medium">{d.user?.name ?? 'Unknown'}</span>
                      <span>
                        {d.vehicle?.vehicleType?.name ?? '—'} · {d.vehicle?.licensePlate ?? '—'}
                      </span>
                    </div>
                  ))}
                  {withCoords.length > 10 && (
                    <p className="text-center pt-1">+{withCoords.length - 10} more</p>
                  )}
                </div>
              </>
            )
          })()}
        </CardContent>
      </Card>
    </div>
  )
}

function SurgeBadge() {
  const { data: surgeRes } = useSurgeData(30.05, 31.24)
  const surge = surgeRes?.data as SurgeZone | undefined

  if (!surge || surge.multiplier <= 1.0) return null

  const colorMap: Record<string, string> = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  }

  return (
    <Badge className={cn('border', colorMap[surge.zone] || '')} variant="outline">
      🔥 {surge.multiplier}x Surge &middot; {surge.openRequests} req / {surge.availableDrivers} drivers
    </Badge>
  )
}
