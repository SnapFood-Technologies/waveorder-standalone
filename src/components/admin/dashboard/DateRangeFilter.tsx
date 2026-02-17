// src/components/admin/dashboard/DateRangeFilter.tsx
'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'

interface DateRange {
  start: Date
  end: Date
}

interface DateRangeFilterProps {
  selectedPeriod: string
  onPeriodChange: (period: string) => void
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
}

export function DateRangeFilter({
  selectedPeriod,
  onPeriodChange,
  dateRange,
  onDateRangeChange
}: DateRangeFilterProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCustomPicker, setShowCustomPicker] = useState(false)

  const predefinedPeriods = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'last_7_days', label: 'Last 7 days' },
    { id: 'last_30_days', label: 'Last 30 days' },
    { id: 'this_month', label: 'This month' },
    { id: 'last_month', label: 'Last month' },
    { id: 'this_year', label: 'This year' },
    { id: 'custom', label: 'Custom range' }
  ]

  const getDateRangeForPeriod = (period: string): DateRange => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (period) {
      case 'today':
        return { start: today, end: now }
      
      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayEnd = new Date(yesterday)
        yesterdayEnd.setHours(23, 59, 59, 999)
        return { start: yesterday, end: yesterdayEnd }
      
      case 'last_7_days':
        const last7Days = new Date(today)
        last7Days.setDate(last7Days.getDate() - 6)
        return { start: last7Days, end: now }
      
      case 'last_30_days':
        const last30Days = new Date(today)
        last30Days.setDate(last30Days.getDate() - 29)
        return { start: last30Days, end: now }
      
      case 'this_month':
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
        return { start: thisMonthStart, end: thisMonthEnd }
      
      case 'last_month':
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
        return { start: lastMonthStart, end: lastMonthEnd }
      
      case 'this_year':
        const thisYearStart = new Date(now.getFullYear(), 0, 1)
        return { start: thisYearStart, end: now }
      
      default:
        return dateRange
    }
  }

  const handlePeriodSelect = (period: string) => {
    onPeriodChange(period)
    
    if (period === 'custom') {
      setShowCustomPicker(true)
    } else {
      setShowCustomPicker(false)
      const newRange = getDateRangeForPeriod(period)
      onDateRangeChange(newRange)
    }
    
    setShowDropdown(false)
  }

  const handleCustomDateChange = () => {
    setShowCustomPicker(false)
  }

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const selectedPeriodLabel = predefinedPeriods.find(p => p.id === selectedPeriod)?.label || 'Custom range'

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-full lg:w-auto flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
        >
        <Calendar className="w-4 h-4 mr-2" />
        {selectedPeriodLabel}
        <ChevronDown className="w-4 h-4 ml-2" />
        </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="py-1">
            {predefinedPeriods.map((period) => (
              <button
                key={period.id}
                onClick={() => handlePeriodSelect(period.id)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                  selectedPeriod === period.id ? 'bg-teal-50 text-teal-700' : 'text-gray-700'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showCustomPicker && (
        <div className="absolute right-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-80">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Custom Date Range</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formatDateForInput(dateRange.start)}
                  onChange={(e) => {
                    const newStart = new Date(e.target.value)
                    onDateRangeChange({ ...dateRange, start: newStart })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={formatDateForInput(dateRange.end)}
                  onChange={(e) => {
                    const newEnd = new Date(e.target.value)
                    newEnd.setHours(23, 59, 59, 999)
                    onDateRangeChange({ ...dateRange, end: newEnd })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCustomPicker(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomDateChange}
                className="px-3 py-1 bg-teal-600 text-white text-sm rounded hover:bg-teal-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}