import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { useAdminRiders } from '@/hooks/useAdmin'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { DataTable, type Column } from '@/components/common/DataTable'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'

interface RiderRow {
  id: string
  user: { id: string; name: string; email: string; phone?: string; avatarUrl?: string }
  totalRides: number
  totalSpent: number
  averageRating: number
  createdAt: string
}

export default function AdminRidersPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)

  const { data, isLoading, isError, refetch } = useAdminRiders({
    page,
    per_page: perPage,
  })

  const response = data?.data as any
  const riders: RiderRow[] = response?.data ?? []
  const meta = response?.meta

  const columns: Column<RiderRow>[] = [
    {
      header: 'Name',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.user?.avatarUrl} />
            <AvatarFallback>{getInitials(row.user?.name ?? 'U')}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{row.user?.name ?? 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">{row.user?.email ?? '—'}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    { header: 'Email', accessor: (row) => row.user?.email ?? '—' },
    { header: 'Phone', accessor: (row) => row.user?.phone ?? '—' },
    {
      header: 'Total Rides',
      accessor: (row) => row.totalRides ?? 0,
      sortable: true,
    },
    {
      header: 'Total Spent',
      accessor: (row) => formatCurrency(row.totalSpent ?? 0),
      sortable: true,
    },
    {
      header: 'Rating',
      accessor: (row) => (row.averageRating ?? 0).toFixed(1),
    },
    {
      header: 'Joined',
      accessor: (row) => formatDate(row.createdAt),
      sortable: true,
    },
    {
      header: 'Actions',
      accessor: (row) => '',
      cell: (row) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => navigate(`/admin/riders/${row.id}`)} className="p-2 hover:bg-muted rounded-md">
            <Eye className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  if (isLoading) return <LoadingScreen message="Loading riders..." />
  if (isError) return <ErrorState onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader title="Riders" description="Manage rider accounts" />

      <Card>
        <CardContent className="pt-6">
          <DataTable<RiderRow>
            columns={columns}
            data={riders}
            keyExtractor={(r) => r.id}
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
            onRowClick={(r) => navigate(`/admin/riders/${r.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
