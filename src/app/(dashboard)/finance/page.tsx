'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Transaction, TransactionInsert, TransactionType } from '@/types/database'

const EXPENSE_CATEGORIES = [
  { id: 'food', label: '🍔 Food', color: '#F59E0B' },
  { id: 'housing', label: '🏠 Housing', color: '#3B82F6' },
  { id: 'transport', label: '🚗 Transport', color: '#8B5CF6' },
  { id: 'entertainment', label: '🎮 Entertainment', color: '#EC4899' },
  { id: 'health', label: '💊 Health', color: '#10B981' },
  { id: 'subscriptions', label: '📱 Subscriptions', color: '#6366F1' },
  { id: 'shopping', label: '🛍️ Shopping', color: '#F97316' },
  { id: 'other', label: '📦 Other', color: '#6B7280' },
]

const INCOME_CATEGORIES = [
  { id: 'salary', label: '💼 Salary', color: '#10B981' },
  { id: 'freelance', label: '💻 Freelance', color: '#3B82F6' },
  { id: 'investments', label: '📈 Investments', color: '#8B5CF6' },
  { id: 'other', label: '📦 Other', color: '#6B7280' },
]

type FilterType = 'all' | 'income' | 'expense'

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [aiInsights, setAiInsights] = useState<{
    spending_analysis: string
    recommendations: string[]
    savings_forecast: string
  } | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
    
    if (error) {
      console.error('Error fetching transactions:', error)
    }
    
    setTransactions((data as Transaction[]) || [])
    setLoading(false)
  }

  async function createTransaction(transaction: Omit<TransactionInsert, 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('transactions')
      .insert({ ...transaction, user_id: user.id } as never)

    if (!error) {
      fetchTransactions()
      setShowForm(false)
    }
  }

  async function updateTransaction(id: string, updates: Partial<Transaction>) {
    const { error } = await supabase
      .from('transactions')
      .update(updates as never)
      .eq('id', id)

    if (!error) {
      fetchTransactions()
      setEditingTransaction(null)
    }
  }

  async function deleteTransaction(id: string) {
    if (!confirm('Delete this transaction?')) return

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (!error) {
      fetchTransactions()
    }
  }

  async function getAIInsights() {
    if (transactions.length === 0) return
    setLoadingInsights(true)
    
    try {
      const res = await fetch('/api/ai/finance-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions }),
      })
      
      if (res.ok) {
        const data = await res.json()
        setAiInsights(data)
      }
    } catch (error) {
      console.error('AI insights failed:', error)
    } finally {
      setLoadingInsights(false)
    }
  }

  // Calculate summary stats
  const summary = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyTransactions = transactions.filter(t => {
      const date = new Date(t.date)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const monthlyIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const monthlyExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const savingsRate = monthlyIncome > 0 
      ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) 
      : 0

    return {
      balance: totalIncome - totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      savingsRate: Math.max(0, savingsRate),
    }
  }, [transactions])

  // Calculate expense breakdown by category
  const expensesByCategory = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyExpenses = transactions.filter(t => {
      const date = new Date(t.date)
      return t.type === 'expense' && 
        date.getMonth() === currentMonth && 
        date.getFullYear() === currentYear
    })

    const byCategory: Record<string, number> = {}
    monthlyExpenses.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + Number(t.amount)
    })

    const total = Object.values(byCategory).reduce((sum, val) => sum + val, 0)

    return EXPENSE_CATEGORIES
      .filter(cat => byCategory[cat.id])
      .map(cat => ({
        ...cat,
        amount: byCategory[cat.id],
        percentage: total > 0 ? Math.round((byCategory[cat.id] / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
  }, [transactions])

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions
    return transactions.filter(t => t.type === filter)
  }, [transactions, filter])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-gray-500 dark:text-gray-400 flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white space-y-6 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">💰 Finance</h1>
          <p className="text-gray-500 dark:text-gray-400">Track your income and expenses</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Balance"
          value={`$${summary.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          gradient="from-blue-500 to-purple-600"
          icon="💵"
        />
        <SummaryCard
          title="Income (this month)"
          value={`$${summary.monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          gradient="from-green-500 to-emerald-600"
          icon="📈"
        />
        <SummaryCard
          title="Expenses (this month)"
          value={`$${summary.monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          gradient="from-red-500 to-pink-600"
          icon="📉"
        />
        <SummaryCard
          title="Savings Rate"
          value={`${summary.savingsRate}%`}
          gradient="from-yellow-500 to-orange-600"
          icon="🎯"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chart + AI Insights */}
        <div className="lg:col-span-1 space-y-6">
          {/* Expense Breakdown Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">📊 Expense Breakdown</h3>
            {expensesByCategory.length > 0 ? (
              <div className="space-y-3">
                {expensesByCategory.map(cat => (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{cat.label}</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${cat.amount.toLocaleString()} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
                No expenses this month
              </p>
            )}
          </div>

          {/* AI Insights Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">🤖 AI Insights</h3>
              <button
                onClick={getAIInsights}
                disabled={loadingInsights || transactions.length === 0}
                className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingInsights ? '⏳ Analyzing...' : '✨ Get Insights'}
              </button>
            </div>
            
            {aiInsights ? (
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">📊 Analysis</h4>
                  <p className="text-gray-600 dark:text-gray-400">{aiInsights.spending_analysis}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">💡 Recommendations</h4>
                  <ul className="space-y-1">
                    {aiInsights.recommendations.map((rec, i) => (
                      <li key={i} className="text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="text-green-500">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-1">🔮 Forecast</h4>
                  <p className="text-gray-600 dark:text-gray-400">{aiInsights.savings_forecast}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                Click "Get Insights" to analyze your spending patterns
              </p>
            )}
          </div>
        </div>

        {/* Right: Transactions List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mr-4">📋 Transactions</h3>
              <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {(['all', 'income', 'expense'] as FilterType[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${
                      filter === f
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Transactions List */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.slice(0, 20).map(transaction => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    onEdit={() => setEditingTransaction(transaction)}
                    onDelete={() => deleteTransaction(transaction.id)}
                  />
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-2">💰</div>
                  <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Transaction
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Form Modal */}
      {(showForm || editingTransaction) && (
        <TransactionForm
          transaction={editingTransaction}
          onSubmit={(data) => {
            if (editingTransaction) {
              updateTransaction(editingTransaction.id, data)
            } else {
              createTransaction(data)
            }
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingTransaction(null)
          }}
        />
      )}
    </div>
  )
}

function SummaryCard({
  title,
  value,
  gradient,
  icon,
}: {
  title: string
  value: string
  gradient: string
  icon: string
}) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-4 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/80 text-sm">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-xl md:text-2xl font-bold">{value}</div>
    </div>
  )
}

function TransactionRow({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction
  onEdit: () => void
  onDelete: () => void
}) {
  const categories = transaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const category = categories.find(c => c.id === transaction.category)
  const isIncome = transaction.type === 'income'

  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{ backgroundColor: `${category?.color}20` }}
        >
          {category?.label.split(' ')[0] || '💵'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 dark:text-white">
              {category?.label.split(' ').slice(1).join(' ') || transaction.category}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${category?.color}20`, color: category?.color }}
            >
              {transaction.type}
            </span>
          </div>
          {transaction.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.description}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {new Date(transaction.date).toLocaleDateString()}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <span className={`font-semibold ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isIncome ? '+' : '-'}${Number(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

function TransactionForm({
  transaction,
  onSubmit,
  onCancel,
}: {
  transaction: Transaction | null
  onSubmit: (data: Omit<TransactionInsert, 'user_id'>) => void
  onCancel: () => void
}) {
  const [type, setType] = useState<TransactionType>(transaction?.type || 'expense')
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '')
  const [category, setCategory] = useState(transaction?.category || '')
  const [description, setDescription] = useState(transaction?.description || '')
  const [date, setDate] = useState(transaction?.date || new Date().toISOString().split('T')[0])
  const [categorizing, setCategorizing] = useState(false)

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  // Reset category when type changes (unless editing)
  useEffect(() => {
    if (!transaction) {
      setCategory('')
    }
  }, [type, transaction])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      type,
      amount: parseFloat(amount),
      category,
      description: description || null,
      date,
    })
  }

  const autoCategorize = async () => {
    if (!description.trim()) return
    setCategorizing(true)
    
    try {
      const res = await fetch('/api/ai/categorize-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, type }),
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.category) {
          setCategory(data.category)
        }
      }
    } catch (error) {
      console.error('Auto-categorize failed:', error)
    } finally {
      setCategorizing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-start md:items-center justify-center z-50 overflow-y-auto py-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6 my-auto border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {transaction ? 'Edit Transaction' : 'New Transaction'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  type === 'income'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                📈 Income
              </button>
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  type === 'expense'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                📉 Expense
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">$</span>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white cursor-pointer"
            >
              <option value="">Select category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="e.g., Grocery shopping at Walmart"
              />
              <button
                type="button"
                onClick={autoCategorize}
                disabled={categorizing || !description.trim()}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                title="Auto-categorize with AI"
              >
                {categorizing ? '⏳' : '🤖'}
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {transaction ? 'Save' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
