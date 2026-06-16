import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Navigation } from 'lucide-react'
import { useAdminRideDetail } from '@/hooks/useAdmin'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function AdminRideDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useAdminRideDetail(id!)

  const result = data?.data as any
  const ride = result?.ride ?? null
  const statusHistory = result?.status_history ?? []
  const ledgerEntries = result?.ledger_entries ?? []
  const debts = result?.debts ?? []

  if (isLoading) return <LoadingScreen message="Loading ride..." />
  if (isError || !ride) return <ErrorState onRetry={() => refetch()} />

  const pickup = ride.pickup ?? {}
  const destination = ride.destination ?? {}
  const fareBd = ride.fareBreakdown ?? {}

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Ride #${ride.id}`}
        description={`Booking: ${ride.bookingId}`}
        actions={[
          { label: 'Back', onClick: () => navigate('/admin/rides'), icon: ArrowLeft },
        ]}
      />

      <Card>
        <CardHeader><CardTitle>Ride Overview</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-muted-foreground">Status</p><StatusBadge status={ride.status} type="ride" /></div>
            <div><p className="text-muted-foreground">Booking ID</p><p className="font-medium">{ride.bookingId}</p></div>
            <div><p className="text-muted-foreground">Created</p><p className="font-medium">{formatDate(ride.createdAt)}</p></div>
            <div><p className="text-muted-foreground">Payment Method</p><p className="font-medium">{ride.paymentMethod ?? '—'}</p></div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Rider</CardTitle></CardHeader>
          <CardContent>
            {ride.rider ? (
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/admin/riders/${ride.rider.id}`)}>
                <Avatar><AvatarImage src={ride.rider?.avatarUrl} /><AvatarFallback>{getInitials(ride.rider?.name ?? 'R')}</AvatarFallback></Avatar>
                <div>
                  <p className="font-medium">{ride.rider?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{ride.rider?.phone}</p>
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Driver</CardTitle></CardHeader>
          <CardContent>
            {ride.driver ? (
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/admin/drivers/${ride.driver?.id}`)}>
                <Avatar><AvatarImage src={ride.driver?.user?.avatarUrl} /><AvatarFallback>{getInitials(ride.driver?.user?.name ?? 'D')}</AvatarFallback></Avatar>
                <div>
                  <p className="font-medium">{ride.driver?.user?.name ?? 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{ride.driver?.user?.phone}</p>
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Route</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center mt-1">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <div className="w-0.5 h-10 bg-border" />
                <div className="w-3 h-3 rounded-full bg-destructive" />
              </div>
              <div className="space-y-8">
                <div>
                  <p className="font-medium">Pickup</p>
                  <p className="text-sm text-muted-foreground">{pickup.address ?? '—'}</p>
                </div>
                <div>
                  <p className="font-medium">Destination</p>
                  <p className="text-sm text-muted-foreground">{destination.address ?? '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Fare Breakdown</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-muted-foreground">Base</p><p className="font-medium">{formatCurrency(fareBd.base ?? 0)}</p></div>
            <div><p className="text-muted-foreground">Distance</p><p className="font-medium">{formatCurrency(fareBd.distance ?? 0)}</p></div>
            <div><p className="text-muted-foreground">Time</p><p className="font-medium">{formatCurrency(fareBd.time ?? 0)}</p></div>
            <div><p className="text-muted-foreground">Surge</p><p className="font-medium">{formatCurrency(fareBd.surge ?? 0)}</p></div>
            <div><p className="text-muted-foreground">Night</p><p className="font-medium">{formatCurrency(fareBd.night ?? 0)}</p></div>
            <div><p className="text-muted-foreground">Peak</p><p className="font-medium">{formatCurrency(fareBd.peak ?? 0)}</p></div>
            <div><p className="text-muted-foreground">Waiting</p><p className="font-medium">{formatCurrency(fareBd.waiting ?? 0)}</p></div>
            <div><p className="text-muted-foreground">Discount</p><p className="font-medium">{formatCurrency(fareBd.discount ?? 0)}</p></div>
            <div className="col-span-2"><p className="text-muted-foreground">Total Fare</p><p className="font-bold text-lg">{formatCurrency(fareBd.total ?? ride.actualFare ?? ride.estimatedFare ?? 0)}</p></div>
            <div><p className="text-muted-foreground">Commission</p><p className="font-medium">{formatCurrency(ride.companyCommission ?? 0)}</p></div>
            <div><p className="text-muted-foreground">Driver Amount</p><p className="font-medium">{formatCurrency(ride.driverRideAmount ?? 0)}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Status Timeline</CardTitle></CardHeader>
        <CardContent>
          {statusHistory.length > 0 ? (
            <div className="space-y-2">
              {statusHistory.map((h: any) => (
                <div key={h.id} className="flex items-center gap-3 text-sm">
                  <Badge variant="outline">{h.from_status} → {h.to_status}</Badge>
                  <span className="text-muted-foreground">{formatDate(h.created_at)}</span>
                  {h.changed_by && <span className="text-xs text-muted-foreground">by {h.changed_by}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No status history</p>
          )}
        </CardContent>
      </Card>

      {ledgerEntries.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Ledger Entries</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ledgerEntries.map((e: any) => (
                <div key={e.id} className="flex justify-between text-sm p-2 border-b last:border-0">
                  <span className={e.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}>
                    {e.type === 'credit' ? '+' : '-'}{formatCurrency(e.amount)}
                  </span>
                  <span className="text-muted-foreground">{e.description}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(e.created_at)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {debts.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Driver Debts</CardTitle></CardHeader>
          <CardContent>
            {debts.map((d: any) => (
              <div key={d.id} className="flex justify-between text-sm p-2 border-b last:border-0">
                <span>{formatCurrency(d.amount)}</span>
                <span className="text-muted-foreground">{d.type}</span>
                <StatusBadge status={d.status} type="payment" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
