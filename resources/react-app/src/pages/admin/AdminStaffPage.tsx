import { useState } from 'react'
import { Users, Plus, Shield, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminStaff, useCreateStaff, useUpdateStaff, useToggleStaffActive, useAdminRoles } from '@/hooks/useAdmin'
import { formatDate, getInitials } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { StaffMember } from '@/api/admin'

export default function AdminStaffPage() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [createDialog, setCreateDialog] = useState(false)
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null)
  const [createForm, setCreateForm] = useState({ name: '', email: '', phone: '', password: '', role: '' })
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', role: '' })

  const { data, isLoading, isError, refetch } = useAdminStaff({ page, per_page: perPage })
  const createStaff = useCreateStaff()
  const updateStaff = useUpdateStaff()
  const toggleActive = useToggleStaffActive()
  const { data: rolesData } = useAdminRoles()

  const response = data?.data as any
  const staff: StaffMember[] = response?.data ?? []
  const meta = response?.meta
  const roles = (rolesData?.data as any) ?? []

  const handleCreate = async () => {
    try {
      await createStaff.mutateAsync(createForm)
      toast.success('Staff member created')
      setCreateDialog(false)
      setCreateForm({ name: '', email: '', phone: '', password: '', role: '' })
    } catch { toast.error('Failed to create staff member') }
  }

  const handleUpdate = async () => {
    if (!editStaff) return
    try {
      await updateStaff.mutateAsync({ id: editStaff.id, data: editForm })
      toast.success('Staff member updated')
      setEditStaff(null)
    } catch { toast.error('Failed to update staff member') }
  }

  const handleToggleActive = async (staffMember: StaffMember) => {
    try {
      await toggleActive.mutateAsync(staffMember.id)
      toast.success(staffMember.isActive ? 'Staff member deactivated' : 'Staff member activated')
    } catch { toast.error('Failed to toggle status') }
  }

  const openEditDialog = (staffMember: StaffMember) => {
    setEditForm({ name: staffMember.name, email: staffMember.email, phone: staffMember.phone, role: staffMember.roles[0] ?? '' })
    setEditStaff(staffMember)
  }

  const columns: Column<StaffMember>[] = [
    {
      header: 'Name',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={(row as any).avatarUrl} />
            <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    { header: 'Email', accessor: (row) => row.email },
    { header: 'Phone', accessor: (row) => row.phone ?? '—' },
    {
      header: 'Roles',
      accessor: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roles?.map((role) => (
            <Badge key={role} variant="secondary" className="text-[10px]">
              <Shield className="h-3 w-3 mr-1" />
              {role}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.isActive ? 'success' : 'secondary'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Created At',
      accessor: (row) => formatDate(row.createdAt),
    },
    {
      header: 'Actions',
      accessor: (row) => '',
      cell: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditDialog(row)}>
                <Users className="h-4 w-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleActive(row)}>
                <Shield className="h-4 w-4 mr-2" />
                {row.isActive ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  if (isLoading) return <LoadingScreen message="Loading staff..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Management"
        description="Manage admin staff accounts"
        actions={[
          { label: 'Add Staff', onClick: () => setCreateDialog(true), icon: Plus },
        ]}
      />

      <Card>
        <CardContent className="pt-6">
          <DataTable<StaffMember>
            columns={columns}
            data={staff}
            keyExtractor={(s) => s.id}
            searchable
            searchPlaceholder="Search by name, email..."
            page={page}
            lastPage={meta?.lastPage ?? 1}
            total={meta?.total ?? 0}
            from={meta?.from ?? 0}
            to={meta?.to ?? 0}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={setPerPage}
            onRowClick={(s) => openEditDialog(s)}
          />
        </CardContent>
      </Card>

      {/* Create Staff Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>Create a new staff account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
            </div>
            <div>
              <Label>Password *</Label>
              <Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {roles.map((role: any) => (
                    <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} disabled={!createForm.name || !createForm.email || !createForm.password}>
              Create Staff Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={!!editStaff} onOpenChange={(open) => { if (!open) setEditStaff(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>Update staff details and role</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {roles.map((role: any) => (
                    <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant={editStaff?.isActive ? 'destructive' : 'default'}
                onClick={() => editStaff && handleToggleActive(editStaff)}
                disabled={toggleActive.isPending}
              >
                {editStaff?.isActive ? 'Deactivate Account' : 'Activate Account'}
              </Button>
              <Button onClick={handleUpdate} disabled={updateStaff.isPending}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
