// src/components/admin/settings/InternalExpensesSettings.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Receipt,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

type MovementType = 'EXPENSE' | 'INJECTION'

interface InternalExpense {
  id: string
  type: MovementType
  amount: number
  date: string | null
  category: string
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface Stats {
  totalExpenses: number
  totalInjections: number
  net: number
  totalCount: number
  byCategory: Array<{ category: string; total: number; count: number }>
}

interface InternalExpensesSettingsProps {
  businessId: string
}

const DEFAULT_EXPENSE_CATEGORIES = ['Rent', 'Utilities', 'Supplies', 'Equipment', 'Marketing', 'Salaries', 'Other']
const DEFAULT_INJECTION_CATEGORIES = ['Cash Injection', 'Owner Contribution', 'Bank Transfer', 'Adjustment', 'Other']

function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function InternalExpensesSettings({ businessId }: InternalExpensesSettingsProps) {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(true)
  const [currency, setCurrency] = useState('EUR')
  const [expenses, setExpenses] = useState<InternalExpense[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('') // '' | 'EXPENSE' | 'INJECTION'
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<InternalExpense | null>(null)
  const [deleteModalExpense, setDeleteModalExpense] = useState<InternalExpense | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    type: 'EXPENSE' as MovementType,
    amount: '',
    date: '',
    category: '',
    notes: ''
  })

  const resetForm = () => {
    setForm({
      type: 'EXPENSE',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      notes: ''
    })
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '20')
      if (categoryFilter) params.set('category', categoryFilter)
      if (typeFilter === 'EXPENSE' || typeFilter === 'INJECTION') params.set('type', typeFilter)

      const res = await fetch(`/api/admin/stores/${businessId}/internal-expenses?${params}`)
      const data = await res.json()

      if (!res.ok) {
        if (data.enabled === false) {
          setEnabled(false)
          setLoading(false)
          return
        }
        throw new Error(data.error || data.message || 'Failed to load expenses')
      }

