import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle, XCircle, PauseCircle, PlayCircle,
  AlertTriangle, DollarSign, Shield, MessageSquare, Eye, Ban, Unlock,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useDriverDetail,
  useApproveDriver, useRejectDriver, useSuspendDriver, useReactivateDriver,
  useAddDriverWarning, useAddDriverPenalty,
  useBlockDriver, useUnblockDriver, useBanHistory,
} from '@/hooks/useAdmin'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Driver, Payment } from '@/types'

export default function AdminDriverProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, isError, refetch } = useDriverDetail(id!)
  const approveDriver = useApproveDriver()
  const rejectDriver = useRejectDriver()
  const suspendDriver = useSuspendDriver()
  const reactivateDriver = useReactivateDriver()
  const addWarning = useAddDriverWarning()
  const addPenalty = useAddDriverPenalty()
  const blockDriver = useBlockDriver()
  const unblockDriver = useUnblockDriver()

  const [confirmAction, setConfirmAction] = useState<string | null>(null)
  const [warningDialog, setWarningDialog] = useState(false)
  const [penaltyDialog, setPenaltyDialog] = useState(false)
  const [blockDialog, setBlockDialog] = useState(false)
  const [blockReason, setBlockReason] = useState('')
  const [warningReason, setWarningReason] = useState('')
  const [penaltyReason, setPenaltyReason] = useState('')
  const [penaltyAmount, setPenaltyAmount] = useState('')

  const result = data?.data as any
  const driver: Driver | null = result?.driver ?? null
  const performance = result?.performance ?? {}
  const totalDebt = result?.total_debt ?? 0
  const complaints = result?.complaints ?? []
  const recentRides = result?.recent_rides ?? []

  const { data: banHistoryData } = useBanHistory(driver?.user?.id ?? '')
  const banHistory = (banHistoryData as any)?.data?.history ?? []

  const handleApprove = async () => {
    if (!driver) return
    await approveDriver.mutateAsync(driver.id)
    toast.success('Driver approved')
    refetch()
    setConfirmAction(null)
  }
  const handleReject = async () => {
    if (!driver) return
    await rejectDriver.mutateAsync({ id: driver.id, reason: 'Rejected by admin' })
    toast.success('Driver rejected')
    refetch()
    setConfirmAction(null)
  }
  const handleSuspend = async () => {
    if (!driver) return
    await suspendDriver.mutateAsync(driver.id)
    toast.success('Driver suspended')
    refetch()
    setConfirmAction(null)
  }
  const handleReactivate = async () => {
    if (!driver) return
    await reactivateDriver.mutateAsync(driver.id)
    toast.success('Driver reactivated')
    refetch()
    setConfirmAction(null)
  }
  const handleAddWarning = async () => {
    if (!driver || !warningReason.trim()) return
    await addWarning.mutateAsync({ id: driver.id, data: { reason: warningReason } })
    toast.success('Warning added')
    setWarningDialog(false)
    setWarningReason('')
    refetch()
  }
  const handleAddPenalty = async () => {
    if (!driver || !penaltyReason.trim() || !penaltyAmount) return
    await addPenalty.mutateAsync({ id: driver.id, data: { reason: penaltyReason, amount: parseFloat(penaltyAmount) } })
    toast.success('Penalty added')
    setPenaltyDialog(false)
    setPenaltyReason('')
    setPenaltyAmount('')
    refetch()
  }

  const handleBlock = async () => {
    if (!driver || !blockReason.trim()) return
    await blockDriver.mutateAsync({ id: driver.id, reason: blockReason })
    toast.success('Driver blocked')
    setBlockDialog(false)
    setBlockReason('')
    refetch()
    setConfirmAction(null)
  }

  const handleUnblock = async () => {
    if (!driver) return
    await unblockDriver.mutateAsync({ id: driver.id })
    toast.success('Driver unblocked')
    refetch()
    setConfirmAction(null)
  }

  if (isLoading) return <LoadingScreen message="Loading driver..." />
  if (isError || !driver) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title={driver.user?.name ?? 'Driver Profile'}
        description="Full driver information and management"
        actions={[
          { label: 'Back', onClick: () => navigate('/admin/drivers'), icon: ArrowLeft },
        ]}
      />

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Personal Information</span>
            <div className="flex gap-2">
              {driver.status === 'pending' && (
                <>
                  <Button size="sm" onClick={() => setConfirmAction('approve')}><CheckCircle className="h-4 w-4 mr-1" /> Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => setConfirmAction('reject')}><XCircle className="h-4 w-4 mr-1" /> Reject</Button>
                </>
              )}
              {driver.status === 'approved' && (
                <Button size="sm" variant="outline" onClick={() => setConfirmAction('suspend')}><PauseCircle className="h-4 w-4 mr-1" /> Suspend</Button>
              )}
              {driver.status === 'suspended' && (
                <Button size="sm" onClick={() => setConfirmAction('reactivate')}><PlayCircle className="h-4 w-4 mr-1" /> Reactivate</Button>
              )}
              {driver.user?.blockedAt ? (
                <Button size="sm" onClick={() => setConfirmAction('unblock')}><Unlock className="h-4 w-4 mr-1" /> Unblock</Button>
              ) : (
                <Button size="sm" variant="destructive" onClick={() => setBlockDialog(true)}><Ban className="h-4 w-4 mr-1" /> Block</Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={driver.user?.avatarUrl} />
              <AvatarFallback className="text-lg">{getInitials(driver.user?.name ?? 'D')}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{driver.user?.name}</h3>
              <p className="text-sm text-muted-foreground">{driver.user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={driver.status} type="driver" />
                {driver.user?.blockedAt ? (
                  <Badge variant="destructive">Blocked</Badge>
                ) : null}
                <Badge variant={driver.isOnline ? 'success' : 'secondary'}>{driver.isOnline ? 'Online' : 'Offline'}</Badge>
                <span className="text-xs text-muted-foreground">Joined {formatDate(driver.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><p className="text-muted-foreground">Phone</p><p className="font-medium">{driver.user?.phone ?? '—'}</p></div>
            <div><p className="text-muted-foreground">Gender</p><p className="font-medium">{driver.user?.gender ?? '—'}</p></div>
            <div><p className="text-muted-foreground">Address</p><p className="font-medium">{(driver as any).address ?? '—'}</p></div>
            <div><p className="text-muted-foreground">License</p><p className="font-medium">{driver.licenseNumber ?? '—'}</p></div>
            <div><p className="text-muted-foreground">Rating</p><p className="font-medium">{driver.averageRating.toFixed(1)} ★</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle */}
      {driver.vehicle && (
        <Card>
          <CardHeader><CardTitle>Vehicle</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p className="text-muted-foreground">Make/Model</p><p className="font-medium">{driver.vehicle.make} {driver.vehicle.model}</p></div>
              <div><p className="text-muted-foreground">Year</p><p className="font-medium">{driver.vehicle.year}</p></div>
              <div><p className="text-muted-foreground">License Plate</p><p className="font-medium">{driver.vehicle.licensePlate}</p></div>
              <div><p className="text-muted-foreground">Class</p><p className="font-medium">{driver.vehicle.vehicleType?.name ?? '—'}</p></div>
              <div><p className="text-muted-foreground">Color</p><p className="font-medium">{driver.vehicle.color}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      <Card>
        <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              { label: 'National ID Front', url: driver.identityFrontImage },
              { label: 'National ID Back', url: driver.identityBackImage },
              { label: 'License Front', url: driver.licenseFrontImage },
              { label: 'License Back', url: driver.licenseBackImage },
              { label: 'Criminal Record', url: driver.criminalRecord },
            ].map((doc) => (
              <div key={doc.label}>
                <p className="text-muted-foreground">{doc.label}</p>
                {doc.url ? (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" /> View
                  </a>
                ) : (
                  <p className="text-muted-foreground italic">Not uploaded</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance */}
      <Card>
        <CardHeader><CardTitle>Performance</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-muted-foreground">Total Rides</p><p className="font-medium text-lg">{performance.total_rides ?? 0}</p></div>
            <div><p className="text-muted-foreground">Completed</p><p className="font-medium text-lg">{performance.completed_rides ?? 0}</p></div>
            <div><p className="text-muted-foreground">Cancelled</p><p className="font-medium text-lg">{performance.cancelled_rides ?? 0}</p></div>
            <div><p className="text-muted-foreground">Completion Rate</p><p className="font-medium text-lg">{performance.completion_rate ?? 0}%</p></div>
            <div><p className="text-muted-foreground">Rating</p><p className="font-medium text-lg">{(performance.average_rating ?? 0).toFixed(1)} ★</p></div>
            <div><p className="text-muted-foreground">Earnings</p><p className="font-medium text-lg">{formatCurrency(performance.total_earnings ?? 0)}</p></div>
            <div><p className="text-muted-foreground">Debt</p><p className="font-medium text-lg text-amber-600">{formatCurrency(totalDebt)}</p></div>
            <div><p className="text-muted-foreground">Warnings</p><p className="font-medium text-lg">{(driver as any).warnings?.length ?? 0}</p></div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings and Penalties */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Warnings & Penalties</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setWarningDialog(true)}>
                <AlertTriangle className="h-4 w-4 mr-1" /> Add Warning
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPenaltyDialog(true)}>
                <DollarSign className="h-4 w-4 mr-1" /> Add Penalty
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(driver as any).warnings?.length > 0 ? (
              (driver as any).warnings.map((w: any) => (
                <div key={w.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{w.reason}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(w.created_at)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No warnings</p>
            )}
            {(driver as any).penalties?.length > 0 && (
              <>
                <h4 className="font-medium mt-4">Penalties</h4>
                {(driver as any).penalties.map((p: any) => (
                  <div key={p.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <DollarSign className="h-5 w-5 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{p.reason}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(p.amount)} - {formatDate(p.created_at)}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Complaints */}
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

      {/* Recent Rides */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Rides</span>
            <Button size="sm" variant="outline" onClick={() => navigate(`/admin/rides`)}>View All</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentRides.length > 0 ? (
            <div className="space-y-2">
              {recentRides.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
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
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No rides yet</p>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}
        title={`${confirmAction === 'approve' ? 'Approve' : confirmAction === 'reject' ? 'Reject' : confirmAction === 'suspend' ? 'Suspend' : confirmAction === 'unblock' ? 'Unblock' : 'Reactivate'} Driver`}
        description={`Are you sure you want to ${confirmAction} this driver?`}
        confirmText={confirmAction ?? ''} variant={confirmAction === 'approve' || confirmAction === 'reactivate' || confirmAction === 'unblock' ? 'default' : 'destructive'}
        onConfirm={confirmAction === 'approve' ? handleApprove : confirmAction === 'reject' ? handleReject : confirmAction === 'suspend' ? handleSuspend : confirmAction === 'unblock' ? handleUnblock : handleReactivate}
      />

      <Dialog open={warningDialog} onOpenChange={setWarningDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Warning</DialogTitle><DialogDescription>Issue a warning to this driver</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <Label>Reason</Label>
            <Input value={warningReason} onChange={(e) => setWarningReason(e.target.value)} placeholder="Describe the reason for warning" />
            <Button onClick={handleAddWarning} disabled={!warningReason.trim()}>Add Warning</Button>
          </div>
        </DialogContent>
      </Dialog>

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

      <Dialog open={blockDialog} onOpenChange={setBlockDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Block Driver</DialogTitle><DialogDescription>Block this driver from using the platform</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <Label>Reason</Label>
            <Input value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Describe the reason for blocking" />
            <Button variant="destructive" onClick={handleBlock} disabled={!blockReason.trim()}>Block Driver</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={penaltyDialog} onOpenChange={setPenaltyDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Penalty</DialogTitle><DialogDescription>Issue a financial penalty to this driver</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><Label>Reason</Label><Input value={penaltyReason} onChange={(e) => setPenaltyReason(e.target.value)} placeholder="Describe the reason" /></div>
            <div><Label>Amount</Label><Input type="number" value={penaltyAmount} onChange={(e) => setPenaltyAmount(e.target.value)} placeholder="0.00" /></div>
            <Button onClick={handleAddPenalty} disabled={!penaltyReason.trim() || !penaltyAmount}>Add Penalty</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
