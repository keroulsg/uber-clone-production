import { useState, useMemo } from 'react'
import {
  Wallet, Plus, ArrowRight, CreditCard,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { useWallet, useTransactions, useAddFunds } from '@/hooks/usePayments'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingScreen } from '@/components/common/LoadingScreen'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import type { Transaction, Wallet as WalletType } from '@/types'

type TxnFilter = 'all' | 'credits' | 'debits'

export default function RiderWalletPage() {
  const [page, setPage] = useState(1)
  const [txnFilter, setTxnFilter] = useState<TxnFilter>('all')
  const [addFundsOpen, setAddFundsOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')

  const { data: walletData, isLoading: walletLoading, error: walletError, refetch: refetchWallet } = useWallet()
  const { data: txnData, isLoading: txnLoading } = useTransactions({ page, per_page: 10 })
  const addFunds = useAddFunds()

  const wallet = walletData?.data as WalletType | undefined
  const txnResponse = txnData?.data
  const transactions = (txnResponse?.data ?? []) as Transaction[]
  const meta = txnResponse?.meta ?? { currentPage: 1, lastPage: 1, total: 0, from: 0, to: 0 }

  const filteredTxns = useMemo(() => {
    switch (txnFilter) {
      case 'credits':
        return transactions.filter((t) => t.type === 'credit')
      case 'debits':
        return transactions.filter((t) => t.type === 'debit')
      default:
        return transactions
    }
  }, [transactions, txnFilter])

  const handleAddFunds = () => {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) return
    addFunds.mutate(amt, {
      onSuccess: () => {
        setAddFundsOpen(false)
        setAmount('')
      },
    })
  }

  if (walletLoading) return <LoadingScreen />
  if (walletError) return <ErrorState onRetry={() => refetchWallet()} />

  return (
    <div className="space-y-6">
      <PageHeader title="Wallet" description="Manage your wallet balance and transactions" />

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Wallet Balance</p>
              <p className="text-4xl font-bold">{formatCurrency(wallet?.balance ?? 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {wallet?.currency ?? 'USD'}
              </p>
            </div>
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </div>
          <Button
            className="mt-4 gap-2"
            onClick={() => setAddFundsOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Funds
          </Button>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={txnFilter}
            onValueChange={(v) => { setTxnFilter(v as TxnFilter); setPage(1) }}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="credits">Credits</TabsTrigger>
              <TabsTrigger value="debits">Debits</TabsTrigger>
            </TabsList>
            <TabsContent value={txnFilter}>
              {txnLoading ? (
                <LoadingScreen fullScreen={false} />
              ) : filteredTxns.length === 0 ? (
                <EmptyState title="No transactions" description="Your transactions will appear here" />
              ) : (
                <div className="space-y-3">
                  {filteredTxns.map((txn: Transaction) => (
                    <div
                      key={txn.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          txn.type === 'credit'
                            ? 'bg-emerald-100 dark:bg-emerald-900/50'
                            : 'bg-red-100 dark:bg-red-900/50'
                        }`}>
                          {txn.type === 'credit' ? (
                            <ArrowRight className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <ArrowRight className="h-5 w-5 text-red-600 dark:text-red-400 rotate-180" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{txn.description || 'Transaction'}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(txn.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          txn.type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {txn.type === 'credit' ? '+' : '-'}{formatCurrency(txn.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Balance: {formatCurrency(txn.balanceAfter)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Pagination */}
          {meta && meta.lastPage > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {meta.from} to {meta.to} of {meta.total}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= meta.lastPage}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Funds Dialog */}
      <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds</DialogTitle>
            <DialogDescription>Enter the amount you want to add to your wallet</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Credit / Debit Card</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="apple_pay">Apple Pay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddFundsOpen(false)}>Cancel</Button>
            <Button onClick={handleAddFunds} disabled={!amount || addFunds.isPending}>
              {addFunds.isPending ? 'Processing...' : `Add ${formatCurrency(parseFloat(amount || '0'))}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
