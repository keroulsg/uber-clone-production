import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, PauseCircle, PlayCircle, MessageSquare, AlertTriangle, Ban, Unlock } from 'lucide-react'
import { toast } from 'sonner'
import { useRiderDetail, useSuspendRider, useReactivateRider, useBlockRider, useUnblockRider, useBanHistory } from '@/hooks/useAdmin'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

export default function AdminRiderProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useRiderDetail(id!)
  const suspendRider = useSuspendRider()
  const reactivateRider = useReactivateRider()
  const blockRider = useBlockRider()
  const unblockRider = useUnblockRider()

  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [blockDialog, setBlockDialog] = useState(false)
  const [blockReason, setBlockReason] = useState('')

  const result = data?.data as any
  const rider = result?.rider ?? null
  const user = result?.user ?? null
  const stats = result?.stats ?? {}
  const wallet = result?.wallet ?? null
  const complaints = result?.complaints ?? []
  const tickets = result?.tickets ?? []
  const recentRides = result?.recent_rides ?? []

  const { data: banHistoryData } = useBanHistory(user?.id ?? '')
  const banHistory = (banHistoryData as any)?.data?.history ?? []

  const handleSuspend = async () => {
    await suspendRider.mutateAsync(id!)
    toast.success('Rider suspended')
    refetch()
    setConfirmAction(null)
  }
  const handleReactivate = async () => {
    await reactivateRider.mutateAsync(id!)
    toast.success('Rider reactivated')
    refetch()
    setConfirmAction(null)
  }

  const handleBlock = async () => {
    if (!blockReason.trim()) return
    await blockRider.mutateAsync({ id: id!, reason: blockReason })
    toast.success('Rider blocked')
    setBlockDialog(false)
    setBlockReason('')
    refetch()
  }

  const handleUnblock = async () => {
    await unblockRider.mutateAsync({ id: id! })
    toast.success('Rider unblocked')
    refetch()
    setConfirmAction(null)
  }

  if (isLoading) return <LoadingScreen message="Loading rider..." />
  if (isError || !rider) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title={user?.name ?? 'Rider Profile'}
        description="Full rider information and management"
        actions={[
          { label: 'Back', onClick: () => navigate('/admin/riders'), icon: ArrowLeft },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Personal Information</span>
            <div className="flex gap-2">
              {user?.isActive !== false ? (
                <Button size="sm" variant="outline" onClick={() => setConfirmAction('suspend')}>
                  <PauseCircle className="h-4 w-4 mr-1" /> Suspend
                </Button>
              ) : (
                <Button size="sm" onClick={() => setConfirmAction('reactivate')}>
                  <PlayCircle className="h-4 w-4 mr-1" /> Reactivate
                </Button>
              )}
              {user?.blockedAt ? (
                <Button size="sm" onClick={() => setConfirmAction('unblock')}>
                  <Unlock className="h-4 w-4 mr-1" /> Unblock
                </Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={() => setBlockDialog(true)}>
                  <Ban className="h-4 w-4 mr-1" /> Block
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => navigate('/admin/support')}>
                <MessageSquare className="h-4 w-4 mr-1" /> Support Chat
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="text-lg">{getInitials(user?.name ?? 'R')}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{user?.name}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                {user?.blockedAt ? (
                  <Badge variant="destructive">Blocked</Badge>
                ) : (
                  <Badge variant={user?.isActive ? 'success' : 'secondary'}>{user?.isActive ? 'Active' : 'Suspended'}</Badge>
                )}
                <span className="text-xs text-muted-foreground">Joined {formatDate(user?.createdAt ?? rider.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{user?.phone ?? '—'}</p></div>
            <div><p className="text-muted-foreground">Gender</p><p className="font-medium">{user?.gender ?? '—'}</p></div>
            <div><p className="text-muted-foreground">Email Verified</p><p className="font-medium">{user?.emailVerifiedAt ? 'Yes' : 'No'}</p></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ride Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-muted-foreground">Total Rides</p><p className="font-medium text-lg">{stats.total_rides ?? 0}</p></div>
            <div><p className="text-muted-foreground">Completed</p><p className="font-medium text-lg">{stats.completed_rides ?? 0}</p></div>
            <div><p className="text-muted-foreground">Cancelled</p><p className="font-medium text-lg">{stats.cancelled_rides ?? 0}</p></div>
            <div><p className="text-muted-foreground">Total Spent</p><p className="font-medium text-lg">{formatCurrency(stats.total_spent ?? 0)}</p></div>
            <div><p className="text-muted-foreground">Average Rating</p><p className="font-medium text-lg">{(stats.average_rating ?? 0).toFixed(1)} ★</p></div>
          </div>
        </CardContent>
      </Card>

      {wallet && (
        <Card>
          <CardHeader><CardTitle>Wallet</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(wallet.balance)} <span className="text-sm text-muted-foreground">{wallet.currency}</span></p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Complaints ({complaints.length})</CardTitle></CardHeader>
        <CardContent>
          {complaints.length > 0 ? complaints.map((c: any) => (
            <div key={c.id} className="p-3 border rounded-lg mb-2">
              <p className="text-sm">{c.reason}</p>
              <p className="text-xs text-muted-foreground">{formatDate(c.created_at)}{c.ride_id ? <span> — Ride #{c.ride_id}</span> : ''}</p>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">No complaints</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Rides</CardTitle></CardHeader>
        <CardContent>
          {recentRides.length > 0 ? recentRides.map((r: any) => (
            <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg mb-2 cursor-pointer hover:bg-muted/50"
              onClick={() => navigate(`/admin/rides/${r.id}`)}>
              <div>
                <p className="text-sm font-medium">Ride #{r.id}</p>
                <p className="text-xs text-muted-foreground">{r.pickupAddress} → {r.destinationAddress}</p>
              </div>
              <div className="text-right">
                <StatusBadge status={r.status} type="ride" />
                <p className="text-xs text-muted-foreground mt-1">{formatDate(r.createdAt)}</p>
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">No rides yet</p>
          )}
        </CardContent>
      </Card>

      {/* Ban History */}
      {banHistory.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Ban History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {banHistory.map((entry: any) => (
                <div key={entry.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  {entry.action === 'blocked' ? (
                    <Ban className="h-5 w-5 text-red-500 mt-0.5" />
                  ) : (
                    <Unlock className="h-5 w-5 text-green-500 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {entry.action === 'blocked' ? 'Blocked' : 'Unblocked'}
                      {entry.acted_by ? <span className="text-muted-foreground"> by {entry.acted_by.name}</span> : ''}
                    </p>
                    {entry.reason && <p className="text-xs text-muted-foreground">Reason: {entry.reason}</p>}
                    <p className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}
        title={confirmAction === 'suspend' ? 'Suspend Rider' : confirmAction === 'unblock' ? 'Unblock Rider' : 'Reactivate Rider'}
        description={`Are you sure you want to ${confirmAction} this rider?`}
        confirmText={confirmAction ?? ''}
        variant={confirmAction === 'reactivate' || confirmAction === 'unblock' ? 'default' : 'destructive'}
        onConfirm={confirmAction === 'suspend' ? handleSuspend : confirmAction === 'unblock' ? handleUnblock : handleReactivate}
      />

      <Dialog open={blockDialog} onOpenChange={setBlockDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Block Rider</DialogTitle><DialogDescription>Block this rider from using the platform</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <Label>Reason</Label>
            <Input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Describe the reason for blocking" />
            <Button variant="destructive" onClick={handleBlock} disabled={!blockReason.trim()}>Block Rider</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
