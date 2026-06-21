import { useState } from 'react'
import { Shield, Lock, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAdminRoles, useAdminPermissions, useUpdateRolePermissions } from '@/hooks/useAdmin'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import type { Role } from '@/api/admin'

export default function AdminRolesPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [pendingPermissions, setPendingPermissions] = useState<string[]>([])

  const { data, isLoading, isError, refetch } = useAdminRoles()
  const { data: permissionsData } = useAdminPermissions()
  const updatePermissions = useUpdateRolePermissions()

  const roles: Role[] = (data?.data as any) ?? []
  const allPermissions: string[] = (permissionsData?.data as any) ?? []

  const openRoleDialog = (role: Role) => {
    setSelectedRole(role)
    setPendingPermissions([...role.permissions])
  }

  const togglePermission = (perm: string) => {
    setPendingPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  const handleSavePermissions = async () => {
    if (!selectedRole) return
    try {
      await updatePermissions.mutateAsync({ id: selectedRole.id, permissions: pendingPermissions })
      toast.success('Permissions updated')
      setSelectedRole(null)
    } catch { toast.error('Failed to update permissions') }
  }

  const isSuperAdmin = (role: Role) => role.name === 'super-admin'

  if (isLoading) return <LoadingScreen message="Loading roles..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & Permissions"
        description="Manage roles and their assigned permissions"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card
            key={role.id}
            className="cursor-pointer transition-colors hover:border-primary/50"
            onClick={() => openRoleDialog(role)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-primary" />
                {role.name}
                {isSuperAdmin(role) && (
                  <Lock className="h-4 w-4 text-muted-foreground ml-auto" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.slice(0, 6).map((perm) => (
                  <Badge key={perm} variant="secondary" className="text-[10px]">
                    {perm}
                  </Badge>
                ))}
                {role.permissions.length > 6 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{role.permissions.length - 6} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permissions Dialog */}
      <Dialog open={!!selectedRole} onOpenChange={(open) => { if (!open) setSelectedRole(null) }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {selectedRole?.name}
              {selectedRole && isSuperAdmin(selectedRole) && (
                <Badge variant="secondary" className="ml-2 gap-1">
                  <Lock className="h-3 w-3" />
                  Read Only
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedRole && isSuperAdmin(selectedRole)
                ? 'Super-admin permissions are predefined and cannot be modified.'
                : 'Toggle permissions to assign or remove them from this role.'}
            </DialogDescription>
          </DialogHeader>

          {allPermissions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No permissions available</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allPermissions.map((perm) => {
                const isChecked = pendingPermissions.includes(perm)
                const disabled = selectedRole ? isSuperAdmin(selectedRole) : false
                return (
                  <div
                    key={perm}
                    className="flex items-center justify-between p-3 rounded-lg border text-sm"
                  >
                    <Label className="flex-1 cursor-pointer font-normal" htmlFor={`perm-${perm}`}>
                      {perm}
                    </Label>
                    <div className="flex items-center gap-2">
                      {disabled ? (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Switch
                          id={`perm-${perm}`}
                          checked={isChecked}
                          onCheckedChange={() => togglePermission(perm)}
                        />
                      )}
                      {isChecked ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {selectedRole && !isSuperAdmin(selectedRole) && (
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setSelectedRole(null)}>Cancel</Button>
              <Button onClick={handleSavePermissions} disabled={updatePermissions.isPending}>
                Save Permissions
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