      setEnabled(true)
      setCurrency(data.currency || 'EUR')
      setExpenses(data.data?.expenses || [])
      setStats(data.data?.stats || null)
      setTotalPages(data.data?.pagination?.totalPages || 1)
      setTotal(data.data?.pagination?.total || 0)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load expenses')
      setExpenses([])
    } finally {
      setLoading(false)
    }
  }, [businessId, page, categoryFilter, typeFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddExpense = async () => {
    if (!form.amount || !form.category.trim()) {
      toast.error('Amount and category are required')
      return
    }
    const amountNum = parseFloat(form.amount)
    if (isNaN(amountNum) || amountNum < 0) {
      toast.error('Amount must be a positive number')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/admin/stores/${businessId}/internal-expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          amount: amountNum,
          date: form.date || null,
          category: form.category.trim(),
          notes: form.notes.trim() || null
        })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(form.type === 'INJECTION' ? 'Cash injection added' : 'Expense added')
        setShowAddModal(false)
        resetForm()
        fetchData()
      } else {
        toast.error(data.error || 'Failed to add expense')
      }
    } catch {
      toast.error('Failed to add expense')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateExpense = async () => {
    if (!editingExpense) return
    if (!form.amount || !form.category.trim()) {
      toast.error('Amount and category are required')
      return
    }
    const amountNum = parseFloat(form.amount)
    if (isNaN(amountNum) || amountNum < 0) {
      toast.error('Amount must be a positive number')
      return
    }

    setSaving(true)
    try {
      const res = await fetch(
        `/api/admin/stores/${businessId}/internal-expenses/${editingExpense.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: form.type,
            amount: amountNum,
            date: form.date || null,
            category: form.category.trim(),
            notes: form.notes.trim() || null
          })
        }
      )
      const data = await res.json()
      if (res.ok) {
        toast.success('Expense updated')
        setEditingExpense(null)
        resetForm()
        fetchData()
      } else {
        toast.error(data.error || 'Failed to update expense')
      }
    } catch {
      toast.error('Failed to update expense')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteExpense = async () => {
    if (!deleteModalExpense) return
    setIsDeleting(true)
    try {
      const res = await fetch(
        `/api/admin/stores/${businessId}/internal-expenses/${deleteModalExpense.id}`,
        { method: 'DELETE' }
      )
      const data = await res.json()
      if (res.ok) {
        toast.success('Expense deleted')
        setDeleteModalExpense(null)
        fetchData()
      } else {
        toast.error(data.error || 'Failed to delete expense')
      }
    } catch {
      toast.error('Failed to delete expense')
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditModal = (expense: InternalExpense) => {
    setEditingExpense(expense)
    setForm({
      type: expense.type || 'EXPENSE',
      amount: expense.amount.toString(),
      date: expense.date ? expense.date.split('T')[0] : '',
      category: expense.category,
      notes: expense.notes || ''
    })
  }

  const openAddModal = () => {
    resetForm()
    setForm((f) => ({ ...f, date: new Date().toISOString().split('T')[0] }))
    setShowAddModal(true)
  }

  if (!enabled) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cash Movements</h1>
          <p className="text-gray-600 mt-1">Track expenses and cash injections (rent, utilities, owner contributions, etc.)</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800 mb-2">Feature Not Enabled</h3>
              <p className="text-amber-700">
                Internal Expenses is not enabled for your business. Please contact support to enable this feature.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cash Movements</h1>
          <p className="text-gray-600 mt-1">
            Track expenses and cash injections with amount, date, category, and notes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2 text-gray-600 hover:text-teal-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Receipt className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalExpenses, currency)}
                </p>
                <p className="text-sm text-gray-500">Total Expenses</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Receipt className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalInjections, currency)}
                </p>
                <p className="text-sm text-gray-500">Total Injections</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Receipt className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${stats.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.net, currency)}
                </p>
                <p className="text-sm text-gray-500">Net</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Receipt className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCount}</p>
                <p className="text-sm text-gray-500">Entries</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
          >
            <option value="">All</option>
            <option value="EXPENSE">Expenses only</option>
            <option value="INJECTION">Injections only</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(1)
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
          >
            <option value="">All</option>
            {stats?.byCategory.map((c) => (
              <option key={c.category} value={c.category}>
                {c.category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            <span className="ml-2 text-gray-600">Loading expenses...</span>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cash movements yet</h3>
            <p className="text-gray-600 mb-4">
              Add your first expense or cash injection to start tracking.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            (exp.type || 'EXPENSE') === 'INJECTION'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {(exp.type || 'EXPENSE') === 'INJECTION' ? 'Injection' : 'Expense'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(exp.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {exp.category}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                          (exp.type || 'EXPENSE') === 'INJECTION' ? 'text-green-600' : 'text-gray-900'
                        }`}
                      >
                        {(exp.type || 'EXPENSE') === 'INJECTION' ? '+' : ''}
                        {formatCurrency(exp.amount, currency)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">
                        {exp.notes || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(exp)}
                            className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModalExpense(exp)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing page {page} of {totalPages} ({total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4 inline" />
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 inline" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Cash Movement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      type: e.target.value as MovementType,
                      category: e.target.value === 'INJECTION' ? '' : f.category
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                >
                  <option value="EXPENSE">Expense (money out)</option>
                  <option value="INJECTION">Injection (money in)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date (optional)</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  placeholder={
                    form.type === 'INJECTION' ? 'e.g. Cash Injection' : 'e.g. Rent, Utilities'
                  }
                  list={form.type === 'INJECTION' ? 'injection-categories' : 'expense-categories'}
                />
                <datalist id="expense-categories">
                  {DEFAULT_EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <datalist id="injection-categories">
                  {DEFAULT_INJECTION_CATEGORIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleAddExpense}
                disabled={saving}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Cash Movement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value as MovementType }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                >
                  <option value="EXPENSE">Expense (money out)</option>
                  <option value="INJECTION">Injection (money in)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date (optional)</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  list={form.type === 'INJECTION' ? 'injection-categories-edit' : 'expense-categories-edit'}
                />
                <datalist id="expense-categories-edit">
                  {DEFAULT_EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <datalist id="injection-categories-edit">
                  {DEFAULT_INJECTION_CATEGORIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setEditingExpense(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateExpense}
                disabled={saving}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Expense</h3>
                <p className="text-sm text-gray-500 mt-1">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this {deleteModalExpense.type === 'INJECTION' ? 'injection' : 'expense'}? (
              {formatCurrency(deleteModalExpense.amount, currency)} - {deleteModalExpense.category})
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModalExpense(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteExpense}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
