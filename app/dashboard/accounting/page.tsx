'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Search, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { exportToExcel, exportToXLSX, exportToDocx, printData } from '@/lib/export-utils'

interface Transaction {
  id: string
  type: string
  amount: number
  description: string | null
  category: string
  status: string
  transaction_date: string
  reference_number: string | null
  artist_id: string | null
  artist?: { name: string; stage_name: string | null }
}

export default function AccountingPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('transactions')
      .select('*, artist:artists(id, name, stage_name)')
      .order('transaction_date', { ascending: false })

    if (!error && data) {
      setTransactions(data)
    }
    setIsLoading(false)
  }

  const deleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    const supabase = createClient()
    const { error } = await supabase.from('transactions').delete().eq('id', id)

    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id))
    }
  }

  // Calculate totals
  const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
  const balance = income - expenses

  // Filter transactions based on search
  const filteredTransactions = transactions.filter(t => 
    t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.reference_number?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20'
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20'
      case 'cancelled':
        return 'bg-destructive/10 text-destructive border-destructive/20'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  // Export columns configuration
  const exportColumns = [
    { key: 'transaction_date' as const, label: 'Date' },
    { key: 'description' as const, label: 'Description' },
    { key: 'category' as const, label: 'Category' },
    { key: 'artist_name' as const, label: 'Artist' },
    { key: 'type' as const, label: 'Type' },
    { key: 'status' as const, label: 'Status' },
    { key: 'amount' as const, label: 'Amount' },
  ]

  // Prepare data for export
  const getExportData = () => {
    return filteredTransactions.map(t => ({
      transaction_date: new Date(t.transaction_date).toLocaleDateString(),
      description: t.description || '',
      category: t.category,
      artist_name: t.artist?.stage_name || t.artist?.name || '',
      type: t.type,
      status: t.status,
      amount: `${t.type === 'income' ? '+' : '-'}$${Number(t.amount).toFixed(2)}`,
    }))
  }

  // Export to Excel (CSV)
  const handleExportExcel = () => {
    setIsExporting(true)
    try {
      exportToExcel(getExportData(), `transactions_${new Date().toISOString().split('T')[0]}`, exportColumns)
    } finally {
      setIsExporting(false)
    }
  }

  // Export to XLSX
  const handleExportXLSX = async () => {
    setIsExporting(true)
    try {
      await exportToXLSX(getExportData(), `transactions_${new Date().toISOString().split('T')[0]}`, exportColumns)
    } finally {
      setIsExporting(false)
    }
  }

  // Export to Word (DOCX)
  const handleExportDocx = () => {
    setIsExporting(true)
    try {
      exportToDocx(getExportData(), `transactions_${new Date().toISOString().split('T')[0]}`, '2NoteFireRecord - Transactions Report', exportColumns)
    } finally {
      setIsExporting(false)
    }
  }

  // Print view
  const handlePrint = () => {
    setIsExporting(true)
    try {
      printData(getExportData(), '2NoteFireRecord - Transactions Report', exportColumns)
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounting</h1>
          <p className="text-muted-foreground">Track income, expenses, and financial transactions</p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export
              </Button>
            </DropdownMenuTrigger>
<DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export to Excel (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportXLSX}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export to Excel (XLS)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportDocx}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export to Word (DOC)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print / PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild>
            <Link href="/dashboard/accounting/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Link>
          </Button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Income
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
              <ArrowUpRight className="h-4 w-4 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${income.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3 w-3 text-success" />
              All time earnings
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
              <ArrowDownRight className="h-4 w-4 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">${expenses.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingDown className="mr-1 h-3 w-3 text-destructive" />
              All time spending
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Balance
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
              ${Math.abs(balance).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {balance >= 0 ? 'Profit' : 'Loss'} overall
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <Tabs defaultValue="all" className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>
                  {filteredTransactions.length} transactions
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                  <TabsTrigger value="expense">Expenses</TabsTrigger>
                </TabsList>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="pl-8 w-[200px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {['all', 'income', 'expense'].map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0">
                {filteredTransactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Artist</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions
                        .filter(t => tab === 'all' || t.type === tab)
                        .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {new Date(transaction.transaction_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                  transaction.type === 'income' 
                                    ? 'bg-success/10' 
                                    : 'bg-destructive/10'
                                }`}>
                                  {transaction.type === 'income' ? (
                                    <ArrowUpRight className="h-4 w-4 text-success" />
                                  ) : (
                                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{transaction.description || 'No description'}</p>
                                  {transaction.reference_number && (
                                    <p className="text-xs text-muted-foreground">
                                      Ref: {transaction.reference_number}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="capitalize">{transaction.category}</TableCell>
                            <TableCell>
                              {transaction.artist?.stage_name || transaction.artist?.name || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusColor(transaction.status)}>
                                {transaction.status}
                              </Badge>
                            </TableCell>
                            <TableCell className={`text-right font-medium ${
                              transaction.type === 'income' ? 'text-success' : 'text-destructive'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}${Number(transaction.amount).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => router.push(`/dashboard/accounting/${transaction.id}/edit`)}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => deleteTransaction(transaction.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <DollarSign className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">No transactions yet</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Start tracking your finances by adding a transaction.
                    </p>
                    <Button asChild className="mt-4">
                      <Link href="/dashboard/accounting/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Transaction
                      </Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
            ))}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  )
}
